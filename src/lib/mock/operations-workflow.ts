export type ActivityLifecycleStatus = '待发布' | '已发布'

export type IncidentWorkflowStatus = '待分派' | '处理中' | '已结案'

export interface LiveActivity {
  id: string
  name: string
  category: string
  date: string
  time: string
  duration: number
  participants: number
  capacity: number
  location: string
  status: '待发布' | '报名中' | '进行中' | '已完成'
  teacher: string
  desc: string
  lifecycleStatus: ActivityLifecycleStatus
  createdAt: string
  publishedAt?: string
  publishNote?: string
}

export interface LiveIncident {
  id: string
  title: string
  level: '严重' | '一般' | '轻微'
  elder: string | null
  room: string
  reporter: string
  reporterRole: string
  time: string
  status: IncidentWorkflowStatus
  desc: string
  handling: string[]
  nextStep: string | null
  attachments: string[]
  createdAt: string
  assignedAt?: string
  closedAt?: string
  statusNote?: string
}

export interface ActivityCreateFormState {
  name: string
  category: string
  date: string
  time: string
  duration: string
  capacity: string
  location: string
  teacher: string
  desc: string
}

export interface IncidentCreateFormState {
  title: string
  level: LiveIncident['level']
  elder: string
  room: string
  reporter: string
  reporterRole: string
  time: string
  desc: string
  attachments: string
  nextStep: string
}

interface OperationsWorkflowState {
  activityDrafts: LiveActivity[]
  incidentEntries: LiveIncident[]
}

export interface OperationsSnapshot {
  activities: LiveActivity[]
  incidents: LiveIncident[]
}

export const OPERATIONS_TODAY = '2026-03-29'

export const EMPTY_ACTIVITY_FORM: ActivityCreateFormState = {
  name: '',
  category: '',
  date: OPERATIONS_TODAY,
  time: '09:00',
  duration: '60',
  capacity: '20',
  location: '',
  teacher: '',
  desc: '',
}

export const EMPTY_INCIDENT_FORM: IncidentCreateFormState = {
  title: '',
  level: '一般',
  elder: '',
  room: '',
  reporter: '',
  reporterRole: '值班护士',
  time: `${OPERATIONS_TODAY}T10:00`,
  desc: '',
  attachments: '',
  nextStep: '',
}

const STORAGE_KEY = 'nursing-admin-v2/operations-workflow'

const BASE_ACTIVITIES: LiveActivity[] = [
  {
    id: 'A001',
    name: '太极晨练',
    category: '运动健身',
    date: '2026-03-29',
    time: '07:00',
    duration: 60,
    participants: 28,
    capacity: 30,
    location: '院内花园',
    status: '进行中',
    teacher: '李老师',
    desc: '每日早晨在花园进行太极拳锻炼，帮助老人舒筋活络、稳定情绪并维持晨间作息。',
    lifecycleStatus: '已发布',
    createdAt: '2026-03-20 09:00',
    publishedAt: '2026-03-21 10:00',
    publishNote: '已同步至院内活动台账与报名看板。',
  },
  {
    id: 'A002',
    name: '手工编织课',
    category: '文娱活动',
    date: '2026-03-29',
    time: '09:00',
    duration: 90,
    participants: 15,
    capacity: 20,
    location: '三楼活动室',
    status: '报名中',
    teacher: '王老师',
    desc: '组织老人完成简单编织作品，锻炼手部精细动作并提升社交参与感。',
    lifecycleStatus: '已发布',
    createdAt: '2026-03-22 14:00',
    publishedAt: '2026-03-23 09:30',
    publishNote: '已通知护理班组协助组织报名。',
  },
  {
    id: 'A003',
    name: '健康讲座',
    category: '健康教育',
    date: '2026-03-29',
    time: '14:00',
    duration: 120,
    participants: 42,
    capacity: 50,
    location: '二楼会议室',
    status: '报名中',
    teacher: '周医生',
    desc: '由医护团队讲解春季慢病管理和日常用药注意事项，并预留问答时间。',
    lifecycleStatus: '已发布',
    createdAt: '2026-03-18 13:00',
    publishedAt: '2026-03-20 08:30',
    publishNote: '已同步医务室讲座排期。',
  },
  {
    id: 'A004',
    name: '棋牌活动',
    category: '文娱活动',
    date: '2026-03-28',
    time: '15:00',
    duration: 120,
    participants: 18,
    capacity: 20,
    location: '一楼棋牌室',
    status: '已完成',
    teacher: '陈老师',
    desc: '结合象棋、围棋和扑克牌互动，帮助老人进行轻度认知训练与陪伴活动。',
    lifecycleStatus: '已发布',
    createdAt: '2026-03-15 11:20',
    publishedAt: '2026-03-16 16:10',
    publishNote: '活动总结已归档。',
  },
  {
    id: 'A005',
    name: '生日会',
    category: '节日活动',
    date: '2026-03-30',
    time: '15:00',
    duration: 90,
    participants: 0,
    capacity: 60,
    location: '多功能厅',
    status: '报名中',
    teacher: '活动运营组',
    desc: '为本月寿星准备集体庆生活动，联动餐饮、护理和家属探访时间。',
    lifecycleStatus: '已发布',
    createdAt: '2026-03-24 09:40',
    publishedAt: '2026-03-25 10:10',
    publishNote: '已发出家属邀请提醒。',
  },
]

