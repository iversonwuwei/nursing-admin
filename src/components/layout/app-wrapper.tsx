'use client'

import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { TopNavbar } from './TopNavbar'

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { status } = useSession()

  useEffect(() => {
    if (pathname !== '/login' && status === 'unauthenticated') {
      router.replace('/login')
    }
  }, [pathname, router, status])

  // Login page — no navbar
  if (pathname === '/login') return <>{children}</>

  // Loading
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-bg)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'var(--color-primary)', margin: '0 auto 12px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>加载中...</div>
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <TopNavbar />
      <div className="page-body">
        {children}
      </div>
    </div>
  )
}
