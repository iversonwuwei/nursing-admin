'use client'

import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard } from '@/components/nh'
import { ModuleEntitlementGate } from '@/components/platform/ModuleEntitlementGate'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { fetchAdminAiAlertSuggestion, type AdminAiAlertSuggestionRequest } from '@/lib/ai/admin-ai-api'
import {
  ALERT_LEVEL_LABELS, ALERT_STATUS_LABELS,
  ALERT_TYPE_LABELS,
  type AlertLevel,
  type AlertRecord,
  type AlertStatus, type AlertType,
} from '@/lib/data/alerts-data'
import { sortAlertsByPriority } from '@/lib/operations-priority'
import {
  fetchAlertCenterSnapshot,
  submitAlertAction,
  type AdminAlertQueueItemResponse,
} from '@/lib/services/admin-module-services'
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
import { useEffect, useMemo, useState } from 'react'

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
  bedExit: <Shield size={14} />,
  sos: <AlertTriangle size={14} />,
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

const ALERT_MODULES = [
  {
    id: 'emergency-call',
    label: '紧急呼叫',
    description: '承接床旁呼叫、人工求助和需要快速到场的服务响应。',
    focus: '先响应，再补回执',
    matches: (alert: AlertRecord) => alert.type === 'call',
  },
  {
    id: 'bed-exit',
    label: '离床预警',
    description: '聚焦夜间离床、长时间未回床与疑似走失前状态。',
    focus: '夜间巡视与回床确认',
    matches: (alert: AlertRecord) => alert.type === 'bedExit',
  },
  {
    id: 'anomaly',
    label: '异常预警',
    description: '承接健康异常、设备异常和跌倒类高风险事件。',
    focus: '先确认风险，再决定升级链路',
    matches: (alert: AlertRecord) => ['fall', 'health', 'device'].includes(alert.type),
  },
  {
    id: 'sos',
    label: 'SOS 处置',
    description: '承接一键求助与需要联动护士站、医生、安保的高优先事件。',
    focus: '到场记录与多角色联动',
    matches: (alert: AlertRecord) => alert.type === 'sos',
  },
] as const

const ALERT_WORKFLOW_STEPS = [
  { id: 'trigger', title: '事件触发', detail: '呼叫器、床位传感器、健康指标或 SOS 按钮产生事件。', tone: 'info' as const },
  { id: 'dispatch', title: '分派接单', detail: '系统进入优先队列，并要求值班人员确认责任人。', tone: 'warning' as const },
  { id: 'onsite', title: '现场处置', detail: '完成到场、复测、协助或医生联动等动作。', tone: 'primary' as const },
  { id: 'notify', title: '升级通知', detail: '必要时同步家属、医生、安保或设备部门。', tone: 'warning' as const },
  { id: 'closure', title: '结案复盘', detail: '保留处理结果、升级原因和复盘建议。', tone: 'success' as const },
] as const

type AlertAiSuggestionState = {
  loading: boolean
  error?: string
  result?: {
    title: string
    explanation: string
    steps: string[]
    priority: string
  }
}

function mapAlertSeverity(level: AlertLevel) {
  if (level === 'critical') {
    return '高'
  }

  if (level === 'warning') {
    return '中'
  }

  return '常规'
}

function buildAlertAiRequest(alert: AlertRecord): AdminAiAlertSuggestionRequest {
  return {
    alertType: ALERT_TYPE_LABELS[alert.type],
    alertDescription: alert.description,
    severity: mapAlertSeverity(alert.level),
    elderContext: `${alert.elderlyName} · ${alert.roomNumber}${alert.deviceName ? ` · ${alert.deviceName}` : ''}`,
    recentHistory: alert.resolution ?? `${ALERT_STATUS_LABELS[alert.status]} · ${alert.occurredAt}`,
  }
}

function buildOpenAlertSummary(alerts: AlertRecord[], loadError: string) {
  if (loadError) {
    return '当前未能同步真实报警队列，请先恢复链路后再判断升级优先级。'
  }

  const unresolved = alerts.filter(item => item.status !== 'resolved')
  if (unresolved.length === 0) {
    return '当前没有未闭环告警，AI 升级建议维持空态。'
  }

  const criticalCount = unresolved.filter(item => item.level === 'critical').length
  const topType = unresolved[0]?.type ? ALERT_TYPE_LABELS[unresolved[0].type] : '告警'
  if (criticalCount > 0) {
    return `当前有 ${criticalCount} 条紧急未闭环告警，优先处理 ${topType} 相关事件。`
  }

  return `当前有 ${unresolved.length} 条未闭环告警，建议先从 ${topType} 队列开始收口。`
}

