'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import {
  Home, Building2, Users, UserPlus, Heart, ScanFace, Video,
  UserCheck, CalendarDays, DoorOpen, Monitor,
  CalendarHeart, ShieldAlert, Package, PieChart,
  Bot, Activity, ChevronDown, ChevronRight,
} from 'lucide-react'

const NAV = [
  { label: '概览', href: '/', icon: Home },
  { label: '分院管理', href: '/branch', icon: Building2 },
  {
    label: '老人服务',
    icon: Users,
    children: [
      { label: '老人列表', href: '/elderly' },
      { label: '办理入住', href: '/elderly/checkin' },
      { label: '健康档案', href: '/elderly/health' },
      { label: '人脸录入', href: '/elderly/face' },
      { label: '探视记录', href: '/elderly/visits' },
      { label: '指标更新', href: '/elderly/vitals' },
    ],
  },
  {
    label: '人员管理',
    icon: UserCheck,
    children: [
      { label: '员工列表', href: '/staff' },
      { label: '排班管理', href: '/staff/schedule' },
    ],
  },
  { label: '房间管理', href: '/rooms', icon: DoorOpen },
  {
    label: '设备管理',
    icon: Monitor,
    children: [
      { label: '设备列表', href: '/equipment' },
      { label: '设备监控', href: '/equipment/monitor' },
      { label: '设备状态', href: '/equipment/status' },
      { label: '设备统计', href: '/equipment/stats' },
    ],
  },
  { label: '活动管理', href: '/activities', icon: CalendarHeart },
  {
    label: '运营管理',
    icon: ShieldAlert,
    children: [
      { label: '事故报告', href: '/incidents', badge: 2 },
      { label: '物资管理', href: '/supplies', badge: 3 },
      { label: '财务收支', href: '/financial', icon: PieChart },
      { label: 'AI助手', href: '/ai-assistant', icon: Bot },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())

  const toggle = (label: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev)
      next.has(label) ? next.delete(label) : next.add(label)
      return next
    })
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">NH</div>
        <div className="sidebar-logo-text">
          <div className="sidebar-logo-name">Nursing</div>
          <div className="sidebar-logo-sub">管理系统</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV.map(item => {
          if (item.children) {
            const isOpen = openGroups.has(item.label)
            const hasActive = item.children.some(c => isActive(c.href))
            return (
              <div key={item.label} className={`sidebar-group${isOpen ? ' is-open' : ''}`}>
                <button
                  className={`sidebar-group-btn${isOpen ? ' is-open' : ''}`}
                  onClick={() => toggle(item.label)}
                >
                  <item.icon size={16} className="sidebar-item-icon" />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {isOpen
                    ? <ChevronDown size={13} style={{ opacity: 0.5 }} />
                    : <ChevronRight size={13} style={{ opacity: 0.5 }} />
                  }
                </button>
                <div className="sidebar-dropdown">
                  {item.children.map(child => (
                    <Link
                      key={child.href}
                      href={child.href!}
                      className={`sidebar-dropdown-item${isActive(child.href!) ? ' is-active' : ''}`}
                    >
                      {'icon' in child && child.icon && (() => { const Icon = child.icon as React.ElementType; return <Icon size={14} /> })()}
                      <span>{child.label}</span>
                      {'badge' in child && child.badge && (
                        <span className="sidebar-badge">{child.badge}</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )
          }

          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`sidebar-item${isActive(item.href!) ? ' is-active' : ''}`}
            >
              <Icon size={16} className="sidebar-item-icon" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="sidebar-footer">
        <div
          className="sidebar-user"
          onClick={() => signOut({ callbackUrl: '/login' })}
          title="点击退出登录"
        >
          <div className="sidebar-avatar">
            {(session?.user?.name ?? '管').charAt(0)}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{session?.user?.name ?? '管理员'}</div>
            <div className="sidebar-user-role">系统管理员</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
