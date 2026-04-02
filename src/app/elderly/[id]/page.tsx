"use client"

import { DataCard, Tag } from "@/components/nh"
import { buildAiAssistantHref } from "@/lib/ai-context"
import { elderlyList } from "@/lib/data"
import { getElderDetailActionAiInsight } from "@/lib/mock/admin-ai"
import { getAdmissionApplicationsSnapshot, subscribeAdmissionWorkflow } from "@/lib/mock/admission-workflow"
import { getElderAiProfile } from "@/lib/mock/app-ai"
import { findLiveElderlyById } from "@/lib/mock/elderly-registry"
import { ArrowLeft, Bot, Edit, ScanFace } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useMemo, useSyncExternalStore } from "react"

type ElderDetail = {
  id: string
  name: string
  gender: "男" | "女"
  age: number
  idCard: string
  phone: string
  roomNumber: string
  careLevel: string
  checkInDate: string
  birthday: string
  emergencyContact: string
  status: "入住" | "离院" | "待入住"
  medicalHistory: string[]
  allergies: string[]
  habits: string[]
  height: number
  weight: number
}

function maskPhone(value: string) {
  if (!value || value.startsWith('待补录') || value.includes('*')) {
    return value || '待补录'
  }

  if (value.length < 7) {
    return value
  }

  return `${value.slice(0, 3)}****${value.slice(-4)}`
}

function maskIdCard(value: string) {
  if (!value || value.startsWith('待补录') || value.includes('*')) {
    return value || '待补录'
  }

  if (value.length < 8) {
    return value
  }

  return `${value.slice(0, 3)}***********${value.slice(-4)}`
}

function formatRoom(roomNumber: string, bedNumber: string) {
  return bedNumber && bedNumber !== '-' ? `${roomNumber}-${bedNumber}` : roomNumber
}

function buildDetail(id: string, applications: ReturnType<typeof getAdmissionApplicationsSnapshot>): ElderDetail {
  const fallback = elderlyList[0]
  const record = findLiveElderlyById(id, applications) ?? fallback

  return {
    id: record.id,
    name: record.name,
    gender: record.gender,
    age: record.age,
    idCard: maskIdCard(record.idCard),
    phone: maskPhone(record.phone),
    roomNumber: formatRoom(record.roomNumber, record.bedNumber),
    careLevel: record.careLevel,
    checkInDate: record.checkInDate,
    birthday: record.birthDate,
    emergencyContact: `${record.emergencyContact} ${maskPhone(record.emergencyPhone)}`.trim(),
    status: record.status,
    medicalHistory: record.medicalHistory.length > 0 ? record.medicalHistory : ['待补录'],
    allergies: record.allergies.length > 0 ? record.allergies : ['无'],
    habits: record.remarks ? [record.remarks] : ['待补录'],
    height: 165,
    weight: 60,
  }
}

export default function ElderlyDetailPage() {
  const params = useParams()
  const id = params.id as string
  const applications = useSyncExternalStore(
    subscribeAdmissionWorkflow,
    getAdmissionApplicationsSnapshot,
    getAdmissionApplicationsSnapshot,
  )
  const data = useMemo(() => buildDetail(id, applications), [applications, id])
  const aiProfile = getElderAiProfile(data.id)
  const actionInsight = getElderDetailActionAiInsight({
    id: data.id,
    name: data.name,
    roomNumber: data.roomNumber,
    careLevel: data.careLevel,
    medicalHistory: [...data.medicalHistory],
    allergies: [...data.allergies],
    status: data.status,
  })
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'elderly-detail',
    entityId: data.id,
    entityName: data.name,
    focus,
    target,
  })

  return (
    <div className="page-root animate-fade-up">

      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/elderly" className="btn btn-ghost btn-icon btn-sm" style={{ display: "inline-flex" }}>
            <ArrowLeft size={15} />
          </Link>
          <div className="avatar avatar-lg" style={{ width: 44, height: 44, fontSize: 16 }}>
            {data.name.slice(0, 1)}
          </div>
          <div>
            <div className="page-title">{data.name}</div>
            <div className="page-subtitle">{data.roomNumber} · {data.gender} · {data.age}岁 · {data.careLevel}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href={`/elderly/face?selected=${data.id}&entry=elderly-detail`} className="btn btn-secondary btn-sm flex items-center gap-2">
            <ScanFace size={13} />人脸录入
          </Link>
          <button className="btn btn-primary btn-sm flex items-center gap-2">
            <Edit size={13} />编辑信息
          </button>
        </div>
      </div>

      {/* Basic info */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">基本信息</div>
        </div>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {[
              { label: "姓名", value: data.name },
              { label: "性别", value: data.gender },
              { label: "年龄", value: `${data.age}岁` },
              { label: "身份证", value: data.idCard },
              { label: "联系电话", value: data.phone },
              { label: "入住日期", value: data.checkInDate },
              { label: "房间号", value: data.roomNumber },
              { label: "护理等级", value: data.careLevel },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-xs text-muted mb-1" style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{label}</div>
                <div className="text-sm font-semibold">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Medical info */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">健康信息</div>
        </div>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {[
              { label: "既往病史", value: data.medicalHistory.join("、") },
              { label: "过敏史", value: data.allergies.join("、") },
              { label: "生活习惯", value: data.habits.join("、") },
              { label: "身高/体重", value: `${data.height}cm / ${data.weight}kg` },
              { label: "紧急联系人", value: data.emergencyContact },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-xs text-muted mb-1" style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{label}</div>
                <div className="text-sm font-semibold">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16 }}>
        <DataCard title="AI 状态摘要" subtitle="把当前健康、报警和后续动作压缩成可读结论。" badge={<Tag variant="primary">Admin + Family AI</Tag>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ padding: 14, borderRadius: 10, background: "var(--color-bg)", fontSize: 13, lineHeight: 1.7, color: "var(--color-text)" }}>
              {aiProfile.statusSummary}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-primary)", fontWeight: 700 }}>置信度 {aiProfile.confidence}%</div>
            <div style={{ display: "grid", gap: 8 }}>
              {aiProfile.followupActions.map(item => (
                <div key={item} style={{ fontSize: 12.5, lineHeight: 1.6, color: "var(--color-muted)" }}>• {item}</div>
              ))}
            </div>
            <div>
              <Link href={buildAiHref('elder-status', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
            </div>
          </div>
        </DataCard>

        <DataCard title="家属端摘要草稿" subtitle="同一份数据在家属端的表达应更温和、更结论导向。">
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ padding: 14, borderRadius: 10, background: "var(--color-bg)", fontSize: 13, lineHeight: 1.7, color: "var(--color-text)" }}>
              {aiProfile.familyBrief}
            </div>
            <div>
              <Link href={buildAiHref('family-brief', 'logs')} className="btn btn-secondary btn-sm">带上下文追踪</Link>
            </div>
          </div>
        </DataCard>
      </div>

      <DataCard title={actionInsight.title} subtitle="把病史、护理等级和房间上下文转成管理侧跟进动作。" badge={<Tag variant="warning">Admin Follow-up</Tag>}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 700, color: "var(--color-text)" }}>
            <Bot size={16} style={{ color: "var(--color-primary)" }} />
            AI 管理动作
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
            <Link href={buildAiHref('elder-management', 'rules')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
          </div>
        </div>
      </DataCard>
    </div>
  )
}
