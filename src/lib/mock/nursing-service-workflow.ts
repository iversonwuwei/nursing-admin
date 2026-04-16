export type ServicePackageStatus = '草稿' | '待定价' | '待发布' | '已生效' | '已下线'
export type ServicePlanStatus = '待复核' | '执行中' | '异常插单' | '已归档'
export type ServicePlanTaskStatus = '待执行' | '执行中' | '已完成'
export type ServiceClockInStatus = '待执行' | '服务中' | '异常待复核' | '待主管确认' | '已确认'
export type ServiceClockInMethod = '二维码' | 'NFC' | '手工补录'
export type NursingWorkflowMode = 'demo' | 'bff'

export interface ServicePackageRecord {
  id: string
  name: string
  careLevel: string
  targetGroup: string
  monthlyPrice: string
  settlementCycle: string
  serviceScope: string[]
  addOns: string[]
  boundElders: number
  status: ServicePackageStatus
  createdAt: string
  publishedAt?: string | null
  pricingNote?: string | null
}

export interface ServicePlanRecord {
  id: string
  elderlyName: string
  room: string
  packageId: string
  packageName: string
  careLevel: string
  focus: string
  shift: string
  ownerRole: string
  ownerName: string
  riskTags: string[]
  source: '套餐生成' | '临时插单'
  status: ServicePlanStatus
  createdAt: string
  reviewNote?: string | null
}

export interface ServicePlanExecutionTaskItem {
  id: string
  planId: string
  elderlyName: string
  room: string
  title: string
  owner: string
  ownerName: string
  ownerRole: string
  reminder: string
  scheduledTime: string
  shift: string
  careLevel: string
  priority: '高' | '中' | '常规'
  status: ServicePlanTaskStatus
  sourceId: string
  sourceStatus: '计划已生成' | '已入住'
  originStatusLabel: ServicePlanStatus
  originLabel: '服务计划'
  packageName: string
  handledBy?: string
  handledAt?: string
  handledAtIso?: string
  actionNote?: string
}

export interface ServiceClockInRecord {
  id: string
  taskId: string
  planId: string
  elderlyName: string
  room: string
  packageName: string
  ownerName: string
  ownerRole: string
  shift: string
  scheduledTime: string
  status: ServiceClockInStatus
  method: ServiceClockInMethod
  checkedInAt?: string
  checkedInAtIso?: string
  completedAt?: string
  completedAtIso?: string
  exceptionNote?: string
  actionNote?: string
  reviewedBy?: string
  reviewedAt?: string
  reviewedAtIso?: string
  reviewNote?: string
}

export interface ScheduleBoardAssignmentItem {
  assignmentId: string
  planId: string
  shift: string
  elderlyName: string
  packageName: string
  room: string
  status: ServicePlanStatus
}

export interface ScheduleBoardCellItem {
  dayLabel: string
  assignments: ScheduleBoardAssignmentItem[]
}

export interface ScheduleBoardStaffRowItem {
  staffId: string
  staffName: string
  staffRole: string
  employmentSource: string
  partnerAgencyName?: string | null
  assignedPlans: number
  exceptionPlans: number
  pendingReviewPlans: number
  cells: ScheduleBoardCellItem[]
}

export interface ScheduleBoardDaySummaryItem {
  dayLabel: string
  shifts: Array<{ shift: string; count: number }>
}

export interface ScheduleAttentionPlanItem {
  id: string
  elderlyName: string
  packageName: string
  ownerRole: string
  ownerName: string
  shift: string
  status: ServicePlanStatus
}

export interface ScheduleBoardSnapshot {
  weekLabel: string
  activePlans: number
  pendingReviewPlans: number
  unassignedPlans: number
  thirdPartyAssignedPlans: number
  publishedAssignments: number
  shiftDemand: Array<{ shift: string; count: number }>
  staffRows: ScheduleBoardStaffRowItem[]
  daySummaries: ScheduleBoardDaySummaryItem[]
  attentionPlans: ScheduleAttentionPlanItem[]
}

export interface StaffScheduleCoverageItem {
  staffId: string
  staffName: string
  role: string
  employmentSource: string
  assignedPlans: number
  exceptionPlans: number
  pendingReviewPlans: number
  shiftDemand: Record<string, number>
}

export interface ScheduleCoverageSummary {
  activePlans: number
  pendingReviewPlans: number
  unassignedPlans: number
  thirdPartyAssignedPlans: number
  shiftDemand: Array<{ shift: string; count: number }>
  staffCoverage: StaffScheduleCoverageItem[]
  attentionPlans: ScheduleAttentionPlanItem[]
}

export interface NursingWorkflowObservability {
  pendingReviewPlans: number
  unassignedPlans: number
  archivedPlans: number
  completedTasks: number
  auditRecords: number
  taskCompletionTotal: number
  planArchiveTotal: number
  unassignedBacklogGauge: number
}

export interface ServicePackageFormState {
  name: string
  careLevel: string
  targetGroup: string
  monthlyPrice: string
  settlementCycle: string
  serviceScope: string
  addOns: string
}

export interface ServicePlanFormState {
  packageId: string
  elderlyName: string
  room: string
  focus: string
  shift: string
  ownerRole: string
  ownerName: string
  riskTags: string
  source: '套餐生成' | '临时插单'
}

export interface NursingServiceSnapshot {
  packages: ServicePackageRecord[]
  plans: ServicePlanRecord[]
  tasks: ServicePlanExecutionTaskItem[]
  clockInRecords: ServiceClockInRecord[]
  schedule: ScheduleBoardSnapshot
  observability: NursingWorkflowObservability
  loading: boolean
  error: string
}

interface DemoCounters {
  auditRecords: number
  taskCompletionTotal: number
  planArchiveTotal: number
}

interface DemoWorkflowState {
  packages: ServicePackageRecord[]
  plans: ServicePlanRecord[]
  tasks: ServicePlanExecutionTaskItem[]
  clockInRecords: ServiceClockInRecord[]
  counters: DemoCounters
}

interface DemoStaffDirectoryItem {
  staffId: string
  staffName: string
  staffRole: string
  employmentSource: string
  partnerAgencyName?: string | null
}

export const EMPTY_SERVICE_PACKAGE_FORM: ServicePackageFormState = {
  name: '',
  careLevel: '半自理',
  targetGroup: '',
  monthlyPrice: '',
  settlementCycle: '月付',
  serviceScope: '',
  addOns: '',
}

