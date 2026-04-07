'use client'

import {
  BarChart3,
  Bell,
  ChevronDown,
  ClipboardCheck,
  Home, Landmark,
  Menu,
  Monitor,
  MoreHorizontal,
  Settings,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/* ── Nav data ── */
const NAV_ITEMS = [
  { label: '首页概览', href: '/', icon: Home },
  { label: '日班工作台', href: '/operations/daily', icon: Bell },
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

const MOBILE_NAV_BREAKPOINT = 768
const NAV_ITEM_GAP = 2
const FALLBACK_MORE_WIDTH = 88

function hasActiveTopLevel(item: typeof NAV_ITEMS[0], pathname: string) {
  if (item.children) {
    return item.children.some((child) => isActiveExact(child.href, pathname))
  }

  return isActive(item.href!, pathname)
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
      <button
        type="button"
        className={`navbar-item${hasActiveChild ? ' is-active' : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
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

function OverflowNavItem({ items, pathname, openDropdown, setOpenDropdown }: {
  items: typeof NAV_ITEMS
  pathname: string
  openDropdown: string | null
  setOpenDropdown: (v: string | null) => void
}) {
  const isOpen = openDropdown === '__overflow__'
  const hasActiveChild = items.some((item) => hasActiveTopLevel(item, pathname))
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpenDropdown('__overflow__')
  }

  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 120)
  }

  return (
    <div
      className="navbar-group navbar-overflow-group"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        className={`navbar-item${hasActiveChild ? ' is-active' : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <span className="navbar-item-icon">
          <MoreHorizontal size={16} strokeWidth={1.8} />
        </span>
        <span>更多</span>
        <ChevronDown
          size={12}
          strokeWidth={2}
          style={{
            marginLeft: 2,
            opacity: 0.6,
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 200ms ease',
          }}
        />
      </button>

      {isOpen && (
        <div className="navbar-dropdown navbar-overflow-dropdown">
          {items.map((item) => {
            if (!item.children) {
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={`navbar-dropdown-item${isActive(item.href!, pathname) ? ' is-active' : ''}`}
                  onClick={() => setOpenDropdown(null)}
                >
                  <span className="navbar-item-icon">
                    <item.icon size={15} strokeWidth={1.8} />
                  </span>
                  {item.label}
                </Link>
              )
            }

            return (
              <div key={item.label} className="navbar-overflow-section">
                <div className="navbar-overflow-title">
                  <span className="navbar-item-icon">
                    <item.icon size={15} strokeWidth={1.8} />
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.children.map((child) => (
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
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Mobile Drawer ── */
function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const activeGroup = NAV_ITEMS.find(item => item.children?.some(child => isActiveExact(child.href, pathname)))?.label ?? null
  const resolvedOpenGroup = openGroup === null ? activeGroup : (openGroup || null)

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="mobile-drawer" id="mobile-navigation-drawer">
      <div className="mobile-drawer-overlay" onClick={onClose} />
      <div className="mobile-drawer-panel" role="dialog" aria-modal="true" aria-label="主导航菜单">
        <div className="mobile-drawer-header">
          <div className="navbar-logo-icon">NH</div>
          <div>
            <div className="navbar-logo-name">Nursing</div>
            <div className="navbar-logo-sub">管理系统</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mobile-drawer-nav">
          {NAV_ITEMS.map(item => {
            const hasChildren = !!item.children
            const isOpen = resolvedOpenGroup === item.label

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
                <button
                  type="button"
                  className={`mobile-nav-item${item.children!.some(c => isActive(c.href, pathname)) ? ' is-active' : ''}`}
                  onClick={() => setOpenGroup(isOpen ? '' : item.label)}
                  aria-expanded={isOpen}
                >
                  <item.icon size={16} strokeWidth={1.8} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <ChevronDown
                    size={13}
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms', opacity: 0.6 }}
                  />
                </button>
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
  const [openDropdownState, setOpenDropdownState] = useState<{ label: string | null; path: string }>({ label: null, path: '' })
  const [mobileDrawerPath, setMobileDrawerPath] = useState<string | null>(null)
  const [layoutMetrics, setLayoutMetrics] = useState({
    navWidth: 0,
    viewportWidth: 0,
    itemWidths: [] as number[],
    moreWidth: FALLBACK_MORE_WIDTH,
  })
  const navRef = useRef<HTMLElement>(null)
  const navListRef = useRef<HTMLElement>(null)
  const measureItemRefs = useRef<Array<HTMLSpanElement | null>>([])
  const moreMeasureRef = useRef<HTMLSpanElement | null>(null)
  const openDropdown = openDropdownState.path === pathname ? openDropdownState.label : null

  const setOpenDropdown = useCallback((value: string | null) => {
    setOpenDropdownState({ label: value, path: pathname })
  }, [pathname])

  const openMobileDrawer = useCallback(() => {
    setMobileDrawerPath(pathname)
  }, [pathname])

  const closeMobileDrawer = useCallback(() => {
    setMobileDrawerPath(null)
  }, [])

  const measureLayout = useCallback(() => {
    const nextItemWidths = NAV_ITEMS.map((_, index) => Math.ceil(measureItemRefs.current[index]?.offsetWidth ?? 0))
    const nextState = {
      navWidth: Math.ceil(navListRef.current?.clientWidth ?? 0),
      viewportWidth: window.innerWidth,
      itemWidths: nextItemWidths,
      moreWidth: Math.ceil(moreMeasureRef.current?.offsetWidth ?? FALLBACK_MORE_WIDTH),
    }

    setLayoutMetrics((current) => {
      const sameWidths =
        current.itemWidths.length === nextState.itemWidths.length &&
        current.itemWidths.every((width, index) => width === nextState.itemWidths[index])

      if (
        current.navWidth === nextState.navWidth &&
        current.viewportWidth === nextState.viewportWidth &&
        current.moreWidth === nextState.moreWidth &&
        sameWidths
      ) {
        return current
      }

      return nextState
    })
  }, [])

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [setOpenDropdown])

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpenDropdown(null)
      closeMobileDrawer()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [closeMobileDrawer, setOpenDropdown])

  useEffect(() => {
    let frameId = 0

    const scheduleMeasure = () => {
      cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(() => {
        measureLayout()
      })
    }

    scheduleMeasure()

    const observer = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => scheduleMeasure())

    if (observer) {
      if (navRef.current) observer.observe(navRef.current)
      if (navListRef.current) observer.observe(navListRef.current)
      measureItemRefs.current.forEach((element) => {
        if (element) observer.observe(element)
      })
      if (moreMeasureRef.current) observer.observe(moreMeasureRef.current)
    }

    window.addEventListener('resize', scheduleMeasure)

    return () => {
      cancelAnimationFrame(frameId)
      observer?.disconnect()
      window.removeEventListener('resize', scheduleMeasure)
    }
  }, [measureLayout])

  const isMobileCompact = layoutMetrics.viewportWidth > 0 && layoutMetrics.viewportWidth < MOBILE_NAV_BREAKPOINT

  const visibleCount = useMemo(() => {
    if (isMobileCompact) {
      return 0
    }

    if (
      layoutMetrics.navWidth <= 0 ||
      layoutMetrics.itemWidths.length !== NAV_ITEMS.length ||
      layoutMetrics.itemWidths.some((width) => width <= 0)
    ) {
      return NAV_ITEMS.length
    }

    const totalWidth =
      layoutMetrics.itemWidths.reduce((sum, width) => sum + width, 0) +
      NAV_ITEM_GAP * Math.max(layoutMetrics.itemWidths.length - 1, 0)

    if (totalWidth <= layoutMetrics.navWidth) {
      return NAV_ITEMS.length
    }

    let usedWidth = 0
    let nextVisibleCount = 0

    for (let index = 0; index < layoutMetrics.itemWidths.length; index += 1) {
      const itemWidth = layoutMetrics.itemWidths[index]
      const candidateWidth = nextVisibleCount === 0 ? itemWidth : usedWidth + NAV_ITEM_GAP + itemWidth
      const reserveOverflowWidth = index < layoutMetrics.itemWidths.length - 1
        ? layoutMetrics.moreWidth + NAV_ITEM_GAP
        : 0

      if (candidateWidth + reserveOverflowWidth <= layoutMetrics.navWidth) {
        usedWidth = candidateWidth
        nextVisibleCount = index + 1
        continue
      }

      break
    }

    return nextVisibleCount
  }, [isMobileCompact, layoutMetrics.itemWidths, layoutMetrics.moreWidth, layoutMetrics.navWidth])

  const visibleItems = isMobileCompact ? [] : NAV_ITEMS.slice(0, visibleCount)
  const overflowItems = isMobileCompact ? [] : NAV_ITEMS.slice(visibleCount)
  const mobileOpen = isMobileCompact && mobileDrawerPath === pathname

  return (
    <>
      <header className={`navbar${isMobileCompact ? ' is-mobile-compact' : ''}`} ref={navRef}>
        {/* Logo */}
        <Link href="/" className="navbar-logo">
          <div className="navbar-logo-icon">NH</div>
          <div className="navbar-logo-text">
            <span className="navbar-logo-name">Nursing</span>
            <span className="navbar-logo-sub">管理系统</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="navbar-nav" ref={navListRef} aria-label="主导航">
          {visibleItems.map((item) => (
            <NavItem
              key={item.label}
              item={item}
              pathname={pathname}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
            />
          ))}
          {overflowItems.length > 0 && (
            <OverflowNavItem
              items={overflowItems}
              pathname={pathname}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
            />
          )}
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
            onClick={openMobileDrawer}
            aria-label="打开菜单"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation-drawer"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      <div className="navbar-measure" aria-hidden="true">
        {NAV_ITEMS.map((item, index) => (
          <span
            key={`measure-${item.label}`}
            className="navbar-item navbar-item-measure"
            ref={(element) => {
              measureItemRefs.current[index] = element
            }}
          >
            <span className="navbar-item-icon">
              <item.icon size={16} strokeWidth={1.8} />
            </span>
            <span>{item.label}</span>
            {item.children && (
              <ChevronDown
                size={12}
                strokeWidth={2}
                style={{ marginLeft: 2, opacity: 0.6 }}
              />
            )}
          </span>
        ))}

        <span className="navbar-item navbar-item-measure" ref={moreMeasureRef}>
          <span className="navbar-item-icon">
            <MoreHorizontal size={16} strokeWidth={1.8} />
          </span>
          <span>更多</span>
          <ChevronDown
            size={12}
            strokeWidth={2}
            style={{ marginLeft: 2, opacity: 0.6 }}
          />
        </span>
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer
        key={`${pathname}-${mobileOpen ? 'open' : 'closed'}`}
        open={mobileOpen}
        onClose={closeMobileDrawer}
      />
    </>
  )
}
