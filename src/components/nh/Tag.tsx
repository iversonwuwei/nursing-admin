import React from 'react'

export type TagVariant = 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'purple' | 'neutral'

interface TagProps {
  children: React.ReactNode
  variant?: TagVariant
  className?: string
  style?: React.CSSProperties
}

export function Tag({ children, variant = 'neutral', className = '', style }: TagProps) {
  return (
    <span className={`tag ${variant} ${className}`} style={style}>
      {children}
    </span>
  )
}
