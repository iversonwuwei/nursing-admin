'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Activity, AlertTriangle, BarChart3,
} from 'lucide-react'

const DATA_NAV = [
  { label: '健康监测', href: '/health-monitoring', icon: Activity },
  { label: '报警中心', href: '/alerts', icon: AlertTriangle },
  { label: '数据分析', href: '/data-dashboard', icon: BarChart3 },
]

interface DataDashboardLayoutProps {
  children: React.ReactNode
}

export function DataDashboardLayout({ children }: DataDashboardLayoutProps) {
  const pathname = usePathname()

  return (
    <div style={{ display: 'flex', gap: 20, minHeight: 'calc(100vh - var(--navbar-height) - 48px)' }}>
      {/* Left sidebar nav */}
      <aside style={{
        width: 200,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--color-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          padding: '0 12px 8px',
        }}>
          数据中心
        </div>
        {DATA_NAV.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 12px',
                borderRadius: 8,
                fontSize: 13.5,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                background: isActive ? 'var(--color-primary-light)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 120ms ease',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--color-bg)'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--color-primary)'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--color-text)'
                }
              }}
            >
              <Icon size={15} style={{ flexShrink: 0 }} />
              {label}
            </Link>
          )
        })}
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}
