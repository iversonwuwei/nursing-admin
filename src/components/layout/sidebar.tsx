'use client'

import {
  Bell,
  Bot,
  Building2,
  CalendarHeart,
  ChevronDown, ChevronRight, ClipboardCheck,
  DoorOpen,
  Heart,
  Home,
  Monitor,
  PieChart,
  Settings,
  ShieldAlert,
  UserCheck,
  Users,
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useState } from 'react'

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
      { label: '任务中心', href: '/staff/tasks' },
    ],
  },
  {
    label: '护理服务',
    icon: ClipboardCheck,
    children: [
      { label: '服务项目库', href: '/nursing/services' },
      { label: '服务套餐', href: '/nursing/packages' },
      { label: '护理计划', href: '/nursing/plans' },
      { label: '护理排班', href: '/nursing/schedule' },
      { label: '服务打卡', href: '/nursing/checkin' },
    ],
  },
  {
    label: '健康监测',
    icon: Heart,
    children: [
      { label: '健康总览', href: '/health' },
      { label: '血压管理', href: '/health/bp' },
      { label: '心率管理', href: '/health/hr' },
      { label: '睡眠监测', href: '/health/sleep' },
    ],
  },
  { label: '房间管理', href: '/rooms', icon: DoorOpen },
  {
    label: '设备管理',
    icon: Monitor,
    children: [
      { label: '设备总览', href: '/devices' },
      { label: '资产管理', href: '/devices/assets' },
      { label: '实时监控', href: '/devices/realtime' },
      { label: '设备状态', href: '/devices/status' },
      { label: '设备统计', href: '/devices/stats' },
    ],
  },
  {
    label: '报警中心',
    icon: Bell,
    children: [
      { label: '实时报警', href: '/alerts' },
      { label: '报警历史', href: '/alerts/history' },
    ],
  },
  {
    label: '数据分析',
    icon: PieChart,
    children: [
      { label: '运营分析', href: '/analytics' },
      { label: '报表中心', href: '/analytics/report' },
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
  {
    label: '系统设置',
    icon: Settings,
    children: [
      { label: '系统配置', href: '/settings' },
      { label: '角色权限', href: '/settings/roles' },
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
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
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
