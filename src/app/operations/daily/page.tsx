'use client'

import { DataCard, PageHeader, StatCard, Tag, WorkflowOverviewCard } from '@/components/nh'
import { alertRecords } from '@/lib/data/alerts-data'
import { getAdmissionApplicationsSnapshot, getStaffTaskItems, subscribeAdmissionWorkflow } from '@/lib/mock/assessment-workflow'
import { getMasterDataSnapshot, subscribeMasterDataWorkflow } from '@/lib/mock/master-data-workflow'
import { getNursingServiceSnapshot, subscribeNursingServiceWorkflow } from '@/lib/mock/nursing-service-workflow'
import { getOperationsSnapshot, OPERATIONS_TODAY, subscribeOperationsWorkflow } from '@/lib/mock/operations-workflow'
import { getResourceSnapshot, subscribeResourceWorkflow } from '@/lib/mock/resource-workflow'
import { sortActivitiesByPriority, sortAlertsByPriority, sortIncidentsByPriority } from '@/lib/operations-priority'
import { sortRoomsByPriority, sortStaffByPriority, sortSuppliesByPriority } from '@/lib/resource-operations-priority'
import { AlertTriangle, CalendarHeart, ChevronRight, ClipboardList, DoorOpen, Monitor, Package, ShieldAlert, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useSyncExternalStore } from 'react'

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

