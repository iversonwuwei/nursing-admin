'use client'

import { AdminAiNav } from '@/components/ai/admin-ai-nav'
import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag } from '@/components/nh'
import {
  fetchFamilyAiHealthExplain,
  fetchFamilyAiTodaySummary,
  fetchFamilyAiVisitAssistant,
  isAdminAiDemoMode,
  sendFamilyAiChat,
} from '@/lib/ai/admin-ai-api'
import { healthVitals } from '@/lib/data/health-data'
import { FAMILY_APP_AI_MODULES, FAMILY_APP_SUMMARIES, getVisitAiSuggestions } from '@/lib/mock/app-ai'
import { Bot, CalendarHeart, HeartPulse, MessageSquareHeart, Smartphone } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function FamilyAppAiPage() {
  const demoMode = isAdminAiDemoMode()
  const [summaries, setSummaries] = useState(FAMILY_APP_SUMMARIES)
  const [liveModuleCards, setLiveModuleCards] = useState(FAMILY_APP_AI_MODULES)
  const [visitSuggestions, setVisitSuggestions] = useState(() => getVisitAiSuggestions())
  const [explanationNotes, setExplanationNotes] = useState<string[]>([])
  const [familyQaReply, setFamilyQaReply] = useState('')
  const [previewError, setPreviewError] = useState('')
  const moduleCards = demoMode ? FAMILY_APP_AI_MODULES : liveModuleCards
  const helpHref = '/ai-assistant/help'

  useEffect(() => {
    if (demoMode) {
      return
    }

    let cancelled = false
    const selectedVitals = healthVitals.filter(item => item.isAbnormal).slice(0, 2)
    const primaryVital = selectedVitals[0] ?? healthVitals[0]

    void Promise.all([
      Promise.all(selectedVitals.map(item => fetchFamilyAiTodaySummary({
        elderName: item.elderlyName,
        careLevel: item.isAbnormal ? '一级护理' : '二级护理',
        healthSummary: item.abnormalItems.join('、') || '状态稳定',
        completedTasks: item.isAbnormal ? 2 : 3,
        pendingTasks: item.isAbnormal ? 2 : 1,
        recentNotes: item.abnormalItems.length > 0 ? item.abnormalItems : ['今日常规护理已完成'],
      }))),
      Promise.all(selectedVitals.map(item => fetchFamilyAiHealthExplain({
        elderName: item.elderlyName,
        metricName: '血氧',
        metricValue: `${item.bloodOxygen}%`,
        normalRange: '94%-100%',
        trendDescription: item.isAbnormal ? '较昨日有下降，需继续观察。' : '近期保持稳定。',
      }))),
      fetchFamilyAiVisitAssistant({
        elderName: primaryVital.elderlyName,
        careLevel: primaryVital.isAbnormal ? '一级护理' : '二级护理',
        recentHealthSummary: primaryVital.abnormalItems.join('、') || '状态稳定',
        preferredTimeSlots: ['19:30', '20:00', '周末上午'],
      }),
      sendFamilyAiChat({
        message: `请用家属能理解的语言，说明 ${primaryVital.elderlyName} 今天最需要关注的护理重点。`,
      }),
    ])
      .then(([summaryResult, explainResult, visitResult, chatResult]) => {
        if (!cancelled) {
          setSummaries(summaryResult.map((item, index) => ({
            ...item,
            recommendation: explainResult[index]
              ? `${item.recommendation} ${explainResult[index].recommendation}`
              : item.recommendation,
          })))
          setLiveModuleCards(FAMILY_APP_AI_MODULES.map(item => ({ ...item, status: '已接入' })))
          setExplanationNotes(explainResult.map(item => `${item.explanation} ${item.recommendation}`))
          setVisitSuggestions(visitResult)
          setFamilyQaReply(chatResult.reply)
          setPreviewError('')
        }
      })
      .catch(error => {
        if (!cancelled) {
          setSummaries(FAMILY_APP_SUMMARIES)
          setLiveModuleCards(FAMILY_APP_AI_MODULES)
          setExplanationNotes([])
          setVisitSuggestions(getVisitAiSuggestions())
          setFamilyQaReply('')
          setPreviewError(error instanceof Error ? error.message : '家属端 AI 预览加载失败。')
        }
      })

    return () => {
      cancelled = true
    }
  }, [demoMode])

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title="家属 APP + AI 预览"
        subtitle="在当前 Web 仓库中预览家属端 AI 今日摘要、健康解释、探视助手与护理问答。"
        actions={<Tag variant="primary">Family Friendly</Tag>}
      />

      <AdminAiNav />

      {previewError ? (
        <div style={{ marginBottom: 16, fontSize: 12.5, color: 'var(--color-danger)' }}>{previewError}</div>
      ) : null}

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard icon={<Smartphone size={18} />} label="预览模块" value={FAMILY_APP_AI_MODULES.length} sub="覆盖首页 / 健康 / 探视 / 问答" color="primary" />
        <StatCard icon={<HeartPulse size={18} />} label="状态摘要" value={summaries.length} sub="家属友好表达" color="success" />
        <StatCard icon={<CalendarHeart size={18} />} label="探视建议" value={visitSuggestions.length} sub="现场 / 视频 / 沟通" color="warning" />
        <StatCard icon={<Bot size={18} />} label="当前阶段" value={demoMode ? '预览' : 'BFF'} sub={demoMode ? '先验证沟通体验' : '已接真实 AI'} color="info" />
      </div>

      <InteractionRailLayout
        main={(
          <>
            <DataCard icon={<MessageSquareHeart size={16} />} title="今日状态 AI 摘要" subtitle="同样的数据到家属端必须转成更温和、更结论导向的表达。">
              <div style={{ display: 'grid', gap: 10 }}>
                {summaries.map((item, index) => (
                  <div key={item.title} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                    <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>{item.summary}</div>
                    <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-muted)' }}>情绪标签 {item.mood}</div>
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>{item.recommendation}</div>
                    {explanationNotes[index] ? (
                      <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.6, color: 'var(--color-muted)' }}>{explanationNotes[index]}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            </DataCard>

            <DataCard icon={<CalendarHeart size={16} />} title="探视与沟通助手" subtitle="把探视安排、视频通话和家属沟通建议统一收口。">
              <div style={{ display: 'grid', gap: 10 }}>
                {visitSuggestions.map(item => (
                  <div key={item.title} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</span>
                      <Tag variant={item.type === '视频' ? 'info' : item.type === '现场' ? 'warning' : 'primary'}>{item.type}</Tag>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>{item.summary}</div>
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>{item.action}</div>
                  </div>
                ))}
              </div>
            </DataCard>

            <DataCard icon={<Bot size={16} />} title="护理问答预览" subtitle="使用真实 family AI 问答接口，验证家属语气、透明度和下一步建议是否足够克制。">
              <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
                {familyQaReply || '家属问答需要先说当前状态，再补充解释和建议动作，避免放大焦虑。'}
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard icon={<Smartphone size={16} />} title="家属端 AI 模块" subtitle="先验证信任、透明、沟通三类体验，再迁移到真实 APP。">
              <div style={{ display: 'grid', gap: 10 }}>
                {moduleCards.map(item => (
                  <div key={item.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</span>
                      <Tag variant={item.status === '已接入' ? 'success' : 'warning'}>{item.status}</Tag>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.summary}</div>
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>{item.primaryMetric}</div>
                  </div>
                ))}
              </div>
            </DataCard>

            <DataCard title="预览边界" subtitle="主区保留真实家属可感知输出，说明型内容后置。" badge={<Tag variant="warning">Boundary</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">主区先看摘要、探视建议和问答结果，不在首屏混排模块介绍。</div>
                <div className="page-help-card-item">家属端表达需要更克制，避免把运维或治理术语直接暴露出去。</div>
                <div className="page-help-card-item">完整 AI 模块定位和治理口径统一回到 AI 帮助页。</div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整 AI 预览说明迁移到显式帮助页"
              summary="家属端 AI 预览页现在优先展示家属可见输出，模块说明和边界信息统一后置。"
              items={[
                '先看今日摘要，再看探视与沟通建议。',
                '问答预览只验证语气与透明度，不替代正式医疗说明。',
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