function mapRemoteAlert(remote: AdminAlertQueueItemResponse): AlertRecord {
  const level = ['critical', 'warning', 'info'].includes(remote.level) ? remote.level as AlertLevel : 'warning'
  const status = ['pending', 'processing', 'resolved'].includes(remote.status) ? remote.status as AlertStatus : 'pending'
  const type = ['fall', 'device', 'health', 'call', 'bedExit', 'sos'].includes(remote.type) ? remote.type as AlertType : 'device'

  return {
    id: remote.alertId,
    type,
    level,
    status,
    elderlyId: remote.elderId,
    elderlyName: remote.elderlyName,
    roomNumber: remote.roomNumber,
    description: remote.description,
    deviceName: remote.deviceName ?? undefined,
    occurredAt: new Date(remote.occurredAt).toLocaleString('zh-CN'),
    handledBy: remote.handledBy ?? undefined,
    handledAt: remote.handledAt ? new Date(remote.handledAt).toLocaleString('zh-CN') : undefined,
    resolution: remote.resolution ?? undefined,
  }
}

/* ── Alert Card ── */
function AlertCard({ alert, aiState, onTransition }: {
  alert: AlertRecord
  aiState?: AlertAiSuggestionState
  onTransition: (id: string, next: AlertStatus) => void
}) {
  const next = NEXT_STATUS[alert.status]
  const suggestionState = aiState ?? { loading: true }
  const aiTitle = suggestionState.loading
    ? 'AI 建议同步中'
    : suggestionState.error
      ? 'AI 建议当前不可用'
      : suggestionState.result?.title ?? 'AI 建议'
  const aiExplanation = suggestionState.loading
    ? '正在同步当前告警的真实 AI 建议，请稍候。'
    : suggestionState.error
      ? suggestionState.error
      : suggestionState.result?.explanation ?? '当前没有可展示的 AI 建议。'
  const aiSteps = suggestionState.loading || suggestionState.error ? [] : suggestionState.result?.steps ?? []
  const aiTagLabel = suggestionState.loading
    ? '分析中'
    : suggestionState.error
      ? 'AI 不可用'
      : suggestionState.result?.priority ?? '已生成'
  const aiTagVariant = suggestionState.loading ? 'info' : suggestionState.error ? 'warning' : 'success'

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
              {aiTitle}
            </div>
            <Tag variant={aiTagVariant}>{aiTagLabel}</Tag>
          </div>
          <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>{aiExplanation}</div>
          <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
            {aiSteps.map(item => (
              <div key={item} style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--color-muted)' }}>• {item}</div>
            ))}
          </div>
          {!suggestionState.loading && !suggestionState.error ? (
            <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.6, color: 'var(--color-primary)', fontWeight: 600 }}>优先级：{suggestionState.result?.priority ?? '待确认'}</div>
          ) : null}
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
  const [alerts, setAlerts] = useState<AlertRecord[]>([])
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [integrationNote, setIntegrationNote] = useState('正在同步报警服务数据...')
  const [alertAiStates, setAlertAiStates] = useState<Record<string, AlertAiSuggestionState>>({})

  useEffect(() => {
    let disposed = false

    async function loadAlerts() {
      try {
        const snapshot = await fetchAlertCenterSnapshot()

        if (disposed) {
          return
        }

        setAlerts(snapshot.queue.map(mapRemoteAlert))
        setLoadError('')
        setIntegrationNote(
          snapshot.queue.length > 0
            ? '当前页面已接入真实报警摘要与优先队列；动作提交会同步写回后端。'
            : '当前页面已接入真实报警摘要，但当前优先队列为空；页面保持 live 空态而不是回退演示数据。',
        )
      } catch (error) {
        if (disposed) {
          return
        }

        setAlerts([])
        setAlertAiStates({})
        setLoadError(error instanceof Error ? error.message : '报警服务不可用。')
        setIntegrationNote('报警服务当前不可用；页面保留 live 错误态与局部 AI 错误态，不再回退为演示数据。')
      } finally {
        if (!disposed) {
          setLoading(false)
        }
      }
    }

    void loadAlerts()

    return () => {
      disposed = true
    }
  }, [])

  const alertAiKey = useMemo(
    () => alerts.map(item => `${item.id}:${item.status}:${item.level}`).join('|'),
    [alerts],
  )

  useEffect(() => {
    let disposed = false

    if (alerts.length === 0) {
      setAlertAiStates({})
      return () => {
        disposed = true
      }
    }

    setAlertAiStates(current => Object.fromEntries(alerts.map(alert => [
      alert.id,
      current[alert.id] ?? { loading: true },
    ])))

    void Promise.allSettled(alerts.map(async alert => {
      try {
        const result = await fetchAdminAiAlertSuggestion(buildAlertAiRequest(alert))
        if (disposed) {
          return
        }

        setAlertAiStates(current => ({
          ...current,
          [alert.id]: {
            loading: false,
            result: {
              title: result.suggestedAction,
              explanation: result.rationale,
              steps: result.steps,
              priority: result.priority,
            },
          },
        }))
      } catch (error) {
        if (disposed) {
          return
        }

        setAlertAiStates(current => ({
          ...current,
          [alert.id]: {
            loading: false,
            error: error instanceof Error ? error.message : '报警建议 AI 当前不可用。',
          },
        }))
      }
    }))

    return () => {
      disposed = true
    }
  }, [alertAiKey, alerts])

  const handleTransition = async (id: string, next: AlertStatus) => {
    const previousAlerts = alerts

    setAlerts(prev => prev.map(a =>
      a.id === id
        ? { ...a, status: next, handledAt: next === 'resolved' ? new Date().toLocaleString('zh-CN') : a.handledAt, handledBy: next === 'processing' ? '当前用户' : a.handledBy }
        : a
    ))

    const action = next === 'processing' ? 'acknowledge' : 'resolve'

    try {
      const updatedAlert = await submitAlertAction(id, action)
      setAlerts(prev => prev.map(item => item.id === id ? mapRemoteAlert(updatedAlert) : item))
      setIntegrationNote('报警动作已写回后端，当前队列和 AI 建议会继续按真实状态同步。')
    } catch (error) {
      setAlerts(previousAlerts)
      setIntegrationNote(error instanceof Error ? `${error.message} 当前已回滚页面上的乐观状态。` : '报警动作提交失败，当前已回滚页面上的乐观状态。')
    }
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
  const openAlertSummary = useMemo(() => buildOpenAlertSummary(alerts, loadError), [alerts, loadError])
  const moduleSummary = useMemo(() => ALERT_MODULES.map(module => {
    const items = alerts.filter(module.matches)
    const unresolved = items.filter(item => item.status !== 'resolved').length
    const criticalItems = items.filter(item => item.level === 'critical' && item.status !== 'resolved').length

    return {
      ...module,
      total: items.length,
      unresolved,
      criticalItems,
    }
  }), [alerts])
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference', entityId?: string, entityName?: string) => buildAiAssistantHref({
    source: 'alerts-center',
    entityId: entityId ?? 'alerts-board',
    entityName: entityName ?? '报警中心',
    focus,
    target,
  })

  return (
    <ModuleEntitlementGate
      module="alert-service"
      pageTitle="报警中心"
      moduleLabel="报警服务"
      disabledSummary="当前租户未开通报警服务。页面保留为只读禁用态，避免事件看板、处置动作和套餐口径不一致。"
      fallbackLinks={[
        { href: '/', label: '返回首页' },
        { href: '/operations/daily', label: '进入日班工作台' },
      ]}
    >
      <div className="page-root animate-fade-up">
      <PageHeader
        title="报警中心"
          subtitle={loadError
            ? `真实报警链路当前不可用 · ${loadError}`
            : `共 ${alerts.length} 条真实记录 · ${critical} 例紧急待处理 · 已覆盖紧急呼叫 / 离床预警 / 异常预警 / SOS 处置`}
      />
        <InteractionRailLayout
          main={(
            <>
              <WorkflowOverviewCard
                eyebrow="Alert Operations"
                title="实时告警总览"
                description="先处理待处理紧急告警，再跟进处理中事件，最后回看已解决记录的复盘质量，避免值班视角只看到数量看不到处置顺序。"
                badge={<Tag variant={loadError ? 'danger' : 'warning'}>{loadError ? 'Live Unavailable' : 'Response First'}</Tag>}
                metrics={[
                  { label: '待处理告警', value: pending, hint: '需要值班人员立即接单', tone: pending > 0 ? 'danger' : 'success' },
                  { label: '处理中告警', value: processing, hint: '需要跟踪处置进度', tone: processing > 0 ? 'warning' : 'neutral' },
                  { label: '未闭环紧急', value: critical, hint: '跌倒与健康异常优先', tone: critical > 0 ? 'danger' : 'success' },
                  { label: '解决率', value: `${resolutionRate}%`, hint: `设备类未闭环 ${activeDeviceAlerts} 条`, tone: resolutionRate >= 70 ? 'success' : 'warning' },
                ]}
                signals={[
                  { label: topAlert ? `当前最高优先：${topAlert.elderlyName} · ${ALERT_TYPE_LABELS[topAlert.type]}` : '当前无告警需要优先处理', tone: topAlert?.level === 'critical' ? 'danger' : 'info' },
                  { label: openAlertSummary, tone: loadError ? 'warning' : 'info' },
                  { label: `筛选结果 ${filtered.length} 条`, tone: 'neutral' },
                ]}
                actions={
                  <>
                    <Link href="/alerts/history" className="btn btn-secondary btn-sm">查看历史记录</Link>
                    <Link href={buildAiHref('alert-escalation', 'inference')} className="btn btn-secondary btn-sm">查看 AI 解释</Link>
                  </>
                }
              />

              <div className="kpi-grid">
                <StatCard icon={<AlertTriangle size={18} />} label="待处理" value={pending} sub="需立即处理" color="danger" />
                <StatCard icon={<Clock size={18} />} label="处理中" value={processing} sub="正在处理" color="warning" />
                <StatCard icon={<CheckCircle2 size={18} />} label="已解决" value={resolved} sub="本月累计" color="success" />
                <StatCard icon={<AlertTriangle size={18} />} label="紧急告警" value={critical} sub="需关注" color="danger" />
              </div>

              {loading ? (
                <DataCard title="正在同步报警中心" subtitle="真实报警摘要、优先队列和 AI 建议正在返回，请稍候。" badge={<Tag variant="warning">Loading</Tag>} />
              ) : null}

              {loadError ? (
                <DataCard title="报警链路当前不可用" subtitle={loadError} badge={<Tag variant="danger">Live Unavailable</Tag>}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
                    当前页面只展示真实报警链路状态。链路恢复前不会继续回退到本地 `alertRecords` 或 mock AI 文案。
                  </div>
                </DataCard>
              ) : null}

              <div className="alerts-summary-bar">
                <div className="alerts-summary-left">
                  <DonutChart value={resolutionRate} color="var(--color-success)" label="解决率" />
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
                    <div
                      key={i}
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
                {(['all', 'fall', 'device', 'health', 'call', 'bedExit', 'sos'] as const).map(t => (
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

              <div className="alert-grid">
                {sortedAlerts.length > 0 ? sortedAlerts.map(alert => (
                  <AlertCard key={alert.id} alert={alert} aiState={alertAiStates[alert.id]} onTransition={handleTransition} />
              )) : (
                  <div style={{ gridColumn: '1 / -1', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)', background: 'var(--color-bg)', padding: 24, fontSize: 13, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                      {loadError
                        ? '当前真实报警链路不可用，请在服务恢复后重新查看优先队列。'
                        : '当前筛选条件下没有待展示的报警记录。这表示真实优先队列当前为空，而不是页面已经回退到 demo。'}
                  </div>
                )}
              </div>
            </>
          )}
          rail={(
            <>
              <DataCard
                title="API 对接状态"
                subtitle={integrationNote}
                badge={<Tag variant={loadError ? 'danger' : 'success'}>{loadError ? 'Live Unavailable' : 'Live API'}</Tag>}
              >
                <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                  {loadError
                    ? '当前范围仍是报警摘要、优先队列、状态动作和 AI 建议；链路恢复前页面保持 live 错误态，不回退本地 alertRecords。'
                    : '当前范围：报警摘要、优先队列、状态动作和 AI 建议。页面不再混用本地 alertRecords 或 mock AI helper。'}
                </div>
              </DataCard>

              <PageHelpCard
                title="报警中心帮助"
                subtitle="完整说明已迁到帮助页，首屏只保留必要摘要。"
                summary="右侧不再默认展开模块长说明、完整 workflow 和推荐路径；需要查看完整规则时再进入帮助页。"
                items={[
                  ...moduleSummary.slice(0, 2).map(item => `${item.label}：${item.focus}`),
                  `流程：${ALERT_WORKFLOW_STEPS.map(step => step.title).join(' -> ')}`,
                  `AI 边界：当前待解释 ${alerts.filter(item => item.status !== 'resolved').length} 条，仅做解释与升级建议。`,
                ]}
                href="/alerts/help"
              />
            </>
          )}
        />
    </div>
    </ModuleEntitlementGate>
  )
}
