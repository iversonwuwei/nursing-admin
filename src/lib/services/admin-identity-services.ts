async function readError(response: Response, fallback: string) {
  try {
    const payload = await response.json() as { message?: string; detail?: string; title?: string }
    return payload.message || payload.detail || payload.title || fallback
  } catch {
    return fallback
  }
}

async function requestJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`/api/admin-identity${path}`, {
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

export interface AdminRoleDescriptor {
  id: string
  name: string
  description: string
  scope: string
  abilities: string[]
  isHighRisk: boolean
}

interface AdminRoleDescriptorResponse {
  id: string
  name: string
  description: string
  scope: string
  abilities: string[]
  isHighRisk: boolean
}

export async function fetchAdminRoles(): Promise<AdminRoleDescriptor[]> {
  const payload = await requestJson<AdminRoleDescriptorResponse[]>('/roles')
  return payload.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    scope: item.scope,
    abilities: item.abilities,
    isHighRisk: item.isHighRisk,
  }))
}
