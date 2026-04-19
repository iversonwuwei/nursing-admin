'use client'

import { DataCard, EmptyState, FilterBar, FilterItem, InteractionRailLayout, PageHeader, PageHelpCard, Pagination, StatCard, Tag, WorkflowOverviewCard, type TagVariant } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { buildEquipmentAlerts } from '@/lib/equipment/equipment-live-derivations'
import { getEquipmentListAiInsights, getEquipmentListAiNarratives } from '@/lib/mock/admin-ai'
import { activateAdminEquipment, fetchAdminEquipment, type AdminEquipmentRecord } from '@/lib/services/admin-operations-services'
import { AlertTriangle, Bot, CheckCircle2, Plus, Search, Wifi } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

const CATEGORY_TAG: Record<string, TagVariant> = {
  '医疗设备': 'info', '康复设备': 'warning', '生活设备': 'primary', '智能设备': 'purple',
}
const STATUS_TAG: Record<string, TagVariant> = {
  '正常': 'success', '维修中': 'warning', '已报废': 'danger', '待维修': 'warning',
}

export default function EquipmentPage() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('selected')
  const fromNew = searchParams.get('entry') === 'equipment-new'
  const [equipment, setEquipment] = useState<AdminEquipmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    let active = true

    fetchAdminEquipment({ page: 1, pageSize: 200 })
      .then(response => {
        if (!active) {
          return
        }

        setEquipment(response.items)
        setError('')
      })
      .catch((reason: unknown) => {
        if (!active) {
          return
        }

        setError(reason instanceof Error ? reason.message : '设备列表查询失败。')
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

  const equipmentAlarms = useMemo(() => buildEquipmentAlerts(equipment), [equipment])
  const pendingAlarmIds = useMemo(
    () => new Set(equipmentAlarms.filter(item => item.status === '待处理').map(item => item.equipmentId)),
    [equipmentAlarms],
  )

  const selectedEquipment = useMemo(
    () => equipment.find(item => item.id === preselectedId) ?? null,
    [equipment, preselectedId],
  )

  const filtered = useMemo(() => [...equipment].filter(e => {
    if (search && !e.name.includes(search) && !e.id.includes(search)) return false
    if (catFilter && e.category !== catFilter) return false
    return true
  }).sort((left, right) => {
    const leftScore = (left.lifecycleStatus === '待验收' ? 100 : 0) + (pendingAlarmIds.has(left.id) ? 80 : 0) + (left.status === '待维修' ? 40 : left.status === '维修中' ? 20 : 0)
    const rightScore = (right.lifecycleStatus === '待验收' ? 100 : 0) + (pendingAlarmIds.has(right.id) ? 80 : 0) + (right.status === '待维修' ? 40 : right.status === '维修中' ? 20 : 0)
    return rightScore - leftScore
  }), [catFilter, equipment, pendingAlarmIds, search])
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  const stats = {
    total: equipment.length,
    normal: equipment.filter(e => e.status === '正常').length,
    alarm: equipmentAlarms.filter(a => a.status === '待处理').length,
    repair: equipment.filter(e => e.status === '维修中' || e.status === '待维修').length,
  }
  const pendingAcceptanceCount = equipment.filter(e => e.lifecycleStatus === '待验收').length
  const urgentEquipment = filtered.filter(item => item.lifecycleStatus === '待验收' || pendingAlarmIds.has(item.id) || item.status === '待维修' || item.status === '维修中').slice(0, 3)

  const categories = [...new Set(equipment.map(e => e.category))]
  const aiInsights = getEquipmentListAiInsights(equipment, equipmentAlarms)
  const aiNarratives = getEquipmentListAiNarratives(equipment, equipmentAlarms)
  const helpHref = '/equipment/help'
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'equipment-list',
    entityId: 'equipment-board',
    entityName: '设备列表',
    focus,
    target,
  })

  async function handleActivate(equipmentId: string) {
    setSubmittingId(equipmentId)
    try {
      const updated = await activateAdminEquipment(equipmentId)
      setEquipment(current => current.map(item => item.id === updated.id ? updated : item))
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '设备验收失败。')
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <div className="animate-fade-up">

      <PageHeader
        title="设备列表"
        subtitle={`共 ${equipment.length} 台设备${selectedEquipment && fromNew ? ' · 包含最新待验收设备' : ''}`}
        actions={
          <Link href="/equipment/new" className="btn btn-primary btn-sm">
            <Plus size={13} />添加设备
          </Link>
        }
      />

      <InteractionRailLayout
        main={(
          <>
            {error ? (
              <DataCard title="Live Unavailable" subtitle="设备实时链路当前不可用，页面不会回退本地资源台账。" badge={<Tag variant="danger">Operations API</Tag>}>
                <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{error}</div>
              </DataCard>
            ) : null}

            <WorkflowOverviewCard
              eyebrow="Device Operations"
              title={selectedEquipment ? `${selectedEquipment.name} 巡检摘要` : '设备与巡检总览'}
              description={selectedEquipment
                ? `${selectedEquipment.location} · ${selectedEquipment.category}。当前页面按待验收、待维修、待处理告警三类优先级组织设备台账，减少值班工程与运营同事在列表里手动筛查。`
                : '设备页当前兼顾设备台账、巡检优先级和维保闭环，先展示高风险设备，再进入详情或实时监控。'}
              badge={selectedEquipment ? <Tag variant={selectedEquipment.lifecycleStatus === '待验收' ? 'warning' : STATUS_TAG[selectedEquipment.status]}>{selectedEquipment.lifecycleStatus === '待验收' ? '待验收' : selectedEquipment.status}</Tag> : <Tag variant="info">Patrol Board</Tag>}
              metrics={[
                { label: '设备总数', value: stats.total, hint: '当前资源台账设备总盘子', tone: 'primary' },
                { label: '待处理告警', value: stats.alarm, hint: '先处理影响监测与呼叫链路的设备', tone: stats.alarm > 0 ? 'danger' : 'success' },
                { label: '待验收设备', value: pendingAcceptanceCount, hint: '完成验收后再正式入册', tone: pendingAcceptanceCount > 0 ? 'warning' : 'success' },
                { label: '维修压力', value: stats.repair, hint: '含维修中与待维修设备', tone: stats.repair > 0 ? 'warning' : 'success' },
              ]}
              signals={[
                { label: urgentEquipment.length > 0 ? `当前优先队列 ${urgentEquipment.length} 台` : '当前无高优先设备', tone: urgentEquipment.length > 0 ? 'warning' : 'success' },
                { label: selectedEquipment?.serialNumber ?? '可从下方列表选择设备查看详情', tone: selectedEquipment ? 'info' : 'neutral' },
                { label: selectedEquipment?.acceptanceNote ?? '默认按生命周期 + 告警 + 维修状态排序', tone: selectedEquipment?.acceptanceNote ? 'primary' : 'neutral' },
              ]}
              actions={
                <>
                  <Link href="/equipment/new" className="btn btn-secondary btn-sm">新增设备</Link>
                  <Link href="/devices/realtime" className="btn btn-secondary btn-sm">查看实时监控</Link>
                </>
              }
            />

            {selectedEquipment && fromNew ? (
              <DataCard
                title="来自新增设备页"
                subtitle={`${selectedEquipment.name} 已进入待验收闭环。确认后再纳入设备台账。`}
                badge={<Tag variant={selectedEquipment.lifecycleStatus === '待验收' ? 'warning' : 'success'}>{selectedEquipment.lifecycleStatus}</Tag>}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                    当前分类 {selectedEquipment.category}，位置 {selectedEquipment.location}，序列号 {selectedEquipment.serialNumber}。
                  </div>
                  {selectedEquipment.lifecycleStatus === '待验收' ? (
                    <button className="btn btn-primary btn-sm" onClick={() => handleActivate(selectedEquipment.id)} disabled={submittingId === selectedEquipment.id}>
                      {submittingId === selectedEquipment.id ? '验收中...' : '完成验收'}
                    </button>
                  ) : (
                    <Link href={`/equipment/${selectedEquipment.id}`} className="btn btn-secondary btn-sm">查看详情</Link>
                  )}
                </div>
              </DataCard>
            ) : null}

            <div className="kpi-grid">
              <StatCard icon={<Wifi size={18} />} label="设备总数" value={stats.total} color="primary" />
              <StatCard icon={<CheckCircle2 size={18} />} label="正常运行" value={stats.normal} color="success" />
              <StatCard icon={<AlertTriangle size={18} />} label="待处理告警" value={stats.alarm} sub="需立即处理" color="danger" />
              <StatCard icon={<Wifi size={18} />} label="维修中" value={stats.repair} sub="设备维护" color="warning" />
            </div>

            <DataCard
              icon={<AlertTriangle size={16} />}
              title="巡检优先队列"
              subtitle="先处理会影响监测、呼叫或新设备入册的设备，再进入明细表逐台处理。"
              badge={<Tag variant="warning">Priority Queue</Tag>}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                {urgentEquipment.length > 0 ? urgentEquipment.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    className="btn-reset"
                    onClick={() => window.location.assign(`/equipment/${item.id}`)}
                    style={{ textAlign: 'left', borderRadius: 16, border: '1px solid var(--color-border)', padding: 16, background: 'var(--color-card)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{item.name}</div>
                      <Tag variant={item.lifecycleStatus === '待验收' ? 'warning' : pendingAlarmIds.has(item.id) ? 'danger' : STATUS_TAG[item.status]}>
                        {item.lifecycleStatus === '待验收' ? '待验收' : pendingAlarmIds.has(item.id) ? '待处理告警' : item.status}
                      </Tag>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{item.location} · {item.model}</div>
                    <div style={{ marginTop: 10, fontSize: 12, color: 'var(--color-text)' }}>{item.remarks ?? item.acceptanceNote ?? '建议优先进入详情页确认巡检或维保动作。'}</div>
                  </button>
                )) : (
                  <div style={{ padding: 16, borderRadius: 14, background: 'var(--color-bg)', fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                    当前没有待验收、待维修或待处理告警设备，设备台账处于稳定状态。
                  </div>
                )}
              </div>
            </DataCard>

            <FilterBar>
              <FilterItem label="搜索">
                <div className="input-wrap" style={{ minWidth: 180 }}>
                  <span className="input-icon"><Search size={14} /></span>
                  <input
                    className="input"
                    placeholder="搜索设备名称..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1) }}
                    style={{ paddingLeft: 34 }}
                  />
                </div>
              </FilterItem>
              <FilterItem label="分类">
                <select
                  className="select"
                  value={catFilter}
                  onChange={e => { setCatFilter(e.target.value); setPage(1) }}
                  style={{ minWidth: 130 }}
                >
                  <option value="">全部分类</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
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
                      <th>设备名称</th>
                      <th>分类</th>
                      <th>型号</th>
                      <th>位置</th>
                      <th>状态</th>
                      <th>采购日期</th>
                      <th style={{ textAlign: 'right' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map(e => (
                      <tr key={e.id} className="table-hover-row" style={{ background: e.lifecycleStatus === '待验收' ? 'rgba(245,158,11,0.06)' : pendingAlarmIds.has(e.id) ? 'rgba(239,68,68,0.05)' : undefined }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                              background: STATUS_TAG[e.status] === 'success'
                                ? 'rgba(34,197,94,0.1)' : STATUS_TAG[e.status] === 'warning'
                                  ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                              color: STATUS_TAG[e.status] === 'success'
                                ? 'var(--color-success)' : STATUS_TAG[e.status] === 'warning'
                                  ? 'var(--color-warning)' : 'var(--color-danger)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Wifi size={16} />
                            </div>
                            <div>
                              <div className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{e.name}</div>
                              <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{e.id}</div>
                            </div>
                          </div>
                        </td>
                        <td><Tag variant={CATEGORY_TAG[e.category]}>{e.category}</Tag></td>
                        <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{e.model}</span></td>
                        <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{e.location}</span></td>
                        <td><Tag variant={STATUS_TAG[e.status]}>{e.status}</Tag></td>
                        <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{e.purchaseDate}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <Link href={`/equipment/${e.id}`} className="btn btn-ghost btn-sm">详情</Link>
                            <Link href="/devices/realtime" className="btn btn-ghost btn-sm">监控</Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {loading ? (
                <div style={{ padding: 16 }}>
                  <DataCard title="设备加载中" subtitle="正在从 Operations Service 获取设备台账。">
                    <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>列表、优先队列和 `/devices` 兼容入口都已切换到真实后端数据。</div>
                  </DataCard>
                </div>
              ) : null}
              {!loading && paged.length === 0 && <EmptyState variant="search" title="暂无数据" description="调整筛选条件试试" />}
              <Pagination current={page} total={filtered.length} pageSize={pageSize} onChange={setPage} />
            </div>
          </>
        )}
        rail={(
          <>
            <DataCard title="设备上下文" subtitle="后置展示当前焦点对象和列表边界。" badge={<Tag variant="info">Context</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">当前焦点：{selectedEquipment ? `${selectedEquipment.name} · ${selectedEquipment.lifecycleStatus}` : '未选中具体设备，先看优先队列。'}</div>
                <div className="page-help-card-item">待验收设备 {pendingAcceptanceCount} 台，待处理告警 {stats.alarm} 条。</div>
                <div className="page-help-card-item">主区只保留优先队列、筛选表格和关键动作，解释型内容统一后置。</div>
              </div>
            </DataCard>

            <DataCard
              icon={<Bot size={16} />}
              title="AI 巡检摘要"
              subtitle="优先解释哪些设备需要先巡检或准备备用方案。"
              badge={<Tag variant="info">Patrol Assist</Tag>}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                {aiInsights.map(item => (
                  <div key={item.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                      <Tag variant={item.variant}>{item.title}</Tag>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.summary}</div>
                    <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.6, color: 'var(--color-text)' }}>{item.action}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <Link href={buildAiHref('equipment-patrol', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
              </div>
            </DataCard>

            <DataCard
              icon={<Wifi size={16} />}
              title="AI 维保建议"
              subtitle="把设备列表翻译成巡检顺序、备用路径和维保节奏。"
            >
              <div style={{ display: 'grid', gap: 10 }}>
                {aiNarratives.map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <Link href={buildAiHref('equipment-maintenance', 'logs')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整设备列表说明迁移到显式帮助页"
              summary="设备列表页现在只保留优先队列、筛选表格和关键操作，巡检解释与维保说明统一后置。"
              items={[
                '先看待验收、待维修和告警设备，再下钻到详情。',
                'AI 建议只用于排序辅助，不替代人工验收和维保判断。',
                '若需要完整页面定位和操作顺序，进入设备帮助页查看。',
              ]}
              href={helpHref}
              actionLabel="查看设备帮助"
            />
          </>
        )}
      />

    </div>
  )
}
