export type FaceEnrollmentStatus = '待录入' | '采集中' | '待确认' | '已生效' | '需重录'
export type FaceCaptureStepKey = 'front' | 'left' | 'right'
export type FaceEntrySource = 'face-page' | 'elderly-list' | 'elderly-detail'

export interface FaceEnrollmentRecord {
  id: string
  elderlyId: string
  elder: string
  room: string
  status: FaceEnrollmentStatus
  capturedSteps: FaceCaptureStepKey[]
  qualityScore: number
  qualitySummary: string
  operator: string
  deviceLabel: string
  entrySource: FaceEntrySource
  lastUpdated: string
  activatedAt?: string
  activationNote?: string
  retakeReason?: string
}

interface FaceEnrollmentWorkflowState {
  records: FaceEnrollmentRecord[]
}

export interface FaceEnrollmentSnapshot {
  records: FaceEnrollmentRecord[]
}

export interface StartFaceEnrollmentInput {
  elderlyId: string
  elder: string
  room: string
  operator: string
  deviceLabel: string
  entrySource: FaceEntrySource
}

const STORAGE_KEY = 'nursing-admin-v2/face-enrollment-workflow'

const BASE_RECORDS: FaceEnrollmentRecord[] = [
  {
    id: 'FE001',
    elderlyId: 'E001',
    elder: '张桂英',
    room: '201-1',
    status: '已生效',
    capturedSteps: ['front', 'left', 'right'],
    qualityScore: 96,
    qualitySummary: '三角度样本完整，当前模板已生效并同步到门禁白名单。',
    operator: '前台接待 李敏',
    deviceLabel: '前台采集终端 A',
    entrySource: 'face-page',
    lastUpdated: '2026-03-15 10:20',
    activatedAt: '2026-03-15 10:20',
    activationNote: '入住首日完成采集，已通知门禁侧启用。',
  },
  {
    id: 'FE002',
    elderlyId: 'E002',
    elder: '王建国',
    room: '203-2',
    status: '已生效',
    capturedSteps: ['front', 'left', 'right'],
    qualityScore: 93,
    qualitySummary: '模板已生效，适合白天时段快速通行识别。',
    operator: '前台接待 李敏',
    deviceLabel: '前台采集终端 A',
    entrySource: 'elderly-detail',
    lastUpdated: '2026-03-14 09:40',
    activatedAt: '2026-03-14 09:40',
    activationNote: '家属确认无误后启用。',
  },
  {
    id: 'FE003',
    elderlyId: 'E003',
    elder: '李秀兰',
    room: '205-1',
    status: '待确认',
    capturedSteps: ['front', 'left', 'right'],
    qualityScore: 89,
    qualitySummary: '样本已齐，可由护理主管确认后激活。',
    operator: '护理主管 赵芳',
    deviceLabel: '护理站采集终端 B',
    entrySource: 'face-page',
    lastUpdated: '2026-03-28 15:20',
    activationNote: '等待主管复核佩戴眼镜后的识别稳定性。',
  },
  {
    id: 'FE005',
    elderlyId: 'E005',
    elder: '周桂芳',
    room: '203-1',
    status: '需重录',
    capturedSteps: [],
    qualityScore: 58,
    qualitySummary: '上次采集有逆光和侧脸遮挡，需要重录。',
    operator: '前台接待 李敏',
    deviceLabel: '前台采集终端 A',
    entrySource: 'elderly-list',
    lastUpdated: '2026-04-01 16:10',
    retakeReason: '逆光导致模板置信度不足。',
  },
]

function createInitialState(): FaceEnrollmentWorkflowState {
  return {
    records: [],
  }
}

function nowStamp() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

function mergeByElderlyId(base: readonly FaceEnrollmentRecord[], overrides: readonly FaceEnrollmentRecord[]) {
  const map = new Map(base.map(item => [item.elderlyId, item]))
  overrides.forEach(item => map.set(item.elderlyId, item))
  return Array.from(map.values()).sort((left, right) => right.lastUpdated.localeCompare(left.lastUpdated))
}

function summarizeQuality(status: FaceEnrollmentStatus, capturedSteps: FaceCaptureStepKey[], score: number, retakeReason?: string) {
  if (status === '已生效') {
    return '三角度样本完整，当前模板已生效并可用于门禁或核验。'
  }

  if (status === '需重录') {
    return retakeReason?.trim() || '当前质量不足，需重新采集。'
  }

  if (capturedSteps.length === 0) {
    return '尚未开始采集，请先记录正脸、左侧脸和右侧脸样本。'
  }

  if (capturedSteps.length < 3) {
    return `已完成 ${capturedSteps.length}/3 个角度样本，继续补齐后再进入人工确认。`
  }

  return score >= 85 ? '样本已齐，可进入人工确认与激活。' : '样本已齐但质量偏低，建议退回重录。'
}

function qualityForSteps(capturedSteps: FaceCaptureStepKey[]) {
  if (capturedSteps.length >= 3) {
    return 92
  }

  if (capturedSteps.length === 2) {
    return 81
  }

  if (capturedSteps.length === 1) {
    return 68
  }

  return 0
}

function persistableState(raw: unknown): FaceEnrollmentWorkflowState {
  const parsed = raw as FaceEnrollmentWorkflowState
  return {
    records: Array.isArray(parsed.records) ? parsed.records : [],
  }
}

