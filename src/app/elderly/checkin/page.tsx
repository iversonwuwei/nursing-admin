'use client'

import { DataCard, FilterBar, FilterItem, PageHeader, StatCard, Tag } from '@/components/nh'
import {
  addAdmissionApplication,
  CARE_LEVELS,
  COGNITIVE_LEVELS,
  confirmAdmissionPlan,
  EMPTY_FORM,
  getAdmissionApplicationsSnapshot,
  getAdmissionSourceLabel,
  getLevelVariant,
  getReminderItems,
  getReminderStatusVariant,
  getStaffTaskItems,
  getStatusVariant,
  getTaskStatusVariant,
  markAdmissionAsAdmitted,
  subscribeAdmissionWorkflow,
  validateAdmissionForm,
  type AdmissionApplication,
  type AdmissionFormState,
  type CareLevel,
} from '@/lib/mock/admission-workflow'
import {
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Home as HomeIcon,
  Plus,
  Search,
  Shield,
  UserPlus,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState, useSyncExternalStore } from 'react'

type LoopStage = '待生成' | '待启动' | '执行中' | '已闭环'

function getLoopStageVariant(stage: LoopStage) {
  if (stage === '已闭环') return 'success'
  if (stage === '执行中') return 'primary'
  if (stage === '待启动') return 'warning'
  return 'neutral'
}

function parseDateValue(value?: string) {
  if (!value) {
    return null
  }

  const direct = new Date(value)
  if (!Number.isNaN(direct.getTime())) {
    return direct
  }

  const shortPattern = /^(\d{2})\/(\d{2})\s(\d{2}):(\d{2})$/
  const matched = value.match(shortPattern)
  if (!matched) {
    return null
  }

  const [, month, day, hour, minute] = matched
  const now = new Date()
  return new Date(now.getFullYear(), Number(month) - 1, Number(day), Number(hour), Number(minute))
}

function formatElapsedLabel(isoOrDate?: string | null) {
  const target = parseDateValue(isoOrDate ?? undefined)
  if (!target) {
    return '暂无'
  }

  const diffMs = Math.max(0, Date.now() - target.getTime())
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  const remainHours = hours % 24

  if (days > 0) {
    return `${days}天${remainHours}小时`
  }

  const minutes = Math.max(1, Math.floor(diffMs / (1000 * 60)))
  if (hours > 0) {
    return `${hours}小时`
  }

  return `${minutes}分钟`
}

