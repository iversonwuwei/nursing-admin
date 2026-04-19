'use client'

import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { fetchAdminAiDashboardInsights, fetchAdminAiOpsReport, type AdminAiOpsReportResult } from '@/lib/ai/admin-ai-api'
import { getCareScene } from '@/lib/care-scenes'
import { fetchAdminDashboardOverview, type AdminDashboardOverviewResponse } from '@/lib/dashboard/admin-dashboard-api'
import { BarChart3, Download, Mail, RefreshCcw, ScrollText, Send, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AnalyticsReportPage() {
  const searchParams = useSearchParams()
  const scene = getCareScene(searchParams.get('scene'))
  const [period, setPeriod] = useState<'周报' | '月报'>('周报')
  const [report, setReport] = useState<AdminAiOpsReportResult | null>(null)
  const [dashboardOverview, setDashboardOverview] = useState<AdminDashboardOverviewResponse | null>(null)
  const [dashboardInsights, setDashboardInsights] = useState<Awaited<ReturnType<typeof fetchAdminAiDashboardInsights>>>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [generatedAtLabel, setGeneratedAtLabel] = useState('')
  const sceneMeta = scene === 'home'
    ? {
      title: '居家监管报表中心',
      subtitle: '面向评定主管与运营经理的居家周报 / 月报摘要草稿。',
      suggestionTitle: '下一步接入建议',
    }
    : scene === 'institutional'
      ? {
        title: '机构运营报表中心',
        subtitle: '面向院长与运营主管的机构周报 / 月报摘要草稿。',
        suggestionTitle: '下一步接入建议',
      }
      : {
        title: 'AI 报表中心',
        subtitle: '面向院长与运营主管的 AI 周报 / 月报摘要草稿，不替代正式财务与经营报表。',
        suggestionTitle: '下一步接入建议',
      }
  const reportTitle = report?.title ?? `${sceneMeta.title} ${period}`
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'analytics-report',
    entityId: `${scene ?? 'general'}-${period}`,
    entityName: reportTitle,
    focus,
    target,
    scene: scene ?? undefined,
  })
  const helpHref = '/analytics/help'

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function loadReport() {
      try {
        const overview = await fetchAdminDashboardOverview()

        if (cancelled) {
          return
        }

        setDashboardOverview(overview)

        const metricsJson = JSON.stringify({
          scene: scene ?? 'general',
          elderCount: overview.kpis.elderCount,
          tenantCount: overview.kpis.tenantCount,
          pendingAlerts: overview.kpis.pendingAlerts,
          workflowPendingCount: overview.kpis.workflowPendingCount,
          notificationBreakdown: overview.notificationBreakdown,
          financeBreakdown: overview.financeBreakdown,
          workflowBreakdown: overview.workflowBreakdown,
        })

        const [nextReport, nextInsights] = await Promise.all([
          fetchAdminAiOpsReport({
            reportType: scene === 'home' ? 'home-care-ops' : scene === 'institutional' ? 'institutional-ops' : 'admin-ops',
            period,
            metricsJson,
          }),
          fetchAdminAiDashboardInsights({
            totalElders: overview.kpis.elderCount,
            activeCarePlans: Math.max(overview.kpis.elderCount - overview.kpis.workflowPendingCount, 0),
            openAlerts: overview.kpis.pendingAlerts,
            pendingTasks: overview.kpis.workflowPendingCount,
            occupancyPercent: overview.kpis.elderCount > 0 ? 100 : 0,
            additionalContext: `analytics-report:${scene ?? 'general'}:${period}`,
          }),
        ])

        if (cancelled) {
          return
        }

        setReport(nextReport)
        setDashboardInsights(nextInsights)
        setGeneratedAtLabel(new Date().toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }))
        setLoadError('')
      } catch (error) {
        if (cancelled) {
          return
        }

        setReport(null)
        setDashboardOverview(null)
        setDashboardInsights([])
        setLoadError(error instanceof Error ? error.message : 'AI 报表加载失败。')
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadReport()

    return () => {
      cancelled = true
    }
  }, [period, scene])

  const generatedPlans = dashboardOverview?.staffLeaderboard.reduce((sum, item) => sum + item.completed, 0) ?? 0
  const pendingConfirmations = dashboardOverview?.kpis.workflowPendingCount ?? 0

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title={sceneMeta.title}
        subtitle={sceneMeta.subtitle}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`btn btn-sm ${period === '周报' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPeriod('周报')}>周报</button>
            <button className={`btn btn-sm ${period === '月报' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPeriod('月报')}>月报</button>
            <Link href={buildAiHref(scene === 'home' ? 'home-report-summary' : 'institutional-report-summary', 'logs')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
          </div>
        }
      />

      <InteractionRailLayout
        main={(
          <>
            <div className="kpi-grid" style={{ marginBottom: 16 }}>
              <StatCard icon={<ScrollText size={18} />} label="当前摘要周期" value={period} sub={generatedAtLabel ? `生成于 ${generatedAtLabel}` : '等待生成'} color="primary" />
              <StatCard icon={<ShieldCheck size={18} />} label="已完成任务" value={generatedPlans} sub="来自 Dashboard 员工排行聚合" color="success" />
              <StatCard icon={<RefreshCcw size={18} />} label="流程待办" value={pendingConfirmations} sub="仍需人工复核或派发" color="warning" />
              <StatCard icon={<BarChart3 size={18} />} label="AI 风险信号" value={dashboardInsights.filter(item => item.variant === 'danger' || item.variant === 'warning').length} sub="已汇总到本次摘要" color="info" />
            </div>

            {loading ? (
              <div style={{ marginBottom: 16, fontSize: 12.5, color: 'var(--color-muted)' }}>AI 报表生成中...</div>
            ) : null}

            {loadError ? (
              <DataCard icon={<ScrollText size={16} />} title="AI 报表当前不可用" subtitle={loadError} badge={<Tag variant="danger">Live Unavailable</Tag>}>
                <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
                  当前页面只展示真实 AI 报表结果。链路恢复前不会继续回退本地周报或月报草稿。
                </div>
              </DataCard>
            ) : null}

            <DataCard icon={<ScrollText size={16} />} title={reportTitle} subtitle="AI 先给摘要草稿，再由管理者确认是否导出。" badge={<Tag variant="primary">Draft</Tag>}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 13, lineHeight: 1.7, color: 'var(--color-text)' }}>
                  {report?.summary ?? '当前没有可展示的真实报表摘要。'}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>核心亮点</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {(report?.highlights ?? []).map(item => (
                      <div key={item} style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>• {item}</div>
                    ))}
                    {!loading && (report?.highlights.length ?? 0) === 0 ? <div style={{ fontSize: 12.5, color: 'var(--color-muted)' }}>当前没有亮点摘要。</div> : null}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>推荐动作</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {(report?.recommendations ?? []).map(item => (
                      <div key={item} style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>• {item}</div>
                    ))}
                    {!loading && (report?.recommendations.length ?? 0) === 0 ? <div style={{ fontSize: 12.5, color: 'var(--color-muted)' }}>当前没有推荐动作。</div> : null}
                  </div>
                </div>
              </div>
            </DataCard>

            <DataCard icon={<ShieldCheck size={16} />} title="异常与风险解释" subtitle={scene === 'home' ? '当前居家监管摘要里需要被管理层看见的非正常信号。' : scene === 'institutional' ? '当前机构运营摘要里需要被管理层看见的非正常信号。' : '当前摘要里需要被管理层看见的非正常信号。'}>
              <div style={{ display: 'grid', gap: 10 }}>
                {(report?.concerns ?? []).map(item => (
                  <div key={item} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                    <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>{item}</div>
                  </div>
                ))}
                {!loading && (report?.concerns.length ?? 0) === 0 ? (
                  <div style={{ padding: 16, fontSize: 12.5, color: 'var(--color-muted)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                    当前没有需要额外提示的异常解释。
                  </div>
                ) : null}
                <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>纳入本次摘要的页面入口</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {dashboardInsights.map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--color-text)' }}>{item.title}</span>
                        <Tag variant={item.variant}>{item.value}</Tag>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DataCard>

            <DataCard icon={<Download size={16} />} title="导出与送达" subtitle={scene === 'home' ? '当前仍为半自动导出，适合演示居家监管摘要如何进入运营流程。' : scene === 'institutional' ? '当前仍为半自动导出，适合演示机构运营摘要如何进入运营流程。' : '当前仍为半自动导出，适合演示 AI 摘要如何进入运营流程。'}>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  { label: '邮件订阅', value: '已配置', detail: '周一 08:30 自动生成后待人工确认发送' },
                  { label: '院长晨会 PDF', value: '待导出', detail: '需先确认本次 AI 异常解释是否采纳' },
                  { label: '运营群摘要', value: '手动发送', detail: '当前保留人工复核，不自动推送到工作群' },
                ].map(item => (
                  <div key={item.label} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.label}</span>
                      <Tag variant={item.value === '已配置' ? 'success' : item.value === '待导出' ? 'warning' : 'info'}>{item.value}</Tag>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.detail}</div>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary btn-sm"><Mail size={12} />预览邮件版</button>
                  <button className="btn btn-primary btn-sm"><Download size={12} />导出摘要草稿</button>
                </div>
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="报表上下文" subtitle="后置展示当前视角、周期和边界。" badge={<Tag variant="info">Context</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">当前视角：{scene === 'home' ? '居家监管' : scene === 'institutional' ? '机构运营' : '通用运营'}。</div>
                <div className="page-help-card-item">当前周期：{period}，摘要标题为 {reportTitle}。</div>
                <div className="page-help-card-item">页面只产出草稿与送达动作，不直接自动发布正式经营报表。</div>
              </div>
            </DataCard>

            <DataCard icon={<Send size={16} />} title={sceneMeta.suggestionTitle} subtitle="治理建议和后续接入说明后置展示。">
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '将报表摘要与 Dashboard 聚合指标绑定统一口径，避免解释与图表数字脱节。',
                  '为 AI 报表导出补充送达回执和订阅日志，满足运营审计场景。',
                  '接入真实 Analytics Service 后，继续保留当前人工确认出口，不直接自动发布。',
                ].map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <Link href={buildAiHref(scene === 'home' ? 'home-report-governance' : 'institutional-report-governance', 'rules')} className="btn btn-secondary btn-sm">查看 AI 治理</Link>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整报表中心说明迁移到显式帮助页"
              summary="报表中心现在只保留摘要草稿、异常解释和送达动作，导出边界与治理说明统一后置。"
              items={[
                '先看当前周期摘要，再看异常信号，最后决定是否导出。',
                '周报与月报切换会重新请求真实 AI 报表，不再读取本地草稿。',
                '若需要完整页面定位和导出边界说明，进入帮助页查看。',
              ]}
              href={helpHref}
              actionLabel="查看分析帮助"
            />
          </>
        )}
      />
    </div>
  )
}