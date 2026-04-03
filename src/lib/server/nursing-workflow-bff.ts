import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getServerSession } from 'next-auth'

const ADMIN_BFF_URL = process.env.ADMIN_BFF_URL ?? 'http://localhost:5146'
const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:5265'
const DEV_TENANT_ID = process.env.NURSING_DEV_TENANT_ID ?? 'tenant-demo'

type WorkflowMethod = 'GET' | 'POST' | 'PUT'

type SessionUser = {
  id?: string | null
  name?: string | null
  email?: string | null
  role?: string | null
}

function resolveRoles(user: SessionUser) {
  if (user.role === 'super_admin') {
    return ['super-admin']
  }

  if (user.role === 'org_admin') {
    return ['org-admin']
  }

  return ['admin-operator']
}

async function getAccessToken(user: SessionUser) {
  const response = await fetch(`${IDENTITY_SERVICE_URL}/api/identity/dev-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    body: JSON.stringify({
      tenantId: DEV_TENANT_ID,
      userId: user.id ?? user.email ?? 'admin-web-user',
      userName: user.name ?? 'Admin Web User',
      roles: resolveRoles(user),
      scopes: ['admin:workflow', 'admin:care', 'admin:read', 'admin:write'],
    }),
  })

  if (!response.ok) {
    throw new Error(`identity dev-login failed: ${response.status}`)
  }

  const payload = await response.json() as { accessToken: string }
  return payload.accessToken
}

export async function forwardWorkflowRequest(method: WorkflowMethod, path: string, body?: unknown) {
  const session = await getServerSession(authOptions)
  const user = (session?.user ?? null) as SessionUser | null

  if (!user) {
    return new Response(JSON.stringify({ message: '未登录' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  const token = await getAccessToken(user)
  const response = await fetch(`${ADMIN_BFF_URL}${path}`, {
    method,
    cache: 'no-store',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Tenant-Id': DEV_TENANT_ID,
      'X-Correlation-Id': crypto.randomUUID(),
    },
    body: body === undefined || method === 'GET' ? undefined : JSON.stringify(body),
  })

  const text = await response.text()
  return new Response(text, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') ?? 'application/json',
    },
  })
}