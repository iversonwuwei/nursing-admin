'use client'

import { DataCard, FilterBar, FilterItem, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, type TagVariant } from '@/components/nh'
import { ModuleEntitlementGate } from '@/components/platform/ModuleEntitlementGate'
import {
    getAdmissionApplicationsSnapshot,
    getReminderItems,
    getReminderStatusVariant,
    markReminderAsRead,
    resolveReminder,
    saveReminderAuditNote,
    subscribeAdmissionWorkflow,
} from '@/lib/mock/admission-workflow'
import {
  fetchNotificationCenterSnapshot,
  type AdminNotificationSummaryResponse,
  type NotificationMessageResponse,
} from '@/lib/services/admin-module-services'
import { AlertTriangle, BellRing, CheckCircle2, Eye, MessageSquareMore, Search, Send, Users } from 'lucide-react'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'

const STATUS_OPTIONS = ['全部', '待发送', '已生成', '已读', '需升级', '已处理'] as const

const NOTIFICATION_WORKFLOW_STEPS = [
  { id: 'compose', title: '模板编排', detail: '选择模板、渠道、受众与触发来源。', tag: '编排', variant: 'primary' as const },
  { id: 'dispatch', title: '发送执行', detail: '按短信/推送、探视通知、定时提醒、公告广播进入发送队列。', tag: '发送', variant: 'primary' as const },
  { id: 'receipt', title: '回执回流', detail: '记录送达、已读、失败与人工补发状态。', tag: '回执', variant: 'info' as const },
  { id: 'escalate', title: '失败升级', detail: '高风险通知走重试、人工补发或主管升级。', tag: '升级', variant: 'warning' as const },
  { id: 'audit', title: '广播归档', detail: '广播和探视通知需保留触达范围与已读结果。', tag: '归档', variant: 'success' as const },
] as const

const VISIT_NOTICE_ITEMS = [
  { id: 'VN-001', title: '探视预约确认', target: '家属', status: '已送达', note: '周日 14:00 到访提醒已推送给王建国家属。', variant: 'success' as const },
  { id: 'VN-002', title: '探视改期通知', target: '家属', status: '待发送', note: '因活动冲突改到周六 10:00，需短信与站内信双通道。', variant: 'warning' as const },
] as const

const BROADCAST_ITEMS = [
  { id: 'BC-001', title: '周末探视公告', scope: '全院家属', status: '已发布', note: '公告已覆盖 3 个院区与家属端站内信。', variant: 'info' as const },
  { id: 'BC-002', title: '夜间巡视策略更新', scope: '夜班护理组', status: '草稿中', note: '待护理主管确认后广播到夜班班组。', variant: 'warning' as const },
] as const