export const EMPTY_SERVICE_PLAN_FORM: ServicePlanFormState = {
  packageId: '',
  elderlyName: '',
  room: '',
  focus: '',
  shift: '早班',
  ownerRole: '护工',
  ownerName: '',
  riskTags: '',
  source: '套餐生成',
}

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const
const STORAGE_KEY = 'nursing-admin:nursing-service-workflow-demo:v1'
const WORKFLOW_MODE: NursingWorkflowMode = process.env.NEXT_PUBLIC_NURSING_WORKFLOW_MODE === 'bff' ? 'bff' : 'demo'

const SHIFT_TIME: Record<string, string> = {
  早班: '08:00',
  中班: '13:30',
  晚班: '19:00',
  夜班: '22:00',
  白班: '09:00',
}

const AUTO_PLAN_PROFILES = [
  {
    elderlyName: '周月琴',
    room: '305-2',
    focus: '早餐后血糖监测与翻身提醒',
    shift: '早班',
    ownerRole: '护士',
    ownerName: '王秀兰',
    riskTags: ['血糖波动'],
    source: '套餐生成' as const,
  },
  {
    elderlyName: '李秋芬',
    room: '208-1',
    focus: '午后康复训练与步态辅助',
    shift: '中班',
    ownerRole: '康复师',
    ownerName: '陈海川',
    riskTags: ['步态不稳'],
    source: '套餐生成' as const,
  },
  {
    elderlyName: '唐美华',
    room: '118-2',
    focus: '夜间离床告警响应与睡眠安抚',
    shift: '夜班',
    ownerRole: '第三方护工',
    ownerName: '赵文静',
    riskTags: ['夜间游走'],
    source: '套餐生成' as const,
  },
] as const

const DEFAULT_DEMO_STAFF_DIRECTORY: DemoStaffDirectoryItem[] = [
  { staffId: 'staff-li', staffName: '李秋萍', staffRole: '护工', employmentSource: '自有团队', partnerAgencyName: null },
  { staffId: 'staff-wang', staffName: '王秀兰', staffRole: '护士', employmentSource: '自有团队', partnerAgencyName: null },
  { staffId: 'staff-chen', staffName: '陈海川', staffRole: '康复师', employmentSource: '第三方合作', partnerAgencyName: '乐护康复中心' },
  { staffId: 'staff-zhao', staffName: '赵文静', staffRole: '第三方护工', employmentSource: '第三方合作', partnerAgencyName: '安心陪护' },
]

const EMPTY_SNAPSHOT: NursingServiceSnapshot = {
  packages: [],
  plans: [],
  tasks: [],
  clockInRecords: [],
  schedule: {
    weekLabel: '本周排班',
    activePlans: 0,
    pendingReviewPlans: 0,
    unassignedPlans: 0,
    thirdPartyAssignedPlans: 0,
    publishedAssignments: 0,
    shiftDemand: [],
    staffRows: [],
    daySummaries: [],
    attentionPlans: [],
  },
  observability: {
    pendingReviewPlans: 0,
    unassignedPlans: 0,
    archivedPlans: 0,
    completedTasks: 0,
    auditRecords: 0,
    taskCompletionTotal: 0,
    planArchiveTotal: 0,
    unassignedBacklogGauge: 0,
  },
  loading: false,
  error: '',
}

let snapshotState = EMPTY_SNAPSHOT
let hasLoaded = false
let inflightRefresh: Promise<NursingServiceSnapshot> | null = null
let bffFallbackActive = false
let nextBffRetryAt = 0
let demoStateCache: DemoWorkflowState | null = null
const listeners = new Set<() => void>()

function splitList(value: string) {
  return value
    .split(/[，,、\n]/)
    .map(item => item.trim())
    .filter(Boolean)
}

