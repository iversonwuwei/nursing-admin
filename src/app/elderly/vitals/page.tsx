"use client"
import { useState } from "react"
import Link from "next/link"
import { Activity, Search, Plus, TrendingUp, TrendingDown, Minus, Clock } from "lucide-react"
import { DataCard, Tag } from "@/components/nh"

const RECORDS = [
  { id: "V001", elder: "张桂英", room: "201-1", bp: "135/85", hr: 72, temp: 36.5, spo2: 97, bloodSugar: 5.8, recordedBy: "陈美华", time: "08:30" },
  { id: "V002", elder: "王建国", room: "203-2", bp: "120/78", hr: 68, temp: 36.4, spo2: 98, bloodSugar: 6.1, recordedBy: "刘建国", time: "08:25" },
  { id: "V003", elder: "李秀兰", room: "205-1", bp: "128/82", hr: 65, temp: 36.8, spo2: 95, bloodSugar: 7.2, recordedBy: "赵晓敏", time: "08:20" },
  { id: "V004", elder: "赵德明", room: "202-1", bp: "118/75", hr: 70, temp: 36.3, spo2: 99, bloodSugar: 5.4, recordedBy: "陈美华", time: "08:15" },
  { id: "V005", elder: "周桂芳", room: "203-1", bp: "122/80", hr: 73, temp: 36.6, spo2: 96, bloodSugar: 5.9, recordedBy: "刘建国", time: "08:10" },
]

const TREND = (v: number, n: number) => v > n ? { icon: TrendingUp, color: "var(--color-danger)", label: "偏高" } : v < n ? { icon: TrendingDown, color: "var(--color-info)", label: "偏低" } : { icon: Minus, color: "var(--color-success)", label: "正常" }

export default function VitalsPage() {
  const [search, setSearch] = useState("")
  const filtered = RECORDS.filter(r => r.elder.includes(search) || r.room.includes(search))

  return (
    <div className="page-root animate-fade-up">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ letterSpacing: "-0.03em" }}>指标更新</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>今日已录入 {RECORDS.length} 条生命体征记录</p>
        </div>
        <button className="btn btn-primary btn-sm flex items-center gap-2">
          <Plus size={14} />批量录入
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
        {[
          { label: "血压", value: "38/38", icon: Activity, color: "var(--color-danger)", bg: "rgba(239,68,68,0.1)", norm: "90-140/60-90" },
          { label: "心率", value: "72bpm", icon: Activity, color: "var(--color-primary)", bg: "var(--color-primary-light)", norm: "60-100bpm" },
          { label: "体温", value: "36.5℃", icon: Activity, color: "var(--color-warning)", bg: "rgba(245,158,11,0.1)", norm: "36-37.3℃" },
          { label: "血氧", value: "97%", icon: Activity, color: "var(--color-info)", bg: "rgba(59,130,246,0.1)", norm: "95-100%" },
          { label: "血糖", value: "5.8", icon: Activity, color: "var(--color-purple)", bg: "rgba(139,92,246,0.1)", norm: "3.9-7.0" },
        ].map(({ label, value, icon: Icon, color, bg, norm }) => (
          <div key={label} className="data-card" style={{ padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={15} style={{ color }} />
              </div>
              <span style={{ fontSize: 12, color: "var(--color-muted)" }}>{label}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--color-text)" }}>{value}</div>
            <div style={{ fontSize: 10, color: "var(--color-muted)", marginTop: 2 }}>正常: {norm}</div>
          </div>
        ))}
      </div>

      <div className="filter-bar">
        <div className="input-wrap-icon" style={{ flex: 1, minWidth: 200 }}>
          <span className="input-icon"><Search size={16} /></span>
          <input className="input" placeholder="搜索老人姓名或房间..." value={search} onChange={e => setSearch(e.target.value)} style={{ height: 38, paddingLeft: 38 }} />
        </div>
      </div>

      <DataCard>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr><th>老人</th><th>血压<br/><span style={{fontSize:10,color:"var(--color-muted)",fontWeight:400}}>mmHg</span></th><th>心率<br/><span style={{fontSize:10,color:"var(--color-muted)",fontWeight:400}}>bpm</span></th><th>体温<br/><span style={{fontSize:10,color:"var(--color-muted)",fontWeight:400}}>℃</span></th><th>血氧<br/><span style={{fontSize:10,color:"var(--color-muted)",fontWeight:400}}>%</span></th><th>血糖<br/><span style={{fontSize:10,color:"var(--color-muted)",fontWeight:400}}>mmol/L</span></th><th>记录人</th><th>时间</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const bpTrend = TREND(parseInt(r.bp.split("/")[0]), 130)
                const hrTrend = TREND(r.hr, 75)
                const tempTrend = TREND(r.temp, 37)
                const o2Trend = r.spo2 < 95 ? { icon: TrendingDown, color: "var(--color-danger)", label: "偏低" } : { icon: Minus, color: "var(--color-success)", label: "正常" }
                const bsTrend = TREND(r.bloodSugar, 7.0)
                return (
                  <tr key={r.id}>
                    <td><div className="font-semibold text-sm">{r.elder}</div><div className="text-[10px]" style={{ color: "var(--color-muted)" }}>{r.room}</div></td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>{r.bp}</span>
                        <bpTrend.icon size={13} style={{ color: bpTrend.color }} />
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>{r.hr}</span>
                        <hrTrend.icon size={13} style={{ color: hrTrend.color }} />
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>{r.temp}</span>
                        <tempTrend.icon size={13} style={{ color: tempTrend.color }} />
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>{r.spo2}</span>
                        <o2Trend.icon size={13} style={{ color: o2Trend.color }} />
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>{r.bloodSugar}</span>
                        <bsTrend.icon size={13} style={{ color: bsTrend.color }} />
                      </div>
                    </td>
                    <td><span className="text-sm" style={{ color: "var(--color-muted)" }}>{r.recordedBy}</span></td>
                    <td><span className="text-xs" style={{ color: "var(--color-muted)" }}>{r.time}</span></td>
                    <td><Link href={`/elderly/${r.id.replace('V', 'E')}`} className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>详情</Link></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </DataCard>
    </div>
  )
}
