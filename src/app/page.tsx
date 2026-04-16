'use client'

import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard } from '@/components/nh'
import { getCareScene, withSceneQuery } from '@/lib/care-scenes'
import { fetchAdminDashboardOverview, type AdminDashboardMetricItem, type AdminDashboardOverviewResponse } from '@/lib/dashboard/admin-dashboard-api'
import { equipmentAlarms } from '@/lib/data'
import { getAdmissionApplicationsSnapshot, subscribeAdmissionWorkflow } from '@/lib/mock/admission-workflow'
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
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'

const todayTasks = [
  { id: 'T001', elderly: '张秀英', type: '用药提醒', status: '已完成' },
  { id: 'T002', elderly: '王建国', type: '血压测量', status: '进行中' },
  { id: 'T003', elderly: '李淑芳', type: '翻身护理', status: '待执行' },
  { id: 'T004', elderly: '赵德明', type: '康复训练', status: '待执行' },
  { id: 'T005', elderly: '张秀英', type: '午餐协助', status: '待执行' },
  { id: 'T006', elderly: '王建国', type: '下午茶', status: '待执行' },
]

const healthBrief = [
  { id: 'E001', trend: 'up' as const },
  { id: 'E002', trend: 'stable' as const },
  { id: 'E003', trend: 'up' as const },
]

const quickLinks = [
  { icon: <CalendarHeart size={18} />, label: '活动管理', href: '/activities' },
  { icon: <DoorOpen size={18} />, label: '房间管理', href: '/rooms' },
  { icon: <Users size={18} />, label: '员工列表', href: '/staff' },
  { icon: <AlertTriangle size={18} />, label: '事故报告', href: '/incidents' },
  { icon: <DollarSign size={18} />, label: '财务收支', href: '/financial' },
  { icon: <Stethoscope size={18} />, label: '医疗设备', href: '/devices' },
]

const pendingAlarms = equipmentAlarms.filter(alarm => alarm.status === '待处理').length
const pendingTasks = todayTasks.filter(task => task.status !== '已完成').length
const healthAttentionCount = healthBrief.filter(item => item.trend === 'up').length