const BASE_INCIDENTS: LiveIncident[] = [
  {
    id: 'I001',
    title: '老人摔倒',
    level: '严重',
    elder: '张桂英',
    room: '201-1',
    reporter: '刘建国',
    reporterRole: '护工',
    time: '2026-03-28 16:30',
    status: '处理中',
    desc: '老人在如厕时不慎摔倒，右臂有擦伤，血压偏高。发现后立即通知医护，已送医处理，X 光显示无骨折。',
    handling: ['发现后立即通知医护', '已送至仁济医院急诊', '联系家属告知情况', '安排 24 小时特护'],
    nextStep: '持续观察，3 天后复诊。',
    attachments: ['现场照片.jpg', '病历卡扫描件.pdf'],
    createdAt: '2026-03-28 16:30',
    assignedAt: '2026-03-28 16:38',
    statusNote: '已由值班主管接手，等待复诊结果。',
  },
  {
    id: 'I002',
    title: '设备故障',
    level: '一般',
    elder: null,
    room: '三楼走廊',
    reporter: '赵晓敏',
    reporterRole: '护士',
    time: '2026-03-27 09:15',
    status: '已结案',
    desc: '三楼走廊照明灯故障，影响夜间巡查。已联系后勤维修，当日下午修复完成。',
    handling: ['联系后勤部门报修', '临时增加手电筒照明', '后勤维修人员当天修复', '验收确认恢复正常'],
    nextStep: null,
    attachments: ['故障现场.jpg'],
    createdAt: '2026-03-27 09:15',
    assignedAt: '2026-03-27 09:22',
    closedAt: '2026-03-27 17:10',
    statusNote: '维修完成并通过夜间巡查复核。',
  },
  {
    id: 'I003',
    title: '老人走失',
    level: '严重',
    elder: '王建国',
    room: '203-2',
    reporter: '陈美华',
    reporterRole: '护士长',
    time: '2026-03-26 14:00',
    status: '已结案',
    desc: '老人趁午休时间私自外出，14:00 被发现不在房间。启动应急预案，30 分钟后在附近公园找到，老人安全。',
    handling: ['14:05 启动走失应急预案', '联系家属确认老人去向', '调取监控确认外出方向', '30 分钟后在公园找到'],
    nextStep: '加强门禁管理，增设离院报警。',
    attachments: ['监控截图.jpg', '找回照片.jpg'],
    createdAt: '2026-03-26 14:00',
    assignedAt: '2026-03-26 14:05',
    closedAt: '2026-03-26 18:40',
    statusNote: '已纳入门禁与巡查复盘。',
  },
  {
    id: 'I004',
    title: '食物过敏',
    level: '轻微',
    elder: '李秀兰',
    room: '205-1',
    reporter: '孙晓洁',
    reporterRole: '护士',
    time: '2026-03-25 12:00',
    status: '已结案',
    desc: '午餐后老人出现轻度皮疹，医务室立即处理后症状好转，餐饮组已复核当餐配料。',
    handling: ['医务室进行对症处理', '通知餐饮组复核配料', '更新老人饮食禁忌清单'],
    nextStep: null,
    attachments: ['处置记录.jpg'],
    createdAt: '2026-03-25 12:00',
    assignedAt: '2026-03-25 12:08',
    closedAt: '2026-03-25 18:00',
    statusNote: '饮食禁忌已同步餐饮台账。',
  },
]

function nowStamp() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

function splitList(value: string) {
  return value
    .split(/[，,、\n]/)
    .map(item => item.trim())
    .filter(Boolean)
}

