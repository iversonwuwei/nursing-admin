import React from 'react'

interface DataCardProps {
  icon?: React.ReactNode
  title?: string
  subtitle?: React.ReactNode
  action?: React.ReactNode
  badge?: React.ReactNode
  children?: React.ReactNode
  className?: string
  bodyClassName?: string
}

export function DataCard({
  icon,
  title,
  subtitle,
  action,
  badge,
  children,
  className = '',
  bodyClassName = '',
}: DataCardProps) {
  return (
    <div className={`data-card ${className}`}>
      {(icon || title || action || badge) && (
        <div className="data-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            {icon && <div className="data-card-icon-wrap">{icon}</div>}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                {title}
              </div>
              {subtitle && (
                <div style={{ fontSize: '11.5px', marginTop: 1, color: 'var(--color-muted)' }}>
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {badge}
            {action}
          </div>
        </div>
      )}
      {children && (
        <div className={`data-card-body ${bodyClassName}`}>
          {children}
        </div>
      )}
    </div>
  )
}
