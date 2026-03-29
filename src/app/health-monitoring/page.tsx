'use client'

import { useState } from 'react'
import { StatCard, Tag, PageHeader, DataCard } from '@/components/nh'
import { healthVitals, healthTrends, healthStats, VITAL_RANGES } from '@/lib/data/health-data'
import { Activity, Heart, Droplets, Thermometer, AlertTriangle, Clock } from 'lucide-react'

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

      {/* KPI row */}
      <div className="kpi-grid">
        <StatCard icon={<Activity size={18} />} label="监测中" value={healthStats.totalMonitored} sub="当前在线" color="primary" />
        <StatCard icon={<Heart size={18} />} label="异常预警" value={healthStats.abnormalCount} sub={`含 ${healthStats.criticalCount} 例严重`} color="danger" />
        <StatCard icon={<Heart size={18} />} label="平均心率" value={`${healthStats.avgHeartRate}`} sub={VITAL_RANGES.heartRate.unit} color="info" />
        <StatCard icon={<Droplets size={18} />} label="平均血氧" value={healthStats.avgBloodOxygen} sub={VITAL_RANGES.bloodOxygen.unit} color="success" />
      </div>

      {/* Trend Charts */}
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

      {/* Vital cards */}
      <div className="hm-vital-grid" style={{ marginTop: 4 }}>
        {displayVitals.map(vital => (
          <VitalCard key={vital.elderlyId} vital={vital} />
        ))}
      </div>
    </div>
  )
}
