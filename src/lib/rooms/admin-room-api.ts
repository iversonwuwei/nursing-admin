export interface AdminRoomBedOccupant {
  elderId: string
  name: string
  careLevel: string
  checkIn: string
}

export interface AdminRoomBedInfo {
  bedId: number
  status: 'occupied' | 'available' | 'maintenance'
  elder?: AdminRoomBedOccupant
}

export interface AdminRoomRecord {
  id: string
  tenantId: string
  name: string
  floor: number
  floorName: string
  type: '单人间' | '双人间' | '护理间' | '套间'
  capacity: number
  occupied: number
  status: '可入住' | '已满' | '维护中' | '待启用'
  organizationId?: string
  organizationName: string
  facilities: string[]
  cleanStatus: '已清洁' | '待清洁' | '保洁中'
  lastClean: string
  nextClean: string
  lifecycleStatus: '待启用' | '已启用'
  createdAt: string
  activatedAt?: string
  activationNote?: string
  bedsInfo: AdminRoomBedInfo[]
}

interface AdminRoomBedOccupantResponse {
  elderId: string
  name: string
  careLevel: string
  checkIn: string
}

interface AdminRoomBedInfoResponse {
  bedId: number
  status: string
  elder?: AdminRoomBedOccupantResponse | null
}

interface AdminRoomRecordResponse {
  roomId: string
  tenantId: string
  name: string
  floor: number
  floorName: string
  type: string
  capacity: number
  occupied: number
  status: string
  organizationId?: string | null
  organizationName: string
  facilities: string[]
  cleanStatus: string
  lastClean: string
  nextClean: string
  lifecycleStatus: string
  createdAt: string
  activatedAt?: string | null
  activationNote?: string | null
  bedsInfo: AdminRoomBedInfoResponse[]
}

interface AdminRoomListResponsePayload {
  items: AdminRoomRecordResponse[]
  total: number
  page: number
  pageSize: number
}

export interface AdminRoomListResponse {
  items: AdminRoomRecord[]
  total: number
  page: number
  pageSize: number
}

export interface AdminRoomCreateRequest {
  roomId: string
  name: string
  floor: number
  type: '单人间' | '双人间' | '护理间' | '套间'
  capacity: number
  organizationId?: string | null
  organizationName: string
  facilities: string[]
}

export interface AdminRoomActivateRequest {
  activationNote?: string | null
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

function normalizeType(value: string): AdminRoomRecord['type'] {
  if (value === '单人间' || value === '护理间' || value === '套间') {
    return value
  }

  return '双人间'
}

function normalizeStatus(value: string): AdminRoomRecord['status'] {
  if (value === '已满' || value === '维护中' || value === '待启用') {
    return value
  }

  return '可入住'
}

function normalizeCleanStatus(value: string): AdminRoomRecord['cleanStatus'] {
  if (value === '待清洁' || value === '保洁中') {
    return value
  }

  return '已清洁'
}

function normalizeLifecycleStatus(value: string): AdminRoomRecord['lifecycleStatus'] {
  return value === '待启用' ? '待启用' : '已启用'
}

function normalizeBedStatus(value: string): AdminRoomBedInfo['status'] {
  if (value === 'occupied' || value === 'maintenance') {
    return value
  }

  return 'available'
}

function normalizeBeds(items: AdminRoomBedInfoResponse[]): AdminRoomBedInfo[] {
  return items.map(item => ({
    bedId: item.bedId,
    status: normalizeBedStatus(item.status),
    elder: item.elder ? {
      elderId: item.elder.elderId,
      name: item.elder.name,
      careLevel: item.elder.careLevel,
      checkIn: item.elder.checkIn,
    } : undefined,
  }))
}

function normalizeRecord(record: AdminRoomRecordResponse): AdminRoomRecord {
  return {
    id: record.roomId,
    tenantId: record.tenantId,
    name: record.name,
    floor: record.floor,
    floorName: record.floorName,
    type: normalizeType(record.type),
    capacity: record.capacity,
    occupied: record.occupied,
    status: normalizeStatus(record.status),
    organizationId: record.organizationId ?? undefined,
    organizationName: record.organizationName,
    facilities: record.facilities,
    cleanStatus: normalizeCleanStatus(record.cleanStatus),
    lastClean: record.lastClean,
    nextClean: record.nextClean,
    lifecycleStatus: normalizeLifecycleStatus(record.lifecycleStatus),
    createdAt: record.createdAt,
    activatedAt: record.activatedAt ?? undefined,
    activationNote: record.activationNote ?? undefined,
    bedsInfo: normalizeBeds(record.bedsInfo),
  }
}

export async function fetchAdminRoomList(params: {
  keyword?: string
  status?: string
  lifecycleStatus?: string
  organizationName?: string
  page?: number
  pageSize?: number
} = {}): Promise<AdminRoomListResponse> {
  const query = buildQuery(params)
  const response = await fetch(`/api/rooms${query}`, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(await readError(response, '房间列表查询失败。'))
  }

  const payload = await response.json() as AdminRoomListResponsePayload
  return {
    items: payload.items.map(normalizeRecord),
    total: payload.total,
    page: payload.page,
    pageSize: payload.pageSize,
  }
}

export async function fetchAdminRoomDetail(roomId: string): Promise<AdminRoomRecord> {
  const response = await fetch(`/api/rooms/${roomId}`, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(await readError(response, '房间详情查询失败。'))
  }

  return normalizeRecord(await response.json() as AdminRoomRecordResponse)
}

export async function createAdminRoom(request: AdminRoomCreateRequest): Promise<AdminRoomRecord> {
  const response = await fetch('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await readError(response, '房间建档失败。'))
  }

  return normalizeRecord(await response.json() as AdminRoomRecordResponse)
}

export async function activateAdminRoom(roomId: string, request: AdminRoomActivateRequest = {}): Promise<AdminRoomRecord> {
  const response = await fetch(`/api/rooms/${roomId}/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await readError(response, '房间启用失败。'))
  }

  return normalizeRecord(await response.json() as AdminRoomRecordResponse)
}