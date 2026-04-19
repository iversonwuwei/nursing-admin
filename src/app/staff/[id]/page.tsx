"use client"

import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard } from "@/components/nh"
import { buildAiAssistantHref } from "@/lib/ai-context"
import { fetchAdminStaffDetail, type AdminStaffRecord } from '@/lib/staff/admin-staff-api'
import { ArrowLeft, Bot, Edit } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from 'react'

function buildActionInsight(data: AdminStaffRecord) {
    const pendingShiftCount = data.schedule.filter(item => item.shift === '待排班').length
    const pressureSignals = [
        data.performance < 80 ? '综合绩效低于 80 分' : null,
        data.attendance < 90 ? '出勤率低于 90%' : null,
        data.satisfaction < 85 ? '满意度低于 85%' : null,
        pendingShiftCount > 0 ? `本周还有 ${pendingShiftCount} 个待排班班次` : null,
    ].filter(Boolean) as string[]

    return {
        title: pressureSignals.length > 0 ? '主管需复核当前人员状态' : '当前人员状态稳定',
        summary: pressureSignals.length > 0
            ? `${data.name} 当前存在 ${pressureSignals.join('、')}，建议先核对对象事实，再决定是否需要补位或交接。`
            : `${data.name} 当前绩效、出勤和排班状态稳定，适合作为当前班次的基准人员对象。`,
        actions: pressureSignals.length > 0
            ? [
                '先确认该员工是否已完成入职或补齐当前班次安排。',
                '再核对部门覆盖与合作机构边界是否需要同步调整。',
                '最后把需交接事项写回班次或任务闭环。',
            ]
            : [
                '保持当前对象事实、排班和协同边界一致。',
                '如后续出现休假或新增任务，再回到该页复核。',
            ],
        confidence: pressureSignals.length > 0 ? 86 : 72,
    }
}

function buildAiProfile(data: AdminStaffRecord) {
    const activeDays = data.schedule.filter(item => item.shift !== '休息' && item.shift !== '待排班').length
    const pendingShiftCount = data.schedule.filter(item => item.shift === '待排班').length
    const workloadLevel = pendingShiftCount > 0 || activeDays >= 6 ? '高负荷' : '平稳'

    return {
        shiftSummary: pendingShiftCount > 0
            ? `${data.name} 当前仍有 ${pendingShiftCount} 个待排班班次，需先补齐班次再确认交接节奏。`
            : `${data.name} 当前已排 ${activeDays} 个工作班次，暂无待排班缺口。`,
        workloadLevel,
        recommendedActions: pendingShiftCount > 0
            ? [
                '优先补齐待排班班次，避免任务责任人缺口。',
                '确认合作机构或内部团队边界是否与当前班次一致。',
            ]
            : [
                '继续观察本周班次与出勤情况。',
                '如新增高优任务，优先从当前稳定班次中做调整。',
            ],
        handoverDraft: pendingShiftCount > 0
            ? `${data.name} 当前仍有待排班班次，交接前需先明确责任班次、部门协同和合作机构边界。`
            : `${data.name} 当前班次已基本明确，交接时重点同步部门安排、合作机构归属和当前绩效注意事项。`,
    }
}

export default function StaffDetailPage() {
  const params = useParams()
  const id = params.id as string
    const [data, setData] = useState<AdminStaffRecord | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let disposed = false

        async function loadDetail() {
            setLoading(true)
            setError('')

            try {
                const response = await fetchAdminStaffDetail(id)
                if (!disposed) {
                    setData(response)
                }
            } catch (loadError) {
                if (!disposed) {
                    setError(loadError instanceof Error ? loadError.message : '员工详情查询失败。')
                }
            } finally {
                if (!disposed) {
                    setLoading(false)
                }
            }
        }

        void loadDetail()
        return () => {
            disposed = true
        }
    }, [id])

    if (loading) {
        return (
            <div className="page-root animate-fade-up">
                <DataCard title="员工详情加载中" subtitle="正在从 staff live API 加载人员对象。" badge={<Tag variant="info">Live Loading</Tag>}>
                    <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                        当前正在同步人员事实、协同归属、排班摘要和绩效指标。
                    </div>
                </DataCard>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="page-root animate-fade-up">
                <DataCard title="员工详情不可用" subtitle={error || '未找到对应员工。'} badge={<Tag variant="danger">Live Error</Tag>}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                        <Link href="/staff" className="btn btn-secondary btn-sm"><ArrowLeft size={13} />返回员工页</Link>
                    </div>
                </DataCard>
            </div>
        )
    }

    const actionInsight = buildActionInsight(data)
    const aiProfile = buildAiProfile(data)
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
                <button className="btn btn-primary btn-sm flex items-center gap-2" disabled>
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
                  { label: '人员来源', value: data.employmentSource, hint: data.organizationName ?? data.partnerAgencyName ?? '内部团队', tone: data.employmentSource === '第三方合作' ? 'warning' : 'info' },
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
                                  { label: "所属机构", value: data.organizationName ?? '未绑定机构' },
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
                    <div key={`${s.day}-${i}`} style={{ padding: "8px 6px", borderRadius: 8, background: s.shift === "休息" ? "var(--color-bg)" : "var(--color-primary-light)", border: `1px solid ${s.shift === "休息" ? "var(--color-border)" : "rgba(13,148,136,0.2)"}`, textAlign: "center" }}>
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
                                  {data.certificates.length > 0 ? data.certificates.map(c => (
                    <span key={c} className="text-sm px-3 py-2 rounded-lg border" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)", background: "var(--color-bg)" }}>
                      📜 {c}
                    </span>
                  )) : (
                                      <span className="text-sm" style={{ color: 'var(--color-muted)' }}>暂无证书信息</span>
                                  )}
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
                        <div className="page-help-card-item">所属机构：{data.organizationName ?? '未绑定机构'}{data.organizationId ? ` · ${data.organizationId}` : ''}</div>
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