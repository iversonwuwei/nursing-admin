'use client'

import { AdminAiNav } from '@/components/ai/admin-ai-nav'
import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag } from '@/components/nh'
import { appendAiTrackingContext, getAiSceneLabel, getAiSourceLabel, readAiTrackingContext } from '@/lib/ai-context'
import {
  buildAiRuleCardsForContext,
  fetchAdminAiAuditLogs,
  fetchAdminAiRules,
  getPrimaryCapabilityForContext,
  isAdminAiDemoMode,
  toggleAdminAiRule,
} from '@/lib/ai/admin-ai-api'
import { AI_RULE_TOGGLES, getAiLogsForContext } from '@/lib/mock/admin-ai'
import { Power, RefreshCcw, ShieldCheck, ToggleLeft } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

function buildDemoRelatedLogs(source: string, entityId?: string, focus?: string) {
  if (!source) {
    return []
  }

  return getAiLogsForContext({ source, entityId, focus }).slice(0, 2)
}

export default function AiRulesPage() {
  const searchParams = useSearchParams()
  const trackingContext = readAiTrackingContext(searchParams)
  const demoMode = isAdminAiDemoMode()
  const [rules, setRules] = useState(AI_RULE_TOGGLES)
  const [actionError, setActionError] = useState('')
  const [liveRelatedLogs, setLiveRelatedLogs] = useState<ReturnType<typeof getAiLogsForContext>>([])

  const trackingSource = trackingContext?.source ?? ''
  const trackingEntityId = trackingContext?.entityId ?? ''
  const trackingFocus = trackingContext?.focus ?? ''
  const primaryCapability = getPrimaryCapabilityForContext(trackingContext)
  const demoRelatedLogs = buildDemoRelatedLogs(trackingSource, trackingEntityId || undefined, trackingFocus || undefined)

  const enabledCount = useMemo(() => rules.filter(item => item.enabled).length, [rules])
  const disabledCount = rules.length - enabledCount
  const relatedRuleCards = trackingContext ? buildAiRuleCardsForContext(rules, trackingContext) : []
  const relatedLogs = demoMode ? demoRelatedLogs : liveRelatedLogs
  const highRiskRules = rules.filter(item => /健康|报警|入住/.test(`${item.scope}${item.name}`)).length
  const helpHref = '/ai-assistant/help'
  const contextBoundaries = trackingContext
    ? [
        ['health-monitoring', 'elderly-detail', 'incident-detail'].includes(trackingContext.source)
          ? '当前来源涉及高风险健康或事件场景，规则治理重点应是禁止自动升级、自动关闭和自动结案。'
          : '当前来源更偏向运营动作场景，规则治理重点应是禁止 AI 直接改写排班、采购或设备状态。',
        trackingContext.focus ? `当前关注点为“${trackingContext.focus}”，建议确认这类规则的启停是否会影响人工确认与日志留痕。` : '当前未指定关注点，可继续核对高风险规则与回滚路径。',
      ]
    : []

  useEffect(() => {
    if (demoMode) {
      return
    }

    let cancelled = false

    void Promise.all([
      fetchAdminAiRules(),
      trackingSource
        ? fetchAdminAiAuditLogs({ capability: primaryCapability, pageSize: 2 })
        : Promise.resolve({ items: [], total: 0, page: 1, pageSize: 2 }),
    ])
      .then(([nextRules, logsResult]) => {
        if (!cancelled) {
          setRules(nextRules)
          setLiveRelatedLogs(logsResult.items)
          setActionError('')
        }
      })
      .catch(error => {
        if (!cancelled) {
          setRules(AI_RULE_TOGGLES)
          setLiveRelatedLogs(demoRelatedLogs)
          setActionError(error instanceof Error ? error.message : 'AI 规则加载失败。')
        }
      })

    return () => {
      cancelled = true
    }
  }, [demoMode, demoRelatedLogs, primaryCapability, trackingSource])

  async function handleToggle(ruleId: string, nextEnabled: boolean) {
    setActionError('')

    if (demoMode) {
      setRules(current => current.map(item => item.id === ruleId ? { ...item, enabled: nextEnabled } : item))
      return
    }

    setRules(current => current.map(item => item.id === ruleId ? { ...item, enabled: nextEnabled } : item))
    try {
      const updatedRule = await toggleAdminAiRule(ruleId, nextEnabled)
      setRules(current => current.map(item => item.id === ruleId ? updatedRule : item))
    } catch (error) {
      setRules(current => current.map(item => item.id === ruleId ? { ...item, enabled: !nextEnabled } : item))
      setActionError(error instanceof Error ? error.message : 'AI 规则切换失败。')
    }
  }

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title="AI 规则治理"
        subtitle="治理 AI 建议适用范围、启停状态与替代回滚路径。"
        actions={<Tag variant="warning">治理入口</Tag>}
      />

      <AdminAiNav />

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard icon={<Power size={18} />} label="已启用规则" value={enabledCount} sub="当前对外生效" color="success" />
        <StatCard icon={<ToggleLeft size={18} />} label="停用规则" value={disabledCount} sub="保留回滚能力" color="warning" />
        <StatCard icon={<ShieldCheck size={18} />} label="高风险规则" value={highRiskRules} sub="需人工确认后生效" color="danger" />
        <StatCard icon={<RefreshCcw size={18} />} label="回滚策略" value="手动切换" sub={demoMode ? '当前仍为前端 mock 治理' : '当前已接后端治理开关'} color="info" />
      </div>

      <InteractionRailLayout
        main={(
          <>
            {trackingContext && (
              <DataCard icon={<ShieldCheck size={16} />} title="当前治理追踪" subtitle="按来源上下文聚焦本页最相关的治理边界与回滚检查点。" badge={<Tag variant="warning">{getAiSourceLabel(trackingContext.source)}</Tag>}>
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
                    当前场景视角为 {getAiSceneLabel(trackingContext.scene)}。
                  </div>
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

            <DataCard icon={<Power size={16} />} title="规则启停列表" subtitle="当前演示治理面；未来接真实配置中心时可直接替换数据源。">
              {actionError ? (
                <div style={{ marginBottom: 12, fontSize: 12.5, color: 'var(--color-danger)' }}>
                  {actionError}
                </div>
              ) : null}
              <div style={{ display: 'grid', gap: 10 }}>
                {rules.map(item => {
                  const enabled = item.enabled

                  return (
                    <div key={item.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.name}</div>
                          <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.description}</div>
                        </div>
                        <button className={`btn btn-sm ${enabled ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { void handleToggle(item.id, !enabled) }}>
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
          </>
        )}
        rail={(
          <>
            <DataCard title="治理边界" subtitle="主区优先保留规则切换操作，说明型治理文本统一后置。" badge={<Tag variant="warning">Boundary</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                {(trackingContext ? contextBoundaries : [
                  '当前规则只做建议增强，不允许 AI 直接越权执行。',
                  '关闭规则后必须回退为人工判定/处理，不影响原始业务数据。',
                ]).map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>

            <DataCard icon={<ShieldCheck size={16} />} title="治理约束" subtitle="当前规则只做建议增强，不允许直接越权执行。">
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '入住评估 Agent 只推荐护理级别，不允许绕过护理主管直接最终定级。',
                  '健康风险与报警解释只给“结论 + 解释 + 下一步动作”，不允许自动关闭高等级事件。',
                  '任务优先级建议只影响管理者认知，不直接重分配责任人或改写任务状态。',
                ].map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
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

            <PageHelpCard
              title="页面帮助"
              subtitle="完整 AI 治理说明迁移到显式帮助页"
              summary="AI 规则治理页现在优先展示追踪对象与规则启停列表，治理边界和回滚说明统一后置。"
              items={[
                '先确认当前追踪对象，再决定是否启停规则。',
                '规则切换只改变建议增强能力，不直接改写业务状态。',
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