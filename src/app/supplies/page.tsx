'use client'

import { useMemo, useState, useSyncExternalStore } from 'react'
import { useSearchParams } from 'next/navigation'
import { DataCard, EmptyState, FilterBar, FilterItem, PageHeader, Pagination, StatCard, Tag, type TagVariant } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { getSupplyAiInsights, getSupplyAiNarratives } from '@/lib/mock/admin-ai'
import { confirmSupplyStocking, getResourceSnapshot, subscribeResourceWorkflow } from '@/lib/mock/resource-workflow'
import { AlertTriangle, Bot, ChevronRight, Package, Plus, Search } from 'lucide-react'
import Link from 'next/link'

const STATUS_TAG: Record<string, TagVariant> = { '库存不足': 'danger', '正常': 'success', '待上架': 'warning' }
const CAT_TAG: Record<string, TagVariant> = { '护理用品': 'primary', '防护用品': 'warning', '消毒用品': 'info', '医疗用品': 'purple' }

export default function SuppliesPage() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('selected')
  const fromNew = searchParams.get('entry') === 'supplies-new'
  const snapshot = useSyncExternalStore(
    subscribeResourceWorkflow,
    getResourceSnapshot,
    getResourceSnapshot,
  )
  const supplies = snapshot.supplies
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const selectedSupply = useMemo(
    () => supplies.find(item => item.id === preselectedId) ?? null,
    [preselectedId, supplies],
  )
  const aiInsights = getSupplyAiInsights(supplies)
  const aiNarratives = getSupplyAiNarratives(supplies)
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'supplies-list',
    entityId: 'supply-board',
    entityName: '物资管理',
    focus,
    target,
  })

  const lowStock = supplies.filter(s => s.status === '库存不足').length
  const filtered = supplies.filter(s => {
    if (search && !s.name.includes(search)) return false
    if (catFilter && s.category !== catFilter) return false
    return true
  })
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

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
              <button className="btn btn-primary btn-sm" onClick={() => confirmSupplyStocking(selectedSupply.id)}>
                确认上架
              </button>
            ) : (
              <Link href={`/supplies/${selectedSupply.id}`} className="btn btn-secondary btn-sm">查看详情</Link>
            )}
          </div>
        </DataCard>
      ) : null}

      <div className="kpi-grid">
        <StatCard icon={<Package size={18} />} label="物品种类" value={supplies.length} color="primary" />
        <StatCard icon={<AlertTriangle size={18} />} label="库存不足" value={lowStock} sub="需立即采购" color="danger" />
        <StatCard icon={<Package size={18} />} label="库存正常" value={supplies.filter(s => s.status === '正常').length} color="success" />
        <StatCard icon={<Package size={18} />} label="本月采购" value={12} sub="采购次数" color="info" />
      </div>

      <div className="dashboard-grid-2" style={{ marginBottom: 16 }}>
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
          title="AI 采购建议"
          subtitle="把库存表转成补货优先级与缺口估算。"
        >
          <div style={{ display: 'grid', gap: 10 }}>
            {aiNarratives.map(item => (
              <div key={item} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
                {item}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <Link href={buildAiHref('supply-procurement', 'logs')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
          </div>
        </DataCard>
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
        {paged.length === 0 && <EmptyState variant="search" title="暂无数据" description="调整筛选条件试试" />}
        <Pagination current={page} total={filtered.length} pageSize={pageSize} onChange={setPage} />
      </div>

    </div>
  )
}
