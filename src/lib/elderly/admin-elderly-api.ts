export interface AdminElderProfileResponse {
  elderId: string
  tenantId: string
  elderName: string
  age: number
  gender: string
  careLevel: string
  roomNumber: string
  admissionStatus: string
  identityCard: string | null
  birthDate: string | null
  elderPhone: string | null
  familyContactName: string
  familyContactPhone: string
  adlScore: number | null
  cognitiveLevel: string | null
  medicalAlerts: string[]
  entrustmentType: string | null
  entrustmentOrganization: string | null
  monthlySubsidy: number | null
  serviceItems: string[]
  serviceNotes: string | null
}

export interface AdminCreateElderAdmissionRequest {
  admissionReference: string
  elderName: string
  age: number
  gender: string
  careLevel: string
  roomNumber: string
  identityCard: string | null
  birthDate: string | null
  elderPhone: string | null
  familyContactName: string
  familyContactPhone: string
  adlScore: number | null
  cognitiveLevel: string | null
  medicalAlerts: string[]
  entrustmentType: string | null
  entrustmentOrganization: string | null
  monthlySubsidy: number | null
  serviceItems: string[]
  serviceNotes: string | null
}

export interface AdminAdmissionRecordResponse {
  admissionId: string
  elderId: string
  tenantId: string
  elderName: string
  careLevel: string
  roomNumber: string
  status: string
  createdAtUtc: string
}

export interface AdminAssessmentAiRecommendationResponse {
  recommendedLevel: string
  confidence: number
  assessmentScore: number
  reasonSummary: string
  reasons: string[]
  focusTags: string[]
  planTemplateCode: string
}

export interface AdminCreateAssessmentCaseRequest {
  elderName: string
  age: number
  gender: string
  phone: string
  emergencyContact: string
  roomNumber: string
  requestedCareLevel: string
  chronicConditions: string
  medicationSummary: string
  allergySummary: string
  adlScore: number
  cognitiveLevel: string
  riskNotes: string
  entrustmentType: string | null
  entrustmentOrganization: string | null
  monthlySubsidy: number | null
  serviceItems: string[]
  serviceNotes: string | null
  sourceType: string
  sourceLabel: string | null
  sourceDocumentNames: string[]
  sourceSummary: string | null
}

export interface AdminAssessmentDecisionRequest {
  confirmedCareLevel: string
  reviewNote: string | null
  confirmedBy: string
}

export interface AdminAssessmentCaseResponse {
  assessmentId: string
  elderId: string
  tenantId: string
  elderName: string
  age: number
  gender: string
  roomNumber: string
  phone: string
  emergencyContact: string
  requestedCareLevel: string
  status: string
  chronicConditions: string
  medicationSummary: string
  allergySummary: string
  adlScore: number
  cognitiveLevel: string
  riskNotes: string
  entrustmentType: string | null
  entrustmentOrganization: string | null
  monthlySubsidy: number | null
  serviceItems: string[]
  serviceNotes: string | null
  sourceType: string
  sourceLabel: string
  sourceDocumentNames: string[]
  sourceSummary: string | null
  aiRecommendation: AdminAssessmentAiRecommendationResponse
  confirmedCareLevel: string | null
  reviewNote: string | null
  confirmedAtUtc: string | null
  confirmedBy: string | null
  createdAtUtc: string
}

export interface AdminAssessmentCaseListResponse {
  items: AdminAssessmentCaseResponse[]
  total: number
  page: number
  pageSize: number
}

export interface AdminUpdateElderProfileRequest {
  age: number | null
  gender: string | null
  careLevel: string
  roomNumber: string
  identityCard: string | null
  birthDate: string | null
  elderPhone: string | null
  familyContactName: string
  familyContactPhone: string
  adlScore: number | null
  cognitiveLevel: string | null
  medicalAlerts: string[]
  entrustmentType: string | null
  entrustmentOrganization: string | null
  monthlySubsidy: number | null
  serviceItems: string[]
  serviceNotes: string | null
}

export interface AdminElderHealthSummaryResponse {
  elderId: string
  tenantId: string
  elderName: string
  bloodPressure: string
  heartRate: number
  temperature: number
  bloodSugar: number
  oxygen: number
  riskSummary: string
  updatedAtUtc: string
}

export interface AdminElderListItemResponse {
  elderId: string
  tenantId: string
  elderName: string
  age: number
  gender: string
  careLevel: string
  roomNumber: string
  admissionStatus: string
  familyContactName: string
  admissionCreatedAtUtc: string | null
}

export interface AdminElderListResponse {
  items: AdminElderListItemResponse[]
  total: number
  page: number
  pageSize: number
}

