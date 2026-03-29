"use client"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Edit } from "lucide-react"
import { StatCard } from "@/components/nh/StatCard"

const ACTIVITY_DATA: Record<string, any> = {
  "A001": { id: "A001", name: "太极晨练", category: "运动健身", date: "2026-03-29", time: "07:00", duration: 60, participants: 28, capacity: 30, location: "院内花园", status: "进行中", teacher: "李老师", desc: "每日早晨在花园进行太极拳锻炼，助于老人舒筋活络、修身养性。" },
  "A002": { id: "A002", name: "手工编织课", category: "文娱活动", date: "2026-03-29", time: "09:00", duration: 90, participants: 15, capacity: 20, location: "三楼活动室", status: "报名中", teacher: "王老师", desc: "教老人制作简单编织品，锻炼手部精细动作，丰富业余生活。" },
}

export default function ActivityDetailPage() {
  const params = useParams()
  const id = params.id as string
  const data = ACTIVITY_DATA[id] || ACTIVITY_DATA["A001"]

  return (
    <div className="page-root animate-fade-up">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/activities" className="btn btn-ghost btn-icon btn-sm" style={{ display: "inline-flex" }}>
            <ArrowLeft size={15} />
          </Link>
          <div>
            <div className="page-title">{data.name}</div>
            <div className="page-subtitle">{data.date} {data.time} · {data.location}</div>
          </div>
        </div>
        <button className="btn btn-primary btn-sm flex items-center gap-2">
          <Edit size={13} />编辑活动
        </button>
      </div>

      <div className="kpi-grid">
        <StatCard label="参与人数" value={`${data.participants}/${data.capacity}`} sub="报名/容量" color="primary" />
        <StatCard label="活动时长" value={`${data.duration}分钟`} color="info" />
        <StatCard label="负责老师" value={data.teacher} color="purple" />
        <StatCard label="状态" value={data.status} color={data.status === "进行中" ? "success" : data.status === "报名中" ? "warning" : "info"} />
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">活动详情</div>
        </div>
        <div className="card-body">
          <p className="text-sm text-muted" style={{ lineHeight: 1.7 }}>{data.desc}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginTop: 16 }}>
            {[
              { label: "活动类型", value: data.category },
              { label: "活动地点", value: data.location },
              { label: "开始时间", value: `${data.date} ${data.time}` },
              { label: "持续时长", value: `${data.duration}分钟` },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-xs text-muted mb-1" style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{label}</div>
                <div className="text-sm font-semibold">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
