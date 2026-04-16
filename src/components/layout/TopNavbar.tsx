'use client'

import type { BillableModule } from '@/lib/platform/saas-config'
import { readSessionPlatformState } from '@/lib/platform/session'
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  ChevronDown,
  ClipboardCheck,
  DollarSign,
  Home,
  Landmark,
  Menu,
  Monitor,
  MoreHorizontal,
  Settings,
  X,
  type LucideIcon,
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type NavChildItem =
  | { type: 'section'; label: string }
  | { type: 'link'; label: string; href: string; badge?: number }

interface NavItemConfig {
  label: string
  icon: LucideIcon
  module?: BillableModule
  href?: string
  children?: NavChildItem[]
}

type DemoSessionRole = 'super_admin' | 'org_admin'

const ROLE_LABELS: Record<DemoSessionRole, string> = {
  super_admin: '系统管理员',
  org_admin: '机构管理员',
}

const TOP_LEVEL_ORDER_BY_ROLE: Record<DemoSessionRole, string[]> = {
  super_admin: [
    '首页概览',
    '日班工作台',
    '长者照护',
    '健康设备',
    '报警服务',
    '评定与长护险',
    '财务服务',
    '通知服务',
    '机构协同',
    '运营分析',
    'AI运营',
  ],
  org_admin: [
    '日班工作台',
    '长者照护',
    '报警服务',
    '评定与长护险',
    '财务服务',
    '通知服务',
    '健康设备',
    '机构协同',
    '运营分析',
    '首页概览',
    'AI运营',
  ],
}

function isNavLinkChild(child: NavChildItem): child is Extract<NavChildItem, { type: 'link' }> {
  return child.type === 'link'
}

