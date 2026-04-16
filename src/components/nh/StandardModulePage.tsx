import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { DataCard } from './DataCard'
import { EmptyState } from './EmptyState'
import { InteractionRailLayout } from './InteractionRailLayout'
import { PageHeader } from './PageHeader'
import { PageHelpCard } from './PageHelpCard'
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

function buildPageGuideItems(config: StandardModulePageConfig) {
  const items = [
    config.actions && config.actions.length > 0
      ? `主入口：${config.actions.slice(0, 2).map(action => action.label).join(' / ')}`
      : '主入口：当前页面以概览、对比和只读查看为主。',
    config.highlights.length > 0
      ? `重点主题：${config.highlights.slice(0, 3).map(item => item.title).join('、')}`
      : '重点主题：当前页未配置高亮主题。',
    config.workflows.length > 0
      ? `流程节奏：${config.workflows.slice(0, 3).map(item => item.title).join(' -> ')}`
      : '流程节奏：当前页未配置流程说明。',
  ]

  if (config.table) {
    items.push(`数据视图：${config.table.title}，当前示例 ${config.table.rows.length} 条。`)
  }

  return items.slice(0, 4)
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

export function StandardModulePage({ config, routePath }: { config: StandardModulePageConfig; routePath?: string }) {
  const guideItems = buildPageGuideItems(config)
  const helpHref = routePath ? `/help${routePath}` : undefined

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

      <InteractionRailLayout
        main={(
          <>
            <div className="kpi-grid">
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

            <DataCard
              title={config.highlightsTitle ?? '关键能力'}
              subtitle={config.highlightsSubtitle ?? '首屏聚焦当前页面真正需要先看到的能力块与数据入口'}
            >
              <div className="standard-module-highlight-grid">
                {config.highlights.map(item => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="standard-module-highlight-card">
                      <div className="standard-module-highlight-head">
                        <div className="standard-module-highlight-icon">
                          <Icon size={17} />
                        </div>
                        {item.tag ? <Tag variant={item.tag.variant}>{item.tag.label}</Tag> : null}
                      </div>
                      <div className="standard-module-highlight-title">{item.title}</div>
                      <div className="standard-module-highlight-description">{item.description}</div>
                      {item.meta ? (
                        <div className="standard-module-highlight-meta">{item.meta}</div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </DataCard>

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
          </>
        )}
        rail={(
          <>
            <DataCard title="页面导览" subtitle="右侧仅保留最小必要上下文，帮助用户快速判断此页职责。">
              <div className="standard-module-guide-list">
                {guideItems.map(item => (
                  <div key={item} className="standard-module-guide-item">{item}</div>
                ))}
              </div>
            </DataCard>

            <DataCard
              title={config.workflowTitle ?? '实施重点'}
              subtitle={config.workflowSubtitle ?? '完整背景说明后置到主内容之后的上下文区，只保留流程节奏与责任边界'}
            >
              <div className="standard-module-workflow-list">
                {config.workflows.map(item => (
                  <div key={item.title} className="standard-module-workflow-card">
                    <div className="standard-module-workflow-head">
                      <div className="standard-module-workflow-title">{item.title}</div>
                      <Tag variant={item.status.variant}>{item.status.label}</Tag>
                    </div>
                    <div className="standard-module-workflow-description">{item.description}</div>
                    <div className="standard-module-workflow-meta">
                      <span>责任角色：{item.owner}</span>
                      <span>交付窗口：{item.timeline}</span>
                    </div>
                  </div>
                ))}
              </div>
            </DataCard>

            {config.note ? (
              <DataCard title="交付边界" subtitle="记录当前页的目标与未纳入范围，避免把说明重新堆回首屏。">
                <div style={{ fontSize: 12.5, lineHeight: 1.75, color: 'var(--color-text)' }}>{config.note}</div>
              </DataCard>
            ) : null}

            {helpHref ? (
              <PageHelpCard
                title="页面帮助"
                subtitle="完整说明后置到帮助页"
                summary={`当前页首屏仅保留 ${config.title} 的关键概览、主要入口与核心数据视图。完整背景、口径与流程说明已迁移到帮助页。`}
                items={guideItems}
                href={helpHref}
                actionLabel="进入页面帮助"
              />
            ) : null}
          </>
        )}
      />
    </div>
  )
}