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