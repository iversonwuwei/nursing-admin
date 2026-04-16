import { DataCard, InteractionRailLayout, PageHeader, Tag } from '@/components/nh'
import { resolveStandardPageByHelpSlug } from '@/lib/data/standard-pages'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function StandardPageHelpPage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  const resolved = resolveStandardPageByHelpSlug(slug)

  if (!resolved) {
    notFound()
  }

  const { config, pagePath } = resolved

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={`${config.title}帮助`}
        subtitle="完整边界、流程和使用说明后置到帮助页，工作台首屏只保留关键操作与状态。"
        actions={<Link href={pagePath} className="btn btn-secondary btn-sm">返回原页面</Link>}
      />

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="页面定位" subtitle="先明确这页负责什么，再决定是否需要进入执行流。">
              <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--color-text)' }}>{config.subtitle}</div>
            </DataCard>

            <DataCard title={config.highlightsTitle ?? '关键能力'} subtitle="这里保留完整主题说明，帮助新用户快速建立认知。">
              <div style={{ display: 'grid', gap: 12 }}>
                {config.highlights.map(item => (
                  <div key={item.title} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                      {item.tag ? <Tag variant={item.tag.variant}>{item.tag.label}</Tag> : null}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{item.description}</div>
                    {item.meta ? (
                      <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.6, color: 'var(--color-text)' }}>{item.meta}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            </DataCard>

            {config.table ? (
              <DataCard title="数据视图说明" subtitle="帮助用户理解首屏列表或表格到底在表达什么。">
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{config.table.title}</div>
                  {config.table.subtitle ? (
                    <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{config.table.subtitle}</div>
                  ) : null}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {config.table.columns.map(column => (
                      <Tag key={column.key} variant="neutral">{column.label}</Tag>
                    ))}
                  </div>
                </div>
              </DataCard>
            ) : null}
          </>
        )}
        rail={(
          <>
            <DataCard title="主要入口" subtitle="把入口留在帮助页右侧，避免干扰主工作台首屏。">
              <div style={{ display: 'grid', gap: 10 }}>
                {(config.actions ?? []).map(action => (
                  <Link key={action.href} href={action.href} className={action.variant === 'primary' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}>
                    {action.label}
                  </Link>
                ))}
              </div>
            </DataCard>

            <DataCard title={config.workflowTitle ?? '流程说明'} subtitle="这里保留完整流程解释，首屏工作台只保留最小流程提示。">
              <div style={{ display: 'grid', gap: 12 }}>
                {config.workflows.map(item => (
                  <div key={item.title} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                      <Tag variant={item.status.variant}>{item.status.label}</Tag>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{item.description}</div>
                    <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.6, color: 'var(--color-text)' }}>责任角色：{item.owner} · 交付窗口：{item.timeline}</div>
                  </div>
                ))}
              </div>
            </DataCard>

            {config.note ? (
              <DataCard title="交付边界" subtitle="明确当前页保留什么、不承载什么。">
                <div style={{ fontSize: 12.5, lineHeight: 1.75, color: 'var(--color-text)' }}>{config.note}</div>
              </DataCard>
            ) : null}
          </>
        )}
      />
    </div>
  )
}