export type PlatformSurface = 'admin' | 'family' | 'nani'

export type LegacyPlatformModule = PlatformSurface | 'billing' | 'ai'

export type BillableModule =
  | 'dashboard'
  | 'elderly-care'
  | 'health-device'
  | 'alert-service'
  | 'ltci-service'
  | 'finance-service'
  | 'notification-service'
  | 'organization'
  | 'analytics'
  | 'ai-assistant'

export type PlatformModule = LegacyPlatformModule | BillableModule

export type PlatformFeature =
  | 'tenant-context'
  | 'visit-approval'
  | 'care-workflow'
  | 'family-summary'
  | 'dedicated-db'
  | 'advanced-audit'
  | 'module-billing'

export type PlatformAuthMode = 'demo' | 'platform'

export interface TenantDescriptor {
  tenantId: string
  tenantName: string
  plan: string
  dataIsolationMode: string
  enabledSurfaces?: PlatformSurface[]
  enabledModules: PlatformModule[]
  enabledFeatures: PlatformFeature[]
  branches: string[]
}

export interface TenantRuntimeSnapshot {
  enabledModules?: PlatformModule[] | null
  enabledFeatures?: PlatformFeature[] | null
}

export interface BillableModuleDescriptor {
  module: BillableModule
  label: string
  description: string
  entryHref: string
  billingUnit: string
}

export const BILLABLE_MODULE_CATALOG: Record<BillableModule, BillableModuleDescriptor> = {
  dashboard: {
    module: 'dashboard',
    label: '首页概览',
    description: '首页与日班工作台，承接管理总览与基础席位。',
    entryHref: '/',
    billingUnit: '管理席位',
  },
  'elderly-care': {
    module: 'elderly-care',
    label: '长者照护',
    description: '承接机构养老与居家养老的建档、档案、人脸和协同照护。',
    entryHref: '/elderly?scene=institutional',
    billingUnit: '在管老人 / 协同席位',
  },
  'health-device': {
    module: 'health-device',
    label: '健康设备',
    description: '承接健康档案、生命体征和设备监控。',
    entryHref: '/devices/realtime',
    billingUnit: '设备点位 / 监测对象',
  },
  'alert-service': {
    module: 'alert-service',
    label: '报警服务',
    description: '承接紧急呼叫、离床预警、异常预警和 SOS 处置。',
    entryHref: '/alerts',
    billingUnit: '活跃对象 / 事件量',
  },
  'ltci-service': {
    module: 'ltci-service',
    label: '评定与长护险',
    description: '承接评定受理、任务派发、标准治理和长护险协同。',
    entryHref: '/elderly/checkin',
    billingUnit: '认定单量 / 服务包',
  },
  'finance-service': {
    module: 'finance-service',
    label: '财务服务',
    description: '承接费用计算、账单生成、欠费预警和票据管理。',
    entryHref: '/financial',
    billingUnit: '账单量 / 结算量',
  },
  'notification-service': {
    module: 'notification-service',
    label: '通知服务',
    description: '承接短信推送、探视通知、定时提醒和公告广播。',
    entryHref: '/notifications',
    billingUnit: '发送量 / 通道包',
  },
  organization: {
    module: 'organization',
    label: '机构协同',
    description: '承接机构、院区、房间、物资和协同组织治理。',
    entryHref: '/organizations',
    billingUnit: '机构数 / 院区数',
  },
  analytics: {
    module: 'analytics',
    label: '运营分析',
    description: '承接经营看板、报表和数据分析。',
    entryHref: '/analytics',
    billingUnit: '分析模块包',
  },
  'ai-assistant': {
    module: 'ai-assistant',
    label: 'AI 运营',
    description: '承接 AI 洞察、规则、日志和多端预览。',
    entryHref: '/ai-assistant',
    billingUnit: 'AI 包 / 调用量',
  },
}

const LEGACY_MODULE_EXPANSION: Record<LegacyPlatformModule, BillableModule[]> = {
  admin: ['dashboard', 'elderly-care', 'health-device', 'alert-service', 'ltci-service', 'notification-service', 'organization', 'analytics'],
  family: [],
  nani: [],
  billing: ['finance-service'],
  ai: ['ai-assistant'],
}

