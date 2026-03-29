import React from 'react'

interface ProgressBarProps {
  value: number    // 0-100
  color?: 'primary' | 'success' | 'warning' | 'danger'
  showLabel?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function ProgressBar({
  value,
  color = 'primary',
  showLabel = false,
  size = 'sm',
  className = '',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value))
  const height = size === 'sm' ? 6 : 10

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
      <div
        className={`progress-bar ${className}`}
        style={{ height, flex: 1 }}
      >
        <div
          className={`progress-bar-fill ${color !== 'primary' ? color : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-muted)', minWidth: 32, textAlign: 'right' }}>
          {pct}%
        </span>
      )}
    </div>
  )
}
