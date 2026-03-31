"use client"
import { DataCard, Tag, type TagVariant } from "@/components/nh"
import { buildAiAssistantHref } from "@/lib/ai-context"
import { getIncidentAiInsight, getIncidentFollowupInsight } from "@/lib/mock/admin-ai"
import { ArrowLeft, Bot, Edit } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"

const INCIDENT_DATA = {
  "I001": {
    id: "I001", title: "老人摔倒", level: "严重", elder: "张桂英", room: "201-1",
    reporter: "刘建国", reporterRole: "护工", time: "2026-03-28 16:30",
    status: "处理中", desc: "老人在如厕时不慎摔倒，右臂有擦伤，血压偏高。发现后立即通知医护，已送医处理，X光显示无骨折。",
    handling: ["发现后立即通知医护", "已送至仁济医院急诊", "联系家属告知情况", "安排24小时特护"],
    nextStep: "持续观察，3天后复诊",
    attachments: ["现场照片.jpg", "病历卡扫描件.pdf"],
  },
  "I002": {
    id: "I002", title: "设备故障", level: "一般", elder: null, room: "三楼走廊",
    reporter: "赵晓敏", reporterRole: "护士", time: "2026-03-27 09:15",
    status: "已结案", desc: "三楼走廊照明灯故障，影响夜间巡查。已联系后勤维修，当日下午修复完成。",
    handling: ["联系后勤部门报修", "临时增加手电筒照明", "后勤维修人员当天修复", "验收确认恢复正常"],
    nextStep: null,
    attachments: ["故障现场.jpg"],
  },
  "I003": {
    id: "I003", title: "老人走失", level: "严重", elder: "王建国", room: "203-2",
    reporter: "陈美华", reporterRole: "护士长", time: "2026-03-26 14:00",
    status: "已结案", desc: "老人趁午休时间私自外出，14:00被发现不在房间。启动应急预案，30分钟后在附近公园找到，老人安全。",
    handling: ["14:05启动走失应急预案", "联系家属确认老人去向", "调取监控确认外出方向", "30分钟后在公园找到"],
    nextStep: "加强门禁管理，增设离院报警",
    attachments: ["监控截图.jpg", "找回照片.jpg"],
  },
} as const

type IncidentDetail = (typeof INCIDENT_DATA)[keyof typeof INCIDENT_DATA]

const LEVEL_TAG: Record<string, TagVariant> = { "严重": "danger", "一般": "warning", "轻微": "info" }
const STATUS_TAG: Record<string, TagVariant> = { "处理中": "warning", "已结案": "success" }

const TABS = [
  { id: "info", label: "事故信息" },
  { id: "process", label: "处理过程" },
  { id: "file", label: "附件材料" },
]

