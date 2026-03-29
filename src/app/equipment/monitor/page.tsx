"use client";

import { useState } from "react";
import Link from "next/link";
import { DataCard } from "@/components/nh";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Wifi,
  Thermometer,
  Battery,
  Clock,
  TrendingUp,
  ChevronRight,
  RefreshCw,
  XCircle,
  type LucideIcon,
} from "lucide-react";

// 模拟实时监控数据
const MONITOR_POINTS = [
  { id: "EQ-001", name: "心电监护仪 #1", room: "201-1床", status: "online", runtimeHours: 64, metrics: { hr: 72, bp: "120/80", temp: 36.5, spo2: 98, battery: 85 }, alert: null },
  { id: "EQ-002", name: "心电监护仪 #2", room: "201-2床", status: "online", runtimeHours: 52, metrics: { hr: 68, bp: "118/76", temp: 36.4, spo2: 97, battery: 62 }, alert: null },
  { id: "EQ-003", name: "血压监测仪", room: "202-1床", status: "online", runtimeHours: 31, metrics: { hr: null, bp: "135/88", temp: null, spo2: null, battery: 45 }, alert: { level: "warning", msg: "电量低于50%" } },
  { id: "EQ-004", name: "智能床垫传感器", room: "203-1床", status: "offline", runtimeHours: 0, metrics: { hr: null, bp: null, temp: null, spo2: null, battery: 0 }, alert: { level: "danger", msg: "设备离线" } },
  { id: "EQ-005", name: "血糖监测仪", room: "204-1床", status: "online", runtimeHours: 80, metrics: { hr: null, bp: null, temp: null, spo2: null, battery: 92 }, alert: null },
  { id: "EQ-006", name: "呼吸监测仪", room: "205-1床", status: "online", runtimeHours: 43, metrics: { hr: 16, bp: null, temp: 36.6, spo2: 99, battery: 78 }, alert: null },
] as const

const STATS = {
  total: MONITOR_POINTS.length,
  online: MONITOR_POINTS.filter(e => e.status === "online").length,
  offline: MONITOR_POINTS.filter(e => e.status === "offline").length,
  alerts: MONITOR_POINTS.filter(e => e.alert).length,
}

const ALERT_HISTORY = [
  { time: "15:42", device: "血压监测仪 #3", room: "202-2床", type: "warning", msg: "电量低于50%" },
  { time: "15:31", device: "智能床垫传感器", room: "203-1床", type: "danger", msg: "设备离线超过10分钟" },
  { time: "14:58", device: "心电监护仪 #1", room: "201-1床", type: "info", msg: "心率异常波动，已自动记录" },
  { time: "14:20", device: "体温监测仪", room: "206-1床", type: "warning", msg: "体温持续偏高" },
]

function MetricCard({ icon: Icon, label, value, unit, color }: {
  icon: LucideIcon; label: string; value: number | string | null; unit: string; color: string
}) {
  if (value === null) return null
  return (
    <div className="metric-item">
      <Icon size={14} style={{ color, flexShrink: 0 }} />
      <span className="metric-item-label">{label}</span>
      <span className="metric-item-value">{value}</span>
      <span className="metric-item-unit">{unit}</span>
    </div>
  )
}

function AlertBadge({ level }: { level: string }) {
  if (level === "warning") return <span className="alert-badge alert-badge-warning">预警</span>
  if (level === "danger") return <span className="alert-badge alert-badge-danger">告警</span>
  return null
}

