"use client"
import { DataCard, Tag, type TagVariant } from "@/components/nh"
import { buildAiAssistantHref } from "@/lib/ai-context"
import { getRoomCareActionInsight, getRoomDetailAiInsight } from "@/lib/mock/admin-ai"
import { ArrowLeft, Bot, DoorOpen, Edit } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

const ROOM_DATA = {
  "R201": {
    id: "R201", floor: 2, floorName: "二楼东", type: "单人间",
    beds: 1, occupied: 1,
    facilities: ["空调", "独立卫浴", "紧急呼叫"],
    status: "正常",
    beds_info: [{ id: 1, elder: { name: "张桂英", id: "E001", careLevel: "特级护理", checkIn: "2022-03-15" }, status: "occupied" }],
    clean_status: "已清洁",
    last_clean: "2026-03-29 06:00",
    next_clean: "2026-03-30 06:00",
  },
} as const

type RoomDetail = (typeof ROOM_DATA)[keyof typeof ROOM_DATA]

const TYPE_TAG: Record<string, TagVariant> = { "单人间": "info", "双人间": "primary", "VIP套房": "warning" }

export default function RoomDetailPage() {
  const params = useParams()
  const id = params.id as string
  const data: RoomDetail = id in ROOM_DATA ? ROOM_DATA[id as keyof typeof ROOM_DATA] : ROOM_DATA["R201"]
  const aiInsight = getRoomDetailAiInsight({
    id: data.id,
    type: data.type,
    beds: data.beds,
    occupied: data.occupied,
    status: data.status,
    cleanStatus: data.clean_status,
    lastClean: data.last_clean,
    nextClean: data.next_clean,
    facilities: [...data.facilities],
    bedOccupants: data.beds_info.map(item => ({ careLevel: item.elder?.careLevel, elderName: item.elder?.name })),
  })
  const careInsight = getRoomCareActionInsight({
    id: data.id,
    type: data.type,
    beds: data.beds,
    occupied: data.occupied,
    status: data.status,
    cleanStatus: data.clean_status,
    lastClean: data.last_clean,
    nextClean: data.next_clean,
    facilities: [...data.facilities],
    bedOccupants: data.beds_info.map(item => ({ careLevel: item.elder?.careLevel, elderName: item.elder?.name })),
  })
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = "inference") => buildAiAssistantHref({
    source: 'room-detail',
    entityId: data.id,
    entityName: data.id,
    focus,
    target,
  })

  return (
    <div className="page-root animate-fade-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/rooms" className="btn btn-ghost btn-icon btn-icon-sm btn-icon">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold" style={{ letterSpacing: "-0.02em" }}>{data.id}</h1>
              <Tag variant={TYPE_TAG[data.type]}>{data.type}</Tag>
              <Tag variant={data.status === "空闲" ? "success" : "neutral"}>{data.status}</Tag>
            </div>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              {data.floorName} · {data.facilities.join(" · ")}
            </p>
          </div>
        </div>
        <button className="btn btn-primary btn-sm flex items-center gap-2">
          <Edit size={14} />编辑房间
        </button>
      </div>

      <DataCard
        icon={<Bot size={16} />}
        title={aiInsight.title}
        subtitle="将房间状态、清洁节奏和入住对象转成可执行建议。"
        badge={<Tag variant="primary">Room AI</Tag>}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ borderRadius: 12, background: "var(--color-bg)", padding: 14, fontSize: 12.5, lineHeight: 1.7, color: "var(--color-text)" }}>
            {aiInsight.summary}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {aiInsight.actions.map(action => (
              <div key={action} style={{ borderRadius: 10, border: "1px solid var(--color-border)", padding: "10px 12px", fontSize: 12.5, lineHeight: 1.6, color: "var(--color-text)" }}>
                {action}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 12, color: "var(--color-primary)", fontWeight: 600 }}>置信度 {aiInsight.confidence}%</div>
            <Link href={buildAiHref('room-overview', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
          </div>
        </div>
      </DataCard>

      <DataCard
        icon={<Bot size={16} />}
        title={careInsight.title}
        subtitle="把床位照护、设施巡检和清洁节奏压成当班动作。"
        badge={<Tag variant="warning">Care Follow-up</Tag>}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ borderRadius: 12, background: "var(--color-bg)", padding: 14, fontSize: 12.5, lineHeight: 1.7, color: "var(--color-text)" }}>
            {careInsight.summary}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {careInsight.actions.map(action => (
              <div key={action} style={{ borderRadius: 10, border: "1px solid var(--color-border)", padding: "10px 12px", fontSize: 12.5, lineHeight: 1.6, color: "var(--color-text)" }}>
                {action}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 12, color: "var(--color-primary)", fontWeight: 600 }}>置信度 {careInsight.confidence}%</div>
            <Link href={buildAiHref('room-care', 'logs')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
          </div>
        </div>
      </DataCard>

      {/* Bed overview */}
      <DataCard>
        <div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[...Array(data.beds)].map((_, i) => {
              const bed = data.beds_info[i]
              const isOccupied = bed?.status === "occupied"
              return (
                <div key={i} style={{
                  flex: "1 1 240px",
                  padding: "16px 18px",
                  borderRadius: 12,
                  border: `1.5px solid ${isOccupied ? "var(--color-primary)" : "var(--color-border)"}`,
                  background: isOccupied ? "var(--color-primary-light)" : "var(--color-bg)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: isOccupied ? "var(--color-primary)" : "var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <DoorOpen size={18} style={{ color: isOccupied ? "white" : "var(--color-muted)" }} />
                  </div>
                  {isOccupied && bed.elder ? (
                    <div>
                      <div className="font-semibold text-sm">{bed.elder.name}</div>
                      <div className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>{bed.elder.careLevel} · 入住 {bed.elder.checkIn}</div>
                      <Link href={`/elderly/${bed.elder.id}`} className="btn btn-ghost btn-sm mt-2" style={{ fontSize: 11, height: 24, padding: "0 6px" }}>查看详情</Link>
                    </div>
                  ) : (
                    <div>
                      <div className="font-semibold text-sm" style={{ color: "var(--color-muted)" }}>空闲</div>
                      <div className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>可安排入住</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </DataCard>

      {/* Room info */}
      <DataCard icon={<DoorOpen size={15} />} title="房间信息">
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {[
              { label: "房间编号", value: data.id },
              { label: "楼层", value: data.floorName },
              { label: "房间类型", value: data.type },
              { label: "床位数", value: `${data.beds}床` },
              { label: "清洁状态", value: data.clean_status },
              { label: "上次清洁", value: data.last_clean },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-xs font-semibold" style={{ color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                <div className="text-sm font-semibold">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </DataCard>

      {/* Facilities */}
      <DataCard icon={<DoorOpen size={15} />} title="房间设施">
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {data.facilities.map((f: string) => (
              <span key={f} className="text-sm px-3 py-2 rounded-lg border" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)", background: "var(--color-bg)" }}>
                ✓ {f}
              </span>
            ))}
          </div>
        </div>
      </DataCard>
    </div>
  )
}