function emit() {
  listeners.forEach(listener => listener())
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function toDisplayTime(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

function inferPriority(plan: ServicePlanRecord): ServicePlanExecutionTaskItem['priority'] {
  const riskSummary = plan.riskTags.join(',')
  if (plan.careLevel === '全护' || plan.careLevel === '专项康复' || /跌倒|压疮|夜间|血氧|血糖/.test(riskSummary)) {
    return '高'
  }

  if (plan.careLevel === '半自理' || plan.riskTags.length > 0) {
    return '中'
  }

  return '常规'
}

function resolveScheduledTime(shift: string) {
  return SHIFT_TIME[shift] ?? '09:00'
}

function deriveTaskSourceStatus(status: ServicePlanStatus): ServicePlanExecutionTaskItem['sourceStatus'] {
  return status === '待复核' ? '计划已生成' : '已入住'
}

function buildTaskTitle(plan: ServicePlanRecord) {
  if (plan.source === '临时插单') {
    return `${plan.shift}临时照护任务`
  }

  return `${plan.packageName}执行任务`
}

function buildTaskReminder(plan: ServicePlanRecord) {
  if (plan.riskTags.length > 0) {
    return `关注 ${plan.riskTags.join(' / ')}`
  }

  if (plan.careLevel === '全护') {
    return '重点关注夜间巡视和安全巡检'
  }

  if (plan.careLevel === '专项康复') {
    return '关注康复训练记录与异常反馈'
  }

  return '按既定计划执行并记录回执'
}

function createTaskFromPlan(
  plan: ServicePlanRecord,
  overrides: Partial<ServicePlanExecutionTaskItem> = {},
): ServicePlanExecutionTaskItem {
  return {
    id: overrides.id ?? createId('task'),
    planId: plan.id,
    elderlyName: plan.elderlyName,
    room: plan.room,
    title: buildTaskTitle(plan),
    owner: plan.ownerName,
    ownerName: plan.ownerName,
    ownerRole: plan.ownerRole,
    reminder: buildTaskReminder(plan),
    scheduledTime: resolveScheduledTime(plan.shift),
    shift: plan.shift,
    careLevel: plan.careLevel,
    priority: inferPriority(plan),
    status: overrides.status ?? (plan.status === '已归档' ? '已完成' : plan.status === '异常插单' ? '执行中' : '待执行'),
    sourceId: plan.id,
    sourceStatus: deriveTaskSourceStatus(plan.status),
    originStatusLabel: plan.status,
    originLabel: '服务计划',
    packageName: plan.packageName,
    handledBy: overrides.handledBy,
    handledAt: overrides.handledAt,
    handledAtIso: overrides.handledAtIso,
    actionNote: overrides.actionNote,
  }
}

function inferClockInMethod(task: ServicePlanExecutionTaskItem, current?: ServiceClockInRecord): ServiceClockInMethod {
  if (current?.method) {
    return current.method
  }

  if (task.priority === '高') {
    return '二维码'
  }

  if (task.shift === '夜班' || task.shift === '晚班') {
    return 'NFC'
  }

  return '手工补录'
}

function inferClockInStatus(task: ServicePlanExecutionTaskItem, current?: ServiceClockInRecord): ServiceClockInStatus {
  if ((current?.exceptionNote?.trim() ?? '').length > 0 || task.originStatusLabel === '异常插单') {
    return '异常待复核'
  }

  if (task.status === '已完成') {
    return current?.status === '已确认' ? '已确认' : '待主管确认'
  }

  if (task.status === '执行中') {
    return '服务中'
  }

  return '待执行'
}

function buildClockInRecordFromTask(
  task: ServicePlanExecutionTaskItem,
  current?: ServiceClockInRecord,
): ServiceClockInRecord {
  const status = inferClockInStatus(task, current)
  const checkedInAt = task.status === '待执行'
    ? current?.checkedInAt
    : current?.checkedInAt ?? task.handledAt ?? `今日 ${task.scheduledTime}`
  const checkedInAtIso = task.status === '待执行'
    ? current?.checkedInAtIso
    : current?.checkedInAtIso ?? task.handledAtIso
  const completedAt = task.status === '已完成'
    ? current?.completedAt ?? task.handledAt ?? checkedInAt
    : undefined
  const completedAtIso = task.status === '已完成'
    ? current?.completedAtIso ?? task.handledAtIso ?? checkedInAtIso
    : undefined
  const exceptionNote = current?.exceptionNote
    ?? (task.originStatusLabel === '异常插单'
      ? task.actionNote ?? '现场评定存在整改或插单信号，待主管复核。'
      : undefined)

  return {
    id: current?.id ?? createId('clockin'),
    taskId: task.id,
    planId: task.planId,
    elderlyName: task.elderlyName,
    room: task.room,
    packageName: task.packageName,
    ownerName: task.ownerName,
    ownerRole: task.ownerRole,
    shift: task.shift,
    scheduledTime: task.scheduledTime,
    status,
    method: inferClockInMethod(task, current),
    checkedInAt,
    checkedInAtIso,
    completedAt,
    completedAtIso,
    exceptionNote,
    actionNote: task.actionNote,
    reviewedBy: status === '已确认' ? current?.reviewedBy : undefined,
    reviewedAt: status === '已确认' ? current?.reviewedAt : undefined,
    reviewedAtIso: status === '已确认' ? current?.reviewedAtIso : undefined,
    reviewNote: status === '已确认' ? current?.reviewNote : undefined,
  }
}

function resolvePlanDays(plan: ServicePlanRecord) {
  if (plan.status === '已归档' || plan.status === '待复核') {
    return [] as string[]
  }

  if (plan.status === '异常插单') {
    return ['周二', '周四', '周六']
  }

  switch (plan.shift) {
    case '夜班':
      return ['周一', '周三', '周五', '周日']
    case '晚班':
      return ['周二', '周四', '周五', '周日']
    case '中班':
      return ['周一', '周二', '周四', '周六']
    case '早班':
      return ['周一', '周三', '周五']
    case '白班':
      return ['周一', '周二', '周三', '周四', '周五']
    default:
      return ['周一', '周三', '周五']
  }
}

function syncDemoState(state: DemoWorkflowState): DemoWorkflowState {
  const normalizedCounters: DemoCounters = {
    auditRecords: state.counters?.auditRecords ?? 0,
    taskCompletionTotal: state.counters?.taskCompletionTotal ?? 0,
    planArchiveTotal: state.counters?.planArchiveTotal ?? 0,
  }

  const plans = state.plans.map(plan => ({
    ...plan,
    reviewNote: plan.reviewNote ?? null,
    riskTags: Array.isArray(plan.riskTags) ? plan.riskTags : [],
  }))
  const existingTasks = new Map(state.tasks.map(task => [task.planId, task]))
  const existingClockInRecords = new Map((state.clockInRecords ?? []).map(record => [record.taskId, record]))

  const tasks = plans
    .map(plan => {
      const currentTask = existingTasks.get(plan.id)
      let taskStatus = currentTask?.status ?? (plan.status === '异常插单' ? '执行中' : '待执行')

      if (plan.status === '待复核') {
        taskStatus = '待执行'
      } else if (plan.status === '已归档') {
        taskStatus = '已完成'
      } else if (taskStatus === '已完成') {
        taskStatus = '执行中'
      }

      return createTaskFromPlan(plan, {
        id: currentTask?.id,
        status: taskStatus,
        handledBy: currentTask?.handledBy,
        handledAt: currentTask?.handledAt,
        handledAtIso: currentTask?.handledAtIso,
        actionNote: currentTask?.actionNote,
      })
    })
    .sort((left, right) => left.scheduledTime.localeCompare(right.scheduledTime) || left.elderlyName.localeCompare(right.elderlyName))

  const clockInRecords = tasks
    .map(task => buildClockInRecordFromTask(task, existingClockInRecords.get(task.id)))
    .sort((left, right) => left.scheduledTime.localeCompare(right.scheduledTime) || left.elderlyName.localeCompare(right.elderlyName))

  const packages = state.packages.map(item => ({
    ...item,
    boundElders: plans.filter(plan => plan.packageId === item.id && plan.status !== '已归档').length,
  }))

  return {
    packages,
    plans,
    tasks,
    clockInRecords,
    counters: normalizedCounters,
  }
}

function buildDemoStaffDirectory(plans: ServicePlanRecord[]) {
  const directory = new Map(DEFAULT_DEMO_STAFF_DIRECTORY.map(item => [item.staffName, item]))

  plans.forEach(plan => {
    if (!plan.ownerName.trim() || directory.has(plan.ownerName)) {
      return
    }

    const isThirdParty = plan.ownerRole.includes('第三方')
    directory.set(plan.ownerName, {
      staffId: createId('staff'),
      staffName: plan.ownerName,
      staffRole: plan.ownerRole,
      employmentSource: isThirdParty ? '第三方合作' : '自有团队',
      partnerAgencyName: isThirdParty ? '协作机构待确认' : null,
    })
  })

  return Array.from(directory.values())
}

function buildDemoSchedule(plans: ServicePlanRecord[]): ScheduleBoardSnapshot {
  const staffDirectory = buildDemoStaffDirectory(plans)
  const staffRows = staffDirectory.map<ScheduleBoardStaffRowItem>(staff => ({
    staffId: staff.staffId,
    staffName: staff.staffName,
    staffRole: staff.staffRole,
    employmentSource: staff.employmentSource,
    partnerAgencyName: staff.partnerAgencyName ?? null,
    assignedPlans: 0,
    exceptionPlans: 0,
    pendingReviewPlans: plans.filter(plan => plan.ownerName === staff.staffName && plan.status === '待复核').length,
    cells: DAYS.map(day => ({ dayLabel: day, assignments: [] })),
  }))
  const rowByStaffName = new Map(staffRows.map(item => [item.staffName, item]))

  plans.forEach(plan => {
    if (plan.status === '待复核' || plan.status === '已归档' || !plan.ownerName.trim()) {
      return
    }

    const row = rowByStaffName.get(plan.ownerName)
    if (!row) {
      return
    }

    const days = resolvePlanDays(plan)
    days.forEach(day => {
      const cell = row.cells.find(item => item.dayLabel === day)
      if (!cell) {
        return
      }

      cell.assignments.push({
        assignmentId: `${plan.id}-${day}`,
        planId: plan.id,
        shift: plan.shift,
        elderlyName: plan.elderlyName,
        packageName: plan.packageName,
        room: plan.room,
        status: plan.status,
      })
    })
  })

  staffRows.forEach(row => {
    const uniquePlanIds = new Set<string>()
    row.cells.forEach(cell => {
      cell.assignments.forEach(assignment => uniquePlanIds.add(assignment.planId))
    })
    row.assignedPlans = uniquePlanIds.size
    row.exceptionPlans = plans.filter(plan => plan.ownerName === row.staffName && plan.status === '异常插单').length
  })

  const shiftDemandMap = new Map<string, number>()
  const daySummaries = DAYS.map<ScheduleBoardDaySummaryItem>(day => {
    const dayShiftMap = new Map<string, number>()

    staffRows.forEach(row => {
      const cell = row.cells.find(item => item.dayLabel === day)
      cell?.assignments.forEach(assignment => {
        dayShiftMap.set(assignment.shift, (dayShiftMap.get(assignment.shift) ?? 0) + 1)
        shiftDemandMap.set(assignment.shift, (shiftDemandMap.get(assignment.shift) ?? 0) + 1)
      })
    })

    return {
      dayLabel: day,
      shifts: Array.from(dayShiftMap.entries())
        .map(([shift, count]) => ({ shift, count }))
        .sort((left, right) => right.count - left.count),
    }
  })

  const activePlans = plans.filter(plan => plan.status !== '已归档').length
  const pendingReviewPlans = plans.filter(plan => plan.status === '待复核').length
  const unassignedPlans = plans.filter(plan => plan.status !== '已归档' && (plan.status === '待复核' || !plan.ownerName.trim())).length
  const thirdPartyAssignedPlans = plans.filter(plan => {
    if (plan.status === '待复核' || plan.status === '已归档') {
      return false
    }

    const row = rowByStaffName.get(plan.ownerName)
    return row?.employmentSource === '第三方合作'
  }).length
  const publishedAssignments = Array.from(shiftDemandMap.values()).reduce((sum, value) => sum + value, 0)
  const attentionPlans = plans
    .filter(plan => plan.status === '待复核' || plan.status === '异常插单')
    .map<ScheduleAttentionPlanItem>(plan => ({
      id: plan.id,
      elderlyName: plan.elderlyName,
      packageName: plan.packageName,
      ownerRole: plan.ownerRole,
      ownerName: plan.ownerName,
      shift: plan.shift,
      status: plan.status,
    }))

  return {
    weekLabel: '本周排班',
    activePlans,
    pendingReviewPlans,
    unassignedPlans,
    thirdPartyAssignedPlans,
    publishedAssignments,
    shiftDemand: Array.from(shiftDemandMap.entries())
      .map(([shift, count]) => ({ shift, count }))
      .sort((left, right) => right.count - left.count),
    staffRows,
    daySummaries,
    attentionPlans,
  }
}

function buildDemoObservability(
  plans: ServicePlanRecord[],
  tasks: ServicePlanExecutionTaskItem[],
  counters: DemoCounters,
  unassignedPlans: number,
): NursingWorkflowObservability {
  return {
    pendingReviewPlans: plans.filter(plan => plan.status === '待复核').length,
    unassignedPlans,
    archivedPlans: plans.filter(plan => plan.status === '已归档').length,
    completedTasks: tasks.filter(task => task.status === '已完成').length,
    auditRecords: counters.auditRecords,
    taskCompletionTotal: counters.taskCompletionTotal,
    planArchiveTotal: counters.planArchiveTotal,
    unassignedBacklogGauge: unassignedPlans,
  }
}

function buildDemoSnapshot(state: DemoWorkflowState): NursingServiceSnapshot {
  const normalizedState = syncDemoState(state)
  const schedule = buildDemoSchedule(normalizedState.plans)
  return {
    packages: normalizedState.packages,
    plans: normalizedState.plans,
    tasks: normalizedState.tasks,
    clockInRecords: normalizedState.clockInRecords,
    schedule,
    observability: buildDemoObservability(normalizedState.plans, normalizedState.tasks, normalizedState.counters, schedule.unassignedPlans),
    loading: false,
    error: '',
  }
}

function createDefaultDemoState(): DemoWorkflowState {
  const packages: ServicePackageRecord[] = [
    {
      id: 'pkg-night-guard',
      name: '夜间全护包',
      careLevel: '全护',
      targetGroup: '夜间离床高频、需重点巡视的老人',
      monthlyPrice: '¥4,200',
      settlementCycle: '月付',
      serviceScope: ['夜巡', '离床告警响应', '安抚记录'],
      addOns: ['家属夜间日报'],
      boundElders: 0,
      status: '已生效',
      createdAt: '2026-03-20 09:30',
      publishedAt: '2026-03-24 15:00',
      pricingNote: '运营已确认夜班加价口径。',
    },
    {
      id: 'pkg-rehab-boost',
      name: '康复强化包',
      careLevel: '专项康复',
      targetGroup: '术后恢复与步态训练老人',
      monthlyPrice: '¥5,600',
      settlementCycle: '月付',
      serviceScope: ['步态训练', '康复评估', '训练留痕'],
      addOns: ['外部康复师巡查'],
      boundElders: 0,
      status: '待发布',
      createdAt: '2026-03-25 11:10',
      publishedAt: null,
      pricingNote: '价格已复核，待护理主管确认。',
    },
    {
      id: 'pkg-memory-day',
      name: '记忆照护日护包',
      careLevel: '半自理',
      targetGroup: '白天需认知陪伴和活动提醒的老人',
      monthlyPrice: '¥3,200',
      settlementCycle: '双周结',
      serviceScope: ['白天提醒', '活动陪伴', '情绪安抚'],
      addOns: ['家属探视摘要'],
      boundElders: 0,
      status: '草稿',
      createdAt: '2026-03-28 14:20',
      publishedAt: null,
      pricingNote: null,
    },
    {
      id: 'pkg-comfort-plus',
      name: '舒缓陪护包',
      careLevel: '全护',
      targetGroup: '长期卧床和情绪安抚需求老人',
      monthlyPrice: '¥4,800',
      settlementCycle: '月付',
      serviceScope: ['翻身护理', '舒缓陪伴', '夜间巡视'],
      addOns: ['家属回执'],
      boundElders: 0,
      status: '已生效',
      createdAt: '2026-03-18 08:40',
      publishedAt: '2026-03-19 16:30',
      pricingNote: '按舒缓护理夜班系数计费。',
    },
  ]

  const plans: ServicePlanRecord[] = [
    {
      id: 'plan-zhang-night',
      elderlyName: '张秀英',
      room: '301-1',
      packageId: 'pkg-night-guard',
      packageName: '夜间全护包',
      careLevel: '全护',
      focus: '夜间离床告警响应与翻身巡视',
      shift: '晚班',
      ownerRole: '护工',
      ownerName: '李秋萍',
      riskTags: ['跌倒高风险', '夜间游走'],
      source: '套餐生成',
      status: '执行中',
      createdAt: '2026-03-29 09:10',
      reviewNote: '护理主管已确认夜班跟进。',
    },
    {
      id: 'plan-wang-comfort',
      elderlyName: '王桂兰',
      room: '210-2',
      packageId: 'pkg-comfort-plus',
      packageName: '舒缓陪护包',
      careLevel: '全护',
      focus: '晨间翻身护理与情绪安抚',
      shift: '早班',
      ownerRole: '护士',
      ownerName: '王秀兰',
      riskTags: ['压疮预警'],
      source: '套餐生成',
      status: '待复核',
      createdAt: '2026-03-31 13:40',
      reviewNote: '待主管确认责任班次。',
    },
    {
      id: 'plan-chen-rehab',
      elderlyName: '陈淑华',
      room: '215-1',
      packageId: 'pkg-rehab-boost',
      packageName: '康复强化包',
      careLevel: '专项康复',
      focus: '午后步态训练与康复观察补录',
      shift: '中班',
      ownerRole: '康复师',
      ownerName: '陈海川',
      riskTags: ['步态不稳'],
      source: '临时插单',
      status: '异常插单',
      createdAt: '2026-04-01 10:20',
      reviewNote: '临时插单，需补齐训练记录。',
    },
    {
      id: 'plan-liu-night',
      elderlyName: '刘美珍',
      room: '118-2',
      packageId: 'pkg-night-guard',
      packageName: '夜间全护包',
      careLevel: '全护',
      focus: '夜间睡眠安抚和巡房回执',
      shift: '夜班',
      ownerRole: '第三方护工',
      ownerName: '赵文静',
      riskTags: ['睡眠异常'],
      source: '套餐生成',
      status: '执行中',
      createdAt: '2026-03-30 16:00',
      reviewNote: '第三方夜班已确认接单。',
    },
    {
      id: 'plan-sun-archive',
      elderlyName: '孙桂芬',
      room: '203-1',
      packageId: 'pkg-comfort-plus',
      packageName: '舒缓陪护包',
      careLevel: '半自理',
      focus: '阶段性舒缓陪伴与家属回执',
      shift: '白班',
      ownerRole: '护士',
      ownerName: '王秀兰',
      riskTags: ['情绪波动'],
      source: '套餐生成',
      status: '已归档',
      createdAt: '2026-03-22 09:50',
      reviewNote: '阶段计划已完成并归档。',
    },
  ]

  const tasks: ServicePlanExecutionTaskItem[] = [
    createTaskFromPlan(plans[0], {
      id: 'task-zhang-night',
      status: '执行中',
      handledBy: '李秋萍',
      handledAt: '04-02 08:10',
      handledAtIso: '2026-04-02T08:10:00.000Z',
      actionNote: '夜间巡视已开始，重点关注离床告警。',
    }),
    createTaskFromPlan(plans[1], {
      id: 'task-wang-comfort',
      status: '待执行',
      actionNote: '待主管复核通过后执行。',
    }),
    createTaskFromPlan(plans[2], {
      id: 'task-chen-rehab',
      status: '执行中',
      handledBy: '陈海川',
      handledAt: '04-02 10:20',
      handledAtIso: '2026-04-02T10:20:00.000Z',
      actionNote: '临时插单已接单，待补录康复观察结果。',
    }),
    createTaskFromPlan(plans[3], {
      id: 'task-liu-night',
      status: '待执行',
      actionNote: '今晚 22:00 开始夜间巡视。',
    }),
    createTaskFromPlan(plans[4], {
      id: 'task-sun-archive',
      status: '已完成',
      handledBy: '王秀兰',
      handledAt: '04-01 17:30',
      handledAtIso: '2026-04-01T17:30:00.000Z',
      actionNote: '阶段性计划已完成并归档。',
    }),
  ]

  return syncDemoState({
    packages,
    plans,
    tasks,
    clockInRecords: [],
    counters: {
      auditRecords: 18,
      taskCompletionTotal: 7,
      planArchiveTotal: 4,
    },
  })
}

function readDemoStateFromStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    return syncDemoState(JSON.parse(raw) as DemoWorkflowState)
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

function persistDemoState(state: DemoWorkflowState) {
  const normalizedState = syncDemoState(state)
  demoStateCache = normalizedState

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedState))
  }

  return normalizedState
}

