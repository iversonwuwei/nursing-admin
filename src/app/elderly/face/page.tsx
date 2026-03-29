"use client"
import { DataCard, FilterBar, FilterItem, PageHeader, StatCard, Tag } from "@/components/nh"
import { AlertCircle, Camera, CheckCircle2, ScanFace, Search } from "lucide-react"
import { useState } from "react"

const FACES = [
  { id: "E001", name: "张桂英", room: "201-1", status: "已录入", progress: 100, lastUpdate: "2026-03-15" },
  { id: "E002", name: "王建国", room: "203-2", status: "已录入", progress: 100, lastUpdate: "2026-03-14" },
  { id: "E003", name: "李秀兰", room: "205-1", status: "录入中", progress: 60, lastUpdate: "2026-03-28" },
  { id: "E004", name: "赵德明", room: "202-1", status: "待录入", progress: 0, lastUpdate: "——" },
  { id: "E005", name: "周桂芳", room: "203-1", status: "已录入", progress: 100, lastUpdate: "2026-03-10" },
]

export default function FacePage() {
  const [search, setSearch] = useState("")
  const filtered = FACES.filter(f => f.name.includes(search))
  const stats = {
    total: FACES.length,
    done: FACES.filter(f => f.status === "已录入").length,
    inProgress: FACES.filter(f => f.status === "录入中").length,
    pending: FACES.filter(f => f.status === "待录入").length,
  }

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title="人脸录入"
        subtitle="老人人脸数据采集与管理"
        actions={
          <button className="btn btn-primary btn-sm flex items-center gap-2">
            <Camera size={14} />开始录入
          </button>
        }
      />

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        {[
          { label: "需录入老人", value: stats.total, icon: ScanFace, color: "var(--color-primary)", bg: "var(--color-primary-light)" },
          { label: "已完成", value: stats.done, icon: CheckCircle2, color: "var(--color-success)", bg: "rgba(34,197,94,0.1)" },
          { label: "录入中", value: stats.inProgress, icon: ScanFace, color: "var(--color-warning)", bg: "rgba(245,158,11,0.1)" },
          { label: "待录入", value: stats.pending, icon: AlertCircle, color: "var(--color-danger)", bg: "rgba(239,68,68,0.1)" },
        ].map(({ label, value, icon: Icon }) => (
          <StatCard key={label} icon={<Icon size={18} />} label={label} value={value} color={label === "已完成" ? "success" : label === "录入中" ? "warning" : label === "待录入" ? "danger" : "primary"} />
        ))}
      </div>

      <FilterBar>
        <FilterItem label="搜索">
          <div className="input-wrap" style={{ minWidth: 220 }}>
            <span className="input-icon"><Search size={14} /></span>
            <input className="input" placeholder="搜索姓名..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
          </div>
        </FilterItem>
      </FilterBar>

      <DataCard>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr><th>老人</th><th>房间</th><th>录入状态</th><th>采集进度</th><th>最后更新</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        {f.status === "已录入"
                          ? <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, var(--color-primary-light), var(--color-primary))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "white" }}>{f.name.charAt(0)}</div>
                          : <ScanFace size={18} style={{ color: "var(--color-muted)" }} />
                        }
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{f.name}</div>
                        <div className="text-[10px]" style={{ color: "var(--color-muted)" }}>{f.id}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="text-sm" style={{ color: "var(--color-muted)" }}>{f.room}</span></td>
                  <td>
                    <Tag variant={f.status === "已录入" ? "success" : f.status === "录入中" ? "warning" : "neutral"}>
                      {f.status === "已录入" && <CheckCircle2 size={12} style={{ marginRight: 4 }} />}
                      {f.status}
                    </Tag>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: "var(--color-bg)", borderRadius: 999 }}>
                        <div style={{ height: "100%", width: `${f.progress}%`, background: f.progress === 100 ? "var(--color-success)" : "var(--color-warning)", borderRadius: 999, transition: "width 300ms ease" }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: f.progress === 100 ? "var(--color-success)" : "var(--color-warning)", width: 34 }}>{f.progress}%</span>
                    </div>
                  </td>
                  <td><span className="text-xs" style={{ color: "var(--color-muted)" }}>{f.lastUpdate}</span></td>
                  <td><button className="btn btn-primary btn-sm" style={{ fontSize: 12 }}>{f.status === "待录入" ? "录入" : f.status === "录入中" ? "继续" : "查看"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataCard>
    </div>
  )
}
