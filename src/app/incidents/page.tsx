"use client"

import { DataCard, EmptyState, FilterBar, FilterItem, InteractionRailLayout, PageHeader, PageHelpCard, Pagination, StatCard, Tag, WorkflowOverviewCard, type TagVariant } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { getIncidentListAiInsights, getIncidentListNarratives } from '@/lib/mock/admin-ai'
import { getIncidentStats } from '@/lib/mock/operations-workflow'
import { sortIncidentsByPriority } from '@/lib/operations-priority'
import { fetchAdminIncidents, startAdminIncidentHandling, type AdminIncidentRecord } from '@/lib/services/admin-operations-services'
import { AlertTriangle, Bot, ChevronRight, Plus, Search, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

const LEVEL_TAG: Record<string, TagVariant> = { '严重': 'danger', '一般': 'warning', '轻微': 'info' }
const STATUS_TAG: Record<string, TagVariant> = { '待分派': 'info', '处理中': 'warning', '已结案': 'success' }

export default function IncidentsPage() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('selected')
  const fromNew = searchParams.get('entry') === 'incidents-new'
  const [incidents, setIncidents] = useState<AdminIncidentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    let active = true

    fetchAdminIncidents({ page: 1, pageSize: 200 })
      .then(response => {
        if (!active) {
          return
        }

        setIncidents(response.items)
        setError('')
      })
      .catch((reason: unknown) => {
        if (!active) {
          return
        }

        setError(reason instanceof Error ? reason.message : '事故列表查询失败。')
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

  const selectedIncident = useMemo(
    () => incidents.find(item => item.id === preselectedId) ?? null,
    [incidents, preselectedId],
  )
  const stats = useMemo(() => getIncidentStats(incidents), [incidents])
  const aiIncidents = useMemo(
    () => incidents.map(item => item.status === '待分派' ? { ...item, status: '处理中' } : item),
    [incidents],
  )
  const aiInsights = getIncidentListAiInsights(aiIncidents)
  const aiNarratives = getIncidentListNarratives(aiIncidents)
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'incidents-list',
    entityId: 'incident-board',
    entityName: '事故报告',
    focus,
    target,
  })

  async function handleStart(incidentId: string) {
    setSubmittingId(incidentId)
    try {
      const updated = await startAdminIncidentHandling(incidentId)
      setIncidents(current => current.map(item => item.id === updated.id ? updated : item))
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '事故处置启动失败。')
    } finally {
      setSubmittingId(null)
    }
  }

  const filtered = incidents.filter(incident => {
    if (search && ![incident.title, incident.id, incident.room, incident.reporter, incident.elder ?? ''].some(field => field.includes(search))) return false
    if (levelFilter && incident.level !== levelFilter) return false
    return true
  })
  const sortedIncidents = useMemo(() => sortIncidentsByPriority(filtered), [filtered])
  const paged = sortedIncidents.slice((page - 1) * pageSize, page * pageSize)
  const prioritizedIncidents = sortedIncidents.slice(0, 4)
  const closureRate = incidents.length > 0 ? Math.round((incidents.filter(item => item.status === '已结案').length / incidents.length) * 100) : 0
  const helpHref = '/incidents/help'

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="事故报告"
        subtitle={`共 ${stats.total} 条记录 · ${stats.pending} 条待分派 · ${stats.processing} 条处理中`}
        actions={
          <Link href="/incidents/new" className="btn btn-primary btn-sm">
            <Plus size={13} />新增报告
          </Link>
        }
      />

      <InteractionRailLayout
        main={(
          <>
            {error ? (
              <DataCard title="Live Unavailable" subtitle="事故实时链路当前不可用，页面不会回退本地事故流。" badge={<Tag variant="danger">Operations API</Tag>}>
                <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{error}</div>
              </DataCard>
            ) : null}

            <WorkflowOverviewCard
              eyebrow="Incident Operations"
              title="事故处置总览"
              description="主区优先保留待分派、处理中和严重等级信号，确保事故页是处置入口而不是归档列表。"
              badge={<Tag variant="warning">Safety Board</Tag>}
              metrics={[
                { label: '事故总数', value: stats.total, hint: '当前事故管理台账', tone: 'primary' },
                { label: '待分派', value: stats.pending, hint: '需值班主管尽快接单', tone: stats.pending > 0 ? 'warning' : 'success' },
                { label: '严重事故', value: stats.severe, hint: '优先保障老人安全与家属通知', tone: stats.severe > 0 ? 'danger' : 'success' },
                { label: '结案率', value: `${closureRate}%`, hint: `处理中 ${stats.processing} 条`, tone: closureRate >= 60 ? 'success' : 'warning' },
              ]}
              signals={[
                { label: prioritizedIncidents[0] ? `当前最高优先：${prioritizedIncidents[0].title}` : '当前无事故待优先处置', tone: prioritizedIncidents[0]?.level === '严重' ? 'danger' : 'info' },
                { label: aiInsights[0] ? `${aiInsights[0].title}：${aiInsights[0].action}` : '暂无 AI 事故提醒', tone: aiInsights[0]?.variant === 'danger' ? 'danger' : 'warning' },
                { label: selectedIncident && fromNew ? `新建报告已回流：${selectedIncident.title}` : '当前无新建事故回流阻塞', tone: selectedIncident && fromNew ? 'success' : 'neutral' },
              ]}
              actions={
                <>
                  <Link href="/incidents/new" className="btn btn-secondary btn-sm">新增报告</Link>
                  <Link href={buildAiHref('incident-review', 'inference')} className="btn btn-secondary btn-sm">查看 AI 复盘</Link>
                </>
              }
            />

            <div className="kpi-grid">
              <StatCard icon={<ShieldAlert size={18} />} label="事故总数" value={stats.total} color="primary" />
              <StatCard icon={<AlertTriangle size={18} />} label="严重事故" value={stats.severe} color="danger" />
              <StatCard icon={<ShieldAlert size={18} />} label="待分派" value={stats.pending} sub="等待值班主管接单" color="info" />
              <StatCard icon={<ShieldAlert size={18} />} label="处理中" value={stats.processing} sub="需立即处理" color="warning" />
            </div>

            {selectedIncident && fromNew ? (
              <DataCard
                title="来自新增报告页"
                subtitle={`${selectedIncident.title} 已进入待分派闭环。请尽快指定责任人并启动处置。`}
                badge={<Tag variant={STATUS_TAG[selectedIncident.status]}>{selectedIncident.status}</Tag>}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                    当前级别 {selectedIncident.level}，地点 {selectedIncident.room}，报告人 {selectedIncident.reporter}（{selectedIncident.reporterRole}）。
                  </div>
                  {selectedIncident.status === '待分派' ? (
                    <button className="btn btn-primary btn-sm" onClick={() => handleStart(selectedIncident.id)} disabled={submittingId === selectedIncident.id}>
                      {submittingId === selectedIncident.id ? '启动中...' : '开始处置'}
                    </button>
                  ) : (
                    <Link href={`/incidents/${selectedIncident.id}`} className="btn btn-secondary btn-sm">查看详情</Link>
                  )}
                </div>
              </DataCard>
            ) : null}

            <DataCard
              icon={<ShieldAlert size={16} />}
              title="处置优先队列"
              subtitle="按分派状态、事故等级和发生时间统一排序，先暴露最需要立即接手的事故。"
              badge={<Tag variant="warning">Priority Queue</Tag>}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                {prioritizedIncidents.map(incident => {
                  const actionLabel = incident.status === '待分派'
                    ? '立即指定责任人并启动现场处置'
                    : incident.status === '处理中'
                      ? incident.nextStep ?? '继续推进处置与家属通知'
                      : '已结案，建议回看处理链路和制度改进点'

                  return (
                    <div key={incident.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{incident.title}</div>
                          <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{incident.room} · {incident.time} · 报告人 {incident.reporter}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <Tag variant={LEVEL_TAG[incident.level]}>{incident.level}</Tag>
                          <Tag variant={STATUS_TAG[incident.status]}>{incident.status}</Tag>
                        </div>
                      </div>
                      <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>{actionLabel}</div>
                    </div>
                  )
                })}
              </div>
            </DataCard>

            <FilterBar>
              <FilterItem label="搜索">
                <div className="input-wrap" style={{ minWidth: 180 }}>
                  <span className="input-icon"><Search size={14} /></span>
                  <input
                    className="input"
                    placeholder="搜索事故标题..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1) }}
                    style={{ paddingLeft: 34 }}
                  />
                </div>
              </FilterItem>
              <FilterItem label="级别">
                <select
                  className="select"
                  value={levelFilter}
                  onChange={e => { setLevelFilter(e.target.value); setPage(1) }}
                  style={{ minWidth: 120 }}
                >
                  <option value="">全部级别</option>
                  <option value="严重">严重</option>
                  <option value="一般">一般</option>
                  <option value="轻微">轻微</option>
                </select>
              </FilterItem>
            </FilterBar>

            {loading ? (
              <DataCard title="事故加载中" subtitle="正在从 Operations Service 获取事故台账。">
                <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>首屏已切换到真实后端数据，不再从前端 workflow 读取事故记录。</div>
              </DataCard>
            ) : paged.length === 0 ? (
              <EmptyState variant="search" title="暂无数据" description="调整筛选条件试试" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {paged.map(inc => (
                  <Link key={inc.id} href={`/incidents/${inc.id}`} style={{ textDecoration: 'none' }}>
                    <div className="list-item-card">
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: LEVEL_TAG[inc.level] === 'danger'
                          ? 'rgba(239,68,68,0.1)' : LEVEL_TAG[inc.level] === 'warning'
                            ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)',
                        color: LEVEL_TAG[inc.level] === 'danger'
                          ? 'var(--color-danger)' : LEVEL_TAG[inc.level] === 'warning'
                            ? 'var(--color-warning)' : 'var(--color-info)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <ShieldAlert size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{inc.title}</span>
                          <Tag variant={LEVEL_TAG[inc.level]}>{inc.level}</Tag>
                          <Tag variant={STATUS_TAG[inc.status]}>{inc.status}</Tag>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {inc.elder && <span className="text-xs" style={{ color: 'var(--color-muted)' }}>👤 {inc.elder}</span>}
                          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>📍 {inc.room}</span>
                          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>🕐 {inc.time}</span>
                        </div>
                      </div>
                      <ChevronRight size={14} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Pagination current={page} total={filtered.length} pageSize={pageSize} onChange={setPage} />
          </>
        )}
        rail={(
          <>
            <DataCard
              icon={<ChevronRight size={16} />}
              title="处置上下文"
              subtitle="后置显示当前焦点、回流状态和推荐处理顺序。"
              badge={<Tag variant="info">Context</Tag>}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">当前最高优先：{prioritizedIncidents[0] ? `${prioritizedIncidents[0].title} · ${prioritizedIncidents[0].level}` : '暂无待处置事故。'}</div>
                <div className="page-help-card-item">新建回流：{selectedIncident && fromNew ? `${selectedIncident.title} 已进入处置闭环。` : '当前无新建事故回流阻塞。'}</div>
                <div className="page-help-card-item">推荐顺序：先分派待分派事故，再推进处理中事故，最后复盘已结案记录。</div>
              </div>
            </DataCard>

            <DataCard
              icon={<Bot size={16} />}
              title="AI 事故摘要"
              subtitle="帮助管理层快速看见处理中事件与复盘重点，不替代正式事故认定。"
              badge={<Tag variant="warning">需人工复盘</Tag>}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                {aiInsights.map(item => (
                  <div key={item.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</span>
                      <Tag variant={item.variant}>{item.variant === 'danger' ? '优先关注' : item.variant === 'warning' ? '需复盘' : '稳定'}</Tag>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>{item.summary}</div>
                    <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.action}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <Link href={buildAiHref('incident-review', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
              </div>
            </DataCard>

            <DataCard
              icon={<AlertTriangle size={16} />}
              title="AI 复盘建议"
              subtitle="把事故列表翻译成管理动作，作为右轨补充判断。"
            >
              <div style={{ display: 'grid', gap: 10 }}>
                {aiNarratives.map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <Link href={buildAiHref('incident-retrospective', 'logs')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整事故处置说明迁移到显式帮助页"
              summary="事故报告页现在只保留优先队列、筛选列表和处置入口，AI 说明与复盘建议统一后置到右轨和帮助页。"
              items={[
                '先处理待分派和严重事故，再推进处理中记录。',
                'AI 只用于排序辅助、摘要和复盘建议，不替代人工结案。',
                '若需要完整处置边界与推荐路径，进入帮助页查看。',
              ]}
              href={helpHref}
              actionLabel="查看事故帮助"
            />
          </>
        )}
      />

    </div>
  )
}
