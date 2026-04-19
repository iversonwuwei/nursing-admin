import type { Equipment } from '@/lib/types'

export type ActivityLifecycleStatus = '待发布' | '已发布'
export type IncidentWorkflowStatus = '待分派' | '处理中' | '已结案'
export type EquipmentLifecycleStatus = '待验收' | '已入册'
export type SupplyLifecycleStatus = '待上架' | '已入库'

export interface AdminActivityRecord {
  id: string
  tenantId: string
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

export interface AdminIncidentRecord {
  id: string
  tenantId: string
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

export interface EquipmentMetricSnapshot {
  hr: number
  bp: string
  temp: number
  spo2: number
}

export interface EquipmentHistoryPoint {
  time: string
  hr: number
  spo2: number
  note: string
}

export interface AdminEquipmentRecord extends Equipment {
  tenantId: string
  room: string
  type: Equipment['category']
  signal: number
  battery: number
  uptime: number
  metrics: EquipmentMetricSnapshot
  history: EquipmentHistoryPoint[]
  lifecycleStatus: EquipmentLifecycleStatus
  createdAt: string
  activatedAt?: string
  acceptanceNote?: string
}

export interface SupplyHistoryRecord {
  date: string
  in: number
  out: number
  balance: number
}

export interface AdminSupplyRecord {
  id: string
  tenantId: string
  name: string
  category: string
  unit: string
  stock: number
  minStock: number
  price: string
  supplier: string
  contact: string
  lastPurchase: string
  status: '库存不足' | '正常' | '待上架'
  lifecycleStatus: SupplyLifecycleStatus
  history: SupplyHistoryRecord[]
  createdAt: string
  activatedAt?: string
  intakeNote?: string
  lastIntakeQuantity?: number
}

interface ActivityRecordResponse {
  activityId: string
  tenantId: string
  name: string
  category: string
  date: string
  time: string
  duration: number
  participants: number
  capacity: number
  location: string
  status: string
  teacher: string
  description: string
  lifecycleStatus: string
  createdAt: string
  publishedAt?: string | null
  publishNote?: string | null
}

interface IncidentRecordResponse {
  incidentId: string
  tenantId: string
  title: string
  level: string
  elderName?: string | null
  room: string
  reporter: string
  reporterRole: string
  time: string
  status: string
  description: string
  handling: string[]
  nextStep?: string | null
  attachments: string[]
  createdAt: string
  assignedAt?: string | null
  closedAt?: string | null
  statusNote?: string | null
}

interface EquipmentMetricResponse {
  hr: number
  bp: string
  temp: number
  spo2: number
}

interface EquipmentHistoryResponse {
  time: string
  hr: number
  spo2: number
  note: string
}

interface EquipmentRecordResponse {
  equipmentId: string
  tenantId: string
  name: string
  category: string
  model: string
  serialNumber: string
  location: string
  status: string
  purchaseDate: string
  maintenanceDate: string
  maintenanceCycle: number
  organizationId?: string | null
  remarks?: string | null
  room: string
  type: string
  signal: number
  battery: number
  uptime: number
  metrics: EquipmentMetricResponse
  history: EquipmentHistoryResponse[]
  lifecycleStatus: string
  createdAt: string
  activatedAt?: string | null
  acceptanceNote?: string | null
}

interface SupplyHistoryResponse {
  date: string
  in: number
  out: number
  balance: number
}

interface SupplyRecordResponse {
  supplyId: string
  tenantId: string
  name: string
  category: string
  unit: string
  stock: number
  minStock: number
  price: string
  supplier: string
  contact: string
  lastPurchase: string
  status: string
  lifecycleStatus: string
  history: SupplyHistoryResponse[]
  createdAt: string
  activatedAt?: string | null
  intakeNote?: string | null
  lastIntakeQuantity?: number | null
}

interface ListResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface AdminActivityCreateRequest {
  name: string
  category: string
  date: string
  time: string
  duration: number
  capacity: number
  location: string
  teacher: string
  description: string
}

export interface AdminIncidentCreateRequest {
  title: string
  level: AdminIncidentRecord['level']
  elderName?: string | null
  room: string
  reporter: string
  reporterRole: string
  time: string
  description: string
  attachments: string[]
  nextStep?: string | null
}

export interface AdminEquipmentCreateRequest {
  name: string
  category: Equipment['category']
  model: string
  serialNumber: string
  location: string
  purchaseDate: string
  maintenanceCycle: number
  organizationId?: string | null
  remarks?: string | null
}

export interface AdminSupplyIntakeRequest {
  existingId?: string
  name?: string
  category?: string
  unit?: string
  quantity: number
  minStock?: number
  price?: string
  supplier?: string
  contact?: string
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return null
  }

