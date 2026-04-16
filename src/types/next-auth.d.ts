import type { PlatformFeature, PlatformModule } from '@/lib/platform/saas-config'
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    role?: string
    tenantId?: string
    tenantName?: string
    tenantPlan?: string
    enabledModules?: PlatformModule[]
    enabledFeatures?: PlatformFeature[]
    authSource?: 'demo' | 'platform'
    accessToken?: string
    scopes?: string[]
  }

  interface Session {
    user: DefaultSession['user'] & {
      role?: string
      tenantId?: string
      tenantName?: string
      tenantPlan?: string
      enabledModules?: PlatformModule[]
      enabledFeatures?: PlatformFeature[]
      authSource?: 'demo' | 'platform'
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    tenantId?: string
    tenantName?: string
    tenantPlan?: string
    enabledModules?: PlatformModule[]
    enabledFeatures?: PlatformFeature[]
    authSource?: 'demo' | 'platform'
    platformAccessToken?: string
    scopes?: string[]
  }
}