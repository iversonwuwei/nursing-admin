'use client'

import { DataCard, PageHeader, StatCard, Tag } from '@/components/nh';
import { organizations } from '@/lib/data';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Award,
  BarChart3,
  DollarSign,
  Home,
  TrendingUp, Users,
} from 'lucide-react';

/* ── Pure CSS Bar Chart ── */
function BarChart({ data, maxVal }: { data: { label: string; value: number; color?: string }[]; maxVal: number }) {
  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map((item, i) => {
        const pct = (item.value / maxVal) * 100
        return (
          <div key={i} className="bar-chart-row">
            <span className="bar-chart-label">{item.label}</span>
            <div className="bar-chart-track">
              <div className="bar-chart-fill" style={{ width: `${pct}%`, background: item.color || 'var(--color-primary)' }} />
              <span className="bar-chart-value">{item.value}%</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Donut Chart ── */
function DonutChart({ segments, centerLabel, centerValue }: {
  segments: { value: number; color: string; label: string }[]
  centerLabel: string
  centerValue: string
}) {
  const r = 40
  const circ = 2 * Math.PI * r
  const chartSegments = segments.reduce<Array<{ value: number; color: string; label: string; dash: number; offset: number }>>((acc, seg) => {
    const dash = (seg.value / 100) * circ
    const offset = acc.length === 0 ? 0 : acc[acc.length - 1].offset + acc[acc.length - 1].dash

    return [...acc, { ...seg, dash, offset }]
  }, [])

  return (
    <div className="donut-chart-inner">
      <svg width="100" height="100" viewBox="0 0 100 100">
        {chartSegments.map((seg, i) => (
            <circle
              key={i}
              cx="50" cy="50" r={r} fill="none"
              stroke={seg.color} strokeWidth="9"
              strokeDasharray={`${seg.dash} ${circ - seg.dash}`}
              strokeLinecap="round"
              transform={`rotate(-90 50 50) rotate(${(seg.offset / circ) * 360} 50 50)`}
              style={{ transition: 'stroke-dasharray 600ms ease' }}
            />
        ))}
        <text x="50" y="46" textAnchor="middle" style={{ fontSize: 15, fontWeight: 800, fill: 'var(--color-text)', letterSpacing: '-0.02em' }}>
          {centerValue}
        </text>
        <text x="50" y="60" textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-muted)' }}>
          {centerLabel}
        </text>
      </svg>
      <div className="donut-legend">
        {segments.map((seg, i) => (
          <div key={i} className="donut-legend-item">
            <span className="donut-legend-dot" style={{ background: seg.color }} />
            <span className="donut-legend-label">{seg.label}</span>
            <span className="donut-legend-value">{seg.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DataDashboardPage() {
  // 入住率数据
  const occupancyData = [
    { label: '1月', value: 82 },
    { label: '2月', value: 85 },
    { label: '3月', value: 88 },
    { label: '4月', value: 87 },
    { label: '5月', value: 91 },
    { label: '6月', value: 93 },
    { label: '7月', value: 90 },
    { label: '8月', value: 94 },
    { label: '9月', value: 92 },
    { label: '10月', value: 95 },
    { label: '11月', value: 96 },
    { label: '12月', value: 97 },
  ]

  // 服务执行率
  const serviceExecution = [
    { label: '按时服药', value: 98 },
    { label: '康复训练', value: 91 },
    { label: '健康体检', value: 95 },
    { label: '护理服务', value: 99 },
    { label: '膳食安排', value: 96 },
  ]

  // 员工效率排行
  const staffRanking = [
    { rank: 1, name: '李护士', role: '护士', tasks: 156, completed: 154, rate: 98.7, trend: 'up' as const },
    { rank: 2, name: '王医生', role: '医生', tasks: 89, completed: 87, rate: 97.8, trend: 'up' as const },
    { rank: 3, name: '张护工', role: '护工', tasks: 312, completed: 305, rate: 97.8, trend: 'up' as const },
    { rank: 4, name: '刘护士', role: '护士', tasks: 142, completed: 137, rate: 96.5, trend: 'down' as const },
    { rank: 5, name: '赵护工', role: '护工', tasks: 298, completed: 286, rate: 96.0, trend: 'up' as const },
    { rank: 6, name: '陈护士', role: '护士', tasks: 138, completed: 132, rate: 95.7, trend: 'down' as const },
    { rank: 7, name: '周护工', role: '护工', tasks: 267, completed: 254, rate: 95.1, trend: 'up' as const },
  ]

  const totalBeds = organizations.reduce((s, o) => s + o.totalBeds, 0)
  const occupiedBeds = organizations.reduce((s, o) => s + o.occupiedBeds, 0)
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
  const avgExecution = Math.round(serviceExecution.reduce((s, v) => s + v.value, 0) / serviceExecution.length)

  const getRateClass = (rate: number) =>
    rate >= 98 ? 'table-rate-high' : rate >= 96 ? 'table-rate-mid' : 'table-rate-low'

  const getDeptColor = (rate: number) =>
    rate >= 95 ? 'var(--color-success)' : rate >= 80 ? 'var(--color-primary)' : 'var(--color-warning)'

  const incomeItems = [
    { label: '床位收入', value: '¥ 198.2万', pct: 69, color: 'var(--color-primary)' },
    { label: '护理收入', value: '¥ 52.8万', pct: 18, color: 'var(--color-info)' },
    { label: '餐饮收入', value: '¥ 21.5万', pct: 8, color: 'var(--color-warning)' },
    { label: '其他收入', value: '¥ 14.0万', pct: 5, color: 'var(--color-purple)' },
  ]

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="数据分析"
        subtitle="运营数据看板 · 本月统计"
      />

      {/* Top KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard icon={<Home size={18} />} label="入住率" value={`${occupancyRate}%`} trend={{ value: '2.1%', direction: 'up' }} sub="较上月" color="primary" />
        <StatCard icon={<Activity size={18} />} label="服务执行率" value={`${avgExecution}%`} trend={{ value: '1.3%', direction: 'up' }} sub="平均执行率" color="success" />
        <StatCard icon={<DollarSign size={18} />} label="本月收入" value="¥ 286.5万" trend={{ value: '5.8%', direction: 'up' }} sub="较上月" color="info" />
        <StatCard icon={<Users size={18} />} label="在住老人" value={occupiedBeds} sub={`共 ${totalBeds} 床位`} color="purple" />
      </div>

      <div className="dd-card-grid">

        {/* Occupancy trend */}
        <DataCard
          icon={<TrendingUp size={15} />}
          title="入住率趋势"
          subtitle="2025年度"
        >
          <BarChart data={occupancyData} maxVal={100} />
        </DataCard>

        {/* Service execution */}
        <DataCard
          icon={<BarChart3 size={15} />}
          title="服务执行率"
          subtitle="本月"
        >
          <div className="donut-chart-wrap">
            <DonutChart
              segments={[
                { value: 98, color: 'var(--color-success)', label: '按时服药' },
                { value: 91, color: 'var(--color-info)', label: '康复训练' },
                { value: 95, color: 'var(--color-primary)', label: '健康体检' },
                { value: 99, color: 'var(--color-purple)', label: '护理服务' },
                { value: 96, color: 'var(--color-warning)', label: '膳食安排' },
              ]}
              centerLabel="综合执行率"
              centerValue={`${avgExecution}%`}
            />
          </div>
        </DataCard>

        {/* Monthly income */}
        <DataCard
          icon={<DollarSign size={15} />}
          title="本月收入概况"
          subtitle="2026年3月"
        >
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {incomeItems.map(item => (
              <div key={item.label} className="income-item">
                <div className="income-item-row">
                  <span className="income-item-label">{item.label}</span>
                  <span className="income-item-value">{item.value}</span>
                </div>
                <div className="income-track">
                  <div className="income-fill" style={{ width: `${item.pct}%`, background: item.color }} />
                </div>
              </div>
            ))}
            <div className="income-total">
              <span className="income-total-label">合计</span>
              <span className="income-total-value">¥ 286.5万</span>
            </div>
          </div>
        </DataCard>

        {/* Dept breakdown */}
        <DataCard
          icon={<Home size={15} />}
          title="分院入住情况"
          subtitle="本月"
        >
          <div>
            {organizations.map(org => {
              const rate = Math.round((org.occupiedBeds / org.totalBeds) * 100)
              return (
                <div key={org.id} className="dept-row">
                  <div className="dept-row-header">
                    <span className="dept-row-name">{org.name}</span>
                    <span className="dept-row-meta">{org.occupiedBeds} / {org.totalBeds} 床</span>
                  </div>
                  <div className="dept-track">
                    <div className="dept-fill" style={{ width: `${rate}%`, background: getDeptColor(rate) }} />
                  </div>
                  <div className="dept-pct">
                    <span className="dept-pct-val">{rate}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </DataCard>
      </div>

      {/* Staff ranking table */}
      <div className="data-card" style={{ marginTop: 16 }}>
        <div className="data-card-header">
          <div className="flex-center" style={{ gap: 8 }}>
            <div className="data-card-icon-wrap"><Award size={15} /></div>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>员工效率排行</span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>本月 · 前7名</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 48 }}>#</th>
                <th>姓名</th>
                <th>岗位</th>
                <th>任务总数</th>
                <th>已完成</th>
                <th>完成率</th>
                <th>趋势</th>
              </tr>
            </thead>
            <tbody>
              {staffRanking.map((s, i) => (
                <tr key={s.rank} className="table-hover-row">
                  <td>
                    {i === 0 && <span className="staff-rank-badge">🥇</span>}
                    {i === 1 && <span className="staff-rank-badge">🥈</span>}
                    {i === 2 && <span className="staff-rank-badge">🥉</span>}
                    {i > 2 && <span className="staff-rank-num">{s.rank}</span>}
                  </td>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td><Tag variant={s.role === '医生' ? 'info' : s.role === '护士' ? 'primary' : 'neutral'}>{s.role}</Tag></td>
                  <td>{s.tasks}</td>
                  <td>{s.completed}</td>
                  <td>
                    <span className={`table-rate ${getRateClass(s.rate)}`}>{s.rate}%</span>
                  </td>
                  <td>
                    {s.trend === 'up'
                      ? <span className="trend-up"><ArrowUp size={11} />上升</span>
                      : <span className="trend-down"><ArrowDown size={11} />下降</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
