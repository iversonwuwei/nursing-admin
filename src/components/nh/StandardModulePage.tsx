import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { DataCard } from './DataCard'
import { EmptyState } from './EmptyState'
import { PageHeader } from './PageHeader'
import { StatCard } from './StatCard'
import { Tag } from './Tag'

type StatColor = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
type TagVariant = 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'purple' | 'neutral'

export interface StandardModuleAction {
  label: string
  href: string
  variant?: 'primary' | 'secondary' | 'ghost'
}

export interface StandardModuleStat {
  label: string
  value: string | number
  sub?: string
  color?: StatColor
  icon: LucideIcon
  trend?: { value: string; direction: 'up' | 'down' }
}

export interface StandardModuleHighlight {
  title: string
  description: string
  meta?: string
  icon: LucideIcon
  tag?: {
    label: string
    variant?: TagVariant
  }
}

export interface StandardModuleWorkflow {
  title: string
  description: string
  owner: string
  timeline: string
  status: {
    label: string
    variant?: TagVariant
  }
}

export interface StandardModuleTableColumn {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
}

export interface StandardModuleTable {
  title: string
  subtitle?: string
  columns: StandardModuleTableColumn[]
  rows: Array<Record<string, ReactNode>>
  emptyState?: {
    title: string
    description: string
  }
}

export interface StandardModulePageConfig {
  title: string
  subtitle: string
  actions?: StandardModuleAction[]
  stats: StandardModuleStat[]
  highlightsTitle?: string
  highlightsSubtitle?: string
  highlights: StandardModuleHighlight[]
  workflowTitle?: string
  workflowSubtitle?: string
  workflows: StandardModuleWorkflow[]
  table?: StandardModuleTable
  note?: string
}

function renderAction(action: StandardModuleAction) {
  const variant = action.variant ?? 'secondary'
  const className = variant === 'primary'
    ? 'btn btn-primary btn-sm'
    : variant === 'ghost'
      ? 'btn btn-ghost btn-sm'
      : 'btn btn-secondary btn-sm'

  return (
    <Link key={action.href} href={action.href} className={className}>
      {action.label}
    </Link>
  )
}

export function StandardModulePage({ config }: { config: StandardModulePageConfig }) {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        actions={config.actions && config.actions.length > 0 ? (
          <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
            {config.actions.map(renderAction)}
          </div>
        ) : undefined}
      />

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        {config.stats.map(stat => {
          const Icon = stat.icon
          return (
            <StatCard
              key={stat.label}
              icon={<Icon size={18} />}
              label={stat.label}
              value={stat.value}
              sub={stat.sub}
              trend={stat.trend}
              color={stat.color}
            />
          )
        })}
      </div>

      <div className="dashboard-grid-2" style={{ marginBottom: 16 }}>
        <DataCard
          title={config.highlightsTitle ?? '关键能力'}
          subtitle={config.highlightsSubtitle ?? '按设计系统规范组织页面内容与业务重点'}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            {config.highlights.map(item => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                    background: 'var(--color-card)',
                    minHeight: 132,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={17} />
                    </div>
                    {item.tag ? <Tag variant={item.tag.variant}>{item.tag.label}</Tag> : null}
                  </div>
                  <div style={{ marginTop: 14, fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                  <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.description}</div>
                  {item.meta ? (
                    <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--color-text)', fontWeight: 600 }}>{item.meta}</div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </DataCard>

        <DataCard
          title={config.workflowTitle ?? '实施重点'}
          subtitle={config.workflowSubtitle ?? '围绕录入、协同、复核、追踪四个阶段推进'}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {config.workflows.map(item => (
              <div
                key={item.title}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 14,
                  background: 'var(--color-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                  <Tag variant={item.status.variant}>{item.status.label}</Tag>
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.description}</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10, fontSize: 11.5, color: 'var(--color-text)' }}>
                  <span>责任角色：{item.owner}</span>
                  <span>交付窗口：{item.timeline}</span>
                </div>
              </div>
            ))}
          </div>
        </DataCard>
      </div>

      {config.table ? (
        <DataCard title={config.table.title} subtitle={config.table.subtitle}>
          {config.table.rows.length > 0 ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    {config.table.columns.map(column => (
                      <th
                        key={column.key}
                        style={{ textAlign: column.align ?? 'left' }}
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {config.table.rows.map((row, index) => (
                    <tr key={index} className="table-hover-row">
                      {config.table!.columns.map(column => (
                        <td
                          key={column.key}
                          style={{ textAlign: column.align ?? 'left', verticalAlign: 'top' }}
                        >
                          {row[column.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title={config.table.emptyState?.title ?? '暂无数据'}
              description={config.table.emptyState?.description ?? '后续接入真实业务数据后展示'}
            />
          )}
        </DataCard>
      ) : null}

      {config.note ? (
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.7 }}>
          {config.note}
        </div>
      ) : null}
    </div>
  )
}