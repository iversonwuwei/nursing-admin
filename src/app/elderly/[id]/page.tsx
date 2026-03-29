"use client"
import { ArrowLeft, Edit } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

const ELDER_DATA = {
  "1": { id: "1", name: "张桂英", gender: "女", age: 82, idCard: "310***********1234", phone: "138****1234", roomNumber: "201-1", careLevel: "特级护理", checkInDate: "2022-03-15", birthday: "1942-08-15", emergencyContact: "张伟 139****1234", status: "入住", medicalHistory: ["高血压", "糖尿病"], allergies: ["青霉素"], habits: ["吸烟史10年"], height: 165, weight: 68 },
  "E001": { id: "E001", name: "张桂英", gender: "女", age: 82, idCard: "310***********1234", phone: "138****1234", roomNumber: "201-1", careLevel: "特级护理", checkInDate: "2022-03-15", birthday: "1942-08-15", emergencyContact: "张伟 139****1234", status: "入住", medicalHistory: ["高血压", "糖尿病"], allergies: ["青霉素"], habits: ["吸烟史10年"], height: 165, weight: 68 },
} as const

type ElderDetail = (typeof ELDER_DATA)[keyof typeof ELDER_DATA]

export default function ElderlyDetailPage() {
  const params = useParams()
  const id = params.id as string
  const data: ElderDetail = id in ELDER_DATA ? ELDER_DATA[id as keyof typeof ELDER_DATA] : ELDER_DATA["E001"]

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
        <button className="btn btn-primary btn-sm flex items-center gap-2">
          <Edit size={13} />编辑信息
        </button>
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
    </div>
  )
}
