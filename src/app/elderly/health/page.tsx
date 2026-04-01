"use client"
import { DataCard, Tag } from "@/components/nh"
import { getHealthArchiveAiInsights, getMedicationAiSummary } from "@/lib/mock/admin-ai"
import { useMemo, useState, useSyncExternalStore } from 'react'
import { useSearchParams } from 'next/navigation'
import { confirmHealthArchive, getCareServiceSnapshot, subscribeCareServiceWorkflow } from '@/lib/mock/care-service-workflow'
import { Activity, AlertCircle, Bot, FileHeart, Heart, Pill, Plus, Search, Stethoscope } from "lucide-react"
import Link from "next/link"

const MEDICATIONS = [
  { name: "硝苯地平缓释片", dose: "20mg × 2次/日", patient: "张桂英", nextTime: "08:00", status: "待服用" },
  { name: "二甲双胍", dose: "0.5g × 3次/日", patient: "李秀兰", nextTime: "08:00", status: "待服用" },
  { name: "阿司匹林肠溶片", dose: "100mg × 1次/日", patient: "王建国", nextTime: "08:00", status: "已服用" },
]

export default function HealthPage() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('selected')
  const fromNew = searchParams.get('entry') === 'elderly-health-new'
  const snapshot = useSyncExternalStore(
    subscribeCareServiceWorkflow,
    getCareServiceSnapshot,
    getCareServiceSnapshot,
  )
  const healthRecords = snapshot.healthArchives
  const [search, setSearch] = useState("")

  const selectedRecord = useMemo(
    () => healthRecords.find(item => item.id === preselectedId) ?? null,
    [healthRecords, preselectedId],
  )
  const filtered = healthRecords.filter(r => r.name.includes(search) || r.id.includes(search))
  const aiInsights = getHealthArchiveAiInsights(healthRecords)
  const medicationAiSummary = getMedicationAiSummary(MEDICATIONS)

  const vitalTag = (val: string | null, warn: string | null, normal: string, warnThresh: { high: string; low: string }) => {
    if (!val) return null
    const num = parseFloat(val)
    if (num > parseFloat(warnThresh.high) || num < parseFloat(warnThresh.low)) return <Tag variant="warning">{val}</Tag>
    return <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-success)" }}>{val}</span>
  }

  return (
    <div className="page-root animate-fade-up">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ letterSpacing: "-0.03em" }}>健康档案</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>老人健康数据汇总 · 共 {healthRecords.length} 位老人</p>
        </div>
        <Link href="/elderly/health/new" className="btn btn-primary btn-sm flex items-center gap-2">
          <Plus size={14} />新建档案
        </Link>
      </div>

      {selectedRecord && fromNew ? (
        <DataCard
          title="来自健康建档页"
          subtitle={`${selectedRecord.name} 已写入健康档案闭环。确认后再纳入稳定巡诊口径。`}
          badge={<Tag variant={selectedRecord.lifecycleStatus === '待建档' ? 'warning' : 'success'}>{selectedRecord.lifecycleStatus}</Tag>}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
              当前房间 {selectedRecord.room}，最近测量 {selectedRecord.lastCheck}，提醒项 {selectedRecord.alert ?? '无'}。
            </div>
            {selectedRecord.lifecycleStatus === '待建档' ? (
              <button className="btn btn-primary btn-sm" onClick={() => confirmHealthArchive(selectedRecord.id)}>
                完成建档
              </button>
            ) : null}
          </div>
        </DataCard>
      ) : null}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
        {[
          { label: "建档老人", value: healthRecords.filter(item => item.lifecycleStatus === '已建档').length, icon: FileHeart, color: "var(--color-primary)", bg: "var(--color-primary-light)" },
          { label: "今日测量", value: healthRecords.filter(item => item.lastCheck === '2026-03-28' || item.lastCheck === '2026-03-29').length, icon: Activity, color: "var(--color-info)", bg: "rgba(59,130,246,0.1)" },
          { label: "异常提醒", value: healthRecords.filter(item => item.alert).length, icon: AlertCircle, color: "var(--color-warning)", bg: "rgba(245,158,11,0.1)" },
          { label: "用药中", value: 21, icon: Pill, color: "var(--color-purple)", bg: "rgba(139,92,246,0.1)" },
          { label: "本周巡诊", value: 12, icon: Stethoscope, color: "var(--color-success)", bg: "rgba(34,197,94,0.1)" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="data-card" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.02em" }}>{value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="page-grid-2" style={{ alignItems: "start" }}>
        <DataCard
          icon={<Bot size={16} />}
          title="AI 巡诊建议"
          subtitle="将健康异常和测量记录转成班次关注项，仍需护士确认后再升级。"
          badge={<Tag variant="warning">需人工确认</Tag>}
        >
          <div style={{ display: "grid", gap: 10 }}>
            {aiInsights.map(item => (
              <div key={item.elderlyId} style={{ borderRadius: 12, border: "1px solid var(--color-border)", padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-text)" }}>{item.elderlyName}</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: "var(--color-muted)" }}>{item.title}</div>
                  </div>
                  <Tag variant={item.severity === "高风险" ? "danger" : "warning"}>{item.severity}</Tag>
                </div>
                <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.6, color: "var(--color-text)" }}>{item.explanation}</div>
                <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: "var(--color-muted)" }}>{item.action}</div>
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-primary)", fontWeight: 600 }}>置信度 {item.confidence}%</div>
              </div>
            ))}
          </div>
        </DataCard>

        <DataCard
          icon={<Pill size={16} />}
          title="AI 用药提醒"
          subtitle="把待服药项和健康异常对象联动呈现，降低漏服风险。"
        >
          <div style={{ borderRadius: 12, background: "var(--color-bg)", padding: 14, fontSize: 12.5, lineHeight: 1.7, color: "var(--color-text)" }}>
            {medicationAiSummary}
          </div>
        </DataCard>
      </div>

      {/* Health table */}
      <DataCard>
        <div className="data-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="data-card-icon-wrap" style={{ background: "rgba(34,197,94,0.1)", color: "var(--color-success)" }}>
              <Heart size={18} />
            </div>
            <div>
              <div className="text-sm font-bold">健康指标一览</div>
              <div style={{ fontSize: 12, color: "var(--color-muted)" }}>最近一次测量数据</div>
            </div>
          </div>
          <div className="input-wrap-icon" style={{ width: 220 }}>
            <span className="input-icon"><Search size={14} /></span>
            <input className="input" placeholder="搜索姓名..." value={search} onChange={e => setSearch(e.target.value)} style={{ height: 34 }} />
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>姓名</th><th>房间</th><th>血压<br/><span style={{fontSize:10,color:"var(--color-muted)",fontWeight:400}}>mmHg</span></th>
                <th>心率<br/><span style={{fontSize:10,color:"var(--color-muted)",fontWeight:400}}>bpm</span></th>
                <th>体温<br/><span style={{fontSize:10,color:"var(--color-muted)",fontWeight:400}}>℃</span></th>
                <th>血糖<br/><span style={{fontSize:10,color:"var(--color-muted)",fontWeight:400}}>mmol/L</span></th>
                <th>血氧<br/><span style={{fontSize:10,color:"var(--color-muted)",fontWeight:400}}>%</span></th>
                <th>更新时间</th><th>备注</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td><div className="font-semibold text-sm">{r.name}</div><div className="text-[10px]" style={{ color: "var(--color-muted)" }}>{r.id}</div></td>
                  <td><span className="text-sm">{r.room}</span></td>
                  <td>{vitalTag(r.bp.split("/")[0], r.alert, r.bp, { high: "140", low: "90" })}<br/><span style={{fontSize:11,color:"var(--color-muted)"}}>/{r.bp.split("/")[1]}</span></td>
                  <td>{vitalTag(String(r.hr), r.alert, String(r.hr), { high: "100", low: "60" })}</td>
                  <td>{vitalTag(String(r.temp), r.alert, String(r.temp), { high: "37.5", low: "35.5" })}</td>
                  <td>{vitalTag(String(r.bloodSugar), r.alert, String(r.bloodSugar), { high: "7.0", low: "3.9" })}</td>
                  <td>{vitalTag(String(r.o2), r.alert, String(r.o2), { high: "100", low: "95" })}</td>
                  <td><span className="text-xs" style={{ color: "var(--color-muted)" }}>{r.lastCheck}</span></td>
                  <td>{r.alert ? <Tag variant="warning">{r.alert}</Tag> : <span style={{ fontSize: 12, color: "var(--color-muted)" }}>正常</span>}</td>
                  <td><Link href={`/elderly/${r.elderlyId}`} className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>详情</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataCard>

      {/* Medication */}
      <DataCard>
        <div className="data-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="data-card-icon-wrap" style={{ background: "rgba(139,92,246,0.1)", color: "var(--color-purple)" }}>
              <Pill size={18} />
            </div>
            <div>
              <div className="text-sm font-bold">今日用药</div>
              <div style={{ fontSize: 12, color: "var(--color-muted)" }}>待服用 {MEDICATIONS.filter(m => m.status === "待服用").length} 项</div>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10, padding: "0 12px 12px" }}>
          {MEDICATIONS.map((med, i) => (
            <div key={i} style={{ padding: 14, borderRadius: 10, border: `1.5px solid ${med.status === "待服用" ? "rgba(245,158,11,0.2)" : "rgba(34,197,94,0.1)"}`, background: med.status === "待服用" ? "rgba(245,158,11,0.05)" : "rgba(34,197,94,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)" }}>{med.name}</span>
                <Tag variant={med.status === "待服用" ? "warning" : "success"}>{med.status}</Tag>
              </div>
              <div style={{ fontSize: 12, color: "var(--color-muted)" }}>{med.dose}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 12, color: "var(--color-muted)" }}>{med.patient} · 下次 {med.nextTime}</span>
                {med.status === "待服用" && <button className="btn btn-primary btn-sm" style={{ fontSize: 12, height: 28 }}>确认服用</button>}
              </div>
            </div>
          ))}
        </div>
      </DataCard>
    </div>
  )
}
