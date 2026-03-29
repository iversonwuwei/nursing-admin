"use client"
import { useState } from "react"
import Link from "next/link"
import { FileHeart, Activity, Pill, Heart, Stethoscope, AlertCircle, Plus, Search } from "lucide-react"
import { DataCard, Tag } from "@/components/nh"

const HEALTH_RECORDS = [
  { id: "HR001", name: "张桂英", room: "201-1", age: 82, bp: "135/85", hr: 72, temp: 36.5, bloodSugar: 5.8, o2: 97, lastCheck: "2026-03-28", alert: "血压偏高" },
  { id: "HR002", name: "王建国", room: "203-2", age: 78, bp: "120/78", hr: 68, temp: 36.4, bloodSugar: 6.1, o2: 98, lastCheck: "2026-03-27", alert: null },
  { id: "HR003", name: "李秀兰", room: "205-1", age: 85, bp: "128/82", hr: 65, temp: 36.8, bloodSugar: 7.2, o2: 95, lastCheck: "2026-03-25", alert: "血糖偏高" },
  { id: "HR004", name: "赵德明", room: "202-1", age: 80, bp: "118/75", hr: 70, temp: 36.3, bloodSugar: 5.4, o2: 99, lastCheck: "2026-03-26", alert: null },
]

const MEDICATIONS = [
  { name: "硝苯地平缓释片", dose: "20mg × 2次/日", patient: "张桂英", nextTime: "08:00", status: "待服用" },
  { name: "二甲双胍", dose: "0.5g × 3次/日", patient: "李秀兰", nextTime: "08:00", status: "待服用" },
  { name: "阿司匹林肠溶片", dose: "100mg × 1次/日", patient: "王建国", nextTime: "08:00", status: "已服用" },
]

export default function HealthPage() {
  const [search, setSearch] = useState("")

  const filtered = HEALTH_RECORDS.filter(r => r.name.includes(search) || r.id.includes(search))

  const vitalTag = (val: string | null, warn: string | null, normal: string, warnThresh: { high: string; low: string }) => {
    if (!val) return null
    const num = parseFloat(val)
    if (num > parseFloat(warnThresh.high) || num < parseFloat(warnThresh.low)) return <Tag variant="warning">{val}</Tag>
    return <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-success)" }}>{val}</span>
  }

  return (
    <div className="page-root animate-fade-up">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ letterSpacing: "-0.03em" }}>健康档案</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>老人健康数据汇总 · 共 {HEALTH_RECORDS.length} 位老人</p>
        </div>
        <button className="btn btn-primary btn-sm flex items-center gap-2">
          <Plus size={14} />新建档案
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
        {[
          { label: "建档老人", value: 124, icon: FileHeart, color: "var(--color-primary)", bg: "var(--color-primary-light)" },
          { label: "今日测量", value: 38, icon: Activity, color: "var(--color-info)", bg: "rgba(59,130,246,0.1)" },
          { label: "异常提醒", value: 6, icon: AlertCircle, color: "var(--color-warning)", bg: "rgba(245,158,11,0.1)" },
          { label: "用药中", value: 21, icon: Pill, color: "var(--color-purple)", bg: "rgba(139,92,246,0.1)" },
          { label: "本周巡诊", value: 12, icon: Stethoscope, color: "var(--color-success)", bg: "rgba(34,197,94,0.1)" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="data-card" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.02em" }}>{value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Health table */}
      <DataCard>
        <div className="data-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="data-card-icon-wrap" style={{ background: "rgba(34,197,94,0.1)", color: "var(--color-success)" }}>
              <Heart size={18} />
            </div>
            <div>
              <div className="text-sm font-bold">健康指标一览</div>
              <div style={{ fontSize: 12, color: "var(--color-muted)" }}>最近一次测量数据</div>
            </div>
          </div>
          <div className="input-wrap-icon" style={{ width: 220 }}>
            <span className="input-icon"><Search size={14} /></span>
            <input className="input" placeholder="搜索姓名..." value={search} onChange={e => setSearch(e.target.value)} style={{ height: 34 }} />
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="table-base">
            <thead>
              <tr>
                <th>姓名</th><th>房间</th><th>血压<br/><span style={{fontSize:10,color:"var(--color-muted)",fontWeight:400}}>mmHg</span></th>
                <th>心率<br/><span style={{fontSize:10,color:"var(--color-muted)",fontWeight:400}}>bpm</span></th>
                <th>体温<br/><span style={{fontSize:10,color:"var(--color-muted)",fontWeight:400}}>℃</span></th>
                <th>血糖<br/><span style={{fontSize:10,color:"var(--color-muted)",fontWeight:400}}>mmol/L</span></th>
                <th>血氧<br/><span style={{fontSize:10,color:"var(--color-muted)",fontWeight:400}}>%</span></th>
                <th>更新时间</th><th>备注</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td><div className="font-semibold text-sm">{r.name}</div><div className="text-[10px]" style={{ color: "var(--color-muted)" }}>{r.id}</div></td>
                  <td><span className="text-sm">{r.room}</span></td>
                  <td>{vitalTag(r.bp.split("/")[0], r.alert, r.bp, { high: "140", low: "90" })}<br/><span style={{fontSize:11,color:"var(--color-muted)"}}>/{r.bp.split("/")[1]}</span></td>
                  <td>{vitalTag(String(r.hr), r.alert, String(r.hr), { high: "100", low: "60" })}</td>
                  <td>{vitalTag(String(r.temp), r.alert, String(r.temp), { high: "37.5", low: "35.5" })}</td>
                  <td>{vitalTag(String(r.bloodSugar), r.alert, String(r.bloodSugar), { high: "7.0", low: "3.9" })}</td>
                  <td>{vitalTag(String(r.o2), r.alert, String(r.o2), { high: "100", low: "95" })}</td>
                  <td><span className="text-xs" style={{ color: "var(--color-muted)" }}>{r.lastCheck}</span></td>
                  <td>{r.alert ? <Tag variant="warning">{r.alert}</Tag> : <span style={{ fontSize: 12, color: "var(--color-muted)" }}>正常</span>}</td>
                  <td><Link href={`/elderly/${r.id.replace('HR', 'E')}`} className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>详情</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataCard>

      {/* Medication */}
      <DataCard>
        <div className="data-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="data-card-icon-wrap" style={{ background: "rgba(139,92,246,0.1)", color: "var(--color-purple)" }}>
              <Pill size={18} />
            </div>
            <div>
              <div className="text-sm font-bold">今日用药</div>
              <div style={{ fontSize: 12, color: "var(--color-muted)" }}>待服用 {MEDICATIONS.filter(m => m.status === "待服用").length} 项</div>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10, padding: "0 12px 12px" }}>
          {MEDICATIONS.map((med, i) => (
            <div key={i} style={{ padding: 14, borderRadius: 10, border: `1.5px solid ${med.status === "待服用" ? "rgba(245,158,11,0.2)" : "rgba(34,197,94,0.1)"}`, background: med.status === "待服用" ? "rgba(245,158,11,0.05)" : "rgba(34,197,94,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)" }}>{med.name}</span>
                <Tag variant={med.status === "待服用" ? "warning" : "success"}>{med.status}</Tag>
              </div>
              <div style={{ fontSize: 12, color: "var(--color-muted)" }}>{med.dose}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 12, color: "var(--color-muted)" }}>{med.patient} · 下次 {med.nextTime}</span>
                {med.status === "待服用" && <button className="btn btn-primary btn-sm" style={{ fontSize: 12, height: 28 }}>确认服用</button>}
              </div>
            </div>
          ))}
        </div>
      </DataCard>
    </div>
  )
}
