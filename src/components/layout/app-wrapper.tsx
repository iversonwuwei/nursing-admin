'use client'

import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Sidebar } from './sidebar'

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // 登录页直接渲染
  if (pathname === '/login') return <>{children}</>

  // 未挂载 / loading
  if (!mounted || status === 'loading') {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    )
  }

  // 未登录 → 跳转
  if (status === 'unauthenticated') {
    router.push('/login')
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <header className="main-header">
          <div className="header-title">Nursing Admin</div>
          <div className="header-actions">
            <button className="header-icon-btn" title="消息">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span className="notification-dot" />
            </button>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              paddingLeft: 12,
              borderLeft: '1px solid var(--border)',
              marginLeft: 4,
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 600,
              }}>
                {session?.user?.name?.charAt(0) ?? '管'}
              </div>
              <span style={{ fontSize: 14, fontWeight: 500 }}>
                {session?.user?.name ?? '管理员'}
              </span>
            </div>
          </div>
        </header>
        <main className="main-body">
          {children}
        </main>
      </div>
    </div>
  )
}
