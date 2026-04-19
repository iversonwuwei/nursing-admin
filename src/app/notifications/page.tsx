'use client'

import { DataCard, FilterBar, FilterItem, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, type TagVariant } from '@/components/nh'
import { ModuleEntitlementGate } from '@/components/platform/ModuleEntitlementGate'
import {
    fetchNotificationCenterSnapshot,
    type AdminNotificationSummaryResponse,
    type NotificationMessageResponse,
} from '@/lib/services/admin-module-services'
import { AlertTriangle, BellRing, MessageSquareMore, Search, Send, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const STATUS_OPTIONS = ['全部', 'queued', 'delivered', 'failed'] as const

const NOTIFICATION_WORKFLOW_STEPS = [
  { id: 'compose', title: '模板编排', detail: '选择模板、渠道、受众与触发来源。', tag: '编排', variant: 'primary' as const },
  { id: 'dispatch', title: '发送执行', detail: '按短信/推送、探视通知、定时提醒、公告广播进入发送队列。', tag: '发送', variant: 'primary' as const },
    { id: 'receipt', title: '回执回流', detail: '记录送达、失败与人工补发状态。', tag: '回执', variant: 'info' as const },
  { id: 'escalate', title: '失败升级', detail: '高风险通知走重试、人工补发或主管升级。', tag: '升级', variant: 'warning' as const },
    { id: 'audit', title: '广播归档', detail: '广播和探视通知需保留触达范围与状态结果。', tag: '归档', variant: 'success' as const },
] as const

function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
        queued: '待发送',
        delivered: '已送达',
        failed: '发送失败',
    }

    return labels[status] ?? status
}

function getStatusVariant(status: string): TagVariant {
    if (status === 'delivered') {
        return 'success'
    }

    if (status === 'failed') {
        return 'warning'
    }

    return 'info'
}

function getCategoryLabel(category: string) {
    const normalized = category.toLowerCase()
    if (normalized.includes('visit')) return '探视通知'
    if (normalized.includes('broadcast')) return '公告广播'
    if (normalized.includes('reminder')) return '定时提醒'
    return category
}

