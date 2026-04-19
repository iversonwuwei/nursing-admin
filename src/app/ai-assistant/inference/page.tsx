'use client'

import { AdminAiNav } from '@/components/ai/admin-ai-nav'
import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag } from '@/components/nh'
import { appendAiTrackingContext, getAiSceneLabel, getAiSourceLabel, readAiTrackingContext } from '@/lib/ai-context'
import {
    fetchAdminAiAuditLogs,
    fetchAdminAiHealthRisk,
    fetchAdminAiModelsStatus,
    getPrimaryCapabilityForContext,
} from '@/lib/ai/admin-ai-api'
import { fetchAdminHealthArchives } from '@/lib/elderly/admin-elderly-api'
import { Bot, BrainCircuit, Cpu, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface InferenceModelState {
    id: string
    name: string
    version: string
    owner: string
    status: string
    latencyMs: number
    lastUpdated: string
    capability: string
    configurationSource: string
    configuredModel?: string | null
}

interface InferenceHealthInsight {
    elderlyId: string
    elderlyName: string
    roomNumber: string
    severity: '高风险' | '中风险'
    title: string
    explanation: string
    action: string
}

function formatTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

function capabilityLabel(capability?: string) {
  const labels: Record<string, string> = {
    'dashboard-insights': '运营摘要',
    'health-risk': '健康风险',
    'task-priority': '任务优先级',
    'admission-assessment': '入住评估',
    'shift-summary': '班次摘要',
    'handover-draft': '交接班草稿',
    'escalation-draft': '升级草稿',
    'today-summary': '家属日报',
    'health-explain': '健康解读',
    'visit-assistant': '探视助手',
  }

  return capability ? (labels[capability] ?? capability) : '未命名能力'
}

function configurationSourceLabel(source?: string) {
  const labels: Record<string, string> = {
    'capability-override': '能力级 provider + model 覆盖',
    'capability-provider+provider-model': '能力级 provider，模型走 provider 默认',
    'capability-provider': '能力级 provider 指定',
    'capability-model': '能力级 model 指定',
    'routing-default+provider-model': '路由默认 provider，模型走 provider 默认',
      unconfigured: '未完整配置',
  }

  return source ? (labels[source] ?? source) : '未知来源'
}

export default function AiInferencePage() {
  const searchParams = useSearchParams()
  const trackingContext = readAiTrackingContext(searchParams)
    const [modelStatuses, setModelStatuses] = useState<InferenceModelState[]>([])
    const [healthInsights, setHealthInsights] = useState<InferenceHealthInsight[]>([])
    const [auditLogs, setAuditLogs] = useState<Awaited<ReturnType<typeof fetchAdminAiAuditLogs>>['items']>([])
  const [inferenceError, setInferenceError] = useState('')
    const [loading, setLoading] = useState(true)
  const trackingSource = trackingContext?.source ?? ''
  const trackingEntityId = trackingContext?.entityId ?? ''
  const trackingName = trackingContext?.entityName ?? ''
  const trackingFocus = trackingContext?.focus ?? ''

  const runningModels = modelStatuses.filter(item => item.status === '运行中').length
  const unreachableModels = modelStatuses.filter(item => item.status !== '运行中').length
  const focusedHealthInsight = trackingContext
    ? healthInsights.find(item => item.elderlyId === trackingContext.entityId || item.elderlyName === trackingContext.entityName)
    : undefined
    const relatedLogs = trackingContext ? auditLogs : []
  const helpHref = '/ai-assistant/help'
  const contextNarratives = trackingContext
    ? [
        trackingContext.source === 'health-monitoring' || trackingContext.source === 'elderly-detail' || trackingContext.source === 'incident-detail'
          ? '当前来源更偏向高风险解释场景，应优先检查 AI 是否只输出解释与建议，而没有越过人工复核边界。'
          : '当前来源更偏向运营动作场景，此页只提供推理结果与解释样本，不直接改写业务状态。',
        trackingContext.focus ? `当前关注点为“${trackingContext.focus}”，建议结合对象级解释样本确认是否需要升级到规则治理或日志审计。` : '当前未指定关注点，可继续从模型状态和异常样本中定位下一步。',
      ]
    : []

    useEffect(() => {
    let cancelled = false
      setLoading(true)

      async function loadInference() {
          try {
          const requestTrackingContext = trackingSource && trackingEntityId && trackingName
              ? {
                  source: trackingSource,
                  entityId: trackingEntityId,
                  entityName: trackingName,
                  focus: trackingFocus || undefined,
              }
              : null
          const primaryCapability = getPrimaryCapabilityForContext(requestTrackingContext)

          const [modelResult, archiveResult, logsResult] = await Promise.all([
              fetchAdminAiModelsStatus(),
            fetchAdminHealthArchives(),
            trackingSource
                ? fetchAdminAiAuditLogs({ capability: primaryCapability, pageSize: 6 })
                : fetchAdminAiAuditLogs({ pageSize: 6 }),
        ])

          const riskResults = await Promise.allSettled(
              archiveResult.items.slice(0, 4).map(item => fetchAdminAiHealthRisk({
                  elderId: item.elderId,
                  elderName: item.elderName,
                  roomNumber: item.roomNumber,
              bloodPressure: item.bloodPressure,
              heartRate: item.heartRate,
              temperature: item.temperature,
              bloodSugar: item.bloodSugar,
              oxygen: item.oxygen,
              medicalHistory: item.riskSummary || undefined,
          })),
        )

          if (cancelled) {
              return
          }

          setModelStatuses(modelResult.map(item => ({
              id: `${item.capability}:${item.provider}:${item.model}`,
              name: capabilityLabel(item.capability),
              version: item.model,
              owner: item.provider,
            status: item.isReachable ? '运行中' : '待恢复',
            latencyMs: item.latencyMs ?? 0,
            lastUpdated: formatTimestamp(item.checkedAtUtc),
            capability: item.capability,
            configurationSource: configurationSourceLabel(item.configurationSource),
            configuredModel: item.configuredModel,
        })))
          setHealthInsights(riskResults.flatMap(item => item.status === 'fulfilled' ? [item.value] : []))
          setAuditLogs(logsResult.items)
          setInferenceError('')
      } catch (error) {
          if (cancelled) {
              return
        }

          setModelStatuses([])
          setHealthInsights([])
          setAuditLogs([])
          setInferenceError(error instanceof Error ? error.message : 'AI 推理详情加载失败。')
      } finally {
          if (!cancelled) {
              setLoading(false)
        }
          }
      }

      void loadInference()

    return () => {
      cancelled = true
    }
  }, [trackingEntityId, trackingFocus, trackingName, trackingSource])

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title="AI 推理详情"
        subtitle="查看当前 Admin 端 AI 推理结果、模型状态与人工确认边界。"
        actions={<Tag variant="primary">Result Only</Tag>}
      />

      <AdminAiNav />

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard icon={<Cpu size={18} />} label="运行中模型" value={runningModels} sub="当前在线可用" color="success" />
        <StatCard icon={<BrainCircuit size={18} />} label="待恢复模型" value={unreachableModels} sub="需继续观察连通性" color="warning" />
              <StatCard icon={<ShieldCheck size={18} />} label="审计记录" value={auditLogs.length} sub="当前能力范围内的真实留痕" color="info" />
        <StatCard icon={<Bot size={18} />} label="健康解释对象" value={healthInsights.length} sub="当前异常样本" color="danger" />
      </div>

          {loading ? (
              <div style={{ marginBottom: 16, fontSize: 12.5, color: 'var(--color-muted)' }}>AI 推理详情同步中...</div>
          ) : null}

      {inferenceError ? (
        <div style={{ marginBottom: 16, fontSize: 12.5, color: 'var(--color-danger)' }}>{inferenceError}</div>
      ) : null}

      <InteractionRailLayout
        main={(
          <>
                      {trackingContext ? (
              <DataCard icon={<BrainCircuit size={16} />} title="当前推理追踪" subtitle="按来源对象聚焦当前需要解释的 AI 推理信号。" badge={<Tag variant="warning">{getAiSourceLabel(trackingContext.source)}</Tag>}>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                    {[
                      { label: '场景视角', value: getAiSceneLabel(trackingContext.scene) },
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
                  {focusedHealthInsight ? (
                    <div style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{focusedHealthInsight.elderlyName}</span>
                        <Tag variant={focusedHealthInsight.severity === '高风险' ? 'danger' : 'warning'}>{focusedHealthInsight.severity}</Tag>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>{focusedHealthInsight.explanation}</div>
                      <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>{focusedHealthInsight.action}</div>
                    </div>
                                  ) : null}
                  {relatedLogs.length > 0 ? (
                    <div style={{ display: 'grid', gap: 8 }}>
                      {relatedLogs.map(item => (
                        <div key={item.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 12 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.agent}</div>
                          <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.summary}</div>
                          <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.6, color: 'var(--color-text)' }}>{item.outcome}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div>
                    <Link href={appendAiTrackingContext('/ai-assistant/rules', trackingContext ? { ...trackingContext, target: 'rules' } : null)} className="btn btn-secondary btn-sm">转到规则治理</Link>
                  </div>
                </div>
              </DataCard>
                      ) : null}

            <DataCard icon={<Bot size={16} />} title="健康解释样本" subtitle="高风险场景继续维持解释与动作建议，不自动作最终判定。">
              <div style={{ display: 'grid', gap: 10 }}>
                {healthInsights.slice(0, 4).map(item => (
                  <div key={item.elderlyId} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.elderlyName}</div>
                        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--color-muted)' }}>{item.roomNumber} · {item.title}</div>
                      </div>
                      <Tag variant={item.severity === '高风险' ? 'danger' : 'warning'}>{item.severity}</Tag>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>{item.explanation}</div>
                    <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>{item.action}</div>
                  </div>
                ))}
                              {!loading && healthInsights.length === 0 ? (
                                  <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--color-muted)' }}>
                                      当前没有可展示的真实健康解释样本。
                                  </div>
                              ) : null}
              </div>
            </DataCard>

                      <DataCard icon={<ShieldCheck size={16} />} title="最近 AI 审计记录" subtitle="当前优先展示真实推理留痕，不再回退 admission workflow 样本。">
                          <div style={{ display: 'grid', gap: 10 }}>
                              {auditLogs.map(item => (
                                  <div key={item.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.agent}</span>
                                          <Tag variant="info">{item.createdAt}</Tag>
                                      </div>
                        <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>{item.summary}</div>
                        <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.outcome}</div>
                    </div>
                ))}
                              {!loading && auditLogs.length === 0 ? (
                                  <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--color-muted)' }}>
                                      当前没有可展示的真实 AI 审计记录。
                                  </div>
                              ) : null}
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
                <DataCard title="推理上下文" subtitle="后置展示当前来源对象与解释边界。" badge={<Tag variant="info">Context</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                {(trackingContext ? contextNarratives : [
                            '当前页面只展示真实 AI 推理结果与审计留痕，不自动执行任何业务动作。',
                            '若需要进一步治理，请进入规则页查看启停与回滚边界。',
                ]).map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>

                <DataCard icon={<Cpu size={16} />} title="模型状态" subtitle="模型可用性与配置来源统一后置展示。">
              <div style={{ display: 'grid', gap: 10 }}>
                {modelStatuses.map(item => (
                    <div key={item.id} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.name}</div>
                            <Tag variant={item.status === '运行中' ? 'success' : 'warning'}>{item.status}</Tag>
                        </div>
                        <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.6, color: 'var(--color-muted)' }}>
                            {item.owner} · {item.version} · {item.configurationSource}
                    </div>
                        <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.6, color: 'var(--color-text)' }}>
                            最近检查 {item.lastUpdated} · 延迟 {item.latencyMs} ms
                    </div>
                  </div>
                ))}
                        {!loading && modelStatuses.length === 0 ? (
                            <div style={{ padding: 16, textAlign: 'center', fontSize: 12.5, color: 'var(--color-muted)' }}>
                                当前没有可展示的真实模型状态。
                            </div>
                        ) : null}
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整 AI 推理说明迁移到显式帮助页"
                    summary="推理页现在只保留真实模型状态、健康解释样本、审计留痕和治理跳转，不再回退 admission workflow 或本地 AI 样本。"
              items={[
                  '先看模型状态，再看对象级健康解释样本。',
                  '高风险解释仍需回到业务页由人工确认。',
                  '若需要完整治理边界与回滚说明，进入帮助页查看。',
              ]}
              href={helpHref}
              actionLabel="查看 AI 帮助"
            />
          </>
        )}
      />
    </div>
  )
}
