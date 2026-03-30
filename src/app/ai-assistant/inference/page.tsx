'use client'

import { AdminAiNav } from '@/components/ai/admin-ai-nav'
import { DataCard, PageHeader, StatCard, Tag } from '@/components/nh'
import { appendAiTrackingContext, getAiSourceLabel, readAiTrackingContext } from '@/lib/ai-context'
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
import { useSyncExternalStore } from 'react'

export default function AiInferencePage() {
  const searchParams = useSearchParams()
  const trackingContext = readAiTrackingContext(searchParams)
  const applications = useSyncExternalStore(
    subscribeAdmissionWorkflow,
    getAdmissionApplicationsSnapshot,
    getAdmissionApplicationsSnapshot,
  )

  const recommendationRecords = getAiRecommendationRecords(applications)
  const healthInsights = getHealthAiInsights()
  const runningModels = AI_MODEL_STATUSES.filter(item => item.status === '运行中').length
  const grayModels = AI_MODEL_STATUSES.filter(item => item.status === '灰度中').length
  const focusedHealthInsight = trackingContext
    ? healthInsights.find(item => item.elderlyId === trackingContext.entityId || item.elderlyName === trackingContext.entityName)
    : undefined
  const contextCards = trackingContext
    ? getAiInferenceCardsForContext(trackingContext)
    : []
  const relatedLogs = trackingContext
    ? getAiLogsForContext(trackingContext).slice(0, 3)
    : []
  const contextNarratives = trackingContext
    ? [
        trackingContext.source === 'health-monitoring' || trackingContext.source === 'elderly-detail' || trackingContext.source === 'incident-detail'
          ? '当前来源更偏向高风险解释场景，应优先检查 AI 是否只输出解释与建议，而没有越过人工复核边界。'
          : '当前来源更偏向运营动作场景，此页只提供推理结果与解释样本，不直接改写业务状态。',
        trackingContext.focus ? `当前关注点为“${trackingContext.focus}”，建议结合对象级解释样本确认是否需要升级到规则治理或日志审计。` : '当前未指定关注点，可继续从模型状态和异常样本中定位下一步。',
      ]
    : []

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title="AI 推理详情"
        subtitle="查看当前 Admin 端 AI 推理结果、模型状态与人工确认边界。"
        actions={<Tag variant="primary">Result Only</Tag>}
      />

      <AdminAiNav />

      {trackingContext && (
        <DataCard icon={<BrainCircuit size={16} />} title="当前推理追踪" subtitle="按来源对象聚焦当前需要解释的 AI 推理信号。" badge={<Tag variant="warning">{getAiSourceLabel(trackingContext.source)}</Tag>}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {[
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
            {contextNarratives.map(item => (
              <div key={item} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
                {item}
              </div>
            ))}
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

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard icon={<Cpu size={18} />} label="运行中模型" value={runningModels} sub="当前在线可用" color="success" />
        <StatCard icon={<BrainCircuit size={18} />} label="灰度模型" value={grayModels} sub="需继续观察质量" color="warning" />
        <StatCard icon={<ShieldCheck size={18} />} label="已出建议" value={recommendationRecords.length} sub="包含入住评估结果" color="info" />
        <StatCard icon={<Bot size={18} />} label="健康解释对象" value={healthInsights.length} sub="当前异常样本" color="danger" />
      </div>

      <div className="dashboard-grid-2" style={{ marginBottom: 16 }}>
        <DataCard icon={<Cpu size={16} />} title="模型状态" subtitle="只展示版本、责任域和延迟，不暴露训练内部细节。">
          <div style={{ display: 'grid', gap: 10 }}>
            {AI_MODEL_STATUSES.map(item => (
              <div key={item.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.name}</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: 'var(--color-muted)' }}>{item.owner} · {item.version}</div>
                  </div>
                  <Tag variant={item.status === '运行中' ? 'success' : item.status === '灰度中' ? 'warning' : 'neutral'}>{item.status}</Tag>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12.5, color: 'var(--color-muted)' }}>
                  <span>平均延迟 {item.latencyMs} ms</span>
                  <span>最近更新 {item.lastUpdated}</span>
                </div>
              </div>
            ))}
          </div>
        </DataCard>

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
      </div>

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
    </div>
  )
}