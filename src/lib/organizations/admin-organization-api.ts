export interface AdminOrganizationSummary {
  id: string
  tenantId: string
  name: string
  address: string
  phone: string
  status: '运营中' | '筹备中' | '暂停营业'
  establishedDate: string
  manager: string
  managerPhone: string
  description: string
  lifecycleStatus: '待启用' | '已启用'
  createdAt: string
  activatedAt?: string
  activationNote?: string
  totalBeds: number
  occupiedBeds: number
  availableBeds: number
  elderlyCount: number
  staffCount: number
  roomCount: number
  staffIntegrationStatus: 'pending' | 'live'
}

export interface AdminOrganizationRoomSummary {
  roomId: string
  name: string
  floorName: string
  type: '单人间' | '双人间' | '护理间' | '套间'
  capacity: number
  occupied: number
  status: '可入住' | '已满' | '维护中' | '待启用'
  cleanStatus: '已清洁' | '待清洁' | '保洁中'
}

export interface AdminOrganizationStaffSummary {
  id: string
  name: string
  role: string
  department: string
  employmentSource: '自营' | '第三方合作'
  partnerAgencyName?: string
  status: '在职' | '休假' | '离职' | '待入职'
  lifecycleStatus: '待入职' | '已入职'
  phone: string
}

export interface AdminOrganizationDetail {
  organization: AdminOrganizationSummary
  rooms: AdminOrganizationRoomSummary[]
  staff: AdminOrganizationStaffSummary[]
}

interface AdminOrganizationSummaryResponse {
  organizationId: string
  tenantId: string
  name: string
  address: string
  phone: string
  status: string
  establishedDate: string
  manager: string
  managerPhone: string
  description: string
  lifecycleStatus: string
  createdAt: string
  activatedAt?: string | null
  activationNote?: string | null
  totalBeds: number
  occupiedBeds: number
  availableBeds: number
  elderlyCount: number
  staffCount: number
  roomCount: number
  staffIntegrationStatus: string
}

interface AdminOrganizationRoomSummaryResponse {
  roomId: string
  name: string
  floorName: string
  type: string
  capacity: number
  occupied: number
  status: string
  cleanStatus: string
}

interface AdminOrganizationListResponsePayload {
  items: AdminOrganizationSummaryResponse[]
  total: number
  page: number
  pageSize: number
}

interface AdminOrganizationDetailResponsePayload {
  organization: AdminOrganizationSummaryResponse
  rooms: AdminOrganizationRoomSummaryResponse[]
  staff: Array<{
    staffId: string
    name: string
    role: string
    department: string
    employmentSource: string
    partnerAgencyName?: string | null
    status: string
    lifecycleStatus: string
    phone: string
  }>
}

export interface AdminOrganizationListResponse {
  items: AdminOrganizationSummary[]
  total: number
  page: number
  pageSize: number
}

export interface AdminOrganizationCreateRequest {
  name: string
  address: string
  phone: string
  manager: string
  managerPhone: string
  description: string
}

