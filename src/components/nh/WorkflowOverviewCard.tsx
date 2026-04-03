import React from 'react'

type WorkflowOverviewTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

interface WorkflowOverviewMetric {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  tone?: WorkflowOverviewTone
}

interface WorkflowOverviewSignal {
  label: React.ReactNode
  tone?: WorkflowOverviewTone
}

interface WorkflowOverviewCardProps {
  eyebrow?: string
  title: string
  description: React.ReactNode
  badge?: React.ReactNode
  metrics: WorkflowOverviewMetric[]
  signals?: WorkflowOverviewSignal[]
  actions?: React.ReactNode
  className?: string
}

export function WorkflowOverviewCard({
  eyebrow,
  title,
  description,
  badge,
  metrics,
  signals = [],
  actions,
  className = '',
}: WorkflowOverviewCardProps) {
  return (
    <section className={`workflow-overview ${className}`.trim()}>
      <div className="workflow-overview-head">
        <div className="workflow-overview-copy">
          {eyebrow ? <div className="workflow-overview-eyebrow">{eyebrow}</div> : null}
          <div className="workflow-overview-title-row">
            <h2 className="workflow-overview-title">{title}</h2>
            {badge}
          </div>
          <div className="workflow-overview-description">{description}</div>
        </div>
        {actions ? <div className="workflow-overview-actions">{actions}</div> : null}
      </div>

      <div className="workflow-overview-metrics">
        {metrics.map(metric => (
          <div key={metric.label} className={`workflow-overview-metric tone-${metric.tone ?? 'neutral'}`}>
            <div className="workflow-overview-metric-label">{metric.label}</div>
            <div className="workflow-overview-metric-value">{metric.value}</div>
            {metric.hint ? <div className="workflow-overview-metric-hint">{metric.hint}</div> : null}
          </div>
        ))}
      </div>

      {signals.length > 0 ? (
        <div className="workflow-overview-signals">
          {signals.map((signal, index) => (
            <div key={index} className={`workflow-overview-signal tone-${signal.tone ?? 'neutral'}`}>
              {signal.label}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}