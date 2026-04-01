"use client"
import { DataCard, Tag, type TagVariant } from "@/components/nh"
import { buildAiAssistantHref } from "@/lib/ai-context"
import { getEquipmentDetailAiInsight, getEquipmentMaintenanceNarratives } from "@/lib/mock/admin-ai"
import { findLiveEquipmentById, getResourceSnapshot, subscribeResourceWorkflow } from '@/lib/mock/resource-workflow'
import { ArrowLeft, Bot, Edit, Monitor } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useMemo, useSyncExternalStore } from 'react'

const STATUS_TAG: Record<string, TagVariant> = { '正常': 'success', '待维修': 'warning', '维修中': 'warning', '已报废': 'danger' }

export default function EquipmentDetailPage() {
  const params = useParams()
  const id = params.id as string
  const snapshot = useSyncExternalStore(
    subscribeResourceWorkflow,
    getResourceSnapshot,
    getResourceSnapshot,
  )
  const data = useMemo(
    () => findLiveEquipmentById(id, snapshot) ?? snapshot.equipment[0],
    [id, snapshot],
  )
  const maintenance = useMemo(
    () => ({
      last: data.activatedAt?.slice(0, 10) ?? data.purchaseDate,
      next: data.maintenanceDate,
      cycle: `${data.maintenanceCycle}个月`,
    }),
    [data.activatedAt, data.maintenanceCycle, data.maintenanceDate, data.purchaseDate],
  )
  const aiInsight = getEquipmentDetailAiInsight({
    id: data.id,
    name: data.name,
    room: data.room,
    type: data.type,
    status: data.status,
    signal: data.signal,
    battery: data.battery,
    uptime: data.uptime,
    maintenance,
    history: data.history.map(item => ({ ...item })),
  })
  const maintenanceNarratives = getEquipmentMaintenanceNarratives({
    id: data.id,
    name: data.name,
    room: data.room,
    type: data.type,
    status: data.status,
    signal: data.signal,
    battery: data.battery,
    uptime: data.uptime,
    maintenance,
    history: data.history.map(item => ({ ...item })),
  })
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = "inference") => buildAiAssistantHref({
    source: 'equipment-detail',
    entityId: data.id,
    entityName: data.name,
    focus,
    target,
  })

  return (
    <div className="page-root animate-fade-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/equipment" className="btn btn-ghost btn-icon btn-icon-sm btn-icon">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold" style={{ letterSpacing: "-0.02em" }}>{data.name}</h1>
              <Tag variant="neutral">{data.type}</Tag>
              <Tag variant={STATUS_TAG[data.status]}>{data.status}</Tag>
            </div>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              编号: {data.id} · {data.room}
            </p>
          </div>
        </div>
        <button className="btn btn-primary btn-sm flex items-center gap-2">
          <Edit size={14} />编辑
        </button>
      </div>

      <DataCard
        icon={<Bot size={16} />}
        title={aiInsight.title}
        subtitle="把实时状态、历史波动和维护节奏转成设备跟进建议。"
        badge={<Tag variant="warning">Device AI</Tag>}
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
            <Link href={buildAiHref('device-status', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
          </div>
        </div>
      </DataCard>

      <DataCard
        icon={<Monitor size={16} />}
        title="AI 维保摘要"
        subtitle="把维保时间窗和异常波动压缩成设备部可执行的跟进项。"
        badge={<Tag variant="info">Maintenance</Tag>}
      >
        <div style={{ display: "grid", gap: 10 }}>
          {maintenanceNarratives.map(item => (
            <div key={item} style={{ borderRadius: 12, background: "var(--color-bg)", padding: 14, fontSize: 12.5, lineHeight: 1.7, color: "var(--color-text)" }}>
              {item}
            </div>
          ))}
          <div>
            <Link href={buildAiHref('maintenance-follow-up', 'logs')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
          </div>
        </div>
      </DataCard>

      {/* Real-time metrics */}
      <div className="data-card">
        <div className="data-card-header">
          <div className="data-card-title">
            <div className="data-card-icon-wrap"><Monitor size={15} /></div>
            <div className="text-sm font-bold">实时指标</div>
            <span className="ml-auto text-xs font-semibold" style={{ color: "var(--color-success)" }}>
              ● LIVE
            </span>
          </div>
        </div>
        <div className="data-card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "心率", value: `${data.metrics.hr}`, unit: "bpm" },
              { label: "血压", value: data.metrics.bp, unit: "mmHg" },
              { label: "体温", value: `${data.metrics.temp}`, unit: "℃" },
              { label: "血氧", value: `${data.metrics.spo2}`, unit: "%" },
            ].map(({ label, value, unit }) => (
              <div key={label} style={{ padding: "12px 14px", background: "var(--color-bg)", borderRadius: 10, textAlign: "center" }}>
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                <div className="text-2xl font-extrabold" style={{ color: "var(--color-primary)" }}>{value}</div>
                <div className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>{unit}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="data-card">
        <div className="data-card-header">
          <div className="data-card-title">
            <div className="data-card-icon-wrap"><Monitor size={15} /></div>
            <div className="text-sm font-bold">历史数据</div>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead><tr><th>时间</th><th>心率(bpm)</th><th>血氧(%)</th><th>备注</th></tr></thead>
            <tbody>
              {data.history.map((h, i) => (
                <tr key={i}>
                  <td><span className="text-sm" style={{ color: "var(--color-muted)" }}>{h.time}</span></td>
                  <td><span className="font-semibold text-sm">{h.hr}</span></td>
                  <td><span className="font-semibold text-sm">{h.spo2}</span></td>
                  <td><span className="text-sm" style={{ color: "var(--color-muted)" }}>{h.note}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info */}
      <div className="data-card">
        <div className="data-card-header">
          <div className="data-card-title">
            <div className="data-card-icon-wrap"><Monitor size={15} /></div>
            <div className="text-sm font-bold">设备信息</div>
          </div>
        </div>
        <div className="data-card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {[
              { label: "设备型号", value: data.model },
              { label: "序列号", value: data.serialNumber },
              { label: "安装位置", value: data.room },
              { label: "最近维护", value: maintenance.last },
              { label: "下次维护", value: maintenance.next },
              { label: "维护周期", value: maintenance.cycle },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-xs font-semibold" style={{ color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                <div className="text-sm font-semibold">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
