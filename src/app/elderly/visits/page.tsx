"use client"
import { DataCard, Tag } from "@/components/nh"
import { getVisitAiSuggestions } from "@/lib/mock/app-ai"
import { approveVisitAppointment, getCareServiceSnapshot, subscribeCareServiceWorkflow } from '@/lib/mock/care-service-workflow'
import { Clock, Plus, Search, UserCheck, Video } from "lucide-react"
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState, useSyncExternalStore } from "react"

export default function VisitsPage() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('selected')
  const fromNew = searchParams.get('entry') === 'elderly-visits-new'
  const snapshot = useSyncExternalStore(
    subscribeCareServiceWorkflow,
    getCareServiceSnapshot,
    getCareServiceSnapshot,
  )
  const visits = snapshot.visits
  const [search, setSearch] = useState("")
  const selectedVisit = useMemo(
    () => visits.find(item => item.id === preselectedId) ?? null,
    [preselectedId, visits],
  )
  const filtered = visits.filter(v => v.elder.includes(search) || v.visitor.includes(search))
  const todayCount = visits.filter(v => v.date === "2026-03-29").length
  const aiSuggestions = getVisitAiSuggestions()

  return (
    <div className="page-root animate-fade-up">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ letterSpacing: "-0.03em" }}>探视记录</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>共 {visits.length} 条记录，今日 {todayCount} 次探视</p>
        </div>
        <Link href="/elderly/visits/new" className="btn btn-primary btn-sm flex items-center gap-2">
          <Plus size={14} />预约探视
        </Link>
      </div>

      {selectedVisit && fromNew ? (
        <DataCard
          title="来自预约探视页"
          subtitle={`${selectedVisit.elder} 的新预约已进入待审核闭环。`}
          badge={<Tag variant={selectedVisit.lifecycleStatus === '待审核' ? 'warning' : 'success'}>{selectedVisit.lifecycleStatus}</Tag>}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
              访客 {selectedVisit.visitor}，方式 {selectedVisit.type}，时间 {selectedVisit.date} {selectedVisit.time}。
            </div>
            {selectedVisit.lifecycleStatus === '待审核' ? (
              <button className="btn btn-primary btn-sm" onClick={() => approveVisitAppointment(selectedVisit.id)}>
                通过预约
              </button>
            ) : null}
          </div>
        </DataCard>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "今日探视", value: todayCount, icon: UserCheck, color: "var(--color-primary)", bg: "var(--color-primary-light)" },
          { label: "待审核", value: visits.filter(v => v.status === "待审核").length, icon: Clock, color: "var(--color-warning)", bg: "rgba(245,158,11,0.1)" },
          { label: "视频探视", value: visits.filter(v => v.type === "视频").length, icon: Video, color: "var(--color-purple)", bg: "rgba(139,92,246,0.1)" },
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
                  <td>
                    {v.status === "待审核" ? (
                      <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={() => approveVisitAppointment(v.id)}>审核</button>
                    ) : (
                      <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>详情</button>
                    )}
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
