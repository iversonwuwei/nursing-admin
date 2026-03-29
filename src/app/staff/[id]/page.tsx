"use client"
import { Tag, type TagVariant } from "@/components/nh"
import { ArrowLeft, Edit } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

const STAFF_DATA = {
  "S001": {
    id: "S001", name: "陈美华", role: "护士长", department: "护理部",
    phone: "138****0001", email: "chenmh@nursinghome.com",
    gender: "女", age: 38, status: "在职",
    performance: 92, attendance: 98, satisfaction: 95,
    hireDate: "2019-06-01",
    schedule: [
      { day: "周一", shift: "白班" }, { day: "周二", shift: "白班" },
      { day: "周三", shift: "白班" }, { day: "周四", shift: "休息" },
      { day: "周五", shift: "白班" }, { day: "周六", shift: "白班" },
      { day: "周日", shift: "休息" },
    ],
    certificates: ["护士执业证书", "护理管理培训证书", "急救证书"],
    bonus: "¥2,000",
  },
} as const

type StaffDetail = (typeof STAFF_DATA)[keyof typeof STAFF_DATA]

const ROLE_TAG: Record<string, TagVariant> = { "护士长": "primary", "护士": "info", "护工": "warning", "医生": "danger", "后勤": "neutral" }

export default function StaffDetailPage() {
  const params = useParams()
  const id = params.id as string
  const data: StaffDetail = id in STAFF_DATA ? STAFF_DATA[id as keyof typeof STAFF_DATA] : STAFF_DATA["S001"]

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
              <Tag variant="success">{data.status}</Tag>
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
    </div>
  )
}
