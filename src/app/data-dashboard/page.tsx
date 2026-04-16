'use client'

import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag } from '@/components/nh';
import {
  fetchAdminDashboardOverview,
  type AdminDashboardMetricItem,
  type AdminDashboardOverviewResponse,
} from '@/lib/dashboard/admin-dashboard-api';
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
import { useEffect, useState } from 'react';

/* ── Pure CSS Bar Chart ── */
function BarChart({
  data,
  maxVal,
  unit = '',
}: {
  data: { label: string; value: number; color?: string }[]
  maxVal: number
  unit?: string
}) {
  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map((item, i) => {
        const pct = maxVal > 0 ? (item.value / maxVal) * 100 : 0
        return (
          <div key={i} className="bar-chart-row">
            <span className="bar-chart-label">{item.label}</span>
            <div className="bar-chart-track">
              <div className="bar-chart-fill" style={{ width: `${pct}%`, background: item.color || 'var(--color-primary)' }} />
              <span className="bar-chart-value">{item.value}{unit}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const BAR_COLORS = [
  'var(--color-primary)',
  'var(--color-success)',
  'var(--color-info)',
  'var(--color-warning)',
  'var(--color-purple)',
]

function getMaxValue(items: AdminDashboardMetricItem[]) {
  return items.reduce((max, item) => Math.max(max, item.value), 1)
}

function formatGeneratedAt(value?: string) {
  if (!value) {
    return '等待聚合结果'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function mapBarItems(items: AdminDashboardMetricItem[]) {
  return items.map((item, index) => ({
    ...item,
    color: BAR_COLORS[index % BAR_COLORS.length],
  }))
}

export default function DataDashboardPage() {
  const [overview, setOverview] = useState<AdminDashboardOverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    fetchAdminDashboardOverview()
      .then(response => {
        if (!active) {
          return
        }

        setOverview(response)
      })
      .catch(cause => {
        if (!active) {
          return
        }

        setOverview(null)
        setError(cause instanceof Error ? cause.message : 'Dashboard 聚合数据加载失败。')
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const kpis = overview?.kpis ?? {
    elderCount: 0,
    tenantCount: 0,
    pendingAlerts: 0,
    workflowPendingCount: 0,
  }

  const alertModules = overview?.alertModules ?? []
  const notificationBreakdown = overview?.notificationBreakdown ?? []
  const financeBreakdown = overview?.financeBreakdown ?? []
  const workflowBreakdown = overview?.workflowBreakdown ?? []
  const staffRanking = overview?.staffLeaderboard ?? []

  const getRateClass = (rate: number) =>
    rate >= 98 ? 'table-rate-high' : rate >= 96 ? 'table-rate-mid' : 'table-rate-low'
  const helpHref = '/analytics/help'

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="数据分析"
        subtitle={`运营实时聚合 · ${formatGeneratedAt(overview?.generatedAtUtc)}`}
      />

      <InteractionRailLayout
        main={(
          <>
            <div className="data-card" style={{ marginBottom: 16, padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                  {loading
                    ? '正在同步 Elder、Tenant、Billing、Notification、Operations、Care 的后端聚合数据...'
                    : error
                      ? `聚合读取失败：${error}`
                      : '当前页已切换为 Admin BFF 聚合快照，不再渲染本地静态演示数组。'}
                </div>
                <Tag variant={error ? 'warning' : loading ? 'info' : 'success'}>
                  {error ? 'Live Unavailable' : loading ? 'Syncing Snapshot' : 'Live Snapshot'}
                </Tag>
              </div>
            </div>

            <div className="kpi-grid" style={{ marginBottom: 16 }}>
              <StatCard icon={<Users size={18} />} label="在住长者" value={kpis.elderCount} sub="Elder Service" color="primary" />
              <StatCard icon={<Home size={18} />} label="活跃租户" value={kpis.tenantCount} sub="Tenant Service" color="success" />
              <StatCard icon={<Activity size={18} />} label="待处理告警" value={kpis.pendingAlerts} sub="pending + processing" color="warning" />
              <StatCard icon={<DollarSign size={18} />} label="护理待处理" value={kpis.workflowPendingCount} sub="待复核 + 未分配" color="info" />
            </div>

            <div className="dd-card-grid">
              <DataCard icon={<TrendingUp size={15} />} title="告警模块分布" subtitle="实时告警摘要">
                <BarChart data={mapBarItems(alertModules.map(item => ({ label: item.label, value: item.totalOpen })))} maxVal={getMaxValue(alertModules.map(item => ({ label: item.label, value: item.totalOpen })))} unit="条" />
              </DataCard>

              <DataCard icon={<BarChart3 size={15} />} title="通知投递摘要" subtitle="Notification Service">
                <BarChart data={mapBarItems(notificationBreakdown)} maxVal={getMaxValue(notificationBreakdown)} unit="条" />
              </DataCard>

              <DataCard icon={<DollarSign size={15} />} title="财务处理概览" subtitle="Billing Service">
                <BarChart data={mapBarItems(financeBreakdown)} maxVal={getMaxValue(financeBreakdown)} unit="项" />
              </DataCard>

              <DataCard icon={<Home size={15} />} title="护理工作流摘要" subtitle="Care Service">
                <BarChart data={mapBarItems(workflowBreakdown)} maxVal={getMaxValue(workflowBreakdown)} unit="项" />
              </DataCard>
            </div>

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
                    {staffRanking.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '24px 16px', color: 'var(--color-muted)', textAlign: 'center' }}>
                          暂无护理任务排行数据。
                        </td>
                      </tr>
                    ) : staffRanking.map((s, i) => (
                      <tr key={`${s.name}-${s.role}`} className="table-hover-row">
                        <td>
                          {i === 0 && <span className="staff-rank-badge">🥇</span>}
                          {i === 1 && <span className="staff-rank-badge">🥈</span>}
                          {i === 2 && <span className="staff-rank-badge">🥉</span>}
                          {i > 2 && <span className="staff-rank-num">{i + 1}</span>}
                        </td>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td><Tag variant={s.role === '医生' ? 'info' : s.role === '护士' ? 'primary' : 'neutral'}>{s.role}</Tag></td>
                        <td>{s.tasks}</td>
                        <td>{s.completed}</td>
                        <td>
                          <span className={`table-rate ${getRateClass(s.completionRate)}`}>{s.completionRate}%</span>
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
          </>
        )}
        rail={(
          <>
            <DataCard title="分析上下文" subtitle="把快照来源、页面定位和兼容入口后置展示。" badge={<Tag variant="info">Context</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">当前快照：{error ? 'Live Unavailable' : loading ? 'Syncing Snapshot' : 'Live Snapshot'}。</div>
                <div className="page-help-card-item">兼容入口：`/analytics` 与当前源页面共用同一数据分析主视图。</div>
                <div className="page-help-card-item">主区只保留 KPI、图表和排行，口径说明统一后置。</div>
              </div>
            </DataCard>

            <DataCard title="当前聚合焦点" subtitle="帮助理解这次快照最值得看的模块。" badge={<Tag variant="warning">Focus</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">待处理告警：{kpis.pendingAlerts} 条。</div>
                <div className="page-help-card-item">护理待处理：{kpis.workflowPendingCount} 项。</div>
                <div className="page-help-card-item">通知、财务和护理工作流图表均沿用同一 Admin BFF 聚合快照。</div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整分析页说明迁移到显式帮助页"
              summary="数据分析页现在只保留 KPI、结构图表和排行表，说明型内容与入口解释统一后置。"
              items={[
                '先看 KPI，再看四个聚合图表，最后核对员工排行。',
                '若快照异常或图表为空，以顶部状态卡和显式空态为准。',
                '若需要完整页面定位和兼容入口说明，进入帮助页查看。',
              ]}
              href={helpHref}
              actionLabel="查看数据分析帮助"
            />
          </>
        )}
      />
    </div>
  )
}