/* ── Nav data ── */
const BASE_NAV_ITEMS: NavItemConfig[] = [
  { label: '首页概览', href: '/', icon: Home, module: 'dashboard' },
  { label: '日班工作台', href: '/operations/daily', icon: Bell, module: 'dashboard' },
  {
    label: '长者照护',
    icon: ClipboardCheck,
    module: 'elderly-care',
    children: [
      { type: 'section', label: '机构养老' },
      { type: 'link', label: '入住建档', href: '/elderly/new' },
      { type: 'link', label: '老人档案', href: '/elderly?scene=institutional' },
      { type: 'link', label: '探视记录', href: '/elderly/visits' },
      { type: 'link', label: '指标更新', href: '/elderly/vitals' },
      { type: 'section', label: '居家养老' },
      { type: 'link', label: '健康档案', href: '/elderly/health?scene=home' },
      { type: 'link', label: '人脸录入', href: '/elderly/face?scene=home' },
      { type: 'link', label: '协同人员池', href: '/staff?scene=home' },
      { type: 'link', label: '协同人员入职', href: '/staff/new?scene=home' },
    ],
  },
  {
    label: '健康设备',
    icon: Monitor,
    module: 'health-device',
    children: [
      { type: 'link', label: '设备监控', href: '/devices/realtime' },
      { type: 'link', label: '设备总览', href: '/devices' },
      { type: 'link', label: '健康总览', href: '/health' },
      { type: 'link', label: '血压管理', href: '/health/bp' },
      { type: 'link', label: '心率管理', href: '/health/hr' },
      { type: 'link', label: '睡眠监测', href: '/health/sleep' },
      { type: 'link', label: '资产管理', href: '/devices/assets' },
      { type: 'link', label: '设备状态', href: '/devices/status' },
      { type: 'link', label: '设备统计', href: '/devices/stats' },
    ],
  },
  {
    label: '报警服务',
    icon: AlertTriangle,
    module: 'alert-service',
    children: [
      { type: 'link', label: '报警中心', href: '/alerts' },
      { type: 'link', label: '报警历史', href: '/alerts/history' },
      { type: 'link', label: '事故报告', href: '/incidents', badge: 2 },
    ],
  },
  {
    label: '评定与长护险',
    icon: Settings,
    module: 'ltci-service',
    children: [
      { type: 'section', label: '业务总览' },
      { type: 'link', label: '长护险业务总览', href: '/nursing/services' },
      { type: 'section', label: '认定受理' },
      { type: 'link', label: '资料导入受理', href: '/elderly/import' },
      { type: 'link', label: '个案评定中心', href: '/elderly/checkin' },
      { type: 'section', label: '执行协同' },
      { type: 'link', label: '现场评定任务', href: '/staff/tasks' },
      { type: 'link', label: '派案排期', href: '/staff/schedule' },
      { type: 'link', label: '服务打卡管理', href: '/nursing/checkin' },
      { type: 'link', label: '定点机构协同', href: '/organizations/partners' },
      { type: 'section', label: '结算监管' },
      { type: 'link', label: '评定结算与质控', href: '/financial' },
      { type: 'link', label: '稽核报表', href: '/analytics/report' },
      { type: 'section', label: '标准治理' },
      { type: 'link', label: '评定标准配置', href: '/nursing/packages' },
      { type: 'link', label: '认定方案模板', href: '/nursing/plans' },
    ],
  },
  {
    label: '财务服务',
    icon: DollarSign,
    module: 'finance-service',
    children: [
      { type: 'link', label: '结算与质控', href: '/financial' },
      { type: 'link', label: '财务分析报表', href: '/analytics/report' },
    ],
  },
  {
    label: '通知服务',
    icon: Bell,
    module: 'notification-service',
    children: [
      { type: 'link', label: '通知中心', href: '/notifications' },
    ],
  },
  {
    label: '机构协同',
    icon: Landmark,
    module: 'organization',
    children: [
      { type: 'link', label: '机构列表', href: '/organizations' },
      { type: 'link', label: '新增机构', href: '/organizations/new' },
      { type: 'link', label: '分院管理', href: '/branch' },
      { type: 'link', label: '房间床位', href: '/rooms' },
      { type: 'link', label: '定点机构协同', href: '/organizations/partners' },
      { type: 'link', label: '物资管理', href: '/supplies', badge: 3 },
    ],
  },
  {
    label: '运营分析',
    icon: BarChart3,
    module: 'analytics',
    children: [
      { type: 'link', label: '数据看板', href: '/analytics' },
      { type: 'link', label: '经营仪表盘', href: '/data-dashboard' },
      { type: 'link', label: '活动管理', href: '/activities' },
    ],
  },
  {
    label: 'AI运营',
    icon: Bot,
    module: 'ai-assistant',
    children: [
      { type: 'link', label: 'AI助手', href: '/ai-assistant' },
    ],
  },
]

function filterNavItemsByRuntime(items: NavItemConfig[], enabledModules: BillableModule[]) {
  return items.filter(item => !item.module || enabledModules.includes(item.module))
}

function getOrderedNavItems(role?: string | null, enabledModules: BillableModule[] = []) {
  const order = role && role in TOP_LEVEL_ORDER_BY_ROLE
    ? TOP_LEVEL_ORDER_BY_ROLE[role as DemoSessionRole]
    : TOP_LEVEL_ORDER_BY_ROLE.super_admin

  const rankMap = new Map(order.map((label, index) => [label, index]))
  const navItems = filterNavItemsByRuntime(BASE_NAV_ITEMS, enabledModules)

  return [...navItems].sort((left, right) => {
    const leftRank = rankMap.get(left.label) ?? Number.MAX_SAFE_INTEGER
    const rightRank = rankMap.get(right.label) ?? Number.MAX_SAFE_INTEGER

    return leftRank - rightRank
  })
}

/* ── Helpers ── */
function normalizeNavHref(href: string) {
  return href.split('?')[0]
}

function isActive(href: string, pathname: string) {
  const normalizedHref = normalizeNavHref(href)
  if (normalizedHref === '/') return pathname === '/'
  return pathname.startsWith(normalizedHref)
}
function isActiveExact(href: string, pathname: string) {
  return pathname === normalizeNavHref(href)
}