function getDemoState() {
  if (demoStateCache) {
    return cloneValue(demoStateCache)
  }

  const storedState = readDemoStateFromStorage()
  if (storedState) {
    demoStateCache = storedState
    return cloneValue(storedState)
  }

  const defaultState = createDefaultDemoState()
  demoStateCache = defaultState
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState))
  }
  return cloneValue(defaultState)
}

function applyDemoState(state: DemoWorkflowState) {
  const normalizedState = persistDemoState(state)
  snapshotState = buildDemoSnapshot(normalizedState)
  hasLoaded = true
  emit()
  return snapshotState
}

async function runDemoMutation(mutator: (state: DemoWorkflowState) => void) {
  const state = getDemoState()
  mutator(state)
  state.counters.auditRecords += 1
  return applyDemoState(state)
}

function getPackageOrThrow(state: DemoWorkflowState, id: string) {
  const item = state.packages.find(candidate => candidate.id === id)
  if (!item) {
    throw new Error('未找到对应的服务套餐。')
  }
  return item
}

function getPlanOrThrow(state: DemoWorkflowState, id: string) {
  const item = state.plans.find(candidate => candidate.id === id)
  if (!item) {
    throw new Error('未找到对应的服务计划。')
  }
  return item
}

function getTaskOrThrow(state: DemoWorkflowState, taskId: string) {
  const item = state.tasks.find(candidate => candidate.id === taskId)
  if (!item) {
    throw new Error('未找到对应的护理任务。')
  }
  return item
}

