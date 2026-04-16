'use client'

import { DataCard, PageHeader, Tag } from '@/components/nh'
import type { BillableModule } from '@/lib/platform/saas-config'
import { readSessionPlatformState } from '@/lib/platform/session'
import { LockKeyhole } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useMemo } from 'react'

interface FallbackLink {
  href: string
  label: string
}

interface ModuleEntitlementGateProps {
  module: BillableModule
  pageTitle: string
  moduleLabel: string
  children: React.ReactNode
  disabledSummary?: string
  fallbackLinks?: FallbackLink[]
}

export function ModuleEntitlementGate({
  module,
  pageTitle,
  moduleLabel,
  children,
  disabledSummary,
  fallbackLinks = [
    { href: '/', label: '返回首页' },
    { href: '/analytics', label: '查看数据看板' },
  ],
}: ModuleEntitlementGateProps) {
  const { data: session } = useSession()
  const platformState = useMemo(() => readSessionPlatformState(session), [session])

  if (platformState.enabledModules.includes(module)) {
    return <>{children}</>
  }

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title={pageTitle}
        subtitle={`${platformState.tenantName} 当前未启用${moduleLabel}，页面保留为只读禁用态。`}
        actions={<Tag variant="warning">Module Disabled</Tag>}
      />

      <DataCard
        icon={<LockKeyhole size={16} />}
        title={`当前租户未启用${moduleLabel}`}
        subtitle={`租户套餐：${platformState.tenantPlan} · 认证来源：${platformState.authSource === 'platform' ? '平台认证' : 'Demo 认证'}`}
        badge={<Tag variant="danger">Entitlement Off</Tag>}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
            {disabledSummary ?? `当前租户没有 ${moduleLabel} entitlement。导航已隐藏对应入口；直接访问该路由时会保留只读说明页，避免功能暴露与套餐口径不一致。`}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {fallbackLinks.map(link => (
              <Link key={link.href} href={link.href} className="btn btn-secondary btn-sm">{link.label}</Link>
            ))}
          </div>
        </div>
      </DataCard>
    </div>
  )
}