'use client'

import { DataCard, PageHeader, StatCard, Tag, WorkflowOverviewCard } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import {
  ALERT_LEVEL_LABELS, ALERT_STATUS_LABELS,
  ALERT_TYPE_LABELS,
  alertRecords,
  type AlertLevel,
  type AlertRecord,
  type AlertStatus, type AlertType,
} from '@/lib/data/alerts-data'
import { getAlertAiSuggestion, getOpenAlertAiSummary } from '@/lib/mock/admin-ai'
import { sortAlertsByPriority } from '@/lib/operations-priority'
import {
  Activity,
  AlertTriangle, Bell,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock,
  Monitor,
  Phone,
  PhoneIncoming,
  Shield,
  User,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

const LEVEL_ICON: Record<AlertLevel, React.ReactNode> = {
  critical: <AlertTriangle size={14} />,
  warning: <Shield size={14} />,
  info: <Bell size={14} />,
}

const TYPE_ICON: Record<AlertType, React.ReactNode> = {
  fall: <Activity size={14} />,
  device: <Monitor size={14} />,
  health: <Bell size={14} />,
  call: <PhoneIncoming size={14} />,
}

const LEVEL_TAG: Record<AlertLevel, string> = {
  critical: 'danger',
  warning: 'warning',
  info: 'info',
}

const STATUS_TAG: Record<AlertStatus, string> = {
  pending: 'danger',
  processing: 'warning',
  resolved: 'success',
}

const NEXT_STATUS: Record<AlertStatus, AlertStatus | null> = {
  pending: 'processing',
  processing: 'resolved',
  resolved: null,
}

const NEXT_LABEL: Record<AlertStatus, string> = {
  pending: '接单处理',
  processing: '标记已解决',
  resolved: '',
}

const LEVEL_COLOR: Record<AlertLevel, string> = {
  critical: 'var(--color-danger)',
  warning: 'var(--color-warning)',
  info: 'var(--color-info)',
}

/* ── Alert Card ── */
function AlertCard({ alert, onTransition }: {
  alert: AlertRecord
  onTransition: (id: string, next: AlertStatus) => void
}) {
  const next = NEXT_STATUS[alert.status]
  const aiSuggestion = getAlertAiSuggestion(alert)

  return (
    <div className="alert-card"
      style={{
        border: `1px solid ${alert.level === 'critical' ? 'rgba(239,68,68,0.25)' : 'var(--color-border)'}`,
      }}>
      {/* Top accent bar */}
      <div className="alert-accent" style={{ background: LEVEL_COLOR[alert.level] }} />

      <div className="alert-card-body">
        {/* Header row */}
        <div className="flex-between" style={{ alignItems: 'flex-start' }}>
          <div className="flex gap-1" style={{ alignItems: 'center' }}>
            <div className="alert-type-icon" style={{
              background: `${LEVEL_COLOR[alert.level]}1A`,
              color: LEVEL_COLOR[alert.level],
            }}>
              {TYPE_ICON[alert.type]}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                {alert.elderlyName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>
                {alert.roomNumber}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <Tag variant={LEVEL_TAG[alert.level] as 'danger' | 'warning' | 'info'}>
              {LEVEL_ICON[alert.level]}
              <span style={{ marginLeft: 2 }}>{ALERT_LEVEL_LABELS[alert.level]}</span>
            </Tag>
            <Tag variant={STATUS_TAG[alert.status] as 'danger' | 'warning' | 'success'}>
              <Clock size={9} />
              <span style={{ marginLeft: 2 }}>{ALERT_STATUS_LABELS[alert.status]}</span>
            </Tag>
          </div>
        </div>

        {/* Alert type + desc */}
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
            <span className="text-label">{ALERT_TYPE_LABELS[alert.type]}</span>
            {alert.deviceName && (
              <>
                <ChevronRight size={10} color="var(--color-muted)" />
                <span className="text-secondary">{alert.deviceName}</span>
              </>
            )}
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.5 }}>
            {alert.description}
          </div>
        </div>

        {/* Time + handler */}
        <div className="alert-meta">
          <span className="alert-meta-item">
            <Clock size={10} />{alert.occurredAt}
          </span>
          {alert.handledBy && (
            <span className="alert-meta-item">
              <User size={10} />{alert.handledBy}
              {alert.handledAt && <span> · {alert.handledAt}</span>}
            </span>
          )}
        </div>

        {/* Resolution */}
        {alert.resolution && (
          <div className="alert-resolution">
            <div className="alert-resolution-title">处理结果</div>
            <div className="alert-resolution-text">{alert.resolution}</div>
          </div>
        )}

        <div style={{ marginTop: 10, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>
              <Bot size={12} />
              {aiSuggestion.title}
            </div>
            <Tag variant="info">{aiSuggestion.confidence}%</Tag>
          </div>
          <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>{aiSuggestion.explanation}</div>
          <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
            {aiSuggestion.actions.map(item => (
              <div key={item} style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--color-muted)' }}>• {item}</div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.6, color: 'var(--color-primary)', fontWeight: 600 }}>{aiSuggestion.escalation}</div>
        </div>

        {/* Actions */}
        {next && (
          <div className="alert-actions">
            <button
              className={`btn btn-sm ${alert.status === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onTransition(alert.id, next)}
            >
              {alert.status === 'pending' && <Phone size={11} />}
              {alert.status === 'processing' && <CheckCircle2 size={11} />}
              {NEXT_LABEL[alert.status]}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── CSS-only donut chart ── */
function DonutChart({ value, color, label }: { value: number; color: string; label: string }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const dash = (value / 100) * circ
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="var(--color-border)" strokeWidth="7" />
        <circle
          cx="45" cy="45" r={r} fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
          style={{ transition: 'stroke-dasharray 600ms ease' }}
        />
        <text x="45" y="45" textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: 14, fontWeight: 800, fill: 'var(--color-text)', letterSpacing: '-0.02em' }}>
          {value}%
        </text>
      </svg>
      <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 500 }}>{label}</span>
    </div>
  )
}

export default function AlertsPage() {
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('all')
  const [levelFilter, setLevelFilter] = useState<AlertLevel | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<AlertType | 'all'>('all')
  const [alerts, setAlerts] = useState(alertRecords)

  const handleTransition = (id: string, next: AlertStatus) => {
    setAlerts(prev => prev.map(a =>
      a.id === id
        ? { ...a, status: next, handledAt: next === 'resolved' ? new Date().toLocaleString('zh-CN') : a.handledAt, handledBy: next === 'processing' ? '当前用户' : a.handledBy }
        : a
    ))
  }

  const filtered = alerts.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false
    if (levelFilter !== 'all' && a.level !== levelFilter) return false
    if (typeFilter !== 'all' && a.type !== typeFilter) return false
    return true
  })

  const pending = alerts.filter(a => a.status === 'pending').length
  const processing = alerts.filter(a => a.status === 'processing').length
  const resolved = alerts.filter(a => a.status === 'resolved').length
  const critical = alerts.filter(a => a.level === 'critical' && a.status !== 'resolved').length
  const resolutionRate = alerts.length > 0 ? Math.round((resolved / alerts.length) * 100) : 0
  const activeDeviceAlerts = alerts.filter(a => a.type === 'device' && a.status !== 'resolved').length
  const prioritizedAlerts = useMemo(() => sortAlertsByPriority(filtered).slice(0, 4), [filtered])
  const sortedAlerts = useMemo(() => sortAlertsByPriority(filtered), [filtered])
  const topAlert = prioritizedAlerts[0] ?? null
  const openAlertAiSummary = getOpenAlertAiSummary()
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference', entityId?: string, entityName?: string) => buildAiAssistantHref({
    source: 'alerts-center',
    entityId: entityId ?? 'alerts-board',
    entityName: entityName ?? '报警中心',
    focus,
    target,
  })

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="报警中心"
        subtitle={`共 ${alerts.length} 条记录 · ${critical} 例紧急待处理`}
      />

      <WorkflowOverviewCard
        eyebrow="Alert Operations"
        title="实时告警总览"
        description="先处理待处理紧急告警，再跟进处理中事件，最后回看已解决记录的复盘质量，避免值班视角只看到数量看不到处置顺序。"
        badge={<Tag variant="warning">Response First</Tag>}
        metrics={[
          { label: '待处理告警', value: pending, hint: '需要值班人员立即接单', tone: pending > 0 ? 'danger' : 'success' },
          { label: '处理中告警', value: processing, hint: '需要跟踪处置进度', tone: processing > 0 ? 'warning' : 'neutral' },
          { label: '未闭环紧急', value: critical, hint: '跌倒与健康异常优先', tone: critical > 0 ? 'danger' : 'success' },
          { label: '解决率', value: `${resolutionRate}%`, hint: `设备类未闭环 ${activeDeviceAlerts} 条`, tone: resolutionRate >= 70 ? 'success' : 'warning' },
        ]}
        signals={[
          { label: topAlert ? `当前最高优先：${topAlert.elderlyName} · ${ALERT_TYPE_LABELS[topAlert.type]}` : '当前无告警需要优先处理', tone: topAlert?.level === 'critical' ? 'danger' : 'info' },
          { label: openAlertAiSummary.summary, tone: 'info' },
          { label: `筛选结果 ${filtered.length} 条`, tone: 'neutral' },
        ]}
        actions={
          <>
            <Link href="/alerts/history" className="btn btn-secondary btn-sm">查看历史记录</Link>
            <Link href={buildAiHref('alert-escalation', 'inference')} className="btn btn-secondary btn-sm">查看 AI 解释</Link>
          </>
        }
      />

      {/* KPI stats */}
      <div className="kpi-grid">
        <StatCard icon={<AlertTriangle size={18} />} label="待处理" value={pending} sub="需立即处理" color="danger" />
        <StatCard icon={<Clock size={18} />} label="处理中" value={processing} sub="正在处理" color="warning" />
        <StatCard icon={<CheckCircle2 size={18} />} label="已解决" value={resolved} sub="本月累计" color="success" />
        <StatCard icon={<AlertTriangle size={18} />} label="紧急告警" value={critical} sub="需关注" color="danger" />
      </div>

      {/* Status distribution summary */}
      <div className="alerts-summary-bar">
        <div className="alerts-summary-left">
          <DonutChart value={Math.round((resolved / alerts.length) * 100)} color="var(--color-success)" label="解决率" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: '待处理', value: pending, color: 'var(--color-danger)' },
              { label: '处理中', value: processing, color: 'var(--color-warning)' },
              { label: '已解决', value: resolved, color: 'var(--color-success)' },
            ].map(item => (
              <div key={item.label} className="donut-legend-row">
                <span className="donut-legend-dot" style={{ background: item.color }} />
                <span className="donut-legend-text">{item.label}</span>
                <span className="donut-legend-num">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="alerts-summary-right">
          <div className="alerts-summary-title">今日趋势</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 48 }}>
            {[3, 5, 4, 7, 6, 4, 10].map((h, i) => (
              <div key={i}
                className="alerts-trend-bar"
                style={{
                  height: `${(h / 10) * 100}%`,
                  background: i === 6 ? 'var(--color-danger)' : 'var(--color-primary)',
                  opacity: i === 6 ? 1 : 0.5,
                }}
                title={`${h}条`}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['一', '二', '三', '四', '五', '六', '日'].map((d, i) => (
              <span key={i} className="alerts-trend-label">{d}</span>
            ))}
          </div>
        </div>
      </div>

      <DataCard
        icon={<Bot size={16} />}
        title="AI 事件解释面板"
        subtitle="报警中心当前优先承接解释与升级建议，不允许 AI 直接关闭高等级事件。"
        badge={<Tag variant="warning">人工兜底</Tag>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>待解释事件</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 800, color: 'var(--color-text)' }}>{openAlertAiSummary.total}</div>
            <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{openAlertAiSummary.summary}</div>
          </div>
          <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>紧急升级提醒</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 800, color: 'var(--color-danger)' }}>{openAlertAiSummary.critical}</div>
            <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{openAlertAiSummary.deviceSummary}</div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <Link href={buildAiHref('alert-escalation', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
        </div>
      </DataCard>

      <div className="dashboard-grid-2" style={{ marginBottom: 16 }}>
        <DataCard
          icon={<AlertTriangle size={16} />}
          title="处置优先队列"
          subtitle="按待处理、等级、类型和发生时间统一排序，先暴露真正要先处理的告警。"
          badge={<Tag variant="warning">Priority Queue</Tag>}
        >
          <div style={{ display: 'grid', gap: 10 }}>
            {prioritizedAlerts.map(alert => {
              const actionLabel = alert.status === 'pending'
                ? '立即接单并确认现场响应人'
                : alert.status === 'processing'
                  ? '继续跟进处置与结果回填'
                  : '已解决，建议进入复盘归档'

              return (
                <div key={alert.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{alert.elderlyName} · {ALERT_TYPE_LABELS[alert.type]}</div>
                      <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{alert.roomNumber}{alert.deviceName ? ` · ${alert.deviceName}` : ''} · {alert.occurredAt}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Tag variant={LEVEL_TAG[alert.level] as 'danger' | 'warning' | 'info'}>{ALERT_LEVEL_LABELS[alert.level]}</Tag>
                      <Tag variant={STATUS_TAG[alert.status] as 'danger' | 'warning' | 'success'}>{ALERT_STATUS_LABELS[alert.status]}</Tag>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>{actionLabel}</div>
                </div>
              )
            })}
          </div>
        </DataCard>

        <DataCard
          icon={<ChevronRight size={16} />}
          title="推荐处理路径"
          subtitle="让报警中心从看板页面直接进入值班动作链路。"
        >
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              '先接单待处理的紧急事件，优先确认跌倒和健康异常。',
              '再跟踪处理中事件，补齐处理结果与责任人信息。',
              '最后进入历史页回看已解决记录，做班次复盘。',
            ].map(item => (
              <div key={item} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>{item}</div>
            ))}
          </div>
        </DataCard>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <span className="filter-bar-label">状态</span>
        {(['all', 'pending', 'processing', 'resolved'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
          >
            {s === 'all' ? '全部' : ALERT_STATUS_LABELS[s]}
          </button>
        ))}

        <span className="filter-bar-label" style={{ marginLeft: 8 }}>等级</span>
        {(['all', 'critical', 'warning', 'info'] as const).map(l => (
          <button
            key={l}
            onClick={() => setLevelFilter(l)}
            className={`btn btn-sm ${levelFilter === l ? 'btn-primary' : 'btn-ghost'}`}
          >
            {l === 'all' ? '全部' : ALERT_LEVEL_LABELS[l]}
          </button>
        ))}

        <span className="filter-bar-label" style={{ marginLeft: 8 }}>类型</span>
        {(['all', 'fall', 'device', 'health', 'call'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-ghost'}`}
          >
            {t === 'all' ? '全部' : ALERT_TYPE_LABELS[t]}
          </button>
        ))}

        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-muted)' }}>
          共 {filtered.length} 条
        </span>
      </div>

      {/* Alert cards grid */}
      <div className="alert-grid">
        {sortedAlerts.map(alert => (
          <AlertCard key={alert.id} alert={alert} onTransition={handleTransition} />
        ))}
      </div>
    </div>
  )
}