function formatRecentTimeLabel(isoOrDate?: string | null) {
  const target = parseDateValue(isoOrDate ?? undefined)
  if (!target) {
    return '暂无'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(target)
}

function isBlockedOverdue(stage: LoopStage, isoOrDate?: string | null) {
  if (stage === '已闭环' || stage === '待生成') {
    return false
  }

  const target = parseDateValue(isoOrDate ?? undefined)
  if (!target) {
    return false
  }

  return Date.now() - target.getTime() >= 24 * 60 * 60 * 1000
}

export default function CheckinPage() {
  const searchParams = useSearchParams()
  const selectedFromQuery = searchParams.get('selected')
  const selectedFromNew = searchParams.get('entry') === 'elderly-new'
  const selectedFromImport = searchParams.get('entry') === 'elderly-import'
  const applications = useSyncExternalStore(
    subscribeAdmissionWorkflow,
    getAdmissionApplicationsSnapshot,
    getAdmissionApplicationsSnapshot,
  )
  const initialSelectedApplication = applications.find(application => application.id === selectedFromQuery) ?? applications[0]
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [form, setForm] = useState<AdmissionFormState>(EMPTY_FORM)
  const [selectedId, setSelectedId] = useState(initialSelectedApplication?.id ?? '')
  const [formError, setFormError] = useState('')
  const [reviewLevel, setReviewLevel] = useState<CareLevel>(
    initialSelectedApplication?.confirmedCareLevel ?? initialSelectedApplication?.aiRecommendation.recommendedLevel ?? '二级护理',
  )
  const [reviewNote, setReviewNote] = useState(initialSelectedApplication?.reviewNote ?? '')

  const selectedApplication = useMemo(
    () => applications.find(application => application.id === selectedId)
      ?? applications.find(application => application.id === selectedFromQuery)
      ?? applications[0],
    [applications, selectedFromQuery, selectedId],
  )

  const stats = useMemo(() => ({
    submitted: applications.length,
    pendingConfirmation: applications.filter(application => application.status === '待人工确认').length,
    planGenerated: applications.filter(application => application.status === '计划已生成').length,
    admitted: applications.filter(application => application.status === '已入住').length,
  }), [applications])

  const allTaskItems = useMemo(() => getStaffTaskItems(applications), [applications])
  const allReminderItems = useMemo(() => getReminderItems(applications), [applications])

  const applicationProgressMap = useMemo(() => Object.fromEntries(applications.map(application => {
    const taskItems = allTaskItems.filter(task => task.sourceId === application.id)
    const reminderItems = allReminderItems.filter(reminder => reminder.sourceId === application.id)
    const completedTasks = taskItems.filter(task => task.status === '已完成').length
    const handledReminders = reminderItems.filter(reminder => reminder.status === '已处理').length
    const totalUnits = taskItems.length + reminderItems.length
    const completedUnits = completedTasks + handledReminders
    const percent = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0
    const activeTasks = taskItems.filter(task => task.status === '执行中').length
    const readReminders = reminderItems.filter(reminder => reminder.status === '已读').length
    const stage: LoopStage = totalUnits === 0
      ? '待生成'
      : percent === 100
        ? '已闭环'
        : activeTasks > 0 || readReminders > 0 || completedUnits > 0
          ? '执行中'
          : '待启动'
    const activityCandidates = [
      application.confirmedAt,
      application.createdAt,
      ...taskItems.map(task => task.handledAtIso ?? task.handledAt),
      ...reminderItems.map(reminder => reminder.handledAtIso ?? reminder.handledAt),
    ]
    const latestActivityDate = activityCandidates
      .map(candidate => parseDateValue(candidate))
      .filter((candidate): candidate is Date => Boolean(candidate))
      .sort((left, right) => right.getTime() - left.getTime())[0] ?? null
    const latestActivityIso = latestActivityDate?.toISOString() ?? null

    return [application.id, {
      taskItems,
      reminderItems,
      completedTasks,
      handledReminders,
      percent,
      stage,
      latestActivityIso,
      latestActivityLabel: formatRecentTimeLabel(latestActivityIso ?? application.createdAt),
      blockedDurationLabel: stage === '已闭环' ? '0分钟' : formatElapsedLabel(latestActivityIso ?? application.createdAt),
      blockedOverdue: isBlockedOverdue(stage, latestActivityIso ?? application.createdAt),
    }]
  })), [allReminderItems, allTaskItems, applications])

  const filteredApplications = useMemo(
    () => applications
      .filter(application => (
        application.name.includes(search) || application.id.includes(search) || application.room.includes(search)
      ))
      .filter(application => (!overdueOnly || Boolean(applicationProgressMap[application.id]?.blockedOverdue)))
      .sort((left, right) => {
        const leftTime = parseDateValue(applicationProgressMap[left.id]?.latestActivityIso ?? left.createdAt)?.getTime() ?? 0
        const rightTime = parseDateValue(applicationProgressMap[right.id]?.latestActivityIso ?? right.createdAt)?.getTime() ?? 0
        return rightTime - leftTime
      }),
    [applicationProgressMap, applications, overdueOnly, search],
  )

  const selectedTaskItems = useMemo(
    () => selectedApplication ? applicationProgressMap[selectedApplication.id]?.taskItems ?? [] : [],
    [applicationProgressMap, selectedApplication],
  )

  const selectedReminderItems = useMemo(
    () => selectedApplication ? applicationProgressMap[selectedApplication.id]?.reminderItems ?? [] : [],
    [applicationProgressMap, selectedApplication],
  )

  const executionReceipt = useMemo(() => ({
    totalTasks: selectedTaskItems.length,
    completedTasks: selectedTaskItems.filter(task => task.status === '已完成').length,
    activeTasks: selectedTaskItems.filter(task => task.status === '执行中').length,
    handledReminders: selectedReminderItems.filter(reminder => reminder.status === '已处理').length,
    readReminders: selectedReminderItems.filter(reminder => reminder.status === '已读').length,
  }), [selectedReminderItems, selectedTaskItems])

  const overdueCount = useMemo(
    () => applications.filter(application => Boolean(applicationProgressMap[application.id]?.blockedOverdue)).length,
    [applicationProgressMap, applications],
  )

  function updateForm<K extends keyof AdmissionFormState>(key: K, value: AdmissionFormState[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  function syncReviewDraft(application: AdmissionApplication) {
    setSelectedId(application.id)
    setReviewLevel(application.confirmedCareLevel ?? application.aiRecommendation.recommendedLevel)
    setReviewNote(application.reviewNote ?? '')
  }

  function handleCreateApplication() {
    const validationError = validateAdmissionForm(form)
    if (validationError) {
      setFormError(validationError)
      return
    }

    const application = addAdmissionApplication(form)
    syncReviewDraft(application)
    setShowForm(false)
    setForm(EMPTY_FORM)
    setFormError('')
  }

  function handleConfirmPlan() {
    if (!selectedApplication) {
      return
    }

    if (reviewLevel !== selectedApplication.aiRecommendation.recommendedLevel && !reviewNote.trim()) {
      setFormError('人工调整护理级别时，请填写调整说明。')
      return
    }

    const updated = confirmAdmissionPlan(selectedApplication.id, reviewLevel, reviewNote)
    if (updated) {
      syncReviewDraft(updated)
    }

    setFormError('')
  }

  function handleMarkAdmitted() {
    if (!selectedApplication) {
      return
    }

    const updated = markAdmissionAsAdmitted(selectedApplication.id)
    if (updated) {
      syncReviewDraft(updated)
    }
  }

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title="办理入住"
        subtitle={`Demo 闭环：录入 -> AI 分级建议 -> 人工确认 -> 护理计划与提醒 · 共 ${applications.length} 条入住记录`}
        actions={(
          <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={() => setShowForm(current => !current)}>
            <Plus size={14} />
            新建入住
          </button>
        )}
      />

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard icon={<UserPlus size={18} />} label="入住记录" value={stats.submitted} sub="当前 demo 样本" color="primary" />
        <StatCard icon={<Bot size={18} />} label="待人工确认" value={stats.pendingConfirmation} sub="AI 已出建议" color="warning" />
        <StatCard icon={<ClipboardCheck size={18} />} label="计划已生成" value={stats.planGenerated} sub="已同步任务提醒" color="info" />
        <StatCard icon={<HomeIcon size={18} />} label="已入住" value={stats.admitted} sub="已进入在住管理" color="success" />
      </div>

      <DataCard
        title="本次 Demo 交付范围"
        subtitle="面向护理主管的入住首条闭环，当前数据由共享 mock workflow service 承载。"
        badge={<Tag variant="info">Shared Mock Store</Tag>}
      >

        {selectedFromNew && selectedApplication ? (
          <DataCard
            title="来自新增老人页"
            subtitle={`已将 ${selectedApplication.name} 带入入住审核闭环。下一步请确认护理等级并生成计划。`}
            badge={<Tag variant="success">New Entry Synced</Tag>}
          />
        ) : null}
        {selectedFromImport && selectedApplication ? (
          <DataCard
            title="来自资料导入页"
            subtitle={`已将 ${selectedApplication.name} 的资料识别草稿带入入住审核。下一步请复核字段并确认护理等级。`}
            badge={<Tag variant="primary">Import Synced</Tag>}
          />
        ) : null}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          {[
            { title: '1. 入住录入', description: '补充慢病、用药、过敏、ADL 和认知状态，作为 AI 输入。' },
            { title: '2. AI 建议', description: '规则 mock service 统一输出护理级别、理由、置信度和模板编码。' },
            { title: '3. 人工确认', description: '护理主管可保持 AI 建议，也可调整级别并写明原因。' },
            { title: '4. 跨页同步', description: '确认后的计划会同步到员工任务页与提醒中心页。' },
          ].map(item => (
            <div
              key={item.title}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 14,
                background: 'var(--color-card)',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
              <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)', marginTop: 6 }}>{item.description}</div>
            </div>
          ))}
        </div>
      </DataCard>

      <FilterBar>
        <FilterItem label="搜索">
          <div className="input-wrap" style={{ minWidth: 240 }}>
            <span className="input-icon"><Search size={14} /></span>
            <input
              className="input"
              placeholder="搜索姓名、编号或房间..."
              value={search}
              onChange={event => setSearch(event.target.value)}
              style={{ paddingLeft: 34 }}
            />
          </div>
        </FilterItem>
        <FilterItem label="阻塞筛选">
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text)', cursor: 'pointer' }}>
            <input type="checkbox" checked={overdueOnly} onChange={event => setOverdueOnly(event.target.checked)} />
            仅看超时关注
            <Tag variant={overdueCount > 0 ? 'danger' : 'neutral'}>{overdueCount}</Tag>
          </label>
        </FilterItem>
      </FilterBar>

      {showForm && (
        <DataCard
          title="入住登记与 AI 评估输入"
          subtitle="提交后会写入共享 mock store，并立即生成 AI 护理分级建议。"
          badge={<Tag variant="primary">AI Ready</Tag>}
        >
          <div className="form-section">
            <div className="form-grid">
              <div>
                <label className="form-label">姓名</label>
                <input className="input" value={form.name} onChange={event => updateForm('name', event.target.value)} placeholder="请输入姓名" />
              </div>
              <div>
                <label className="form-label">年龄</label>
                <input className="input" value={form.age} onChange={event => updateForm('age', event.target.value)} placeholder="请输入年龄" type="number" />
              </div>
              <div>
                <label className="form-label">性别</label>
                <div className="select-wrap" style={{ width: '100%' }}>
                  <select className="select" style={{ width: '100%' }} value={form.gender} onChange={event => updateForm('gender', event.target.value as AdmissionFormState['gender'])}>
                    <option value="">请选择</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                  <span className="select-arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg></span>
                </div>
              </div>
              <div>
                <label className="form-label">申请护理等级</label>
                <div className="select-wrap" style={{ width: '100%' }}>
                  <select className="select" style={{ width: '100%' }} value={form.requestedLevel} onChange={event => updateForm('requestedLevel', event.target.value as CareLevel)}>
                    {CARE_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                  </select>
                  <span className="select-arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg></span>
                </div>
              </div>
              <div>
                <label className="form-label">联系电话</label>
                <input className="input" value={form.phone} onChange={event => updateForm('phone', event.target.value)} placeholder="手机号码" />
              </div>
              <div>
                <label className="form-label">紧急联系人</label>
                <input className="input" value={form.emergency} onChange={event => updateForm('emergency', event.target.value)} placeholder="姓名 + 电话" />
              </div>
              <div>
                <label className="form-label">入住房间</label>
                <input className="input" value={form.room} onChange={event => updateForm('room', event.target.value)} placeholder="如 201-1" />
              </div>
              <div>
                <label className="form-label">ADL 评分</label>
                <input className="input" value={form.adlScore} onChange={event => updateForm('adlScore', event.target.value)} placeholder="0 - 100" type="number" />
              </div>
              <div className="form-grid-full">
                <label className="form-label">认知状态</label>
                <div className="select-wrap" style={{ width: '100%' }}>
                  <select className="select" style={{ width: '100%' }} value={form.cognitiveLevel} onChange={event => updateForm('cognitiveLevel', event.target.value as AdmissionFormState['cognitiveLevel'])}>
                    <option value="">请选择</option>
                    {COGNITIVE_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                  </select>
                  <span className="select-arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg></span>
                </div>
              </div>
              <div className="form-grid-full">
                <label className="form-label">慢病与既往病史</label>
                <textarea className="input" rows={3} style={{ width: '100%', height: 'auto', padding: '10px 12px', resize: 'vertical' }} value={form.chronicConditions} onChange={event => updateForm('chronicConditions', event.target.value)} placeholder="例如：高血压、糖尿病、冠心病" />
              </div>
              <div>
                <label className="form-label">长期用药</label>
                <textarea className="input" rows={3} style={{ width: '100%', height: 'auto', padding: '10px 12px', resize: 'vertical' }} value={form.medicationSummary} onChange={event => updateForm('medicationSummary', event.target.value)} placeholder="例如：缬沙坦、二甲双胍" />
              </div>
              <div>
                <label className="form-label">过敏史</label>
                <textarea className="input" rows={3} style={{ width: '100%', height: 'auto', padding: '10px 12px', resize: 'vertical' }} value={form.allergySummary} onChange={event => updateForm('allergySummary', event.target.value)} placeholder="例如：青霉素过敏 / 无" />
              </div>
              <div className="form-grid-full">
                <label className="form-label">风险备注</label>
                <textarea className="input" rows={3} style={{ width: '100%', height: 'auto', padding: '10px 12px', resize: 'vertical' }} value={form.riskNotes} onChange={event => updateForm('riskNotes', event.target.value)} placeholder="例如：近半年有跌倒史、夜间失眠、吞咽困难、压疮风险" />
              </div>
            </div>

            {formError ? (
              <div className="form-error">
                <Shield size={14} color="var(--color-danger)" />
                <span className="form-error-text">{formError}</span>
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => { setShowForm(false); setFormError('') }}>取消</button>
              <button className="btn btn-primary" onClick={handleCreateApplication}>提交并生成 AI 建议</button>
            </div>
          </div>
        </DataCard>
      )}

      <DataCard title="入住申请列表" subtitle="用于护理主管查看 AI 建议、确认等级和追踪计划状态。">
        {filteredApplications.length > 0 ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>#</th>
                  <th>姓名</th>
                  <th>房间</th>
                  <th>ADL</th>
                  <th>AI 建议</th>
                  <th>人工确认</th>
                  <th>闭环进度</th>
                  <th>申请日期</th>
                  <th>状态</th>
                  <th style={{ textAlign: 'right' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((application, index) => (
                  <tr
                    key={application.id}
                    className="table-hover-row"
                    style={{
                      background: application.id === selectedId
                        ? 'rgba(13,148,136,0.06)'
                        : applicationProgressMap[application.id]?.blockedOverdue
                          ? 'rgba(239,68,68,0.05)'
                          : undefined,
                    }}
                  >
                    <td><span className="table-row-num">{index + 1}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-sm">{application.name.slice(0, 1)}</div>
                        <div>
                          <div className="font-semibold" style={{ fontSize: 14 }}>{application.name}</div>
                          <div className="text-xs" style={{ color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span>{application.id} · {application.gender} · {application.age}岁</span>
                            <Tag variant={application.sourceType === 'document-import' ? 'primary' : 'neutral'}>{getAdmissionSourceLabel(application.sourceType)}</Tag>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontSize: 14, fontFamily: 'monospace' }}>{application.room}</span></td>
                    <td><span style={{ fontSize: 14 }}>{application.adlScore}</span></td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Tag variant={getLevelVariant(application.aiRecommendation.recommendedLevel)}>{application.aiRecommendation.recommendedLevel}</Tag>
                        <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>置信度 {application.aiRecommendation.confidence}%</span>
                      </div>
                    </td>
                    <td>
                      {application.confirmedCareLevel ? (
                        <Tag variant={getLevelVariant(application.confirmedCareLevel)}>{application.confirmedCareLevel}</Tag>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>待确认</span>
                      )}
                    </td>
                    <td>
                      {(() => {
                        const progress = applicationProgressMap[application.id]
                        return progress && (progress.taskItems.length > 0 || progress.reminderItems.length > 0) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <Tag variant={getLoopStageVariant(progress.stage)}>{progress.stage}</Tag>
                              {progress.blockedOverdue ? <Tag variant="danger">超时关注</Tag> : null}
                              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>{progress.percent}%</span>
                            </div>
                            <div style={{ height: 6, borderRadius: 999, background: 'rgba(15,23,42,0.08)', overflow: 'hidden' }}>
                              <div style={{ width: `${progress.percent}%`, height: '100%', background: progress.blockedOverdue ? 'var(--color-danger)' : 'var(--color-primary)' }} />
                            </div>
                            <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>
                              任务 {progress.completedTasks}/{progress.taskItems.length} · 提醒 {progress.handledReminders}/{progress.reminderItems.length}
                            </span>
                            <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>
                              最近更新 {progress.latestActivityLabel} · 阻塞 {progress.blockedDurationLabel}
                            </span>
                          </div>
                        ) : (
                          <Tag variant={getLoopStageVariant('待生成')}>待生成</Tag>
                        )
                      })()}
                    </td>
                    <td><span style={{ fontSize: 13, color: 'var(--color-muted)' }}>{application.createdAt}</span></td>
                    <td><Tag variant={getStatusVariant(application.status)}>{application.status}</Tag></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => syncReviewDraft(application)}>
                        {application.status === '待人工确认' ? '继续审核' : application.status === '计划已生成' ? '查看计划' : '查看档案'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
            当前筛选条件下暂无入住申请。
          </div>
        )}
      </DataCard>

      {selectedApplication ? (
        <div className="dashboard-grid-2">
          <DataCard
            title="AI 护理分级建议"
            subtitle={`${selectedApplication.name} · ${selectedApplication.room} · 当前状态 ${selectedApplication.status}`}
            badge={<Tag variant={getStatusVariant(selectedApplication.status)}>{selectedApplication.status}</Tag>}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  border: '1px solid rgba(13,148,136,0.18)',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(13,148,136,0.06)',
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 6 }}>AI 推荐等级</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Tag variant={getLevelVariant(selectedApplication.aiRecommendation.recommendedLevel)}>{selectedApplication.aiRecommendation.recommendedLevel}</Tag>
                      <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>评分 {selectedApplication.aiRecommendation.assessmentScore}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 6 }}>模型置信度</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-primary)' }}>{selectedApplication.aiRecommendation.confidence}%</div>
                  </div>
                </div>
                <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.7, color: 'var(--color-text)' }}>{selectedApplication.aiRecommendation.reasonSummary}</div>
                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedApplication.aiRecommendation.focusTags.map(tag => (
                    <Tag key={tag} variant="info">{tag}</Tag>
                  ))}
                </div>
              </div>

              <div>
                <div className="info-row"><span className="info-label">录入来源</span><span className="info-value">{selectedApplication.sourceLabel ?? getAdmissionSourceLabel(selectedApplication.sourceType)}</span></div>
                <div className="info-row"><span className="info-label">申请护理等级</span><span className="info-value">{selectedApplication.requestedLevel}</span></div>
                <div className="info-row"><span className="info-label">ADL / 认知状态</span><span className="info-value">{selectedApplication.adlScore} / {selectedApplication.cognitiveLevel}</span></div>
                <div className="info-row"><span className="info-label">慢病数量</span><span className="info-value">{selectedApplication.chronicConditions.split(/[，,、\n]/).filter(Boolean).length || 0} 项</span></div>
                <div className="info-row"><span className="info-label">模板编码</span><span className="info-value">{selectedApplication.aiRecommendation.planTemplateCode}</span></div>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 10 }}>AI 判断依据</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedApplication.aiRecommendation.reasons.map(reason => (
                    <div
                      key={reason}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-bg)',
                        fontSize: 12.5,
                        lineHeight: 1.6,
                        color: 'var(--color-text)',
                      }}
                    >
                      {reason}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 10 }}>人工确认</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">最终护理等级</label>
                    <div className="select-wrap" style={{ width: '100%' }}>
                      <select className="select" style={{ width: '100%' }} value={reviewLevel} onChange={event => setReviewLevel(event.target.value as CareLevel)}>
                        {CARE_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                      </select>
                      <span className="select-arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg></span>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">人工确认说明</label>
                    <textarea
                      className="input"
                      rows={3}
                      style={{ width: '100%', height: 'auto', padding: '10px 12px', resize: 'vertical' }}
                      placeholder="如人工调整级别，请说明原因；保持 AI 建议时可留空。"
                      value={reviewNote}
                      onChange={event => setReviewNote(event.target.value)}
                    />
                  </div>

                  {selectedApplication.confirmedCareLevel ? (
                    <div style={{ fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.7 }}>
                      已由 {selectedApplication.confirmedBy ?? '护理主管'} 于 {selectedApplication.confirmedAt ?? '待记录'} 确认，最终等级为 {selectedApplication.confirmedCareLevel}。
                    </div>
                  ) : null}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button className="btn btn-primary" onClick={handleConfirmPlan} disabled={selectedApplication.status === '已入住'}>
                      确认等级并生成计划
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </DataCard>

          <DataCard
            title="护理计划与提醒预览"
            subtitle="当前为共享 mock 预览，确认后会同步到员工任务页和提醒中心页。"
            badge={<Tag variant={selectedApplication.carePlan ? 'success' : 'neutral'}>{selectedApplication.carePlan ? '已生成' : '待生成'}</Tag>}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 16,
                  background: 'var(--color-bg)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 6 }}>最终护理等级</div>
                    <Tag variant={getLevelVariant(selectedApplication.confirmedCareLevel ?? reviewLevel)}>{selectedApplication.confirmedCareLevel ?? reviewLevel}</Tag>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 6 }}>提醒策略</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>到点提醒 + 超时升级</div>
                  </div>
                </div>
                <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                  {selectedApplication.carePlan
                    ? `已生成 ${selectedApplication.carePlan.length} 条护理任务，并同步写入员工任务页与提醒中心页。`
                    : '当前尚未确认护理等级，计划与提醒会在人工确认后生成。'}
                </div>
              </div>

              {selectedApplication.carePlan ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedApplication.carePlan.map(task => (
                    <div
                      key={task.id}
                      style={{
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: 14,
                        background: 'var(--color-card)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{task.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 4 }}>{task.owner} · {task.reminder}</div>
                        </div>
                        <Tag variant="primary">{task.time}</Tag>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    border: '1px dashed var(--color-border-strong)',
                    borderRadius: 'var(--radius-md)',
                    padding: 20,
                    textAlign: 'center',
                    fontSize: 12.5,
                    color: 'var(--color-muted)',
                    lineHeight: 1.7,
                  }}
                >
                    护理计划、任务和到点提醒将在护理主管确认后生成。当前页仅展示共享 mock 预览，不写入真实后端。
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                  当前 mock 通知对象：责任护士、当班护理员、夜班值守人员。
                </div>
                {selectedApplication.status === '计划已生成' ? (
                  <button className="btn btn-secondary" onClick={handleMarkAdmitted}>
                    标记已入住
                  </button>
                ) : selectedApplication.status === '已入住' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-success)', fontSize: 13, fontWeight: 600 }}>
                    <CheckCircle2 size={14} />
                    已进入在住管理
                  </div>
                ) : null}
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 10 }}>结构化输入摘要</div>
                {selectedApplication.sourceDocumentNames?.length ? (
                  <div className="info-row"><span className="info-label">导入资料</span><span className="info-value">{selectedApplication.sourceDocumentNames.join('、')}</span></div>
                ) : null}
                <div className="info-row"><span className="info-label">慢病与病史</span><span className="info-value">{selectedApplication.chronicConditions || '未填写'}</span></div>
                <div className="info-row"><span className="info-label">长期用药</span><span className="info-value">{selectedApplication.medicationSummary || '未填写'}</span></div>
                <div className="info-row"><span className="info-label">过敏史</span><span className="info-value">{selectedApplication.allergySummary || '无'}</span></div>
                <div className="info-row"><span className="info-label">风险备注</span><span className="info-value">{selectedApplication.riskNotes || '常规观察'}</span></div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>执行回执与提醒反馈</div>
                  <Tag variant="info">Admission Feedback Loop</Tag>
                </div>

                {selectedTaskItems.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
                      <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
                        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>任务总数</div>
                        <div style={{ marginTop: 6, fontSize: 20, fontWeight: 700, color: 'var(--color-text)' }}>{executionReceipt.totalTasks}</div>
                      </div>
                      <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
                        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>已完成</div>
                        <div style={{ marginTop: 6, fontSize: 20, fontWeight: 700, color: 'var(--color-success)' }}>{executionReceipt.completedTasks}</div>
                      </div>
                      <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
                        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>执行中</div>
                        <div style={{ marginTop: 6, fontSize: 20, fontWeight: 700, color: 'var(--color-primary)' }}>{executionReceipt.activeTasks}</div>
                      </div>
                      <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
                        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>提醒已处理</div>
                        <div style={{ marginTop: 6, fontSize: 20, fontWeight: 700, color: 'var(--color-success)' }}>{executionReceipt.handledReminders}</div>
                      </div>
                      <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
                        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>最近更新</div>
                        <div style={{ marginTop: 6, fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>{selectedApplication ? applicationProgressMap[selectedApplication.id]?.latestActivityLabel ?? '暂无' : '暂无'}</div>
                      </div>
                      <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
                        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>阻塞时长</div>
                        <div style={{ marginTop: 6, fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>{selectedApplication ? applicationProgressMap[selectedApplication.id]?.blockedDurationLabel ?? '暂无' : '暂无'}</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                      {selectedTaskItems.map(task => {
                        const reminder = selectedReminderItems.find(item => item.id === `reminder-${task.id}`)
                        return (
                          <div
                            key={task.id}
                            style={{
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--radius-md)',
                              padding: 14,
                              background: 'var(--color-card)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                              <div>
                                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{task.title}</div>
                                <div style={{ marginTop: 4, fontSize: 12, color: 'var(--color-muted)' }}>{task.owner} · {task.scheduledTime} · {task.room}</div>
                              </div>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                <Tag variant={getTaskStatusVariant(task.status)}>{task.status}</Tag>
                                {reminder ? <Tag variant={getReminderStatusVariant(reminder.status)}>{reminder.status}</Tag> : null}
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6, marginTop: 10 }}>
                              <div className="info-row"><span className="info-label">任务提醒</span><span className="info-value">{task.reminder}</span></div>
                              <div className="info-row"><span className="info-label">提醒接收人</span><span className="info-value">{reminder?.recipient ?? task.owner}</span></div>
                              <div className="info-row"><span className="info-label">提醒状态</span><span className="info-value">{reminder ? `${reminder.status} · ${reminder.policy}` : '尚未生成提醒回执'}</span></div>
                              <div className="info-row"><span className="info-label">任务回执</span><span className="info-value">{task.handledBy && task.handledAt ? `${task.handledBy} · ${task.handledAt}` : '尚未形成执行回执'}</span></div>
                              <div className="info-row"><span className="info-label">提醒回执</span><span className="info-value">{reminder?.handledBy && reminder?.handledAt ? `${reminder.handledBy} · ${reminder.handledAt}` : '尚未形成提醒回执'}</span></div>
                              <div className="info-row"><span className="info-label">操作说明</span><span className="info-value">{task.actionNote ?? reminder?.actionNote ?? '暂无说明'}</span></div>
                              <div className="info-row"><span className="info-label">异常原因</span><span className="info-value">{task.exceptionReason ?? reminder?.exceptionReason ?? (reminder?.status === '需升级' ? '触发超时升级策略，需要主管介入。' : '无异常升级记录')}</span></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--color-muted)' }}>
                      <Eye size={14} />
                      入住页现在会回流员工任务和提醒中心的处理结果，护理主管无需切页即可确认首轮执行闭环。
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      border: '1px dashed var(--color-border-strong)',
                      borderRadius: 'var(--radius-md)',
                      padding: 18,
                      textAlign: 'center',
                      fontSize: 12.5,
                      color: 'var(--color-muted)',
                      lineHeight: 1.7,
                    }}
                  >
                    当前尚无可回流的执行回执。请先确认护理计划，并在员工任务页或提醒中心完成执行/处理动作。
                  </div>
                )}
              </div>
            </div>
          </DataCard>
        </div>
      ) : null}

      <DataCard title="发布与回滚说明" subtitle="当前只影响 Demo 页与共享 mock store，不影响其他真实业务模块。">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div style={{ padding: 14, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>受影响用户</div>
            <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.6 }}>管理端护理主管、员工任务查看人员、提醒中心查看人员。</div>
          </div>
          <div style={{ padding: 14, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>验证门禁</div>
            <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.6 }}>本次以 TypeScript / ESLint 静态校验为主，目标是确认跨页同步逻辑无错误。</div>
          </div>
          <div style={{ padding: 14, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>回滚路径</div>
            <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.6 }}>若需要回退，只需恢复入住页、员工任务页和提醒中心页对共享 mock store 的接入。</div>
          </div>
        </div>
      </DataCard>
    </div>
  )
}
