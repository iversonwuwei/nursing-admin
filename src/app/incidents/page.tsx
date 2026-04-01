"use client"

import { DataCard, EmptyState, FilterBar, FilterItem, PageHeader, Pagination, StatCard, Tag, type TagVariant } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { getIncidentListAiInsights, getIncidentListNarratives } from '@/lib/mock/admin-ai'
import { getIncidentStats, getOperationsSnapshot, startIncidentHandling, subscribeOperationsWorkflow } from '@/lib/mock/operations-workflow'
import { AlertTriangle, Bot, ChevronRight, Plus, Search, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState, useSyncExternalStore } from 'react'

const LEVEL_TAG: Record<string, TagVariant> = { '严重': 'danger', '一般': 'warning', '轻微': 'info' }
const STATUS_TAG: Record<string, TagVariant> = { '待分派': 'info', '处理中': 'warning', '已结案': 'success' }

export default function IncidentsPage() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('selected')
  const fromNew = searchParams.get('entry') === 'incidents-new'
  const incidents = useSyncExternalStore(
    subscribeOperationsWorkflow,
    () => getOperationsSnapshot().incidents,
    () => getOperationsSnapshot().incidents,
  )
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
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

  const filtered = incidents.filter(incident => {
    if (search && ![incident.title, incident.id, incident.room, incident.reporter, incident.elder ?? ''].some(field => field.includes(search))) return false
    if (levelFilter && incident.level !== levelFilter) return false
    return true
  })
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

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
              <button className="btn btn-primary btn-sm" onClick={() => startIncidentHandling(selectedIncident.id)}>
                开始处置
              </button>
            ) : (
              <Link href={`/incidents/${selectedIncident.id}`} className="btn btn-secondary btn-sm">查看详情</Link>
            )}
          </div>
        </DataCard>
      ) : null}

      <div className="dashboard-grid-2" style={{ marginBottom: 16 }}>
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
          subtitle="把事故列表翻译成管理动作，而不是只看数量。"
        >
          <div style={{ display: 'grid', gap: 10 }}>
            {aiNarratives.map(item => (
              <div key={item} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
                {item}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <Link href={buildAiHref('incident-retrospective', 'logs')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
          </div>
        </DataCard>
      </div>

      <FilterBar>
        <FilterItem label="">
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
        <FilterItem label="">
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

      {paged.length === 0 ? (
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

    </div>
  )
}
