'use client'

import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard } from '@/components/nh'
import { getCareScene, withSceneQuery } from '@/lib/care-scenes'
import { fetchAdminDashboardOverview, type AdminDashboardMetricItem, type AdminDashboardOverviewResponse } from '@/lib/dashboard/admin-dashboard-api'
import { AlertTriangle, BellRing, ChevronRight, ClipboardList, ReceiptText, ShieldAlert, UserCheck, Users } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

type QueueVariant = 'danger' | 'warning' | 'info' | 'neutral'

type ContextVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

function getBreakdownValue(items: AdminDashboardMetricItem[] | undefined, label: string) {
  return items?.find(item => item.label === label)?.value ?? 0
}

interface OperationsEntryCardProps {
  title: string
  subtitle: string
  href?: string
  icon: ReactNode
  tag: string
  disabled?: boolean
}

function OperationsEntryCard({ title, subtitle, href, icon, tag, disabled = false }: OperationsEntryCardProps) {
  const content = (
    <>
      <div className="ops-entry-head">
        <div className="ops-entry-title-wrap">
          <div className="ops-entry-icon">{icon}</div>
          <div className="ops-entry-title">{title}</div>
        </div>
        <Tag variant={disabled ? 'warning' : 'neutral'}>{tag}</Tag>
      </div>
      <div className="ops-entry-subtitle">{subtitle}</div>
    </>
  )

  if (!href || disabled) {
    return (
      <div className="ops-entry-card" aria-disabled="true">
        {content}
      </div>
    )
  }

  return (
    <Link href={href} className="ops-entry-card">
      {content}
    </Link>
  )
}

interface FocusQueueCardProps {
  category: string
  title: string
  detail: string
  hint: string
  href: string
  variant: QueueVariant
  sourceLabel: string
  sourceVariant: ContextVariant
}

function FocusQueueCard({
  category,
  title,
  detail,
  hint,
  href,
  variant,
  sourceLabel,
  sourceVariant,
}: FocusQueueCardProps) {
  return (
    <div className="ops-focus-item">
      <div className="ops-focus-head">
        <div className="ops-focus-copy">
          <div className="ops-focus-title">{title}</div>
          <div className="ops-focus-detail">{category} · {detail}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Tag variant={variant}>{category}</Tag>
          <Tag variant={sourceVariant}>{sourceLabel}</Tag>
        </div>
      </div>
      <div className="ops-focus-hint">{hint}</div>
      <div className="ops-focus-actions">
        <Link href={href} className="btn btn-ghost btn-sm">进入处理 <ChevronRight size={12} /></Link>
      </div>
    </div>
  )
}

