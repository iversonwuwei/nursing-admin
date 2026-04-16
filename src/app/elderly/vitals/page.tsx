"use client"
import { DataCard, EmptyState, FilterBar, FilterItem, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag } from "@/components/nh"
import { getCareServiceSnapshot, subscribeCareServiceWorkflow } from '@/lib/mock/care-service-workflow'
import { Activity, Minus, Plus, Search, TrendingDown, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from 'next/navigation'
import { useMemo, useState, useSyncExternalStore } from "react"

const TREND = (v: number, n: number) => v > n ? { icon: TrendingUp, color: "var(--color-danger)", label: "偏高" } : v < n ? { icon: TrendingDown, color: "var(--color-info)", label: "偏低" } : { icon: Minus, color: "var(--color-success)", label: "正常" }

export default function VitalsPage() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('selected')
  const fromNew = searchParams.get('entry') === 'elderly-vitals-new'
  const snapshot = useSyncExternalStore(
    subscribeCareServiceWorkflow,
    getCareServiceSnapshot,
    getCareServiceSnapshot,
  )
  const records = snapshot.vitalsEntries
  const [search, setSearch] = useState("")
  const selectedRecord = useMemo(
    () => records.find(item => item.id === preselectedId) ?? null,
    [preselectedId, records],
  )
  const filtered = records.filter(r => r.elder.includes(search) || r.room.includes(search))
  const helpHref = '/elderly/help'

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title="指标更新"
        subtitle={`今日已录入 ${records.length} 条生命体征记录`}
        actions={
          <Link href="/elderly/vitals/new" className="btn btn-primary btn-sm flex items-center gap-2">
            <Plus size={14} />批量录入
          </Link>
        }
      />

      {selectedRecord && fromNew ? (
        <DataCard title="来自体征录入页" subtitle={`${selectedRecord.elder} 的生命体征已写入当班列表，可继续用于巡诊和异常识别。`}>
          <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
            记录人 {selectedRecord.recordedBy}，记录时间 {selectedRecord.time}，房间 {selectedRecord.room}。
          </div>
        </DataCard>
      ) : null}

      <InteractionRailLayout
        main={(
          <>
            <div className="kpi-grid" style={{ marginBottom: 16 }}>
        {[
          { label: "血压", value: "38/38", icon: Activity, color: "var(--color-danger)", bg: "rgba(239,68,68,0.1)", norm: "90-140/60-90" },
          { label: "心率", value: "72bpm", icon: Activity, color: "var(--color-primary)", bg: "var(--color-primary-light)", norm: "60-100bpm" },
          { label: "体温", value: "36.5℃", icon: Activity, color: "var(--color-warning)", bg: "rgba(245,158,11,0.1)", norm: "36-37.3℃" },
          { label: "血氧", value: "97%", icon: Activity, color: "var(--color-info)", bg: "rgba(59,130,246,0.1)", norm: "95-100%" },
          { label: "血糖", value: "5.8", icon: Activity, color: "var(--color-purple)", bg: "rgba(139,92,246,0.1)", norm: "3.9-7.0" },
        ].map(({ label, value, icon: Icon, norm }) => (
          <StatCard key={label} icon={<Icon size={18} />} label={label} value={value} sub={`正常: ${norm}`} color={label === "血压" ? "danger" : label === "心率" ? "primary" : label === "体温" ? "warning" : label === "血氧" ? "info" : "purple"} />
        ))}
            </div>

            <FilterBar>
              <FilterItem label="搜索">
                <div className="input-wrap" style={{ minWidth: 240 }}>
                  <span className="input-icon"><Search size={14} /></span>
                  <input className="input" placeholder="搜索老人姓名或房间..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
                </div>
              </FilterItem>
            </FilterBar>

            <DataCard>
              {filtered.length > 0 ? (
                <div style={{ overflowX: "auto" }}>
                  <table className="table">
            <thead>
              <tr><th>老人</th><th>血压<br/><span style={{fontSize:10,color:"var(--color-muted)",fontWeight:400}}>mmHg</span></th><th>心率<br/><span style={{fontSize:10,color:"var(--color-muted)",fontWeight:400}}>bpm</span></th><th>体温<br/><span style={{fontSize:10,color:"var(--color-muted)",fontWeight:400}}>℃</span></th><th>血氧<br/><span style={{fontSize:10,color:"var(--color-muted)",fontWeight:400}}>%</span></th><th>血糖<br/><span style={{fontSize:10,color:"var(--color-muted)",fontWeight:400}}>mmol/L</span></th><th>记录人</th><th>时间</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const bpTrend = TREND(parseInt(r.bp.split("/")[0]), 130)
                const hrTrend = TREND(r.hr, 75)
                const tempTrend = TREND(r.temp, 37)
                const o2Trend = r.spo2 < 95 ? { icon: TrendingDown, color: "var(--color-danger)", label: "偏低" } : { icon: Minus, color: "var(--color-success)", label: "正常" }
                const bsTrend = TREND(r.bloodSugar, 7.0)
                return (
                  <tr key={r.id}>
                    <td><div className="font-semibold text-sm">{r.elder}</div><div className="text-[10px]" style={{ color: "var(--color-muted)" }}>{r.room}</div></td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>{r.bp}</span>
                        <bpTrend.icon size={13} style={{ color: bpTrend.color }} />
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>{r.hr}</span>
                        <hrTrend.icon size={13} style={{ color: hrTrend.color }} />
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>{r.temp}</span>
                        <tempTrend.icon size={13} style={{ color: tempTrend.color }} />
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>{r.spo2}</span>
                        <o2Trend.icon size={13} style={{ color: o2Trend.color }} />
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>{r.bloodSugar}</span>
                        <bsTrend.icon size={13} style={{ color: bsTrend.color }} />
                      </div>
                    </td>
                    <td><span className="text-sm" style={{ color: "var(--color-muted)" }}>{r.recordedBy}</span></td>
                    <td><span className="text-xs" style={{ color: "var(--color-muted)" }}>{r.time}</span></td>
                    <td><Link href={`/elderly/${r.elderlyId}`} className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>详情</Link></td>
                  </tr>
                )
              })}
            </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState variant="search" title="暂无匹配体征记录" description="调整搜索词后重试，或返回查看全部当班体征录入。" />
              )}
            </DataCard>
          </>
        )}
        rail={(
          <>
            {selectedRecord ? (
              <DataCard title="当前回流记录" subtitle="对象事实后置展示，避免打散主区表格核对。" badge={<Tag variant="info">Selected</Tag>}>
                <div style={{ display: 'grid', gap: 10 }}>
                  <div className="page-help-card-item">对象：{selectedRecord.elder} · {selectedRecord.room}</div>
                  <div className="page-help-card-item">记录人：{selectedRecord.recordedBy} · 时间：{selectedRecord.time}</div>
                  <div className="page-help-card-item">当前已回流体征列表，可继续进入老人详情查看上下文。</div>
                </div>
              </DataCard>
            ) : null}

            <DataCard title="体征判读边界" subtitle="主区只保留 KPI、筛选和体征表格。" badge={<Tag variant="warning">Boundary</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">趋势图标只做快速判读，不替代详细病情判断。</div>
                <div className="page-help-card-item">异常对象的连续变化应回到健康监测或老人详情继续核对。</div>
                <div className="page-help-card-item">完整页面定位和使用顺序迁移到帮助页。</div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整体征记录说明迁移到显式帮助页"
              summary="体征记录页现在只保留 KPI、筛选和表格明细，趋势解释与帮助统一后置。"
              items={[
                '先筛选目标老人，再核对当班体征记录。',
                '趋势图标只做快速提示，不替代详细判断。',
                '若需要完整说明，进入老人帮助页查看。',
              ]}
              href={helpHref}
              actionLabel="查看老人帮助"
            />
          </>
        )}
      />
    </div>
  )
}
