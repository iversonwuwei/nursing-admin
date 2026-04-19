'use client'

import { AdminAiNav } from '@/components/ai/admin-ai-nav'
import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard } from '@/components/nh'
import { getAiSceneLabel, getAiSourceLabel, readAiTrackingContext } from '@/lib/ai-context'
import { sendAdminAiChat } from '@/lib/ai/admin-ai-api'
import { fetchAdminDashboardOverview, type AdminDashboardOverviewResponse } from '@/lib/dashboard/admin-dashboard-api'
import { readSessionPlatformState } from '@/lib/platform/session'
import { Bot, BrainCircuit, MessageSquareText, Send, Sparkles } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

const PRESET_PROMPTS = [
  '总结当前入住评估闭环进度',
  '解释为什么健康异常需要人工复核',
  '生成适合院长晨会的 AI 运营摘要',
  '任务中心的 AI 建议应该如何使用',
]

const LIVE_REPLY_PLACEHOLDER = '请选择一个问题或输入内容后调用真实 AI；当前页面不会在 live 模式下自动填充本地 mock 回答。'

const LIVE_REPLY_UNAVAILABLE = '真实 AI 问答当前不可用，请稍后重试，或进入日志页查看最近一次成功调用。'

export default function AiAssistantQaPage() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const trackingContext = readAiTrackingContext(searchParams)
  const platformState = useMemo(() => readSessionPlatformState(session), [session])
  const [dashboardOverview, setDashboardOverview] = useState<AdminDashboardOverviewResponse | null>(null)
  const [prompt, setPrompt] = useState(PRESET_PROMPTS[0])
  const [reply, setReply] = useState(LIVE_REPLY_PLACEHOLDER)
  const [conversationId, setConversationId] = useState('')
  const [replyBusy, setReplyBusy] = useState(false)
  const [replyError, setReplyError] = useState('')

  useEffect(() => {
    let cancelled = false

    void fetchAdminDashboardOverview()
      .then(result => {
        if (!cancelled) {
          setDashboardOverview(result)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDashboardOverview(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const pendingTasks = dashboardOverview?.kpis.workflowPendingCount ?? 0
  const pendingAlerts = dashboardOverview?.kpis.pendingAlerts ?? 0

  async function handlePromptSubmit(nextPrompt: string) {
    setPrompt(nextPrompt)
    setReplyError('')

    if (!platformState.runtimeFlags.aiAssistantEnabled) {
      setReply(LIVE_REPLY_UNAVAILABLE)
      setReplyError('当前租户未启用 AI 模块。')
      return
    }

    setReplyBusy(true)
    try {
      const result = await sendAdminAiChat({
        message: nextPrompt,
        conversationId: conversationId || undefined,
        userRole: 'admin',
      })
      setReply(result.reply)
      setConversationId(result.conversationId)
    } catch (error) {
      setReply(LIVE_REPLY_UNAVAILABLE)
      setReplyError(error instanceof Error ? error.message : 'AI 问答暂时不可用。')
    } finally {
      setReplyBusy(false)
    }
  }

  if (!platformState.runtimeFlags.aiAssistantEnabled) {
    return (
      <div className="page-root animate-fade-up">
        <PageHeader
          title="AI 问答"
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
              当前租户没有 ai 模块 entitlement。即时问答已从 AI 总览页拆分到独立路由，避免在总览页里混入工具执行逻辑。
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link href="/ai-assistant" className="btn btn-secondary btn-sm">返回 AI 总览</Link>
              <Link href="/" className="btn btn-secondary btn-sm">返回首页</Link>
            </div>
          </div>
        </DataCard>
      </div>
    )
  }

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title="AI 问答"
        subtitle="只承载即时问答与回答查看，不再混入 AI 总览、规则治理或日志审计逻辑。"
        actions={<Tag variant="primary">Single Task Flow</Tag>}
      />

      <AdminAiNav />

      <InteractionRailLayout
        main={(
          <>
            <WorkflowOverviewCard
              eyebrow="AI Q&A"
              title={trackingContext?.entityName ? `${trackingContext.entityName} 的即时问答` : 'Admin AI 即时问答'}
              description={trackingContext
                ? `当前上下文来自${getAiSourceLabel(trackingContext.source)}，问题将围绕“${trackingContext.focus ?? '未指定'}”生成解释或摘要。`
                : '本页只负责输入问题并查看回答。需要看 AI 总览、规则治理或日志审计时，请进入对应独立页面。'}
              badge={<Tag variant="success">Live Q&A</Tag>}
              metrics={[
                { label: '预设问题', value: PRESET_PROMPTS.length, hint: '快速进入常见问答主题', tone: 'info' },
                { label: '流程待办', value: pendingTasks, hint: '来自 Dashboard 聚合快照', tone: pendingTasks > 0 ? 'warning' : 'success' },
                { label: '实时告警', value: pendingAlerts, hint: '可继续追问风险与解释', tone: pendingAlerts > 0 ? 'primary' : 'neutral' },
                { label: '会话状态', value: conversationId ? '进行中' : '新会话', hint: conversationId || '尚未生成第一轮回答', tone: conversationId ? 'success' : 'neutral' },
              ]}
              signals={[
                { label: trackingContext ? `来源：${getAiSourceLabel(trackingContext.source)}` : '当前未绑定业务来源', tone: trackingContext ? 'info' : 'neutral' },
                { label: trackingContext?.scene ? `场景：${getAiSceneLabel(trackingContext.scene)}` : '当前未绑定场景', tone: trackingContext?.scene ? 'primary' : 'neutral' },
                { label: trackingContext?.focus ? `关注点：${trackingContext.focus}` : '当前为通用问答模式', tone: trackingContext?.focus ? 'primary' : 'neutral' },
                { label: '当前模式：BFF 实时问答，不自动执行业务动作', tone: 'success' },
              ]}
            />

            <div className="kpi-grid" style={{ marginBottom: 16 }}>
              <StatCard icon={<MessageSquareText size={18} />} label="即时问答" value="已拆页" sub="根页仅保留总览与分流" color="primary" />
              <StatCard icon={<Sparkles size={18} />} label="预设问题" value={PRESET_PROMPTS.length} sub="覆盖评估、健康、晨会、任务" color="info" />
              <StatCard icon={<Bot size={18} />} label="回答模式" value="Live" sub="后端问答链路" color="success" />
              <StatCard icon={<BrainCircuit size={18} />} label="人工边界" value="保留" sub="结果只做建议与解释" color="warning" />
            </div>

            <DataCard
              icon={<MessageSquareText size={16} />}
              title="问答面板"
              subtitle="当前直接调用真实 AI 问答接口，不自动下发业务动作。"
              badge={<Tag variant="success">Live Q&A</Tag>}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {PRESET_PROMPTS.map(item => (
                    <button
                      key={item}
                      className="btn btn-secondary btn-sm"
                      disabled={replyBusy}
                      onClick={() => { void handlePromptSubmit(item) }}
                    >
                      <Sparkles size={12} />
                      {item}
                    </button>
                  ))}
                </div>
                <textarea
                  className="input"
                  rows={3}
                  value={prompt}
                  onChange={event => setPrompt(event.target.value)}
                  placeholder="输入入住评估、健康异常、报警解释或周报相关问题..."
                  style={{ width: '100%', resize: 'vertical', padding: '10px 12px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary btn-sm" disabled={replyBusy} onClick={() => { void handlePromptSubmit(prompt) }}>
                    <Send size={12} />
                    {replyBusy ? '生成中...' : '生成回答'}
                  </button>
                </div>
                {replyError ? (
                  <div style={{ fontSize: 12.5, color: 'var(--color-danger)' }}>{replyError}</div>
                ) : null}
                <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div className="data-card-icon-wrap"><Bot size={14} /></div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>AI 回答</span>
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--color-text)' }}>{reply}</div>
                </div>
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            {trackingContext ? (
              <DataCard
                icon={<BrainCircuit size={16} />}
                title="当前提问上下文"
                subtitle="把来源页面的关键上下文收口到右轨，避免问答面板掺入额外说明块。"
                badge={<Tag variant="warning">Tracked Context</Tag>}
              >
                <div style={{ display: 'grid', gap: 10 }}>
                  {[
                    { label: '来源页面', value: getAiSourceLabel(trackingContext.source) },
                    { label: '场景视角', value: getAiSceneLabel(trackingContext.scene) },
                    { label: '对象', value: trackingContext.entityName ?? '-' },
                    { label: '关注点', value: trackingContext.focus ?? '-' },
                  ].map(item => (
                    <div key={item.label} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </DataCard>
            ) : null}

            <DataCard
              icon={<BrainCircuit size={16} />}
              title="当前链路状态"
              subtitle="这里只保留即时问答所需的最小状态，不再混入总览摘要。"
            >
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '运行模式：BFF 实时问答',
                  `会话编号：${conversationId || '尚未建立'}`,
                  `认证来源：${platformState.authSource === 'platform' ? '平台认证' : 'Demo 认证'}`,
                  replyError || '当前无问答链路错误',
                ].map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整 AI 入口规则仍在统一帮助页"
              summary="AI 问答页只承载提问与回答；需要看入口分流、治理边界或审计链路时，返回 AI 总览或进入对应独立子页。"
              items={[
                '问答页不再展示总览摘要或子页导航说明块。',
                '高风险结果仍需回到业务页由人工确认。',
                '回答异常时优先查看日志页确认最近一次调用结果。',
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