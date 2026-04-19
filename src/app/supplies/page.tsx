'use client'

import { DataCard, EmptyState, FilterBar, FilterItem, InteractionRailLayout, PageHeader, PageHelpCard, Pagination, StatCard, Tag, WorkflowOverviewCard, type TagVariant } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { getSupplyAiInsights, getSupplyAiNarratives } from '@/lib/mock/admin-ai'
import { sortSuppliesByPriority } from '@/lib/resource-operations-priority'
import { activateAdminSupply, fetchAdminSupplies, type AdminSupplyRecord } from '@/lib/services/admin-operations-services'
import { AlertTriangle, Bot, ChevronRight, Package, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

const STATUS_TAG: Record<string, TagVariant> = { '库存不足': 'danger', '正常': 'success', '待上架': 'warning' }
const CAT_TAG: Record<string, TagVariant> = { '护理用品': 'primary', '防护用品': 'warning', '消毒用品': 'info', '医疗用品': 'purple' }

export default function SuppliesPage() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('selected')
  const fromNew = searchParams.get('entry') === 'supplies-new'
  const [supplies, setSupplies] = useState<AdminSupplyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    let active = true

    fetchAdminSupplies({ page: 1, pageSize: 200 })
      .then(response => {
        if (active) {
          setSupplies(response.items)
          setError('')
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : '物资列表查询失败。')
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const selectedSupply = useMemo(
    () => supplies.find(item => item.id === preselectedId) ?? null,
    [preselectedId, supplies],
  )
  const aiInsights = getSupplyAiInsights(supplies)
  const aiNarratives = getSupplyAiNarratives(supplies)
  const helpHref = '/supplies/help'
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'supplies-list',
    entityId: 'supply-board',
    entityName: '物资管理',
    focus,
    target,
  })

  async function handleActivate(supplyId: string) {
    setSubmittingId(supplyId)
    try {
      const updated = await activateAdminSupply(supplyId)
      setSupplies(current => current.map(item => item.id === updated.id ? updated : item))
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '物资上架确认失败。')
    } finally {
      setSubmittingId(null)
    }
  }

  const lowStock = supplies.filter(s => s.status === '库存不足').length
  const pendingStockingCount = supplies.filter(s => s.lifecycleStatus === '待上架').length
  const shortageCount = supplies.filter(s => s.stock < s.minStock).length
  const riskCategories = [...new Set(supplies.filter(s => s.status === '库存不足').map(s => s.category))]
  const filtered = supplies.filter(s => {
    if (search && !s.name.includes(search)) return false
    if (catFilter && s.category !== catFilter) return false
    return true
  })
  const sortedSupplies = useMemo(() => sortSuppliesByPriority(filtered), [filtered])
  const prioritizedSupplies = sortedSupplies.slice(0, 4)
  const paged = sortedSupplies.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="物资管理"
        subtitle={`共 ${supplies.length} 种物资${selectedSupply && fromNew ? ' · 包含最新入库记录' : ''}`}
        actions={
          <Link href="/supplies/new" className="btn btn-primary btn-sm">
            <Plus size={13} />采购入库
          </Link>
        }
      />

      <InteractionRailLayout
        main={(
          <>
            {error ? (
              <DataCard title="Live Unavailable" subtitle="物资实时链路当前不可用，页面不会回退本地库存台账。" badge={<Tag variant="danger">Operations API</Tag>}>
                <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{error}</div>
              </DataCard>
            ) : null}

            <WorkflowOverviewCard
              eyebrow="Supply Operations"
              title="补货与上架总览"
              description="主区只保留待上架、低库存、优先队列和物资台账，先处理真正阻断执行的缺口。"
              badge={<Tag variant="warning">Supply View</Tag>}
              metrics={[
                { label: '低库存条目', value: lowStock, hint: shortageCount > 0 ? `${shortageCount} 条已低于最小库存` : '当前无库存缺口', tone: lowStock > 0 ? 'danger' : 'success' },
                { label: '待上架条目', value: pendingStockingCount, hint: '确认后才进入稳定库存口径', tone: pendingStockingCount > 0 ? 'warning' : 'neutral' },
                { label: '风险分类', value: riskCategories.length, hint: riskCategories.length > 0 ? riskCategories.join(' / ') : '当前分类供给稳定', tone: riskCategories.length > 0 ? 'warning' : 'success' },
                { label: '正常库存', value: supplies.filter(s => s.status === '正常').length, hint: `总物资 ${supplies.length} 种`, tone: 'info' },
              ]}
              signals={[
                { label: aiInsights[0] ? `${aiInsights[0].title}：${aiInsights[0].action}` : '暂无 AI 补货提醒', tone: aiInsights[0]?.variant === 'danger' ? 'danger' : 'warning' },
                { label: pendingStockingCount > 0 ? '存在待上架物资，采购入库后尚未转为可用库存' : '当前没有待上架阻塞', tone: pendingStockingCount > 0 ? 'warning' : 'success' },
                { label: riskCategories.length > 0 ? `缺口集中在 ${riskCategories.join(' / ')}` : '当前缺口未集中到单一分类', tone: riskCategories.length > 1 ? 'warning' : 'neutral' },
              ]}
              actions={
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Link href="/supplies/new" className="btn btn-secondary btn-sm">采购入库</Link>
                  <Link href={buildAiHref('supply-restock', 'inference')} className="btn btn-primary btn-sm">查看 AI 建议</Link>
                </div>
              }
            />

            {selectedSupply && fromNew ? (
              <DataCard
                title="来自采购入库页"
                subtitle={`${selectedSupply.name} 已回流物资列表。请确认上架后再计入稳定库存口径。`}
                badge={<Tag variant={selectedSupply.lifecycleStatus === '待上架' ? 'warning' : 'success'}>{selectedSupply.lifecycleStatus}</Tag>}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                    最近一次入库 {selectedSupply.lastIntakeQuantity ?? 0}{selectedSupply.unit}，当前库存 {selectedSupply.stock}{selectedSupply.unit}。
                  </div>
                  {selectedSupply.lifecycleStatus === '待上架' ? (
                    <button className="btn btn-primary btn-sm" onClick={() => handleActivate(selectedSupply.id)} disabled={submittingId === selectedSupply.id}>
                      {submittingId === selectedSupply.id ? '确认中...' : '确认上架'}
                    </button>
                  ) : (
                    <Link href={`/supplies/${selectedSupply.id}`} className="btn btn-secondary btn-sm">查看详情</Link>
                  )}
                </div>
              </DataCard>
            ) : null}

            <DataCard
              icon={<AlertTriangle size={16} />}
              title="补货优先队列"
              subtitle="把待上架、低库存和接近缺口的物资直接前置。"
              badge={<Tag variant="warning">Priority Queue</Tag>}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                {prioritizedSupplies.map(item => {
                  const gap = Math.max(item.minStock - item.stock, 0)
                  const actionLabel = item.lifecycleStatus === '待上架'
                    ? '先确认上架，再计入可用库存'
                    : item.status === '库存不足'
                      ? `优先补货，当前缺口 ${gap}${item.unit}`
                      : '接近安全库存，建议提前补货'

                  return (
                    <div key={item.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.name}</div>
                          <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>
                            {item.category} · 当前 {item.stock}{item.unit} · 最低 {item.minStock}{item.unit}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <Tag variant={CAT_TAG[item.category]}>{item.category}</Tag>
                          <Tag variant={STATUS_TAG[item.status]}>{item.status}</Tag>
                        </div>
                      </div>
                      <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>{actionLabel}</div>
                    </div>
                  )
                })}
              </div>
            </DataCard>

            <div className="kpi-grid">
              <StatCard icon={<Package size={18} />} label="物品种类" value={supplies.length} color="primary" />
              <StatCard icon={<AlertTriangle size={18} />} label="库存不足" value={lowStock} sub="需立即采购" color="danger" />
              <StatCard icon={<Package size={18} />} label="库存正常" value={supplies.filter(s => s.status === '正常').length} color="success" />
              <StatCard icon={<Package size={18} />} label="本月采购" value={12} sub="采购次数" color="info" />
            </div>

            <FilterBar>
              <FilterItem label="">
                <div className="input-wrap" style={{ minWidth: 180 }}>
                  <span className="input-icon"><Search size={14} /></span>
                  <input
                    className="input"
                    placeholder="搜索物资名称..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1) }}
                    style={{ paddingLeft: 34 }}
                  />
                </div>
              </FilterItem>
              <FilterItem label="">
                <select
                  className="select"
                  value={catFilter}
                  onChange={e => { setCatFilter(e.target.value); setPage(1) }}
                  style={{ minWidth: 130 }}
                >
                  <option value="">全部分类</option>
                  {[...new Set(supplies.map(s => s.category))].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </FilterItem>
            </FilterBar>

            <DataCard
              icon={<Package size={16} />}
              title="物资台账"
              subtitle="主区保留筛选和库存表格，先支撑补货与上架动作。"
              badge={<Tag variant="primary">Inventory Table</Tag>}
            >
              <div style={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>物资名称</th>
                        <th>分类</th>
                        <th>单位</th>
                        <th>库存</th>
                        <th>最低库存</th>
                        <th>单价</th>
                        <th>供应商</th>
                        <th>状态</th>
                        <th style={{ textAlign: 'right' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map(s => (
                        <tr key={s.id} className="table-hover-row">
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                                background: 'rgba(13,148,136,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--color-primary)',
                              }}>
                                <Package size={16} />
                              </div>
                              <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{s.name}</span>
                            </div>
                          </td>
                          <td><Tag variant={CAT_TAG[s.category]}>{s.category}</Tag></td>
                          <td><span className="text-sm">{s.unit}</span></td>
                          <td>
                            <span className="font-semibold text-sm" style={{
                              color: s.status === '库存不足' ? 'var(--color-danger)' : 'var(--color-text)',
                            }}>
                              {s.stock}
                            </span>
                          </td>
                          <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{s.minStock}</span></td>
                          <td><span className="text-sm">{s.price}</span></td>
                          <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{s.supplier}</span></td>
                          <td><Tag variant={STATUS_TAG[s.status]}>{s.status}</Tag></td>
                          <td style={{ textAlign: 'right' }}>
                            <Link href={`/supplies/${s.id}`} className="btn btn-ghost btn-sm">
                              入库 <ChevronRight size={12} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {loading ? (
                  <div style={{ padding: 16 }}>
                    <DataCard title="物资加载中" subtitle="正在从 Operations Service 获取库存台账。">
                      <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>补货优先队列和库存表格都已切换到真实后端数据。</div>
                    </DataCard>
                  </div>
                ) : null}
                {!loading && paged.length === 0 && <EmptyState variant="search" title="暂无数据" description="调整筛选条件试试" />}
                <Pagination current={page} total={filtered.length} pageSize={pageSize} onChange={setPage} />
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard
              icon={<Package size={16} />}
              title="补货上下文"
              subtitle="后置显示当前焦点、风险分类和待上架阻塞。"
              badge={<Tag variant="info">Context</Tag>}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">当前优先：{prioritizedSupplies[0] ? `${prioritizedSupplies[0].name} · ${prioritizedSupplies[0].status}` : '暂无需要优先补货的物资。'}</div>
                <div className="page-help-card-item">待上架阻塞：{pendingStockingCount > 0 ? `${pendingStockingCount} 条待确认上架。` : '当前没有待上架物资。'}</div>
                <div className="page-help-card-item">风险分类：{riskCategories.length > 0 ? riskCategories.join(' / ') : '当前缺口未集中到单一分类。'}</div>
              </div>
            </DataCard>

            <DataCard
              icon={<Bot size={16} />}
              title="AI 补货摘要"
              subtitle="先标出最可能影响一线执行的缺货风险，不替代正式采购审批。"
              badge={<Tag variant="warning">Procurement Assist</Tag>}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                {aiInsights.map(item => (
                  <div key={item.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                        <div style={{ marginTop: 4, fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.6 }}>{item.summary}</div>
                      </div>
                      <Tag variant={item.variant}>{item.metric}</Tag>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.6, color: 'var(--color-text)' }}>{item.action}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <Link href={buildAiHref('supply-restock', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
              </div>
            </DataCard>

            <DataCard
              icon={<AlertTriangle size={16} />}
              title="推荐处理路径"
              subtitle="把入库、上架和采购动作收束成一条稳定流程。"
            >
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '先确认待上架物资，避免“已采购但不可用”的口径偏差。',
                  '再按低库存缺口安排采购，优先处理护理用品与消毒用品。',
                  '最后进入 AI 运营中心，检查供应商和补货节奏是否需要调整。',
                ].map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>

            <DataCard
              icon={<AlertTriangle size={16} />}
              title="AI 采购建议"
              subtitle="把库存表转成补货优先级与缺口估算。"
            >
              <div style={{ display: 'grid', gap: 10 }}>
                {aiNarratives.map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <Link href={buildAiHref('supply-procurement', 'logs')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整补货边界迁移到显式帮助页"
              summary="物资管理页现在只保留补货优先队列、库存台账和采购回流入口，完整路径说明与 AI 边界统一后置。"
              items={[
                '先确认待上架和低库存条目，再决定采购优先级。',
                '筛选和台账用于核对对象事实，不替代采购审批。',
                '若需要完整补货边界与操作顺序，进入帮助页查看。',
              ]}
              href={helpHref}
              actionLabel="查看物资管理帮助"
            />
          </>
        )}
      />

    </div>
  )
}