export default function MonitorPage() {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1200)
  }

  const getEqCardClass = (eq: typeof MONITOR_POINTS[0]) => {
    const classes = ["eq-card"]
    if (eq.status === "offline") classes.push("eq-card-offline")
    if (eq.alert?.level === "danger") classes.push("eq-card-alert-danger")
    if (eq.alert?.level === "warning") classes.push("eq-card-alert-warning")
    return classes.join(" ")
  }

  const getIconBoxClass = (status: string) =>
    status === "offline" ? "eq-card-icon-box eq-card-offline-icon-box" : "eq-card-icon-box eq-card-online-icon-box"

  const getStatusBadgeClass = (status: string) =>
    status === "online" ? "status-badge status-badge-online" : "status-badge status-badge-offline"

  const getAlertMsgClass = (type: string) =>
    type === "danger" ? "alert-history-msg danger" : type === "warning" ? "alert-history-msg warning" : "alert-history-msg info"

  const getAlertIconClass = (type: string) => {
    if (type === "danger") return "alert-history-icon"
    if (type === "warning") return "alert-history-icon"
    return "alert-history-icon"
  }

  return (
    <div className="page-root animate-fade-up">

      {/* Page header */}
      <div className="flex-between" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ letterSpacing: "-0.03em" }}>设备监控</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>
            共 {STATS.total} 台设备 · {STATS.online} 在线 · {STATS.offline} 离线 · {STATS.alerts} 告警
          </p>
        </div>
        <div className="flex-center" style={{ gap: 8 }}>
          <Link href="/devices" className="btn btn-secondary btn-sm">设备列表</Link>
          <button
            className="btn btn-secondary btn-sm flex-center"
            onClick={handleRefresh}
            style={{ gap: 6 }}
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "刷新中" : "刷新数据"}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="monitor-grid-4" style={{ marginBottom: 16 }}>
        {[
          { label: "监控设备", value: STATS.total, icon: <Activity size={20} />, colorClass: "primary" },
          { label: "在线", value: STATS.online, icon: <CheckCircle2 size={20} />, colorClass: "success" },
          { label: "离线", value: STATS.offline, icon: <XCircle size={20} />, colorClass: "danger" },
          { label: "告警", value: STATS.alerts, icon: <AlertTriangle size={20} />, colorClass: "warning" },
        ].map(({ label, value, icon, colorClass }) => (
          <div key={label} className="data-card" style={{ padding: "16px 20px" }}>
            <div className="flex-between">
              <div>
                <div style={{ fontSize: 12, color: "var(--color-muted)", fontWeight: 500 }}>{label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.03em", marginTop: 4 }}>{value}</div>
              </div>
              <div className={`kpi-stat-icon-box`} style={{
                background: colorClass === "primary" ? "var(--color-primary-light)"
                  : colorClass === "success" ? "rgba(34,197,94,0.1)"
                  : colorClass === "danger" ? "rgba(239,68,68,0.1)"
                  : "rgba(245,158,11,0.1)",
                color: colorClass === "primary" ? "var(--color-primary)"
                  : colorClass === "success" ? "var(--color-success)"
                  : colorClass === "danger" ? "var(--color-danger)"
                  : "var(--color-warning)",
              }}>
                {icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="page-grid-2">

        {/* 监控设备列表 */}
        <DataCard
          icon={<Activity size={18} />}
          title="实时监控"
          subtitle="设备状态实时更新"
          action={
            <div className="live-badge">
              <span className="live-dot" />
              <span style={{ fontSize: 12, color: "var(--color-muted)" }}>LIVE</span>
            </div>
          }
        >
          <div style={{ padding: 12 }} className="monitor-eq-grid">
            {MONITOR_POINTS.map((eq) => (
              <div key={eq.id} className={getEqCardClass(eq)}>
                {/* Header */}
                <div className="eq-card-header">
                  <div className="flex-center" style={{ gap: 10 }}>
                    <div className={getIconBoxClass(eq.status)}>
                      {eq.status === "offline"
                        ? <XCircle size={18} style={{ color: "var(--color-danger)" }} />
                        : <Wifi size={18} style={{ color: "var(--color-primary)" }} />
                      }
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>{eq.name}</div>
                      <div style={{ fontSize: 12, color: "var(--color-muted)" }}>{eq.room}</div>
                    </div>
                  </div>
                  <div className="flex-center" style={{ gap: 6 }}>
                    {eq.alert && <AlertBadge level={eq.alert.level} />}
                    <span className={getStatusBadgeClass(eq.status)}>
                      {eq.status === "online" ? "在线" : "离线"}
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                {eq.status === "offline" ? (
                  <div style={{ fontSize: 13, color: "var(--color-danger)", fontWeight: 500, padding: "8px 0" }}>
                    设备已离线，请检查网络或电源
                  </div>
                ) : (
                  <div className="metric-grid">
                    {eq.metrics.hr !== null && (
                      <MetricCard icon={Activity} label="心率" value={eq.metrics.hr} unit="bpm" color="var(--color-primary)" />
                    )}
                    {eq.metrics.bp !== null && (
                      <MetricCard icon={TrendingUp} label="血压" value={eq.metrics.bp} unit="mmHg" color="var(--color-info)" />
                    )}
                    {eq.metrics.temp !== null && (
                      <MetricCard icon={Thermometer} label="体温" value={eq.metrics.temp} unit="℃" color="var(--color-warning)" />
                    )}
                    {eq.metrics.spo2 !== null && (
                      <MetricCard icon={Wifi} label="血氧" value={eq.metrics.spo2} unit="%" color="var(--color-success)" />
                    )}
                    <MetricCard icon={Battery} label="电量" value={eq.metrics.battery} unit="%" color={eq.metrics.battery < 30 ? "var(--color-danger)" : "var(--color-success)"} />
                    <MetricCard icon={Clock} label="运行时长" value={eq.runtimeHours} unit="h" color="var(--color-muted)" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </DataCard>

        {/* 告警记录 */}
        <DataCard
          icon={<AlertTriangle size={18} />}
          title="告警记录"
          subtitle={`最近${ALERT_HISTORY.length}条`}
        >
          <div style={{ padding: "8px 12px" }}>
            {ALERT_HISTORY.map((alert, i) => (
              <div key={i} className="alert-history-item">
                <div className={getAlertIconClass(alert.type)}>
                  {alert.type === "danger"
                    ? <XCircle size={14} style={{ color: "var(--color-danger)" }} />
                    : alert.type === "warning"
                    ? <AlertTriangle size={14} style={{ color: "var(--color-warning)" }} />
                    : <Activity size={14} style={{ color: "var(--color-info)" }} />
                  }
                </div>
                <div className="alert-history-content">
                  <div className="alert-history-meta">
                    <span className="alert-history-name">{alert.device}</span>
                    <span className="alert-history-time">{alert.time}</span>
                  </div>
                  <div className="alert-history-room">{alert.room}</div>
                  <div className={getAlertMsgClass(alert.type)}>{alert.msg}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: "8px 12px 12px" }}>
            <Link href="/devices/status" className="btn btn-ghost btn-sm flex-center" style={{ width: "100%", justifyContent: "center" }}>
              查看全部 <ChevronRight size={13} />
            </Link>
          </div>
        </DataCard>
      </div>

    </div>
  )
}
