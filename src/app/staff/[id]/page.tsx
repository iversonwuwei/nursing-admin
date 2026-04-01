"use client"
import { useMemo, useSyncExternalStore } from 'react'
import { DataCard, Tag, type TagVariant } from "@/components/nh"
import { buildAiAssistantHref } from "@/lib/ai-context"
import { getStaffDetailActionAiInsight } from "@/lib/mock/admin-ai"
import { getStaffAiProfile } from "@/lib/mock/app-ai"
import { findLiveStaffById, getResourceSnapshot, subscribeResourceWorkflow } from '@/lib/mock/resource-workflow'
import { ArrowLeft, Bot, Edit } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

const ROLE_TAG: Record<string, TagVariant> = { "护理主管": "primary", "护士": "info", "后勤主管": "warning", "心理咨询师": "purple", "厨师长": "neutral" }

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

  return (
    <div className="page-root animate-fade-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/staff" className="btn btn-ghost btn-icon btn-icon-sm btn-icon">
            <ArrowLeft size={16} />
          </Link>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--color-primary-light)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, flexShrink: 0 }}>
            {data.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold" style={{ letterSpacing: "-0.02em" }}>{data.name}</h1>
              <Tag variant={ROLE_TAG[data.role]}>{data.role}</Tag>
              <Tag variant={data.status === '在职' ? 'success' : data.status === '待入职' ? 'warning' : 'neutral'}>{data.status}</Tag>
            </div>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              工号: {data.id} · {data.department}
            </p>
          </div>
        </div>
        <button className="btn btn-primary btn-sm flex items-center gap-2">
          <Edit size={14} />编辑信息
        </button>
      </div>

      {/* Basic info */}
      <div className="data-card">
        <div className="data-card-header">
          <div className="data-card-title">
            <div className="data-card-icon-wrap"><span style={{ fontSize: 14 }}>👤</span></div>
            <div className="text-sm font-bold">基本信息</div>
          </div>
        </div>
        <div className="data-card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {[
              { label: "姓名", value: data.name },
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
        </div>
      </div>

      {/* Schedule */}
      <div className="data-card">
        <div className="data-card-header">
          <div className="data-card-title">
            <div className="data-card-icon-wrap"><span style={{ fontSize: 14 }}>📅</span></div>
            <div className="text-sm font-bold">本周排班</div>
          </div>
        </div>
        <div className="data-card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
            {data.schedule.map((s, i) => (
              <div key={i} style={{ padding: "8px 6px", borderRadius: 8, background: s.shift === "休息" ? "var(--color-bg)" : "var(--color-primary-light)", border: `1px solid ${s.shift === "休息" ? "var(--color-border)" : "rgba(13,148,136,0.2)"}`, textAlign: "center" }}>
                <div className="text-xs mb-1" style={{ color: "var(--color-muted)" }}>{s.day}</div>
                <div className="text-xs font-semibold" style={{ color: s.shift === "休息" ? "var(--color-muted)" : "var(--color-primary)" }}>{s.shift}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance + certificates */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="data-card">
          <div className="data-card-header">
            <div className="data-card-title">
              <div className="data-card-icon-wrap"><span style={{ fontSize: 14 }}>📊</span></div>
              <div className="text-sm font-bold">绩效数据</div>
            </div>
          </div>
          <div className="data-card-body">
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
          </div>
        </div>

        <div className="data-card">
          <div className="data-card-header">
            <div className="data-card-title">
              <div className="data-card-icon-wrap"><span style={{ fontSize: 14 }}>📜</span></div>
              <div className="text-sm font-bold">资质证书</div>
            </div>
          </div>
          <div className="data-card-body">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {data.certificates.map((c: string) => (
                <span key={c} className="text-sm px-3 py-2 rounded-lg border" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)", background: "var(--color-bg)" }}>
                  📜 {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
                <div key={item} style={{ fontSize: 12.5, lineHeight: 1.6, color: "var(--color-text)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "10px 12px" }}>{item}</div>
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
                <div key={item} style={{ fontSize: 12.5, lineHeight: 1.6, color: "var(--color-muted)" }}>• {item}</div>
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
      </div>
    </div>
  )
}
