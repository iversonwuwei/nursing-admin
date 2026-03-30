"use client"
import { DataCard, Tag } from "@/components/nh"
import { getVisitAiSuggestions } from "@/lib/mock/app-ai"
import { Clock, Plus, Search, UserCheck, Video } from "lucide-react"
import { useState } from "react"

const VISITS = [
  { id: "V001", elder: "张桂英", room: "201-1", visitor: "张伟", relation: "儿子", phone: "139****1234", date: "2026-03-29", time: "14:30", type: "现场", status: "已完成" },
  { id: "V002", elder: "王建国", room: "203-2", visitor: "王芳", relation: "女儿", phone: "139****5678", date: "2026-03-29", time: "15:00", type: "现场", status: "已登记" },
  { id: "V003", elder: "李秀兰", room: "205-1", visitor: "李强", relation: "儿子", phone: "139****9012", date: "2026-03-28", time: "10:00", type: "视频", status: "已完成" },
  { id: "V004", elder: "赵德明", room: "202-1", visitor: "赵丽", relation: "儿媳", phone: "139****3456", date: "2026-03-28", time: "16:00", type: "现场", status: "已完成" },
  { id: "V005", elder: "周桂芳", room: "203-1", visitor: "周明", relation: "儿子", phone: "139****7890", date: "2026-03-30", time: "09:00", type: "现场", status: "待审核" },
]

export default function VisitsPage() {
  const [search, setSearch] = useState("")
  const filtered = VISITS.filter(v => v.elder.includes(search) || v.visitor.includes(search))
  const todayCount = VISITS.filter(v => v.date === "2026-03-29").length
  const aiSuggestions = getVisitAiSuggestions()

  return (
    <div className="page-root animate-fade-up">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ letterSpacing: "-0.03em" }}>探视记录</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>共 {VISITS.length} 条记录，今日 {todayCount} 次探视</p>
        </div>
        <button className="btn btn-primary btn-sm flex items-center gap-2">
          <Plus size={14} />预约探视
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "今日探视", value: todayCount, icon: UserCheck, color: "var(--color-primary)", bg: "var(--color-primary-light)" },
          { label: "待审核", value: VISITS.filter(v => v.status === "待审核").length, icon: Clock, color: "var(--color-warning)", bg: "rgba(245,158,11,0.1)" },
          { label: "视频探视", value: VISITS.filter(v => v.type === "视频").length, icon: Video, color: "var(--color-purple)", bg: "rgba(139,92,246,0.1)" },
          { label: "本月总计", value: 86, icon: Search, color: "var(--color-info)", bg: "rgba(59,130,246,0.1)" },
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
          <input className="input" placeholder="搜索老人姓名或探视人..." value={search} onChange={e => setSearch(e.target.value)} style={{ height: 38, paddingLeft: 38 }} />
        </div>
      </div>

      <DataCard title="AI 探视助手" subtitle="把探视审核、视频沟通和家属通知统一成可执行建议。" badge={<Tag variant="primary">Family AI</Tag>}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {aiSuggestions.map(item => (
            <div key={item.title} style={{ borderRadius: 10, border: "1px solid var(--color-border)", padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-text)" }}>{item.title}</span>
                <Tag variant={item.type === "视频" ? "info" : item.type === "现场" ? "warning" : "primary"}>{item.type}</Tag>
              </div>
              <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: "var(--color-text)" }}>{item.summary}</div>
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-primary)", fontWeight: 600 }}>{item.action}</div>
            </div>
          ))}
        </div>
      </DataCard>

      <DataCard>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr><th>老人</th><th>访客</th><th>关系</th><th>联系电话</th><th>日期</th><th>时间</th><th>方式</th><th>状态</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id}>
                  <td><div className="font-semibold text-sm">{v.elder}</div><div className="text-[10px]" style={{ color: "var(--color-muted)" }}>{v.room}</div></td>
                  <td><span className="text-sm">{v.visitor}</span></td>
                  <td><span className="text-sm" style={{ color: "var(--color-muted)" }}>{v.relation}</span></td>
                  <td><span className="text-sm" style={{ color: "var(--color-muted)" }}>{v.phone}</span></td>
                  <td><span className="text-xs" style={{ color: "var(--color-muted)" }}>{v.date}</span></td>
                  <td><span className="text-xs" style={{ color: "var(--color-muted)" }}>{v.time}</span></td>
                  <td><Tag variant={v.type === "视频" ? "info" : "neutral"}>{v.type}</Tag></td>
                  <td><Tag variant={v.status === "已完成" ? "success" : v.status === "已登记" ? "info" : "warning"}>{v.status}</Tag></td>
                  <td><button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>{v.status === "待审核" ? "审核" : "详情"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataCard>
    </div>
  )
}
