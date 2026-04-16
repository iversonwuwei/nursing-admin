'use client'

import { DataCard, EmptyState, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { healthStats, healthTrends, healthVitals, VITAL_RANGES } from '@/lib/data/health-data'
import { getHealthAiInsights, getHealthFollowupActions, getHealthTrendNarratives } from '@/lib/mock/admin-ai'
import { Activity, AlertTriangle, Bot, Clock, Droplets, Heart } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

/* ── Pure CSS Line Chart ── */
function LineChart({
  data,
  dataKey,
  color,
  label,
  unit,
  maxVal,
  minVal,
}: {
  data: typeof healthTrends
  dataKey: keyof typeof healthTrends[0]
  color: string
  label: string
  unit: string
  maxVal: number
  minVal: number
}) {
  const values = data.map(d => d[dataKey] as number)
  const range = maxVal - minVal
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * 100,
    y: 100 - ((v - minVal) / range) * 100,
  }))
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `M 0 100 L ${pathD.slice(2)} L 100 100 Z`

  return (
    <div style={{ padding: '16px 20px' }}>
      <div className="lc-header">
        <span className="lc-label">{label}</span>
        <span className="lc-current">{values[values.length - 1]}{unit}</span>
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="lc-svg">
        {[0, 25, 50, 75, 100].map(v => (
          <line key={v} x1="0" y1={v} x2="100" y2={v}
            stroke="var(--color-border)" strokeWidth="0.3" />
        ))}
        <path d={areaD} fill={color} fillOpacity="0.08" />
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.2"
          strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={color} />
        ))}
      </svg>
      <div className="lc-xlabels">
        {data.map((d, i) => (
          <span key={i} className="lc-xlabel">{d.date}</span>
        ))}
      </div>
    </div>
  )
}

/* ── Vital Card ── */
function VitalCard({ vital }: { vital: typeof healthVitals[0] }) {
  const isAbnormalHR = vital.heartRate < VITAL_RANGES.heartRate.min || vital.heartRate > VITAL_RANGES.heartRate.max
  const isAbnormalBP = vital.bloodPressureHigh > VITAL_RANGES.bloodPressureHigh.max
  const isAbnormalO2 = vital.bloodOxygen < VITAL_RANGES.bloodOxygen.min
  const isAbnormalBS = vital.bloodSugar < VITAL_RANGES.bloodSugar.min || vital.bloodSugar > VITAL_RANGES.bloodSugar.max

  return (
    <div className="data-card vital-card-header" style={{ padding: 0, gap: 0 }}>
      <div className={`vital-card-header ${vital.isAbnormal ? 'abnormal' : ''}`}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{vital.elderlyName}</div>
          <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 1 }}>
            <Clock size={10} style={{ display: 'inline', marginRight: 3 }} />
            {vital.timestamp}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{vital.roomNumber}</span>
          {vital.isAbnormal && (
            <Tag variant="danger">
              <AlertTriangle size={9} />异常
            </Tag>
          )}
          {!vital.isAbnormal && <Tag variant="success">正常</Tag>}
        </div>
      </div>

      <div className="vital-grid-2x2">
        {/* Heart Rate */}
        <div className="vital-cell right bottom">
          <div className="vital-cell-label">
            <Heart size={12} color={isAbnormalHR ? 'var(--color-danger)' : 'var(--color-danger)'} fill={isAbnormalHR ? 'var(--color-danger)' : 'none'} />
            <span className="vital-cell-label-text">心率</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: isAbnormalHR ? 'var(--color-danger)' : 'var(--color-text)', letterSpacing: '-0.02em' }}>
            {vital.heartRate}
          </div>
          <div className="vital-cell-unit">{VITAL_RANGES.heartRate.unit}</div>
        </div>
        {/* Blood Pressure */}
        <div className="vital-cell bottom">
          <div className="vital-cell-label">
            <Activity size={12} color={isAbnormalBP ? 'var(--color-warning)' : 'var(--color-info)'} />
            <span className="vital-cell-label-text">血压</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: isAbnormalBP ? 'var(--color-warning)' : 'var(--color-text)', letterSpacing: '-0.02em' }}>
            {vital.bloodPressureHigh}/{vital.bloodPressureLow}
          </div>
          <div className="vital-cell-unit">{VITAL_RANGES.bloodPressureHigh.unit}</div>
        </div>
        {/* Blood Oxygen */}
        <div className="vital-cell right">
          <div className="vital-cell-label">
            <Droplets size={12} color={isAbnormalO2 ? 'var(--color-danger)' : 'var(--color-info)'} />
            <span className="vital-cell-label-text">血氧</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: isAbnormalO2 ? 'var(--color-danger)' : 'var(--color-text)', letterSpacing: '-0.02em' }}>
            {vital.bloodOxygen}
          </div>
          <div className="vital-cell-unit">{VITAL_RANGES.bloodOxygen.unit}</div>
        </div>
        {/* Blood Sugar */}
        <div className="vital-cell">
          <div className="vital-cell-label">
            <Droplets size={12} color={isAbnormalBS ? 'var(--color-warning)' : 'var(--color-purple)'} />
            <span className="vital-cell-label-text">血糖</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: isAbnormalBS ? 'var(--color-warning)' : 'var(--color-text)', letterSpacing: '-0.02em' }}>
            {vital.bloodSugar}
          </div>
          <div className="vital-cell-unit">{VITAL_RANGES.bloodSugar.unit}</div>
        </div>
      </div>

      {vital.abnormalItems.length > 0 && (
        <div className="vital-abnormal-tags">
          {vital.abnormalItems.map(item => (
            <Tag key={item} variant="warning" style={{ marginRight: 4, marginBottom: 2 }}>{item}</Tag>
          ))}
        </div>
      )}
    </div>
  )
}

