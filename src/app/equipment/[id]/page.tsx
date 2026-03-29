"use client"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Monitor, ArrowLeft, Edit } from "lucide-react"
import { DataCard, Tag } from "@/components/nh"

const DEVICE_DATA: Record<string, any> = {
  "EQ001": {
    id: "EQ001", name: "心电监护仪 #1", room: "201-1床", type: "医疗设备",
    model: "Philips IntelliVue MX450", serialNumber: "PH-2024-00123",
    status: "online", signal: 92, battery: 85, uptime: 720,
    metrics: { hr: 72, bp: "120/80", temp: 36.5, spo2: 98 },
    history: [
      { time: "16:00", hr: 72, spo2: 98, note: "数据正常" },
      { time: "14:00", hr: 75, spo2: 97, note: "轻微波动" },
      { time: "12:00", hr: 70, spo2: 98, note: "正常" },
    ],
    maintenance: { last: "2026-02-15", next: "2026-05-15", cycle: "3个月" },
  },
}

const STATUS_TAG: Record<string, string> = { "online": "success", "offline": "danger", "warning": "warning" }

export default function EquipmentDetailPage() {
  const params = useParams()
  const id = params.id as string
  const data = DEVICE_DATA[id] || DEVICE_DATA["EQ001"]

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
              <Tag variant={STATUS_TAG[data.status] as any}>{data.status === "online" ? "在线" : data.status === "offline" ? "离线" : "异常"}</Tag>
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
              {data.history.map((h: any, i: number) => (
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
              { label: "最近维护", value: data.maintenance.last },
              { label: "下次维护", value: data.maintenance.next },
              { label: "维护周期", value: data.maintenance.cycle },
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