let workflowState = createInitialState()
let hydrated = false
const listeners = new Set<() => void>()
let cachedSnapshotState: FaceEnrollmentWorkflowState | undefined
let cachedSnapshot: FaceEnrollmentSnapshot | undefined

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
    workflowState = persistableState(JSON.parse(raw))
  } catch {
    workflowState = createInitialState()
    persistState()
  }
}

function notifyListeners() {
  persistState()
  listeners.forEach(listener => listener())
}

function upsertRecord(record: FaceEnrollmentRecord) {
  workflowState = {
    ...workflowState,
    records: [record, ...workflowState.records.filter(item => item.elderlyId !== record.elderlyId)],
  }
  notifyListeners()
  return record
}

export function subscribeFaceEnrollmentWorkflow(listener: () => void) {
  hydrateState()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getFaceEnrollmentSnapshot(): FaceEnrollmentSnapshot {
  hydrateState()

  if (cachedSnapshot && cachedSnapshotState === workflowState) {
    return cachedSnapshot
  }

  cachedSnapshot = {
    records: mergeByElderlyId(BASE_RECORDS, workflowState.records),
  }
  cachedSnapshotState = workflowState
  return cachedSnapshot
}

export function validateFaceCaptureContext(operator: string, deviceLabel: string) {
  if (!operator.trim() || !deviceLabel.trim()) {
    return '请先填写采集操作人和采集终端。'
  }

  return ''
}

export function validateFaceActivation(record: FaceEnrollmentRecord | undefined, activationNote: string) {
  if (!record) {
    return '请先选择需要激活的人脸记录。'
  }

  if (record.capturedSteps.length < 3) {
    return '请先补齐正脸、左侧脸和右侧脸三个角度样本。'
  }

  if (!activationNote.trim()) {
    return '请填写激活备注，说明当前模板为何可以生效。'
  }

  return ''
}

export function validateRetakeReason(reason: string) {
  if (!reason.trim()) {
    return '请填写退回重录原因，方便前台或护理人员继续处理。'
  }

  return ''
}

export function startFaceEnrollment(input: StartFaceEnrollmentInput) {
  hydrateState()
  const current = getFaceEnrollmentSnapshot().records.find(item => item.elderlyId === input.elderlyId)
  const nextCapturedSteps = current?.status === '采集中' ? current.capturedSteps : []
  const qualityScore = qualityForSteps(nextCapturedSteps)
  const nextStatus: FaceEnrollmentStatus = nextCapturedSteps.length >= 3 ? '待确认' : '采集中'
  const record: FaceEnrollmentRecord = {
    id: current?.id ?? `FE${Date.now().toString().slice(-4)}`,
    elderlyId: input.elderlyId,
    elder: input.elder,
    room: input.room,
    status: nextStatus,
    capturedSteps: nextCapturedSteps,
    qualityScore,
    qualitySummary: summarizeQuality(nextStatus, nextCapturedSteps, qualityScore),
    operator: input.operator.trim(),
    deviceLabel: input.deviceLabel.trim(),
    entrySource: input.entrySource,
    lastUpdated: nowStamp(),
    activationNote: current?.activationNote,
  }

  return upsertRecord(record)
}

export function captureFaceSample(elderlyId: string, step: FaceCaptureStepKey, operator: string, deviceLabel: string) {
  hydrateState()
  const current = getFaceEnrollmentSnapshot().records.find(item => item.elderlyId === elderlyId)
  if (!current) {
    return undefined
  }

  const capturedSteps = Array.from(new Set([...current.capturedSteps, step]))
  const qualityScore = qualityForSteps(capturedSteps)
  const nextStatus: FaceEnrollmentStatus = capturedSteps.length >= 3 ? '待确认' : '采集中'
  const updated: FaceEnrollmentRecord = {
    ...current,
    status: nextStatus,
    capturedSteps,
    qualityScore,
    qualitySummary: summarizeQuality(nextStatus, capturedSteps, qualityScore),
    operator: operator.trim(),
    deviceLabel: deviceLabel.trim(),
    lastUpdated: nowStamp(),
    retakeReason: undefined,
  }

  return upsertRecord(updated)
}

export function activateFaceEnrollment(elderlyId: string, activationNote: string) {
  hydrateState()
  const current = getFaceEnrollmentSnapshot().records.find(item => item.elderlyId === elderlyId)
  if (!current) {
    return undefined
  }

  const finalScore = Math.max(current.qualityScore, 92)
  const updated: FaceEnrollmentRecord = {
    ...current,
    status: '已生效',
    qualityScore: finalScore,
    qualitySummary: summarizeQuality('已生效', current.capturedSteps, finalScore),
    lastUpdated: nowStamp(),
    activatedAt: nowStamp(),
    activationNote: activationNote.trim(),
    retakeReason: undefined,
  }

  return upsertRecord(updated)
}

export function returnFaceEnrollmentForRetake(elderlyId: string, reason: string) {
  hydrateState()
  const current = getFaceEnrollmentSnapshot().records.find(item => item.elderlyId === elderlyId)
  if (!current) {
    return undefined
  }

  const updated: FaceEnrollmentRecord = {
    ...current,
    status: '需重录',
    capturedSteps: [],
    qualityScore: 58,
    qualitySummary: summarizeQuality('需重录', [], 58, reason.trim()),
    lastUpdated: nowStamp(),
    retakeReason: reason.trim(),
  }

  return upsertRecord(updated)
}

export function findFaceEnrollmentRecordByElderlyId(elderlyId: string, snapshot = getFaceEnrollmentSnapshot()) {
  return snapshot.records.find(item => item.elderlyId === elderlyId)
}