'use client'

import { AdminAiNav } from '@/components/ai/admin-ai-nav'
import { DataCard, PageHeader, StatCard, Tag } from '@/components/nh'
import { appendAiTrackingContext, getAiSourceLabel, readAiTrackingContext } from '@/lib/ai-context'
import { AI_RULE_TOGGLES, getAiLogsForContext, getAiRuleCardsForContext } from '@/lib/mock/admin-ai'
import { Power, RefreshCcw, ShieldCheck, ToggleLeft } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'

export default function AiRulesPage() {
  const searchParams = useSearchParams()
  const trackingContext = readAiTrackingContext(searchParams)
  const [ruleState, setRuleState] = useState<Record<string, boolean>>(
    Object.fromEntries(AI_RULE_TOGGLES.map(item => [item.id, item.enabled])),
  )

  const enabledCount = useMemo(() => AI_RULE_TOGGLES.filter(item => ruleState[item.id]).length, [ruleState])
  const disabledCount = AI_RULE_TOGGLES.length - enabledCount
  const relatedRuleCards = trackingContext ? getAiRuleCardsForContext(trackingContext) : []
  const relatedLogs = trackingContext ? getAiLogsForContext(trackingContext).slice(0, 2) : []
  const contextBoundaries = trackingContext
    ? [
        ['health-monitoring', 'elderly-detail', 'incident-detail'].includes(trackingContext.source)
          ? '当前来源涉及高风险健康或事件场景，规则治理重点应是禁止自动升级、自动关闭和自动结案。'
          : '当前来源更偏向运营动作场景，规则治理重点应是禁止 AI 直接改写排班、采购或设备状态。',
        trackingContext.focus ? `当前关注点为“${trackingContext.focus}”，建议确认这类规则的启停是否会影响人工确认与日志留痕。` : '当前未指定关注点，可继续核对高风险规则与回滚路径。',
      ]
    : []

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title="AI 规则治理"
        subtitle="治理 AI 建议适用范围、启停状态与替代回滚路径。"
        actions={<Tag variant="warning">治理入口</Tag>}
      />

      <AdminAiNav />

      {trackingContext && (
        <DataCard icon={<ShieldCheck size={16} />} title="当前治理追踪" subtitle="按来源上下文聚焦本页最相关的治理边界与回滚检查点。" badge={<Tag variant="warning">{getAiSourceLabel(trackingContext.source)}</Tag>}>
          <div style={{ display: 'grid', gap: 10 }}>
            {contextBoundaries.map(item => (
              <div key={item} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
                {item}
              </div>
            ))}
            {relatedRuleCards.length > 0 ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {relatedRuleCards.map(item => (
                  <div key={item.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                      <Tag variant={item.variant}>{item.ruleId}</Tag>
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.summary}</div>
                    <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.6, color: 'var(--color-text)' }}>{item.rollback}</div>
                  </div>
                ))}
              </div>
            ) : null}
            {relatedLogs.length > 0 ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {relatedLogs.map(item => (
                  <div key={item.id} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 12, fontSize: 12, lineHeight: 1.6, color: 'var(--color-muted)' }}>
                    <div>{item.summary}</div>
                    <div style={{ marginTop: 4, color: 'var(--color-text)' }}>{item.outcome}</div>
                  </div>
                ))}
              </div>
            ) : null}
            <div>
              <Link href={appendAiTrackingContext('/ai-assistant/logs', trackingContext ? { ...trackingContext, target: 'logs' } : null)} className="btn btn-secondary btn-sm">转到日志审计</Link>
            </div>
          </div>
        </DataCard>
      )}

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard icon={<Power size={18} />} label="已启用规则" value={enabledCount} sub="当前对外生效" color="success" />
        <StatCard icon={<ToggleLeft size={18} />} label="停用规则" value={disabledCount} sub="保留回滚能力" color="warning" />
        <StatCard icon={<ShieldCheck size={18} />} label="高风险规则" value={2} sub="需人工确认后生效" color="danger" />
        <StatCard icon={<RefreshCcw size={18} />} label="回滚策略" value="手动切换" sub="当前仍为前端 mock 治理" color="info" />
      </div>

      <DataCard icon={<Power size={16} />} title="规则启停列表" subtitle="当前演示治理面；未来接真实配置中心时可直接替换数据源。">
        <div style={{ display: 'grid', gap: 10 }}>
          {AI_RULE_TOGGLES.map(item => {
            const enabled = ruleState[item.id]

            return (
              <div key={item.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.name}</div>
                    <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.description}</div>
                  </div>
                  <button className={`btn btn-sm ${enabled ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRuleState(current => ({ ...current, [item.id]: !current[item.id] }))}>
                    {enabled ? '已启用' : '已停用'}
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10, fontSize: 12, color: 'var(--color-muted)' }}>
                  <span>适用范围 {item.scope}</span>
                  <span>最近调整 {item.lastUpdated}</span>
                  <span>回滚方式 关闭规则后回退为纯人工判定/处理</span>
                </div>
              </div>
            )
          })}
        </div>
      </DataCard>

      <div className="dashboard-grid-2" style={{ marginTop: 16 }}>
        <DataCard icon={<ShieldCheck size={16} />} title="治理边界" subtitle="当前规则只做建议增强，不允许直接越权执行。">
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              '入住评估 Agent 只推荐护理级别，不允许绕过护理主管直接最终定级。',
              '健康风险与报警解释只给“结论 + 解释 + 下一步动作”，不允许自动关闭高等级事件。',
              '任务优先级建议只影响管理者认知，不直接重分配责任人或改写任务状态。',
            ].map(item => (
              <div key={item} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
                {item}
              </div>
            ))}
          </div>
        </DataCard>

        <DataCard icon={<RefreshCcw size={16} />} title="发布与回滚" subtitle="遵循小步发布与显式回滚路径的演示版治理策略。">
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              { title: '灰度方式', detail: '先在 Dashboard 与 AI 总览展示，不直接推进到自动执行链路。', variant: 'info' as const },
              { title: '健康信号', detail: '关注待确认建议数、未闭环报警数、人工采纳率是否异常上升。', variant: 'warning' as const },
              { title: '回滚路径', detail: '关闭规则后回退为人工解读和人工流转，不影响原始业务数据。', variant: 'success' as const },
            ].map(item => (
              <div key={item.title} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</span>
                  <Tag variant={item.variant}>{item.title}</Tag>
                </div>
                <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.detail}</div>
              </div>
            ))}
          </div>
        </DataCard>
      </div>
    </div>
  )
}