export default function NotificationsPage() {
  const [notificationSummary, setNotificationSummary] = useState<AdminNotificationSummaryResponse | null>(null)
  const [notificationQueue, setNotificationQueue] = useState<NotificationMessageResponse[]>([])
  const [notificationDataSource, setNotificationDataSource] = useState<'live' | 'demo'>('demo')
  const [notificationIntegrationNote, setNotificationIntegrationNote] = useState('正在同步通知服务摘要与发送队列...')
  const applications = useSyncExternalStore(
    subscribeAdmissionWorkflow,
    getAdmissionApplicationsSnapshot,
    getAdmissionApplicationsSnapshot,
  )
  const reminderItems = useMemo(() => getReminderItems(applications), [applications])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>('全部')
  const [reminderNoteDrafts, setReminderNoteDrafts] = useState<Record<string, string>>({})
  const [reminderReasonDrafts, setReminderReasonDrafts] = useState<Record<string, string>>({})
  const [reminderSaveStates, setReminderSaveStates] = useState<Record<string, 'saved' | undefined>>({})

  useEffect(() => {
    let disposed = false

    async function loadNotificationSnapshot() {
      try {
        const snapshot = await fetchNotificationCenterSnapshot()

        if (disposed) {
          return
        }

        setNotificationSummary(snapshot.summary)
        setNotificationQueue(snapshot.queue)
        setNotificationDataSource('live')
        setNotificationIntegrationNote(
          snapshot.queue.length > 0
            ? '当前页面已接入真实通知摘要与发送队列；live 模式下全页只读展示真实通知数据。'
            : '当前页面已接入真实通知摘要，但当前发送队列为空；页面保持 live 空态，不再混用本地提醒闭环。',
        )
      } catch (error) {
        if (disposed) {
          return
        }

        setNotificationSummary(null)
        setNotificationQueue([])
        setNotificationDataSource('demo')
        setNotificationIntegrationNote(error instanceof Error ? error.message : '通知服务不可用，已回退为本地提醒闭环。')
      }
    }

    void loadNotificationSnapshot()

    return () => {
      disposed = true
    }
  }, [])

  const filteredReminders = useMemo(() => reminderItems.filter(reminder => {
    const matchesSearch = !search
      || reminder.title.includes(search)
      || reminder.recipient.includes(search)
      || reminder.elderlyName.includes(search)
      || reminder.room.includes(search)

    const matchesStatus = status === '全部' || reminder.status === status
    return matchesSearch && matchesStatus
  }), [reminderItems, search, status])

  const stats = useMemo(() => {
    if (notificationSummary) {
      return {
        total: notificationQueue.length,
        pending: notificationSummary.queued,
        escalations: notificationSummary.failed,
        resolved: notificationSummary.delivered,
      }
    }

    return {
      total: reminderItems.length,
      pending: reminderItems.filter(reminder => reminder.status === '待发送').length,
      escalations: reminderItems.filter(reminder => reminder.status === '需升级').length,
      resolved: reminderItems.filter(reminder => reminder.status === '已处理').length,
    }
  }, [notificationQueue.length, notificationSummary, reminderItems])

  const notificationModules = useMemo<Array<{
    id: string
    label: string
    metric: number
    sub: string
    note: string
    variant: TagVariant
  }>>(() => {
    if (notificationSummary) {
      return [
        {
          id: 'sms-push',
          label: '短信 / 推送',
          metric: notificationSummary.queued + notificationSummary.failed,
          sub: '账单、催缴、异常通知',
          note: '真实队列已接入，失败消息需要人工补发或升级。',
          variant: notificationSummary.failed > 0 ? 'warning' : 'info',
        },
        {
          id: 'visit-notice',
          label: '探视通知',
          metric: notificationSummary.visitNotices,
          sub: '预约确认 / 改期 / 签到提醒',
          note: '探视通知已从通知服务汇总中读取。',
          variant: 'success',
        },
        {
          id: 'scheduled-reminder',
          label: '定时提醒',
          metric: notificationSummary.scheduledReminders,
          sub: '护理计划 / 用药 / 回访',
          note: 'live 模式下改为只读展示真实提醒队列与回执状态。',
          variant: notificationSummary.queued > 0 ? 'primary' : 'success',
        },
        {
          id: 'broadcast',
          label: '公告广播',
          metric: notificationSummary.broadcasts,
          sub: '机构 / 楼层 / 班次广播',
          note: '广播统计已从真实通知服务摘要回流。',
          variant: 'info',
        },
      ]
    }

    return [
      {
        id: 'sms-push',
        label: '短信 / 推送',
        metric: stats.pending + stats.escalations,
        sub: '账单、催缴、异常通知',
        note: '高风险通知需支持重试和人工补发。',
        variant: stats.escalations > 0 ? 'warning' : 'info',
      },
      {
        id: 'visit-notice',
        label: '探视通知',
        metric: VISIT_NOTICE_ITEMS.length,
        sub: '预约确认 / 改期 / 签到提醒',
        note: '探视场景要保留家属触达记录。',
        variant: 'success',
      },
      {
        id: 'scheduled-reminder',
        label: '定时提醒',
        metric: reminderItems.length,
        sub: '护理计划 / 用药 / 回访',
        note: '当前页仍保留共享 workflow store 的提醒闭环。',
        variant: stats.pending > 0 ? 'primary' : 'success',
      },
      {
        id: 'broadcast',
        label: '公告广播',
        metric: BROADCAST_ITEMS.length,
        sub: '机构 / 楼层 / 班次广播',
        note: '广播需要跟踪目标范围与已读情况。',
        variant: 'info',
      },
    ]
  }, [notificationSummary, reminderItems.length, stats.escalations, stats.pending])

  const liveVisitNotices = useMemo(
    () => notificationQueue.filter(item => item.category.toLowerCase().includes('visit')),
    [notificationQueue],
  )

  const liveBroadcasts = useMemo(
    () => notificationQueue.filter(item => item.category.toLowerCase().includes('broadcast')),
    [notificationQueue],
  )

  const notificationHelpItems = useMemo(() => {
    const firstModule = notificationModules[0]
    const secondModule = notificationModules[1]

    return [
      firstModule ? `${firstModule.label}：${firstModule.note}` : '先处理待发送与失败消息。',
      secondModule ? `${secondModule.label}：${secondModule.note}` : '探视与广播说明已迁到帮助页。',
      `流程：${NOTIFICATION_WORKFLOW_STEPS.map(step => step.title).join(' -> ')}`,
      notificationDataSource === 'live' ? '完整通道规则与失败边界已迁到帮助页。' : 'demo 模式下的本地提醒闭环说明已迁到帮助页。',
    ]
  }, [notificationDataSource, notificationModules])

  const liveActionQueue = useMemo(
    () => notificationQueue.filter(item => item.status !== 'delivered'),
    [notificationQueue],
  )

  function getReminderDraft(reminderId: string, fallback?: string) {
    return reminderNoteDrafts[reminderId] ?? fallback ?? ''
  }

  function getReminderReasonDraft(reminderId: string, fallback?: string) {
    return reminderReasonDrafts[reminderId] ?? fallback ?? ''
  }

  function updateReminderDraft(reminderId: string, value: string) {
    setReminderNoteDrafts(current => ({ ...current, [reminderId]: value }))
  }

  function updateReminderReasonDraft(reminderId: string, value: string) {
    setReminderReasonDrafts(current => ({ ...current, [reminderId]: value }))
  }

  function getReminderDraftStatus(reminderId: string, persistedNote?: string) {
    const hasLocalDraft = Object.prototype.hasOwnProperty.call(reminderNoteDrafts, reminderId)
    const currentDraft = getReminderDraft(reminderId, persistedNote)

    if (!hasLocalDraft && !persistedNote) {
      return '将使用默认说明'
    }

    if (currentDraft === (persistedNote ?? '')) {
      return '备注已保存'
    }

    return '备注待提交'
  }

  function getReminderReasonStatus(reminderId: string, persistedReason?: string) {
    const hasLocalDraft = Object.prototype.hasOwnProperty.call(reminderReasonDrafts, reminderId)
    const currentDraft = getReminderReasonDraft(reminderId, persistedReason)

    if (!hasLocalDraft && !persistedReason) {
      return '将使用默认原因'
    }

    if (currentDraft === (persistedReason ?? '')) {
      return '原因已保存'
    }

    return '原因待提交'
  }

  function markReminderSaved(reminderId: string) {
    setReminderSaveStates(current => ({ ...current, [reminderId]: 'saved' }))
    window.setTimeout(() => {
      setReminderSaveStates(current => ({ ...current, [reminderId]: undefined }))
    }, 1400)
  }

  return (
    <ModuleEntitlementGate
      module="notification-service"
      pageTitle="通知中心"
      moduleLabel="通知服务"
      disabledSummary="当前租户未开通通知服务。页面保留为只读禁用态，避免发送、回执和广播能力在未订阅租户暴露。"
      fallbackLinks={[
        { href: '/', label: '返回首页' },
        { href: '/operations/daily', label: '进入日班工作台' },
      ]}
    >
    <div className="page-root animate-fade-up">
      <PageHeader
          title="通知中心"
          subtitle={notificationDataSource === 'live'
            ? `承接短信/推送、探视通知、定时提醒、公告广播四类能力 · 当前真实队列 ${notificationQueue.length} 条消息`
            : `承接短信/推送、探视通知、定时提醒、公告广播四类能力 · 当前 ${reminderItems.length} 条提醒，覆盖 ${applications.length} 条入住记录`}
      />

        <InteractionRailLayout
          main={(
            <>
              <div className="kpi-grid" style={{ marginBottom: 16 }}>
                <StatCard icon={<BellRing size={18} />} label="提醒总数" value={stats.total} sub="由护理计划自动生成" color="primary" />
                <StatCard icon={<Send size={18} />} label="待发送" value={stats.pending} sub="已入住后的持续提醒" color="info" />
                <StatCard icon={<AlertTriangle size={18} />} label="需升级" value={stats.escalations} sub="包含超时升级策略" color="warning" />
                <StatCard icon={<Users size={18} />} label="已处理" value={stats.resolved} sub="已完成升级或处置" color="success" />
              </div>

              {notificationDataSource === 'live' && notificationQueue.length === 0 ? (
                <DataCard title="真实发送队列" subtitle="Notification Service 已连通，但当前没有待展示的真实消息。" badge={<Tag variant="info">Live Empty</Tag>}>
                  <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 13, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                    当前真实发送队列为空。页面保留 live 摘要与空态提示，不再继续展示本地提醒闭环。
                  </div>
                </DataCard>
              ) : notificationQueue.length > 0 ? (
                <DataCard title="真实发送队列" subtitle="来自 Notification Service 的当前消息队列，只做读取展示。" badge={<Tag variant="success">Live Queue</Tag>}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                    {notificationQueue.slice(0, 6).map(item => (
                      <div key={item.notificationId} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14, background: 'var(--color-panel)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                          <Tag variant={item.status === 'failed' ? 'warning' : item.status === 'delivered' ? 'success' : 'info'}>{item.status}</Tag>
                        </div>
                        <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--color-muted)' }}>{item.audience} · {item.audienceKey}</div>
                        <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>{item.body}</div>
                        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-muted)' }}>{new Date(item.createdAtUtc).toLocaleString('zh-CN')} · {item.category}</div>
                      </div>
                    ))}
                  </div>
                </DataCard>
              ) : null}

              {notificationDataSource === 'live' ? (
                <DataCard title="实时处置队列" subtitle="聚合待发送与失败消息，方便运营后续接入重试、人工补发与升级动作。">
                  {liveActionQueue.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                      {liveActionQueue.map(item => (
                        <div
                          key={item.notificationId}
                          style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--color-card)',
                            padding: 16,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="avatar avatar-sm"><MessageSquareMore size={14} /></div>
                              <div>
                                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                                <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{item.category} · {item.notificationId}</div>
                              </div>
                            </div>
                            <Tag variant={item.status === 'failed' ? 'warning' : 'info'}>{item.status}</Tag>
                          </div>

                          <div className="info-row"><span className="info-label">接收对象</span><span className="info-value">{item.audience}</span></div>
                          <div className="info-row"><span className="info-label">目标范围</span><span className="info-value">{item.audienceKey}</span></div>
                          <div className="info-row"><span className="info-label">创建时间</span><span className="info-value">{new Date(item.createdAtUtc).toLocaleString('zh-CN')}</span></div>
                          <div className="info-row"><span className="info-label">最后更新</span><span className="info-value">{item.updatedAtUtc ? new Date(item.updatedAtUtc).toLocaleString('zh-CN') : '暂无更新'}</span></div>
                          <div className="info-row"><span className="info-label">消息内容</span><span className="info-value">{item.body}</span></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)', fontSize: 13, lineHeight: 1.7 }}>
                      当前真实队列里没有待发送或失败消息。
                    </div>
                  )}
                </DataCard>
              ) : (
                <>
                  <FilterBar>
                    <FilterItem label="搜索">
                      <div className="input-wrap" style={{ minWidth: 240 }}>
                        <span className="input-icon"><Search size={14} /></span>
                        <input
                          className="input"
                          placeholder="搜索提醒、长者、接收人或房间..."
                          value={search}
                          onChange={event => setSearch(event.target.value)}
                          style={{ paddingLeft: 34 }}
                        />
                      </div>
                    </FilterItem>
                    <FilterItem label="状态">
                      <div className="select-wrap" style={{ minWidth: 140 }}>
                        <select className="select" value={status} onChange={event => setStatus(event.target.value as (typeof STATUS_OPTIONS)[number])}>
                          {STATUS_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                        <span className="select-arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg></span>
                      </div>
                    </FilterItem>
                  </FilterBar>

                    <DataCard title="提醒列表" subtitle="显示护理计划同步后的提醒对象、发送时间和升级策略。">
                      {filteredReminders.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                          {filteredReminders.map(reminder => (
                            <div
                              key={reminder.id}
                              style={{
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--color-card)',
                                padding: 16,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 10,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div className="avatar avatar-sm"><MessageSquareMore size={14} /></div>
                                  <div>
                                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{reminder.title}</div>
                                    <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{reminder.elderlyName} · {reminder.room}</div>
                                  </div>
                                </div>
                                <Tag variant={getReminderStatusVariant(reminder.status)}>{reminder.status}</Tag>
                              </div>

                            <div className="info-row"><span className="info-label">接收对象</span><span className="info-value">{reminder.recipient}</span></div>
                            <div className="info-row"><span className="info-label">计划发送</span><span className="info-value">{reminder.scheduledTime}</span></div>
                            <div className="info-row"><span className="info-label">通知通道</span><span className="info-value">{reminder.channel}</span></div>
                            <div className="info-row"><span className="info-label">提醒策略</span><span className="info-value">{reminder.policy}</span></div>
                            <div className="info-row"><span className="info-label">来源编号</span><span className="info-value">{reminder.sourceId}</span></div>
                            <div className="info-row"><span className="info-label">处理回执</span><span className="info-value">{reminder.handledBy && reminder.handledAt ? `${reminder.handledBy} · ${reminder.handledAt}` : '尚未处理'}</span></div>
                            <div className="info-row"><span className="info-label">操作说明</span><span className="info-value">{reminder.actionNote ?? '暂无说明'}</span></div>
                            <div className="info-row"><span className="info-label">异常原因</span><span className="info-value">{reminder.exceptionReason ?? (reminder.status === '需升级' ? '触发超时升级策略，需要主管介入。' : '无异常升级记录')}</span></div>
                            <textarea
                              className="input"
                              rows={2}
                              style={{
                                width: '100%',
                                height: 'auto',
                                padding: '8px 10px',
                                resize: 'vertical',
                                borderColor: reminderSaveStates[reminder.id] === 'saved' ? 'var(--color-success)' : undefined,
                                boxShadow: reminderSaveStates[reminder.id] === 'saved' ? '0 0 0 3px rgba(34,197,94,0.12)' : undefined,
                              }}
                              placeholder="输入提醒处理备注，例如已电话通知家属、已安排复核..."
                              value={getReminderDraft(reminder.id, reminder.actionNote)}
                              onChange={event => updateReminderDraft(reminder.id, event.target.value)}
                              onBlur={() => {
                                saveReminderAuditNote(
                                  reminder.id,
                                  reminder.status,
                                  getReminderDraft(reminder.id, reminder.actionNote),
                                  reminder.exceptionReason,
                                  reminder.handledBy,
                                  reminder.handledAt,
                                  reminder.handledAtIso,
                                )
                                markReminderSaved(reminder.id)
                              }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              <span style={{ fontSize: 11.5, color: getReminderDraftStatus(reminder.id, reminder.actionNote) === '备注待提交' ? 'var(--color-warning)' : 'var(--color-muted)' }}>
                                {getReminderDraftStatus(reminder.id, reminder.actionNote)}
                              </span>
                              {reminderSaveStates[reminder.id] === 'saved' ? (
                                <span style={{ fontSize: 11.5, color: 'var(--color-success)', fontWeight: 600 }}>已自动保存</span>
                              ) : null}
                            </div>
                            {reminder.status === '需升级' ? (
                              <>
                                <textarea
                                  className="input"
                                  rows={2}
                                  style={{
                                    width: '100%',
                                    height: 'auto',
                                    padding: '8px 10px',
                                    resize: 'vertical',
                                    borderColor: reminderSaveStates[reminder.id] === 'saved' ? 'var(--color-success)' : undefined,
                                    boxShadow: reminderSaveStates[reminder.id] === 'saved' ? '0 0 0 3px rgba(34,197,94,0.12)' : undefined,
                                  }}
                                  placeholder="输入升级原因或补充说明..."
                                  value={getReminderReasonDraft(reminder.id, reminder.exceptionReason)}
                                  onChange={event => updateReminderReasonDraft(reminder.id, event.target.value)}
                                  onBlur={() => {
                                    saveReminderAuditNote(
                                      reminder.id,
                                      reminder.status,
                                      getReminderDraft(reminder.id, reminder.actionNote),
                                      getReminderReasonDraft(reminder.id, reminder.exceptionReason),
                                      reminder.handledBy,
                                      reminder.handledAt,
                                      reminder.handledAtIso,
                                    )
                                    markReminderSaved(reminder.id)
                                  }}
                                />
                                <span style={{ fontSize: 11.5, color: getReminderReasonStatus(reminder.id, reminder.exceptionReason) === '原因待提交' ? 'var(--color-warning)' : 'var(--color-muted)' }}>
                                  {getReminderReasonStatus(reminder.id, reminder.exceptionReason)}
                                </span>
                              </>
                            ) : null}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                              {reminder.status === '已处理' ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-success)', fontSize: 12.5, fontWeight: 600 }}>
                                  <CheckCircle2 size={14} />
                                  已完成处置
                                </div>
                              ) : reminder.status === '需升级' ? (
                                <button className="btn btn-primary btn-sm" onClick={() => resolveReminder(
                                  reminder.id,
                                  '护理主管',
                                  getReminderDraft(reminder.id, reminder.actionNote) || '升级提醒已完成干预处理。',
                                  getReminderReasonDraft(reminder.id, reminder.exceptionReason) || '触发超时升级策略，需要主管介入。',
                                )}>
                                  处理升级
                                </button>
                              ) : reminder.status === '已读' ? (
                                <button className="btn btn-secondary btn-sm" onClick={() => resolveReminder(
                                  reminder.id,
                                  '护理主管',
                                  getReminderDraft(reminder.id, reminder.actionNote) || '提醒事项已完成处置并关闭。',
                                )}>
                                  完成处理
                                </button>
                              ) : (
                                <button className="btn btn-secondary btn-sm" onClick={() => markReminderAsRead(
                                  reminder.id,
                                  '值班护士',
                                  getReminderDraft(reminder.id, reminder.actionNote) || '已确认收到提醒，待后续处理。',
                                )}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    <Eye size={14} />
                                    标记已读
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: 24,
                            textAlign: 'center',
                            color: 'var(--color-muted)',
                            fontSize: 13,
                            lineHeight: 1.7,
                          }}
                        >
                          当前筛选条件下暂无提醒。请先在入住页确认护理计划，或调整当前筛选条件。
                        </div>
                      )}
                    </DataCard>
                </>
              )}
            </>
          )}
          rail={(
            <>
              <DataCard
                title="API 对接状态"
                subtitle={notificationIntegrationNote}
                badge={<Tag variant={notificationDataSource === 'live' ? 'success' : 'warning'}>{notificationDataSource === 'live' ? 'Live API' : 'Demo Fallback'}</Tag>}
              >
                <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                  {notificationDataSource === 'live'
                    ? '当前范围：通知摘要、发送队列、探视通知、广播与处置队列。live 模式下不再混用本地提醒 store；接口不可用时才回退到 demo workflow。'
                    : '当前范围：通知摘要、发送队列。保留项：提醒编辑、已读、升级处理仍走本地 workflow store。回滚方式：移除本页通知 API 读层即可恢复原视图。'}
                </div>
              </DataCard>

              <DataCard
                title="通道速览"
                subtitle="只保留对当前判断有用的通道计数，不再默认展开完整队列说明。"
                badge={<Tag variant={notificationDataSource === 'live' ? 'success' : 'info'}>{notificationDataSource === 'live' ? 'Live Channels' : 'Demo Channels'}</Tag>}
              >
                <div style={{ display: 'grid', gap: 10 }}>
                  {[
                    {
                      label: '探视通知',
                      value: notificationDataSource === 'live' ? liveVisitNotices.length : VISIT_NOTICE_ITEMS.length,
                      hint: notificationDataSource === 'live' ? '真实队列中的探视类消息' : '演示探视通知样例',
                    },
                    {
                      label: '公告广播',
                      value: notificationDataSource === 'live' ? liveBroadcasts.length : BROADCAST_ITEMS.length,
                      hint: notificationDataSource === 'live' ? '真实队列中的广播类消息' : '演示广播样例',
                    },
                    {
                      label: '失败升级',
                      value: notificationDataSource === 'live' ? notificationSummary?.failed ?? 0 : stats.escalations,
                      hint: '需要重试、补发或主管介入',
                    },
                  ].map(item => (
                    <div key={item.label} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>{item.value}</div>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.hint}</div>
                    </div>
                  ))}
                </div>
              </DataCard>

              <PageHelpCard
                title="通知中心帮助"
                subtitle="完整通道说明、升级规则和广播口径已迁到帮助页。"
                summary="右侧不再默认展开探视和广播的整块说明；页面只保留实时状态、少量通道概览和帮助入口。"
                items={notificationHelpItems}
                href="/notifications/help"
              />
            </>
          )}
        />
    </div>
    </ModuleEntitlementGate>
  )
}