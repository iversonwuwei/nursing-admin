"use client"
import { DataCard, EmptyState, InteractionRailLayout, PageHelpCard, Tag } from "@/components/nh"
import { getVisitAiSuggestions } from "@/lib/mock/app-ai"
import { approveVisitAppointment, getCareServiceSnapshot, rejectVisitAppointment, subscribeCareServiceWorkflow } from '@/lib/mock/care-service-workflow'
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
  const [selectedId, setSelectedId] = useState<string | null>(preselectedId)
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const selectedVisit = useMemo(() => {
    const preferredId = selectedId ?? preselectedId
    return visits.find(item => item.id === preferredId)
      ?? visits.find(item => item.source === 'family' && item.lifecycleStatus === '待审核')
      ?? visits.find(item => item.lifecycleStatus === '待审核')
      ?? visits[0]
      ?? null
  }, [preselectedId, selectedId, visits])
  const filtered = useMemo(
    () => visits.filter(v => v.elder.includes(search) || v.visitor.includes(search)),
    [search, visits],
  )
  const todayCount = visits.filter(v => v.date === "2026-03-29").length
  const pendingCount = visits.filter(v => v.lifecycleStatus === '待审核').length
  const familyPendingCount = visits.filter(v => v.source === 'family' && v.lifecycleStatus === '待审核').length
  const familyAutoApprovedCount = visits.filter(v => v.source === 'family' && v.reviewMode === '自动通过' && v.lifecycleStatus === '已审核').length
  const aiSuggestions = getVisitAiSuggestions()
  const helpHref = '/elderly/help'
  const reviewNote = selectedVisit
    ? (reviewNotes[selectedVisit.id] ?? selectedVisit.approvalNote ?? selectedVisit.rejectionNote ?? "")
    : ""

  const handleApprove = (id: string) => {
    approveVisitAppointment(id, reviewNote || '预约已审核，可进入来访登记流程。')
  }

  const handleReject = (id: string) => {
    rejectVisitAppointment(id, reviewNote || '当前时段不建议到访，请联系家属改约或转视频沟通。')
  }

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
          subtitle={`${selectedVisit.elder} 的新预约已进入${selectedVisit.reviewMode}闭环。`}
          badge={<Tag variant={selectedVisit.lifecycleStatus === '待审核' ? 'warning' : 'success'}>{selectedVisit.lifecycleStatus}</Tag>}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
              来源 {selectedVisit.source === 'family' ? '家属端' : '管理端'}，访客 {selectedVisit.visitor}，方式 {selectedVisit.type}，时间 {selectedVisit.date} {selectedVisit.time}。
            </div>
            {selectedVisit.lifecycleStatus === '待审核' ? (
              <button className="btn btn-primary btn-sm" onClick={() => handleApprove(selectedVisit.id)}>
                通过预约
              </button>
            ) : null}
          </div>
        </DataCard>
      ) : null}

      <InteractionRailLayout
        main={(
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "今日探视", value: todayCount, icon: UserCheck, color: "var(--color-primary)", bg: "var(--color-primary-light)" },
          { label: "待审核", value: pendingCount, icon: Clock, color: "var(--color-warning)", bg: "rgba(245,158,11,0.1)" },
          { label: "家属待审核", value: familyPendingCount, icon: Video, color: "var(--color-purple)", bg: "rgba(139,92,246,0.1)" },
          { label: "家属自动通过", value: familyAutoApprovedCount, icon: Search, color: "var(--color-info)", bg: "rgba(59,130,246,0.1)" },
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

      {selectedVisit ? (
        <DataCard
          title={selectedVisit.source === 'family' ? '家属端回流审核' : '探视记录详情'}
          subtitle={`${selectedVisit.elder} · ${selectedVisit.date} ${selectedVisit.time} · ${selectedVisit.type}`}
          badge={<Tag variant={selectedVisit.lifecycleStatus === '待审核' ? 'warning' : selectedVisit.lifecycleStatus === '已驳回' ? 'danger' : 'success'}>{selectedVisit.lifecycleStatus}</Tag>}
          action={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Tag variant={selectedVisit.source === 'family' ? 'primary' : 'neutral'}>{selectedVisit.source === 'family' ? '家属发起' : '管理端录入'}</Tag>
              <Tag variant={selectedVisit.reviewMode === '自动通过' ? 'success' : 'warning'}>{selectedVisit.reviewMode}</Tag>
            </div>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div style={{ borderRadius: 10, border: '1px solid var(--color-border)', padding: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>来访信息</div>
              <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.8, color: 'var(--color-text)' }}>
                <div>访客：{selectedVisit.visitor}</div>
                <div>关系：{selectedVisit.relation}</div>
                <div>联系电话：{selectedVisit.phone}</div>
                <div>来访人数：{selectedVisit.visitorCount}</div>
                <div>房间：{selectedVisit.room}</div>
              </div>
              {selectedVisit.companions?.length ? (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.7 }}>
                  同行人：{selectedVisit.companions.join('、')}
                </div>
              ) : null}
            </div>

            <div style={{ borderRadius: 10, border: '1px solid var(--color-border)', padding: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>规则与 AI 摘要</div>
              <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
                <div>{selectedVisit.ruleSummary ?? '当前记录未附带规则摘要。'}</div>
                <div style={{ marginTop: 8 }}>{selectedVisit.aiSummary ?? '当前记录未附带 AI 风险摘要。'}</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, borderRadius: 10, border: '1px solid var(--color-border)', padding: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>审核备注</div>
            <textarea
              className="input"
              value={reviewNote}
              onChange={event => {
                if (!selectedVisit) {
                  return
                }

                const nextValue = event.target.value
                setReviewNotes(current => ({
                  ...current,
                  [selectedVisit.id]: nextValue,
                }))
              }}
              placeholder="填写通过理由、改约建议或驳回说明"
              style={{ minHeight: 88, marginTop: 8, resize: 'vertical', paddingTop: 10 }}
            />
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                {selectedVisit.lifecycleStatus === '待审核'
                  ? '健康信号：家属端回流预约必须显式留痕为通过或驳回，避免停留在隐式待处理。'
                  : selectedVisit.lifecycleStatus === '已驳回'
                    ? `已驳回：${selectedVisit.rejectionNote ?? '未填写驳回原因。'}`
                    : `已通过：${selectedVisit.approvalNote ?? '未填写通过说明。'}`}
              </div>
              {selectedVisit.lifecycleStatus === '待审核' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleReject(selectedVisit.id)}>
                    驳回并通知改约
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => handleApprove(selectedVisit.id)}>
                    审核通过
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </DataCard>
      ) : null}

            <DataCard>
              {filtered.length > 0 ? (
                <div style={{ overflowX: "auto" }}>
                  <table className="table">
            <thead>
              <tr><th>老人</th><th>访客</th><th>来源</th><th>日期</th><th>时间</th><th>方式</th><th>审核模式</th><th>状态</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id}>
                  <td><div className="font-semibold text-sm">{v.elder}</div><div className="text-[10px]" style={{ color: "var(--color-muted)" }}>{v.room}</div></td>
                  <td>
                    <div className="text-sm">{v.visitor}</div>
                    <div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{v.relation} · {v.visitorCount} 人</div>
                  </td>
                  <td><Tag variant={v.source === 'family' ? 'primary' : 'neutral'}>{v.source === 'family' ? '家属端' : '管理端'}</Tag></td>
                  <td><span className="text-xs" style={{ color: "var(--color-muted)" }}>{v.date}</span></td>
                  <td><span className="text-xs" style={{ color: "var(--color-muted)" }}>{v.time}</span></td>
                  <td><Tag variant={v.type === "视频" ? "info" : "neutral"}>{v.type}</Tag></td>
                  <td><Tag variant={v.reviewMode === '自动通过' ? 'success' : 'warning'}>{v.reviewMode}</Tag></td>
                  <td><Tag variant={v.status === "已完成" ? "success" : v.status === "已登记" ? "info" : v.status === '已驳回' ? 'danger' : "warning"}>{v.status}</Tag></td>
                  <td>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={() => setSelectedId(v.id)}>
                      {v.lifecycleStatus === '待审核' ? '去审核' : '查看'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState variant="search" title="暂无匹配探视记录" description="调整搜索词后重试；若当前没有待审核对象，列表会在全部视图中显示已登记记录。" />
              )}
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="审核边界" subtitle="主区只保留待审核对象、审核动作和列表。" badge={<Tag variant="warning">Boundary</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">family 回流与 admin 手工预约共享同一审核口径，但保留来源区分。</div>
                <div className="page-help-card-item">AI 建议只做审核辅助，不替代通过或驳回决策。</div>
                <div className="page-help-card-item">完整探视流程与使用顺序迁移到帮助页。</div>
              </div>
            </DataCard>

            <DataCard title="AI 探视助手" subtitle="把探视审核、视频沟通和家属通知统一成可执行建议。" badge={<Tag variant="primary">Family AI</Tag>}>
              <div style={{ display: "grid", gap: 12 }}>
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

            <PageHelpCard
              title="页面帮助"
              subtitle="完整探视审核说明迁移到显式帮助页"
              summary="探视记录页现在只保留待审核对象、审核动作和探视列表，AI 建议与帮助统一后置。"
              items={[
                '先处理待审核对象，再回看已登记或已驳回记录。',
                'AI 探视助手只做审核辅助，不替代人工判断。',
                '若需要完整说明，进入老人帮助页查看。',
              ]}
              href={helpHref}
              actionLabel="查看老人帮助"
            />
          </>
        )}
      />
    </div>
  )
}
