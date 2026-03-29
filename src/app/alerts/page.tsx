'use client'

import { useState } from 'react'
import { StatCard, Tag, PageHeader } from '@/components/nh'
import {
  alertRecords,
  ALERT_TYPE_LABELS, ALERT_LEVEL_LABELS, ALERT_STATUS_LABELS,
  type AlertRecord, type AlertLevel, type AlertStatus, type AlertType,
} from '@/lib/data/alerts-data'
import {
  AlertTriangle, Bell, Shield, Phone, CheckCircle2,
  Clock, User, ChevronRight, Activity, Monitor, PhoneIncoming,
} from 'lucide-react'

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

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="报警中心"
        subtitle={`共 ${alerts.length} 条记录 · ${critical} 例紧急待处理`}
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
        {filtered.map(alert => (
          <AlertCard key={alert.id} alert={alert} onTransition={handleTransition} />
        ))}
      </div>
    </div>
  )
}
