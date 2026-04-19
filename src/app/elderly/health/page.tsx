"use client"
import { DataCard, EmptyState, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag } from "@/components/nh"
import { fetchAdminHealthArchives, type AdminHealthArchiveListItemResponse } from '@/lib/elderly/admin-elderly-api'
import { getHealthArchiveAiInsights } from "@/lib/mock/admin-ai"
import { Activity, AlertCircle, Bot, FileHeart, Heart, Plus, Search, ShieldAlert, Stethoscope } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

function formatCareLevel(value: string) {
  switch (value) {
    case 'L4':
      return '特级护理'
    case 'L3':
      return '全护理'
    case 'L2':
      return '半自理'
    case 'L1':
      return '自理'
    default:
      return value || '待评定'
  }
}

function formatRiskSummary(value: string) {
  return value?.trim() ? value : '需持续观察'
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '待补录'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function isHighRisk(item: AdminHealthArchiveListItemResponse) {
  return item.oxygen < 95 || item.bloodSugar >= 7 || item.heartRate > 100 || item.riskSummary.includes('低氧') || item.riskSummary.includes('风险')
}

export default function HealthPage() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('selected')
  const fromNew = searchParams.get('entry') === 'elderly-health-new'
  const scene = searchParams.get('scene')
  const [healthRecords, setHealthRecords] = useState<AdminHealthArchiveListItemResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState("")

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError('')
        const response = await fetchAdminHealthArchives()
        if (!active) {
          return
        }

        setHealthRecords(response.items)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : '健康档案读取失败。')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  const selectedRecord = useMemo(
    () => healthRecords.find(item => item.elderId === preselectedId) ?? null,
    [healthRecords, preselectedId],
  )
  const filtered = useMemo(() => healthRecords.filter(record => {
    if (!search) {
      return true
    }

    return record.elderName.includes(search) || record.elderId.includes(search) || record.roomNumber.includes(search)
  }), [healthRecords, search])
  const aiInsights = getHealthArchiveAiInsights(healthRecords.map(item => ({
    id: item.elderId,
    name: item.elderName,
    room: item.roomNumber,
    bp: item.bloodPressure,
    bloodSugar: item.bloodSugar,
    o2: item.oxygen,
    lastCheck: item.updatedAtUtc.slice(0, 10),
    alert: isHighRisk(item) ? formatRiskSummary(item.riskSummary) : null,
  })))
  const helpHref = '/elderly/help'
  const sceneMeta = scene === 'home'
    ? {
      title: '居家健康档案',
      subtitle: `当前按实时健康档案查看居家对象；场景细分字段仍待继续补齐 · 共 ${healthRecords.length} 位老人`,
      createHref: '/elderly/health/new?scene=home',
    }
    : {
      title: '健康档案',
      subtitle: `Health Service 实时档案汇总 · 共 ${healthRecords.length} 位老人`,
      createHref: '/elderly/health/new',
    }
  const highRiskCount = healthRecords.filter(isHighRisk).length
  const lowOxygenCount = healthRecords.filter(item => item.oxygen < 95).length
  const highBloodSugarCount = healthRecords.filter(item => item.bloodSugar >= 7).length
  const todayUpdates = healthRecords.filter(item => new Date(item.updatedAtUtc).toDateString() === new Date().toDateString()).length

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title={sceneMeta.title}
        subtitle={loading ? `${sceneMeta.subtitle} · 正在同步 Health Service` : sceneMeta.subtitle}
        actions={
          <Link href={sceneMeta.createHref} className="btn btn-primary btn-sm flex items-center gap-2">
            <Plus size={14} />新建档案
          </Link>
        }
      />

      {selectedRecord && fromNew ? (
        <DataCard
          title="来自健康建档页"
          subtitle={`${selectedRecord.elderName} 已写入 Health Service，并会直接回流到健康档案列表。`}
          badge={<Tag variant="success">已写库</Tag>}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
              当前房间 {selectedRecord.roomNumber}，最近测量 {formatDateTime(selectedRecord.updatedAtUtc)}，风险摘要 {formatRiskSummary(selectedRecord.riskSummary)}。
            </div>
          </div>
        </DataCard>
      ) : null}

      <InteractionRailLayout
        main={(
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
              <StatCard icon={<FileHeart size={18} />} label="已同步档案" value={healthRecords.length} color="primary" />
              <StatCard icon={<Activity size={18} />} label="今日更新" value={todayUpdates} color="info" />
              <StatCard icon={<ShieldAlert size={18} />} label="重点关注" value={highRiskCount} color="danger" />
              <StatCard icon={<AlertCircle size={18} />} label="低氧对象" value={lowOxygenCount} color="warning" />
              <StatCard icon={<Stethoscope size={18} />} label="血糖偏高" value={highBloodSugarCount} color="success" />
            </div>

            <DataCard title="实时健康边界" subtitle="统计卡、列表和右轨建议都基于 Health Service 返回，不再混入本地健康样本。" badge={<Tag variant="info">Live Health</Tag>}>
              <div className="ledger-metric-grid">
                {[
                  { title: '档案总数', value: healthRecords.length, description: '来自 `/api/admin/health/archives` 的实时档案数量' },
                  { title: '重点关注', value: highRiskCount, description: '低氧、血糖偏高或风险摘要异常对象' },
                  { title: '低氧对象', value: lowOxygenCount, description: '血氧低于 95 的对象需要优先复测' },
                  { title: '今日更新', value: todayUpdates, description: '当天已回写到 Health Service 的健康档案' },
                ].map(item => (
                  <div key={item.title} className="ledger-metric-card">
                    <div className="ledger-metric-label">{item.title}</div>
                    <div className="ledger-metric-value">{item.value}</div>
                    <div className="ledger-metric-description">{item.description}</div>
                  </div>
                ))}
              </div>
            </DataCard>

            <DataCard>
              <div className="data-card-header">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="data-card-icon-wrap" style={{ background: "rgba(34,197,94,0.1)", color: "var(--color-success)" }}>
                    <Heart size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold">健康指标一览</div>
                    <div style={{ fontSize: 12, color: "var(--color-muted)" }}>最近一次 Health Service 回写数据</div>
                  </div>
                </div>
                <div className="input-wrap-icon" style={{ width: 220 }}>
                  <span className="input-icon"><Search size={14} /></span>
                  <input className="input" placeholder="搜索姓名/房间..." value={search} onChange={e => setSearch(e.target.value)} style={{ height: 34 }} />
                </div>
              </div>
              {error ? <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--color-danger)' }}>实时健康档案读取失败：{error}</div> : null}
              {filtered.length > 0 ? (
                <div style={{ overflowX: "auto" }}>
                  <table className="table">
            <thead>
              <tr>
                <th>姓名</th><th>房间</th><th>血压<br/><span style={{fontSize:10,color:"var(--color-muted)",fontWeight:400}}>mmHg</span></th>
                <th>心率<br/><span style={{fontSize:10,color:"var(--color-muted)",fontWeight:400}}>bpm</span></th>
                <th>体温<br/><span style={{fontSize:10,color:"var(--color-muted)",fontWeight:400}}>℃</span></th>
                <th>血糖<br/><span style={{fontSize:10,color:"var(--color-muted)",fontWeight:400}}>mmol/L</span></th>
                <th>血氧<br/><span style={{fontSize:10,color:"var(--color-muted)",fontWeight:400}}>%</span></th>
                        <th>护理等级</th><th>更新时间</th><th>备注</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.elderId}>
                  <td><div className="font-semibold text-sm">{r.elderName}</div><div className="text-[10px]" style={{ color: "var(--color-muted)" }}>{r.elderId}</div></td>
                  <td><span className="text-sm">{r.roomNumber}</span></td>
                  <td><span className="text-sm">{r.bloodPressure}</span></td>
                  <td><span className="text-sm">{r.heartRate}</span></td>
                  <td><span className="text-sm">{r.temperature}</span></td>
                  <td><span className="text-sm">{r.bloodSugar}</span></td>
                  <td>{r.oxygen < 95 ? <Tag variant="warning">{r.oxygen}</Tag> : <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-success)" }}>{r.oxygen}</span>}</td>
                  <td><Tag variant="info">{formatCareLevel(r.careLevel)}</Tag></td>
                  <td><span className="text-xs" style={{ color: "var(--color-muted)" }}>{formatDateTime(r.updatedAtUtc)}</span></td>
                  <td>{isHighRisk(r) ? <Tag variant="warning">{formatRiskSummary(r.riskSummary)}</Tag> : <span style={{ fontSize: 12, color: "var(--color-muted)" }}>正常</span>}</td>
                  <td><Link href={`/elderly/${r.elderId}`} className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>详情</Link></td>
                </tr>
              ))}
            </tbody>
                  </table>
                </div>
              ) : (
                  <EmptyState variant="search" title={loading ? '正在同步健康档案' : '暂无匹配档案'} description={loading ? '正在从 Health Service 加载实时健康档案。' : '调整搜索词后重试，或先通过健康建档页写入真实档案。'} />
              )}
            </DataCard>
          </>
        )}
        rail={(
          <>
            {selectedRecord ? (
              <DataCard title="当前选中档案" subtitle="对象事实后置展示，避免打散主区列表核对。" badge={<Tag variant="success">Live Record</Tag>}>
                <div style={{ display: 'grid', gap: 10 }}>
                  <div className="page-help-card-item">对象：{selectedRecord.elderName} · {selectedRecord.roomNumber}</div>
                  <div className="page-help-card-item">最近测量：{formatDateTime(selectedRecord.updatedAtUtc)} · 提醒：{formatRiskSummary(selectedRecord.riskSummary)}</div>
                  <div className="page-help-card-item">详情入口：可继续查看老人详情页健康上下文。</div>
                </div>
              </DataCard>
            ) : null}

            <DataCard
              icon={<Bot size={16} />}
              title="AI 巡诊建议"
              subtitle="将 Health Service 实时指标转成班次关注项，仍需护士确认后再升级。"
              badge={<Tag variant="warning">需人工确认</Tag>}
            >
              <div style={{ display: "grid", gap: 10 }}>
                {aiInsights.slice(0, 4).map(item => (
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
                {aiInsights.length === 0 ? <div style={{ fontSize: 12.5, color: 'var(--color-muted)' }}>当前没有可供 AI 巡诊建议消费的实时健康档案。</div> : null}
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整健康档案说明迁移到显式帮助页"
              summary="健康档案页现在只保留指标汇总、档案表和用药执行信息，巡诊解释与帮助统一后置。"
              items={[
                '先看实时健康指标表和当前选中档案，再判断是否需要巡诊跟进。',
                'AI 巡诊建议只消费 live health archives，不再读取本地样本。',
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