export default function IncidentDetailPage() {
  const params = useParams()
  const id = params.id as string
  const data: IncidentDetail = id in INCIDENT_DATA ? INCIDENT_DATA[id as keyof typeof INCIDENT_DATA] : INCIDENT_DATA["I001"]
  const incidentAiInput = {
    ...data,
    handling: [...data.handling],
    attachments: [...data.attachments],
  }
  const [activeTab, setActiveTab] = useState("info")
  const aiInsight = getIncidentAiInsight(incidentAiInput)
  const followupInsight = getIncidentFollowupInsight(incidentAiInput)
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'incident-detail',
    entityId: data.id,
    entityName: data.title,
    focus,
    target,
  })

  return (
    <div className="page-root animate-fade-up">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/incidents" className="btn btn-ghost btn-icon btn-icon-sm btn-icon">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold" style={{ letterSpacing: "-0.02em" }}>{data.title}</h1>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              编号: {data.id} · {data.time}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tag variant={LEVEL_TAG[data.level]}>{data.level}</Tag>
          <Tag variant={STATUS_TAG[data.status]}>{data.status}</Tag>
          <button className="btn btn-primary btn-sm flex items-center gap-2">
            <Edit size={14} />编辑
          </button>
        </div>
      </div>

      <DataCard
        icon={<Bot size={16} />}
        title={aiInsight.title}
        subtitle="补充事故解释、闭环标准和后续动作，最终结论仍以人工复盘为准。"
        badge={<Tag variant="warning">AI 草稿</Tag>}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ borderRadius: 12, background: "var(--color-bg)", padding: 14, fontSize: 12.5, lineHeight: 1.7, color: "var(--color-text)" }}>
            {aiInsight.summary}
          </div>
          <div style={{ borderRadius: 12, border: "1px solid var(--color-border)", padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-warning)" }}>闭环风险</div>
            <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.7, color: "var(--color-text)" }}>{aiInsight.risk}</div>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {aiInsight.actions.map(action => (
              <div key={action} style={{ borderRadius: 10, border: "1px solid var(--color-border)", padding: "10px 12px", fontSize: 12.5, lineHeight: 1.6, color: "var(--color-text)" }}>
                {action}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.7, color: "var(--color-muted)" }}>{aiInsight.closureHint}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 12, color: "var(--color-primary)", fontWeight: 600 }}>置信度 {aiInsight.confidence}%</div>
            <Link href={buildAiHref('incident-explanation', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
          </div>
        </div>
      </DataCard>

      <DataCard
        icon={<Bot size={16} />}
        title={followupInsight.title}
        subtitle="把事故处理节点压缩成复盘和留痕动作。"
        badge={<Tag variant="info">Closure Follow-up</Tag>}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ borderRadius: 12, background: "var(--color-bg)", padding: 14, fontSize: 12.5, lineHeight: 1.7, color: "var(--color-text)" }}>
            {followupInsight.summary}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {followupInsight.actions.map(action => (
              <div key={action} style={{ borderRadius: 10, border: "1px solid var(--color-border)", padding: "10px 12px", fontSize: 12.5, lineHeight: 1.6, color: "var(--color-text)" }}>
                {action}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 12, color: "var(--color-primary)", fontWeight: 600 }}>置信度 {followupInsight.confidence}%</div>
            <Link href={buildAiHref('incident-followup', 'logs')} className="btn btn-secondary btn-sm">带上下文追踪</Link>
          </div>
        </div>
      </DataCard>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--color-border)", paddingBottom: 0 }}>
        {TABS.map(({ id: tabId, label }) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 16px",
              fontSize: 13, fontWeight: activeTab === tabId ? 600 : 450,
              color: activeTab === tabId ? "var(--color-primary)" : "var(--color-muted)",
              background: "transparent", border: "none", cursor: "pointer",
              borderBottom: activeTab === tabId ? "2px solid var(--color-primary)" : "2px solid transparent",
              marginBottom: -1, transition: "all 150ms ease", borderRadius: "6px 6px 0 0",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "info" && (
          <div className="data-card">
            <div className="data-card-body">
              <p className="text-sm" style={{ color: "var(--color-muted)", lineHeight: 1.7, marginBottom: 16 }}>
                {data.desc}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                {[
                  { label: "涉及老人", value: data.elder || "无" },
                  { label: "发生地点", value: data.room },
                  { label: "报告人", value: `${data.reporter}（${data.reporterRole}）` },
                  { label: "发生时间", value: data.time },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-xs font-semibold" style={{ color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                    <div className="text-sm font-semibold">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "process" && (
          <div className="data-card">
            <div className="data-card-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {data.handling.map((step: string, i: number) => (
                  <div key={i} style={{ display: "flex", gap: 12, paddingBottom: i < data.handling.length - 1 ? 12 : 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                      <div className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ background: "var(--color-primary)", color: "white" }}>
                        {i + 1}
                      </div>
                      {i < data.handling.length - 1 && <div style={{ width: 2, flex: 1, background: "var(--color-border)", marginTop: 4 }} />}
                    </div>
                    <div className="text-sm pt-1" style={{ color: "var(--color-muted)" }}>{step}</div>
                  </div>
                ))}
              </div>
              {data.nextStep && (
                <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <div className="text-xs font-bold mb-1" style={{ color: "var(--color-warning)" }}>后续跟进</div>
                  <div className="text-sm" style={{ color: "var(--color-muted)" }}>{data.nextStep}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "file" && (
          <div className="data-card">
            <div className="data-card-body">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {data.attachments.map((f: string) => (
                  <div key={f} className="text-sm px-3 py-2 rounded-lg border cursor-pointer" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)", background: "rgba(120,113,108,0.15)" }}>
                    📎 {f}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <button className="btn btn-primary btn-sm" style={{ width: "fit-content" }}>更新处理进度</button>
                <button className="btn btn-secondary btn-sm" style={{ width: "fit-content" }}>通知家属</button>
                <button className="btn btn-secondary btn-sm" style={{ width: "fit-content" }}>打印事故报告</button>
                {data.status === "处理中" && (
                  <button className="btn btn-danger btn-sm" style={{ width: "fit-content" }}>申请结案</button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
