'use client'

import { AdminAiNav } from '@/components/ai/admin-ai-nav'
import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag } from '@/components/nh'
import {
  fetchAdminTaskPriorityFocus,
  fetchStaffAiCareCopilot,
  fetchStaffAiEscalationDraft,
  fetchStaffAiHandoverDraft,
  fetchStaffAiShiftSummary,
  isAdminAiDemoMode,
} from '@/lib/ai/admin-ai-api'
import { ALERT_LEVEL_LABELS, ALERT_TYPE_LABELS, alertRecords } from '@/lib/data/alerts-data'
import { getAdmissionApplicationsSnapshot, getStaffTaskItems, subscribeAdmissionWorkflow } from '@/lib/mock/admission-workflow'
import { STAFF_APP_AI_MODULES, STAFF_APP_FOCUS } from '@/lib/mock/app-ai'
import { BellRing, Bot, ClipboardList, Smartphone, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'

export default function StaffAppAiPage() {
  const demoMode = isAdminAiDemoMode()
  const applications = useSyncExternalStore(
    subscribeAdmissionWorkflow,
    getAdmissionApplicationsSnapshot,
    getAdmissionApplicationsSnapshot,
  )
  const [liveFocusItems, setLiveFocusItems] = useState(STAFF_APP_FOCUS)
  const [liveModuleCards, setLiveModuleCards] = useState(STAFF_APP_AI_MODULES)
  const [shiftSummary, setShiftSummary] = useState('')
  const [careCopilotSuggestion, setCareCopilotSuggestion] = useState('')
  const [handoverDraft, setHandoverDraft] = useState('')
  const [escalationDraft, setEscalationDraft] = useState('')
  const [previewError, setPreviewError] = useState('')
  const taskItems = useMemo(() => getStaffTaskItems(applications), [applications])
  const activeAlerts = useMemo(() => alertRecords.filter(item => item.status !== 'resolved'), [])
  const focusItems = demoMode ? STAFF_APP_FOCUS : liveFocusItems
  const moduleCards = demoMode ? STAFF_APP_AI_MODULES : liveModuleCards
  const helpHref = '/ai-assistant/help'

  useEffect(() => {
    if (demoMode) {
      return
    }

    let cancelled = false
    const completedItems = taskItems.filter(item => item.status === '已完成').slice(0, 3).map(item => `${item.title} · ${item.elderlyName}`)
    const pendingItems = taskItems.filter(item => item.status !== '已完成').slice(0, 4).map(item => `${item.title} · ${item.elderlyName}`)
    const topAlert = activeAlerts[0]

    void Promise.all([
      fetchStaffAiShiftSummary({
        shift: '晚班',
        completedTasks: completedItems.length,
        pendingTasks: pendingItems.length,
        alerts: activeAlerts.length,
        notes: 'Admin 侧预览员工端班次首页 AI。',
      }),
      fetchAdminTaskPriorityFocus(taskItems.slice(0, 6).map(item => ({
        taskId: item.id,
        title: item.title,
        elderName: item.elderlyName,
        careLevel: item.careLevel,
        dueAt: item.scheduledTime,
        status: item.status,
      }))),
      fetchStaffAiHandoverDraft({
        fromShift: '晚班',
        toShift: '夜班',
        completedItems,
        pendingItems,
        alerts: activeAlerts.slice(0, 3).map(item => `${item.elderlyName} · ${item.description}`),
      }),
      topAlert
        ? fetchStaffAiCareCopilot({
          alertType: ALERT_TYPE_LABELS[topAlert.type],
          alertDescription: topAlert.description,
          severity: ALERT_LEVEL_LABELS[topAlert.level],
          elderContext: `${topAlert.elderlyName} · ${topAlert.roomNumber}`,
          recentHistory: topAlert.resolution || undefined,
        })
        : Promise.resolve(null),
      topAlert
        ? fetchStaffAiEscalationDraft({
          alertType: topAlert.type,
          elderName: topAlert.elderlyName,
          description: topAlert.description,
          currentStatus: topAlert.status,
        })
        : Promise.resolve(null),
    ])
      .then(([summaryResult, focusResult, handoverResult, careCopilotResult, escalationResult]) => {
        if (!cancelled) {
          setLiveFocusItems(focusResult)
          setLiveModuleCards(STAFF_APP_AI_MODULES.map(item => ({
            ...item,
            status: (
              item.id === 'alert-responder'
                ? careCopilotResult
                : true
            ) ? '已接入' : item.status,
          })))
          setShiftSummary(summaryResult.summary)
          setCareCopilotSuggestion(careCopilotResult ? `${careCopilotResult.suggestedAction} ${careCopilotResult.steps.join('；')}` : '')
          setHandoverDraft(handoverResult.draft)
          setEscalationDraft(escalationResult?.draft ?? '')
          setPreviewError('')
        }
      })
      .catch(error => {
        if (!cancelled) {
          setLiveFocusItems(STAFF_APP_FOCUS)
          setLiveModuleCards(STAFF_APP_AI_MODULES)
          setShiftSummary('')
          setCareCopilotSuggestion('')
          setHandoverDraft('')
          setEscalationDraft('')
          setPreviewError(error instanceof Error ? error.message : '员工端 AI 预览加载失败。')
        }
      })

    return () => {
      cancelled = true
    }
  }, [activeAlerts, demoMode, taskItems])

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title="员工 APP + AI 预览"
        subtitle="在当前 Web 仓库中预览员工端 AI 首页、任务助手、报警提示和交接班摘要。"
        actions={<Tag variant="primary">Web Prototype</Tag>}
      />

      <AdminAiNav />

      {previewError ? (
        <div style={{ marginBottom: 16, fontSize: 12.5, color: 'var(--color-danger)' }}>{previewError}</div>
      ) : null}

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard icon={<Smartphone size={18} />} label="预览模块" value={STAFF_APP_AI_MODULES.length} sub="覆盖首页 / 任务 / 报警 / 交接" color="primary" />
        <StatCard icon={<ClipboardList size={18} />} label="重点任务" value={focusItems.filter(item => item.severity !== '常规').length} sub="适合上班即看" color="warning" />
        <StatCard icon={<BellRing size={18} />} label="报警提示" value={Math.min(activeAlerts.length, 2)} sub="高风险动作建议" color="danger" />
        <StatCard icon={<Bot size={18} />} label="当前阶段" value={demoMode ? '预览' : 'BFF'} sub={demoMode ? '先验证信息结构' : '已接真实 AI'} color="info" />
      </div>

      <InteractionRailLayout
        main={(
          <>
            <DataCard icon={<Sparkles size={16} />} title="班次首页 AI 摘要" subtitle="强调“先结论、后解释、再动作”的移动端压缩表达。">
              <div style={{ display: 'grid', gap: 10 }}>
                {focusItems.map(item => (
                  <div key={item.title} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</span>
                      <Tag variant={item.severity === '高' ? 'danger' : item.severity === '中' ? 'warning' : 'info'}>{item.severity}</Tag>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>{item.reason}</div>
                    <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-muted)' }}>{item.slaHint}</div>
                  </div>
                ))}
              </div>
            </DataCard>

            <DataCard icon={<Bot size={16} />} title="员工端 AI 输出预览" subtitle="在员工端重点验证班次摘要、交接班草稿和升级建议是否足够短、够可执行。">
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  shiftSummary || '员工端 AI 首屏优先展示 3 条以内的重点对象，不应把所有解释堆成长文本。',
                  careCopilotSuggestion || '报警响应提示需要把现场动作拆成 2 到 3 步，避免一线护工还要自行二次理解。',
                  handoverDraft || '对报警和任务建议，必须输出“先做什么”，而不是只解释为什么。',
                  escalationDraft || '交接班 AI 草稿要默认突出未闭环任务、异常对象和下一班动作。',
                ].map(item => (
                  <div key={item} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
                    {item}
                  </div>
                ))}
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard icon={<Smartphone size={16} />} title="员工端 AI 模块" subtitle="当前先用 Web 原型承接，后续可迁移到 Flutter 页面。">
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

            <DataCard title="预览边界" subtitle="主区保留一线人员可直接消费的输出，说明型内容后置。" badge={<Tag variant="warning">Boundary</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">主区优先展示班次重点、交接草稿和升级建议，不混排模块介绍。</div>
                <div className="page-help-card-item">员工端输出必须足够短且可执行，不能把治理说明直接塞给一线人员。</div>
                <div className="page-help-card-item">完整 AI 模块定位和治理口径统一回到 AI 帮助页。</div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整 AI 预览说明迁移到显式帮助页"
              summary="员工端 AI 预览页现在优先展示一线可执行输出，模块说明和边界信息统一后置。"
              items={[
                '先看班次摘要，再看报警和交接建议。',
                '员工端 AI 只辅助执行，不替代人工确认。',
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