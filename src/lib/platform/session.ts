import { getFallbackTenantDescriptor, getTenantRuntimeFlags, normalizeTenantModules, type BillableModule, type PlatformFeature } from '@/lib/platform/saas-config'
import type { Session } from 'next-auth'

export interface PlatformSessionState {
  authSource: 'demo' | 'platform'
  role: string | null
  tenantId: string
  tenantName: string
  tenantPlan: string
  enabledModules: BillableModule[]
  enabledFeatures: PlatformFeature[]
  runtimeFlags: ReturnType<typeof getTenantRuntimeFlags>
}

export function readSessionPlatformState(session?: Session | null) {
  const tenant = getFallbackTenantDescriptor(session?.user?.tenantId)
  const enabledModules = normalizeTenantModules(session?.user?.enabledModules?.length ? session.user.enabledModules : tenant.enabledModules)
  const enabledFeatures = session?.user?.enabledFeatures?.length ? session.user.enabledFeatures : tenant.enabledFeatures

  return {
    authSource: session?.user?.authSource ?? 'demo',
    role: session?.user?.role ?? null,
    tenantId: session?.user?.tenantId ?? tenant.tenantId,
    tenantName: session?.user?.tenantName ?? tenant.tenantName,
    tenantPlan: session?.user?.tenantPlan ?? tenant.plan,
    enabledModules,
    enabledFeatures: enabledFeatures as PlatformFeature[],
    runtimeFlags: getTenantRuntimeFlags({ enabledModules, enabledFeatures }),
  } satisfies PlatformSessionState
}