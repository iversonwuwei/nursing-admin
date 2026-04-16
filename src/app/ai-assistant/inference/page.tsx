'use client'

import { AdminAiNav } from '@/components/ai/admin-ai-nav'
import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag } from '@/components/nh'
import { appendAiTrackingContext, getAiSceneLabel, getAiSourceLabel, readAiTrackingContext } from '@/lib/ai-context'
import {
  fetchAdminAiAuditLogs,
  fetchAdminAiHealthRisk,
  fetchAdminAiModelsStatus,
  getPrimaryCapabilityForContext,
  isAdminAiDemoMode,
} from '@/lib/ai/admin-ai-api'
import { healthVitals } from '@/lib/data/health-data'
import {
  AI_MODEL_STATUSES,
  getAiInferenceCardsForContext,
  getAiLogsForContext,
  getAiRecommendationRecords,
  getHealthAiInsights,
} from '@/lib/mock/admin-ai'
import {
  getAdmissionApplicationsSnapshot,
  getLevelVariant,
  getStatusVariant,
  subscribeAdmissionWorkflow,
} from '@/lib/mock/admission-workflow'
import { Bot, BrainCircuit, Cpu, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, useSyncExternalStore } from 'react'

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
    'unconfigured': '未完整配置',
  }

  return source ? (labels[source] ?? source) : '未知来源'
}