export default function NotificationsPage() {
  const [notificationSummary, setNotificationSummary] = useState<AdminNotificationSummaryResponse | null>(null)
    const [notificationQueue, setNotificationQueue] = useState<NotificationMessageResponse[]>([])
  const [notificationIntegrationNote, setNotificationIntegrationNote] = useState('正在同步通知服务摘要与发送队列...')
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
    const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>('全部')

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
        setNotificationIntegrationNote(
          snapshot.queue.length > 0
            ? '当前页面已接入真实通知摘要与发送队列；live 模式下全页只读展示真实通知数据。'
            : '当前页面已接入真实通知摘要，但当前发送队列为空；页面保持 live 空态，不再混用本地提醒闭环。',
        )
          setLoadError('')
      } catch (error) {
        if (disposed) {
          return
        }

        setNotificationSummary(null)
        setNotificationQueue([])
          setLoadError(error instanceof Error ? error.message : '通知服务不可用。')
          setNotificationIntegrationNote('通知服务当前不可用，页面仅保留真实链路错误状态与空态。')
      } finally {
          if (!disposed) {
              setLoading(false)
          }
      }
    }

    void loadNotificationSnapshot()

    return () => {
      disposed = true
    }
  }, [])

    const filteredQueue = useMemo(() => notificationQueue.filter(item => {
    const matchesSearch = !search
        || item.title.includes(search)
        || item.body.includes(search)
        || item.audience.includes(search)
        || item.audienceKey.includes(search)

      const matchesStatus = status === '全部' || item.status === status
    return matchesSearch && matchesStatus
  }), [notificationQueue, search, status])

    const stats = useMemo(() => ({
        total: notificationQueue.length,
      pending: notificationSummary?.queued ?? 0,
      escalations: notificationSummary?.failed ?? 0,
      resolved: notificationSummary?.delivered ?? 0,
  }), [notificationQueue.length, notificationSummary])

  const notificationModules = useMemo<Array<{
    id: string
    label: string
    metric: number
    sub: string
    note: string
    variant: TagVariant
  }>>(() => ([
      {
          id: 'sms-push',
          label: '短信 / 推送',
          metric: (notificationSummary?.queued ?? 0) + (notificationSummary?.failed ?? 0),
          sub: '账单、催缴、异常通知',
          note: '真实队列已接入，失败消息需要人工补发或升级。',
          variant: (notificationSummary?.failed ?? 0) > 0 ? 'warning' : 'info',
      },
      {
          id: 'visit-notice',
          label: '探视通知',
          metric: notificationSummary?.visitNotices ?? 0,
          sub: '预约确认 / 改期 / 签到提醒',
          note: '探视通知已从通知服务汇总中读取。',
          variant: 'success',
      },
      {
          id: 'scheduled-reminder',
          label: '定时提醒',
        metric: notificationSummary?.scheduledReminders ?? 0,
        sub: '护理计划 / 用药 / 回访',
        note: 'live 模式下改为只读展示真实提醒队列与回执状态。',
          variant: (notificationSummary?.queued ?? 0) > 0 ? 'primary' : 'success',
      },
      {
          id: 'broadcast',
          label: '公告广播',
          metric: notificationSummary?.broadcasts ?? 0,
          sub: '机构 / 楼层 / 班次广播',
          note: '广播统计已从真实通知服务摘要回流。',
          variant: 'info',
      },
  ]), [notificationSummary])

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
        '完整通道规则与失败边界已迁到帮助页。',
    ]
  }, [notificationModules])

  const liveActionQueue = useMemo(
    () => notificationQueue.filter(item => item.status !== 'delivered'),
    [notificationQueue],
  )

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
                  subtitle={loading
                      ? '正在同步短信/推送、探视通知、定时提醒、公告广播四类真实能力'
                      : loadError
                          ? '通知服务当前不可用，页面仅保留真实链路错误状态与空态'
                          : `承接短信/推送、探视通知、定时提醒、公告广播四类能力 · 当前真实队列 ${notificationQueue.length} 条消息`}
              />

        <InteractionRailLayout
          main={(
            <>
              <div className="kpi-grid" style={{ marginBottom: 16 }}>
                              <StatCard icon={<BellRing size={18} />} label="消息总数" value={stats.total} sub="真实通知队列" color="primary" />
                              <StatCard icon={<Send size={18} />} label="待发送" value={stats.pending} sub="待进入发送通道" color="info" />
                              <StatCard icon={<AlertTriangle size={18} />} label="发送失败" value={stats.escalations} sub="需补发或升级" color="warning" />
                              <StatCard icon={<Users size={18} />} label="已送达" value={stats.resolved} sub="已完成送达回执" color="success" />
              </div>

                          {loading ? (
                              <DataCard title="真实发送队列" subtitle="正在同步 Notification Service 摘要与消息列表。" badge={<Tag variant="warning">Syncing</Tag>}>
                  <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 13, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                                      当前正在读取真实通知队列，请稍候。
                  </div>
                </DataCard>
                          ) : null}

                          {loadError ? (
                              <DataCard title="通知服务当前不可用" subtitle={loadError} badge={<Tag variant="danger">Live Unavailable</Tag>}>
                                  <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 13, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                                      当前页面不会回退本地提醒或 demo 通知。请在服务恢复后重新查看真实发送队列。
                                  </div>
                              </DataCard>
                          ) : null}

                          {!loading && !loadError ? (
                              <DataCard title="真实发送队列" subtitle="来自 Notification Service 的当前消息队列，只做读取展示。" badge={<Tag variant={filteredQueue.length > 0 ? 'success' : 'info'}>{filteredQueue.length > 0 ? 'Live Queue' : 'Live Empty'}</Tag>}>
                                  <FilterBar>
                                      <FilterItem label="搜索">
                                          <div className="input-wrap" style={{ minWidth: 240 }}>
                                              <span className="input-icon"><Search size={14} /></span>
                                              <input
                                                  className="input"
                                                  placeholder="搜索消息标题、内容、接收对象或目标范围..."
                                                  value={search}
                                                  onChange={event => setSearch(event.target.value)}
                                                  style={{ paddingLeft: 34 }}
                                              />
                                          </div>
                                      </FilterItem>
                                      <FilterItem label="状态">
                                          <div className="select-wrap" style={{ minWidth: 160 }}>
                                              <select className="select" value={status} onChange={event => setStatus(event.target.value as (typeof STATUS_OPTIONS)[number])}>
                                                  {STATUS_OPTIONS.map(option => <option key={option} value={option}>{option === '全部' ? option : getStatusLabel(option)}</option>)}
                                              </select>
                                              <span className="select-arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg></span>
                                          </div>
                                      </FilterItem>
                                  </FilterBar>

                                  {filteredQueue.length > 0 ? (
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                                          {filteredQueue.map(item => (
                                              <div key={item.notificationId} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14, background: 'var(--color-panel)' }}>
                                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                                  <Tag variant={getStatusVariant(item.status)}>{getStatusLabel(item.status)}</Tag>
                              </div>
                              <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--color-muted)' }}>{item.audience} · {item.audienceKey}</div>
                              <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>{item.body}</div>
                              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-muted)' }}>{new Date(item.createdAtUtc).toLocaleString('zh-CN')} · {getCategoryLabel(item.category)}</div>
                          </div>
                      ))}
                                      </div>
                                  ) : (
                                      <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 13, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                                          当前筛选条件下没有真实通知消息。
                                      </div>
                                  )}
                </DataCard>
              ) : null}

                          {!loading && !loadError ? (
                              <DataCard title="待处置消息" subtitle="聚合待发送与失败消息，方便运营后续接入重试、人工补发与升级动作。">
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
                                          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{getCategoryLabel(item.category)} · {item.notificationId}</div>
                              </div>
                            </div>
                                  <Tag variant={getStatusVariant(item.status)}>{getStatusLabel(item.status)}</Tag>
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
                          ) : null}
            </>
          )}
          rail={(
            <>
              <DataCard
                title="API 对接状态"
                subtitle={notificationIntegrationNote}
                      badge={<Tag variant={loadError ? 'danger' : 'success'}>{loadError ? 'Live Unavailable' : 'Live API'}</Tag>}
              >
                <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                          {loadError
                              ? '当前范围：仅保留真实通知链路错误状态与帮助入口。未接通的提醒编辑、已读和升级处理不会再由本地 store 伪造。'
                              : '当前范围：通知摘要、发送队列、探视通知、广播与待处置消息。页面已切到 live-only，不再混用本地提醒 store。'}
                </div>
              </DataCard>

              <DataCard
                title="通道速览"
                subtitle="只保留对当前判断有用的通道计数，不再默认展开完整队列说明。"
                      badge={<Tag variant={loadError ? 'warning' : 'success'}>{loadError ? 'Channels Pending' : 'Live Channels'}</Tag>}
              >
                <div style={{ display: 'grid', gap: 10 }}>
                  {[
                    {
                      label: '探视通知',
                          value: liveVisitNotices.length,
                          hint: '真实队列中的探视类消息',
                    },
                    {
                      label: '公告广播',
                        value: liveBroadcasts.length,
                        hint: '真实队列中的广播类消息',
                    },
                    {
                      label: '失败升级',
                        value: notificationSummary?.failed ?? 0,
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
                      summary="页面只保留实时状态、真实队列、待处置消息和少量通道概览，不再默认展开 demo 通知或本地提醒闭环。"
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
