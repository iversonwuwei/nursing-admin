import React from 'react'
import { CheckCircle2, Inbox, Search, AlertTriangle } from 'lucide-react'

type EmptyVariant = 'default' | 'success' | 'danger' | 'search'

const ICONS: Record<EmptyVariant, React.ReactNode> = {
  default:  <Inbox size={24} />,
  success:  <CheckCircle2 size={24} />,
  danger:   <AlertTriangle size={24} />,
  search:   <Search size={24} />,
}

interface EmptyStateProps {
  variant?: EmptyVariant
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ variant = 'default', title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`}>
      <div className={`empty-icon${variant !== 'default' ? ` ${variant}` : ''}`}>
        {ICONS[variant]}
      </div>
      <div className="empty-title">{title}</div>
      {description && <div className="empty-desc">{description}</div>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}
