'use client'

import { AdminAiNav } from '@/components/ai/admin-ai-nav'
import { DataCard, PageHeader, StatCard, Tag } from '@/components/nh'
import { appendAiTrackingContext, getAiSourceLabel, getAiTargetLabel, readAiTrackingContext } from '@/lib/ai-context'
import {
  getAdminAiPromptReply,
  getAiDashboardInsights,
} from '@/lib/mock/admin-ai'
import {
  getAdmissionApplicationsSnapshot,
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
import { useState, useSyncExternalStore } from 'react'

const PRESET_PROMPTS = [
  '总结当前入住评估闭环进度',
  '解释为什么健康异常需要人工复核',
  '生成适合院长晨会的 AI 运营摘要',
  '任务中心的 AI 建议应该如何使用',
]

export default function AIAssistantPage() {
  const searchParams = useSearchParams()
  const trackingContext = readAiTrackingContext(searchParams)
  const applications = useSyncExternalStore(
    subscribeAdmissionWorkflow,
    getAdmissionApplicationsSnapshot,
    getAdmissionApplicationsSnapshot,
  )
  const [prompt, setPrompt] = useState(PRESET_PROMPTS[0])
  const [reply, setReply] = useState(getAdminAiPromptReply(PRESET_PROMPTS[0]))

  const dashboardInsights = getAiDashboardInsights(applications)
  const pendingConfirmations = applications.filter(item => item.status === '待人工确认').length
  const targetHref = trackingContext?.target === 'rules'
    ? appendAiTrackingContext('/ai-assistant/rules', { ...trackingContext, target: 'rules' })
    : trackingContext?.target === 'logs'
      ? appendAiTrackingContext('/ai-assistant/logs', { ...trackingContext, target: 'logs' })
      : appendAiTrackingContext('/ai-assistant/inference', trackingContext ? { ...trackingContext, target: 'inference' } : null)

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title="AI 运营入口"
        subtitle="统一查看 Admin 端 AI 总览，并进入推理详情、规则治理和问答日志。"
        actions={<Tag variant="primary">AI 先建议，人再确认</Tag>}
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
                  onClick={() => {
                    setPrompt(item)
                    setReply(getAdminAiPromptReply(item))
                  }}
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
              <button className="btn btn-primary btn-sm" onClick={() => setReply(getAdminAiPromptReply(prompt))}>
                <Send size={12} />
                生成回答
              </button>
            </div>
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
