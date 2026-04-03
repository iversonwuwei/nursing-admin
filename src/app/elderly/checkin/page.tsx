'use client'

import { DataCard, FilterBar, FilterItem, PageHeader, StatCard, Tag } from '@/components/nh'
import { getAssessmentConfigForCase, getAssessmentConfigSnapshot, subscribeAssessmentConfigWorkflow } from '@/lib/mock/assessment-config-workflow'
import { getMasterDataSnapshot, subscribeMasterDataWorkflow } from '@/lib/mock/master-data-workflow'
import {
  CARE_LEVELS,
  COGNITIVE_LEVELS,
  confirmAssessmentDecision,
  EMPTY_ASSESSMENT_FORM,
  getAssessmentCasesSnapshot,
  getAssessmentSourceLabel,
  getAssessmentStatusLabel,
  getAssessmentStatusVariant,
  getLevelVariant,
  getReminderItems,
  getReminderStatusVariant,
  getStaffTaskItems,
  getTaskStatusVariant,
  activateAssessmentBenefits,
  submitAssessmentCase,
  subscribeAssessmentWorkflow,
  validateAssessmentForm,
  type AssessmentCase,
  type AssessmentFormState,
  type CareLevel,
} from '@/lib/mock/assessment-workflow'
import {
  Building2,
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
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState, useSyncExternalStore } from 'react'

