import { elderlyList } from '@/lib/data'

export type HealthArchiveLifecycleStatus = '待建档' | '已建档'
export type VisitLifecycleStatus = '待审核' | '已审核'

export interface HealthArchiveRecord {
  id: string
  elderlyId: string
  name: string
  room: string
  age: number
  bp: string
  hr: number
  temp: number
  bloodSugar: number
  o2: number
  lastCheck: string
  alert: string | null
  lifecycleStatus: HealthArchiveLifecycleStatus
  createdAt: string
  archiveNote?: string
}

export interface VitalEntryRecord {
  id: string
  elderlyId: string
  elder: string
  room: string
  bp: string
  hr: number
  temp: number
  spo2: number
  bloodSugar: number
  recordedBy: string
  time: string
  createdAt: string
  entryNote?: string
}

export interface VisitAppointmentRecord {
  id: string
  elderlyId: string
  elder: string
  room: string
  visitor: string
  relation: string
  phone: string
  date: string
  time: string
  type: '现场' | '视频'
  status: '待审核' | '已登记' | '已完成'
  lifecycleStatus: VisitLifecycleStatus
  createdAt: string
  approvalNote?: string
}

export interface HealthArchiveCreateFormState {
  elderlyId: string
  bp: string
  hr: string
  temp: string
  bloodSugar: string
  o2: string
  alert: string
}

export interface VitalsCreateFormState {
  elderlyId: string
  bp: string
  hr: string
  temp: string
  spo2: string
  bloodSugar: string
  recordedBy: string
  time: string
}

export interface VisitCreateFormState {
  elderlyId: string
  visitor: string
  relation: string
  phone: string
  date: string
  time: string
  type: '现场' | '视频'
}

interface CareServiceWorkflowState {
  healthArchives: HealthArchiveRecord[]
  vitalsEntries: VitalEntryRecord[]
  visits: VisitAppointmentRecord[]
}

export interface CareServiceSnapshot {
  healthArchives: HealthArchiveRecord[]
  vitalsEntries: VitalEntryRecord[]
  visits: VisitAppointmentRecord[]
}

export const EMPTY_HEALTH_ARCHIVE_FORM: HealthArchiveCreateFormState = {
  elderlyId: '',
  bp: '',
  hr: '',
  temp: '',
  bloodSugar: '',
  o2: '',
  alert: '',
}

export const EMPTY_VITALS_FORM: VitalsCreateFormState = {
  elderlyId: '',
  bp: '',
  hr: '',
  temp: '',
  spo2: '',
  bloodSugar: '',
  recordedBy: '',
  time: '08:30',
}

export const EMPTY_VISIT_FORM: VisitCreateFormState = {
  elderlyId: '',
  visitor: '',
  relation: '',
  phone: '',
  date: new Date().toISOString().slice(0, 10),
  time: '14:30',
  type: '现场',
}

const STORAGE_KEY = 'nursing-admin-v2/care-service-workflow'

const BASE_HEALTH_ARCHIVES: HealthArchiveRecord[] = [
  { id: 'HR001', elderlyId: 'E001', name: '张桂英', room: '201-1', age: 82, bp: '135/85', hr: 72, temp: 36.5, bloodSugar: 5.8, o2: 97, lastCheck: '2026-03-28', alert: '血压偏高', lifecycleStatus: '已建档', createdAt: '2026-03-28' },
  { id: 'HR002', elderlyId: 'E002', name: '王建国', room: '203-2', age: 78, bp: '120/78', hr: 68, temp: 36.4, bloodSugar: 6.1, o2: 98, lastCheck: '2026-03-27', alert: null, lifecycleStatus: '已建档', createdAt: '2026-03-27' },
  { id: 'HR003', elderlyId: 'E003', name: '李秀兰', room: '205-1', age: 85, bp: '128/82', hr: 65, temp: 36.8, bloodSugar: 7.2, o2: 95, lastCheck: '2026-03-25', alert: '血糖偏高', lifecycleStatus: '已建档', createdAt: '2026-03-25' },
  { id: 'HR004', elderlyId: 'E004', name: '赵德明', room: '202-1', age: 80, bp: '118/75', hr: 70, temp: 36.3, bloodSugar: 5.4, o2: 99, lastCheck: '2026-03-26', alert: null, lifecycleStatus: '已建档', createdAt: '2026-03-26' },
]