function isActiveNavChild(child: Extract<NavChildItem, { type: 'link' }>, pathname: string) {
  return isActiveExact(child.href, pathname)
}

const MOBILE_NAV_BREAKPOINT = 768
const NAV_ITEM_GAP = 2
const FALLBACK_MORE_WIDTH = 88

function hasActiveTopLevel(item: NavItemConfig, pathname: string) {
  if (item.children) {
    return item.children.some((child) => isNavLinkChild(child) && isActiveNavChild(child, pathname))
  }

  return isActive(item.href!, pathname)
}

/* ── Desktop Nav Item ── */
function NavItem({ item, pathname, openDropdown, setOpenDropdown }: {
  item: NavItemConfig
  pathname: string
  openDropdown: string | null
  setOpenDropdown: (v: string | null) => void
}) {
  const hasChildren = !!item.children
  const isOpen = openDropdown === item.label
  const hasActiveChild = hasChildren && item.children!.some(child => isNavLinkChild(child) && isActiveNavChild(child, pathname))

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
          {item.children!.map((child, index) => {
            if (!isNavLinkChild(child)) {
              return (
                <div
                  key={`${item.label}-section-${child.label}-${index}`}
                  style={{
                    padding: '10px 14px 6px',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: 'var(--color-muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  {child.label}
                </div>
              )
            }

            return (
              <Link
                key={child.href}
                href={child.href}
                className={`navbar-dropdown-item${isActiveNavChild(child, pathname) ? ' is-active' : ''}`}
                onClick={() => setOpenDropdown(null)}
              >
                {child.label}
                {child.badge && (
                  <span className="navbar-badge">{child.badge}</span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function OverflowNavItem({ items, pathname, openDropdown, setOpenDropdown }: {
  items: NavItemConfig[]
  pathname: string
  openDropdown: string | null
  setOpenDropdown: (v: string | null) => void
}) {
  const isOpen = openDropdown === '__overflow__'
  const hasActiveChild = items.some((item) => hasActiveTopLevel(item, pathname))
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const moreButtonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pendingFocusRef = useRef<'first' | 'last' | 'active' | null>(null)
  const [scrollHints, setScrollHints] = useState({ top: false, bottom: false })

  const getFocusableDropdownItems = useCallback(() => {
    const dropdown = dropdownRef.current
    if (!dropdown) {
      return [] as HTMLAnchorElement[]
    }

    return Array.from(dropdown.querySelectorAll<HTMLAnchorElement>('.navbar-dropdown-item'))
  }, [])

  const updateScrollHints = useCallback(() => {
    const dropdown = dropdownRef.current
    if (!dropdown) {
      return
    }

    const maxScrollTop = dropdown.scrollHeight - dropdown.clientHeight

    setScrollHints({
      top: dropdown.scrollTop > 4,
      bottom: maxScrollTop - dropdown.scrollTop > 4,
    })
  }, [])

  const focusOverflowItem = useCallback((target: 'first' | 'last' | 'active' | number) => {
    const itemsToFocus = getFocusableDropdownItems()
    if (!itemsToFocus.length) {
      return
    }

    let nextIndex = 0
    if (target === 'last') {
      nextIndex = itemsToFocus.length - 1
    } else if (target === 'active') {
      const activeIndex = itemsToFocus.findIndex(item => item.classList.contains('is-active'))
      nextIndex = activeIndex >= 0 ? activeIndex : 0
    } else if (typeof target === 'number') {
      nextIndex = Math.min(Math.max(target, 0), itemsToFocus.length - 1)
    }

    const nextItem = itemsToFocus[nextIndex]
    nextItem?.focus()
    nextItem?.scrollIntoView({ block: 'nearest' })
    updateScrollHints()
  }, [getFocusableDropdownItems, updateScrollHints])

  const openOverflowDropdown = useCallback((focusTarget?: 'first' | 'last' | 'active') => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
    }
    pendingFocusRef.current = focusTarget ?? null
    setOpenDropdown('__overflow__')
  }, [setOpenDropdown])

  const handleEnter = () => {
    openOverflowDropdown()
  }

  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 120)
  }

  const handleButtonKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openOverflowDropdown('first')
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      openOverflowDropdown('last')
    }
  }

  const handleDropdownKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const itemsToFocus = getFocusableDropdownItems()
    if (!itemsToFocus.length) {
      return
    }

    const currentIndex = itemsToFocus.findIndex(item => item === document.activeElement)
    const safeIndex = currentIndex >= 0 ? currentIndex : 0

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusOverflowItem(safeIndex + 1)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusOverflowItem(safeIndex - 1)
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      focusOverflowItem('first')
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      focusOverflowItem('last')
      return
    }

    if (event.key === 'PageDown') {
      event.preventDefault()
      focusOverflowItem(safeIndex + 5)
      return
    }

    if (event.key === 'PageUp') {
      event.preventDefault()
      focusOverflowItem(safeIndex - 5)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      setOpenDropdown(null)
      moreButtonRef.current?.focus()
    }
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      const dropdown = dropdownRef.current
      if (!dropdown) {
        return
      }

      if (pendingFocusRef.current) {
        focusOverflowItem(pendingFocusRef.current)
        pendingFocusRef.current = null
      } else {
        const activeItem = dropdown.querySelector('.navbar-dropdown-item.is-active') as HTMLElement | null
        activeItem?.scrollIntoView({ block: 'nearest' })
      }
      updateScrollHints()
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [focusOverflowItem, isOpen, pathname, updateScrollHints])

  return (
    <div
      className="navbar-group navbar-overflow-group"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        ref={moreButtonRef}
        type="button"
        className={`navbar-item${hasActiveChild ? ' is-active' : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="navbar-overflow-dropdown"
        onKeyDown={handleButtonKeyDown}
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
        <div
          id="navbar-overflow-dropdown"
          ref={dropdownRef}
          className={`navbar-dropdown navbar-overflow-dropdown${scrollHints.top ? ' show-top-fade' : ''}${scrollHints.bottom ? ' show-bottom-fade' : ''}`}
          onScroll={updateScrollHints}
          onKeyDown={handleDropdownKeyDown}
        >
          <div className="navbar-overflow-fade navbar-overflow-fade-top" aria-hidden="true" />
          <div className="navbar-overflow-fade navbar-overflow-fade-bottom" aria-hidden="true" />
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
                {item.children.map((child, index) => {
                  if (!isNavLinkChild(child)) {
                    return (
                      <div
                        key={`${item.label}-overflow-section-${child.label}-${index}`}
                        style={{
                          padding: '10px 14px 6px',
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          color: 'var(--color-muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {child.label}
                      </div>
                    )
                  }

                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`navbar-dropdown-item${isActiveNavChild(child, pathname) ? ' is-active' : ''}`}
                      onClick={() => setOpenDropdown(null)}
                    >
                      {child.label}
                      {child.badge && (
                        <span className="navbar-badge">{child.badge}</span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Mobile Drawer ── */
function MobileDrawer({ open, onClose, items }: { open: boolean; onClose: () => void; items: NavItemConfig[] }) {
  const pathname = usePathname()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const activeGroup = items.find(item => item.children?.some(child => isNavLinkChild(child) && isActiveNavChild(child, pathname)))?.label ?? null
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
          {items.map(item => {
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
                  className={`mobile-nav-item${item.children!.some(child => isNavLinkChild(child) && isActiveNavChild(child, pathname)) ? ' is-active' : ''}`}
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
                {isOpen && item.children!.map((child, index) => {
                  if (!isNavLinkChild(child)) {
                    return (
                      <div
                        key={`${item.label}-mobile-section-${child.label}-${index}`}
                        style={{
                          padding: '10px 16px 4px 48px',
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          color: 'var(--color-muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {child.label}
                      </div>
                    )
                  }

                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`mobile-nav-child${isActiveNavChild(child, pathname) ? ' is-active' : ''}`}
                      onClick={onClose}
                    >
                      {child.label}
                      {child.badge && (
                        <span className="navbar-badge" style={{ marginLeft: 6 }}>{child.badge}</span>
                      )}
                    </Link>
                  )
                })}
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
  const router = useRouter()
  const { data: session } = useSession()
  const platformState = useMemo(() => readSessionPlatformState(session), [session])
  const notificationsEnabled = platformState.enabledModules.includes('notification-service')
  const navItems = useMemo(
    () => getOrderedNavItems(platformState.role, platformState.enabledModules),
    [platformState.enabledModules, platformState.role],
  )
  const roleLabel = platformState.role && platformState.role in ROLE_LABELS
    ? ROLE_LABELS[platformState.role as DemoSessionRole]
    : ROLE_LABELS.super_admin
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

  const handleSignOut = useCallback(async () => {
    try {
      await signOut({ redirect: false, callbackUrl: '/login' })
      router.replace('/login')
      router.refresh()
    } catch {
      window.location.assign('/login')
    }
  }, [router])

  const openMobileDrawer = useCallback(() => {
    setMobileDrawerPath(pathname)
  }, [pathname])

  const closeMobileDrawer = useCallback(() => {
    setMobileDrawerPath(null)
  }, [])

  const measureLayout = useCallback(() => {
    const nextItemWidths = navItems.map((_, index) => Math.ceil(measureItemRefs.current[index]?.offsetWidth ?? 0))
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
  }, [navItems])

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
      layoutMetrics.itemWidths.length !== navItems.length ||
      layoutMetrics.itemWidths.some((width) => width <= 0)
    ) {
      return navItems.length
    }

    const totalWidth =
      layoutMetrics.itemWidths.reduce((sum, width) => sum + width, 0) +
      NAV_ITEM_GAP * Math.max(layoutMetrics.itemWidths.length - 1, 0)

    if (totalWidth <= layoutMetrics.navWidth) {
      return navItems.length
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
  }, [isMobileCompact, layoutMetrics.itemWidths, layoutMetrics.moreWidth, layoutMetrics.navWidth, navItems.length])

  const visibleItems = isMobileCompact ? [] : navItems.slice(0, visibleCount)
  const overflowItems = isMobileCompact ? [] : navItems.slice(visibleCount)
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
          {notificationsEnabled ? (
            <Link href="/notifications" className={`navbar-icon-btn${isActive('/notifications', pathname) ? ' is-active' : ''}`} title="消息通知">
              <Bell size={18} strokeWidth={isActive('/notifications', pathname) ? 2.2 : 1.8} />
              <span className="notif-dot" />
            </Link>
          ) : null}
          <Link href="/settings" className={`navbar-icon-btn${isActive('/settings', pathname) ? ' is-active' : ''}`} title="系统设置">
            <Settings size={18} strokeWidth={isActive('/settings', pathname) ? 2.2 : 1.8} />
          </Link>

          <div className="navbar-divider" />

          <div className="navbar-user">
            <div className="navbar-user-info">
              <div className="navbar-user-name">{session?.user?.name ?? '管理员'}</div>
              <div className="navbar-user-role">{platformState.tenantName} · {platformState.enabledModules.length} 模块 · {roleLabel}</div>
            </div>
            <button
              type="button"
              className="navbar-avatar"
              onClick={() => {
                void handleSignOut()
              }}
              aria-label="退出登录"
              title="点击退出登录"
            >
              {(session?.user?.name ?? '管').charAt(0)}
            </button>
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
        {navItems.map((item, index) => (
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
        items={navItems}
      />
    </>
  )
}
