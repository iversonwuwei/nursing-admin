"use client"
import { StatCard, PageHeader } from "@/components/nh"
import { Building2, ChevronRight } from "lucide-react"

const BRANCHES = [
  { id: "B001", name: "总院", address: "朝阳区建国路88号", beds: 120, occupied: 108, staff: 45, revenue: "¥2,840,000" },
  { id: "B002", name: "分院A", address: "海淀区中关村大街12号", beds: 80, occupied: 72, staff: 30, revenue: "¥1,920,000" },
  { id: "B003", name: "分院B", address: "东城区东单北大街56号", beds: 60, occupied: 45, staff: 22, revenue: "¥1,380,000" },
  { id: "B004", name: "分院C", address: "西城区金融街28号", beds: 40, occupied: 32, staff: 15, revenue: "¥960,000" },
]

const ACCENT = ["primary", "info", "success", "purple"]

export default function BranchPage() {
  const totalBeds = BRANCHES.reduce((s, b) => s + b.beds, 0)
  const totalOccupied = BRANCHES.reduce((s, b) => s + b.occupied, 0)

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title="分院管理"
        subtitle={`共 ${BRANCHES.length} 家分院 · 总床位 ${totalBeds} 张`}
      />

      <div className="kpi-grid">
        <StatCard label="分院总数" value={BRANCHES.length} color="primary" />
        <StatCard label="床位总数" value={totalBeds} sub="在院 1,320 人" color="info" />
        <StatCard label="在院老人" value={totalOccupied} sub="整体入住率" color="success" />
        <StatCard label="员工总数" value={BRANCHES.reduce((s, b) => s + b.staff, 0)} sub="医护人员" color="purple" />
      </div>

      <div className="flex flex-col gap-2">
        {BRANCHES.map((branch, i) => {
          const occ = Math.round(branch.occupied / branch.beds * 100)
          const accentClass = ACCENT[i % ACCENT.length]
          return (
            <div key={branch.id} className={`card p-4 table-hover-row transition-all ${accentClass}`} style={{ padding: "16px 20px" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div style={{
                    width: 42, height: 42, borderRadius: 8, flexShrink: 0,
                    background: `rgba(13,148,136,0.1)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Building2 size={18} style={{ color: "var(--color-primary)" }} />
                  </div>
                  <div>
                    <div className="font-bold text-sm mb-1">{branch.name}</div>
                    <div className="text-xs text-muted">{branch.address}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {[
                    { label: "床位", value: branch.beds },
                    { label: "在院", value: branch.occupied },
                    { label: "入住率", value: `${occ}%` },
                    { label: "员工", value: branch.staff },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ textAlign: "center", minWidth: 44 }}>
                      <div className="text-base font-bold">{value}</div>
                      <div className="text-xs text-muted">{label}</div>
                    </div>
                  ))}
                  <ChevronRight size={14} className="text-muted" />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
