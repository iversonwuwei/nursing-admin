'use client'

import {
  BarChart3,
  Bell,
  ChevronDown,
  ClipboardCheck,
  Home, Landmark,
  Menu,
  Monitor,
  Settings,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

/* ── Nav data ── */
const NAV_ITEMS = [
  { label: '首页概览', href: '/', icon: Home },
  {
    label: '机构管理',
    icon: Landmark,
    children: [
      { label: '分院管理', href: '/branch' },
      { label: '机构列表', href: '/organizations' },
      { label: '定点机构', href: '/organizations/partners' },
      { label: '房间管理', href: '/rooms' },
    ],
  },
  {
    label: '老人服务',
    icon: Users,
    children: [
      { label: '老人列表', href: '/elderly' },
      { label: '新建个案', href: '/elderly/new' },
      { label: '资料导入', href: '/elderly/import' },
      { label: '健康档案', href: '/elderly/health' },
      { label: '人脸录入', href: '/elderly/face' },
      { label: '探视记录', href: '/elderly/visits' },
      { label: '指标更新', href: '/elderly/vitals' },
    ],
  },
  {
    label: '团队协同',
    icon: UserCheck,
    children: [
      { label: '员工列表', href: '/staff' },
      { label: '新增员工', href: '/staff/new' },
    ],
  },
  {
    label: '长护险运营',
    icon: ClipboardCheck,
    children: [
      { label: '评定机构总览', href: '/nursing/services' },
      { label: '个案评定中心', href: '/elderly/checkin' },
      { label: '评定标准配置', href: '/nursing/packages' },
      { label: '认定方案模板', href: '/nursing/plans' },
      { label: '现场评定任务', href: '/staff/tasks' },
      { label: '派案排期', href: '/staff/schedule' },
      { label: '评定结算与质控', href: '/financial' },
      { label: '稽核报表', href: '/analytics/report' },
    ],
  },
  {
    label: '设备与健康',
    icon: Monitor,
    children: [
      { label: '设备总览', href: '/devices' },
      { label: '资产管理', href: '/devices/assets' },
      { label: '设备监控', href: '/devices/realtime' },
      { label: '设备状态', href: '/devices/status' },
      { label: '设备统计', href: '/devices/stats' },
      { label: '健康总览', href: '/health' },
      { label: '血压管理', href: '/health/bp' },
      { label: '心率管理', href: '/health/hr' },
      { label: '睡眠监测', href: '/health/sleep' },
      { label: '实时报警', href: '/alerts' },
      { label: '报警历史', href: '/alerts/history' },
    ],
  },
  {
    label: '运营分析',
    icon: BarChart3,
    children: [
      { label: '数据看板', href: '/analytics' },
      { label: '活动管理', href: '/activities' },
      { label: '事故报告', href: '/incidents', badge: 2 },
      { label: '物资管理', href: '/supplies', badge: 3 },
      { label: 'AI助手', href: '/ai-assistant' },
    ],
  },
]

/* ── Helpers ── */
function isActive(href: string, pathname: string) {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}
function isActiveExact(href: string, pathname: string) {
  return pathname === href
}

/* ── Desktop Nav Item ── */
function NavItem({ item, pathname, openDropdown, setOpenDropdown }: {
  item: typeof NAV_ITEMS[0]
  pathname: string
  openDropdown: string | null
  setOpenDropdown: (v: string | null) => void
}) {
  const hasChildren = !!item.children
  const isOpen = openDropdown === item.label
  const hasActiveChild = hasChildren && item.children!.some(c => isActiveExact(c.href, pathname))

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    if (hasChildren) setOpenDropdown(item.label)
  }
  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 120)
  }

  if (!hasChildren) {
    return (
      <Link
        href={item.href!}
        className={`navbar-item${isActive(item.href!, pathname) ? ' is-active' : ''}`}
        onClick={() => setOpenDropdown(null)}
      >
        <span className="navbar-item-icon">
          <item.icon size={16} strokeWidth={isActive(item.href!, pathname) ? 2.2 : 1.8} />
        </span>
        {item.label}
      </Link>
    )
  }

  return (
    <div
      className="navbar-group"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button className={`navbar-item${hasActiveChild ? ' is-active' : ''}`}>
        <span className="navbar-item-icon">
          <item.icon size={16} strokeWidth={1.8} />
        </span>
        <span>{item.label}</span>
        <ChevronDown
          size={12} strokeWidth={2}
          style={{
            marginLeft: 2, opacity: 0.6,
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 200ms ease',
          }}
        />
      </button>

      {isOpen && (
        <div className="navbar-dropdown">
          {item.children!.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className={`navbar-dropdown-item${isActiveExact(child.href, pathname) ? ' is-active' : ''}`}
              onClick={() => setOpenDropdown(null)}
            >
              {child.label}
              {'badge' in child && child.badge && (
                <span className="navbar-badge">{child.badge}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Mobile Drawer ── */
function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="mobile-drawer">
      <div className="mobile-drawer-overlay" onClick={onClose} />
      <div className="mobile-drawer-panel">
        <div className="mobile-drawer-header">
          <div className="navbar-logo-icon">NH</div>
          <div>
            <div className="navbar-logo-name">Nursing</div>
            <div className="navbar-logo-sub">管理系统</div>
          </div>
          <button
            onClick={onClose}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mobile-drawer-nav">
          {NAV_ITEMS.map(item => {
            const hasChildren = !!item.children
            const isOpen = openGroup === item.label

            if (!hasChildren) {
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={`mobile-nav-item${isActive(item.href!, pathname) ? ' is-active' : ''}`}
                  onClick={onClose}
                >
                  <item.icon size={16} strokeWidth={1.8} />
                  {item.label}
                </Link>
              )
            }

            return (
              <div key={item.label} className="mobile-nav-group">
                <div
                  className={`mobile-nav-item${item.children!.some(c => isActive(c.href, pathname)) ? ' is-active' : ''}`}
                  onClick={() => setOpenGroup(isOpen ? null : item.label)}
                >
                  <item.icon size={16} strokeWidth={1.8} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <ChevronDown
                    size={13}
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms', opacity: 0.6 }}
                  />
                </div>
                {isOpen && item.children!.map(child => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={`mobile-nav-child${isActiveExact(child.href, pathname) ? ' is-active' : ''}`}
                    onClick={onClose}
                  >
                    {child.label}
                    {'badge' in child && child.badge && (
                      <span className="navbar-badge" style={{ marginLeft: 6 }}>{child.badge}</span>
                    )}
                  </Link>
                ))}
              </div>
            )
          })}
        </nav>

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
          <button
            className="btn btn-secondary btn-sm w-full"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main Navbar ── */
export function TopNavbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <>
      <header className="navbar" ref={navRef}>
        {/* Logo */}
        <Link href="/" className="navbar-logo">
          <div className="navbar-logo-icon">NH</div>
          <div className="navbar-logo-text">
            <span className="navbar-logo-name">Nursing</span>
            <span className="navbar-logo-sub">管理系统</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="navbar-nav">
          {NAV_ITEMS.map(item => (
            <NavItem
              key={item.label}
              item={item}
              pathname={pathname}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
            />
          ))}
        </nav>

        {/* Right actions */}
        <div className="navbar-right">
          <Link href="/notifications" className={`navbar-icon-btn${isActive('/notifications', pathname) ? ' is-active' : ''}`} title="消息通知">
            <Bell size={18} strokeWidth={isActive('/notifications', pathname) ? 2.2 : 1.8} />
            <span className="notif-dot" />
          </Link>
          <Link href="/settings" className={`navbar-icon-btn${isActive('/settings', pathname) ? ' is-active' : ''}`} title="系统设置">
            <Settings size={18} strokeWidth={isActive('/settings', pathname) ? 2.2 : 1.8} />
          </Link>

          <div className="navbar-divider" />

          <div className="navbar-user">
            <div className="navbar-user-info">
              <div className="navbar-user-name">{session?.user?.name ?? '管理员'}</div>
              <div className="navbar-user-role">系统管理员</div>
            </div>
            <div
              className="navbar-avatar"
              onClick={() => signOut({ callbackUrl: '/login' })}
              title="点击退出登录"
              style={{ cursor: 'pointer' }}
            >
              {(session?.user?.name ?? '管').charAt(0)}
            </div>
          </div>

          {/* Hamburger (mobile) */}
          <button
            className="navbar-hamburger"
            onClick={() => setMobileOpen(true)}
            aria-label="打开菜单"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}
