'use client'

import { AdminAiNav } from '@/components/ai/admin-ai-nav'
import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard } from '@/components/nh'
import { appendAiTrackingContext, getAiSceneLabel, getAiSourceLabel, getAiTargetLabel, readAiTrackingContext } from '@/lib/ai-context'
import { fetchAdminAiDashboardInsights } from '@/lib/ai/admin-ai-api'
import { fetchAdminDashboardOverview, type AdminDashboardOverviewResponse } from '@/lib/dashboard/admin-dashboard-api'
import type { AiDashboardInsight } from '@/lib/mock/admin-ai'
import { readSessionPlatformState } from '@/lib/platform/session'
import { Bot, BrainCircuit, ChevronRight, Sparkles } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

const LIVE_UNAVAILABLE_DASHBOARD_INSIGHTS: AiDashboardInsight[] = [
  {
    id: 'ai-live-unavailable',
    title: 'AI 总览暂不可用',
    summary: '当前 live 模式未返回可展示的真实 AI 总览，请稍后重试或进入日志页确认最近一次调用结果。',
    value: '待恢复',
    href: '/ai-assistant/logs',
    variant: 'warning' as const,
  },
]

export default function AIAssistantPage() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const trackingContext = readAiTrackingContext(searchParams)
  const platformState = useMemo(() => readSessionPlatformState(session), [session])
    const [dashboardOverview, setDashboardOverview] = useState<AdminDashboardOverviewResponse | null>(null)
    const [dashboardInsights, setDashboardInsights] = useState<AiDashboardInsight[]>(LIVE_UNAVAILABLE_DASHBOARD_INSIGHTS)
    const [loadError, setLoadError] = useState('')
    const [loading, setLoading] = useState(true)
  const trackingSource = trackingContext?.source ?? ''
  const trackingFocus = trackingContext?.focus ?? ''
  const trackedTargetLabel = trackingContext?.target ? getAiTargetLabel(trackingContext.target) : '推理详情'
  const targetHref = trackingContext?.target === 'rules'
    ? appendAiTrackingContext('/ai-assistant/rules', { ...trackingContext, target: 'rules' })
    : trackingContext?.target === 'logs'
      ? appendAiTrackingContext('/ai-assistant/logs', { ...trackingContext, target: 'logs' })
      : appendAiTrackingContext('/ai-assistant/inference', trackingContext ? { ...trackingContext, target: 'inference' } : null)
    const workflowPending = dashboardOverview?.kpis.workflowPendingCount ?? 0
    const openAlerts = dashboardOverview?.kpis.pendingAlerts ?? 0

  useEffect(() => {
      if (!platformState.runtimeFlags.aiAssistantEnabled) {
      return
    }

    let cancelled = false

      async function loadAiHub() {
          try {
              const overview = await fetchAdminDashboardOverview()

              if (cancelled) {
                  return
              }

              setDashboardOverview(overview)

              const insights = await fetchAdminAiDashboardInsights({
                  totalElders: overview.kpis.elderCount,
                  activeCarePlans: Math.max(overview.kpis.elderCount - overview.kpis.workflowPendingCount, 0),
                  openAlerts: overview.kpis.pendingAlerts,
                  pendingTasks: overview.kpis.workflowPendingCount,
                  occupancyPercent: overview.kpis.elderCount > 0 ? 100 : 0,
                  additionalContext: trackingSource
                      ? `${trackingSource}:${trackingFocus || 'general'}`
                      : 'admin-ai-overview',
              })

          if (cancelled) {
              return
          }

          setDashboardInsights(insights.length > 0 ? insights : LIVE_UNAVAILABLE_DASHBOARD_INSIGHTS)
          setLoadError('')
      } catch (error) {
          if (cancelled) {
              return
          }

          setDashboardOverview(null)
          setDashboardInsights(LIVE_UNAVAILABLE_DASHBOARD_INSIGHTS)
          setLoadError(error instanceof Error ? error.message : 'AI 总览加载失败。')
      } finally {
        if (!cancelled) {
            setLoading(false)
        }
      }
      }

      void loadAiHub()

    return () => {
      cancelled = true
    }
  }, [platformState.runtimeFlags.aiAssistantEnabled, trackingFocus, trackingSource])

  if (!platformState.runtimeFlags.aiAssistantEnabled) {
    return (
      <div className="page-root animate-fade-up">
        <PageHeader
          title="AI 运营入口"
          subtitle={`${platformState.tenantName} 当前未启用 AI 模块，页面保留为只读禁用态。`}
          actions={<Tag variant="warning">AI Disabled</Tag>}
        />

        <DataCard
          icon={<BrainCircuit size={16} />}
          title="当前租户未启用 AI 模块"
          subtitle={`租户套餐：${platformState.tenantPlan} · 认证来源：${platformState.authSource === 'platform' ? '平台认证' : 'Demo 认证'}`}
          badge={<Tag variant="danger">Entitlement Off</Tag>}
        >
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
              当前租户没有 ai 模块 entitlement。导航已隐藏 AI 入口；直接访问该路由时会保留只读说明页，避免功能暴露与套餐口径不一致。
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link href="/" className="btn btn-secondary btn-sm">返回首页</Link>
              <Link href="/analytics" className="btn btn-secondary btn-sm">查看数据看板</Link>
            </div>
          </div>
        </DataCard>
      </div>
    )
  }

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title="AI 运营入口"
              subtitle="统一查看 Admin 端 AI 总览，并进入问答、推理详情、规则治理和审计日志。"
        actions={<Tag variant="primary">AI 先建议，人再确认</Tag>}
      />

      <InteractionRailLayout
        main={(
          <>
            <WorkflowOverviewCard
              eyebrow="AI Operations"
              title={trackingContext?.entityName ? `${trackingContext.entityName} 的 AI 追踪入口` : 'Admin AI 总览'}
              description={trackingContext
                ? `当前上下文来自${getAiSourceLabel(trackingContext.source)}，关注点是“${trackingContext.focus ?? '未指定'}”。本页把推理、规则和日志三类入口收束成统一导航，避免 AI 解释脱离业务页面。`
                : 'AI 入口页当前只承担总览摘要、上下文透传和子页导航三种角色，具体问答与审计都进入独立页面。'}
              badge={<Tag variant="primary">AI 先建议，人再确认</Tag>}
              metrics={[
                { label: 'AI 子页入口', value: 6, hint: '含员工端与家属端预览入口', tone: 'primary' },
                { label: '风险摘要信号', value: dashboardInsights.length, hint: '已聚合到当前 AI 总览', tone: 'info' },
                  { label: '流程待办', value: workflowPending, hint: '来自 Dashboard 聚合快照', tone: workflowPending > 0 ? 'warning' : 'success' },
                { label: '当前追踪目标', value: trackedTargetLabel, hint: trackingContext?.entityId ?? '未携带业务上下文', tone: trackingContext ? 'success' : 'neutral' },
              ]}
              signals={[
                { label: trackingContext ? `来源：${getAiSourceLabel(trackingContext.source)}` : '当前未绑定业务来源', tone: trackingContext ? 'info' : 'neutral' },
                { label: trackingContext?.scene ? `场景：${getAiSceneLabel(trackingContext.scene)}` : '当前未绑定场景', tone: trackingContext?.scene ? 'primary' : 'neutral' },
                { label: trackingContext?.focus ? `关注点：${trackingContext.focus}` : '默认展示总览级 AI 能力', tone: trackingContext?.focus ? 'primary' : 'neutral' },
                  { label: loading ? '当前模式：实时 AI 聚合同步中' : '当前模式：BFF 实时 AI，仍然只读不自动执行', tone: loading ? 'warning' : 'success' },
                { label: `认证来源：${platformState.authSource === 'platform' ? '平台认证' : 'Demo 认证'} · 租户：${platformState.tenantName}`, tone: platformState.authSource === 'platform' ? 'success' : 'info' },
                  { label: loadError || '当前无 AI 总览链路错误', tone: loadError ? 'danger' : 'neutral' },
              ]}
              actions={
                <>
                  <Link href={targetHref} className="btn btn-secondary btn-sm">按当前上下文继续</Link>
                  <Link href="/ai-assistant/qa" className="btn btn-secondary btn-sm">进入 AI 问答</Link>
                      <Link href="/ai-assistant/logs" className="btn btn-secondary btn-sm">查看审计日志</Link>
                </>
              }
            />

            <div className="kpi-grid" style={{ marginBottom: 16 }}>
              <StatCard icon={<Bot size={18} />} label="AI 子页入口" value={6} sub="含问答、员工端与家属端 AI 页" color="primary" />
              <StatCard icon={<BrainCircuit size={18} />} label="风险摘要" value={dashboardInsights.length} sub="当前总览已聚合" color="success" />
                          <StatCard icon={<Sparkles size={18} />} label="实时告警" value={openAlerts} sub="来自 Dashboard 聚合" color={openAlerts > 0 ? 'warning' : 'info'} />
              <StatCard icon={<BrainCircuit size={18} />} label="当前模式" value="入口型" sub="只做总览、分流与摘要" color="info" />
            </div>

                      {loadError ? (
                          <DataCard
                              icon={<Sparkles size={16} />}
                              title="AI 总览当前不可用"
                              subtitle={loadError}
                              badge={<Tag variant="danger">Live Unavailable</Tag>}
                          >
                              <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
                                  当前页面只保留真实 AI 总览与导航入口。链路恢复前，你仍可进入日志页确认最近一次成功调用结果。
                              </div>
                          </DataCard>
                      ) : null}

            <DataCard
              icon={<ChevronRight size={16} />}
              title="推荐进入路径"
              subtitle="先从和当前业务上下文最接近的 AI 子页进入，再查看规则或日志，减少在 AI 页面间盲跳。"
              badge={<Tag variant="warning">Suggested Flow</Tag>}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                {[
                  {
                    title: `1. 进入${trackedTargetLabel}`,
                    description: trackingContext ? '沿用当前来源页面的上下文继续看 AI 解释或治理信息。' : '没有业务上下文时默认先看推理详情页。',
                    href: targetHref,
                    cta: '继续追踪',
                  },
                  {
                    title: '2. 查看规则治理',
                    description: '当你需要解释为什么 AI 给出当前结果时，优先看规则启停和治理边界。',
                    href: appendAiTrackingContext('/ai-assistant/rules', trackingContext ? { ...trackingContext, target: 'rules' } : null),
                    cta: '查看规则',
                  },
                  {
                      title: '3. 回看审计日志',
                    description: '当你需要复盘某次问答或运营解释输出时，再进入日志页确认历史上下文。',
                    href: appendAiTrackingContext('/ai-assistant/logs', trackingContext ? { ...trackingContext, target: 'logs' } : null),
                    cta: '查看日志',
                  },
                ].map(item => (
                  <Link key={item.title} href={item.href} style={{ textDecoration: 'none' }}>
                    <div style={{ borderRadius: 16, border: '1px solid var(--color-border)', padding: 16, background: 'var(--color-card)' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                      <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{item.description}</div>
                      <div style={{ marginTop: 12 }}>
                        <span className="btn btn-secondary btn-sm">{item.cta}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </DataCard>

                      <AdminAiNav />
          </>
        )}
        rail={(
          <>
                <DataCard title="AI 总览摘要" subtitle="后置展示总览快照和运行边界。" badge={<Tag variant="info">Snapshot</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                {dashboardInsights.map(item => (
                    <div key={item.id} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                      <Tag variant={item.variant}>{item.value}</Tag>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.summary}</div>
                  </div>
                ))}
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
                    subtitle="完整 AI 入口说明迁移到显式帮助页"
                    summary="AI 入口页现在只保留真实总览、上下文透传和子页导航，不再混入 admission workflow、alertRecords 或 demo 摘要。"
              items={[
                '先按当前业务上下文进入最接近的 AI 子页。',
                '即时问答已拆到独立页面，不再和入口总览混放。',
                'AI 只给建议和解释，不自动执行业务动作。',
                  '真实链路异常时，以 unavailable 提示和日志页为准。',
              ]}
              href="/ai-assistant/help"
              actionLabel="查看 AI 入口帮助"
            />
          </>
        )}
      />
    </div>
  )
}
