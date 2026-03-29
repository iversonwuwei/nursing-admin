"use client"
import { useState } from "react"
import { Monitor, CheckCircle2, XCircle, AlertTriangle, Wifi, Battery, Search } from "lucide-react"
import { DataCard, Tag, type TagVariant } from "@/components/nh"

const DEVICES = [
  { id: "EQ001", name: "心电监护仪 #1", room: "201-1床", type: "医疗设备", status: "online", signal: 92, battery: 85, uptime: 720, lastAlert: null },
  { id: "EQ002", name: "心电监护仪 #2", room: "201-2床", type: "医疗设备", status: "online", signal: 88, battery: 62, uptime: 480, lastAlert: "电量偏低" },
  { id: "EQ003", name: "血压监测仪", room: "202-1床", type: "监测设备", status: "warning", signal: 45, battery: 38, uptime: 120, lastAlert: "电量不足" },
  { id: "EQ004", name: "智能床垫传感器", room: "203-1床", type: "传感设备", status: "offline", signal: 0, battery: 0, uptime: 0, lastAlert: "设备离线" },
  { id: "EQ005", name: "血糖监测仪", room: "204-1床", type: "监测设备", status: "online", signal: 95, battery: 92, uptime: 360, lastAlert: null },
  { id: "EQ006", name: "呼吸监测仪", room: "205-1床", type: "医疗设备", status: "online", signal: 90, battery: 78, uptime: 600, lastAlert: null },
  { id: "EQ007", name: "体温贴片", room: "206-1床", type: "传感设备", status: "warning", signal: 30, battery: 15, uptime: 48, lastAlert: "电量严重不足" },
  { id: "EQ008", name: "呼叫对讲系统", room: "二楼走廊", type: "通信设备", status: "online", signal: 100, battery: 100, uptime: 2160, lastAlert: null },
]

const STATUS_TAG: Record<string, TagVariant> = { online: "success", offline: "danger", warning: "warning" }
const STATUS_LABEL: Record<string, string> = { online: "正常", offline: "离线", warning: "异常" }

export default function EquipmentStatusPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("全部")
  const filtered = DEVICES.filter(d => (d.name.includes(search) || d.room.includes(search)) && (statusFilter === "全部" || d.status === statusFilter))
  const stats = { total: DEVICES.length, online: DEVICES.filter(d => d.status === "online").length, offline: DEVICES.filter(d => d.status === "offline").length, warning: DEVICES.filter(d => d.status === "warning").length }

  const signalBar = (s: number) => (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <div style={{ width: 48, height: 6, background: "var(--color-bg)", borderRadius: 999 }}>
        <div style={{ height: "100%", width: `${s}%`, background: s > 60 ? "var(--color-success)" : s > 30 ? "var(--color-warning)" : "var(--color-danger)", borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: s > 60 ? "var(--color-success)" : s > 30 ? "var(--color-warning)" : "var(--color-danger)" }}>{s}%</span>
    </div>
  )

  const batteryBar = (b: number) => (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <Battery size={13} style={{ color: b > 50 ? "var(--color-success)" : b > 20 ? "var(--color-warning)" : "var(--color-danger)" }} />
      <div style={{ width: 40, height: 5, background: "var(--color-bg)", borderRadius: 999 }}>
        <div style={{ height: "100%", width: `${b}%`, background: b > 50 ? "var(--color-success)" : b > 20 ? "var(--color-warning)" : "var(--color-danger)", borderRadius: 999 }} />
      </div>
    </div>
  )

  return (
    <div className="page-root animate-fade-up">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ letterSpacing: "-0.03em" }}>设备状态</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>实时设备状态监控 · {stats.online} 正常 / {stats.warning} 异常 / {stats.offline} 离线</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "设备总数", value: stats.total, icon: Monitor, color: "var(--color-primary)", bg: "var(--color-primary-light)" },
          { label: "正常运行", value: stats.online, icon: CheckCircle2, color: "var(--color-success)", bg: "rgba(34,197,94,0.1)" },
          { label: "设备异常", value: stats.warning, icon: AlertTriangle, color: "var(--color-warning)", bg: "rgba(245,158,11,0.1)" },
          { label: "设备离线", value: stats.offline, icon: XCircle, color: "var(--color-danger)", bg: "rgba(239,68,68,0.1)" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="data-card" style={{ padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--color-muted)" }}>{label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.02em", marginTop: 4 }}>{value}</div>
              </div>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={18} style={{ color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="filter-bar">
        <div className="input-wrap-icon" style={{ flex: 1, minWidth: 200 }}>
          <span className="input-icon"><Search size={16} /></span>
          <input className="input" placeholder="搜索设备名称或位置..." value={search} onChange={e => setSearch(e.target.value)} style={{ height: 38, paddingLeft: 38 }} />
        </div>
        {["全部", "online", "warning", "offline"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-ghost"}`}>{s === "全部" ? "全部" : STATUS_LABEL[s]}</button>
        ))}
      </div>

      <DataCard>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr><th>设备</th><th>类型</th><th>位置</th><th>状态</th><th>信号强度</th><th>电量</th><th>运行时长</th><th>备注</th></tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: d.status === "offline" ? "rgba(239,68,68,0.1)" : d.status === "warning" ? "rgba(245,158,11,0.1)" : "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Wifi size={16} style={{ color: d.status === "offline" ? "var(--color-danger)" : d.status === "warning" ? "var(--color-warning)" : "var(--color-primary)" }} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{d.name}</div>
                        <div className="text-[10px]" style={{ color: "var(--color-muted)" }}>{d.id}</div>
                      </div>
                    </div>
                  </td>
                  <td><Tag variant="neutral">{d.type}</Tag></td>
                  <td><span className="text-sm" style={{ color: "var(--color-muted)" }}>{d.room}</span></td>
                  <td><Tag variant={STATUS_TAG[d.status]}>{STATUS_LABEL[d.status]}</Tag></td>
                  <td>{signalBar(d.signal)}</td>
                  <td>{batteryBar(d.battery)}</td>
                  <td>
                    <span className="text-sm" style={{ color: "var(--color-muted)" }}>
                      {d.uptime > 0 ? `${Math.floor(d.uptime / 60)}h${d.uptime % 60}m` : "——"}
                    </span>
                  </td>
                  <td>
                    {d.lastAlert
                      ? <Tag variant={d.status === "offline" ? "danger" : "warning"}>{d.lastAlert}</Tag>
                      : <span style={{ fontSize: 12, color: "var(--color-muted)" }}>无</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataCard>
    </div>
  )
}
