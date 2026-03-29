import React from 'react'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  trend?: { value: string; direction: 'up' | 'down' }
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  icon?: React.ReactNode
}

export function StatCard({ label, value, sub, trend, color = 'primary', icon }: StatCardProps) {
  return (
    <div className={`kpi-card ${color}`}>
      {icon && (
        <div className={`kpi-icon ${color}`}>
          {icon}
        </div>
      )}
      <div className="kpi-content">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          {sub && <span className="kpi-sub">{sub}</span>}
          {trend && (
            <span className={`kpi-trend ${trend.direction}`}>
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