const BASE_VITALS: VitalEntryRecord[] = [
  { id: 'V001', elderlyId: 'E001', elder: '张桂英', room: '201-1', bp: '135/85', hr: 72, temp: 36.5, spo2: 97, bloodSugar: 5.8, recordedBy: '陈美华', time: '08:30', createdAt: '2026-03-29 08:30' },
  { id: 'V002', elderlyId: 'E002', elder: '王建国', room: '203-2', bp: '120/78', hr: 68, temp: 36.4, spo2: 98, bloodSugar: 6.1, recordedBy: '刘建国', time: '08:25', createdAt: '2026-03-29 08:25' },
  { id: 'V003', elderlyId: 'E003', elder: '李秀兰', room: '205-1', bp: '128/82', hr: 65, temp: 36.8, spo2: 95, bloodSugar: 7.2, recordedBy: '赵晓敏', time: '08:20', createdAt: '2026-03-29 08:20' },
  { id: 'V004', elderlyId: 'E004', elder: '赵德明', room: '202-1', bp: '118/75', hr: 70, temp: 36.3, spo2: 99, bloodSugar: 5.4, recordedBy: '陈美华', time: '08:15', createdAt: '2026-03-29 08:15' },
  { id: 'V005', elderlyId: 'E005', elder: '周桂芳', room: '203-1', bp: '122/80', hr: 73, temp: 36.6, spo2: 96, bloodSugar: 5.9, recordedBy: '刘建国', time: '08:10', createdAt: '2026-03-29 08:10' },
]

const BASE_VISITS: VisitAppointmentRecord[] = [
  { id: 'VS001', elderlyId: 'E001', elder: '张桂英', room: '201-1', visitor: '张伟', relation: '儿子', phone: '13900001234', date: '2026-03-29', time: '14:30', type: '现场', status: '已完成', lifecycleStatus: '已审核', createdAt: '2026-03-28 10:00' },
  { id: 'VS002', elderlyId: 'E002', elder: '王建国', room: '203-2', visitor: '王芳', relation: '女儿', phone: '13900005678', date: '2026-03-29', time: '15:00', type: '现场', status: '已登记', lifecycleStatus: '已审核', createdAt: '2026-03-28 10:15' },
  { id: 'VS003', elderlyId: 'E003', elder: '李秀兰', room: '205-1', visitor: '李强', relation: '儿子', phone: '13900009012', date: '2026-03-28', time: '10:00', type: '视频', status: '已完成', lifecycleStatus: '已审核', createdAt: '2026-03-27 11:00' },
  { id: 'VS004', elderlyId: 'E004', elder: '赵德明', room: '202-1', visitor: '赵丽', relation: '儿媳', phone: '13900003456', date: '2026-03-28', time: '16:00', type: '现场', status: '已完成', lifecycleStatus: '已审核', createdAt: '2026-03-27 14:00' },
  { id: 'VS005', elderlyId: 'E005', elder: '周桂芳', room: '203-1', visitor: '周明', relation: '儿子', phone: '13900007890', date: '2026-03-30', time: '09:00', type: '现场', status: '待审核', lifecycleStatus: '待审核', createdAt: '2026-03-29 09:30' },
]

function nowDate() {
  return new Date().toISOString().slice(0, 10)
}

function nowStamp() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

function resolveElderProfile(id: string) {
  const elder = elderlyList.find(item => item.id === id)
  return elder
    ? {
        elderlyId: elder.id,
        name: elder.name,
        room: `${elder.roomNumber}-${elder.bedNumber}`,
        age: elder.age,
      }
    : {
        elderlyId: id,
        name: '待补录老人',
        room: '待分配',
        age: 80,
      }
}

function createInitialState(): CareServiceWorkflowState {
  return {
    healthArchives: [],
    vitalsEntries: [],
    visits: [],
  }
}