function getBreakdownValue(items: AdminDashboardMetricItem[] | undefined, label: string) {
  return items?.find(item => item.label === label)?.value ?? 0
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

  const applications = useSyncExternalStore(
    subscribeAdmissionWorkflow,
    getAdmissionApplicationsSnapshot,
    getAdmissionApplicationsSnapshot,
  )

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
        if (cancelled) {
          return
        }

        setDashboardLoading(false)
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
  const pendingConfirmations = applications.filter(item => item.status === '待人工确认').length
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

  const liveManagedElders = dashboardOverview?.kpis.elderCount
  const liveTenantCount = dashboardOverview?.kpis.tenantCount
  const livePendingAlerts = dashboardOverview?.kpis.pendingAlerts
  const liveWorkflowPendingCount = dashboardOverview?.kpis.workflowPendingCount
  const liveFinanceActionRequired = getBreakdownValue(dashboardOverview?.financeBreakdown, '动作必做')
  const liveQueuedNotifications = getBreakdownValue(dashboardOverview?.notificationBreakdown, '待发送')
  const dashboardGeneratedAtLabel = dashboardOverview
    ? new Date(dashboardOverview.generatedAtUtc).toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : ''

  const liveSummaryBadge = dashboardError
    ? <Tag variant="danger">Live Unavailable</Tag>
    : dashboardLoading
      ? <Tag variant="warning">Syncing</Tag>
      : <Tag variant="success">Live Snapshot</Tag>

  const liveSummaryValue = (value: number | undefined) => {
    if (dashboardLoading) {
      return '--'
    }

    if (dashboardError) {
      return '不可用'
    }

    return value ?? 0
  }

  const liveSummaryPendingTotal = (livePendingAlerts ?? 0) + (liveWorkflowPendingCount ?? 0)
  const summaryDescription = dashboardError
    ? `${sceneMeta.overviewDescription} 当前服务端聚合不可用，但入口和分流路径保持可用。`
    : `${sceneMeta.overviewDescription} 首页第一屏 KPI 已切到服务端聚合快照。`

  const priorityActions = [
    {
      title: '日班运营收口',
      description: '先把告警、事故、活动和资源补位收进同一入口，再决定当班优先顺序。',
      badge: <Tag variant="primary">Manager First</Tag>,
      accent: 'var(--color-primary)',
      primaryHref: withSceneQuery('/operations/daily', scene),
      primaryLabel: '进入工作台',
    },
    {
      title: '设备告警闭环',
      description: pendingAlarms > 0
        ? `当前仍有 ${pendingAlarms} 条设备告警待处理，优先避免监测和呼叫链路受影响。`
        : '当前没有待处理设备告警，可以把注意力切回认定和排班。',
      badge: <Tag variant={pendingAlarms > 0 ? 'danger' : 'success'}>{pendingAlarms > 0 ? '待处理' : '当前稳定'}</Tag>,
      accent: pendingAlarms > 0 ? 'var(--color-danger)' : 'var(--color-success)',
      primaryHref: '/alerts',
      primaryLabel: '查看告警',
      secondaryHref: '/devices/realtime',
      secondaryLabel: '设备监控',
    },
    {
      title: '评估认定复核',
      description: pendingConfirmations > 0
        ? `${pendingConfirmations} 条评估申请待人工确认，建议在结算和任务派生前先完成复核。`
        : '当前没有待人工确认的评估申请，可按常规节奏继续巡检。',
      badge: <Tag variant={pendingConfirmations > 0 ? 'warning' : 'success'}>{pendingConfirmations > 0 ? '待复核' : '已收口'}</Tag>,
      accent: pendingConfirmations > 0 ? 'var(--color-warning)' : 'var(--color-success)',
      primaryHref: withSceneQuery('/elderly/checkin', scene),
      primaryLabel: '进入认定',
    },
    {
      title: '护理执行闭环',
      description: pendingTasks > 0
        ? `今日护理任务还有 ${pendingTasks} 项未闭环，首页不再展开任务表，只保留下钻入口。`
        : '今日护理任务已全部闭环，可将时间转入复盘和经营动作。',
      badge: <Tag variant={pendingTasks > 0 ? 'warning' : 'success'}>{pendingTasks > 0 ? '待闭环' : '已闭环'}</Tag>,
      accent: pendingTasks > 0 ? 'var(--color-primary)' : 'var(--color-success)',
      primaryHref: withSceneQuery('/staff/tasks', scene),
      primaryLabel: '查看任务',
      secondaryHref: withSceneQuery('/staff/schedule', scene),
      secondaryLabel: '查看排班',
    },
  ]

  const routeEntries = [
    {
      title: '护理任务专页',
      description: `今日共有 ${todayTasks.length} 项护理任务，未闭环 ${pendingTasks} 项。首页只提示压力，不再展开明细表。`,
      badge: <Tag variant={pendingTasks > 0 ? 'warning' : 'success'}>{pendingTasks > 0 ? '待处理' : '已收口'}</Tag>,
      accent: 'var(--color-primary)',
      primaryHref: withSceneQuery('/staff/tasks', scene),
      primaryLabel: '进入任务专页',
      secondaryHref: withSceneQuery('/staff/schedule', scene),
      secondaryLabel: '查看排班',
    },
    {
      title: '健康监测专页',
      description: `当前重点关注 ${healthAttentionCount} 名老人，趋势观察和对象详情统一退回健康监测与老人详情页。`,
      badge: <Tag variant={healthAttentionCount > 0 ? 'warning' : 'success'}>{healthAttentionCount > 0 ? '重点关注' : '当前稳定'}</Tag>,
      accent: healthAttentionCount > 0 ? 'var(--color-warning)' : 'var(--color-success)',
      primaryHref: withSceneQuery('/health-monitoring', scene),
      primaryLabel: '进入健康监测',
      secondaryHref: '/elderly',
      secondaryLabel: '查看老人详情',
    },
    {
      title: '财务与通知专页',
      description: dashboardError
        ? '聚合失败时不在首页回填分析块，财务和通知状态请直接进入专页核实。'
        : `当前仍有 ${liveFinanceActionRequired} 项财务动作必做、${liveQueuedNotifications} 条通知待发送，建议在优先动作后处理。`,
      badge: <Tag variant={dashboardError || liveFinanceActionRequired > 0 || liveQueuedNotifications > 0 ? 'warning' : 'success'}>{dashboardError || liveFinanceActionRequired > 0 || liveQueuedNotifications > 0 ? '需跟进' : '当前稳定'}</Tag>,
      accent: dashboardError ? 'var(--color-danger)' : 'var(--color-info)',
      primaryHref: withSceneQuery('/financial', scene),
      primaryLabel: '进入财务专页',
      secondaryHref: '/notifications',
      secondaryLabel: '查看通知队列',
    },
  ]

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="欢迎回来"
        subtitle={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className="status-dot success" />
            {sceneMeta.subtitle} · 当前套餐 {platformState.tenantPlan}
          </span>
        }
        actions={
          <button className="btn btn-secondary btn-sm">
            <Download size={13} />导出快照
          </button>
        }
      />

      <InteractionRailLayout
        main={(
          <>
            <WorkflowOverviewCard
              eyebrow="Fluent Home Pilot"
              title={sceneMeta.overviewTitle}
              description={summaryDescription}
              badge={liveSummaryBadge}
              metrics={[
                {
                  label: '今日待处理事项',
                  value: liveSummaryValue(liveSummaryPendingTotal),
                  hint: dashboardError ? '服务端聚合不可用' : `告警 ${livePendingAlerts ?? 0} 条 · workflow ${liveWorkflowPendingCount ?? 0} 项`,
                  tone: dashboardError ? 'danger' : liveSummaryPendingTotal > 0 ? 'warning' : 'success',
                },
                {
                  label: '待认定确认',
                  value: pendingConfirmations,
                  hint: '需继续人工复核的评估申请',
                  tone: pendingConfirmations > 0 ? 'warning' : 'success',
                },
                {
                  label: '在管长者',
                  value: liveSummaryValue(liveManagedElders),
                  hint: dashboardError ? '服务端聚合不可用' : '来自 Admin BFF 聚合快照',
                  tone: dashboardError ? 'danger' : 'info',
                },
                {
                  label: '服务租户',
                  value: liveSummaryValue(liveTenantCount),
                  hint: dashboardError ? '服务端聚合不可用' : '当前接入的后端租户数',
                  tone: dashboardError ? 'danger' : 'info',
                },
              ]}
              signals={[
                {
                  label: dashboardLoading ? '首页总览聚合同步中' : dashboardError ? `首页总览聚合失败：${dashboardError}` : `聚合快照已更新：${dashboardGeneratedAtLabel}`,
                  tone: dashboardLoading ? 'warning' : dashboardError ? 'danger' : 'success',
                },
                {
                  label: dashboardError ? '当前无法确认设备告警聚合' : (livePendingAlerts ?? 0) > 0 ? `设备待处理告警 ${livePendingAlerts ?? 0} 条` : '当前无待处理设备告警',
                  tone: dashboardError ? 'danger' : (livePendingAlerts ?? 0) > 0 ? 'danger' : 'success',
                },
                {
                  label: dashboardError ? '当前无法确认工作流待办聚合' : (liveWorkflowPendingCount ?? 0) > 0 ? `工作流仍有 ${liveWorkflowPendingCount ?? 0} 项待办` : '当前无工作流积压',
                  tone: dashboardError ? 'danger' : (liveWorkflowPendingCount ?? 0) > 0 ? 'warning' : 'success',
                },
              ]}
              actions={
                <>
                  <Link href={sceneMeta.primaryHref} className="btn btn-primary btn-sm">{sceneMeta.primaryLabel}</Link>
                  <Link href={sceneMeta.secondaryHref} className="btn btn-secondary btn-sm">{sceneMeta.secondaryLabel}</Link>
                  <Link href={sceneMeta.tertiaryHref} className="btn btn-secondary btn-sm">{sceneMeta.tertiaryLabel}</Link>
                </>
              }
            />

            <div className="kpi-grid">
              <StatCard icon={<Users size={20} />} label="在管长者" value={liveSummaryValue(liveManagedElders)} sub={dashboardError ? '服务端聚合不可用' : '聚合快照'} color="primary" />
              <StatCard icon={<Home size={20} />} label="服务租户" value={liveSummaryValue(liveTenantCount)} sub={dashboardError ? '服务端聚合不可用' : '后端租户聚合'} color="success" />
              <StatCard icon={<AlertTriangle size={20} />} label="告警待处理" value={liveSummaryValue(livePendingAlerts)} sub={dashboardError ? '服务端聚合不可用' : '实时聚合'} color="danger" />
              <StatCard icon={<ClipboardList size={20} />} label="工作流待办" value={liveSummaryValue(liveWorkflowPendingCount)} sub={dashboardError ? '服务端聚合不可用' : '计划与派案聚合'} color="warning" />
            </div>

            <DataCard
              icon={<AlertTriangle size={16} />}
              title="今日优先动作"
              subtitle="首页只保留需要先决定去向的动作卡，不再混入分析型块。"
              badge={<Tag variant="warning">Manager First</Tag>}
            >
              <div className="home-command-grid">
                {priorityActions.map(item => (
                  <HomeCommandCard key={item.title} {...item} />
                ))}
              </div>
            </DataCard>

            <DataCard
              icon={<ClipboardList size={16} />}
              title="执行与复核入口"
              subtitle="首页只保留必要摘要，具体执行、趋势和复盘统一退回专页处理。"
              badge={<Tag variant="info">Route Split</Tag>}
            >
              <div className="home-command-grid home-command-grid-compact">
                {routeEntries.map(item => (
                  <HomeCommandCard key={item.title} {...item} />
                ))}
              </div>
            </DataCard>

            <DataCard title="快速入口" subtitle="把首页仍需保留的高频导航收敛为一组轻量入口。">
              <div className="quick-links-grid">
                {quickLinks.map(item => (
                  <Link key={item.href} href={item.href === '/financial' || item.href === '/staff' ? withSceneQuery(item.href, scene) : item.href} style={{ textDecoration: 'none' }}>
                    <div className="quick-link-item">
                      <div className="quick-link-icon">{item.icon}</div>
                      <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{item.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard
              icon={<Home size={16} />}
              title="当前视角与来源"
              subtitle="上下文区只保留场景切换、快照状态和关键来源说明。"
              badge={<Tag variant={sceneMeta.sceneVariant}>{sceneMeta.sceneLabel}</Tag>}
            >
              <div className="home-context-stack">
                <div className="home-command-grid home-command-grid-compact">
                  <HomeCommandCard
                    title="机构养老入口"
                    description="从首页直接进入院内认定、执行、打卡和房间承接链路。"
                    badge={<Tag variant="primary">机构养老</Tag>}
                    accent="var(--color-primary)"
                    primaryHref="/?scene=institutional"
                    primaryLabel="切到该视角"
                    secondaryHref="/operations/daily?scene=institutional"
                    secondaryLabel="进入工作台"
                  />
                  <HomeCommandCard
                    title="居家养老入口"
                    description="从首页直接进入居家评定、派案、回执和监管链路。"
                    badge={<Tag variant="warning">居家养老</Tag>}
                    accent="var(--color-warning)"
                    primaryHref="/?scene=home"
                    primaryLabel="切到该视角"
                    secondaryHref="/operations/daily?scene=home"
                    secondaryLabel="进入工作台"
                  />
                </div>

                <div className="home-context-list">
                  <div className="home-context-item">
                    <div className="home-context-title">快照来源</div>
                    <div className="home-context-description">
                      {dashboardLoading ? '首页总览正在同步 Admin BFF 聚合。' : dashboardError ? '聚合失败时首页只保留入口和错误状态，不回退到分析型假数据。' : `当前快照更新时间为 ${dashboardGeneratedAtLabel}。`}
                    </div>
                  </div>
                  <div className="home-context-item">
                    <div className="home-context-title">财务与通知压力</div>
                    <div className="home-context-description">
                      {dashboardError ? '请直接进入财务与通知专页核实实时状态。' : `财务动作必做 ${liveFinanceActionRequired} 项，通知待发送 ${liveQueuedNotifications} 条。`}
                    </div>
                  </div>
                </div>
              </div>
            </DataCard>

            <DataCard
              icon={<DollarSign size={16} />}
              title="租户与模块"
              subtitle={`当前租户 ${platformState.tenantName} 已开通 ${subscribedModules.length} 个业务模块。`}
              badge={<Tag variant={platformState.runtimeFlags.moduleBillingEnabled ? 'success' : 'info'}>{platformState.runtimeFlags.moduleBillingEnabled ? 'Module Billing' : 'Tenant Package'}</Tag>}
            >
              <div className="home-module-pills">
                {subscribedModules.map(item => (
                  <Link key={item.module} href={item.entryHref === '/financial' ? withSceneQuery(item.entryHref, scene) : item.entryHref} className="home-module-pill">
                    <span className="home-module-pill-title">{item.label}</span>
                    <span className="home-module-pill-meta">{item.billingUnit}</span>
                  </Link>
                ))}
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整说明迁到帮助页"
              summary="首页现在只保留总览、优先动作、专页入口和轻量上下文；AI 摘要、趋势图和分析型块已经移出首页。"
              items={[
                '先看总览卡，确认是否存在告警或认定积压。',
                '再看今日优先动作，决定进入哪个工作台或专页。',
                '上下文区只保留视角切换、来源状态和模块可见性。',
              ]}
              href="/help/home"
              actionLabel="查看首页帮助"
            />
          </>
        )}
      />

      <div className="dashboard-footer">
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          最后更新: {today.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          &nbsp;· 数据来源: 养老院管理系统 v2.0
        </p>
      </div>
    </div>
  )
}