type LoopStage = '待生成' | '待启动' | '执行中' | '已闭环'
type AssessmentCoordinationType = '首次认定' | '复评跟踪' | '抽检回访'
type AssessmentCoordinationStatus = '待机构接单' | '待复评回传' | '待抽检回传'

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
    subscribeAssessmentWorkflow,
    getAssessmentCasesSnapshot,
    getAssessmentCasesSnapshot,
  )
  const masterSnapshot = useSyncExternalStore(
    subscribeMasterDataWorkflow,
    getMasterDataSnapshot,
    getMasterDataSnapshot,
  )
  useSyncExternalStore(
    subscribeAssessmentConfigWorkflow,
    getAssessmentConfigSnapshot,
    getAssessmentConfigSnapshot,
  )
  const initialSelectedApplication = applications.find(application => application.id === selectedFromQuery) ?? applications[0]
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [form, setForm] = useState<AssessmentFormState>(EMPTY_ASSESSMENT_FORM)
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

  const assessmentPartners = useMemo(
    () => masterSnapshot.partners.filter(item => item.lifecycleStatus === '已启用' && item.institutionType === '评估机构'),
    [masterSnapshot.partners],
  )

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

  const coordinationItems = useMemo(() => applications.map((application, index) => {
    const assignedPartner = assessmentPartners.length > 0 ? assessmentPartners[index % assessmentPartners.length] : null
    const coordinationType: AssessmentCoordinationType = application.status === '待人工确认'
      ? '首次认定'
      : application.status === '计划已生成'
        ? '复评跟踪'
        : '抽检回访'
    const coordinationStatus: AssessmentCoordinationStatus = application.status === '待人工确认'
      ? '待机构接单'
      : application.status === '计划已生成'
        ? '待复评回传'
        : '待抽检回传'
    const nextAction = coordinationType === '首次认定'
      ? '评估机构完成首评并回传认定意见'
      : coordinationType === '复评跟踪'
        ? '结合当前服务计划发起复评结论回传'
        : '抽检机构补齐回访记录并返回经办复核'
    const slaLabel = coordinationType === '首次认定'
      ? '24小时内完成首评'
      : coordinationType === '复评跟踪'
        ? '48小时内完成复评回传'
        : '72小时内完成抽检回访'

    return {
      applicationId: application.id,
      assignedPartnerId: assignedPartner?.id,
      assignedPartnerName: assignedPartner?.name ?? '待配置评估机构',
      coordinationType,
      coordinationStatus,
      nextAction,
      slaLabel,
    }
  }), [applications, assessmentPartners])

  const coordinationStats = useMemo(() => ({
    activeInstitutions: assessmentPartners.length,
    initialReviews: coordinationItems.filter(item => item.coordinationType === '首次认定').length,
    reevaluations: coordinationItems.filter(item => item.coordinationType === '复评跟踪').length,
    spotChecks: coordinationItems.filter(item => item.coordinationType === '抽检回访').length,
  }), [assessmentPartners.length, coordinationItems])

  const selectedCoordination = useMemo(
    () => selectedApplication ? coordinationItems.find(item => item.applicationId === selectedApplication.id) ?? null : null,
    [coordinationItems, selectedApplication],
  )
  const selectedAssessmentConfig = selectedApplication ? getAssessmentConfigForCase(selectedApplication) : null

  function updateForm<K extends keyof AssessmentFormState>(key: K, value: AssessmentFormState[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  function syncReviewDraft(application: AssessmentCase) {
    setSelectedId(application.id)
    setReviewLevel(application.confirmedCareLevel ?? application.aiRecommendation.recommendedLevel)
    setReviewNote(application.reviewNote ?? '')
  }

  function handleCreateApplication() {
    const validationError = validateAssessmentForm(form)
    if (validationError) {
      setFormError(validationError)
      return
    }

    const application = submitAssessmentCase(form)
    syncReviewDraft(application)
    setShowForm(false)
    setForm(EMPTY_ASSESSMENT_FORM)
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

    const updated = confirmAssessmentDecision(selectedApplication.id, reviewLevel, reviewNote)
    if (updated) {
      syncReviewDraft(updated)
    }

    setFormError('')
  }

  function handleMarkAdmitted() {
    if (!selectedApplication) {
      return
    }

    const updated = activateAssessmentBenefits(selectedApplication.id)
    if (updated) {
      syncReviewDraft(updated)
    }
  }

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title="长护险评估认定"
        subtitle={`Demo 闭环：申请受理 -> AI 辅助评估 -> 人工认定 -> 认定结论与服务建议 · 共 ${applications.length} 条评估申请`}
        actions={(
          <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={() => setShowForm(current => !current)}>
            <Plus size={14} />
            新建评估申请
          </button>
        )}
      />

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard icon={<UserPlus size={18} />} label="评估申请" value={stats.submitted} sub="当前 demo 样本" color="primary" />
        <StatCard icon={<Bot size={18} />} label="待认定确认" value={stats.pendingConfirmation} sub="AI 已出建议" color="warning" />
        <StatCard icon={<ClipboardCheck size={18} />} label="认定结论已生成" value={stats.planGenerated} sub="已同步服务建议" color="info" />
        <StatCard icon={<HomeIcon size={18} />} label="认定已生效" value={stats.admitted} sub="已进入回访/抽检期" color="success" />
      </div>

      <DataCard
        title="本次 Demo 交付范围"
        subtitle="面向评估员与评估主管的认定首条闭环，当前由共享 assessment workflow 和评定配置 store 共同承载。"
        badge={<Tag variant="info">Shared Mock Store</Tag>}
      >

        {selectedFromNew && selectedApplication ? (
          <DataCard
            title="来自新增老人页"
            subtitle={`已将 ${selectedApplication.name} 带入评估认定闭环。下一步请确认认定等级并出具结论。`}
            badge={<Tag variant="success">New Entry Synced</Tag>}
          />
        ) : null}
        {selectedFromImport && selectedApplication ? (
          <DataCard
            title="来自资料导入页"
            subtitle={`已将 ${selectedApplication.name} 的资料识别草稿带入评估认定。下一步请复核字段并确认认定等级。`}
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
            { title: '1. 申请受理', description: '补充慢病、用药、过敏、ADL 和认知状态，作为评估输入。' },
            { title: '2. AI 辅助建议', description: '规则 mock service 输出照护等级建议、理由、置信度和模板编码。' },
            { title: '3. 人工认定', description: '经办或护理主管可保持 AI 建议，也可调整等级并写明原因。' },
              { title: '4. 认定输出', description: '确认后的认定结论会匹配规则集、模板和服务建议预览。' },
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

      <DataCard
        title="评估机构协同"
        subtitle="把评估机构分配、复评和抽检协同显式纳入认定工作台，避免认定链路只停留在院内视角。"
        badge={<Tag variant={assessmentPartners.length > 0 ? 'info' : 'warning'}>{assessmentPartners.length > 0 ? `${assessmentPartners.length} 家评估机构已启用` : '待配置评估机构'}</Tag>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 12 }}>
          <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
            <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>评估机构</div>
            <div style={{ marginTop: 6, fontSize: 20, fontWeight: 700, color: 'var(--color-text)' }}>{coordinationStats.activeInstitutions}</div>
          </div>
          <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
            <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>首次认定</div>
            <div style={{ marginTop: 6, fontSize: 20, fontWeight: 700, color: 'var(--color-primary)' }}>{coordinationStats.initialReviews}</div>
          </div>
          <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
            <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>复评跟踪</div>
            <div style={{ marginTop: 6, fontSize: 20, fontWeight: 700, color: 'var(--color-warning)' }}>{coordinationStats.reevaluations}</div>
          </div>
          <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
            <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>抽检回访</div>
            <div style={{ marginTop: 6, fontSize: 20, fontWeight: 700, color: 'var(--color-info)' }}>{coordinationStats.spotChecks}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {coordinationItems.map(item => {
            const isSelected = item.applicationId === selectedApplication?.id
            const application = applications.find(current => current.id === item.applicationId)
            if (!application) {
              return null
            }

            return (
              <div
                key={item.applicationId}
                style={{
                  border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 14,
                  background: isSelected ? 'rgba(13,148,136,0.05)' : 'var(--color-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{application.name} · {application.id}</div>
                    <div style={{ marginTop: 4, fontSize: 12.5, color: 'var(--color-muted)' }}>{item.assignedPartnerName} · {item.slaLabel}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Tag variant="info">{item.coordinationType}</Tag>
                    <Tag variant={item.coordinationType === '首次认定' ? 'warning' : item.coordinationType === '复评跟踪' ? 'primary' : 'info'}>{item.coordinationStatus}</Tag>
                  </div>
                </div>
                <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{item.nextAction}</div>
              </div>
            )
          })}
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
          title="评估申请与 AI 辅助认定输入"
          subtitle="提交后会写入共享 mock store，并立即生成 AI 照护等级建议。"
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
                  <select className="select" style={{ width: '100%' }} value={form.gender} onChange={event => updateForm('gender', event.target.value as AssessmentFormState['gender'])}>
                    <option value="">请选择</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                  <span className="select-arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg></span>
                </div>
              </div>
              <div>
                <label className="form-label">申请照护等级</label>
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
                <label className="form-label">服务地址/房间</label>
                <input className="input" value={form.room} onChange={event => updateForm('room', event.target.value)} placeholder="如 201-1" />
              </div>
              <div>
                <label className="form-label">ADL 评分</label>
                <input className="input" value={form.adlScore} onChange={event => updateForm('adlScore', event.target.value)} placeholder="0 - 100" type="number" />
              </div>
              <div className="form-grid-full">
                <label className="form-label">认知状态</label>
                <div className="select-wrap" style={{ width: '100%' }}>
                  <select className="select" style={{ width: '100%' }} value={form.cognitiveLevel} onChange={event => updateForm('cognitiveLevel', event.target.value as AssessmentFormState['cognitiveLevel'])}>
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
              <button className="btn btn-primary" onClick={handleCreateApplication}>提交并生成 AI 评估建议</button>
            </div>
          </div>
        </DataCard>
      )}

      <DataCard title="评估申请列表" subtitle="用于评估员和评估主管查看 AI 建议、确认认定结果和追踪复评状态。">
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
                  <th>认定结果</th>
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
                            <Tag variant={application.sourceType === 'document-import' ? 'primary' : 'neutral'}>{getAssessmentSourceLabel(application.sourceType)}</Tag>
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
                    <td><Tag variant={getAssessmentStatusVariant(application.status)}>{getAssessmentStatusLabel(application.status)}</Tag></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => syncReviewDraft(application)}>
                        {application.status === '待人工确认' ? '继续认定' : application.status === '计划已生成' ? '查看结论' : '查看生效'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
            当前筛选条件下暂无评估申请。
          </div>
        )}
      </DataCard>

      {selectedApplication ? (
        <div className="dashboard-grid-2">
          <DataCard
            title="AI 长护险评估建议"
            subtitle={`${selectedApplication.name} · ${selectedApplication.room} · 当前状态 ${getAssessmentStatusLabel(selectedApplication.status)}`}
            badge={<Tag variant={getAssessmentStatusVariant(selectedApplication.status)}>{getAssessmentStatusLabel(selectedApplication.status)}</Tag>}
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
                    <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 6 }}>AI 推荐照护等级</div>
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
                <div className="info-row"><span className="info-label">录入来源</span><span className="info-value">{selectedApplication.sourceLabel ?? getAssessmentSourceLabel(selectedApplication.sourceType)}</span></div>
                <div className="info-row"><span className="info-label">申请照护等级</span><span className="info-value">{selectedApplication.requestedLevel}</span></div>
                <div className="info-row"><span className="info-label">ADL / 认知状态</span><span className="info-value">{selectedApplication.adlScore} / {selectedApplication.cognitiveLevel}</span></div>
                <div className="info-row"><span className="info-label">慢病数量</span><span className="info-value">{selectedApplication.chronicConditions.split(/[，,、\n]/).filter(Boolean).length || 0} 项</span></div>
                <div className="info-row"><span className="info-label">模板编码</span><span className="info-value">{selectedApplication.aiRecommendation.planTemplateCode}</span></div>
              </div>

              {selectedAssessmentConfig ? (
                <div
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 14,
                    background: 'var(--color-bg)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>当前认定依据</div>
                    <Tag variant="info">{selectedAssessmentConfig.scene}</Tag>
                  </div>
                  <div className="info-row"><span className="info-label">生效规则集</span><span className="info-value">{selectedAssessmentConfig.ruleSet?.name ?? '待配置有效规则集'}</span></div>
                  <div className="info-row"><span className="info-label">匹配模板</span><span className="info-value">{selectedAssessmentConfig.template?.name ?? '待配置启用模板'}</span></div>
                  <div className="info-row"><span className="info-label">护理项数量</span><span className="info-value">{selectedAssessmentConfig.nursingItems.length} 项</span></div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedAssessmentConfig.nursingItems.map(item => <Tag key={item.id} variant="neutral">{item.name}</Tag>)}
                    {selectedAssessmentConfig.nursingItems.length === 0 ? <Tag variant="warning">请先在评定标准配置页补齐规则项</Tag> : null}
                  </div>
                  {selectedAssessmentConfig.template?.followupAction ? (
                    <div style={{ marginTop: 10, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                      后续动作：{selectedAssessmentConfig.template.followupAction}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {selectedCoordination ? (
                <div
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 14,
                    background: 'var(--color-bg)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                      <Building2 size={14} />
                      评估机构协同
                    </div>
                    <Tag variant="info">{selectedCoordination.coordinationType}</Tag>
                  </div>
                  <div className="info-row"><span className="info-label">指派机构</span><span className="info-value">{selectedCoordination.assignedPartnerName}</span></div>
                  <div className="info-row"><span className="info-label">协同状态</span><span className="info-value">{selectedCoordination.coordinationStatus}</span></div>
                  <div className="info-row"><span className="info-label">处理时限</span><span className="info-value">{selectedCoordination.slaLabel}</span></div>
                  <div className="info-row"><span className="info-label">下一动作</span><span className="info-value">{selectedCoordination.nextAction}</span></div>
                  {selectedCoordination.assignedPartnerId ? (
                    <div style={{ marginTop: 10 }}>
                      <Link href={`/organizations/partners?selected=${selectedCoordination.assignedPartnerId}`} className="btn btn-secondary btn-sm">查看评估机构</Link>
                    </div>
                  ) : null}
                </div>
              ) : null}

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
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 10 }}>人工认定</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">最终认定等级</label>
                    <div className="select-wrap" style={{ width: '100%' }}>
                      <select className="select" style={{ width: '100%' }} value={reviewLevel} onChange={event => setReviewLevel(event.target.value as CareLevel)}>
                        {CARE_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                      </select>
                      <span className="select-arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg></span>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">人工认定说明</label>
                    <textarea
                      className="input"
                      rows={3}
                      style={{ width: '100%', height: 'auto', padding: '10px 12px', resize: 'vertical' }}
                      placeholder="如人工调整等级，请说明原因；保持 AI 建议时可留空。"
                      value={reviewNote}
                      onChange={event => setReviewNote(event.target.value)}
                    />
                  </div>

                  {selectedApplication.confirmedCareLevel ? (
                    <div style={{ fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.7 }}>
                      已由 {selectedApplication.confirmedBy ?? '评估主管'} 于 {selectedApplication.confirmedAt ?? '待记录'} 完成人工认定，最终等级为 {selectedApplication.confirmedCareLevel}。
                    </div>
                  ) : null}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button className="btn btn-primary" onClick={handleConfirmPlan} disabled={selectedApplication.status === '已入住'}>
                      确认认定并生成结论
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </DataCard>

          <DataCard
            title="认定结论与服务建议预览"
            subtitle="当前为共享 mock 预览，认定后会同步生成服务建议、任务和提醒。"
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
                    <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 6 }}>随访策略</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>到点提醒 + 超时升级</div>
                  </div>
                </div>
                <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                  {selectedApplication.carePlan
                    ? `已生成 ${selectedApplication.carePlan.length} 条服务建议任务，并同步写入任务中心与提醒中心页。`
                    : '当前尚未确认认定等级，服务建议、提醒与回访计划会在人工认定后生成。'}
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
                    服务建议、任务和到点提醒将在评估员或评估主管确认认定后生成。当前页仅展示共享 mock 预览，不写入真实后端。
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                  当前 mock 通知对象：评估员、评估主管、复评协同机构联系人。
                </div>
                {selectedApplication.status === '计划已生成' ? (
                  <button className="btn btn-secondary" onClick={handleMarkAdmitted}>
                    标记认定生效
                  </button>
                ) : selectedApplication.status === '已入住' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-success)', fontSize: 13, fontWeight: 600 }}>
                    <CheckCircle2 size={14} />
                    已进入认定生效期
                  </div>
                ) : null}
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 10 }}>结构化评定输入摘要</div>
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
                  <Tag variant="info">Assessment Feedback Loop</Tag>
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
                      认定页现在会回流服务执行页和提醒中心的处理结果，经办或护理主管无需切页即可确认首轮执行闭环。
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
                    当前尚无可回流的执行回执。请先确认认定结果，并在服务执行页或提醒中心完成执行/处理动作。
                  </div>
                )}
              </div>
            </div>
          </DataCard>
        </div>
      ) : null}

      <DataCard title="集成与回滚说明" subtitle="当前只影响评估认定 Demo 页与共享 mock store，不影响其他真实业务模块。">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div style={{ padding: 14, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>受影响用户</div>
            <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.6 }}>管理端经办人员、护理主管、服务执行查看人员、提醒中心查看人员。</div>
          </div>
          <div style={{ padding: 14, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>验证门禁</div>
            <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.6 }}>本次以 TypeScript / ESLint 静态校验为主，目标是确认评估认定与跨页同步逻辑无错误。</div>
          </div>
          <div style={{ padding: 14, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>回滚路径</div>
            <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.6 }}>若需要回退，只需恢复认定页、服务执行页和提醒中心页对共享 mock store 的当前接入方式。</div>
          </div>
        </div>
      </DataCard>
    </div>
  )
}
