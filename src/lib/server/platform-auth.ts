import { getDefaultTenantId, getFallbackTenantDescriptor, getPlatformAuthMode, isPlatformAuthStrict, type PlatformFeature, type PlatformModule, type TenantDescriptor } from '@/lib/platform/saas-config'

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:5265'
const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL ?? 'http://localhost:5186'

export type DemoRole = 'super_admin' | 'org_admin'

type AdminDirectoryUser = {
  id: string
  name: string
  email: string
  role: DemoRole
}

type LoginIdentityResponse = {
  accessToken: string
  tokenType: string
  expiresAtUtc: string
  tenantId: string
  userId: string
  userName: string
  roles: string[]
  scopes: string[]
}

type SessionUserLike = {
  id?: string | null
  name?: string | null
  email?: string | null
  role?: string | null
  tenantId?: string | null
}

export type AuthenticatedAdminUser = AdminDirectoryUser & {
  tenantId: string
  tenantName: string
  tenantPlan: string
  enabledModules: PlatformModule[]
  enabledFeatures: PlatformFeature[]
  authSource: 'demo' | 'platform'
  accessToken?: string
  scopes?: string[]
}

function getAdminDirectoryUser(username?: string | null, password?: string | null): AdminDirectoryUser | null {
  if (username === 'admin' && password === 'admin123') {
    return {
      id: '1',
      name: '管理员',
      email: 'admin@nursing.com',
      role: 'super_admin',
    }
  }

  if (username === 'manager' && password === 'manager123') {
    return {
      id: '2',
      name: '机构管理员',
      email: 'manager@nursing.com',
      role: 'org_admin',
    }
  }

  return null
}

function resolveRoles(user: { role?: string | null }) {
  if (user.role === 'super_admin') return ['super-admin']
  if (user.role === 'org_admin') return ['org-admin']
  return ['admin-operator']
}

function normalizeTenantId(value?: string | null) {
  return getFallbackTenantDescriptor(value).tenantId ?? getDefaultTenantId()
}

async function issuePlatformAccessToken(user: SessionUserLike, tenantId: string) {
  const response = await fetch(`${IDENTITY_SERVICE_URL}/api/identity/dev-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    body: JSON.stringify({
      tenantId,
      userId: user.id ?? user.email ?? 'admin-web-user',
      userName: user.name ?? 'Admin Web User',
      roles: resolveRoles(user),
      scopes: ['admin:workflow', 'admin:care', 'admin:read', 'admin:write', 'admin:config'],
    }),
  })

  if (!response.ok) {
    throw new Error(`identity dev-login failed: ${response.status}`)
  }

  return response.json() as Promise<LoginIdentityResponse>
}

async function readTenantDescriptor(accessToken: string, tenantId: string) {
  const response = await fetch(`${TENANT_SERVICE_URL}/api/tenants/${tenantId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Tenant-Id': tenantId,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`tenant descriptor failed: ${response.status}`)
  }

  return response.json() as Promise<TenantDescriptor>
}

export async function authenticateAdminUser(credentials?: Record<string, string> | null): Promise<AuthenticatedAdminUser | null> {
  const directoryUser = getAdminDirectoryUser(credentials?.username, credentials?.password)
  if (!directoryUser) {
    return null
  }

  const tenantId = normalizeTenantId(credentials?.tenantId)
  const fallbackTenant = getFallbackTenantDescriptor(tenantId)

  if (getPlatformAuthMode() !== 'platform') {
    return {
      ...directoryUser,
      tenantId: fallbackTenant.tenantId,
      tenantName: fallbackTenant.tenantName,
      tenantPlan: fallbackTenant.plan,
      enabledModules: fallbackTenant.enabledModules,
      enabledFeatures: fallbackTenant.enabledFeatures,
      authSource: 'demo',
      scopes: ['admin:read', 'admin:write'],
    }
  }

  try {
    const identity = await issuePlatformAccessToken(directoryUser, tenantId)
    const tenant = await readTenantDescriptor(identity.accessToken, tenantId).catch(() => fallbackTenant)

    return {
      ...directoryUser,
      tenantId: tenant.tenantId,
      tenantName: tenant.tenantName,
      tenantPlan: tenant.plan,
      enabledModules: tenant.enabledModules,
      enabledFeatures: tenant.enabledFeatures,
      authSource: 'platform',
      accessToken: identity.accessToken,
      scopes: identity.scopes,
    }
  } catch (error) {
    if (isPlatformAuthStrict()) {
      throw error
    }

    console.warn(`[platform-auth] falling back to demo auth for tenant ${tenantId}: ${error instanceof Error ? error.message : 'unknown error'}`)
    return {
      ...directoryUser,
      tenantId: fallbackTenant.tenantId,
      tenantName: fallbackTenant.tenantName,
      tenantPlan: fallbackTenant.plan,
      enabledModules: fallbackTenant.enabledModules,
      enabledFeatures: fallbackTenant.enabledFeatures,
      authSource: 'demo',
      scopes: ['admin:read', 'admin:write'],
    }
  }
}

export async function resolveServerAccessContext(user: SessionUserLike, accessToken?: string | null) {
  const tenantId = normalizeTenantId(user.tenantId)

  if (accessToken) {
    return {
      accessToken,
      tenantId,
    }
  }

  const identity = await issuePlatformAccessToken(user, tenantId)
  return {
    accessToken: identity.accessToken,
    tenantId,
  }
}