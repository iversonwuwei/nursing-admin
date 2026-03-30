'use client'

import { DataCard, FilterBar, FilterItem, PageHeader, StatCard, Tag } from '@/components/nh'
import {
    getAdmissionApplicationsSnapshot,
    getReminderItems,
    getReminderStatusVariant,
    markReminderAsRead,
    resolveReminder,
    saveReminderAuditNote,
    subscribeAdmissionWorkflow,
} from '@/lib/mock/admission-workflow'
import { AlertTriangle, BellRing, CheckCircle2, Eye, MessageSquareMore, Search, Send, Users } from 'lucide-react'
import { useMemo, useState, useSyncExternalStore } from 'react'

const STATUS_OPTIONS = ['全部', '待发送', '已生成', '已读', '需升级', '已处理'] as const

export default function NotificationsPage() {
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

  const filteredReminders = useMemo(() => reminderItems.filter(reminder => {
    const matchesSearch = !search
      || reminder.title.includes(search)
      || reminder.recipient.includes(search)
      || reminder.elderlyName.includes(search)
      || reminder.room.includes(search)

    const matchesStatus = status === '全部' || reminder.status === status
    return matchesSearch && matchesStatus
  }), [reminderItems, search, status])

  const stats = useMemo(() => ({
    total: reminderItems.length,
    pending: reminderItems.filter(reminder => reminder.status === '待发送').length,
    escalations: reminderItems.filter(reminder => reminder.status === '需升级').length,
    resolved: reminderItems.filter(reminder => reminder.status === '已处理').length,
  }), [reminderItems])

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
    <div className="page-root animate-fade-up">
      <PageHeader
        title="提醒中心"
        subtitle={`承接入住护理计划的消息与班次提醒 · 当前 ${reminderItems.length} 条提醒，覆盖 ${applications.length} 条入住记录`}
      />

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard icon={<BellRing size={18} />} label="提醒总数" value={stats.total} sub="由护理计划自动生成" color="primary" />
        <StatCard icon={<Send size={18} />} label="待发送" value={stats.pending} sub="已入住后的持续提醒" color="info" />
        <StatCard icon={<AlertTriangle size={18} />} label="需升级" value={stats.escalations} sub="包含超时升级策略" color="warning" />
        <StatCard icon={<Users size={18} />} label="已处理" value={stats.resolved} sub="已完成升级或处置" color="success" />
      </div>

      <DataCard
        title="提醒策略说明"
        subtitle="本页承担顶部导航通知入口的 demo 能力，直接消费共享 workflow store 中的计划结果。"
        badge={<Tag variant="info">Reminder Feed</Tag>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div style={{ padding: 14, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>通知通道</div>
            <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>当前统一展示为站内消息 / 班次提醒，后续可映射到短信、企业微信或护士站大屏。</div>
          </div>
          <div style={{ padding: 14, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>升级规则</div>
            <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>包含“超时升级”的任务会在本页标记为需升级，便于后续接入值班告警。</div>
          </div>
          <div style={{ padding: 14, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>回滚方式</div>
            <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>如需回退，只需移除本页对共享 store 的订阅，不涉及真实消息系统。</div>
          </div>
        </div>
      </DataCard>

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
    </div>
  )
}