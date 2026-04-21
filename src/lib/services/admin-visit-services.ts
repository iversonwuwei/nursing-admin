async function readError(response: Response, fallback: string) {
  try {
    const payload = await response.json() as { message?: string; detail?: string; title?: string }
    return payload.message || payload.detail || payload.title || fallback
  } catch {
    return fallback
  }
}

async function requestJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`/api/admin-visits${path}`, {
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

export interface AdminVisitAppointment {
  visitId: string
  elderId: string
  tenantId: string
  visitorName: string
  relation: string
  phone: string | null
  plannedAtUtc: string
  visitType: string
  status: string
  notes: string | null
}

interface AdminVisitAppointmentResponse {
  visitId: string
  elderId: string
  tenantId: string
  visitorName: string
  relation: string
  phone: string | null
  plannedAtUtc: string
  visitType: string
  status: string
  notes: string | null
}

interface VisitAppointmentResponse {
  visitId: string
  elderId: string
  tenantId: string
  visitorName: string
  relation: string
  status: string
  plannedAtUtc: string
}

export async function fetchAdminVisits(take = 100): Promise<AdminVisitAppointment[]> {
  const payload = await requestJson<AdminVisitAppointmentResponse[]>(`/visits?take=${take}`)
  return payload.map(item => ({
    visitId: item.visitId,
    elderId: item.elderId,
    tenantId: item.tenantId,
    visitorName: item.visitorName,
    relation: item.relation,
    phone: item.phone ?? null,
    plannedAtUtc: item.plannedAtUtc,
    visitType: item.visitType,
    status: item.status,
    notes: item.notes ?? null,
  }))
}

export interface CreateAdminVisitPayload {
  elderId: string
  visitorName: string
  relation: string
  phone: string
  plannedAtUtc: string
  visitType: string
  notes: string
}

export async function createAdminVisit(payload: CreateAdminVisitPayload): Promise<{ visitId: string; status: string }> {
  const response = await requestJson<VisitAppointmentResponse>('/visits', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return { visitId: response.visitId, status: response.status }
}
