'use client'

import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { TopNavbar } from './TopNavbar'

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { status } = useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Login page — no navbar
  if (pathname === '/login') return <>{children}</>

  // Loading
  if (!mounted || status === 'loading') {
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

  if (status === 'unauthenticated') {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return null
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
