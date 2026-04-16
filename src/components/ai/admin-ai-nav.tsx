'use client'

import { appendAiTrackingContext, readAiTrackingContext } from '@/lib/ai-context'
import { Bot, Cpu, MessageSquareText, Power, ScrollText } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/ai-assistant', label: 'AI 总览', icon: Bot },
  { href: '/ai-assistant/inference', label: '推理详情', icon: Cpu },
  { href: '/ai-assistant/qa', label: 'AI 问答', icon: MessageSquareText },
  { href: '/ai-assistant/rules', label: '规则治理', icon: Power },
  { href: '/ai-assistant/logs', label: '问答日志', icon: ScrollText },
  { href: '/ai-assistant/staff-app', label: '员工 APP + AI', icon: Bot },
  { href: '/ai-assistant/family-app', label: '家属 APP + AI', icon: Bot },
]

export function AdminAiNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const trackingContext = readAiTrackingContext(searchParams)

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
      {NAV_ITEMS.map(item => {
        const active = pathname === item.href
        const Icon = item.icon
        const target = item.href.endsWith('/inference')
          ? 'inference'
          : item.href.endsWith('/qa')
            ? undefined
          : item.href.endsWith('/rules')
            ? 'rules'
            : item.href.endsWith('/logs')
              ? 'logs'
              : undefined
        const href = appendAiTrackingContext(item.href, trackingContext ? { ...trackingContext, target } : null)

        return (
          <Link
            key={item.href}
            href={href}
            className={`btn btn-sm ${active ? 'btn-primary' : 'btn-secondary'}`}
            style={{ textDecoration: 'none' }}
          >
            <Icon size={12} />
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}