function mergeById<T extends { id: string; createdAt: string }>(base: readonly T[], overrides: readonly T[]) {
  const map = new Map(base.map(item => [item.id, item]))
  overrides.forEach(item => map.set(item.id, item))
  return Array.from(map.values()).sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

let workflowState = createInitialState()
let hydrated = false
const listeners = new Set<() => void>()
let cachedSnapshotState: CareServiceWorkflowState | undefined
let cachedSnapshot: CareServiceSnapshot | undefined

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
    const parsed = JSON.parse(raw) as CareServiceWorkflowState
    workflowState = {
      healthArchives: Array.isArray(parsed.healthArchives) ? parsed.healthArchives : [],
      vitalsEntries: Array.isArray(parsed.vitalsEntries) ? parsed.vitalsEntries : [],
      visits: Array.isArray(parsed.visits) ? parsed.visits : [],
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

export function subscribeCareServiceWorkflow(listener: () => void) {
  hydrateState()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getCareServiceSnapshot(): CareServiceSnapshot {
  hydrateState()

  if (cachedSnapshot && cachedSnapshotState === workflowState) {
    return cachedSnapshot
  }

  cachedSnapshot = {
    healthArchives: mergeById(BASE_HEALTH_ARCHIVES, workflowState.healthArchives),
    vitalsEntries: mergeById(BASE_VITALS, workflowState.vitalsEntries),
    visits: mergeById(BASE_VISITS, workflowState.visits),
  }
  cachedSnapshotState = workflowState

  return cachedSnapshot
}

export function validateHealthArchiveForm(form: HealthArchiveCreateFormState) {
  if (!form.elderlyId || !form.bp.trim() || !form.hr.trim() || !form.temp.trim() || !form.bloodSugar.trim() || !form.o2.trim()) {
    return '请先选择老人，并补齐血压、心率、体温、血糖和血氧。'
  }

  return ''
}

export function addHealthArchiveDraft(form: HealthArchiveCreateFormState) {
  hydrateState()
  const elder = resolveElderProfile(form.elderlyId)
  const draft: HealthArchiveRecord = {
    id: `HR${Date.now().toString().slice(-4)}`,
    elderlyId: elder.elderlyId,
    name: elder.name,
    room: elder.room,
    age: elder.age,
    bp: form.bp.trim(),
    hr: Number(form.hr),
    temp: Number(form.temp),
    bloodSugar: Number(form.bloodSugar),
    o2: Number(form.o2),
    lastCheck: nowDate(),
    alert: form.alert.trim() || null,
    lifecycleStatus: '待建档',
    createdAt: nowDate(),
    archiveNote: '基础健康档案已录入，等待护士长确认建档。',
  }

  workflowState = {
    ...workflowState,
    healthArchives: [draft, ...workflowState.healthArchives.filter(item => item.id !== draft.id)],
  }
  notifyListeners()
  return draft
}

export function confirmHealthArchive(id: string, archiveNote = '健康档案已复核并纳入巡诊口径。') {
  hydrateState()
  let updated: HealthArchiveRecord | undefined
  workflowState = {
    ...workflowState,
    healthArchives: workflowState.healthArchives.map(item => {
      if (item.id !== id) {
        return item
      }

      updated = {
        ...item,
        lifecycleStatus: '已建档',
        archiveNote,
      }
      return updated
    }),
  }
  notifyListeners()
  return updated
}

export function validateVitalsForm(form: VitalsCreateFormState) {
  if (!form.elderlyId || !form.bp.trim() || !form.hr.trim() || !form.temp.trim() || !form.spo2.trim() || !form.bloodSugar.trim() || !form.recordedBy.trim() || !form.time.trim()) {
    return '请先选择老人，并补齐血压、心率、体温、血氧、血糖、记录人和记录时间。'
  }

  return ''
}

export function addVitalsEntry(form: VitalsCreateFormState) {
  hydrateState()
  const elder = resolveElderProfile(form.elderlyId)
  const record: VitalEntryRecord = {
    id: `V${Date.now().toString().slice(-4)}`,
    elderlyId: elder.elderlyId,
    elder: elder.name,
    room: elder.room,
    bp: form.bp.trim(),
    hr: Number(form.hr),
    temp: Number(form.temp),
    spo2: Number(form.spo2),
    bloodSugar: Number(form.bloodSugar),
    recordedBy: form.recordedBy.trim(),
    time: form.time,
    createdAt: `${nowDate()} ${form.time}`,
    entryNote: '本次生命体征已写入当日录入清单。',
  }

  workflowState = {
    ...workflowState,
    vitalsEntries: [record, ...workflowState.vitalsEntries.filter(item => item.id !== record.id)],
  }
  notifyListeners()
  return record
}

export function validateVisitForm(form: VisitCreateFormState) {
  if (!form.elderlyId || !form.visitor.trim() || !form.relation.trim() || !form.phone.trim() || !form.date.trim() || !form.time.trim()) {
    return '请先选择老人，并补齐访客、关系、联系电话、日期和时间。'
  }

  if (form.phone.replace(/\D/g, '').length < 11) {
    return '联系电话至少填写 11 位有效手机号。'
  }

  return ''
}

export function addVisitAppointment(form: VisitCreateFormState) {
  hydrateState()
  const elder = resolveElderProfile(form.elderlyId)
  const record: VisitAppointmentRecord = {
    id: `VS${Date.now().toString().slice(-4)}`,
    elderlyId: elder.elderlyId,
    elder: elder.name,
    room: elder.room,
    visitor: form.visitor.trim(),
    relation: form.relation.trim(),
    phone: form.phone.trim(),
    date: form.date,
    time: form.time,
    type: form.type,
    status: '待审核',
    lifecycleStatus: '待审核',
    createdAt: nowStamp(),
    approvalNote: '预约已登记，等待前台或护理主管审核。',
  }

  workflowState = {
    ...workflowState,
    visits: [record, ...workflowState.visits.filter(item => item.id !== record.id)],
  }
  notifyListeners()
  return record
}

export function approveVisitAppointment(id: string, approvalNote = '预约已审核，可进入来访登记流程。') {
  hydrateState()
  let updated: VisitAppointmentRecord | undefined
  workflowState = {
    ...workflowState,
    visits: workflowState.visits.map(item => {
      if (item.id !== id) {
        return item
      }

      updated = {
        ...item,
        status: '已登记',
        lifecycleStatus: '已审核',
        approvalNote,
      }
      return updated
    }),
  }
  notifyListeners()
  return updated
}