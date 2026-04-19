"use client"

import { DataCard, EmptyState, InteractionRailLayout, PageHelpCard, Tag, WorkflowOverviewCard } from "@/components/nh"
import { buildEquipmentAlerts, buildEquipmentMonitorPoints, type EquipmentMonitorPoint } from "@/lib/equipment/equipment-live-derivations"
import { getDeviceAiInsights, getDeviceAiOverview } from "@/lib/mock/admin-ai"
import { fetchAdminEquipment, type AdminEquipmentRecord } from "@/lib/services/admin-operations-services"
import { Activity, AlertTriangle, Battery, Bot, CheckCircle2, ChevronRight, Clock, RefreshCw, Thermometer, TrendingUp, Wifi, XCircle, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

function MetricCard({ icon: Icon, label, value, unit, color }: {
  icon: LucideIcon
  label: string
  value: number | string | null
  unit: string
  color: string
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

function getEqCardClass(eq: EquipmentMonitorPoint) {
  const classes = ["eq-card"]
  if (eq.status === "offline") classes.push("eq-card-offline")
  if (eq.alert?.level === "danger") classes.push("eq-card-alert-danger")
  if (eq.alert?.level === "warning") classes.push("eq-card-alert-warning")
  return classes.join(" ")
}

function getIconBoxClass(status: EquipmentMonitorPoint['status']) {
  return status === "offline" ? "eq-card-icon-box eq-card-offline-icon-box" : "eq-card-icon-box eq-card-online-icon-box"
}

function getStatusBadgeClass(status: EquipmentMonitorPoint['status']) {
  return status === "online" ? "status-badge status-badge-online" : status === "warning" ? "status-badge status-badge-warning" : "status-badge status-badge-offline"
}

function getAlertMsgClass(type: string) {
  return type === "danger" ? "alert-history-msg danger" : type === "warning" ? "alert-history-msg warning" : "alert-history-msg info"
}

function getAlertIconClass(_type: string) {
  return "alert-history-icon"
}

export default function MonitorPage() {
  const [equipment, setEquipment] = useState<AdminEquipmentRecord[]>([])
  const [monitorPoints, setMonitorPoints] = useState<EquipmentMonitorPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const helpHref = '/equipment/help'

  const load = (showRefreshing: boolean) => {
    if (showRefreshing) {
      setRefreshing(true)
    }
    fetchAdminEquipment({ page: 1, pageSize: 200 })
      .then(response => {
        setEquipment(response.items)
        setMonitorPoints(buildEquipmentMonitorPoints(response.items))
        setError('')
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : '设备监控查询失败。')
      })
      .finally(() => {
        setLoading(false)
        if (showRefreshing) {
          setRefreshing(false)
        }
      })
  }

  useEffect(() => {
    let active = true

    fetchAdminEquipment({ page: 1, pageSize: 200 })
      .then(response => {
        if (active) {
          setEquipment(response.items)
          setMonitorPoints(buildEquipmentMonitorPoints(response.items))
          setError('')
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : '设备监控查询失败。')
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

  const alerts = useMemo(
    () => buildEquipmentAlerts(equipment),
    [equipment],
  )
  const alertHistory = useMemo(
    () => alerts.slice(0, 4).map((item, index) => ({
      time: `${16 - index}:00`,
      device: monitorPoints.find(point => point.id === item.equipmentId)?.name ?? item.equipmentId,
      room: monitorPoints.find(point => point.id === item.equipmentId)?.room ?? '--',
      type: item.type.includes('预警') ? 'warning' : item.type.includes('维保') ? 'warning' : 'danger',
      msg: item.msg,
    })),
    [alerts, monitorPoints],
  )
  const stats = {
    total: monitorPoints.length,
    online: monitorPoints.filter(item => item.status === 'online').length,
    offline: monitorPoints.filter(item => item.status === 'offline').length,
    alerts: monitorPoints.filter(item => item.alert).length,
  }
  const aiInsights = getDeviceAiInsights(monitorPoints, alertHistory)
  const aiOverview = getDeviceAiOverview(monitorPoints, alertHistory)
  const averageBattery = monitorPoints.length > 0 ? Math.round(monitorPoints.reduce((sum, item) => sum + item.metrics.battery, 0) / monitorPoints.length) : 0
  const sortedMonitorPoints = useMemo(
    () => [...monitorPoints].sort((left, right) => {
      const getPriority = (point: EquipmentMonitorPoint) => {
        if (point.alert?.level === 'danger' || point.status === 'offline') return 0
        if (point.alert?.level === 'warning' || point.status === 'warning') return 1
        if (point.metrics.battery < 50) return 2
        return 3
      }

      const scoreDiff = getPriority(left) - getPriority(right)
      if (scoreDiff !== 0) return scoreDiff

      if (left.metrics.battery !== right.metrics.battery) {
        return left.metrics.battery - right.metrics.battery
      }

      return left.name.localeCompare(right.name)
    }),
    [monitorPoints],
  )
  const attentionDevices = sortedMonitorPoints.slice(0, 4)

  return (
    <div className="page-root animate-fade-up">

      {/* Page header */}
      <div className="flex-between" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ letterSpacing: "-0.03em" }}>设备监控</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>
            共 {stats.total} 台设备 · {stats.online} 在线 · {stats.offline} 离线 · {stats.alerts} 告警
          </p>
        </div>
        <div className="flex-center" style={{ gap: 8 }}>
          <Link href="/devices" className="btn btn-secondary btn-sm">设备列表</Link>
          <button className="btn btn-secondary btn-sm flex-center" onClick={() => load(true)} style={{ gap: 6 }}>
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
          { label: "在线设备", value: stats.online, hint: `总设备 ${stats.total} 台`, tone: "success" },
          { label: "离线设备", value: stats.offline, hint: "需优先排查网络或电源", tone: stats.offline > 0 ? "danger" : "neutral" },
          { label: "当前告警", value: stats.alerts, hint: `近 ${alertHistory.length} 条告警记录`, tone: stats.alerts > 0 ? "warning" : "neutral" },
          { label: "平均电量", value: `${averageBattery}%`, hint: "用于判断巡检与充电压力", tone: averageBattery < 60 ? "warning" : "info" },
        ]}
        signals={[
          { label: aiInsights[0] ? `${aiInsights[0].deviceName}：${aiInsights[0].action}` : "暂无 AI 巡检提醒", tone: aiInsights[0]?.severity === "高风险" ? "danger" : "warning" },
          { label: stats.offline > 0 ? `当前有 ${stats.offline} 台设备离线，需要到场排查` : "当前没有离线设备阻塞监测", tone: stats.offline > 0 ? "danger" : "success" },
          { label: alertHistory[0] ? `最近告警 ${alertHistory[0].time} · ${alertHistory[0].msg}` : "暂无告警历史", tone: alertHistory[0]?.type === "danger" ? "danger" : "info" },
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
          { label: "监控设备", value: stats.total, icon: <Activity size={20} />, colorClass: "primary" },
          { label: "在线", value: stats.online, icon: <CheckCircle2 size={20} />, colorClass: "success" },
          { label: "离线", value: stats.offline, icon: <XCircle size={20} />, colorClass: "danger" },
          { label: "告警", value: stats.alerts, icon: <AlertTriangle size={20} />, colorClass: "warning" },
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
            {error ? (
              <DataCard title="Live Unavailable" subtitle="设备监控实时链路当前不可用。" badge={<Tag variant="danger">Operations API</Tag>}>
                <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{error}</div>
              </DataCard>
            ) : null}

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

            {loading && monitorPoints.length === 0 ? (
              <DataCard title="设备监控加载中" subtitle="正在从 Operations Service 派生实时监控视图。">
                <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>/devices/realtime 已复用 live equipment list，不再展示静态监控样例。</div>
              </DataCard>
            ) : null}

            {!loading && monitorPoints.length === 0 ? (
              <EmptyState variant="search" title="暂无设备数据" description="当前没有可用于实时监控的设备对象。" />
            ) : null}

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
                  {sortedMonitorPoints.map((eq) => (
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

              <DataCard icon={<AlertTriangle size={18} />} title="告警记录" subtitle={`最近${alertHistory.length}条`}>
                <div style={{ padding: "8px 12px" }}>
                  {alertHistory.map((alert, i) => (
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
