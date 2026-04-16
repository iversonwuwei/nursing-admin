'use client'

import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard } from '@/components/nh'
import { getCareScene, matchesAdmissionScene, matchesEmploymentScene, withSceneQuery } from '@/lib/care-scenes'
import { fetchAdminDashboardOverview, type AdminDashboardMetricItem, type AdminDashboardOverviewResponse } from '@/lib/dashboard/admin-dashboard-api'
import { alertRecords } from '@/lib/data/alerts-data'
import { getAdmissionApplicationsSnapshot, getStaffTaskItems, subscribeAdmissionWorkflow } from '@/lib/mock/assessment-workflow'
import { getMasterDataSnapshot, subscribeMasterDataWorkflow } from '@/lib/mock/master-data-workflow'
import { getNursingServiceSnapshot, isNursingWorkflowDemoMode, subscribeNursingServiceWorkflow } from '@/lib/mock/nursing-service-workflow'
import { getOperationsSnapshot, OPERATIONS_TODAY, subscribeOperationsWorkflow } from '@/lib/mock/operations-workflow'
import { getResourceSnapshot, subscribeResourceWorkflow } from '@/lib/mock/resource-workflow'
import { sortActivitiesByPriority, sortAlertsByPriority, sortIncidentsByPriority } from '@/lib/operations-priority'
import { sortRoomsByPriority, sortStaffByPriority, sortSuppliesByPriority } from '@/lib/resource-operations-priority'
import { AlertTriangle, CalendarHeart, ChevronRight, ClipboardList, DoorOpen, Monitor, Package, ShieldAlert, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'

type DailyTaskItem = {
  id: string
  title: string
  elderlyName: string
  room: string
  status: string
  priority: '高' | '中' | '常规'
  scheduledTime: string
  href: string
  hint: string
  origin: '评定任务' | '服务计划'
}

type QueueVariant = 'danger' | 'warning' | 'info' | 'neutral'

type ContextVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

function getDailyTaskScore(task: DailyTaskItem) {
  if (task.status === '执行中') return 0
  if (task.priority === '高') return 1
  if (task.status === '待执行' || task.status === '已生成') return 2
  return 3
}

function sortDailyTasks(tasks: DailyTaskItem[]) {
  return [...tasks].sort((left, right) => {
    const scoreDiff = getDailyTaskScore(left) - getDailyTaskScore(right)
    if (scoreDiff !== 0) return scoreDiff
    return left.scheduledTime.localeCompare(right.scheduledTime)
  })
}

function getBreakdownValue(items: AdminDashboardMetricItem[] | undefined, label: string) {
  return items?.find(item => item.label === label)?.value ?? 0
}

interface OperationsEntryCardProps {
  title: string
  subtitle: string
  href: string
  icon: ReactNode
  tag: string
}

function OperationsEntryCard({ title, subtitle, href, icon, tag }: OperationsEntryCardProps) {
  return (
    <Link href={href} className="ops-entry-card">
      <div className="ops-entry-head">
        <div className="ops-entry-title-wrap">
          <div className="ops-entry-icon">{icon}</div>
          <div className="ops-entry-title">{title}</div>
        </div>
        <Tag variant="neutral">{tag}</Tag>
      </div>
      <div className="ops-entry-subtitle">{subtitle}</div>
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

  const applications = useSyncExternalStore(
    subscribeAdmissionWorkflow,
    getAdmissionApplicationsSnapshot,
    getAdmissionApplicationsSnapshot,
  )
  const nursingSnapshot = useSyncExternalStore(
    subscribeNursingServiceWorkflow,
    getNursingServiceSnapshot,
    getNursingServiceSnapshot,
  )
  const operationsSnapshot = useSyncExternalStore(
    subscribeOperationsWorkflow,
    getOperationsSnapshot,
    getOperationsSnapshot,
  )
  const resourceSnapshot = useSyncExternalStore(
    subscribeResourceWorkflow,
    getResourceSnapshot,
    getResourceSnapshot,
  )
  const masterSnapshot = useSyncExternalStore(
    subscribeMasterDataWorkflow,
    getMasterDataSnapshot,
    getMasterDataSnapshot,
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

  const prioritizedAlerts = useMemo(() => sortAlertsByPriority(alertRecords), [])
  const prioritizedIncidents = useMemo(() => sortIncidentsByPriority(operationsSnapshot.incidents), [operationsSnapshot.incidents])
  const prioritizedActivities = useMemo(() => sortActivitiesByPriority(operationsSnapshot.activities), [operationsSnapshot.activities])
  const prioritizedStaff = useMemo(() => sortStaffByPriority(resourceSnapshot.staff), [resourceSnapshot.staff])
  const prioritizedRooms = useMemo(() => sortRoomsByPriority(masterSnapshot.rooms), [masterSnapshot.rooms])
  const prioritizedSupplies = useMemo(() => sortSuppliesByPriority(resourceSnapshot.supplies), [resourceSnapshot.supplies])
  const applicationSourceMap = useMemo(
    () => Object.fromEntries(applications.map(item => [item.id, item.sourceType ?? 'manual-form'])),
    [applications],
  )
  const staffEmploymentMap = useMemo(
    () => new Map(nursingSnapshot.schedule.staffRows.map(item => [item.staffName, item.employmentSource])),
    [nursingSnapshot.schedule.staffRows],
  )

  const assessmentTasks = useMemo<DailyTaskItem[]>(() => getStaffTaskItems(applications)
    .filter(task => matchesAdmissionScene(applicationSourceMap[task.sourceId], scene))
    .map(task => ({
      id: task.id,
      title: task.title,
      elderlyName: task.elderlyName,
      room: task.room,
      status: task.status,
      priority: task.priority,
      scheduledTime: task.scheduledTime,
      href: '/staff/tasks',
      hint: `评定来源 ${task.sourceStatus}`,
      origin: '评定任务',
    })), [applicationSourceMap, applications, scene])
  const serviceTasks = useMemo<DailyTaskItem[]>(() => nursingSnapshot.tasks
    .filter(task => matchesEmploymentScene(staffEmploymentMap.get(task.ownerName), scene))
    .map(task => ({
      id: task.id,
      title: task.title,
      elderlyName: task.elderlyName,
      room: task.room,
      status: task.status,
      priority: task.priority,
      scheduledTime: task.scheduledTime,
      href: '/staff/tasks',
      hint: `${task.packageName} · ${task.shift}`,
      origin: '服务计划',
    })), [nursingSnapshot.tasks, scene, staffEmploymentMap])
  const prioritizedTasks = useMemo(
    () => sortDailyTasks([...assessmentTasks, ...serviceTasks]),
    [assessmentTasks, serviceTasks],
  )

  const sceneMeta = scene === 'home'
    ? {
      title: '居家日班工作台',
      subtitle: '把上门评定、第三方协同、回执补录与监管报表收敛到同一入口。',
      description: '班次入口当前按居家养老视角组织，先判断评定、派案和监管压力，再进入共享页处理。',
    }
    : scene === 'institutional'
      ? {
        title: '机构日班工作台',
        subtitle: '把院内告警、认定任务、执行留痕与资源补位收敛到同一入口。',
        description: '班次入口当前按机构养老视角组织，先判断院内认定、执行和承接压力，再进入共享页处理。',
      }
      : {
        title: '日班运营工作台',
        subtitle: '把告警、事故、评定任务、活动执行与资源补位收敛到同一入口，先定优先级再下钻。',
        description: '日班工作台只保留当班收口总览、优先队列和统一入口，不再把来源说明拆成多张并行说明卡。',
      }

  const pendingCriticalAlerts = prioritizedAlerts.filter(item => item.level === 'critical' && item.status !== 'resolved').length
  const openIncidents = prioritizedIncidents.filter(item => item.status !== '已结案').length
  const todayActivities = prioritizedActivities.filter(item => item.date === OPERATIONS_TODAY).length
  const runningActivities = prioritizedActivities.filter(item => item.status === '进行中').length
  const openTasks = prioritizedTasks.filter(item => item.status !== '已完成').length
  const pendingOnboarding = resourceSnapshot.staff.filter(item => item.lifecycleStatus === '待入职').length
  const maintenanceRooms = masterSnapshot.rooms.filter(item => item.status === '维护中' || item.cleanStatus !== '已清洁').length
  const shortageSupplies = resourceSnapshot.supplies.filter(item => item.status === '库存不足' || item.lifecycleStatus === '待上架').length
  const isWorkflowDemoMode = isNursingWorkflowDemoMode()
  const hasDashboardSnapshot = dashboardOverview !== null && !dashboardError
  const livePendingAlerts = dashboardOverview?.kpis.pendingAlerts ?? 0
  const liveWorkflowPendingCount = dashboardOverview?.kpis.workflowPendingCount ?? 0
  const liveQueuedNotifications = getBreakdownValue(dashboardOverview?.notificationBreakdown, '待发送')
  const liveFinanceActionRequired = getBreakdownValue(dashboardOverview?.financeBreakdown, '动作必做')
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
  const nursingWorkflowStatusVariant = isWorkflowDemoMode
    ? 'warning' as const
    : nursingSnapshot.error
      ? 'danger' as const
      : 'success' as const
  const nursingWorkflowStatusLabel = isWorkflowDemoMode
    ? 'Demo Snapshot'
    : nursingSnapshot.error
      ? 'Fallback Active'
      : 'Live Workflow'

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
      title: '护理 Workflow',
      variant: nursingWorkflowStatusVariant,
      label: nursingWorkflowStatusLabel,
      detail: isWorkflowDemoMode
        ? '当前环境未启用护理 workflow BFF，服务计划任务仍来自 demo snapshot。'
        : nursingSnapshot.error
          ? `护理 workflow 已降级到 fallback 快照：${nursingSnapshot.error}`
          : '服务计划任务与排班信号来自护理 workflow board。',
    },
    {
      title: '事故与资源补位',
      variant: 'neutral' as const,
      label: 'Local Snapshot',
      detail: '事故、活动、房间、物资和人员补位仍来自本地 workflow store，尚未接入后端读模型。',
    },
  ]

  const focusQueue = [
    ...prioritizedAlerts.slice(0, 2).map(item => ({
      id: item.id,
      category: '告警中心',
      title: `${item.elderlyName} · ${item.description}`,
      detail: `${item.roomNumber}${item.deviceName ? ` · ${item.deviceName}` : ''}`,
      hint: item.status === 'pending' ? '优先接单并确认到场响应' : '持续跟进处理中事件',
      href: withSceneQuery('/alerts', scene),
      variant: item.level === 'critical' ? 'danger' as const : 'warning' as const,
      sourceLabel: 'Local Snapshot',
      sourceVariant: 'neutral' as const,
    })),
    ...prioritizedIncidents.slice(0, 2).map(item => ({
      id: item.id,
      category: '事故处置',
      title: item.title,
      detail: `${item.room} · 报告人 ${item.reporter}`,
      hint: item.status === '待分派' ? '先确认责任人与通知动作' : item.nextStep ?? '补齐下一步与复核时间',
      href: withSceneQuery('/incidents', scene),
      variant: item.level === '严重' ? 'danger' as const : 'warning' as const,
      sourceLabel: 'Local Snapshot',
      sourceVariant: 'neutral' as const,
    })),
    ...prioritizedTasks.slice(0, 2).map(item => ({
      id: item.id,
      category: item.origin,
      title: `${item.elderlyName} · ${item.title}`,
      detail: `${item.room} · ${item.scheduledTime}`,
      hint: item.hint,
      href: withSceneQuery(item.href, scene),
      variant: item.priority === '高' ? 'warning' as const : 'info' as const,
      sourceLabel: item.origin === '服务计划' ? nursingWorkflowStatusLabel : 'Local Snapshot',
      sourceVariant: item.origin === '服务计划' ? nursingWorkflowStatusVariant : 'neutral' as const,
    })),
    ...prioritizedActivities.slice(0, 1).map(item => ({
      id: item.id,
      category: '活动运营',
      title: item.name,
      detail: `${item.date} ${item.time} · ${item.location}`,
      hint: item.status === '进行中' ? '关注签到、现场执行与容量波动' : '检查发布与报名节奏',
      href: withSceneQuery('/activities', scene),
      variant: item.status === '进行中' ? 'warning' as const : 'info' as const,
      sourceLabel: 'Local Snapshot',
      sourceVariant: 'neutral' as const,
    })),
  ]

  const operationEntries = [
    { title: '实时告警', subtitle: `${pendingCriticalAlerts} 条紧急未闭环`, href: withSceneQuery('/alerts', scene), icon: <AlertTriangle size={16} />, tag: '告警' },
    { title: '事故处置', subtitle: `${openIncidents} 条未结案`, href: withSceneQuery('/incidents', scene), icon: <ShieldAlert size={16} />, tag: '安全' },
    { title: '现场评定任务', subtitle: `${openTasks} 项待闭环`, href: withSceneQuery('/staff/tasks', scene), icon: <ClipboardList size={16} />, tag: '任务' },
    { title: '活动运营', subtitle: `今日 ${todayActivities} 场，进行中 ${runningActivities} 场`, href: withSceneQuery('/activities', scene), icon: <CalendarHeart size={16} />, tag: '运营' },
    { title: '设备监控', subtitle: `${pendingCriticalAlerts} 条告警需联动监控`, href: withSceneQuery('/devices/realtime', scene), icon: <Monitor size={16} />, tag: '设备' },
    { title: '房间承接', subtitle: `${maintenanceRooms} 项维护或清洁待办`, href: withSceneQuery('/rooms', scene), icon: <DoorOpen size={16} />, tag: '床位' },
    { title: '补货上架', subtitle: `${shortageSupplies} 项库存风险`, href: withSceneQuery('/supplies', scene), icon: <Package size={16} />, tag: '物资' },
    { title: '人员协同', subtitle: `${pendingOnboarding} 人待入职确认`, href: withSceneQuery('/staff', scene), icon: <UserCheck size={16} />, tag: '协同' },
  ]

  const supportSignals = [
    {
      label: '优先人员',
      value: prioritizedStaff[0] ? `${prioritizedStaff[0].name} · ${prioritizedStaff[0].lifecycleStatus}` : '暂无异常',
      hint: '优先确认待入职、休假和第三方协同人员',
    },
    {
      label: '承接房间',
      value: prioritizedRooms[0] ? `${prioritizedRooms[0].name} · ${prioritizedRooms[0].status}` : '暂无异常',
      hint: '优先看待启用、维护和待清洁房间',
    },
    {
      label: '补货物资',
      value: prioritizedSupplies[0] ? `${prioritizedSupplies[0].name} · ${prioritizedSupplies[0].status}` : '暂无异常',
      hint: '优先处理待上架与库存不足条目',
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
                  <div style={{ marginTop: 6 }}>首屏总览优先读取 dashboard aggregate 与护理 workflow board，事故和资源补位区仍明确保留 local snapshot 边界。</div>
                </>
              }
              badge={
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Tag variant="primary">Shift Control</Tag>
                  <Tag variant={dashboardStatusVariant}>{dashboardStatusLabel}</Tag>
                  <Tag variant={nursingWorkflowStatusVariant}>{nursingWorkflowStatusLabel}</Tag>
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
                { label: '事故处理中', value: openIncidents, hint: 'Local Snapshot · 待分派与处理中事故统一收口', tone: openIncidents > 0 ? 'warning' : 'success' },
                { label: '今日活动', value: todayActivities, hint: `Local Snapshot · 进行中 ${runningActivities} 场`, tone: todayActivities > 0 ? 'info' : 'neutral' },
              ]}
              signals={[
                { label: dashboardLoading ? '日班工作台 aggregate 正在同步' : dashboardError ? `日班工作台 aggregate 不可达：${dashboardError}` : `工作台 aggregate 已更新：${dashboardGeneratedAtLabel}`, tone: dashboardLoading ? 'warning' : dashboardError ? 'danger' : 'success' },
                { label: isWorkflowDemoMode ? '护理 workflow 当前仍处于 Demo Snapshot 模式' : nursingSnapshot.error ? `护理 workflow 已切到 fallback：${nursingSnapshot.error}` : '护理 workflow 当前正在读取 BFF board', tone: isWorkflowDemoMode ? 'warning' : nursingSnapshot.error ? 'danger' : 'success' },
                { label: pendingOnboarding > 0 ? `有 ${pendingOnboarding} 人待入职确认，可能影响排班口径` : '当前无待入职人员阻塞排班', tone: pendingOnboarding > 0 ? 'warning' : 'success' },
              ]}
              actions={
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Link href={withSceneQuery('/alerts', scene)} className="btn btn-secondary btn-sm">先看实时告警</Link>
                  <Link href={withSceneQuery('/staff/tasks', scene)} className="btn btn-secondary btn-sm">进入评定任务</Link>
                  <Link href={withSceneQuery('/activities', scene)} className="btn btn-secondary btn-sm">跟进活动执行</Link>
                </div>
              }
            />

            <div className="kpi-grid" style={{ marginBottom: 16 }}>
              <StatCard icon={<AlertTriangle size={18} />} label="告警待闭环" value={hasDashboardSnapshot ? livePendingAlerts : '--'} sub={dashboardLoading ? 'Syncing' : dashboardError ? 'Live Unavailable' : 'Live Snapshot'} color="danger" />
              <StatCard icon={<ClipboardList size={18} />} label="工作流待办" value={hasDashboardSnapshot ? liveWorkflowPendingCount : '--'} sub={dashboardLoading ? '待复核与未分派同步中' : dashboardError ? 'Aggregate Unavailable' : `通知 ${liveQueuedNotifications} · 财务 ${liveFinanceActionRequired}`} color="info" />
              <StatCard icon={<ShieldAlert size={18} />} label="事故未结案" value={openIncidents} sub="Local Snapshot" color="warning" />
              <StatCard icon={<CalendarHeart size={18} />} label="今日活动" value={todayActivities} sub={`Local Snapshot · 进行中 ${runningActivities} 场`} color="primary" />
            </div>

            <DataCard
              icon={<ShieldAlert size={16} />}
              title="班次优先队列"
              subtitle="按先处置风险、再推动执行、最后处理资源补位的顺序聚合。"
              badge={<Tag variant="warning">Shift Queue</Tag>}
            >
              <div className="ops-focus-list">
                {focusQueue.map(item => (
                  <FocusQueueCard key={item.id} {...item} />
                ))}
              </div>
            </DataCard>

            <DataCard
              icon={<ChevronRight size={16} />}
              title="统一运营入口"
              subtitle="先决定去哪处理，再进入对应专页；入口卡不再和来源说明混排。"
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
              summary="日班工作台首屏只保留当班收口总览、优先队列和统一入口；来源边界与资源补位信号统一压到后置上下文区。"
              items={[
                '先看告警和事故，再进入评定与执行链路。',
                '当班判断先以 aggregate 与 workflow 状态为准。',
                '资源补位和补货判断只作为支撑信号，不抢主入口。',
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
