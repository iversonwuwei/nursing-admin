'use client'

import { DataCard, EmptyState, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { fetchHealthMonitoringData, isNightObservation, VITAL_RANGES, type DerivedHealthVital, type HealthMetricKey, type HealthTrendPoint } from '@/lib/services/admin-health-services'
import type { AdminVitalsEntry } from '@/lib/services/admin-vital-services'
import { Activity, AlertCircle, AlertTriangle, Heart, Moon, TrendingDown, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

interface HealthMetricClientProps {
  metric: HealthMetricKey
}

const EMPTY_VITALS: DerivedHealthVital[] = []
const EMPTY_TRENDS: HealthTrendPoint[] = []
const EMPTY_RECORDS: AdminVitalsEntry[] = []

function MetricLineChart({
  points,
  selectValue,
  color,
  label,
  unit,
  min,
  max,
}: {
  points: HealthTrendPoint[]
  selectValue: (point: HealthTrendPoint) => number
  color: string
  label: string
  unit: string
  min: number
  max: number
}) {
  const values = points.map(selectValue)
  const range = Math.max(1, max - min)
  const chartPoints = values.map((value, index) => ({
    x: values.length === 1 ? 50 : (index / (values.length - 1)) * 100,
    y: 100 - ((value - min) / range) * 100,
  }))
  const path = chartPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const area = `M 0 100 L ${path.slice(2)} L 100 100 Z`

  return (
    <div style={{ padding: '16px 20px' }}>
      <div className="lc-header">
        <span className="lc-label">{label}</span>
        <span className="lc-current">{values[values.length - 1] ?? '--'}{unit}</span>
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="lc-svg">
        {[0, 25, 50, 75, 100].map(value => (
          <line key={value} x1="0" y1={value} x2="100" y2={value} stroke="var(--color-border)" strokeWidth="0.3" />
        ))}
        <path d={area} fill={color} fillOpacity="0.08" />
        <path d={path} fill="none" stroke={color} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
        {chartPoints.map((point, index) => (
          <circle key={`${label}-${index}`} cx={point.x} cy={point.y} r="1.5" fill={color} />
        ))}
      </svg>
      <div className="lc-xlabels">
        {points.map(point => (
          <span key={point.dateKey} className="lc-xlabel">{point.label}</span>
        ))}
      </div>
    </div>
  )
}

function sortByMetric(metric: HealthMetricKey, vitals: DerivedHealthVital[]) {
  const items = [...vitals]
  if (metric === 'bp') {
    return items.sort((left, right) => right.systolic - left.systolic || right.diastolic - left.diastolic)
  }
  if (metric === 'hr') {
    return items.sort((left, right) => Math.abs(right.heartRate - 80) - Math.abs(left.heartRate - 80))
  }
  return items.sort((left, right) => right.severityScore - left.severityScore || left.oxygen - right.oxygen)
}

function trendForValue(value: number, baseline: number) {
  if (value > baseline) return { icon: TrendingUp, color: 'var(--color-danger)', label: '偏高' }
  if (value < baseline) return { icon: TrendingDown, color: 'var(--color-info)', label: '偏低' }
  return { icon: Heart, color: 'var(--color-success)', label: '平稳' }
}

export default function HealthMetricClient({ metric }: HealthMetricClientProps) {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchHealthMonitoringData>> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const loading = data === null && error === null

  useEffect(() => {
    let cancelled = false
    fetchHealthMonitoringData(500)
      .then(result => {
        if (cancelled) return
        setData(result)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : '健康专题数据加载失败。')
      })
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const latestVitals = data?.latestVitals ?? EMPTY_VITALS
  const trends = data?.trends ?? EMPTY_TRENDS
  const records = data?.records ?? EMPTY_RECORDS
  const orderedVitals = useMemo(() => sortByMetric(metric, latestVitals), [latestVitals, metric])
  const nightRecords = useMemo(() => records.filter(item => isNightObservation(item.recordedAtUtc)), [records])
  const nightByElder = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of nightRecords) {
      counts.set(item.elderId, (counts.get(item.elderId) ?? 0) + 1)
    }
    return counts
  }, [nightRecords])

  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs', entityId?: string, entityName?: string) => buildAiAssistantHref({
    source: 'health-monitoring',
    focus,
    target,
    entityId,
    entityName,
  })

  const config = (() => {
    if (metric === 'bp') {
      const abnormal = latestVitals.filter(item => item.systolic > VITAL_RANGES.bloodPressureHigh.max || item.diastolic > VITAL_RANGES.bloodPressureLow.max)
      const highRisk = abnormal.filter(item => item.systolic >= 160 || item.diastolic >= 100)
      return {
        title: '血压管理',
        subtitle: loading ? '正在加载真实血压观测…' : `实时聚合 ${latestVitals.length} 位老人最近一次血压记录，${abnormal.length} 人超阈值。`,
        helpHref: '/health/help',
        stats: [
          { label: '平均收缩压', value: trends.length > 0 ? `${trends[trends.length - 1].bloodPressureHighAvg}` : '--', sub: '近7日均值', color: 'primary' as const, icon: Activity },
          { label: '异常人数', value: abnormal.length, sub: '高压或低压超阈值', color: 'danger' as const, icon: AlertTriangle },
          { label: '高风险', value: highRisk.length, sub: '≥160/100 mmHg', color: 'warning' as const, icon: AlertTriangle },
          { label: '监测覆盖', value: `${latestVitals.length}`, sub: '当前在线对象', color: 'success' as const, icon: Heart },
        ],
        chart: { selectValue: (point: HealthTrendPoint) => point.bloodPressureHighAvg, color: 'var(--color-info)', label: '平均高压', unit: ' mmHg', min: 100, max: 170 },
        rows: orderedVitals.slice(0, 8).map(item => ({
          key: item.elderId,
          name: item.elderName,
          roomNumber: item.roomNumber,
          metricValue: item.bloodPressure,
          timestamp: item.recordedAtLabel,
          note: item.abnormalItems.length > 0 ? item.abnormalItems.join('、') : '当前平稳',
          tag: item.systolic >= 160 || item.diastolic >= 100 ? <Tag variant="danger">升级干预</Tag> : item.isAbnormal ? <Tag variant="warning">待复测</Tag> : <Tag variant="success">正常</Tag>,
          link: buildAiHref('health-bp', 'logs', item.elderId, item.elderName),
        })),
        railSummary: '基于真实最近一次观察序列排序，优先把收缩压与舒张压同时超阈值对象推到前面。',
      }
    }

    if (metric === 'hr') {
      const abnormal = latestVitals.filter(item => item.heartRate < VITAL_RANGES.heartRate.min || item.heartRate > VITAL_RANGES.heartRate.max)
      const extreme = abnormal.filter(item => item.heartRate <= 50 || item.heartRate >= 110)
      return {
        title: '心率管理',
        subtitle: loading ? '正在加载真实心率观测…' : `实时聚合 ${latestVitals.length} 位老人最近一次心率记录，${abnormal.length} 人超阈值。`,
        helpHref: '/health/help',
        stats: [
          { label: '平均心率', value: trends.length > 0 ? `${trends[trends.length - 1].heartRateAvg}` : '--', sub: '近7日均值', color: 'primary' as const, icon: Heart },
          { label: '波动异常', value: abnormal.length, sub: '超出 60-100 次/分', color: 'warning' as const, icon: AlertTriangle },
          { label: '极值对象', value: extreme.length, sub: '≤50 或 ≥110', color: 'danger' as const, icon: AlertTriangle },
          { label: '监测覆盖', value: `${latestVitals.length}`, sub: '当前在线对象', color: 'success' as const, icon: Activity },
        ],
        chart: { selectValue: (point: HealthTrendPoint) => point.heartRateAvg, color: 'var(--color-danger)', label: '平均心率', unit: ' bpm', min: 50, max: 110 },
        rows: orderedVitals.slice(0, 8).map(item => ({
          key: item.elderId,
          name: item.elderName,
          roomNumber: item.roomNumber,
          metricValue: `${item.heartRate} 次/分`,
          timestamp: item.recordedAtLabel,
          note: item.abnormalItems.includes('心率偏高') || item.abnormalItems.includes('心率偏低') ? item.abnormalItems.filter(entry => entry.includes('心率')).join('、') : '当前平稳',
          tag: item.heartRate >= 110 || item.heartRate <= 50 ? <Tag variant="danger">需医生复核</Tag> : item.heartRate > 100 || item.heartRate < 60 ? <Tag variant="warning">持续观察</Tag> : <Tag variant="success">正常</Tag>,
          link: buildAiHref('health-hr', 'inference', item.elderId, item.elderName),
        })),
        railSummary: '按与常规区间偏离程度排序，优先暴露夜班与慢病老人可能需要连续复测的对象。',
      }
    }

    const lowOxygenNight = orderedVitals.filter(item => item.oxygen < 95)
    const highRiskNight = orderedVitals.filter(item => item.severityScore >= 5)
    return {
      title: '睡眠监测',
      subtitle: loading ? '正在加载夜间体征代理观测…' : `基于夜间生命体征与最近一次异常组合进行代理监测，${nightRecords.length} 条夜间样本。`,
      helpHref: '/health/help',
      stats: [
        { label: '夜间样本', value: nightRecords.length, sub: '22:00-06:00 观测数', color: 'primary' as const, icon: Moon },
        { label: '夜间低氧', value: lowOxygenNight.length, sub: '最近一次血氧 <95%', color: 'danger' as const, icon: AlertTriangle },
        { label: '高风险对象', value: highRiskNight.length, sub: '组合异常需复核', color: 'warning' as const, icon: AlertTriangle },
        { label: '覆盖对象', value: `${latestVitals.length}`, sub: '最近一次夜间代理', color: 'success' as const, icon: Heart },
      ],
      chart: { selectValue: (point: HealthTrendPoint) => point.bloodOxygenAvg, color: 'var(--color-success)', label: '夜间代理血氧', unit: '%', min: 88, max: 100 },
      rows: orderedVitals.slice(0, 8).map(item => ({
        key: item.elderId,
        name: item.elderName,
        roomNumber: item.roomNumber,
        metricValue: `${item.oxygen}% / ${item.heartRate} 次`,
        timestamp: item.recordedAtLabel,
        note: `夜间样本 ${nightByElder.get(item.elderId) ?? 0} 条${item.abnormalItems.length > 0 ? `，${item.abnormalItems.join('、')}` : ''}`,
        tag: item.oxygen <= 92 ? <Tag variant="danger">联合复测</Tag> : item.oxygen < 95 || item.abnormalItems.length > 0 ? <Tag variant="warning">夜间关注</Tag> : <Tag variant="success">平稳</Tag>,
        link: buildAiHref('health-sleep', 'rules', item.elderId, item.elderName),
      })),
      railSummary: '当前没有独立睡眠服务，页面以夜间生命体征样本作为代理视角，明确只用于运营观察而非临床诊断。',
    }
  })()

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={config.title}
        subtitle={error ? '健康专题数据加载失败。' : config.subtitle}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
              setData(null)
              setError(null)
              setReloadToken(value => value + 1)
            }}>刷新</button>
            <Link href="/health" className="btn btn-secondary btn-sm">返回健康总览</Link>
          </div>
        }
      />

      {error ? (
        <DataCard>
          <div className="form-error" style={{ marginBottom: 0 }}>
            <AlertCircle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
            <span className="form-error-text">健康专题加载失败：{error}</span>
          </div>
        </DataCard>
      ) : null}

      <InteractionRailLayout
        main={(
          <>
            <div className="kpi-grid">
              {config.stats.map(item => (
                <StatCard key={item.label} icon={<item.icon size={18} />} label={item.label} value={loading ? '--' : item.value} sub={item.sub} color={item.color} />
              ))}
            </div>

            <div className="data-card">
              <div className="data-card-header">
                <div className="flex gap-2" style={{ alignItems: 'center' }}>
                  <div className="data-card-icon-wrap"><Activity size={15} /></div>
                  <span className="lc-label">{config.chart.label}趋势</span>
                </div>
                <span className="lc-current">近7日</span>
              </div>
              <MetricLineChart
                points={trends}
                selectValue={config.chart.selectValue}
                color={config.chart.color}
                label={config.chart.label}
                unit={config.chart.unit}
                min={config.chart.min}
                max={config.chart.max}
              />
            </div>

            <DataCard title="重点对象" subtitle="按当前专题风险排序，保留对象、时间与跟进行为入口。" badge={<Tag variant="warning">Live Queue</Tag>}>
              {loading ? (
                <EmptyState title="正在整理重点对象…" description="等待实时体征返回后计算专题排序。" />
              ) : config.rows.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>老人</th>
                        <th>指标</th>
                        <th>时间</th>
                        <th>判断</th>
                        <th>状态</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {config.rows.map(item => {
                        const parsedValue = Number.parseFloat(item.metricValue)
                        const trend = trendForValue(Number.isNaN(parsedValue) ? 0 : parsedValue, metric === 'bp' ? 140 : metric === 'hr' ? 80 : 95)
                        return (
                          <tr key={item.key}>
                            <td>
                              <div className="font-semibold text-sm">{item.name}</div>
                              <div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{item.roomNumber}</div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{item.metricValue}</span>
                                <trend.icon size={13} style={{ color: trend.color }} />
                              </div>
                            </td>
                            <td><span className="text-xs" style={{ color: 'var(--color-muted)' }}>{item.timestamp}</span></td>
                            <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{item.note}</span></td>
                            <td>{item.tag}</td>
                            <td><Link href={item.link} className="btn btn-ghost btn-sm">进入 AI</Link></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="暂无专题对象" description="当前没有可用于该专题的实时体征样本。" />
              )}
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="专题边界" subtitle="右轨明确该专题的数据来源与判断边界。" badge={<Tag variant="info">Boundary</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">数据来源：Admin BFF `/api/admin/vitals` 聚合出的最新体征与近 7 日趋势。</div>
                <div className="page-help-card-item">{config.railSummary}</div>
                <div className="page-help-card-item">所有 AI 入口都带当前对象上下文，便于继续复核而不是重新搜索。</div>
              </div>
            </DataCard>

            <DataCard title="快速跳转" subtitle="从专题页回到总览或进入 AI 运营中心。" badge={<Tag variant="warning">Actions</Tag>}>
              <div style={{ display: 'grid', gap: 8 }}>
                <Link href="/health" className="btn btn-secondary btn-sm">返回健康总览</Link>
                <Link href={buildAiHref(`health-${metric}`, 'logs')} className="btn btn-secondary btn-sm">查看 AI 日志</Link>
                <Link href={buildAiHref(`health-${metric}`, 'rules')} className="btn btn-secondary btn-sm">查看规则治理</Link>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整健康专题说明迁移到显式帮助页"
              summary="专题页仅保留实时指标、趋势与重点对象列表，更多边界说明统一收口到帮助页。"
              items={[
                '先看专题 KPI，再看重点对象与对应时间点。',
                '当前页只做运营观察，不替代临床诊断。',
                '需要跨专题联动时，返回健康总览或进入 AI 运营中心。',
              ]}
              href={config.helpHref}
              actionLabel="查看健康帮助"
            />
          </>
        )}
      />
    </div>
  )
}
