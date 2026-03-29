import React from 'react'

interface FilterBarProps {
  children: React.ReactNode
  className?: string
}

export function FilterBar({ children, className = '' }: FilterBarProps) {
  return (
    <div className={`filter-bar ${className}`}>
      {children}
    </div>
  )
}

interface FilterItemProps {
  label?: string
  children: React.ReactNode
}

export function FilterItem({ label, children }: FilterItemProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {label && <span className="filter-bar-label">{label}</span>}
      {children}
    </div>
  )
}
