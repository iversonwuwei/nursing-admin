"use client";

import { DataCard, InteractionRailLayout, PageHelpCard, Tag, WorkflowOverviewCard } from "@/components/nh";
import { getDeviceAiInsights, getDeviceAiOverview } from "@/lib/mock/admin-ai";
import { sortMonitorPointsByPriority } from "@/lib/resource-operations-priority";
import {
  Activity,
  AlertTriangle,
  Battery,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock,
  RefreshCw,
  Thermometer,
  TrendingUp,
  Wifi,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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

type MonitorPoint = (typeof MONITOR_POINTS)[number]

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
  const aiInsights = getDeviceAiInsights(MONITOR_POINTS, ALERT_HISTORY)
  const aiOverview = getDeviceAiOverview(MONITOR_POINTS, ALERT_HISTORY)
  const averageBattery = Math.round(MONITOR_POINTS.reduce((sum, item) => sum + item.metrics.battery, 0) / MONITOR_POINTS.length)
  const sortedMonitorPoints = sortMonitorPointsByPriority(MONITOR_POINTS as readonly MonitorPoint[])
  const attentionDevices = sortedMonitorPoints.slice(0, 4)
  const displayMonitorPoints = sortedMonitorPoints
  const helpHref = '/equipment/help'

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1200)
  }

  const getEqCardClass = (eq: MonitorPoint) => {
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

      <WorkflowOverviewCard
        eyebrow="Realtime Device Operations"
        title="实时监控总览"
        description="优先处理离线、告警和低电量设备，减少护理监测盲区，再回到全量设备看板。"
        badge={<Tag variant="info">Live Monitor</Tag>}
        metrics={[
          { label: "在线设备", value: STATS.online, hint: `总设备 ${STATS.total} 台`, tone: "success" },
          { label: "离线设备", value: STATS.offline, hint: "需优先排查网络或电源", tone: STATS.offline > 0 ? "danger" : "neutral" },
          { label: "当前告警", value: STATS.alerts, hint: `近 ${ALERT_HISTORY.length} 条告警记录`, tone: STATS.alerts > 0 ? "warning" : "neutral" },
          { label: "平均电量", value: `${averageBattery}%`, hint: "用于判断巡检与充电压力", tone: averageBattery < 60 ? "warning" : "info" },
        ]}
        signals={[
          { label: aiInsights[0] ? `${aiInsights[0].deviceName}：${aiInsights[0].action}` : "暂无 AI 巡检提醒", tone: aiInsights[0]?.severity === "高风险" ? "danger" : "warning" },
          { label: STATS.offline > 0 ? `当前有 ${STATS.offline} 台设备离线，需要到场排查` : "当前没有离线设备阻塞监测", tone: STATS.offline > 0 ? "danger" : "success" },
          { label: ALERT_HISTORY[0] ? `最近告警 ${ALERT_HISTORY[0].time} · ${ALERT_HISTORY[0].msg}` : "暂无告警历史", tone: ALERT_HISTORY[0]?.type === "danger" ? "danger" : "info" },
        ]}
        actions={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/devices/status" className="btn btn-secondary btn-sm">查看状态总览</Link>
            <Link href="/devices" className="btn btn-secondary btn-sm">返回设备列表</Link>
          </div>
        }
      />

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

      <InteractionRailLayout
        main={(
          <>
            <DataCard
              icon={<AlertTriangle size={18} />}
              title="巡检优先队列"
              subtitle="把需要立刻到场或补电的设备直接排到最前。"
              badge={<Tag variant="warning">Priority Queue</Tag>}
            >
              <div style={{ display: "grid", gap: 10 }}>
                {attentionDevices.map((device) => {
                  const isCriticalDevice = device.status === "offline"
                  const actionLabel = isCriticalDevice
                    ? `立即到场排查${device.alert?.msg ? `：${device.alert.msg}` : '网络、电源与设备本体状态'}`
                    : device.alert?.level === "warning"
                      ? `本班次内完成处理：${device.alert.msg}`
                      : "安排常规巡检并关注续航"

                  return (
                    <div key={device.id} style={{ borderRadius: 12, border: "1px solid var(--color-border)", padding: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-text)" }}>{device.name}</div>
                          <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.6, color: "var(--color-muted)" }}>{device.room} · 电量 {device.metrics.battery}%</div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <Tag variant={device.status === "offline" ? "danger" : "success"}>{device.status === "online" ? "在线" : "离线"}</Tag>
                          {device.alert ? <Tag variant={device.alert.level === "danger" ? "danger" : "warning"}>{device.alert.msg}</Tag> : null}
                        </div>
                      </div>
                      <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.6, color: "var(--color-text)" }}>{actionLabel}</div>
                    </div>
                  )
                })}
              </div>
            </DataCard>

            <div className="page-grid-2">
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
                  {displayMonitorPoints.map((eq) => (
                    <div key={eq.id} className={getEqCardClass(eq)}>
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

                      {eq.status === "offline" ? (
                        <div style={{ fontSize: 13, color: "var(--color-danger)", fontWeight: 500, padding: "8px 0" }}>
                          设备已离线，请检查网络或电源
                        </div>
                      ) : (
                        <div className="metric-grid">
                          {eq.metrics.hr !== null && <MetricCard icon={Activity} label="心率" value={eq.metrics.hr} unit="bpm" color="var(--color-primary)" />}
                          {eq.metrics.bp !== null && <MetricCard icon={TrendingUp} label="血压" value={eq.metrics.bp} unit="mmHg" color="var(--color-info)" />}
                          {eq.metrics.temp !== null && <MetricCard icon={Thermometer} label="体温" value={eq.metrics.temp} unit="℃" color="var(--color-warning)" />}
                          {eq.metrics.spo2 !== null && <MetricCard icon={Wifi} label="血氧" value={eq.metrics.spo2} unit="%" color="var(--color-success)" />}
                          <MetricCard icon={Battery} label="电量" value={eq.metrics.battery} unit="%" color={eq.metrics.battery < 30 ? "var(--color-danger)" : "var(--color-success)"} />
                          <MetricCard icon={Clock} label="运行时长" value={eq.runtimeHours} unit="h" color="var(--color-muted)" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </DataCard>

              <DataCard icon={<AlertTriangle size={18} />} title="告警记录" subtitle={`最近${ALERT_HISTORY.length}条`}>
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
          </>
        )}
        rail={(
          <>
            <DataCard icon={<Bot size={18} />} title="推荐处理路径" subtitle="先恢复监测连续性，再回看告警趋势与设备分布。">
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  "先排查离线设备，恢复基础监测连续性。",
                  "再处理高风险告警和低电量设备，避免班次内新增盲区。",
                  "最后结合 AI 建议回看重复告警与设备部署位置。",
                ].map((item) => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>

            <DataCard icon={<Bot size={16} />} title="AI 设备解释" subtitle="优先解释监测盲区与重复告警来源，避免只看到设备状态不看到护理影响。">
              <div style={{ display: "grid", gap: 10 }}>
                {aiInsights.map(item => (
                  <div key={item.deviceId} style={{ borderRadius: 12, border: "1px solid var(--color-border)", padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-text)" }}>{item.deviceName}</div>
                        <div style={{ marginTop: 4, fontSize: 12, color: "var(--color-muted)" }}>{item.room}</div>
                      </div>
                      <span className={`tag ${item.severity === "高风险" ? "danger" : "warning"}`}>{item.severity}</span>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.6, color: "var(--color-text)" }}>{item.summary}</div>
                    <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: "var(--color-muted)" }}>{item.action}</div>
                    <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-primary)", fontWeight: 600 }}>置信度 {item.confidence}%</div>
                  </div>
                ))}
              </div>
            </DataCard>

            <DataCard icon={<AlertTriangle size={16} />} title="AI 巡检建议" subtitle="把设备告警翻译成班次动作建议，不直接替代工程或护理判断。">
              <div style={{ display: "grid", gap: 10 }}>
                {aiOverview.map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整设备监控说明迁移到显式帮助页"
              summary="设备监控页现在优先展示巡检优先队列、实时监控和告警记录，解释型内容统一后置。"
              items={[
                '先看优先队列，再处理实时监控与告警记录。',
                'AI 建议只用于辅助巡检排序，不替代现场排查。',
                '若需要完整说明，进入设备帮助页查看。',
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
