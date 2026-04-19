'use client'

import { AdminAiNav } from '@/components/ai/admin-ai-nav'
import { DataCard, FilterBar, FilterItem, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag } from '@/components/nh'
import { getAiSceneLabel, getAiSourceLabel, getSuggestedAiLogChannel, getSuggestedAiLogKeywords, readAiTrackingContext } from '@/lib/ai-context'
import { fetchAdminAiAuditLogs, getPrimaryCapabilityForContext } from '@/lib/ai/admin-ai-api'
import { Bot, ScrollText, Search, ShieldCheck } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const CHANNEL_OPTIONS = ['全部', 'Admin / 入住办理', 'Admin / 健康总览', 'Admin / 任务中心', 'Admin / 报表中心'] as const

export default function AiLogsPage() {
  const searchParams = useSearchParams()
  const trackingContext = readAiTrackingContext(searchParams)
  const [keyword, setKeyword] = useState('')
  const [channel, setChannel] = useState<(typeof CHANNEL_OPTIONS)[number]>('全部')
  const [logs, setLogs] = useState<Awaited<ReturnType<typeof fetchAdminAiAuditLogs>>['items']>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const trackingSource = trackingContext?.source ?? ''
  const trackingEntityId = trackingContext?.entityId ?? ''
  const trackingFocus = trackingContext?.focus ?? ''
  const primaryCapability = getPrimaryCapabilityForContext(trackingContext)
  const suggestedChannel = getSuggestedAiLogChannel(trackingContext)
  const suggestedKeywords = getSuggestedAiLogKeywords(trackingContext)
  const effectiveChannel = channel === '全部' && suggestedChannel ? suggestedChannel as (typeof CHANNEL_OPTIONS)[number] : channel
  const effectiveKeywords = keyword.trim() ? [keyword.trim()] : suggestedKeywords
  const baseLogs = logs
  const filteredLogs = baseLogs.filter(item => {
    const matchesKeyword = effectiveKeywords.length === 0
      || effectiveKeywords.some(entry => (
        item.agent.includes(entry)
        || item.summary.includes(entry)
        || item.outcome.includes(entry)
        || item.operator.includes(entry)
      ))

    const matchesChannel = effectiveChannel === '全部' || item.channel === effectiveChannel

    return matchesKeyword && matchesChannel
  })

  useEffect(() => {
    let cancelled = false

    void fetchAdminAiAuditLogs({
      capability: primaryCapability,
      pageSize: 50,
    })
      .then(result => {
        if (!cancelled) {
          setLogs(result.items)
          setLoadError('')
          setLoading(false)
        }
      })
      .catch(error => {
        if (!cancelled) {
          setLogs([])
          setLoadError(error instanceof Error ? error.message : 'AI 日志加载失败。')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [primaryCapability, trackingEntityId, trackingFocus, trackingSource])
  const helpHref = '/ai-assistant/logs/help'

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title="AI 问答日志"
        subtitle="记录当前 Admin 端 AI 问答与结果摘要，便于后续接真实审计中心。"
        actions={<Tag variant="info">Audit Trail</Tag>}
      />

      <AdminAiNav />

      <InteractionRailLayout
        main={(
          <>
            {trackingContext && (
              <DataCard icon={<ShieldCheck size={16} />} title="当前审计追踪" subtitle="按来源上下文收窄日志关注范围，便于核对是否完成留痕。" badge={<Tag variant="warning">{getAiSourceLabel(trackingContext.source)}</Tag>}>
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
                    当前对象为 {trackingContext.entityName ?? '-'}，关注点为 {trackingContext.focus ?? '-'}。
                    当前场景为 {getAiSceneLabel(trackingContext.scene)}。{suggestedChannel ? ` 当前默认优先查看 ${suggestedChannel} 的日志。` : ' 当前未映射到固定日志场景。'}
                  </div>
                  {suggestedKeywords.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {suggestedKeywords.map(item => (
                        <Tag key={item} variant="info">默认关键词 {item}</Tag>
                      ))}
                    </div>
                  ) : null}
                </div>
              </DataCard>
            )}

            <div className="kpi-grid" style={{ marginBottom: 16 }}>
              <StatCard icon={<ScrollText size={18} />} label="日志总数" value={baseLogs.length} sub="当前来自后端审计日志" color="primary" />
              <StatCard icon={<Bot size={18} />} label="涉及 Agent" value={new Set(baseLogs.map(item => item.agent)).size} sub="已覆盖入住/健康/任务/运营" color="success" />
              <StatCard icon={<ShieldCheck size={18} />} label="人工留痕" value={baseLogs.length} sub="全部保留 capability 与审计编号" color="warning" />
              <StatCard icon={<Search size={18} />} label="当前结果" value={filteredLogs.length} sub={trackingContext ? '已按结构化上下文精确匹配' : effectiveKeywords.length > 0 ? `关键词 ${effectiveKeywords.join(' / ')}` : effectiveChannel === '全部' ? '按筛选条件显示' : `默认聚焦 ${effectiveChannel}`} color="info" />
            </div>

            <FilterBar>
              <FilterItem label="搜索">
                <div className="input-wrap" style={{ minWidth: 260 }}>
                  <span className="input-icon"><Search size={14} /></span>
                  <input
                    className="input"
                    value={keyword}
                    onChange={event => setKeyword(event.target.value)}
                    placeholder={suggestedKeywords.length > 0 ? `默认关键词：${suggestedKeywords.join(' / ')}` : '搜索 Agent、操作人、摘要或结果...'}
                    style={{ paddingLeft: 34 }}
                  />
                </div>
              </FilterItem>
              <FilterItem label="场景">
                <div className="select-wrap" style={{ minWidth: 180 }}>
                  <select className="select" value={channel} onChange={event => setChannel(event.target.value as (typeof CHANNEL_OPTIONS)[number])}>
                    {CHANNEL_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                  <span className="select-arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg></span>
                </div>
              </FilterItem>
            </FilterBar>

            <DataCard icon={<ScrollText size={16} />} title="日志明细" subtitle="当前展示的是结果型日志；后续可替换为真实提示词、工具链路和反馈审计。">
              {loading || loadError ? (
                <div style={{ marginBottom: 12, fontSize: 12.5, color: loadError ? 'var(--color-danger)' : 'var(--color-muted)' }}>
                  {loadError || '审计日志加载中...'}
                </div>
              ) : null}
              <div style={{ display: 'grid', gap: 10 }}>
                {filteredLogs.map(item => (
                  <div key={item.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.agent}</div>
                        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--color-muted)' }}>{item.channel} · {item.operator}</div>
                      </div>
                      <Tag variant="info">{item.createdAt}</Tag>
                    </div>
                    <div style={{ marginTop: 10, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>{item.summary}</div>
                    <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.outcome}</div>
                  </div>
                ))}
                {filteredLogs.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--color-muted)' }}>
                    当前筛选条件下暂无日志记录。
                  </div>
                ) : null}
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="审计上下文" subtitle="后置展示默认过滤逻辑和审计边界。" badge={<Tag variant="info">Context</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">当前模式：后端审计日志。</div>
                <div className="page-help-card-item">默认场景：{effectiveChannel === '全部' ? '未限制' : effectiveChannel}。</div>
                <div className="page-help-card-item">主区只保留 tracking banner、筛选条和日志明细，边界说明统一后置。</div>
              </div>
            </DataCard>

            <DataCard title="过滤规则" subtitle="帮助理解默认关键词与 capability 映射。" badge={<Tag variant="warning">Filter Boundary</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">默认 capability：{primaryCapability || '未映射'}。</div>
                <div className="page-help-card-item">默认关键词：{effectiveKeywords.length > 0 ? effectiveKeywords.join(' / ') : '未设置'}。</div>
                <div className="page-help-card-item">零结果时应显示显式空态，而不是清空页面骨架。</div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整 AI 日志说明迁移到显式帮助页"
              summary="AI 日志页现在只保留上下文追踪、筛选和日志明细，过滤边界与使用说明统一后置。"
              items={[
                '先确认 tracking context，再看默认关键词与场景过滤。',
                '日志明细只展示结果型留痕，不等同于完整提示词与工具链路。',
                '若需要完整审计边界和使用说明，进入帮助页查看。',
              ]}
              href={helpHref}
              actionLabel="查看 AI 日志帮助"
            />
          </>
        )}
      />
    </div>
  )
}