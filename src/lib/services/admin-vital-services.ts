async function readError(response: Response, fallback: string) {
  try {
    const payload = await response.json() as { message?: string; detail?: string; title?: string }
    return payload.message || payload.detail || payload.title || fallback
  } catch {
    return fallback
  }
}

async function requestJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`/api/admin-vitals${path}`, {
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

export interface AdminVitalsEntry {
  observationId: string
  tenantId: string
  elderId: string
  elderName: string
  roomNumber: string
  bloodPressure: string
  heartRate: number
  temperature: number
  bloodSugar: number
  oxygen: number
  recordedBy: string
  recordedAtUtc: string
}

interface AdminVitalObservationResponse {
  observationId: string
  tenantId: string
  elderId: string
  elderName: string
  roomNumber: string
  bloodPressure: string
  heartRate: number
  temperature: number
  bloodSugar: number
  oxygen: number
  recordedBy: string
  recordedAtUtc: string
}

export interface FetchAdminVitalsOptions {
  take?: number
  elderId?: string
  keyword?: string
}

export async function fetchAdminVitals(options: FetchAdminVitalsOptions = {}): Promise<AdminVitalsEntry[]> {
  const params = new URLSearchParams()
  if (options.take) params.set('take', String(options.take))
  if (options.elderId) params.set('elderId', options.elderId)
  if (options.keyword) params.set('keyword', options.keyword)
  const qs = params.toString()
  const payload = await requestJson<AdminVitalObservationResponse[]>(qs ? `/vitals?${qs}` : '/vitals')
  return payload.map(item => ({ ...item }))
}

export interface CreateAdminVitalsPayload {
  elderId: string
  bloodPressure: string
  heartRate: number
  temperature: number
  bloodSugar: number
  oxygen: number
  recordedBy: string
  recordedAtUtc?: string | null
}

export async function createAdminVitals(payload: CreateAdminVitalsPayload): Promise<AdminVitalsEntry> {
  const body = {
    elderId: payload.elderId,
    bloodPressure: payload.bloodPressure,
    heartRate: payload.heartRate,
    temperature: payload.temperature,
    bloodSugar: payload.bloodSugar,
    oxygen: payload.oxygen,
    recordedBy: payload.recordedBy,
    recordedAtUtc: payload.recordedAtUtc ?? null,
  }
  const response = await requestJson<AdminVitalObservationResponse>('/vitals', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return { ...response }
}
