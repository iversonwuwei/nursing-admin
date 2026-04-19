'use client'

import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard } from '@/components/nh'
import { getCareScene, withSceneQuery } from '@/lib/care-scenes'
import { fetchAdminDashboardOverview, type AdminDashboardMetricItem, type AdminDashboardOverviewResponse } from '@/lib/dashboard/admin-dashboard-api'
import { BILLABLE_MODULE_CATALOG } from '@/lib/platform/saas-config'
import { readSessionPlatformState } from '@/lib/platform/session'
import {
    AlertTriangle,
    CalendarHeart,
    ClipboardList,
    DollarSign,
    DoorOpen,
    Download,
    Home,
    Stethoscope,
    Users,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

const quickLinks = [
  { icon: <CalendarHeart size={18} />, label: '活动管理', href: '/activities' },
  { icon: <DoorOpen size={18} />, label: '房间管理', href: '/rooms' },
  { icon: <Users size={18} />, label: '员工列表', href: '/staff' },
  { icon: <AlertTriangle size={18} />, label: '事故报告', href: '/incidents' },
  { icon: <DollarSign size={18} />, label: '财务收支', href: '/financial' },
  { icon: <Stethoscope size={18} />, label: '医疗设备', href: '/devices' },
]

function getBreakdownValue(items: AdminDashboardMetricItem[] | undefined, label: string) {
  return items?.find(item => item.label === label)?.value ?? 0
}

function getStaffOpenTasks(overview: AdminDashboardOverviewResponse | null) {
    if (!overview) {
        return 0
    }

    return overview.staffLeaderboard.reduce((sum, item) => sum + Math.max(item.tasks - item.completed, 0), 0)
}

interface HomeCommandCardProps {
  title: string
  description: string
  badge?: ReactNode
  accent: string
  primaryHref: string
  primaryLabel: string
  secondaryHref?: string
  secondaryLabel?: string
}

function HomeCommandCard({
  title,
  description,
  badge,
  accent,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: HomeCommandCardProps) {
  return (
    <div className="home-command-card">
      <div className="home-command-top">
        <div className="home-command-copy">
          <div className="home-command-title-row">
            <span className="home-command-accent" style={{ background: accent }} />
            <span className="home-command-title">{title}</span>
          </div>
          <div className="home-command-description">{description}</div>
        </div>
        {badge}
      </div>

      <div className="home-command-actions">
        <Link href={primaryHref} className="btn btn-secondary btn-sm">{primaryLabel}</Link>
        {secondaryHref && secondaryLabel ? (
          <Link href={secondaryHref} className="btn btn-ghost btn-sm">{secondaryLabel}</Link>
        ) : null}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const scene = getCareScene(searchParams.get('scene'))
  const platformState = useMemo(() => readSessionPlatformState(session), [session])
  const [dashboardOverview, setDashboardOverview] = useState<AdminDashboardOverviewResponse | null>(null)
  const [dashboardError, setDashboardError] = useState('')
  const [dashboardLoading, setDashboardLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    void fetchAdminDashboardOverview()
      .then(response => {
        if (cancelled) {
          return
        }

        setDashboardOverview(response)
        setDashboardError('')
      })
      .catch(error => {
        if (cancelled) {
          return
        }

        setDashboardOverview(null)
        setDashboardError(error instanceof Error ? error.message : '首页总览读取失败。')
      })
      .finally(() => {
          if (!cancelled) {
              setDashboardLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const today = new Date()
  const dateStr = today.toLocaleDateString('zh-CN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  const subscribedModules = useMemo(
    () => platformState.enabledModules.map(module => BILLABLE_MODULE_CATALOG[module]),
    [platformState.enabledModules],
  )

  const sceneMeta = scene === 'home'
    ? {
          subtitle: '当前按居家养老视角组织入口，优先聚焦评定、派案、回执与监管链路。',
          overviewTitle: '今日居家运营优先级总览',
          overviewDescription: '首页只保留总览和分流入口，帮助你先确认居家评定、派案和回执压力，再进入对应工作台。',
          primaryHref: withSceneQuery('/operations/daily', scene),
          primaryLabel: '进入居家工作台',
          secondaryHref: withSceneQuery('/elderly/checkin', scene),
          secondaryLabel: '进入居家评定',
          tertiaryHref: withSceneQuery('/staff/schedule', scene),
          tertiaryLabel: '查看居家派案',
          sceneLabel: '居家视角中',
          sceneVariant: 'warning' as const,
      }
    : scene === 'institutional'
      ? {
              subtitle: '当前按机构养老视角组织入口，优先聚焦院内认定、执行、打卡与房间承接。',
              overviewTitle: '今日机构运营优先级总览',
              overviewDescription: '首页只保留总览和分流入口，帮助你先确认院内认定、执行打卡和告警压力，再进入对应工作台。',
              primaryHref: withSceneQuery('/operations/daily', scene),
              primaryLabel: '进入机构工作台',
              secondaryHref: withSceneQuery('/elderly/checkin', scene),
              secondaryLabel: '进入机构认定',
              tertiaryHref: withSceneQuery('/staff/tasks', scene),
              tertiaryLabel: '查看护理任务',
              sceneLabel: '机构视角中',
              sceneVariant: 'primary' as const,
          }
      : {
              subtitle: `${dateStr} · 首页当前只保留院务优先级与分流入口。`,
              overviewTitle: '今日院务优先级总览',
              overviewDescription: '首页现在只回答两个问题: 今天最需要先处理什么，以及应该进入哪个专页或工作台。',
              primaryHref: '/operations/daily',
              primaryLabel: '进入日班工作台',
              secondaryHref: '/elderly/checkin',
              secondaryLabel: '进入评估认定',
              tertiaryHref: '/alerts',
              tertiaryLabel: '查看实时告警',
              sceneLabel: '通用视角',
              sceneVariant: 'info' as const,
          }

    const liveManagedElders = dashboardOverview?.kpis.elderCount ?? 0
    const liveTenantCount = dashboardOverview?.kpis.tenantCount ?? 0
    const livePendingAlerts = dashboardOverview?.kpis.pendingAlerts ?? 0
    const liveWorkflowPendingCount = dashboardOverview?.kpis.workflowPendingCount ?? 0
    const livePendingReviewPlans = getBreakdownValue(dashboardOverview?.workflowBreakdown, '待复核计划')
    const liveUnassignedPlans = getBreakdownValue(dashboardOverview?.workflowBreakdown, '未分配计划')
  const liveFinanceActionRequired = getBreakdownValue(dashboardOverview?.financeBreakdown, '动作必做')
  const liveQueuedNotifications = getBreakdownValue(dashboardOverview?.notificationBreakdown, '待发送')
    const liveCriticalHealthSignals = dashboardOverview?.alertModules.reduce((sum, item) => sum + item.critical, 0) ?? 0
    const liveOpenStaffTasks = getStaffOpenTasks(dashboardOverview)
    const liveCompletedTasks = dashboardOverview?.staffLeaderboard.reduce((sum, item) => sum + item.completed, 0) ?? 0
  const dashboardGeneratedAtLabel = dashboardOverview
    ? new Date(dashboardOverview.generatedAtUtc).toLocaleString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
    : ''

  const summaryDescription = dashboardError
    ? `${sceneMeta.overviewDescription} 当前服务端聚合不可用，但入口和分流路径保持可用。`
    : `${sceneMeta.overviewDescription} 首页第一屏 KPI 已切到服务端聚合快照。`

  const priorityActions = [
    {
      title: '日班运营收口',
          description: dashboardError
              ? '聚合失败时不在首页回填本地指标，先进入日班工作台核实当班状态。'
              : `当前仍有 ${livePendingAlerts} 条实时告警与 ${liveWorkflowPendingCount} 项流程待办，先在统一工作台收口再分流。`,
          badge: <Tag variant={dashboardError || livePendingAlerts > 0 || liveWorkflowPendingCount > 0 ? 'warning' : 'success'}>{dashboardError || livePendingAlerts > 0 || liveWorkflowPendingCount > 0 ? '优先处理' : '当前稳定'}</Tag>,
          accent: dashboardError ? 'var(--color-danger)' : 'var(--color-primary)',
      primaryHref: withSceneQuery('/operations/daily', scene),
      primaryLabel: '进入工作台',
    },
    {
        title: '评估与计划复核',
        description: dashboardError
            ? '当前无法展示首页级待复核统计，请直接进入认定页核实流程状态。'
            : `当前仍有 ${livePendingReviewPlans} 项待复核计划和 ${liveUnassignedPlans} 项未分配计划，建议在结算和任务派生前先完成收口。`,
        badge: <Tag variant={dashboardError || livePendingReviewPlans > 0 || liveUnassignedPlans > 0 ? 'warning' : 'success'}>{dashboardError || livePendingReviewPlans > 0 || liveUnassignedPlans > 0 ? '待收口' : '已收口'}</Tag>,
        accent: dashboardError ? 'var(--color-danger)' : 'var(--color-warning)',
      primaryHref: withSceneQuery('/elderly/checkin', scene),
      primaryLabel: '进入认定',
          secondaryHref: withSceneQuery('/staff/tasks', scene),
          secondaryLabel: '查看任务',
      },
      {
          title: '财务与通知跟进',
          description: dashboardError
              ? '聚合失败时不在首页回填本地账单和通知计数，请直接进入专页核实。'
              : `当前仍有 ${liveFinanceActionRequired} 项财务动作必做、${liveQueuedNotifications} 条通知待发送，建议在优先动作后处理。`,
          badge: <Tag variant={dashboardError || liveFinanceActionRequired > 0 || liveQueuedNotifications > 0 ? 'warning' : 'success'}>{dashboardError || liveFinanceActionRequired > 0 || liveQueuedNotifications > 0 ? '需跟进' : '当前稳定'}</Tag>,
          accent: dashboardError ? 'var(--color-danger)' : 'var(--color-info)',
          primaryHref: withSceneQuery('/financial', scene),
          primaryLabel: '进入财务专页',
          secondaryHref: '/notifications',
          secondaryLabel: '查看通知队列',
    },
    {
      title: '护理执行闭环',
        description: dashboardError
            ? '当前无法展示首页级任务聚合，请直接进入任务与排班页继续执行闭环。'
            : `当前仍有 ${liveOpenStaffTasks} 项护理任务未闭环，已完成 ${liveCompletedTasks} 项。首页不再展开任务表，只保留下钻入口。`,
        badge: <Tag variant={dashboardError || liveOpenStaffTasks > 0 ? 'warning' : 'success'}>{dashboardError || liveOpenStaffTasks > 0 ? '待闭环' : '已闭环'}</Tag>,
        accent: dashboardError ? 'var(--color-danger)' : 'var(--color-success)',
      primaryHref: withSceneQuery('/staff/tasks', scene),
      primaryLabel: '查看任务',
      secondaryHref: withSceneQuery('/staff/schedule', scene),
      secondaryLabel: '查看排班',
    },
  ]

  const routeEntries = [
      {
      title: '健康监测专页',
          description: dashboardError
              ? '当前无法展示首页级健康信号聚合，请直接进入健康监测和老人详情页核实。'
              : `当前需要重点关注 ${liveCriticalHealthSignals} 项高风险健康信号，趋势观察和对象详情统一退回健康监测与老人详情页。`,
          badge: <Tag variant={dashboardError || liveCriticalHealthSignals > 0 ? 'warning' : 'success'}>{dashboardError || liveCriticalHealthSignals > 0 ? '重点关注' : '当前稳定'}</Tag>,
          accent: dashboardError ? 'var(--color-danger)' : 'var(--color-warning)',
      primaryHref: withSceneQuery('/health-monitoring', scene),
      primaryLabel: '进入健康监测',
      secondaryHref: '/elderly',
      secondaryLabel: '查看老人详情',
    },
    {
        title: '告警中心',
      description: dashboardError
              ? '当前无法读取首页级告警快照，请直接进入告警页确认实时状态。'
              : `当前共有 ${livePendingAlerts} 条实时告警待处理，首页只保留优先级提示，不再展开本地设备告警列表。`,
          badge: <Tag variant={dashboardError || livePendingAlerts > 0 ? 'danger' : 'success'}>{dashboardError || livePendingAlerts > 0 ? '待处理' : '当前稳定'}</Tag>,
          accent: dashboardError ? 'var(--color-danger)' : 'var(--color-danger)',
          primaryHref: '/alerts',
          primaryLabel: '查看告警',
          secondaryHref: '/devices/realtime',
          secondaryLabel: '设备监控',
      },
      {
          title: '经营与下载',
          description: '首页不再内嵌经营草稿或下载板块，统一回到分析中心和导出入口完成操作。',
          badge: <Tag variant="info">统一出口</Tag>,
          accent: 'var(--color-info)',
          primaryHref: withSceneQuery('/analytics/report', scene),
          primaryLabel: '进入分析中心',
          secondaryHref: '/export',
          secondaryLabel: '查看导出',
    },
  ]

  return (
      <div className="page-root animate-fade-up">
      <PageHeader
              title="首页"
              subtitle={sceneMeta.subtitle}
              actions={<Tag variant={sceneMeta.sceneVariant}>{sceneMeta.sceneLabel}</Tag>}
      />

      <InteractionRailLayout
        main={(
          <>
            <WorkflowOverviewCard
                          eyebrow="Admin Overview"
              title={sceneMeta.overviewTitle}
              description={summaryDescription}
                          badge={dashboardError ? <Tag variant="danger">Live Unavailable</Tag> : dashboardLoading ? <Tag variant="warning">Syncing</Tag> : <Tag variant="success">Live Snapshot</Tag>}
              metrics={[
                  { label: '在住长者', value: dashboardLoading ? '--' : liveManagedElders, hint: '来自 Admin BFF 聚合快照', tone: 'primary' },
                  { label: '租户数', value: dashboardLoading ? '--' : liveTenantCount, hint: '当前平台接入租户', tone: 'info' },
                  { label: '实时告警', value: dashboardLoading ? '--' : livePendingAlerts, hint: '待进入处理工作台', tone: livePendingAlerts > 0 ? 'warning' : 'success' },
                  { label: '流程待办', value: dashboardLoading ? '--' : liveWorkflowPendingCount, hint: '待复核与未分配计划聚合', tone: liveWorkflowPendingCount > 0 ? 'warning' : 'success' },
              ]}
              signals={[
                  { label: dashboardGeneratedAtLabel ? `快照时间：${dashboardGeneratedAtLabel}` : '等待首个实时快照', tone: dashboardGeneratedAtLabel ? 'success' : 'neutral' },
                  { label: dashboardError || '首页总览已切换到服务端聚合，不再回填本地任务、健康或设备计数。', tone: dashboardError ? 'danger' : 'neutral' },
                  { label: `认证来源：${platformState.authSource === 'platform' ? '平台认证' : 'Demo 认证'} · 租户：${platformState.tenantName}`, tone: platformState.authSource === 'platform' ? 'success' : 'info' },
              ]}
              actions={
                <>
                      <Link href={sceneMeta.primaryHref} className="btn btn-secondary btn-sm">{sceneMeta.primaryLabel}</Link>
                  <Link href={sceneMeta.secondaryHref} className="btn btn-secondary btn-sm">{sceneMeta.secondaryLabel}</Link>
                  <Link href={sceneMeta.tertiaryHref} className="btn btn-secondary btn-sm">{sceneMeta.tertiaryLabel}</Link>
                </>
              }
            />

                      <div className="kpi-grid" style={{ marginBottom: 16 }}>
                          <StatCard icon={<Home size={18} />} label="在住长者" value={dashboardLoading ? '--' : liveManagedElders} sub="实时聚合快照" color="primary" />
                          <StatCard icon={<ClipboardList size={18} />} label="流程待办" value={dashboardLoading ? '--' : liveWorkflowPendingCount} sub="待复核与待派发计划" color={liveWorkflowPendingCount > 0 ? 'warning' : 'success'} />
                          <StatCard icon={<AlertTriangle size={18} />} label="实时告警" value={dashboardLoading ? '--' : livePendingAlerts} sub="高优先级风险信号" color={livePendingAlerts > 0 ? 'danger' : 'success'} />
                          <StatCard icon={<Download size={18} />} label="通知待发" value={dashboardLoading ? '--' : liveQueuedNotifications} sub="需要送达的真实消息" color={liveQueuedNotifications > 0 ? 'info' : 'success'} />
            </div>

                      <DataCard title="今日优先动作" subtitle="首页不再展开本地明细，只保留当天最值得先处理的入口。" badge={<Tag variant="warning">Manager First</Tag>}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                {priorityActions.map(item => (
                  <HomeCommandCard key={item.title} {...item} />
                ))}
              </div>
            </DataCard>

                      <DataCard title="分流入口" subtitle="完成优先动作后，再按场景进入更细的业务专页。" badge={<Tag variant="info">Routing</Tag>}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                {routeEntries.map(item => (
                  <HomeCommandCard key={item.title} {...item} />
                ))}
              </div>
            </DataCard>

                      <DataCard title="快捷入口" subtitle="保留高频导航入口，但不再在首页承载这些页面的局部明细。">
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                {quickLinks.map(item => (
                    <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                        <div style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-card)', padding: 16, display: 'grid', gap: 10 }}>
                            <div className="avatar avatar-sm">{item.icon}</div>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.label}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
                <DataCard title="订阅模块" subtitle="当前租户已启用的 SaaS 模块。" badge={<Tag variant="info">Modules</Tag>}>
                    <div style={{ display: 'grid', gap: 10 }}>
                        {subscribedModules.map(module => (
                            <div key={module.module} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 12 }}>
                                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{module.label}</div>
                                <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.6, color: 'var(--color-muted)' }}>{module.description}</div>
                            </div>
                ))}
              </div>
            </DataCard>

                <DataCard title="数据口径" subtitle="首页数据来源和回滚口径。" badge={<Tag variant="info">Source</Tag>}>
                    <div style={{ display: 'grid', gap: 10 }}>
                        <div className="page-help-card-item">数据来源：Admin BFF dashboard overview 聚合快照。</div>
                        <div className="page-help-card-item">当前首页不再读取本地任务、健康趋势、设备告警或 admission workflow 计数。</div>
                        <div className="page-help-card-item">回滚路径：移除首页对 dashboard overview 的依赖并恢复旧入口式首页。</div>
              </div>
            </DataCard>

            <PageHelpCard
                    title="首页帮助"
                    subtitle="首页职责和下钻边界已迁移到显式帮助页。"
                    summary="首页现在只承接实时总览、优先动作和业务分流，不再混入局部 mock 明细、local snapshot 或 demo 数据。"
              items={[
                  '先看今日优先动作，再进入对应工作台。',
                  '需要对象级信息时，进入健康监测、老人详情、任务或通知专页。',
                  '经营草稿和导出动作统一回到分析中心。',
              ]}
                    href="/help"
              actionLabel="查看首页帮助"
            />
          </>
        )}
          />
    </div>
  )
}