const FALLBACK_TENANTS: Record<string, TenantDescriptor> = {
  'tenant-demo': {
    tenantId: 'tenant-demo',
    tenantName: '演示养老集团',
    plan: 'saas-professional',
    dataIsolationMode: 'shared-db-rls',
    enabledSurfaces: ['admin', 'family', 'nani'],
    enabledModules: ['dashboard', 'elderly-care', 'health-device', 'alert-service', 'ltci-service', 'finance-service', 'notification-service', 'organization', 'analytics', 'ai-assistant'],
    enabledFeatures: ['tenant-context', 'visit-approval', 'care-workflow', 'family-summary', 'module-billing'],
    branches: ['浦东店', '静安店'],
  },
  'tenant-private': {
    tenantId: 'tenant-private',
    tenantName: '私有化试点机构',
    plan: 'enterprise-dedicated',
    dataIsolationMode: 'database-per-tenant',
    enabledSurfaces: ['admin', 'nani'],
    enabledModules: ['dashboard', 'elderly-care', 'health-device', 'alert-service', 'ltci-service', 'finance-service', 'organization', 'analytics'],
    enabledFeatures: ['tenant-context', 'dedicated-db', 'advanced-audit', 'module-billing'],
    branches: ['总部院区'],
  },
  'tenant-lite': {
    tenantId: 'tenant-lite',
    tenantName: '轻量试用机构',
    plan: 'saas-lite',
    dataIsolationMode: 'shared-db-rls',
    enabledSurfaces: ['admin'],
    enabledModules: ['dashboard', 'elderly-care', 'health-device'],
    enabledFeatures: ['tenant-context', 'module-billing'],
    branches: ['示范院区'],
  },
}

function readRuntimeValue(clientKey: string, serverKey?: string) {
  return process.env[clientKey] ?? (serverKey ? process.env[serverKey] : undefined)
}

export function getPlatformAuthMode(): PlatformAuthMode {
  return readRuntimeValue('NEXT_PUBLIC_PLATFORM_AUTH_MODE', 'PLATFORM_AUTH_MODE') === 'platform'
    ? 'platform'
    : 'demo'
}

export function getDefaultTenantId() {
  return readRuntimeValue('NEXT_PUBLIC_DEFAULT_TENANT_ID', 'DEFAULT_TENANT_ID')
    ?? process.env.NURSING_DEV_TENANT_ID
    ?? 'tenant-demo'
}

export function isPlatformAuthStrict() {
  return readRuntimeValue('NEXT_PUBLIC_PLATFORM_AUTH_STRICT', 'PLATFORM_AUTH_STRICT') === 'true'
}

export function listFallbackTenants() {
  return Object.values(FALLBACK_TENANTS)
}

export function getFallbackTenantDescriptor(tenantId?: string | null): TenantDescriptor {
  const resolvedTenantId = tenantId && FALLBACK_TENANTS[tenantId] ? tenantId : getDefaultTenantId()
  return FALLBACK_TENANTS[resolvedTenantId] ?? FALLBACK_TENANTS['tenant-demo']
}

export function normalizeTenantModules(modules?: PlatformModule[] | null) {
  const sourceModules = modules?.length ? modules : getFallbackTenantDescriptor().enabledModules
  const resolved = new Set<BillableModule>()

  for (const moduleKey of sourceModules) {
    if (moduleKey in BILLABLE_MODULE_CATALOG) {
      resolved.add(moduleKey as BillableModule)
      continue
    }

    if (moduleKey in LEGACY_MODULE_EXPANSION) {
      for (const expandedModule of LEGACY_MODULE_EXPANSION[moduleKey as LegacyPlatformModule]) {
        resolved.add(expandedModule)
      }
    }
  }

  return Array.from(resolved)
}

export function getTenantRuntimeFlags(snapshot?: TenantRuntimeSnapshot | null) {
  const fallback = getFallbackTenantDescriptor()
  const enabledModules = normalizeTenantModules(snapshot?.enabledModules?.length ? snapshot.enabledModules : fallback.enabledModules)
  const enabledFeatures = snapshot?.enabledFeatures?.length ? snapshot.enabledFeatures : fallback.enabledFeatures

  return {
    enabledModules,
    authMode: getPlatformAuthMode(),
    aiAssistantEnabled: enabledModules.includes('ai-assistant'),
    careWorkflowEnabled: enabledFeatures.includes('care-workflow'),
    tenantContextEnabled: enabledFeatures.includes('tenant-context'),
    advancedAuditEnabled: enabledFeatures.includes('advanced-audit'),
    moduleBillingEnabled: enabledFeatures.includes('module-billing'),
  }
}

export function hasTenantModule(module: PlatformModule, snapshot?: TenantRuntimeSnapshot | null) {
  return normalizeTenantModules(snapshot?.enabledModules).includes(module as BillableModule)
}