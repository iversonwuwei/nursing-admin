"use client"
import { DataCard, PageHeader, StatCard } from "@/components/nh"
import { CalendarDays, ChevronLeft, ChevronRight, Users } from "lucide-react"
import { useState } from "react"

const DAYS = ["周一","周二","周三","周四","周五","周六","周日"]

const SHIFTS: Record<string, { bg: string; color: string; label: string }> = {
  "白班":   { bg: "rgba(34,197,94,0.1)", color: "var(--color-success)", label: "白班" },
  "夜班":   { bg: "rgba(59,130,246,0.1)", color: "var(--color-info)", label: "夜班" },
  "休息":   { bg: "var(--color-bg)", color: "var(--color-muted)", label: "休息" },
  "早班":   { bg: "rgba(245,158,11,0.1)", color: "var(--color-warning)", label: "早班" },
}

const SCHEDULE: Record<string, string[]> = {
  "陈美华": ["白班","白班","白班","白班","白班","休息","休息"],
  "刘建国": ["夜班","夜班","夜班","夜班","夜班","休息","休息"],
  "赵晓敏": ["早班","早班","白班","白班","白班","休息","休息"],
  "周桂芳": ["白班","白班","白班","白班","白班","白班","休息"],
  "吴伟":   ["白班","白班","白班","白班","白班","休息","休息"],
}

export default function SchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const title = weekOffset === 0 ? "本周排班" : weekOffset > 0 ? `未来第${weekOffset}周` : `过去第${Math.abs(weekOffset)}周`
  const published = Object.values(SCHEDULE).flat().filter(shift => shift !== "休息").length

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title="排班管理"
        subtitle={`${title} · 可调整员工班次`}
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setWeekOffset(w => w - 1)}><ChevronLeft size={14} /></button>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", minWidth: 120, textAlign: "center" }}>{title}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setWeekOffset(w => w + 1)}><ChevronRight size={14} /></button>
          </div>
        }
      />

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard icon={<Users size={18} />} label="排班员工" value={Object.keys(SCHEDULE).length} color="primary" />
        <StatCard icon={<CalendarDays size={18} />} label="已发布班次" value={published} color="success" />
        <StatCard icon={<Users size={18} />} label="休息安排" value={Object.values(SCHEDULE).flat().filter(shift => shift === "休息").length} color="info" />
        <StatCard icon={<CalendarDays size={18} />} label="当前周视图" value={title} color="warning" />
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        {Object.entries(SHIFTS).map(([name, cfg]) => (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 4, background: cfg.bg, border: `1.5px solid ${cfg.color}` }} />
            <span style={{ fontSize: 12, color: "var(--color-muted)" }}>{cfg.label}</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="btn btn-primary btn-sm">发布排班</button>
          <button className="btn btn-secondary btn-sm">导出</button>
        </div>
      </div>

      {/* Schedule grid */}
      <DataCard>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--color-bg)", background: "var(--color-bg)", position: "sticky", left: 0, zIndex: 2, minWidth: 120 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Users size={14} />员工
                  </div>
                </th>
                {DAYS.map(d => (
                  <th key={d} style={{ padding: "12px 8px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "var(--color-text)", borderBottom: "1px solid var(--color-bg)", background: "var(--color-bg)", minWidth: 90 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <CalendarDays size={13} style={{ color: "var(--color-primary)" }} />{d}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(SCHEDULE).map(([name, shifts], i) => (
                <tr key={name} style={{ background: i % 2 === 0 ? "#FFFFFF" : "var(--color-bg)" }}>
                  <td style={{ padding: "10px 16px", borderBottom: "1px solid var(--color-bg)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--color-primary)", flexShrink: 0 }}>
                        {name.charAt(0)}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{name}</span>
                    </div>
                  </td>
                  {shifts.map((shift, j) => {
                    const cfg = SHIFTS[shift] ?? SHIFTS["休息"]
                    return (
                      <td key={j} style={{ padding: "8px", borderBottom: "1px solid var(--color-bg)", textAlign: "center" }}>
                        <div style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                          background: cfg.bg, color: cfg.color, cursor: "pointer",
                          transition: "all 150ms ease",
                        }}>
                          {cfg.label}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataCard>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
        {DAYS.map((day, i) => {
          const shiftCount: Record<string, number> = {}
          Object.values(SCHEDULE).forEach(shifts => {
            const s = shifts[i]
            shiftCount[s] = (shiftCount[s] ?? 0) + 1
          })
          return (
            <div key={day} className="data-card" style={{ padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text)", marginBottom: 6 }}>{day}</div>
              {Object.entries(shiftCount).map(([shift, count]) => {
                const cfg = SHIFTS[shift] ?? SHIFTS["休息"]
                return (
                  <div key={shift} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 3 }}>
                    <span style={{ fontSize: 11, color: cfg.color, fontWeight: 600 }}>{shift}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text)" }}>{count}人</span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