function buildGeneratedPlanDraft(state: DemoWorkflowState, packageRecord: ServicePackageRecord): ServicePlanRecord {
  const profile = AUTO_PLAN_PROFILES[state.plans.length % AUTO_PLAN_PROFILES.length]
  return {
    id: createId('plan'),
    elderlyName: profile.elderlyName,
    room: profile.room,
    packageId: packageRecord.id,
    packageName: packageRecord.name,
    careLevel: packageRecord.careLevel,
    focus: profile.focus,
    shift: profile.shift,
    ownerRole: profile.ownerRole,
    ownerName: profile.ownerName,
    riskTags: [...profile.riskTags],
    source: profile.source,
    status: '待复核',
    createdAt: toDisplayTime(new Date()),
    reviewNote: '由套餐一键生成，待主管复核。',
  }
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return null
  }

  return response.json()
}

async function requestWorkflow(path: string, init?: RequestInit) {
  const response = await fetch(`/api/nursing/workflow${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const payload = await readJsonResponse(response) as { detail?: string; title?: string; message?: string } | null
    throw new Error(payload?.detail ?? payload?.title ?? payload?.message ?? `workflow request failed: ${response.status}`)
  }

  return readJsonResponse(response)
}

function buildBffFallbackSnapshot(detail: string) {
  const fallbackSnapshot = buildDemoSnapshot(getDemoState())

  return {
    ...fallbackSnapshot,
    error: `${detail} 已自动回退到本地 Demo 视图。`,
  }
}

function normalizeSnapshot(payload: Partial<NursingServiceSnapshot> | null | undefined): NursingServiceSnapshot {
  return {
    packages: Array.isArray(payload?.packages) ? payload.packages : [],
    plans: Array.isArray(payload?.plans) ? payload.plans : [],
    tasks: Array.isArray(payload?.tasks) ? payload.tasks : [],
    clockInRecords: Array.isArray(payload?.clockInRecords) ? payload.clockInRecords : [],
    schedule: payload?.schedule ? {
      weekLabel: payload.schedule.weekLabel ?? '本周排班',
      activePlans: payload.schedule.activePlans ?? 0,
      pendingReviewPlans: payload.schedule.pendingReviewPlans ?? 0,
      unassignedPlans: payload.schedule.unassignedPlans ?? 0,
      thirdPartyAssignedPlans: payload.schedule.thirdPartyAssignedPlans ?? 0,
      publishedAssignments: payload.schedule.publishedAssignments ?? 0,
      shiftDemand: Array.isArray(payload.schedule.shiftDemand) ? payload.schedule.shiftDemand : [],
      staffRows: Array.isArray(payload.schedule.staffRows) ? payload.schedule.staffRows : [],
      daySummaries: Array.isArray(payload.schedule.daySummaries) ? payload.schedule.daySummaries : [],
      attentionPlans: Array.isArray(payload.schedule.attentionPlans) ? payload.schedule.attentionPlans : [],
    } : EMPTY_SNAPSHOT.schedule,
    observability: payload?.observability ? {
      pendingReviewPlans: payload.observability.pendingReviewPlans ?? 0,
      unassignedPlans: payload.observability.unassignedPlans ?? 0,
      archivedPlans: payload.observability.archivedPlans ?? 0,
      completedTasks: payload.observability.completedTasks ?? 0,
      auditRecords: payload.observability.auditRecords ?? 0,
      taskCompletionTotal: payload.observability.taskCompletionTotal ?? 0,
      planArchiveTotal: payload.observability.planArchiveTotal ?? 0,
      unassignedBacklogGauge: payload.observability.unassignedBacklogGauge ?? 0,
    } : EMPTY_SNAPSHOT.observability,
    loading: false,
    error: '',
  }
}

export function subscribeNursingServiceWorkflow(listener: () => void) {
  listeners.add(listener)
  if (typeof window !== 'undefined' && !hasLoaded && !snapshotState.loading) {
    void refreshNursingServiceWorkflow()
  }
  return () => listeners.delete(listener)
}

export function getNursingServiceSnapshot() {
  return snapshotState
}

export function getNursingWorkflowMode() {
  return WORKFLOW_MODE
}

export function isNursingWorkflowDemoMode() {
  return WORKFLOW_MODE === 'demo'
}

export async function resetNursingServiceWorkflowDemo() {
  if (WORKFLOW_MODE !== 'demo') {
    return refreshNursingServiceWorkflow()
  }

  demoStateCache = createDefaultDemoState()
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demoStateCache))
  }

  snapshotState = buildDemoSnapshot(demoStateCache)
  hasLoaded = true
  emit()
  return snapshotState
}

export async function refreshNursingServiceWorkflow() {
  if (inflightRefresh) {
    return inflightRefresh
  }

  if (WORKFLOW_MODE === 'demo') {
    snapshotState = {
      ...snapshotState,
      loading: true,
      error: '',
    }
    emit()

    inflightRefresh = Promise.resolve().then(() => {
      snapshotState = buildDemoSnapshot(getDemoState())
      hasLoaded = true
      emit()
      return snapshotState
    }).finally(() => {
      inflightRefresh = null
    })

    return inflightRefresh
  }

  if (bffFallbackActive && hasLoaded && Date.now() < nextBffRetryAt) {
    return Promise.resolve(snapshotState)
  }

  snapshotState = {
    ...snapshotState,
    loading: true,
    error: '',
  }
  emit()

  inflightRefresh = requestWorkflow('/board')
    .then(payload => {
      bffFallbackActive = false
      nextBffRetryAt = 0
      snapshotState = normalizeSnapshot(payload as Partial<NursingServiceSnapshot>)
      hasLoaded = true
      emit()
      return snapshotState
    })
    .catch(error => {
      const detail = error instanceof Error ? error.message : '护理工作流加载失败。'
      bffFallbackActive = true
      nextBffRetryAt = Date.now() + 30_000
      snapshotState = buildBffFallbackSnapshot(detail)
      hasLoaded = true
      emit()
      return snapshotState
    })
    .finally(() => {
      inflightRefresh = null
    })

  return inflightRefresh
}

export function validateServicePackageForm(form: ServicePackageFormState) {
  if (!form.name.trim() || !form.targetGroup.trim() || !form.monthlyPrice.trim() || splitList(form.serviceScope).length === 0) {
    return '请先补齐套餐名称、适用对象、月费和至少一个服务项。'
  }

  return ''
}

export function validateServicePlanForm(form: ServicePlanFormState) {
  if (!form.packageId.trim() || !form.elderlyName.trim() || !form.room.trim() || !form.focus.trim() || !form.ownerRole.trim() || !form.ownerName.trim()) {
    return '请先补齐来源套餐、老人、房间、计划重点、责任角色和责任人。'
  }

  return ''
}

export async function addServicePackageDraft(form: ServicePackageFormState) {
  if (WORKFLOW_MODE === 'demo') {
    return runDemoMutation(state => {
      state.packages.unshift({
        id: createId('pkg'),
        name: form.name.trim(),
        careLevel: form.careLevel,
        targetGroup: form.targetGroup.trim(),
        monthlyPrice: form.monthlyPrice.trim(),
        settlementCycle: form.settlementCycle.trim(),
        serviceScope: splitList(form.serviceScope),
        addOns: splitList(form.addOns),
        boundElders: 0,
        status: '草稿',
        createdAt: toDisplayTime(new Date()),
        publishedAt: null,
        pricingNote: null,
      })
    })
  }

  await requestWorkflow('/packages', {
    method: 'POST',
    body: JSON.stringify({
      name: form.name.trim(),
      careLevel: form.careLevel,
      targetGroup: form.targetGroup.trim(),
      monthlyPrice: form.monthlyPrice.trim(),
      settlementCycle: form.settlementCycle.trim(),
      serviceScope: splitList(form.serviceScope),
      addOns: splitList(form.addOns),
    }),
  })
  return refreshNursingServiceWorkflow()
}

export async function submitPackageForPricing(id: string) {
  if (WORKFLOW_MODE === 'demo') {
    return runDemoMutation(state => {
      const item = getPackageOrThrow(state, id)
      item.status = '待定价'
      item.pricingNote = '已提交运营定价复核。'
    })
  }

  await requestWorkflow(`/packages/${id}/actions/submit-pricing`, { method: 'POST', body: JSON.stringify({}) })
  return refreshNursingServiceWorkflow()
}

export async function completePackagePricing(id: string) {
  if (WORKFLOW_MODE === 'demo') {
    return runDemoMutation(state => {
      const item = getPackageOrThrow(state, id)
      item.status = '待发布'
      item.pricingNote = '定价已完成，待主管确认发布。'
    })
  }

  await requestWorkflow(`/packages/${id}/actions/complete-pricing`, { method: 'POST', body: JSON.stringify({}) })
  return refreshNursingServiceWorkflow()
}

export async function publishServicePackage(id: string) {
  if (WORKFLOW_MODE === 'demo') {
    return runDemoMutation(state => {
      const item = getPackageOrThrow(state, id)
      item.status = '已生效'
      item.publishedAt = toDisplayTime(new Date())
      item.pricingNote = '已进入 demo 生效状态，可生成计划。'
    })
  }

  await requestWorkflow(`/packages/${id}/actions/publish`, { method: 'POST', body: JSON.stringify({}) })
  return refreshNursingServiceWorkflow()
}

export async function retireServicePackage(id: string) {
  if (WORKFLOW_MODE === 'demo') {
    return runDemoMutation(state => {
      const item = getPackageOrThrow(state, id)
      item.status = '已下线'
      item.pricingNote = '已从 demo 在售列表移除，保留历史记录。'
    })
  }

  await requestWorkflow(`/packages/${id}/actions/retire`, { method: 'POST', body: JSON.stringify({}) })
  return refreshNursingServiceWorkflow()
}

export async function addServicePlanDraft(form: ServicePlanFormState) {
  if (WORKFLOW_MODE === 'demo') {
    return runDemoMutation(state => {
      const packageRecord = getPackageOrThrow(state, form.packageId)
      state.plans.unshift({
        id: createId('plan'),
        elderlyName: form.elderlyName.trim(),
        room: form.room.trim(),
        packageId: packageRecord.id,
        packageName: packageRecord.name,
        careLevel: packageRecord.careLevel,
        focus: form.focus.trim(),
        shift: form.shift.trim(),
        ownerRole: form.ownerRole.trim(),
        ownerName: form.ownerName.trim(),
        riskTags: splitList(form.riskTags),
        source: form.source,
        status: '待复核',
        createdAt: toDisplayTime(new Date()),
        reviewNote: '已创建 demo 计划草稿，待主管复核。',
      })
    })
  }

  await requestWorkflow('/plans', {
    method: 'POST',
    body: JSON.stringify({
      packageId: form.packageId,
      elderlyName: form.elderlyName.trim(),
      room: form.room.trim(),
      focus: form.focus.trim(),
      shift: form.shift.trim(),
      ownerRole: form.ownerRole.trim(),
      ownerName: form.ownerName.trim(),
      riskTags: splitList(form.riskTags),
      source: form.source,
    }),
  })
  return refreshNursingServiceWorkflow()
}

export async function createPlanFromPackage(id: string) {
  if (WORKFLOW_MODE === 'demo') {
    return runDemoMutation(state => {
      const packageRecord = getPackageOrThrow(state, id)
      state.plans.unshift(buildGeneratedPlanDraft(state, packageRecord))
    })
  }

  await requestWorkflow(`/packages/${id}/plans`, { method: 'POST', body: JSON.stringify({}) })
  return refreshNursingServiceWorkflow()
}

export async function reviewServicePlan(id: string) {
  if (WORKFLOW_MODE === 'demo') {
    return runDemoMutation(state => {
      const item = getPlanOrThrow(state, id)
      item.status = '执行中'
      item.reviewNote = '主管已复核，计划进入执行。'
    })
  }

  await requestWorkflow(`/plans/${id}/actions/review`, { method: 'POST', body: JSON.stringify({}) })
  return refreshNursingServiceWorkflow()
}

export async function markPlanException(id: string) {
  if (WORKFLOW_MODE === 'demo') {
    return runDemoMutation(state => {
      const item = getPlanOrThrow(state, id)
      item.status = '异常插单'
      item.reviewNote = '计划已转异常插单，待补录处置说明。'
    })
  }

  await requestWorkflow(`/plans/${id}/actions/mark-exception`, { method: 'POST', body: JSON.stringify({}) })
  return refreshNursingServiceWorkflow()
}

export async function archiveServicePlan(id: string) {
  if (WORKFLOW_MODE === 'demo') {
    return runDemoMutation(state => {
      const item = getPlanOrThrow(state, id)
      if (item.status !== '已归档') {
        state.counters.planArchiveTotal += 1
      }
      item.status = '已归档'
      item.reviewNote = '计划已在 demo 流程中归档。'
    })
  }

  await requestWorkflow(`/plans/${id}/actions/archive`, { method: 'POST', body: JSON.stringify({}) })
  return refreshNursingServiceWorkflow()
}

export async function startServicePlanTask(taskId: string, handledBy = '当班护理员', actionNote = '已接收服务计划，进入执行。') {
  if (WORKFLOW_MODE === 'demo') {
    return runDemoMutation(state => {
      const task = getTaskOrThrow(state, taskId)
      const plan = getPlanOrThrow(state, task.planId)
      const timestamp = new Date()
      plan.status = '执行中'
      plan.reviewNote = '任务已被领取，计划执行中。'
      task.status = '执行中'
      task.handledBy = handledBy
      task.handledAt = toDisplayTime(timestamp)
      task.handledAtIso = timestamp.toISOString()
      task.actionNote = actionNote
    })
  }

  await requestWorkflow(`/tasks/${taskId}/start`, {
    method: 'POST',
    body: JSON.stringify({ handledBy, actionNote }),
  })
  return refreshNursingServiceWorkflow()
}

export async function completeServicePlanTask(taskId: string, handledBy = '责任护士', actionNote = '服务计划已执行完毕并归档。') {
  if (WORKFLOW_MODE === 'demo') {
    return runDemoMutation(state => {
      const task = getTaskOrThrow(state, taskId)
      const plan = getPlanOrThrow(state, task.planId)
      const timestamp = new Date()
      if (task.status !== '已完成') {
        state.counters.taskCompletionTotal += 1
      }
      if (plan.status !== '已归档') {
        state.counters.planArchiveTotal += 1
      }
      task.status = '已完成'
      task.handledBy = handledBy
      task.handledAt = toDisplayTime(timestamp)
      task.handledAtIso = timestamp.toISOString()
      task.actionNote = actionNote
      plan.status = '已归档'
      plan.reviewNote = '任务执行闭环完成，计划已归档。'
    })
  }

  await requestWorkflow(`/tasks/${taskId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ handledBy, actionNote }),
  })
  return refreshNursingServiceWorkflow()
}