export interface AdminHealthArchiveListItemResponse {
  elderId: string
  tenantId: string
  elderName: string
  roomNumber: string
  age: number
  careLevel: string
  admissionStatus: string
  bloodPressure: string
  heartRate: number
  temperature: number
  bloodSugar: number
  oxygen: number
  riskSummary: string
  updatedAtUtc: string
}

export interface AdminHealthArchiveListResponse {
  items: AdminHealthArchiveListItemResponse[]
  generatedAtUtc: string
}

export interface AdminCreateHealthArchiveRequest {
  elderId: string
  bloodPressure: string
  heartRate: number
  temperature: number
  bloodSugar: number
  oxygen: number
  riskSummary?: string
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

export async function fetchAdminElderList(params: {
  name?: string
  careLevel?: string
  status?: string
  page?: number
  pageSize?: number
} = {}): Promise<AdminElderListResponse> {
  const response = await fetch(`/api/elders${buildQuery(params)}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(await readError(response, `elder list request failed: ${response.status}`))
  }

  return await response.json() as AdminElderListResponse
}

export async function fetchAdminHealthArchives(keyword?: string): Promise<AdminHealthArchiveListResponse> {
  const response = await fetch(`/api/health/archives${buildQuery({ keyword })}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(await readError(response, `health archive request failed: ${response.status}`))
  }

  return await response.json() as AdminHealthArchiveListResponse
}

export async function createAdminHealthArchive(request: AdminCreateHealthArchiveRequest): Promise<AdminHealthArchiveListItemResponse> {
  const response = await fetch('/api/health/archives', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await readError(response, `health archive create failed: ${response.status}`))
  }

  return await response.json() as AdminHealthArchiveListItemResponse
}

export async function fetchAdminElderProfile(elderId: string): Promise<AdminElderProfileResponse> {
  const response = await fetch(`/api/elders/${encodeURIComponent(elderId)}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(await readError(response, `elder profile request failed: ${response.status}`))
  }

  return await response.json() as AdminElderProfileResponse
}

export async function fetchAdminElderHealthSummary(elderId: string): Promise<AdminElderHealthSummaryResponse> {
  const response = await fetch(`/api/elders/${encodeURIComponent(elderId)}/health-summary`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(await readError(response, `elder health request failed: ${response.status}`))
  }

  return await response.json() as AdminElderHealthSummaryResponse
}

export async function createAdminElderAdmission(request: AdminCreateElderAdmissionRequest): Promise<AdminAdmissionRecordResponse> {
  const response = await fetch('/api/elders/admissions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await readError(response, `elder admission request failed: ${response.status}`))
  }

  return await response.json() as AdminAdmissionRecordResponse
}

export async function fetchAdminAssessmentCases(params: {
  keyword?: string
  status?: string
  sourceType?: string
  scene?: string
  page?: number
  pageSize?: number
} = {}): Promise<AdminAssessmentCaseListResponse> {
  const response = await fetch(`/api/assessments${buildQuery(params)}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(await readError(response, `assessment list request failed: ${response.status}`))
  }

  return await response.json() as AdminAssessmentCaseListResponse
}

export async function createAdminAssessmentCase(request: AdminCreateAssessmentCaseRequest): Promise<AdminAssessmentCaseResponse> {
  const response = await fetch('/api/assessments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await readError(response, `assessment create failed: ${response.status}`))
  }

  return await response.json() as AdminAssessmentCaseResponse
}

export async function confirmAdminAssessmentDecision(
  assessmentId: string,
  request: AdminAssessmentDecisionRequest,
): Promise<AdminAssessmentCaseResponse> {
  const response = await fetch(`/api/assessments/${encodeURIComponent(assessmentId)}/decision`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await readError(response, `assessment decision update failed: ${response.status}`))
  }

  return await response.json() as AdminAssessmentCaseResponse
}

export async function activateAdminAssessmentCase(assessmentId: string): Promise<AdminAssessmentCaseResponse> {
  const response = await fetch(`/api/assessments/${encodeURIComponent(assessmentId)}/activate`, {
    method: 'PUT',
  })

  if (!response.ok) {
    throw new Error(await readError(response, `assessment activate failed: ${response.status}`))
  }

  return await response.json() as AdminAssessmentCaseResponse
}

export async function updateAdminElderProfile(elderId: string, request: AdminUpdateElderProfileRequest): Promise<AdminElderProfileResponse> {
  const response = await fetch(`/api/elders/${encodeURIComponent(elderId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await readError(response, `elder profile update failed: ${response.status}`))
  }

  return await response.json() as AdminElderProfileResponse
}