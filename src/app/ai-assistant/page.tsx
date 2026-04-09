'use client'

import { AdminAiNav } from '@/components/ai/admin-ai-nav'
import { DataCard, PageHeader, StatCard, Tag, WorkflowOverviewCard } from '@/components/nh'
import { appendAiTrackingContext, getAiSourceLabel, getAiTargetLabel, readAiTrackingContext } from '@/lib/ai-context'
import {
  fetchAdminAiDashboardInsights,
  isAdminAiDemoMode,
  sendAdminAiChat,
} from '@/lib/ai/admin-ai-api'
import { alertRecords } from '@/lib/data/alerts-data'
import {
  getAdminAiPromptReply,
  getAiDashboardInsights,
} from '@/lib/mock/admin-ai'
import {
  getAdmissionApplicationsSnapshot,
  getStaffTaskItems,
  subscribeAdmissionWorkflow,
} from '@/lib/mock/admission-workflow'
import {
  Bot,
  BrainCircuit,
  ChevronRight,
  MessageSquareText,
  Send,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'

const PRESET_PROMPTS = [
  '总结当前入住评估闭环进度',
  '解释为什么健康异常需要人工复核',
  '生成适合院长晨会的 AI 运营摘要',
  '任务中心的 AI 建议应该如何使用',
]

export default function AIAssistantPage() {
  const searchParams = useSearchParams()
  const trackingContext = readAiTrackingContext(searchParams)
  const demoMode = isAdminAiDemoMode()
  const applications = useSyncExternalStore(
    subscribeAdmissionWorkflow,
    getAdmissionApplicationsSnapshot,
    getAdmissionApplicationsSnapshot,
  )
  const [prompt, setPrompt] = useState(PRESET_PROMPTS[0])
  const [reply, setReply] = useState(getAdminAiPromptReply(PRESET_PROMPTS[0]))
  const [conversationId, setConversationId] = useState('')
  const [replyBusy, setReplyBusy] = useState(false)
  const [replyError, setReplyError] = useState('')
  const mockDashboardInsights = useMemo(() => getAiDashboardInsights(applications), [applications])
  const [dashboardInsights, setDashboardInsights] = useState(mockDashboardInsights)
  const [dashboardError, setDashboardError] = useState('')

  const pendingConfirmations = applications.filter(item => item.status === '待人工确认').length
  const openAlerts = alertRecords.filter(item => item.status !== 'resolved').length
  const pendingTasks = getStaffTaskItems(applications).filter(item => item.status !== '已完成').length
  const trackingSource = trackingContext?.source ?? ''
  const trackingFocus = trackingContext?.focus ?? ''
  const trackedTargetLabel = trackingContext?.target ? getAiTargetLabel(trackingContext.target) : '推理详情'
  const targetHref = trackingContext?.target === 'rules'
    ? appendAiTrackingContext('/ai-assistant/rules', { ...trackingContext, target: 'rules' })
    : trackingContext?.target === 'logs'
      ? appendAiTrackingContext('/ai-assistant/logs', { ...trackingContext, target: 'logs' })
      : appendAiTrackingContext('/ai-assistant/inference', trackingContext ? { ...trackingContext, target: 'inference' } : null)

  useEffect(() => {
    if (demoMode) {
      setDashboardInsights(mockDashboardInsights)
      setDashboardError('')
      return
    }

    let cancelled = false
    setDashboardError('')

    void fetchAdminAiDashboardInsights({
      totalElders: applications.length,
      activeCarePlans: Math.max(applications.length - pendingConfirmations, 0),
      openAlerts,
      pendingTasks,
      occupancyPercent: Math.min(100, Math.round((applications.length / 12) * 100)),
      additionalContext: trackingSource
        ? `${trackingSource}:${trackingFocus || 'general'}`
        : 'admin-ai-overview',
    })
      .then(result => {
        if (!cancelled) {
          setDashboardInsights(result)
        }
      })
      .catch(error => {
        if (!cancelled) {
          setDashboardInsights(mockDashboardInsights)
          setDashboardError(error instanceof Error ? error.message : 'AI 总览加载失败。')
        }
      })

    return () => {
      cancelled = true
    }
  }, [applications, demoMode, mockDashboardInsights, openAlerts, pendingConfirmations, pendingTasks, trackingFocus, trackingSource])

  async function handlePromptSubmit(nextPrompt: string) {
    setPrompt(nextPrompt)
    setReplyError('')

    if (demoMode) {
      setReply(getAdminAiPromptReply(nextPrompt))
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
      setReply(getAdminAiPromptReply(nextPrompt))
      setReplyError(error instanceof Error ? error.message : 'AI 问答暂时不可用。')
    } finally {
      setReplyBusy(false)
    }
  }

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title="AI 运营入口"
        subtitle="统一查看 Admin 端 AI 总览，并进入推理详情、规则治理和问答日志。"
        actions={<Tag variant="primary">AI 先建议，人再确认</Tag>}
      />

      <WorkflowOverviewCard
        eyebrow="AI Operations"
        title={trackingContext?.entityName ? `${trackingContext.entityName} 的 AI 追踪入口` : 'Admin AI 总览'}
        description={trackingContext
          ? `当前上下文来自${getAiSourceLabel(trackingContext.source)}，关注点是“${trackingContext.focus ?? '未指定'}”。本页把推理、规则和日志三类入口收束成统一导航，避免 AI 解释脱离业务页面。`
          : 'AI 入口页当前承担结果型问答、追踪上下文透传和子页导航三种角色，默认不直接下发业务动作。'}
        badge={<Tag variant="primary">AI 先建议，人再确认</Tag>}
        metrics={[
          { label: 'AI 子页入口', value: 6, hint: '含员工端与家属端预览入口', tone: 'primary' },
          { label: '风险摘要信号', value: dashboardInsights.length, hint: '已聚合到当前 AI 总览', tone: 'info' },
          { label: '待确认建议', value: pendingConfirmations, hint: '仍需人工复核的评估建议', tone: pendingConfirmations > 0 ? 'warning' : 'success' },
          { label: '当前追踪目标', value: trackedTargetLabel, hint: trackingContext?.entityId ?? '未携带业务上下文', tone: trackingContext ? 'success' : 'neutral' },
        ]}
        signals={[
          { label: trackingContext ? `来源：${getAiSourceLabel(trackingContext.source)}` : '当前未绑定业务来源', tone: trackingContext ? 'info' : 'neutral' },
          { label: trackingContext?.focus ? `关注点：${trackingContext.focus}` : '默认展示总览级 AI 能力', tone: trackingContext?.focus ? 'primary' : 'neutral' },
          { label: demoMode ? '当前模式：Demo 回退，未调用后端 AI' : '当前模式：BFF 实时 AI，仍然只读不自动执行', tone: demoMode ? 'info' : 'success' },
          { label: dashboardError || replyError || '当前无 AI 链路错误', tone: dashboardError || replyError ? 'danger' : 'neutral' },
        ]}
        actions={
          <>
            <Link href={targetHref} className="btn btn-secondary btn-sm">按当前上下文继续</Link>
            <Link href="/ai-assistant/logs" className="btn btn-secondary btn-sm">查看问答日志</Link>
          </>
        }
      />

      {trackingContext && (
        <DataCard
          icon={<BrainCircuit size={16} />}
          title="当前追踪上下文"
          subtitle="从业务页面带入的上下文会继续透传到 AI 子页，便于追踪来源和动作闭环。"
          badge={<Tag variant="warning">Tracked Context</Tag>}
        >
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {[
                { label: '来源页面', value: getAiSourceLabel(trackingContext.source) },
                { label: '对象', value: trackingContext.entityName ?? '-' },
                { label: '对象编号', value: trackingContext.entityId ?? '-' },
                { label: '关注点', value: trackingContext.focus ?? '-' },
              ].map(item => (
                <div key={item.label} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.6 }}>
                推荐下一步：进入{getAiTargetLabel(trackingContext.target ?? 'inference')}，继续查看与当前页面相关的 AI 解释和治理信息。
              </div>
              <Link href={targetHref} className="btn btn-primary btn-sm">按当前来源继续追踪</Link>
            </div>
          </div>
        </DataCard>
      )}

      <AdminAiNav />

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
              title: '3. 回看问答日志',
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

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard icon={<Bot size={18} />} label="AI 分页入口" value={6} sub="含员工端与家属端 AI 预览" color="primary" />
        <StatCard icon={<BrainCircuit size={18} />} label="风险摘要" value={dashboardInsights.length} sub="当前总览已聚合" color="success" />
        <StatCard icon={<MessageSquareText size={18} />} label="待确认建议" value={pendingConfirmations} sub="需继续人工复核" color="warning" />
        <StatCard icon={<Sparkles size={18} />} label="当前模式" value="结果型" sub="不自动执行业务动作" color="info" />
      </div>

      <div className="dashboard-grid-2" style={{ marginBottom: 16 }}>
        <DataCard
          icon={<MessageSquareText size={16} />}
          title="Admin AI 问答面板"
          subtitle="当前只演示结果型问答，不直接下发业务动作。"
          badge={<Tag variant="info">Demo Safe Mode</Tag>}
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

        <DataCard
          icon={<BrainCircuit size={16} />}
          title="子页导航"
          subtitle="把推理、规则和日志拆成独立页面，便于后续接真实 AI 服务。"
        >
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              {
                href: '/ai-assistant/inference',
                title: '推理详情页',
                description: '查看模型状态、健康解释样本与入住评估推理记录。',
              },
              {
                href: '/ai-assistant/rules',
                title: '规则治理页',
                description: '查看规则启停、治理边界和回滚路径。',
              },
              {
                href: '/ai-assistant/logs',
                title: '问答日志页',
                description: '查看按场景沉淀的 AI 问答与结果日志。',
              },
              {
                href: '/ai-assistant/staff-app',
                title: '员工 APP + AI 预览',
                description: '验证班次摘要、任务 Copilot、报警响应和交接班草稿。',
              },
              {
                href: '/ai-assistant/family-app',
                title: '家属 APP + AI 预览',
                description: '验证今日状态摘要、健康解释、探视助手与护理问答。',
              },
            ].map(item => (
              <Link
                key={item.href}
                href={appendAiTrackingContext(item.href, trackingContext ? {
                  ...trackingContext,
                  target: item.href.endsWith('/rules') ? 'rules' : item.href.endsWith('/logs') ? 'logs' : item.href.endsWith('/inference') ? 'inference' : trackingContext.target,
                } : null)}
                style={{ textDecoration: 'none' }}
              >
                <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</span>
                    <Tag variant={trackingContext?.target && item.href.endsWith(`/${trackingContext.target}`) ? 'warning' : 'primary'}><ChevronRight size={12} /></Tag>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </DataCard>
      </div>

      <DataCard icon={<BrainCircuit size={16} />} title="当前摘要信号" subtitle="保留总览级风险摘要，详细治理与审计进入子页面查看。">
        <div style={{ display: 'grid', gap: 10 }}>
          {dashboardInsights.map(item => (
            <div key={item.id} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</span>
                <Tag variant={item.variant}>{item.value}</Tag>
              </div>
              <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.summary}</div>
            </div>
          ))}
        </div>
      </DataCard>
    </div>
  )
}