  return response.json()
}

async function readError(response: Response, fallback: string) {
  const payload = await readJsonResponse(response) as { detail?: string; title?: string; message?: string } | null
  return payload?.detail ?? payload?.title ?? payload?.message ?? fallback
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') {
      return
    }

    searchParams.set(key, String(value))
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

function normalizeActivityStatus(value: string): AdminActivityRecord['status'] {
  if (value === '报名中' || value === '进行中' || value === '已完成') {
    return value
  }

  return '待发布'
}

function normalizeActivityLifecycleStatus(value: string): ActivityLifecycleStatus {
  return value === '待发布' ? '待发布' : '已发布'
}

function normalizeIncidentLevel(value: string): AdminIncidentRecord['level'] {
  if (value === '严重' || value === '一般') {
    return value
  }

  return '轻微'
}

function normalizeIncidentStatus(value: string): IncidentWorkflowStatus {
  if (value === '处理中' || value === '已结案') {
    return value
  }

  return '待分派'
}

function normalizeEquipmentLifecycleStatus(value: string): EquipmentLifecycleStatus {
  return value === '待验收' ? '待验收' : '已入册'
}

function normalizeSupplyStatus(value: string): AdminSupplyRecord['status'] {
  if (value === '库存不足' || value === '待上架') {
    return value
  }

  return '正常'
}

function normalizeSupplyLifecycleStatus(value: string): SupplyLifecycleStatus {
  return value === '待上架' ? '待上架' : '已入库'
}

function normalizeActivity(record: ActivityRecordResponse): AdminActivityRecord {
  return {
    id: record.activityId,
    tenantId: record.tenantId,
    name: record.name,
    category: record.category,
    date: record.date,
    time: record.time,
    duration: record.duration,
    participants: record.participants,
    capacity: record.capacity,
    location: record.location,
    status: normalizeActivityStatus(record.status),
    teacher: record.teacher,
    desc: record.description,
    lifecycleStatus: normalizeActivityLifecycleStatus(record.lifecycleStatus),
    createdAt: record.createdAt,
    publishedAt: record.publishedAt ?? undefined,
    publishNote: record.publishNote ?? undefined,
  }
}

function normalizeIncident(record: IncidentRecordResponse): AdminIncidentRecord {
  return {
    id: record.incidentId,
    tenantId: record.tenantId,
    title: record.title,
    level: normalizeIncidentLevel(record.level),
    elder: record.elderName ?? null,
    room: record.room,
    reporter: record.reporter,
    reporterRole: record.reporterRole,
    time: record.time,
    status: normalizeIncidentStatus(record.status),
    desc: record.description,
    handling: record.handling,
    nextStep: record.nextStep ?? null,
    attachments: record.attachments,
    createdAt: record.createdAt,
    assignedAt: record.assignedAt ?? undefined,
    closedAt: record.closedAt ?? undefined,
    statusNote: record.statusNote ?? undefined,
  }
}

function normalizeEquipment(record: EquipmentRecordResponse): AdminEquipmentRecord {
  return {
    id: record.equipmentId,
    tenantId: record.tenantId,
    name: record.name,
    category: record.category as Equipment['category'],
    model: record.model,
    serialNumber: record.serialNumber,
    location: record.location,
    status: record.status as Equipment['status'],
    purchaseDate: record.purchaseDate,
    maintenanceDate: record.maintenanceDate,
    maintenanceCycle: record.maintenanceCycle,
    organizationId: record.organizationId ?? '',
    remarks: record.remarks ?? undefined,
    room: record.room,
    type: record.type as Equipment['category'],
    signal: record.signal,
    battery: record.battery,
    uptime: record.uptime,
    metrics: record.metrics,
    history: record.history,
    lifecycleStatus: normalizeEquipmentLifecycleStatus(record.lifecycleStatus),
    createdAt: record.createdAt,
    activatedAt: record.activatedAt ?? undefined,
    acceptanceNote: record.acceptanceNote ?? undefined,
  }
}

function normalizeSupply(record: SupplyRecordResponse): AdminSupplyRecord {
  return {
    id: record.supplyId,
    tenantId: record.tenantId,
    name: record.name,
    category: record.category,
    unit: record.unit,
    stock: record.stock,
    minStock: record.minStock,
    price: record.price,
    supplier: record.supplier,
    contact: record.contact,
    lastPurchase: record.lastPurchase,
    status: normalizeSupplyStatus(record.status),
    lifecycleStatus: normalizeSupplyLifecycleStatus(record.lifecycleStatus),
    history: record.history,
    createdAt: record.createdAt,
    activatedAt: record.activatedAt ?? undefined,
    intakeNote: record.intakeNote ?? undefined,
    lastIntakeQuantity: record.lastIntakeQuantity ?? undefined,
  }
}

async function requestJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`/api/admin-operations${path}`, {
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

export async function fetchAdminActivities(params: {
  keyword?: string
  status?: string
  lifecycleStatus?: string
  page?: number
  pageSize?: number
} = {}) {
  const query = buildQuery(params)
  const payload = await requestJson<ListResponse<ActivityRecordResponse>>(`/activities${query}`)
  return {
    ...payload,
    items: payload.items.map(normalizeActivity),
  }
}

export async function fetchAdminActivityDetail(activityId: string) {
  return normalizeActivity(await requestJson<ActivityRecordResponse>(`/activities/${encodeURIComponent(activityId)}`))
}

export async function createAdminActivity(request: AdminActivityCreateRequest) {
  return normalizeActivity(await requestJson<ActivityRecordResponse>('/activities', {
    method: 'POST',
    body: JSON.stringify(request),
  }))
}

export async function publishAdminActivity(activityId: string, note?: string) {
  return normalizeActivity(await requestJson<ActivityRecordResponse>(`/activities/${encodeURIComponent(activityId)}/actions`, {
    method: 'POST',
    body: JSON.stringify({ action: 'publish', note }),
  }))
}

export async function fetchAdminIncidents(params: {
  keyword?: string
  level?: string
  status?: string
  page?: number
  pageSize?: number
} = {}) {
  const query = buildQuery(params)
  const payload = await requestJson<ListResponse<IncidentRecordResponse>>(`/incidents${query}`)
  return {
    ...payload,
    items: payload.items.map(normalizeIncident),
  }
}

export async function fetchAdminIncidentDetail(incidentId: string) {
  return normalizeIncident(await requestJson<IncidentRecordResponse>(`/incidents/${encodeURIComponent(incidentId)}`))
}

export async function createAdminIncident(request: AdminIncidentCreateRequest) {
  return normalizeIncident(await requestJson<IncidentRecordResponse>('/incidents', {
    method: 'POST',
    body: JSON.stringify(request),
  }))
}

export async function startAdminIncidentHandling(incidentId: string, note?: string) {
  return normalizeIncident(await requestJson<IncidentRecordResponse>(`/incidents/${encodeURIComponent(incidentId)}/actions`, {
    method: 'POST',
    body: JSON.stringify({ action: 'start', note }),
  }))
}

export async function closeAdminIncident(incidentId: string, note?: string) {
  return normalizeIncident(await requestJson<IncidentRecordResponse>(`/incidents/${encodeURIComponent(incidentId)}/actions`, {
    method: 'POST',
    body: JSON.stringify({ action: 'close', note }),
  }))
}

export async function fetchAdminEquipment(params: {
  keyword?: string
  category?: string
  status?: string
  lifecycleStatus?: string
  page?: number
  pageSize?: number
} = {}) {
  const query = buildQuery(params)
  const payload = await requestJson<ListResponse<EquipmentRecordResponse>>(`/equipment${query}`)
  return {
    ...payload,
    items: payload.items.map(normalizeEquipment),
  }
}

export async function fetchAdminEquipmentDetail(equipmentId: string) {
  return normalizeEquipment(await requestJson<EquipmentRecordResponse>(`/equipment/${encodeURIComponent(equipmentId)}`))
}

export async function createAdminEquipment(request: AdminEquipmentCreateRequest) {
  return normalizeEquipment(await requestJson<EquipmentRecordResponse>('/equipment', {
    method: 'POST',
    body: JSON.stringify(request),
  }))
}

export async function activateAdminEquipment(equipmentId: string, acceptanceNote?: string) {
  return normalizeEquipment(await requestJson<EquipmentRecordResponse>(`/equipment/${encodeURIComponent(equipmentId)}/activate`, {
    method: 'POST',
    body: JSON.stringify({ acceptanceNote }),
  }))
}

export async function fetchAdminSupplies(params: {
  keyword?: string
  category?: string
  status?: string
  lifecycleStatus?: string
  page?: number
  pageSize?: number
} = {}) {
  const query = buildQuery(params)
  const payload = await requestJson<ListResponse<SupplyRecordResponse>>(`/supplies${query}`)
  return {
    ...payload,
    items: payload.items.map(normalizeSupply),
  }
}

export async function fetchAdminSupplyDetail(supplyId: string) {
  return normalizeSupply(await requestJson<SupplyRecordResponse>(`/supplies/${encodeURIComponent(supplyId)}`))
}

export async function createAdminSupplyIntake(request: AdminSupplyIntakeRequest) {
  return normalizeSupply(await requestJson<SupplyRecordResponse>('/supplies', {
    method: 'POST',
    body: JSON.stringify(request),
  }))
}

export async function activateAdminSupply(supplyId: string, intakeNote?: string) {
  return normalizeSupply(await requestJson<SupplyRecordResponse>(`/supplies/${encodeURIComponent(supplyId)}/activate`, {
    method: 'POST',
    body: JSON.stringify({ intakeNote }),
  }))
}