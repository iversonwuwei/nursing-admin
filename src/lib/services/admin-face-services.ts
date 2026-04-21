async function readError(response: Response, fallback: string) {
  try {
    const payload = await response.json() as { message?: string; detail?: string; title?: string }
    return payload.message || payload.detail || payload.title || fallback
  } catch {
    return fallback
  }
}

async function requestJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`/api/elders${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(await readError(response, `request failed: ${response.status}`))
  }

  return response.json() as Promise<T>
}

export type FaceCaptureStepKey = 'front' | 'left' | 'right'

export type FaceEnrollmentStatus = '待录入' | '采集中' | '待确认' | '已生效' | '需重录'

interface AdminFaceEnrollmentItemResponse {
  elderId: string
  tenantId: string
  elderName: string
  roomNumber: string
  careLevel: string
  faceEnrollmentStatus: FaceEnrollmentStatus
  faceCapturedSteps: FaceCaptureStepKey[]
  faceQualityScore: number
  faceQualitySummary: string
  faceOperator?: string | null
  faceDeviceLabel?: string | null
  faceEntrySource?: string | null
  faceLastUpdatedUtc?: string | null
  faceActivatedAtUtc?: string | null
  faceActivationNote?: string | null
  faceRetakeReason?: string | null
}

interface AdminFaceEnrollmentListResponse {
  items: AdminFaceEnrollmentItemResponse[]
  total: number
  page: number
  pageSize: number
}

export interface AdminFaceQueueItem {
  elderlyId: string
  name: string
  room: string
  careLevel: string
  status: FaceEnrollmentStatus
  qualityScore: number
  qualitySummary: string
  lastUpdated: string
  operator: string
  deviceLabel: string
  entrySource?: string
  activationNote?: string
  retakeReason?: string
  capturedSteps: FaceCaptureStepKey[]
}

export interface FetchAdminFaceEnrollmentQueueOptions {
  keyword?: string
  status?: FaceEnrollmentStatus
  page?: number
  pageSize?: number
}

export interface FetchAdminFaceEnrollmentQueueResult {
  items: AdminFaceQueueItem[]
  total: number
  page: number
  pageSize: number
}

function normalizeFaceItem(item: AdminFaceEnrollmentItemResponse): AdminFaceQueueItem {
  return {
    elderlyId: item.elderId,
    name: item.elderName,
    room: item.roomNumber,
    careLevel: item.careLevel,
    status: item.faceEnrollmentStatus,
    qualityScore: item.faceQualityScore,
    qualitySummary: item.faceQualitySummary,
    lastUpdated: item.faceLastUpdatedUtc ?? '——',
    operator: item.faceOperator ?? '前台接待 李敏',
    deviceLabel: item.faceDeviceLabel ?? '前台采集终端 A',
    entrySource: item.faceEntrySource ?? undefined,
    activationNote: item.faceActivationNote ?? undefined,
    retakeReason: item.faceRetakeReason ?? undefined,
    capturedSteps: item.faceCapturedSteps ?? [],
  }
}

function buildQuery(options: FetchAdminFaceEnrollmentQueueOptions): string {
  const params = new URLSearchParams()
  if (options.keyword) params.set('keyword', options.keyword)
  if (options.status) params.set('status', options.status)
  params.set('page', String(options.page ?? 1))
  params.set('pageSize', String(options.pageSize ?? 500))
  return params.toString()
}

export async function fetchAdminFaceEnrollmentQueue(options: FetchAdminFaceEnrollmentQueueOptions = {}): Promise<FetchAdminFaceEnrollmentQueueResult> {
  const query = buildQuery(options)
  const payload = await requestJson<AdminFaceEnrollmentListResponse>(`/face-enrollment?${query}`)
  return {
    items: payload.items.map(normalizeFaceItem),
    total: payload.total,
    page: payload.page,
    pageSize: payload.pageSize,
  }
}

export interface StartAdminFaceEnrollmentPayload {
  operator: string
  deviceLabel: string
  entrySource: string
}

export async function startAdminFaceEnrollment(elderlyId: string, payload: StartAdminFaceEnrollmentPayload): Promise<AdminFaceQueueItem> {
  const response = await requestJson<AdminFaceEnrollmentItemResponse>(`/${encodeURIComponent(elderlyId)}/face-enrollment/start`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return normalizeFaceItem(response)
}

export interface CaptureAdminFaceEnrollmentPayload {
  step: FaceCaptureStepKey
  operator: string
  deviceLabel: string
}

export async function captureAdminFaceEnrollmentSample(elderlyId: string, payload: CaptureAdminFaceEnrollmentPayload): Promise<AdminFaceQueueItem> {
  const response = await requestJson<AdminFaceEnrollmentItemResponse>(`/${encodeURIComponent(elderlyId)}/face-enrollment/capture`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return normalizeFaceItem(response)
}

export async function activateAdminFaceEnrollment(elderlyId: string, activationNote: string): Promise<AdminFaceQueueItem> {
  const response = await requestJson<AdminFaceEnrollmentItemResponse>(`/${encodeURIComponent(elderlyId)}/face-enrollment/activate`, {
    method: 'POST',
    body: JSON.stringify({ activationNote }),
  })
  return normalizeFaceItem(response)
}

export async function retakeAdminFaceEnrollment(elderlyId: string, reason: string): Promise<AdminFaceQueueItem> {
  const response = await requestJson<AdminFaceEnrollmentItemResponse>(`/${encodeURIComponent(elderlyId)}/face-enrollment/retake`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
  return normalizeFaceItem(response)
}

export function validateFaceCaptureContext(operator: string, deviceLabel: string) {
  if (!operator.trim()) {
    return '请先填写采集操作人。'
  }

  if (!deviceLabel.trim()) {
    return '请先填写采集终端。'
  }

  return ''
}

export function validateFaceActivation(item: AdminFaceQueueItem | null, activationNote: string) {
  if (!item) {
    return '请先选择需要处理的老人。'
  }

  if (item.capturedSteps.length < 3) {
    return '请先补齐正脸、左侧脸、右侧脸三个角度样本。'
  }

  if (!activationNote.trim()) {
    return '请填写激活备注后再提交。'
  }

  return ''
}

export function validateRetakeReason(reason: string) {
  if (!reason.trim()) {
    return '请填写退回重录原因。'
  }

  return ''
}