function normalizeEventTime(value: string) {
  return value.replace('T', ' ').trim()
}

function toDateTimeValue(date: string, time: string) {
  return `${date} ${time}`
}

function sortActivities(items: LiveActivity[]) {
  return [...items].sort((left, right) => toDateTimeValue(left.date, left.time).localeCompare(toDateTimeValue(right.date, right.time)))
}

function sortIncidents(items: LiveIncident[]) {
  return [...items].sort((left, right) => right.time.localeCompare(left.time))
}

function createInitialState(): OperationsWorkflowState {
  return {
    activityDrafts: [],
    incidentEntries: [],
  }
}

let workflowState = createInitialState()
let hydrated = false
const listeners = new Set<() => void>()
let cachedSnapshotState: OperationsWorkflowState | undefined
let cachedSnapshot: OperationsSnapshot | undefined

function persistState() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workflowState))
}

function hydrateState() {
  if (typeof window === 'undefined' || hydrated) {
    return
  }

  hydrated = true
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    persistState()
    return
  }

  try {
    const parsed = JSON.parse(raw) as OperationsWorkflowState
    workflowState = {
      activityDrafts: Array.isArray(parsed.activityDrafts) ? parsed.activityDrafts : [],
      incidentEntries: Array.isArray(parsed.incidentEntries) ? parsed.incidentEntries : [],
    }
  } catch {
    workflowState = createInitialState()
    persistState()
  }
}

function notifyListeners() {
  persistState()
  listeners.forEach(listener => listener())
}

function getLiveActivitiesFromState(state: OperationsWorkflowState) {
  return sortActivities([...state.activityDrafts, ...BASE_ACTIVITIES])
}

function getLiveIncidentsFromState(state: OperationsWorkflowState) {
  const incidentMap = new Map(BASE_INCIDENTS.map(item => [item.id, item]))
  state.incidentEntries.forEach(item => {
    incidentMap.set(item.id, item)
  })
  return sortIncidents(Array.from(incidentMap.values()))
}

function upsertIncidentEntry(incident: LiveIncident) {
  workflowState = {
    ...workflowState,
    incidentEntries: [incident, ...workflowState.incidentEntries.filter(item => item.id !== incident.id)],
  }
}

function updateIncidentRecord(id: string, updater: (current: LiveIncident) => LiveIncident) {
  const current = getOperationsSnapshot().incidents.find(item => item.id === id)
  if (!current) {
    return undefined
  }

  const next = updater(current)
  upsertIncidentEntry(next)
  notifyListeners()
  return next
}

