"use client"
import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard } from "@/components/nh"
import { buildAiAssistantHref } from "@/lib/ai-context"
import { getStaffDetailActionAiInsight } from "@/lib/mock/admin-ai"
import { getStaffAiProfile } from "@/lib/mock/app-ai"
import { findLiveStaffById, getResourceSnapshot, subscribeResourceWorkflow } from '@/lib/mock/resource-workflow'
import { ArrowLeft, Bot, Edit } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useMemo, useSyncExternalStore } from 'react'

export default function StaffDetailPage() {
  const params = useParams()
  const id = params.id as string
  const snapshot = useSyncExternalStore(
    subscribeResourceWorkflow,
    getResourceSnapshot,
    getResourceSnapshot,
  )
  const data = useMemo(
    () => findLiveStaffById(id, snapshot) ?? snapshot.staff[0],
    [id, snapshot],
  )
  const aiProfile = getStaffAiProfile(data.id)
  const actionInsight = getStaffDetailActionAiInsight({
    id: data.id,
    name: data.name,
    role: data.role,
    department: data.department,
    performance: data.performance,
    attendance: data.attendance,
    satisfaction: data.satisfaction,
    schedule: data.schedule.map(item => ({ ...item })),
  })
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = "inference") => buildAiAssistantHref({
    source: 'staff-detail',
    entityId: data.id,
    entityName: data.name,
    focus,
    target,
  })
  const helpHref = '/staff/help'

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title={data.name}
        subtitle={`工号: ${data.id} · ${data.department}`}
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/staff" className="btn btn-secondary btn-sm"><ArrowLeft size={13} />返回员工页</Link>
            <button className="btn btn-primary btn-sm flex items-center gap-2">
              <Edit size={14} />编辑信息
            </button>
          </div>
        }
      />

      <InteractionRailLayout
        main={(
          <>
            <WorkflowOverviewCard
              eyebrow="Staff Detail"
              title={`${data.name} 人员对象总览`}
              description="主区只保留人员事实、服务归属、排班、绩效和资质，AI 班次与交接摘要后置展示。"
              badge={<Tag variant={data.status === '在职' ? 'success' : data.status === '待入职' ? 'warning' : 'neutral'}>{data.status}</Tag>}
              metrics={[
                { label: '角色', value: data.role, hint: data.department, tone: 'primary' },
                { label: '人员来源', value: data.employmentSource, hint: data.partnerAgencyName ?? '内部团队', tone: data.employmentSource === '第三方合作' ? 'warning' : 'info' },
                { label: '综合绩效', value: `${data.performance}分`, hint: `出勤率 ${data.attendance}%`, tone: data.performance >= 90 ? 'success' : 'warning' },
                { label: '满意度', value: `${data.satisfaction}%`, hint: `本月奖金 ${data.bonus}`, tone: 'info' },
              ]}
              signals={[
                { label: `证书数：${data.certificates.length} 项`, tone: 'info' },
                { label: data.partnerAgencyName ? `当前属于 ${data.partnerAgencyName} 协同口径。` : '当前属于内部团队口径。', tone: data.partnerAgencyName ? 'warning' : 'success' },
                { label: 'AI 建议只辅助主管跟进，不替代排班和绩效决策。', tone: 'neutral' },
              ]}
            />

            <div className="kpi-grid">
              <StatCard icon={<Edit size={18} />} label="角色" value={data.role} sub={data.department} color="primary" />
              <StatCard icon={<Edit size={18} />} label="人员来源" value={data.employmentSource} sub={data.status} color={data.employmentSource === '第三方合作' ? 'warning' : 'info'} />
              <StatCard icon={<Edit size={18} />} label="综合绩效" value={`${data.performance}分`} sub={`出勤率 ${data.attendance}%`} color={data.performance >= 90 ? 'success' : 'warning'} />
              <StatCard icon={<Edit size={18} />} label="满意度" value={`${data.satisfaction}%`} sub={`奖金 ${data.bonus}`} color="success" />
            </div>

            <DataCard title="基本信息" subtitle="人员事实保留在主区，先支撑主管和排班判断。" badge={<Tag variant="primary">Profile</Tag>}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                {[
                  { label: "姓名", value: data.name },
                  { label: "人员来源", value: data.employmentSource },
                  { label: "性别", value: data.gender },
                  { label: "年龄", value: `${data.age}岁` },
                  { label: "联系电话", value: data.phone },
                  { label: "邮箱", value: data.email },
                  { label: "入职日期", value: data.hireDate },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-xs font-semibold" style={{ color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                    <div className="text-sm font-semibold">{value}</div>
                  </div>
                ))}
              </div>
            </DataCard>

            <DataCard title="服务归属" subtitle="用工口径与协同边界保留在主区，便于先核对对象事实。">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                {[
                  { label: "用工口径", value: data.employmentSource },
                  { label: "护理服务机构", value: data.partnerAgencyName ?? '内部团队' },
                  { label: "合作角色", value: data.partnerAffiliationRole ?? '无' },
                  { label: "入职状态备注", value: data.onboardingNote ?? '暂无备注' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-xs font-semibold" style={{ color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                    <div className="text-sm font-semibold" style={{ lineHeight: 1.7 }}>{value}</div>
                  </div>
                ))}
              </div>
            </DataCard>

            <DataCard title="本周排班" subtitle="对象排班保留在主区，先服务主管与班次安排。">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
                {data.schedule.map((s, i) => (
                  <div key={i} style={{ padding: "8px 6px", borderRadius: 8, background: s.shift === "休息" ? "var(--color-bg)" : "var(--color-primary-light)", border: `1px solid ${s.shift === "休息" ? "var(--color-border)" : "rgba(13,148,136,0.2)"}`, textAlign: "center" }}>
                    <div className="text-xs mb-1" style={{ color: "var(--color-muted)" }}>{s.day}</div>
                    <div className="text-xs font-semibold" style={{ color: s.shift === "休息" ? "var(--color-muted)" : "var(--color-primary)" }}>{s.shift}</div>
                  </div>
                ))}
              </div>
            </DataCard>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <DataCard title="绩效数据" subtitle="人员绩效指标留在主区，便于直接核对。">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { label: "综合绩效", value: `${data.performance}分` },
                    { label: "出勤率", value: `${data.attendance}%` },
                    { label: "满意度", value: `${data.satisfaction}%` },
                    { label: "本月奖金", value: data.bonus },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ padding: "10px 12px", background: "var(--color-bg)", borderRadius: 8 }}>
                      <div className="text-xs font-semibold" style={{ color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                      <div className="text-base font-bold">{value}</div>
                    </div>
                  ))}
                </div>
              </DataCard>

              <DataCard title="资质证书" subtitle="对象资质留在主区，避免与说明型内容混排。">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {data.certificates.map((c: string) => (
                    <span key={c} className="text-sm px-3 py-2 rounded-lg border" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)", background: "var(--color-bg)" }}>
                      📜 {c}
                    </span>
                  ))}
                </div>
              </DataCard>
            </div>
          </>
        )}
        rail={(
          <>
            <DataCard title="人员上下文" subtitle="当前对象边界与协同责任后置显示。" badge={<Tag variant="info">Context</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">角色：{data.role} · 状态：{data.status}</div>
                <div className="page-help-card-item">协同归属：{data.partnerAgencyName ?? '内部团队'} · {data.partnerAffiliationRole ?? '无合作角色'}</div>
                <div className="page-help-card-item">AI 班次与交接摘要只作辅助，最终仍由主管确认排班与交接动作。</div>
              </div>
            </DataCard>

            <DataCard title={actionInsight.title} subtitle="把个人排班、表现和交接价值转成主管可跟进动作。" badge={<Tag variant="warning">Manager Review</Tag>}>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 700, color: "var(--color-text)" }}>
                  <Bot size={16} style={{ color: "var(--color-primary)" }} />
                  AI 用工动作
                </div>
                <div style={{ padding: 14, borderRadius: 10, background: "var(--color-bg)", fontSize: 13, lineHeight: 1.7, color: "var(--color-text)" }}>
                  {actionInsight.summary}
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {actionInsight.actions.map(item => (
                    <div key={item} className="page-help-card-item">{item}</div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 12, color: "var(--color-primary)", fontWeight: 600 }}>置信度 {actionInsight.confidence}%</div>
                  <Link href={buildAiHref('staff-action', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
                </div>
              </div>
            </DataCard>

            <DataCard title="AI 班次摘要" subtitle="面向员工 APP 的班次开场摘要和优先动作建议。" badge={<Tag variant="primary">Staff AI</Tag>}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ padding: 14, borderRadius: 10, background: "var(--color-bg)", fontSize: 13, lineHeight: 1.7, color: "var(--color-text)" }}>
                  {aiProfile.shiftSummary}
                </div>
                <Tag variant={aiProfile.workloadLevel === "高负荷" ? "warning" : "success"}>{aiProfile.workloadLevel}</Tag>
                <div style={{ display: "grid", gap: 8 }}>
                  {aiProfile.recommendedActions.map(item => (
                    <div key={item} className="page-help-card-item">{item}</div>
                  ))}
                </div>
                <div>
                  <Link href={buildAiHref('staff-shift-summary', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
                </div>
              </div>
            </DataCard>

            <DataCard title="AI 交接班草稿" subtitle="把未闭环事项和重点老人压缩成下一班可直接阅读的摘要。">
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ padding: 14, borderRadius: 10, background: "var(--color-bg)", fontSize: 13, lineHeight: 1.7, color: "var(--color-text)" }}>
                  {aiProfile.handoverDraft}
                </div>
                <div>
                  <Link href={buildAiHref('handover-draft', 'logs')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
                </div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整人员协同边界迁移到显式帮助页"
              summary="员工详情页现在只保留人员事实、排班、绩效和资质信息，AI 班次摘要与交接建议统一后置。"
              items={[
                '先核对人员身份、服务归属和本周排班。',
                '再看绩效、资质和主管跟进动作。',
                '若需要完整员工协同边界与使用说明，进入帮助页查看。',
              ]}
              href={helpHref}
              actionLabel="查看员工管理帮助"
            />
          </>
        )}
      />
    </div>
  )
}