export async function saveServicePlanTaskAuditNote(
  taskId: string,
  status: ServicePlanTaskStatus,
  actionNote: string,
  handledBy?: string,
  handledAt?: string,
  handledAtIso?: string,
) {
  if (WORKFLOW_MODE === 'demo') {
    return runDemoMutation(state => {
      const task = getTaskOrThrow(state, taskId)
      const plan = getPlanOrThrow(state, task.planId)
      if (status === '已完成' && task.status !== '已完成') {
        state.counters.taskCompletionTotal += 1
      }
      if (status === '已完成' && plan.status !== '已归档') {
        state.counters.planArchiveTotal += 1
      }

      task.status = status
      task.actionNote = actionNote
      task.handledBy = handledBy ?? task.handledBy
      task.handledAt = handledAt ?? task.handledAt
      task.handledAtIso = handledAtIso ?? task.handledAtIso

      if (status === '已完成') {
        plan.status = '已归档'
        plan.reviewNote = '已通过任务备注直接闭环归档。'
      } else if (status === '执行中') {
        plan.status = '执行中'
        plan.reviewNote = '执行备注已更新。'
      }
    })
  }

  await requestWorkflow(`/tasks/${taskId}/note`, {
    method: 'PUT',
    body: JSON.stringify({ status, actionNote, handledBy, handledAt, handledAtIso }),
  })
  return refreshNursingServiceWorkflow()
}