export default function AiInferencePage() {
  const searchParams = useSearchParams()
  const trackingContext = readAiTrackingContext(searchParams)
  const demoMode = isAdminAiDemoMode()
  const applications = useSyncExternalStore(
    subscribeAdmissionWorkflow,
    getAdmissionApplicationsSnapshot,
    getAdmissionApplicationsSnapshot,
  )
  const [liveModelStatuses, setLiveModelStatuses] = useState(AI_MODEL_STATUSES)
  const [liveHealthInsights, setLiveHealthInsights] = useState(getHealthAiInsights())
  const [liveRelatedLogs, setLiveRelatedLogs] = useState(trackingContext ? getAiLogsForContext(trackingContext).slice(0, 3) : [])
  const [inferenceError, setInferenceError] = useState('')
  const trackingSource = trackingContext?.source ?? ''
  const trackingEntityId = trackingContext?.entityId ?? ''
  const trackingName = trackingContext?.entityName ?? ''
  const trackingFocus = trackingContext?.focus ?? ''

  const recommendationRecords = getAiRecommendationRecords(applications)
  const demoHealthInsights = getHealthAiInsights()
  const healthInsights = demoMode ? demoHealthInsights : liveHealthInsights
  const modelStatuses = demoMode ? AI_MODEL_STATUSES : liveModelStatuses
  const runningModels = modelStatuses.filter(item => item.status === '运行中').length
  const unreachableModels = modelStatuses.filter(item => item.status !== '运行中').length
  const focusedHealthInsight = trackingContext
    ? healthInsights.find(item => item.elderlyId === trackingContext.entityId || item.elderlyName === trackingContext.entityName)
    : undefined
  const contextCards = trackingContext
    ? getAiInferenceCardsForContext(trackingContext)
    : []
  const relatedLogs = trackingContext
    ? (demoMode ? getAiLogsForContext(trackingContext).slice(0, 3) : liveRelatedLogs)
    : []
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
    if (demoMode) {
      return
    }

    let cancelled = false
    const requestTrackingContext = trackingSource && trackingEntityId && trackingName
      ? {
        source: trackingSource,
        entityId: trackingEntityId,
        entityName: trackingName,
        focus: trackingFocus || undefined,
      }
      : null
    const primaryCapability = getPrimaryCapabilityForContext(requestTrackingContext)
    const abnormalVitals = healthVitals.filter(item => item.isAbnormal).slice(0, 4)

    void Promise.all([
      fetchAdminAiModelsStatus(),
      Promise.all(abnormalVitals.map(item => fetchAdminAiHealthRisk({
        elderId: item.elderlyId,
        elderName: item.elderlyName,
        roomNumber: item.roomNumber,
        bloodPressure: `${item.bloodPressureHigh}/${item.bloodPressureLow}`,
        heartRate: item.heartRate,
        temperature: item.temperature,
        bloodSugar: item.bloodSugar,
        oxygen: item.bloodOxygen,
        medicalHistory: item.abnormalItems.join('、') || undefined,
      }))),
      trackingSource
        ? fetchAdminAiAuditLogs({ capability: primaryCapability, pageSize: 3 })
        : Promise.resolve({ items: [], total: 0, page: 1, pageSize: 3 }),
    ])
      .then(([modelResult, healthResult, logsResult]) => {
        if (!cancelled) {
          setLiveModelStatuses(modelResult.map(item => ({
            id: `${item.capability}:${item.provider}:${item.model}`,
            name: capabilityLabel(item.capability),
            version: item.model,
            owner: item.provider,
            status: item.isReachable ? (item.provider === 'mock' ? '灰度中' : '运行中') : '待回收',
            latencyMs: item.latencyMs ?? 0,
            lastUpdated: formatTimestamp(item.checkedAtUtc),
            capability: item.capability,
            configurationSource: configurationSourceLabel(item.configurationSource),
            configuredModel: item.configuredModel,
          })))
          setLiveHealthInsights(healthResult)
          setLiveRelatedLogs(logsResult.items)
          setInferenceError('')
        }
      })
      .catch(error => {
        if (!cancelled) {
          setLiveModelStatuses(AI_MODEL_STATUSES)
          setLiveHealthInsights(demoHealthInsights)
          setLiveRelatedLogs(requestTrackingContext ? getAiLogsForContext(requestTrackingContext).slice(0, 3) : [])
          setInferenceError(error instanceof Error ? error.message : 'AI 推理详情加载失败。')
        }
      })

    return () => {
      cancelled = true
    }
  }, [demoHealthInsights, demoMode, trackingEntityId, trackingFocus, trackingName, trackingSource])

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
        <StatCard icon={<ShieldCheck size={18} />} label="已出建议" value={recommendationRecords.length} sub="包含入住评估结果" color="info" />
        <StatCard icon={<Bot size={18} />} label="健康解释对象" value={healthInsights.length} sub="当前异常样本" color="danger" />
      </div>

      {inferenceError ? (
        <div style={{ marginBottom: 16, fontSize: 12.5, color: 'var(--color-danger)' }}>{inferenceError}</div>
      ) : null}

      <InteractionRailLayout
        main={(
          <>
            {trackingContext && (
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
                  {contextCards.length > 0 ? (
                    <div style={{ display: 'grid', gap: 8 }}>
                      {contextCards.map(item => (
                        <div key={item.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                            <Tag variant={item.variant}>{item.title}</Tag>
                          </div>
                          <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.summary}</div>
                          <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.6, color: 'var(--color-text)' }}>{item.action}</div>
                        </div>
                      ))}
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
            )}

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
              </div>
            </DataCard>

            <DataCard icon={<ShieldCheck size={16} />} title="入住评估推理记录" subtitle="AI 推荐与人工确认的差异样本可在这里统一查看。">
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>长者</th>
                      <th>AI 推荐</th>
                      <th>人工确认</th>
                      <th>状态</th>
                      <th>置信度</th>
                      <th>模板</th>
                      <th>说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recommendationRecords.map(item => (
                      <tr key={item.id} className="table-hover-row">
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.elderlyName}</span>
                            <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{item.createdAt}</span>
                          </div>
                        </td>
                        <td><Tag variant={getLevelVariant(item.recommendedLevel as Parameters<typeof getLevelVariant>[0])}>{item.recommendedLevel}</Tag></td>
                        <td><Tag variant={item.confirmedLevel === '待确认' ? 'warning' : getLevelVariant(item.confirmedLevel as Parameters<typeof getLevelVariant>[0])}>{item.confirmedLevel}</Tag></td>
                        <td><Tag variant={getStatusVariant(item.status as Parameters<typeof getStatusVariant>[0])}>{item.status}</Tag></td>
                        <td>{item.confidence}%</td>
                        <td>{item.planTemplateCode}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.6 }}>{item.reasonSummary}</span>
                            <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>确认人 {item.confirmedBy}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="推理边界" subtitle="主区优先保留结果对象，说明型信息统一后置。" badge={<Tag variant="warning">Boundary</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                {(trackingContext ? contextNarratives : [
                  '当前未带来源上下文时，主区只保留样本与推理记录，不额外展示说明型长文。',
                  'AI 推理页只读展示结果，不直接改写业务状态或人工确认结论。',
                ]).map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>

            <DataCard icon={<Cpu size={16} />} title="模型状态" subtitle="只展示版本、责任域和延迟，不暴露训练内部细节。">
              <div style={{ display: 'grid', gap: 10 }}>
                {modelStatuses.map(item => (
                  <div key={item.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.name}</div>
                        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--color-muted)' }}>{item.owner} · {item.version}</div>
                      </div>
                      <Tag variant={item.status === '运行中' ? 'success' : item.status === '灰度中' ? 'warning' : 'neutral'}>{item.status}</Tag>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.6, color: 'var(--color-text)' }}>
                      {item.configurationSource}
                      {item.configuredModel ? ` · 显式模型 ${item.configuredModel}` : ' · 当前未写死模型版本'}
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12.5, color: 'var(--color-muted)' }}>
                      <span>平均延迟 {item.latencyMs} ms</span>
                      <span>最近更新 {item.lastUpdated}</span>
                    </div>
                  </div>
                ))}
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整 AI 推理说明迁移到显式帮助页"
              summary="AI 推理详情页现在优先展示当前追踪对象、健康解释样本和入住评估记录，模型与治理说明统一后置。"
              items={[
                '先看追踪对象和推理结果，再检查模型状态。',
                '推理页只读展示结果，不替代人工确认。',
                '若需要完整 AI 使用说明，进入 AI 帮助页查看。',
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