export default function DailyOperationsPage() {
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

  const prioritizedAlerts = useMemo(() => sortAlertsByPriority(alertRecords), [])
  const prioritizedIncidents = useMemo(() => sortIncidentsByPriority(operationsSnapshot.incidents), [operationsSnapshot.incidents])
  const prioritizedActivities = useMemo(() => sortActivitiesByPriority(operationsSnapshot.activities), [operationsSnapshot.activities])
  const prioritizedStaff = useMemo(() => sortStaffByPriority(resourceSnapshot.staff), [resourceSnapshot.staff])
  const prioritizedRooms = useMemo(() => sortRoomsByPriority(masterSnapshot.rooms), [masterSnapshot.rooms])
  const prioritizedSupplies = useMemo(() => sortSuppliesByPriority(resourceSnapshot.supplies), [resourceSnapshot.supplies])

  const assessmentTasks = useMemo<DailyTaskItem[]>(() => getStaffTaskItems(applications).map(task => ({
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
  })), [applications])
  const serviceTasks = useMemo<DailyTaskItem[]>(() => nursingSnapshot.tasks.map(task => ({
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
  })), [nursingSnapshot.tasks])
  const prioritizedTasks = useMemo(
    () => sortDailyTasks([...assessmentTasks, ...serviceTasks]),
    [assessmentTasks, serviceTasks],
  )

  const pendingCriticalAlerts = prioritizedAlerts.filter(item => item.level === 'critical' && item.status !== 'resolved').length
  const openIncidents = prioritizedIncidents.filter(item => item.status !== '已结案').length
  const todayActivities = prioritizedActivities.filter(item => item.date === OPERATIONS_TODAY).length
  const runningActivities = prioritizedActivities.filter(item => item.status === '进行中').length
  const openTasks = prioritizedTasks.filter(item => item.status !== '已完成').length
  const pendingOnboarding = resourceSnapshot.staff.filter(item => item.lifecycleStatus === '待入职').length
  const maintenanceRooms = masterSnapshot.rooms.filter(item => item.status === '维护中' || item.cleanStatus !== '已清洁').length
  const shortageSupplies = resourceSnapshot.supplies.filter(item => item.status === '库存不足' || item.lifecycleStatus === '待上架').length

  const focusQueue = [
    ...prioritizedAlerts.slice(0, 2).map(item => ({
      id: item.id,
      category: '告警中心',
      title: `${item.elderlyName} · ${item.description}`,
      detail: `${item.roomNumber}${item.deviceName ? ` · ${item.deviceName}` : ''}`,
      hint: item.status === 'pending' ? '优先接单并确认到场响应' : '持续跟进处理中事件',
      href: '/alerts',
      variant: item.level === 'critical' ? 'danger' as const : 'warning' as const,
    })),
    ...prioritizedIncidents.slice(0, 2).map(item => ({
      id: item.id,
      category: '事故处置',
      title: item.title,
      detail: `${item.room} · 报告人 ${item.reporter}`,
      hint: item.status === '待分派' ? '先确认责任人与通知动作' : item.nextStep ?? '补齐下一步与复核时间',
      href: '/incidents',
      variant: item.level === '严重' ? 'danger' as const : 'warning' as const,
    })),
    ...prioritizedTasks.slice(0, 2).map(item => ({
      id: item.id,
      category: item.origin,
      title: `${item.elderlyName} · ${item.title}`,
      detail: `${item.room} · ${item.scheduledTime}`,
      hint: item.hint,
      href: item.href,
      variant: item.priority === '高' ? 'warning' as const : 'info' as const,
    })),
    ...prioritizedActivities.slice(0, 1).map(item => ({
      id: item.id,
      category: '活动运营',
      title: item.name,
      detail: `${item.date} ${item.time} · ${item.location}`,
      hint: item.status === '进行中' ? '关注签到、现场执行与容量波动' : '检查发布与报名节奏',
      href: '/activities',
      variant: item.status === '进行中' ? 'warning' as const : 'info' as const,
    })),
  ]

  const operationEntries = [
    { title: '实时告警', subtitle: `${pendingCriticalAlerts} 条紧急未闭环`, href: '/alerts', icon: <AlertTriangle size={16} />, tag: '告警' },
    { title: '事故处置', subtitle: `${openIncidents} 条未结案`, href: '/incidents', icon: <ShieldAlert size={16} />, tag: '安全' },
    { title: '现场评定任务', subtitle: `${openTasks} 项待闭环`, href: '/staff/tasks', icon: <ClipboardList size={16} />, tag: '任务' },
    { title: '活动运营', subtitle: `今日 ${todayActivities} 场，进行中 ${runningActivities} 场`, href: '/activities', icon: <CalendarHeart size={16} />, tag: '运营' },
    { title: '设备监控', subtitle: `${pendingCriticalAlerts} 条告警需联动监控`, href: '/devices/realtime', icon: <Monitor size={16} />, tag: '设备' },
    { title: '房间承接', subtitle: `${maintenanceRooms} 项维护或清洁待办`, href: '/rooms', icon: <DoorOpen size={16} />, tag: '床位' },
    { title: '补货上架', subtitle: `${shortageSupplies} 项库存风险`, href: '/supplies', icon: <Package size={16} />, tag: '物资' },
    { title: '人员协同', subtitle: `${pendingOnboarding} 人待入职确认`, href: '/staff', icon: <UserCheck size={16} />, tag: '协同' },
  ]

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="日班运营工作台"
        subtitle="把告警、事故、评定任务、活动执行与资源补位收敛到同一入口，先确定班次优先顺序，再进入各业务页面处理。"
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/" className="btn btn-secondary btn-sm">返回首页</Link>
            <Link href="/ai-assistant" className="btn btn-primary btn-sm">查看 AI 运营视角</Link>
          </div>
        }
      />

      <WorkflowOverviewCard
        eyebrow="Daily Operations"
        title="当班收口总览"
        description="班次入口先看真正需要立即处理的事件，再下钻到告警、事故、任务、活动和资源页面，避免管理视角在多个列表之间来回切换。"
        badge={<Tag variant="primary">Shift Control</Tag>}
        metrics={[
          { label: '紧急未闭环', value: pendingCriticalAlerts, hint: '先确认现场响应人与医生联动', tone: pendingCriticalAlerts > 0 ? 'danger' : 'success' },
          { label: '事故处理中', value: openIncidents, hint: '待分派与处理中事故统一收口', tone: openIncidents > 0 ? 'warning' : 'success' },
          { label: '评定与任务待办', value: openTasks, hint: '认定任务与服务计划一起看', tone: openTasks > 0 ? 'warning' : 'neutral' },
          { label: '今日活动', value: todayActivities, hint: `进行中 ${runningActivities} 场`, tone: todayActivities > 0 ? 'info' : 'neutral' },
        ]}
        signals={[
          { label: pendingOnboarding > 0 ? `有 ${pendingOnboarding} 人待入职确认，可能影响排班口径` : '当前无待入职人员阻塞排班', tone: pendingOnboarding > 0 ? 'warning' : 'success' },
          { label: maintenanceRooms > 0 ? `${maintenanceRooms} 间房处于维护或保洁待办，需关注承接能力` : '当前房间承接能力稳定', tone: maintenanceRooms > 0 ? 'warning' : 'success' },
          { label: shortageSupplies > 0 ? `${shortageSupplies} 项物资处于补货或上架风险` : '当前补货口径稳定', tone: shortageSupplies > 0 ? 'warning' : 'neutral' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/alerts" className="btn btn-secondary btn-sm">先看实时告警</Link>
            <Link href="/staff/tasks" className="btn btn-secondary btn-sm">进入评定任务</Link>
            <Link href="/activities" className="btn btn-secondary btn-sm">跟进活动执行</Link>
          </div>
        }
      />

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard icon={<AlertTriangle size={18} />} label="告警待闭环" value={pendingCriticalAlerts} color="danger" />
        <StatCard icon={<ShieldAlert size={18} />} label="事故未结案" value={openIncidents} color="warning" />
        <StatCard icon={<ClipboardList size={18} />} label="任务待处理" value={openTasks} color="info" />
        <StatCard icon={<CalendarHeart size={18} />} label="今日活动" value={todayActivities} sub={`进行中 ${runningActivities} 场`} color="primary" />
      </div>

      <div className="dashboard-grid-2" style={{ marginBottom: 16 }}>
        <DataCard
          icon={<ShieldAlert size={16} />}
          title="班次优先队列"
          subtitle="按先处置风险、再推动执行、最后处理资源补位的顺序聚合。"
          badge={<Tag variant="warning">Shift Queue</Tag>}
        >
          <div style={{ display: 'grid', gap: 10 }}>
            {focusQueue.map(item => (
              <div key={item.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                    <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.category} · {item.detail}</div>
                  </div>
                  <Tag variant={item.variant}>{item.category}</Tag>
                </div>
                <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>{item.hint}</div>
                <div style={{ marginTop: 10 }}>
                  <Link href={item.href} className="btn btn-ghost btn-sm">进入处理 <ChevronRight size={12} /></Link>
                </div>
              </div>
            ))}
          </div>
        </DataCard>

        <DataCard
          icon={<ClipboardList size={16} />}
          title="推荐处理路径"
          subtitle="把当班动作压缩成一条固定节奏，减少跨页切换成本。"
        >
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              '先清紧急告警与待分派事故，确保安全事件有明确现场负责人。',
              '再推进评定任务和服务计划，避免认定、派案、执行链路脱节。',
              '同步检查今日活动的签到与容量压力，防止现场执行与家属沟通失焦。',
              '最后回看房间承接、物资补货和人员补位，把资源问题留在班次内解决。',
            ].map(item => (
              <div key={item} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
                {item}
              </div>
            ))}
          </div>
        </DataCard>
      </div>

      <div className="dashboard-grid-2" style={{ marginBottom: 16 }}>
        <DataCard
          icon={<ChevronRight size={16} />}
          title="统一运营入口"
          subtitle="所有班次关键入口在这里收敛，先决定去哪，再进去处理。"
          badge={<Tag variant="info">Entry Board</Tag>}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {operationEntries.map(item => (
              <Link key={item.title} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14, height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-primary)' }}>
                      {item.icon}
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</span>
                    </div>
                    <Tag variant="neutral">{item.tag}</Tag>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{item.subtitle}</div>
                </div>
              </Link>
            ))}
          </div>
        </DataCard>

        <DataCard
          icon={<UserCheck size={16} />}
          title="资源支撑信号"
          subtitle="用最少的支撑指标判断当班是否需要资源补位。"
        >
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              { label: '优先人员', value: prioritizedStaff[0] ? `${prioritizedStaff[0].name} · ${prioritizedStaff[0].lifecycleStatus}` : '暂无异常', hint: '优先确认待入职、休假和第三方协同人员' },
              { label: '承接房间', value: prioritizedRooms[0] ? `${prioritizedRooms[0].name} · ${prioritizedRooms[0].status}` : '暂无异常', hint: '优先看待启用、维护和待清洁房间' },
              { label: '补货物资', value: prioritizedSupplies[0] ? `${prioritizedSupplies[0].name} · ${prioritizedSupplies[0].status}` : '暂无异常', hint: '优先处理待上架与库存不足条目' },
            ].map(item => (
              <div key={item.label} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.label}</div>
                <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>{item.value}</div>
                <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.hint}</div>
              </div>
            ))}
          </div>
        </DataCard>
      </div>
    </div>
  )
}