export interface AdminOrganizationActivateRequest {
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

function normalizeStatus(value: string): AdminOrganizationSummary['status'] {
  if (value === '筹备中' || value === '暂停营业') {
    return value
  }

  return '运营中'
}

function normalizeLifecycleStatus(value: string): AdminOrganizationSummary['lifecycleStatus'] {
  return value === '待启用' ? '待启用' : '已启用'
}

function normalizeStaffIntegrationStatus(value: string): AdminOrganizationSummary['staffIntegrationStatus'] {
  return value === 'live' ? 'live' : 'pending'
}

function normalizeRoomType(value: string): AdminOrganizationRoomSummary['type'] {
  if (value === '单人间' || value === '护理间' || value === '套间') {
    return value
  }

  return '双人间'
}

function normalizeRoomStatus(value: string): AdminOrganizationRoomSummary['status'] {
  if (value === '已满' || value === '维护中' || value === '待启用') {
    return value
  }

  return '可入住'
}

function normalizeCleanStatus(value: string): AdminOrganizationRoomSummary['cleanStatus'] {
  if (value === '待清洁' || value === '保洁中') {
    return value
  }

  return '已清洁'
}

function normalizeStaffStatus(value: string): AdminOrganizationStaffSummary['status'] {
  if (value === '休假' || value === '离职' || value === '待入职') {
    return value
  }

  return '在职'
}

function normalizeStaffLifecycleStatus(value: string): AdminOrganizationStaffSummary['lifecycleStatus'] {
  return value === '待入职' ? '待入职' : '已入职'
}

function normalizeStaffSource(value: string): AdminOrganizationStaffSummary['employmentSource'] {
  return value === '第三方合作' ? '第三方合作' : '自营'
}

function normalizeSummary(record: AdminOrganizationSummaryResponse): AdminOrganizationSummary {
  return {
    id: record.organizationId,
    tenantId: record.tenantId,
    name: record.name,
    address: record.address,
    phone: record.phone,
    status: normalizeStatus(record.status),
    establishedDate: record.establishedDate,
    manager: record.manager,
    managerPhone: record.managerPhone,
    description: record.description,
    lifecycleStatus: normalizeLifecycleStatus(record.lifecycleStatus),
    createdAt: record.createdAt,
    activatedAt: record.activatedAt ?? undefined,
    activationNote: record.activationNote ?? undefined,
    totalBeds: record.totalBeds,
    occupiedBeds: record.occupiedBeds,
    availableBeds: record.availableBeds,
    elderlyCount: record.elderlyCount,
    staffCount: record.staffCount,
    roomCount: record.roomCount,
    staffIntegrationStatus: normalizeStaffIntegrationStatus(record.staffIntegrationStatus),
  }
}

function normalizeRoom(record: AdminOrganizationRoomSummaryResponse): AdminOrganizationRoomSummary {
  return {
    roomId: record.roomId,
    name: record.name,
    floorName: record.floorName,
    type: normalizeRoomType(record.type),
    capacity: record.capacity,
    occupied: record.occupied,
    status: normalizeRoomStatus(record.status),
    cleanStatus: normalizeCleanStatus(record.cleanStatus),
  }
}

function normalizeStaff(record: AdminOrganizationDetailResponsePayload['staff'][number]): AdminOrganizationStaffSummary {
  return {
    id: record.staffId,
    name: record.name,
    role: record.role,
    department: record.department,
    employmentSource: normalizeStaffSource(record.employmentSource),
    partnerAgencyName: record.partnerAgencyName ?? undefined,
    status: normalizeStaffStatus(record.status),
    lifecycleStatus: normalizeStaffLifecycleStatus(record.lifecycleStatus),
    phone: record.phone,
  }
}

export async function fetchAdminOrganizationList(params: {
  keyword?: string
  status?: string
  lifecycleStatus?: string
  page?: number
  pageSize?: number
} = {}): Promise<AdminOrganizationListResponse> {
  const query = buildQuery(params)
  const response = await fetch(`/api/organizations${query}`, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(await readError(response, '机构列表查询失败。'))
  }

  const payload = await response.json() as AdminOrganizationListResponsePayload
  return {
    items: payload.items.map(normalizeSummary),
    total: payload.total,
    page: payload.page,
    pageSize: payload.pageSize,
  }
}

export async function fetchAdminOrganizationDetail(organizationId: string): Promise<AdminOrganizationDetail> {
  const response = await fetch(`/api/organizations/${organizationId}`, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(await readError(response, '机构详情查询失败。'))
  }

  const payload = await response.json() as AdminOrganizationDetailResponsePayload
  return {
    organization: normalizeSummary(payload.organization),
    rooms: payload.rooms.map(normalizeRoom),
    staff: payload.staff.map(normalizeStaff),
  }
}

export async function createAdminOrganization(request: AdminOrganizationCreateRequest): Promise<AdminOrganizationSummary> {
  const response = await fetch('/api/organizations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await readError(response, '机构建档失败。'))
  }

  return normalizeSummary(await response.json() as AdminOrganizationSummaryResponse)
}

export async function activateAdminOrganization(organizationId: string, request: AdminOrganizationActivateRequest = {}): Promise<AdminOrganizationSummary> {
  const response = await fetch(`/api/organizations/${organizationId}/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await readError(response, '机构启用失败。'))
  }

  return normalizeSummary(await response.json() as AdminOrganizationSummaryResponse)
}