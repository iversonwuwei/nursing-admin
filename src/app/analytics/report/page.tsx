'use client'

import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { getCareScene, matchesAdmissionScene } from '@/lib/care-scenes'
import { getAiDashboardInsights, getAiOpsReport } from '@/lib/mock/admin-ai'
import { getAdmissionApplicationsSnapshot, subscribeAdmissionWorkflow } from '@/lib/mock/admission-workflow'
import { BarChart3, Download, Mail, RefreshCcw, ScrollText, Send, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState, useSyncExternalStore } from 'react'

export default function AnalyticsReportPage() {
  const searchParams = useSearchParams()
  const scene = getCareScene(searchParams.get('scene'))
  const applications = useSyncExternalStore(
    subscribeAdmissionWorkflow,
    getAdmissionApplicationsSnapshot,
    getAdmissionApplicationsSnapshot,
  )
  const [period, setPeriod] = useState<'周报' | '月报'>('周报')
  const scopedApplications = useMemo(
    () => applications.filter(item => matchesAdmissionScene(item.sourceType, scene)),
    [applications, scene],
  )
  const report = getAiOpsReport(period, scopedApplications)
  const dashboardInsights = getAiDashboardInsights(scopedApplications)
  const generatedPlans = scopedApplications.filter(item => item.status !== '待人工确认').length
  const pendingConfirmations = scopedApplications.filter(item => item.status === '待人工确认').length
  const sceneMeta = scene === 'home'
    ? {
      title: '居家监管报表中心',
      subtitle: '面向评定主管与运营经理的居家周报 / 月报摘要草稿。',
      suggestionTitle: '下一步接入建议',
    }
    : scene === 'institutional'
      ? {
        title: '机构运营报表中心',
        subtitle: '面向院长与运营主管的机构周报 / 月报摘要草稿。',
        suggestionTitle: '下一步接入建议',
      }
      : {
        title: 'AI 报表中心',
        subtitle: '面向院长与运营主管的 AI 周报 / 月报摘要草稿，不替代正式财务与经营报表。',
        suggestionTitle: '下一步接入建议',
      }
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'analytics-report',
    entityId: `${scene ?? 'general'}-${period}`,
    entityName: report.title,
    focus,
    target,
    scene: scene ?? undefined,
  })
  const helpHref = '/analytics/help'

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title={sceneMeta.title}
        subtitle={sceneMeta.subtitle}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`btn btn-sm ${period === '周报' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPeriod('周报')}>周报</button>
            <button className={`btn btn-sm ${period === '月报' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPeriod('月报')}>月报</button>
            <Link href={buildAiHref(scene === 'home' ? 'home-report-summary' : 'institutional-report-summary', 'logs')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
          </div>
        }
      />

      <InteractionRailLayout
        main={(
          <>
            <div className="kpi-grid" style={{ marginBottom: 16 }}>
              <StatCard icon={<ScrollText size={18} />} label="当前摘要周期" value={report.periodLabel} sub={`生成于 ${report.generatedAt}`} color="primary" />
              <StatCard icon={<ShieldCheck size={18} />} label="AI 闭环入住" value={generatedPlans} sub="已进入计划或已入住" color="success" />
              <StatCard icon={<RefreshCcw size={18} />} label="待确认建议" value={pendingConfirmations} sub="仍需人工定级" color="warning" />
              <StatCard icon={<BarChart3 size={18} />} label="AI 风险信号" value={dashboardInsights.filter(item => item.variant === 'danger' || item.variant === 'warning').length} sub="已汇总到本次摘要" color="info" />
            </div>

            <DataCard icon={<ScrollText size={16} />} title={report.title} subtitle="AI 先给摘要草稿，再由管理者确认是否导出。" badge={<Tag variant="primary">Draft</Tag>}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 13, lineHeight: 1.7, color: 'var(--color-text)' }}>
                  {report.overview}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>核心亮点</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {report.highlights.map(item => (
                      <div key={item} style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>• {item}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>推荐动作</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {report.recommendedActions.map(item => (
                      <div key={item} style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>• {item}</div>
                    ))}
                  </div>
                </div>
              </div>
            </DataCard>

            <DataCard icon={<ShieldCheck size={16} />} title="异常与风险解释" subtitle={scene === 'home' ? '当前居家监管摘要里需要被管理层看见的非正常信号。' : scene === 'institutional' ? '当前机构运营摘要里需要被管理层看见的非正常信号。' : '当前摘要里需要被管理层看见的非正常信号。'}>
              <div style={{ display: 'grid', gap: 10 }}>
                {report.anomalies.map(item => (
                  <div key={item} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                    <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>{item}</div>
                  </div>
                ))}
                <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>纳入本次摘要的页面入口</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {dashboardInsights.map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--color-text)' }}>{item.title}</span>
                        <Tag variant={item.variant}>{item.value}</Tag>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DataCard>

            <DataCard icon={<Download size={16} />} title="导出与送达" subtitle={scene === 'home' ? '当前仍为半自动导出，适合演示居家监管摘要如何进入运营流程。' : scene === 'institutional' ? '当前仍为半自动导出，适合演示机构运营摘要如何进入运营流程。' : '当前仍为半自动导出，适合演示 AI 摘要如何进入运营流程。'}>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  { label: '邮件订阅', value: '已配置', detail: '周一 08:30 自动生成后待人工确认发送' },
                  { label: '院长晨会 PDF', value: '待导出', detail: '需先确认本次 AI 异常解释是否采纳' },
                  { label: '运营群摘要', value: '手动发送', detail: '当前保留人工复核，不自动推送到工作群' },
                ].map(item => (
                  <div key={item.label} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.label}</span>
                      <Tag variant={item.value === '已配置' ? 'success' : item.value === '待导出' ? 'warning' : 'info'}>{item.value}</Tag>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.detail}</div>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary btn-sm"><Mail size={12} />预览邮件版</button>
                  <button className="btn btn-primary btn-sm"><Download size={12} />导出摘要草稿</button>
                </div>
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="报表上下文" subtitle="后置展示当前视角、周期和边界。" badge={<Tag variant="info">Context</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">当前视角：{scene === 'home' ? '居家监管' : scene === 'institutional' ? '机构运营' : '通用运营'}。</div>
                <div className="page-help-card-item">当前周期：{period}，摘要标题为 {report.title}。</div>
                <div className="page-help-card-item">页面只产出草稿与送达动作，不直接自动发布正式经营报表。</div>
              </div>
            </DataCard>

            <DataCard icon={<Send size={16} />} title={sceneMeta.suggestionTitle} subtitle="治理建议和后续接入说明后置展示。">
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '将报表摘要与 Dashboard 聚合指标绑定统一口径，避免解释与图表数字脱节。',
                  '为 AI 报表导出补充送达回执和订阅日志，满足运营审计场景。',
                  '接入真实 Analytics Service 后，继续保留当前人工确认出口，不直接自动发布。',
                ].map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <Link href={buildAiHref(scene === 'home' ? 'home-report-governance' : 'institutional-report-governance', 'rules')} className="btn btn-secondary btn-sm">查看 AI 治理</Link>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整报表中心说明迁移到显式帮助页"
              summary="报表中心现在只保留摘要草稿、异常解释和送达动作，导出边界与治理说明统一后置。"
              items={[
                '先看当前周期摘要，再看异常信号，最后决定是否导出。',
                '周报与月报切换只影响本地草稿视图，不改变底层 admission 数据。',
                '若需要完整页面定位和导出边界说明，进入帮助页查看。',
              ]}
              href={helpHref}
              actionLabel="查看分析帮助"
            />
          </>
        )}
      />
    </div>
  )
}