function getClockInRecordOrThrow(state: DemoWorkflowState, recordId: string) {
  const record = state.clockInRecords.find(item => item.id === recordId)
  if (!record) {
    throw new Error('打卡记录不存在。')
  }
  return record
}

export async function reviewServiceClockInRecord(
  recordId: string,
  reviewedBy = '值班主管',
  reviewNote = '已核对到场与闭环说明，允许纳入当班统计。',
) {
  if (WORKFLOW_MODE === 'demo') {
    return runDemoMutation(state => {
      const record = getClockInRecordOrThrow(state, recordId)
      const timestamp = new Date()
      record.status = '已确认'
      record.reviewedBy = reviewedBy
      record.reviewedAt = toDisplayTime(timestamp)
      record.reviewedAtIso = timestamp.toISOString()
      record.reviewNote = reviewNote
    })
  }

  await requestWorkflow(`/clockins/${recordId}/review`, {
    method: 'POST',
    body: JSON.stringify({ reviewedBy, reviewNote }),
  })
  return refreshNursingServiceWorkflow()
}

export function getServicePlanExecutionTasks() {
  return snapshotState.tasks
}

export function getScheduleCoverageSummary(): ScheduleCoverageSummary {
  return {
    activePlans: snapshotState.schedule.activePlans,
    pendingReviewPlans: snapshotState.schedule.pendingReviewPlans,
    unassignedPlans: snapshotState.schedule.unassignedPlans,
    thirdPartyAssignedPlans: snapshotState.schedule.thirdPartyAssignedPlans,
    shiftDemand: snapshotState.schedule.shiftDemand,
    staffCoverage: snapshotState.schedule.staffRows.map(item => ({
      staffId: item.staffId,
      staffName: item.staffName,
      role: item.staffRole,
      employmentSource: item.employmentSource,
      assignedPlans: item.assignedPlans,
      exceptionPlans: item.exceptionPlans,
      pendingReviewPlans: item.pendingReviewPlans,
      shiftDemand: item.cells.reduce<Record<string, number>>((accumulator, cell) => {
        cell.assignments.forEach(assignment => {
          accumulator[assignment.shift] = (accumulator[assignment.shift] ?? 0) + 1
        })
        return accumulator
      }, {}),
    })),
    attentionPlans: snapshotState.schedule.attentionPlans,
  }
}