export default function HealthMonitoringPage() {
  const [view, setView] = useState<'all' | 'abnormal'>('all')
  const displayVitals = view === 'abnormal'
    ? healthVitals.filter(v => v.isAbnormal)
    : healthVitals
  const aiInsights = getHealthAiInsights()
  const trendNarratives = getHealthTrendNarratives()
  const followupActions = getHealthFollowupActions(aiInsights)
  const highestRisk = followupActions[0] ?? null
  const helpHref = '/health-monitoring/help'
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference', entityId?: string, entityName?: string) => buildAiAssistantHref({
    source: 'health-monitoring',
    entityId: entityId ?? 'health-board',
    entityName: entityName ?? '健康监测',
    focus,
    target,
  })

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="健康监测"
        subtitle={`实时监测 · 共 ${healthStats.totalMonitored} 位老人 · ${healthStats.abnormalCount} 人异常`}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setView('all')}
              className={`btn btn-sm ${view === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            >
              全部 ({healthStats.totalMonitored})
            </button>
            <button
              onClick={() => setView('abnormal')}
              className={`btn btn-sm ${view === 'abnormal' ? 'btn-danger' : 'btn-secondary'}`}
            >
              <AlertTriangle size={12} />异常 ({healthStats.abnormalCount})
            </button>
          </div>
        }
      />

      <InteractionRailLayout
        main={(
          <>
            <WorkflowOverviewCard
              eyebrow="Health Monitoring"
              title="健康监测总览"
              description="主区只保留异常对象、跟进动作、趋势图和生命体征对象卡，先帮助值班人员决定跟进谁。"
              badge={<Tag variant="warning">Health Board</Tag>}
              metrics={[
                { label: '监测中', value: healthStats.totalMonitored, hint: '当前在线监测对象', tone: 'primary' },
                { label: '异常预警', value: healthStats.abnormalCount, hint: `含 ${healthStats.criticalCount} 例严重`, tone: healthStats.abnormalCount > 0 ? 'danger' : 'success' },
                { label: '平均心率', value: `${healthStats.avgHeartRate}`, hint: VITAL_RANGES.heartRate.unit, tone: 'info' },
                { label: '平均血氧', value: `${healthStats.avgBloodOxygen}`, hint: VITAL_RANGES.bloodOxygen.unit, tone: 'success' },
              ]}
              signals={[
                { label: highestRisk ? `当前优先跟进：${highestRisk.elderlyName}` : '当前无异常跟进对象', tone: highestRisk?.severity === '高风险' ? 'danger' : 'info' },
                { label: view === 'abnormal' ? '当前只显示异常对象卡，便于值班快速跟进。' : '当前显示全部对象，可从对象卡继续下钻。', tone: 'primary' },
                { label: 'AI 风险解释与趋势说明已后置到右轨，不在主区占用判断空间。', tone: 'neutral' },
              ]}
              actions={
                <>
                  <Link href={buildAiHref('health-followup', 'logs')} className="btn btn-secondary btn-sm">查看 AI 跟进</Link>
                  <Link href={buildAiHref('health-trend', 'rules')} className="btn btn-secondary btn-sm">查看趋势说明</Link>
                </>
              }
            />

            <div className="kpi-grid">
              <StatCard icon={<Activity size={18} />} label="监测中" value={healthStats.totalMonitored} sub="当前在线" color="primary" />
              <StatCard icon={<Heart size={18} />} label="异常预警" value={healthStats.abnormalCount} sub={`含 ${healthStats.criticalCount} 例严重`} color="danger" />
              <StatCard icon={<Heart size={18} />} label="平均心率" value={`${healthStats.avgHeartRate}`} sub={VITAL_RANGES.heartRate.unit} color="info" />
              <StatCard icon={<Droplets size={18} />} label="平均血氧" value={healthStats.avgBloodOxygen} sub={VITAL_RANGES.bloodOxygen.unit} color="success" />
            </div>

            <DataCard icon={<Bot size={16} />} title="当班跟进队列" subtitle="把重点异常对象压成当班执行序列，并带着对象上下文进入 AI 运营中心。" badge={<Tag variant="warning">Follow-up Board</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                {followupActions.map(item => (
                  <div key={item.elderlyId} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.elderlyName}</div>
                        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--color-muted)' }}>{item.title}</div>
                      </div>
                      <Tag variant={item.severity === '高风险' ? 'danger' : 'warning'}>{item.severity}</Tag>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>{item.summary}</div>
                    <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.action}</div>
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>置信度 {item.confidence}%</div>
                      <Link href={buildAiHref('health-followup', 'logs', item.elderlyId, item.elderlyName)} className="btn btn-secondary btn-sm">带上下文追踪</Link>
                    </div>
                  </div>
                ))}
              </div>
            </DataCard>

            <div className="hm-chart-grid">
              <div className="data-card">
                <div className="data-card-header">
                  <div className="flex gap-2" style={{ alignItems: 'center' }}>
                    <div className="data-card-icon-wrap"><Heart size={15} /></div>
                    <span className="lc-label">心率趋势</span>
                  </div>
                  <span className="lc-current">近7日</span>
                </div>
                <LineChart
                  data={healthTrends}
                  dataKey="heartRateAvg"
                  color="var(--color-danger)"
                  label="平均心率"
                  unit=" bpm"
                  maxVal={80}
                  minVal={65}
                />
              </div>
              <div className="data-card">
                <div className="data-card-header">
                  <div className="flex gap-2" style={{ alignItems: 'center' }}>
                    <div className="data-card-icon-wrap"><Activity size={15} /></div>
                    <span className="lc-label">血压趋势</span>
                  </div>
                  <span className="lc-current">近7日</span>
                </div>
                <LineChart
                  data={healthTrends}
                  dataKey="bloodPressureHighAvg"
                  color="var(--color-info)"
                  label="平均高压"
                  unit=" mmHg"
                  maxVal={160}
                  minVal={120}
                />
              </div>
              <div className="data-card">
                <div className="data-card-header">
                  <div className="flex gap-2" style={{ alignItems: 'center' }}>
                    <div className="data-card-icon-wrap"><Droplets size={15} /></div>
                    <span className="lc-label">血氧趋势</span>
                  </div>
                  <span className="lc-current">近7日</span>
                </div>
                <LineChart
                  data={healthTrends}
                  dataKey="bloodOxygenAvg"
                  color="var(--color-success)"
                  label="平均血氧"
                  unit="%"
                  maxVal={98}
                  minVal={93}
                />
              </div>
              <div className="data-card">
                <div className="data-card-header">
                  <div className="flex gap-2" style={{ alignItems: 'center' }}>
                    <div className="data-card-icon-wrap"><Droplets size={15} /></div>
                    <span className="lc-label">血糖趋势</span>
                  </div>
                  <span className="lc-current">近7日</span>
                </div>
                <LineChart
                  data={healthTrends}
                  dataKey="bloodSugarAvg"
                  color="var(--color-purple)"
                  label="平均血糖"
                  unit=" mmol/L"
                  maxVal={7.5}
                  minVal={4.5}
                />
              </div>
            </div>

            {displayVitals.length === 0 ? (
              <EmptyState
                variant="danger"
                title="当前没有异常对象"
                description="异常筛选下暂时没有需要跟进的老人，可切回全部视图继续巡视。"
                action={<button className="btn btn-secondary btn-sm" onClick={() => setView('all')}>查看全部对象</button>}
              />
            ) : (
              <div className="hm-vital-grid" style={{ marginTop: 4 }}>
                {displayVitals.map(vital => (
                  <VitalCard key={vital.elderlyId} vital={vital} />
                ))}
              </div>
            )}
          </>
        )}
        rail={(
          <>
            <DataCard
              icon={<AlertTriangle size={16} />}
              title="监测上下文"
              subtitle="后置展示当前筛选、最高风险对象和判断口径。"
              badge={<Tag variant="info">Context</Tag>}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">当前视图：{view === 'abnormal' ? '仅异常对象' : '全部对象'}。</div>
                <div className="page-help-card-item">最高优先：{highestRisk ? `${highestRisk.elderlyName} · ${highestRisk.severity}` : '当前无异常跟进对象。'}</div>
                <div className="page-help-card-item">判断口径：主区先看跟进动作、趋势和对象卡，AI 解释只做辅助判断。</div>
              </div>
            </DataCard>

            <DataCard
              icon={<Bot size={16} />}
              title="AI 风险解释"
              subtitle="对连续异常和组合异常给出解释与建议动作，仍需人工复核后再升级。"
              badge={<Tag variant="warning">需人工确认</Tag>}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                {aiInsights.slice(0, 4).map(item => (
                  <div key={item.elderlyId} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.elderlyName}</div>
                        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--color-muted)' }}>{item.roomNumber} · {item.title}</div>
                      </div>
                      <Tag variant={item.severity === '高风险' ? 'danger' : 'warning'}>{item.severity}</Tag>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>{item.explanation}</div>
                    <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.action}</div>
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>置信度 {item.confidence}%</div>
                    <div style={{ marginTop: 8 }}>
                      <Link href={buildAiHref('health-risk', 'inference', item.elderlyId, item.elderlyName)} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
                    </div>
                  </div>
                ))}
              </div>
            </DataCard>

            <DataCard
              icon={<Activity size={16} />}
              title="AI 趋势解读"
              subtitle="把近 7 日健康趋势转成管理可读的摘要，不直接给医疗诊断。"
            >
              <div style={{ display: 'grid', gap: 10 }}>
                {trendNarratives.map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <Link href={buildAiHref('health-trend', 'rules')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整健康监测说明迁移到显式帮助页"
              summary="健康监测页现在只保留跟进队列、趋势图和对象卡，AI 风险解释与趋势摘要统一后置到右轨和帮助页。"
              items={[
                '先看异常对象和跟进动作，再决定是否进入对象上下文追踪。',
                '异常筛选无结果时，以显式空态为准，不再让说明卡替代状态反馈。',
                '若需要完整页面定位和 AI 边界说明，进入帮助页查看。',
              ]}
              href={helpHref}
              actionLabel="查看健康监测帮助"
            />
          </>
        )}
      />
    </div>
  )
}