export function subscribeOperationsWorkflow(listener: () => void) {
  hydrateState()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getOperationsSnapshot(): OperationsSnapshot {
  hydrateState()

  if (cachedSnapshot && cachedSnapshotState === workflowState) {
    return cachedSnapshot
  }

  cachedSnapshot = {
    activities: getLiveActivitiesFromState(workflowState),
    incidents: getLiveIncidentsFromState(workflowState),
  }
  cachedSnapshotState = workflowState

  return cachedSnapshot
}

export function validateActivityForm(form: ActivityCreateFormState) {
  if (!form.name.trim() || !form.category.trim() || !form.date.trim() || !form.time.trim() || !form.duration.trim() || !form.capacity.trim() || !form.location.trim() || !form.teacher.trim()) {
    return '请先补齐活动名称、分类、日期、时间、时长、容量、地点和负责人。'
  }

  const duration = Number(form.duration)
  if (Number.isNaN(duration) || duration < 15 || duration > 240) {
    return '活动时长需填写为 15 到 240 分钟之间的有效数字。'
  }

  const capacity = Number(form.capacity)
  if (Number.isNaN(capacity) || capacity < 1 || capacity > 300) {
    return '活动容量需填写为 1 到 300 人之间的有效数字。'
  }

  return ''
}

export function validateIncidentForm(form: IncidentCreateFormState) {
  if (!form.title.trim() || !form.room.trim() || !form.reporter.trim() || !form.reporterRole.trim() || !form.time.trim() || !form.desc.trim()) {
    return '请先补齐事件标题、发生地点、报告人、报告人角色、发生时间和事件描述。'
  }

  if (form.level === '严重' && !form.nextStep.trim()) {
    return '严重事件请补充下一步跟进动作，便于值班主管快速分派。'
  }

  return ''
}

export function addActivityDraft(form: ActivityCreateFormState) {
  hydrateState()
  const draft: LiveActivity = {
    id: `A${Date.now().toString().slice(-4)}`,
    name: form.name.trim(),
    category: form.category.trim(),
    date: form.date,
    time: form.time,
    duration: Number(form.duration),
    participants: 0,
    capacity: Number(form.capacity),
    location: form.location.trim(),
    status: '待发布',
    teacher: form.teacher.trim(),
    desc: form.desc.trim() || '待补充活动说明。',
    lifecycleStatus: '待发布',
    createdAt: nowStamp(),
  }

  workflowState = {
    ...workflowState,
    activityDrafts: [draft, ...workflowState.activityDrafts.filter(item => item.id !== draft.id)],
  }
  notifyListeners()
  return draft
}

export function publishActivityDraft(id: string, publishNote = '活动排期已复核，允许进入报名和执行台账。') {
  hydrateState()
  let updated: LiveActivity | undefined
  workflowState = {
    ...workflowState,
    activityDrafts: workflowState.activityDrafts.map(item => {
      if (item.id !== id) {
        return item
      }

      updated = {
        ...item,
        lifecycleStatus: '已发布',
        status: '报名中',
        publishedAt: nowStamp(),
        publishNote,
      }
      return updated
    }),
  }
  notifyListeners()
  return updated
}

export function addIncidentDraft(form: IncidentCreateFormState) {
  hydrateState()
  const incident: LiveIncident = {
    id: `I${Date.now().toString().slice(-4)}`,
    title: form.title.trim(),
    level: form.level,
    elder: form.elder.trim() || null,
    room: form.room.trim(),
    reporter: form.reporter.trim(),
    reporterRole: form.reporterRole.trim(),
    time: normalizeEventTime(form.time),
    status: '待分派',
    desc: form.desc.trim(),
    handling: ['已登记事故初报，等待值班主管分派。'],
    nextStep: form.nextStep.trim() || '请补充责任人、处置动作和复核时间。',
    attachments: splitList(form.attachments),
    createdAt: nowStamp(),
    statusNote: '新建报告已进入待分派闭环。',
  }

  upsertIncidentEntry(incident)
  notifyListeners()
  return incident
}

export function startIncidentHandling(id: string, handlingNote = '已分派值班负责人并启动现场处置。') {
  return updateIncidentRecord(id, current => {
    if (current.status === '已结案') {
      return current
    }

    return {
      ...current,
      status: '处理中',
      handling: current.handling.includes(handlingNote) ? current.handling : [...current.handling, handlingNote],
      nextStep: current.nextStep || '补充家属通知、复核时间和复盘动作。',
      assignedAt: current.assignedAt ?? nowStamp(),
      statusNote: handlingNote,
    }
  })
}

export function closeIncident(id: string, closureNote = '已完成处置、通知和复盘，允许结案。') {
  return updateIncidentRecord(id, current => {
    if (current.status === '已结案') {
      return current
    }

    return {
      ...current,
      status: '已结案',
      handling: current.handling.includes(closureNote) ? current.handling : [...current.handling, closureNote],
      nextStep: null,
      closedAt: nowStamp(),
      statusNote: closureNote,
    }
  })
}

export function getActivityStats(activities: LiveActivity[]) {
  const todayActivities = activities.filter(item => item.date === OPERATIONS_TODAY)
  return {
    total: activities.length,
    todayCount: todayActivities.length,
    todayParticipants: todayActivities.reduce((sum, item) => sum + item.participants, 0),
    inProgress: todayActivities.filter(item => item.status === '进行中').length,
    pendingPublication: activities.filter(item => item.lifecycleStatus === '待发布').length,
  }
}

export function getIncidentStats(incidents: LiveIncident[]) {
  return {
    total: incidents.length,
    severe: incidents.filter(item => item.level === '严重').length,
    pending: incidents.filter(item => item.status === '待分派').length,
    processing: incidents.filter(item => item.status === '处理中').length,
    closed: incidents.filter(item => item.status === '已结案').length,
  }
}

export function findLiveActivityById(id: string, snapshot = getOperationsSnapshot()) {
  return snapshot.activities.find(item => item.id === id)
}

export function findLiveIncidentById(id: string, snapshot = getOperationsSnapshot()) {
  return snapshot.incidents.find(item => item.id === id)
}

export function resetOperationsWorkflowMock() {
  workflowState = createInitialState()
  hydrated = true
  notifyListeners()
}