export default function DailyOperationsPage() {
  const searchParams = useSearchParams()
  const scene = getCareScene(searchParams.get('scene'))
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
        setDashboardError(error instanceof Error ? error.message : '日班工作台总览读取失败。')
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

  const sceneMeta = scene === 'home'
    ? {
      title: '居家日班工作台',
      subtitle: '把居家风险、待办闭环和真实运营入口收敛到同一入口。',
      description: '班次入口当前按居家养老视角组织，先判断告警、待办和协同压力，再进入真实处理页。',
    }
    : scene === 'institutional'
      ? {
        title: '机构日班工作台',
        subtitle: '把院内风险、待办闭环和真实运营入口收敛到同一入口。',
        description: '班次入口当前按机构养老视角组织，先判断院内告警、待办和协同压力，再进入真实处理页。',
      }
      : {
        title: '日班运营工作台',
        subtitle: '把告警、待办闭环和真实运营入口收敛到同一入口，先定优先级再下钻。',
        description: '日班工作台只保留 live aggregate、优先队列和真实入口，不再把本地事故、活动与资源假数混进首屏。',
      }

  const hasDashboardSnapshot = dashboardOverview !== null && !dashboardError
  const livePendingAlerts = dashboardOverview?.kpis.pendingAlerts ?? 0
  const liveWorkflowPendingCount = dashboardOverview?.kpis.workflowPendingCount ?? 0
  const liveQueuedNotifications = getBreakdownValue(dashboardOverview?.notificationBreakdown, '待发送')
  const liveFinanceActionRequired = getBreakdownValue(dashboardOverview?.financeBreakdown, '动作必做')
  const livePendingReviewPlans = getBreakdownValue(dashboardOverview?.workflowBreakdown, '待复核计划')
  const liveUnassignedPlans = getBreakdownValue(dashboardOverview?.workflowBreakdown, '未分配计划')
  const liveCompletedTasks = getBreakdownValue(dashboardOverview?.workflowBreakdown, '已完成任务')
  const liveTopAlertModule = dashboardOverview?.alertModules[0] ?? null
  const liveSecondAlertModule = dashboardOverview?.alertModules[1] ?? null
  const topStaff = dashboardOverview?.staffLeaderboard[0] ?? null
  const secondStaff = dashboardOverview?.staffLeaderboard[1] ?? null
  const dashboardGeneratedAtLabel = dashboardOverview
    ? new Date(dashboardOverview.generatedAtUtc).toLocaleString('zh-CN', {
      hour12: false,
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : ''
  const dashboardStatusVariant = dashboardError ? 'danger' as const : dashboardLoading ? 'warning' as const : 'success' as const
  const dashboardStatusLabel = dashboardError ? 'Live Unavailable' : dashboardLoading ? 'Syncing' : 'Live Snapshot'

  const dataSourceCards = [
    {
      title: 'Dashboard Aggregate',
      variant: dashboardStatusVariant,
      label: dashboardStatusLabel,
      detail: dashboardLoading
        ? '工作台首屏总览正在同步 aggregate 快照。'
        : dashboardError
          ? `工作台 aggregate 当前不可达：${dashboardError}`
          : `首屏 KPI 与总览数字已来自 ${dashboardGeneratedAtLabel} 的 aggregate 快照。`,
    },
    {
      title: '工作流摘要',
      variant: dashboardStatusVariant,
      label: dashboardStatusLabel,
      detail: dashboardLoading
        ? '待复核计划、未分配计划和完成任务正在同步 aggregate 摘要。'
        : dashboardError
          ? '工作流摘要当前不可达，页面不会回退 demo workflow。'
          : `当前待复核 ${livePendingReviewPlans}，未分配 ${liveUnassignedPlans}，已完成 ${liveCompletedTasks}。`,
    },
    {
      title: '待接通模块',
      variant: 'warning' as const,
      label: 'Pending Integration',
      detail: '事故、活动、房间、物资和人员读模型尚未接入后端，本页不再展示这些模块的本地统计。',
    },
  ]

  const focusQueue = useMemo(() => {
    const queue = []

    if (liveTopAlertModule) {
      queue.push({
        id: `alert-${liveTopAlertModule.label}`,
        category: '告警中心',
        title: `${liveTopAlertModule.label} 待优先收口`,
        detail: `待处理 ${liveTopAlertModule.totalOpen} 条 · 严重 ${liveTopAlertModule.critical} 条`,
        hint: '优先确认到场响应与处理中事件，避免关键告警滞留。',
        href: withSceneQuery('/alerts', scene),
        variant: liveTopAlertModule.critical > 0 ? 'danger' as const : 'warning' as const,
        sourceLabel: dashboardStatusLabel,
        sourceVariant: dashboardStatusVariant,
      })
    }

    if (liveWorkflowPendingCount > 0) {
      queue.push({
        id: 'workflow-pending',
        category: '工作流待办',
        title: '待复核与未分配计划需要优先闭环',
        detail: `待复核 ${livePendingReviewPlans} · 未分配 ${liveUnassignedPlans}`,
        hint: '先进入任务页核对认定和分派阻塞，再决定是否扩散到其它模块。',
        href: withSceneQuery('/staff/tasks', scene),
        variant: liveWorkflowPendingCount > 0 ? 'warning' as const : 'info' as const,
        sourceLabel: dashboardStatusLabel,
        sourceVariant: dashboardStatusVariant,
      })
    }

    if (liveQueuedNotifications > 0) {
      queue.push({
        id: 'notification-queued',
        category: '通知中心',
        title: '仍有通知待发送，需要确认交付闭环',
        detail: `待发送 ${liveQueuedNotifications} 条`,
        hint: '优先确认关键通知是否因队列阻塞而影响当班闭环。',
        href: withSceneQuery('/notifications', scene),
        variant: liveQueuedNotifications > 0 ? 'info' as const : 'neutral' as const,
        sourceLabel: dashboardStatusLabel,
        sourceVariant: dashboardStatusVariant,
      })
    }

    if (liveFinanceActionRequired > 0) {
      queue.push({
        id: 'finance-required',
        category: '财务动作',
        title: '财务动作必做项需要跟进',
        detail: `动作必做 ${liveFinanceActionRequired} 项`,
        hint: '先确认是否存在会影响当班交付的逾期或待复核账单。',
        href: withSceneQuery('/financial', scene),
        variant: liveFinanceActionRequired > 0 ? 'warning' as const : 'neutral' as const,
        sourceLabel: dashboardStatusLabel,
        sourceVariant: dashboardStatusVariant,
      })
    }

    if (liveSecondAlertModule) {
      queue.push({
        id: `alert-${liveSecondAlertModule.label}`,
        category: '次级告警',
        title: `${liveSecondAlertModule.label} 需要继续观察`,
        detail: `待处理 ${liveSecondAlertModule.totalOpen} 条`,
        hint: '在主告警队列收口后，再回看次级模块是否需要升级。',
        href: withSceneQuery('/alerts', scene),
        variant: 'info' as const,
        sourceLabel: dashboardStatusLabel,
        sourceVariant: dashboardStatusVariant,
      })
    }

    return queue.slice(0, 5)
  }, [dashboardStatusLabel, dashboardStatusVariant, liveFinanceActionRequired, livePendingReviewPlans, liveQueuedNotifications, liveSecondAlertModule, liveTopAlertModule, liveUnassignedPlans, liveWorkflowPendingCount, scene])

  const operationEntries = [
    { title: '实时告警', subtitle: hasDashboardSnapshot ? `${livePendingAlerts} 条待闭环` : '等待 aggregate 同步', href: withSceneQuery('/alerts', scene), icon: <AlertTriangle size={16} />, tag: '告警' },
    { title: '现场任务', subtitle: hasDashboardSnapshot ? `${liveWorkflowPendingCount} 项待闭环` : '等待 aggregate 同步', href: withSceneQuery('/staff/tasks', scene), icon: <ClipboardList size={16} />, tag: '任务' },
    { title: '排班承接', subtitle: topStaff ? `${topStaff.name} 完成率 ${topStaff.completionRate}%` : '查看排班覆盖摘要', href: withSceneQuery('/staff/schedule', scene), icon: <UserCheck size={16} />, tag: '排班' },
    { title: '通知中心', subtitle: hasDashboardSnapshot ? `${liveQueuedNotifications} 条待发送` : '等待 aggregate 同步', href: withSceneQuery('/notifications', scene), icon: <BellRing size={16} />, tag: '通知' },
    { title: '财务动作', subtitle: hasDashboardSnapshot ? `${liveFinanceActionRequired} 项必做` : '等待 aggregate 同步', href: withSceneQuery('/financial', scene), icon: <ReceiptText size={16} />, tag: '财务' },
    { title: '老人主档', subtitle: hasDashboardSnapshot ? `${dashboardOverview?.kpis.elderCount ?? 0} 位在管对象` : '等待 aggregate 同步', href: withSceneQuery('/elderly', scene), icon: <Users size={16} />, tag: '主档' },
    { title: '事故处置', subtitle: '真实读模型待接通，本页不再展示本地事故数', icon: <ShieldAlert size={16} />, tag: '待接通', disabled: true },
    { title: '活动与资源', subtitle: '活动、房间、物资、人员读模型待接通', icon: <ShieldAlert size={16} />, tag: '待接通', disabled: true },
  ]

  const supportSignals = [
    {
      label: '优先人员',
      value: topStaff ? `${topStaff.name} · ${topStaff.role}` : '等待 aggregate 同步',
      hint: topStaff ? `当前任务 ${topStaff.tasks}，完成 ${topStaff.completed}` : '当前只展示 aggregate 返回的人员摘要。',
    },
    {
      label: '次优人员',
      value: secondStaff ? `${secondStaff.name} · ${secondStaff.role}` : '等待 aggregate 同步',
      hint: secondStaff ? `当前任务 ${secondStaff.tasks}，完成率 ${secondStaff.completionRate}%` : '若 aggregate 未返回足够人员数据，则不补本地人员台账。',
    },
    {
      label: '待接通模块',
      value: '事故 / 活动 / 房间 / 物资 / 人员',
      hint: '这些读模型尚未完成真实化，本页已停止展示对应本地统计。',
    },
  ]

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={sceneMeta.title}
        subtitle={sceneMeta.subtitle}
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href={withSceneQuery('/', scene)} className="btn btn-secondary btn-sm">返回首页</Link>
            <Link href={withSceneQuery('/alerts', scene)} className="btn btn-primary btn-sm">先看实时告警</Link>
          </div>
        }
      />

      <InteractionRailLayout
        main={(
          <>
            <WorkflowOverviewCard
              eyebrow="Daily Operations"
              title="当班收口总览"
              description={
                <>
                  <div>{sceneMeta.description}</div>
                  <div style={{ marginTop: 6 }}>首屏总览只读取 dashboard aggregate；尚未真实化的事故、活动和资源模块统一后置标记为待接通。</div>
                </>
              }
              badge={
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Tag variant="primary">Shift Control</Tag>
                  <Tag variant={dashboardStatusVariant}>{dashboardStatusLabel}</Tag>
                </div>
              }
              metrics={[
                {
                  label: '告警待闭环',
                  value: hasDashboardSnapshot ? livePendingAlerts : '--',
                  hint: dashboardLoading ? 'dashboard aggregate 同步中' : dashboardError ? 'aggregate 不可达，页面未回退本地假数' : `aggregate 快照 ${dashboardGeneratedAtLabel}`,
                  tone: dashboardLoading ? 'warning' : dashboardError ? 'danger' : livePendingAlerts > 0 ? 'danger' : 'success',
                },
                {
                  label: '工作流待办',
                  value: hasDashboardSnapshot ? liveWorkflowPendingCount : '--',
                  hint: dashboardLoading ? '待复核与未分派同步中' : dashboardError ? '工作流 aggregate 未就绪' : '待复核与未分派计划总和',
                  tone: dashboardLoading ? 'warning' : dashboardError ? 'danger' : liveWorkflowPendingCount > 0 ? 'warning' : 'success',
                },
                { label: '通知待发送', value: hasDashboardSnapshot ? liveQueuedNotifications : '--', hint: dashboardLoading ? '通知摘要同步中' : dashboardError ? '通知 aggregate 未就绪' : 'Notification 摘要', tone: dashboardLoading ? 'warning' : dashboardError ? 'danger' : liveQueuedNotifications > 0 ? 'info' : 'success' },
                { label: '财务必做', value: hasDashboardSnapshot ? liveFinanceActionRequired : '--', hint: dashboardLoading ? '财务摘要同步中' : dashboardError ? '财务 aggregate 未就绪' : 'Billing 摘要', tone: dashboardLoading ? 'warning' : dashboardError ? 'danger' : liveFinanceActionRequired > 0 ? 'warning' : 'success' },
              ]}
              signals={[
                { label: dashboardLoading ? '日班工作台 aggregate 正在同步' : dashboardError ? `日班工作台 aggregate 不可达：${dashboardError}` : `工作台 aggregate 已更新：${dashboardGeneratedAtLabel}`, tone: dashboardLoading ? 'warning' : dashboardError ? 'danger' : 'success' },
                { label: hasDashboardSnapshot ? `工作流摘要：待复核 ${livePendingReviewPlans}，未分配 ${liveUnassignedPlans}，已完成 ${liveCompletedTasks}` : '工作流摘要等待 aggregate 同步', tone: dashboardLoading ? 'warning' : dashboardError ? 'danger' : 'success' },
                { label: '事故、活动、房间、物资与人员读模型尚未接通，本页不再展示本地统计。', tone: 'neutral' },
              ]}
              actions={
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Link href={withSceneQuery('/alerts', scene)} className="btn btn-secondary btn-sm">先看实时告警</Link>
                  <Link href={withSceneQuery('/staff/tasks', scene)} className="btn btn-secondary btn-sm">进入评定任务</Link>
                  <Link href={withSceneQuery('/notifications', scene)} className="btn btn-secondary btn-sm">查看通知队列</Link>
                </div>
              }
            />

            <div className="kpi-grid" style={{ marginBottom: 16 }}>
              <StatCard icon={<AlertTriangle size={18} />} label="告警待闭环" value={hasDashboardSnapshot ? livePendingAlerts : '--'} sub={dashboardLoading ? 'Syncing' : dashboardError ? 'Live Unavailable' : 'Live Snapshot'} color="danger" />
              <StatCard icon={<ClipboardList size={18} />} label="工作流待办" value={hasDashboardSnapshot ? liveWorkflowPendingCount : '--'} sub={dashboardLoading ? '待复核与未分派同步中' : dashboardError ? 'Aggregate Unavailable' : `待复核 ${livePendingReviewPlans} · 未分配 ${liveUnassignedPlans}`} color="info" />
              <StatCard icon={<BellRing size={18} />} label="通知待发送" value={hasDashboardSnapshot ? liveQueuedNotifications : '--'} sub={dashboardLoading ? 'Syncing' : dashboardError ? 'Aggregate Unavailable' : 'Notification Summary'} color="warning" />
              <StatCard icon={<ReceiptText size={18} />} label="财务动作必做" value={hasDashboardSnapshot ? liveFinanceActionRequired : '--'} sub={dashboardLoading ? 'Syncing' : dashboardError ? 'Aggregate Unavailable' : 'Billing Summary'} color="primary" />
            </div>

            <DataCard
              icon={<ShieldAlert size={16} />}
              title="班次优先队列"
              subtitle="按先处置风险、再推动待办、最后检查通知与财务闭环的顺序聚合。"
              badge={<Tag variant="warning">Shift Queue</Tag>}
            >
              <div className="ops-focus-list">
                {focusQueue.map(item => (
                  <FocusQueueCard key={item.id} {...item} />
                ))}
                {focusQueue.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>当前 aggregate 尚未返回可排序的优先队列，保留工作台结构但不回退本地假数。</div>
                ) : null}
              </div>
            </DataCard>

            <DataCard
              icon={<ChevronRight size={16} />}
              title="统一运营入口"
              subtitle="先决定去哪处理，再进入对应专页；未接通模块只显示状态说明，不再展示本地数量。"
              badge={<Tag variant="info">Entry Board</Tag>}
            >
              <div className="ops-entry-grid">
                {operationEntries.map(item => (
                  <OperationsEntryCard key={item.title} {...item} />
                ))}
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard
              title="值班上下文"
              subtitle="把来源边界和资源补位信号收敛到后置上下文区。"
              badge={<Tag variant="info">Shift Context</Tag>}
            >
              <div className="home-context-stack">
                <div>
                  <div className="ops-context-section-title">来源状态</div>
                  <div className="ops-context-grid">
                    {dataSourceCards.map(item => (
                      <div key={item.title} className="home-context-item">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                          <div className="home-context-title">{item.title}</div>
                          <Tag variant={item.variant}>{item.label}</Tag>
                        </div>
                        <div className="home-context-description">{item.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="ops-context-section-title">资源补位信号</div>
                  <div className="ops-support-list">
                    {supportSignals.map(item => (
                      <div key={item.label} className="ops-support-item">
                        <div className="home-context-title">{item.label}</div>
                        <div className="ops-support-value">{item.value}</div>
                        <div className="home-context-description">{item.hint}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整说明迁到帮助页"
              summary="日班工作台首屏只保留 live aggregate、优先队列和真实入口；来源边界与待接通模块说明统一压到后置上下文区。"
              items={[
                '先看告警和工作流待办，再进入通知与财务闭环。',
                '当班判断先以 aggregate 状态为准。',
                '未接通模块不会再显示本地假数。',
              ]}
              href="/operations/daily/help"
              actionLabel="查看日班工作台帮助"
            />
          </>
        )}
      />
    </div>
  )
}
