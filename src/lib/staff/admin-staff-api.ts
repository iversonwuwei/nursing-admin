export interface AdminStaffScheduleItem {
  day: string
  shift: string
}

export interface AdminStaffRecord {
  id: string
  tenantId: string
  name: string
  role: string
  department: string
  organizationId?: string
  organizationName?: string
  employmentSource: '自营' | '第三方合作'
  partnerAgencyId?: string
  partnerAgencyName?: string
  partnerAffiliationRole?: string
  phone: string
  status: '在职' | '休假' | '离职' | '待入职'
  gender: '男' | '女'
  email: string
  age: number
  performance: number
  attendance: number
  satisfaction: number
  hireDate: string
  schedule: AdminStaffScheduleItem[]
  certificates: string[]
  bonus: string
  lifecycleStatus: '待入职' | '已入职'
  createdAt: string
  activatedAt?: string
  onboardingNote?: string
}

interface AdminStaffRecordResponse {
  staffId: string
  tenantId: string
  name: string
  role: string
  department: string
  organizationId?: string | null
  organizationName?: string | null
  employmentSource: string
  partnerAgencyId?: string | null
  partnerAgencyName?: string | null
  partnerAffiliationRole?: string | null
  phone: string
  status: string
  gender: string
  email: string
  age: number
  performance: number
  attendance: number
  satisfaction: number
  hireDate: string
  schedule: AdminStaffScheduleItem[]
  certificates: string[]
  bonus: string
  lifecycleStatus: string
  createdAt: string
  activatedAt?: string | null
  onboardingNote?: string | null
}

interface AdminStaffListResponsePayload {
  items: AdminStaffRecordResponse[]
  total: number
  page: number
  pageSize: number
}

export interface AdminStaffListResponse {
  items: AdminStaffRecord[]
  total: number
  page: number
  pageSize: number
}

export interface AdminStaffCreateRequest {
  name: string
  role: string
  department: string
  organizationId?: string | null
  organizationName?: string | null
  employmentSource: string
  partnerAgencyId?: string | null
  partnerAgencyName?: string | null
  partnerAffiliationRole?: string | null
  phone: string
  gender: string
  email: string
  age: number
  hireDate: string
}

export interface AdminStaffActivateRequest {
  onboardingNote?: string | null
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

function normalizeEmploymentSource(value: string): AdminStaffRecord['employmentSource'] {
  return value === '第三方合作' ? '第三方合作' : '自营'
}

function normalizeStatus(value: string): AdminStaffRecord['status'] {
  if (value === '休假' || value === '离职' || value === '待入职') {
    return value
  }

  return '在职'
}

function normalizeGender(value: string): AdminStaffRecord['gender'] {
  return value === '女' ? '女' : '男'
}

function normalizeLifecycleStatus(value: string): AdminStaffRecord['lifecycleStatus'] {
  return value === '待入职' ? '待入职' : '已入职'
}

function normalizeRecord(record: AdminStaffRecordResponse): AdminStaffRecord {
  return {
    id: record.staffId,
    tenantId: record.tenantId,
    name: record.name,
    role: record.role,
    department: record.department,
    organizationId: record.organizationId ?? undefined,
    organizationName: record.organizationName ?? undefined,
    employmentSource: normalizeEmploymentSource(record.employmentSource),
    partnerAgencyId: record.partnerAgencyId ?? undefined,
    partnerAgencyName: record.partnerAgencyName ?? undefined,
    partnerAffiliationRole: record.partnerAffiliationRole ?? undefined,
    phone: record.phone,
    status: normalizeStatus(record.status),
    gender: normalizeGender(record.gender),
    email: record.email,
    age: record.age,
    performance: record.performance,
    attendance: record.attendance,
    satisfaction: record.satisfaction,
    hireDate: record.hireDate,
    schedule: record.schedule,
    certificates: record.certificates,
    bonus: record.bonus,
    lifecycleStatus: normalizeLifecycleStatus(record.lifecycleStatus),
    createdAt: record.createdAt,
    activatedAt: record.activatedAt ?? undefined,
    onboardingNote: record.onboardingNote ?? undefined,
  }
}

export async function fetchAdminStaffList(params: {
  keyword?: string
  department?: string
  employmentSource?: string
  status?: string
  lifecycleStatus?: string
  partnerAgency?: string
  page?: number
  pageSize?: number
} = {}): Promise<AdminStaffListResponse> {
  const query = buildQuery(params)
  const response = await fetch(`/api/staff${query}`, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(await readError(response, '员工列表查询失败。'))
  }

  const payload = await response.json() as AdminStaffListResponsePayload
  return {
    items: payload.items.map(normalizeRecord),
    total: payload.total,
    page: payload.page,
    pageSize: payload.pageSize,
  }
}

export async function fetchAdminStaffDetail(staffId: string): Promise<AdminStaffRecord> {
  const response = await fetch(`/api/staff/${staffId}`, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(await readError(response, '员工详情查询失败。'))
  }

  return normalizeRecord(await response.json() as AdminStaffRecordResponse)
}

export async function createAdminStaff(request: AdminStaffCreateRequest): Promise<AdminStaffRecord> {
  const response = await fetch('/api/staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await readError(response, '员工建档失败。'))
  }

  return normalizeRecord(await response.json() as AdminStaffRecordResponse)
}

export async function activateAdminStaff(staffId: string, request: AdminStaffActivateRequest = {}): Promise<AdminStaffRecord> {
  const response = await fetch(`/api/staff/${staffId}/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await readError(response, '员工确认入职失败。'))
  }

  return normalizeRecord(await response.json() as AdminStaffRecordResponse)
}