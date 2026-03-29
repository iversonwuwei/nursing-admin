"use client"
import { Monitor, CheckCircle2, XCircle, AlertTriangle, TrendingUp, BarChart3, PieChart, Clock } from "lucide-react"
import { DataCard } from "@/components/nh"

const WEEKLY = [38, 42, 40, 45, 43, 47, 46]
const DAYS = ["周一","周二","周三","周四","周五","周六","周日"]
const MAX_W = Math.max(...WEEKLY)

const TYPE_DATA = [
  { name: "医疗设备", count: 12, online: 11, fault: 1, color: "var(--color-danger)" },
  { name: "监测设备", count: 18, online: 16, fault: 2, color: "var(--color-info)" },
  { name: "传感设备", count: 24, online: 22, fault: 2, color: "var(--color-purple)" },
  { name: "通信设备", count: 8, online: 8, fault: 0, color: "var(--color-success)" },
]

export default function EquipmentStatsPage() {
  return (
    <div className="page-root animate-fade-up">
      <div className="flex-between" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ letterSpacing: "-0.03em" }}>设备统计</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>本周数据汇总 · 趋势分析</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm">本周</button>
          <button className="btn btn-ghost btn-sm">本月</button>
        </div>
      </div>

      <div className="page-grid-4">
        {[
          { label: "设备总数", value: 62, icon: Monitor, color: "var(--color-primary)", bg: "var(--color-primary-light)", sub: "本月新增 3 台" },
          { label: "本周使用次数", value: 281, icon: BarChart3, color: "var(--color-info)", bg: "rgba(59,130,246,0.1)", sub: "日均 40 次" },
          { label: "运行时长", value: "4,820h", icon: Clock, color: "var(--color-purple)", bg: "rgba(139,92,246,0.1)", sub: "本周累计" },
          { label: "异常告警", value: 8, icon: AlertTriangle, color: "var(--color-danger)", bg: "rgba(239,68,68,0.1)", sub: "同比 -20%" },
        ].map(({ label, value, icon: Icon, color, bg, sub }) => (
          <div key={label} className="data-card eq-stat-card" style={{ padding: "16px 20px" }}>
            <div className="eq-stat-card-header">
              <div style={{ fontSize: 12, color: "var(--color-muted)", fontWeight: 500 }}>{label}</div>
              <div className="kpi-stat-icon-box" style={{ background: bg }}>
                <Icon size={18} style={{ color }} />
              </div>
            </div>
            <div className="eq-stat-card-value">{value}</div>
            <div className="eq-stat-card-sub">{sub}</div>
          </div>
        ))}
      </div>

      <div className="page-grid-2" style={{ alignItems: "start" }}>
        {/* Weekly usage trend */}
        <DataCard>
          <div className="data-card-header">
            <div className="flex gap-2" style={{ alignItems: "center" }}>
              <div className="data-card-icon-wrap" style={{ background: "rgba(59,130,246,0.1)", color: "var(--color-info)" }}>
                <TrendingUp size={18} />
              </div>
              <div>
                <div className="text-sm font-bold">本周使用次数趋势</div>
                <div style={{ fontSize: 12, color: "var(--color-muted)" }}>各设备日使用次数统计</div>
              </div>
            </div>
          </div>
          <div className="eq-bar-chart">
            {WEEKLY.map((v, i) => (
              <div key={i} className="eq-bar-col">
                <div className="eq-bar-count">{v}</div>
                <div
                  className={`eq-bar ${v === MAX_W ? "current" : "history"}`}
                  style={{ height: `${(v / MAX_W) * 120}px` }}
                />
                <div className="eq-bar-day">{DAYS[i].replace("周","")}</div>
              </div>
            ))}
          </div>
        </DataCard>

        {/* Device type distribution */}
        <DataCard>
          <div className="data-card-header">
            <div className="flex gap-2" style={{ alignItems: "center" }}>
              <div className="data-card-icon-wrap" style={{ background: "rgba(139,92,246,0.1)", color: "var(--color-purple)" }}>
                <PieChart size={18} />
              </div>
              <div>
                <div className="text-sm font-bold">设备类型分布</div>
                <div style={{ fontSize: 12, color: "var(--color-muted)" }}>各类别设备数量及在线率</div>
              </div>
            </div>
          </div>
          <div style={{ padding: "0 12px 12px" }}>
            {TYPE_DATA.map(cat => (
              <div key={cat.name} style={{ padding: "10px 0", borderBottom: "1px solid var(--color-bg)" }}>
                <div className="eq-type-row">
                  <div className="eq-type-name">
                    <div className="eq-type-dot" style={{ background: cat.color }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{cat.name}</span>
                  </div>
                  <div className="eq-type-counts">
                    <CheckCircle2 size={12} style={{ color: "var(--color-success)" }} />
                    <span style={{ fontSize: 12, color: "var(--color-success)", fontWeight: 600 }}>{cat.online}</span>
                    {cat.fault > 0 && (
                      <>
                        <XCircle size={12} style={{ color: "var(--color-danger)" }} />
                        <span style={{ fontSize: 12, color: "var(--color-danger)", fontWeight: 600 }}>{cat.fault}</span>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="eq-type-progress">
                    <div className="eq-type-progress-fill" style={{ width: `${(cat.online / cat.count) * 100}%`, background: cat.color }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text)", width: 34, textAlign: "right" }}>{cat.count}台</span>
                </div>
              </div>
            ))}
          </div>
        </DataCard>
      </div>

      {/* Top devices */}
      <DataCard>
        <div className="data-card-header">
          <div className="flex gap-2" style={{ alignItems: "center" }}>
            <div className="data-card-icon-wrap" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
              <Monitor size={18} />
            </div>
            <div>
              <div className="text-sm font-bold">高频使用设备 TOP 5</div>
              <div style={{ fontSize: 12, color: "var(--color-muted)" }}>本周使用次数最多的设备</div>
            </div>
          </div>
        </div>
        <div style={{ padding: "0 12px 12px" }}>
          {[
            { name: "心电监护仪 #1", room: "201-1床", uses: 128, uptime: "99.2%" },
            { name: "血压监测仪", room: "202-1床", uses: 112, uptime: "98.5%" },
            { name: "血糖监测仪", room: "204-1床", uses: 98, uptime: "99.8%" },
            { name: "呼吸监测仪", room: "205-1床", uses: 86, uptime: "97.3%" },
            { name: "智能床垫传感器", room: "203-1床", uses: 74, uptime: "96.1%" },
          ].map((d, i) => (
            <div key={d.name} className="eq-top-device">
              <span className="eq-top-rank" style={{ color: i < 3 ? "var(--color-primary)" : "var(--color-muted)" }}>{i + 1}</span>
              <div className="eq-top-info">
                <div className="eq-top-name">{d.name}</div>
                <div className="eq-top-room">{d.room}</div>
              </div>
              <div className="eq-top-stat">
                <div className="eq-top-stat-val" style={{ color: "var(--color-primary)" }}>{d.uses}</div>
                <div className="eq-top-stat-lbl">使用次数</div>
              </div>
              <div className="eq-top-stat">
                <div className="eq-top-stat-val" style={{ color: "var(--color-success)" }}>{d.uptime}</div>
                <div className="eq-top-stat-lbl">在线率</div>
              </div>
            </div>
          ))}
        </div>
      </DataCard>
    </div>
  )
}
