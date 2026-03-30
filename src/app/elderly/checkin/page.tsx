'use client'

import { DataCard, FilterBar, FilterItem, PageHeader, StatCard, Tag } from '@/components/nh'
import {
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Home as HomeIcon,
  Plus,
  Search,
  Shield,
  UserPlus,
} from 'lucide-react'
import { useMemo, useState } from 'react'

const CARE_LEVELS = ['特级护理', '一级护理', '二级护理', '三级护理'] as const
const COGNITIVE_LEVELS = ['清晰', '轻度受损', '中度受损', '重度受损'] as const

type CareLevel = (typeof CARE_LEVELS)[number]
type CognitiveLevel = (typeof COGNITIVE_LEVELS)[number]
type AdmissionStatus = '待人工确认' | '计划已生成' | '已入住'

interface AdmissionFormState {
  name: string
  age: string
  gender: '' | '男' | '女'
  phone: string
  emergency: string
  room: string
  requestedLevel: CareLevel
  chronicConditions: string
  medicationSummary: string
  allergySummary: string
  adlScore: string
  cognitiveLevel: '' | CognitiveLevel
  riskNotes: string
}

interface CareTaskPreview {
  id: string
  time: string
  title: string
  owner: string
  reminder: string
}

interface AiRecommendation {
  recommendedLevel: CareLevel
  confidence: number
  assessmentScore: number
  reasonSummary: string
  reasons: string[]
  focusTags: string[]
  planTemplateCode: string
}

interface AdmissionApplication {
  id: string
  name: string
  age: number
  gender: '男' | '女'
  phone: string
  emergency: string
  room: string
  createdAt: string
  requestedLevel: CareLevel
  status: AdmissionStatus
  chronicConditions: string
  medicationSummary: string
  allergySummary: string
  adlScore: number
  cognitiveLevel: CognitiveLevel
  riskNotes: string
  aiRecommendation: AiRecommendation
  confirmedCareLevel?: CareLevel
  reviewNote?: string
  confirmedAt?: string
  confirmedBy?: string
  carePlan?: CareTaskPreview[]
}

const EMPTY_FORM: AdmissionFormState = {
  name: '',
  age: '',
  gender: '',
  phone: '',
  emergency: '',
  room: '',
  requestedLevel: '二级护理',
  chronicConditions: '',
  medicationSummary: '',
  allergySummary: '',
  adlScore: '',
  cognitiveLevel: '',
  riskNotes: '',
}

function splitList(value: string) {
  return value
    .split(/[，,、\n]/)
    .map(item => item.trim())
    .filter(Boolean)
}

function getLevelVariant(level: CareLevel) {
  if (level === '特级护理') return 'danger'
  if (level === '一级护理') return 'warning'
  if (level === '二级护理') return 'info'
  return 'success'
}

function getStatusVariant(status: AdmissionStatus) {
  if (status === '待人工确认') return 'warning'
  if (status === '计划已生成') return 'primary'
  return 'success'
}

function deriveCareLevel(score: number): CareLevel {
  if (score >= 7) return '特级护理'
  if (score >= 5) return '一级护理'
  if (score >= 3) return '二级护理'
  return '三级护理'
}

function buildCarePlan(level: CareLevel, focusTags: string[]): CareTaskPreview[] {
  const sharedFocus = focusTags.slice(0, 2).join(' / ') || '常规入住观察'

  if (level === '特级护理') {
    return [
      { id: 'task-1', time: '06:30', title: '晨间生命体征巡检', owner: '责任护士', reminder: '提前 15 分钟提醒' },
      { id: 'task-2', time: '10:00', title: `高频巡视与体位调整 · ${sharedFocus}`, owner: '护理员', reminder: '到点提醒 + 超时升级' },
      { id: 'task-3', time: '14:30', title: '吞咽/进食风险跟踪', owner: '康复师', reminder: '午后复核提醒' },
      { id: 'task-4', time: '20:30', title: '夜间风险巡视与离床预警确认', owner: '夜班护士', reminder: '夜班开始前提醒' },
    ]
  }

  if (level === '一级护理') {
    return [
      { id: 'task-1', time: '07:00', title: '晨间体征测量与用药核对', owner: '责任护士', reminder: '提前 10 分钟提醒' },
      { id: 'task-2', time: '11:30', title: `午间护理观察 · ${sharedFocus}`, owner: '护理员', reminder: '到点提醒' },
      { id: 'task-3', time: '16:00', title: '康复训练与步态观察', owner: '康复师', reminder: '康复时段提醒' },
      { id: 'task-4', time: '21:00', title: '夜间安睡巡视', owner: '夜班护理员', reminder: '夜巡前提醒' },
    ]
  }

  if (level === '二级护理') {
    return [
      { id: 'task-1', time: '08:00', title: '晨间巡房与血压复核', owner: '护理员', reminder: '班次开始提醒' },
      { id: 'task-2', time: '13:30', title: `午后活动陪同 · ${sharedFocus}`, owner: '护理员', reminder: '活动前提醒' },
      { id: 'task-3', time: '19:30', title: '晚间用药与睡前观察', owner: '责任护士', reminder: '睡前提醒' },
    ]
  }

  return [
    { id: 'task-1', time: '09:00', title: '常规巡房与自理能力观察', owner: '护理员', reminder: '班中提醒' },
    { id: 'task-2', time: '15:00', title: `活动参与记录 · ${sharedFocus}`, owner: '活动专员', reminder: '活动前提醒' },
    { id: 'task-3', time: '20:00', title: '晚间状态确认', owner: '责任护士', reminder: '晚间提醒' },
  ]
}

function generateAiRecommendation(input: {
  age: number
  chronicConditions: string
  adlScore: number
  cognitiveLevel: CognitiveLevel
  riskNotes: string
}): AiRecommendation {
  const chronicList = splitList(input.chronicConditions)
  const riskText = input.riskNotes
  const reasons: string[] = []
  const focusTags = new Set<string>()
  let score = 0

  if (input.age >= 85) {
    score += 1
    reasons.push('高龄入住，建议提高日常巡视与夜间观察频次。')
    focusTags.add('高龄巡视')
  }

  if (input.adlScore > 0 && input.adlScore <= 40) {
    score += 3
    reasons.push('ADL 评分偏低，提示日常生活依赖度较高。')
    focusTags.add('失能照护')
  } else if (input.adlScore <= 60) {
    score += 2
    reasons.push('ADL 中度受限，需要增加协助类护理动作。')
    focusTags.add('协助起居')
  } else if (input.adlScore <= 80) {
    score += 1
    reasons.push('ADL 轻度受限，建议保留日常活动与体征复核。')
    focusTags.add('活动观察')
  }

  if (input.cognitiveLevel === '重度受损') {
    score += 2
    reasons.push('认知状态较差，需要重点防走失、防误服和夜间巡查。')
    focusTags.add('认知照护')
  } else if (input.cognitiveLevel === '中度受损') {
    score += 1
    reasons.push('认知状态存在明显下降，建议增加提醒与陪护频次。')
    focusTags.add('提醒陪护')
  }

  if (chronicList.length >= 3) {
    score += 2
    reasons.push('慢病负担较重，需要更密集的体征监测与用药核对。')
    focusTags.add('慢病监测')
  } else if (chronicList.length >= 1) {
    score += 1
    reasons.push('存在基础慢病，建议将血压/血糖等复测纳入计划。')
    focusTags.add('基础慢病')
  }

  if (riskText.includes('跌倒')) {
    score += 1
    reasons.push('既往存在跌倒风险线索，需加入离床与步态观察任务。')
    focusTags.add('跌倒预防')
  }

  if (riskText.includes('吞咽')) {
    score += 1
    reasons.push('存在吞咽相关风险，餐前餐后应纳入专项观察。')
    focusTags.add('吞咽观察')
  }

  if (riskText.includes('压疮') || riskText.includes('失眠')) {
    score += 1
    reasons.push('风险备注提示长期观察项，需要形成定时提醒。')
    focusTags.add('重点提醒')
  }

  const recommendedLevel = deriveCareLevel(score)
  const confidence = Math.min(96, 68 + score * 4 + Math.min(chronicList.length, 3))
  const planTemplateCode =
    recommendedLevel === '特级护理'
      ? 'CARE-CRITICAL-24H'
      : recommendedLevel === '一级护理'
        ? 'CARE-HIGH-RISK'
        : recommendedLevel === '二级护理'
          ? 'CARE-STANDARD-PLUS'
          : 'CARE-ROUTINE'

  return {
    recommendedLevel,
    confidence,
    assessmentScore: score,
    reasonSummary: `系统基于 ADL、自理能力、认知状态、慢病负担和风险备注，建议先按${recommendedLevel}进入入住观察，并同步生成首周护理任务与提醒。`,
    reasons,
    focusTags: Array.from(focusTags),
    planTemplateCode,
  }
}

function createApplicationFromForm(form: AdmissionFormState): AdmissionApplication {
  const age = Number(form.age)
  const adlScore = Number(form.adlScore)
  const aiRecommendation = generateAiRecommendation({
    age,
    chronicConditions: form.chronicConditions,
    adlScore,
    cognitiveLevel: form.cognitiveLevel || '清晰',
    riskNotes: form.riskNotes,
  })

  return {
    id: `E${Date.now().toString().slice(-6)}`,
    name: form.name,
    age,
    gender: form.gender || '女',
    phone: form.phone,
    emergency: form.emergency,
    room: form.room,
    createdAt: new Date().toISOString().slice(0, 10),
    requestedLevel: form.requestedLevel,
    status: '待人工确认',
    chronicConditions: form.chronicConditions,
    medicationSummary: form.medicationSummary,
    allergySummary: form.allergySummary,
    adlScore,
    cognitiveLevel: form.cognitiveLevel || '清晰',
    riskNotes: form.riskNotes,
    aiRecommendation,
  }
}

function buildSeededApplication(input: {
  id: string
  name: string
  age: number
  gender: '男' | '女'
  phone: string
  emergency: string
  room: string
  createdAt: string
  requestedLevel: CareLevel
  chronicConditions: string
  medicationSummary: string
  allergySummary: string
  adlScore: number
  cognitiveLevel: CognitiveLevel
  riskNotes: string
  status: AdmissionStatus
  confirmedCareLevel?: CareLevel
  reviewNote?: string
  confirmedAt?: string
  confirmedBy?: string
}): AdmissionApplication {
  const aiRecommendation = generateAiRecommendation({
    age: input.age,
    chronicConditions: input.chronicConditions,
    adlScore: input.adlScore,
    cognitiveLevel: input.cognitiveLevel,
    riskNotes: input.riskNotes,
  })

  return {
    ...input,
    aiRecommendation,
    carePlan: input.confirmedCareLevel ? buildCarePlan(input.confirmedCareLevel, aiRecommendation.focusTags) : undefined,
  }
}

const INITIAL_APPLICATIONS: AdmissionApplication[] = [
  buildSeededApplication({
    id: 'E001',
    name: '张桂英',
    age: 82,
    gender: '女',
    phone: '13812345678',
    emergency: '张敏 13900001111',
    room: '201-1',
    createdAt: '2026-03-29',
    requestedLevel: '一级护理',
    chronicConditions: '高血压, 糖尿病, 冠心病',
    medicationSummary: '缬沙坦、阿司匹林、二甲双胍',
    allergySummary: '青霉素过敏',
    adlScore: 38,
    cognitiveLevel: '中度受损',
    riskNotes: '近半年有跌倒史，夜间失眠，吞咽功能下降',
    status: '待人工确认',
  }),
  buildSeededApplication({
    id: 'E002',
    name: '王建国',
    age: 78,
    gender: '男',
    phone: '13922223333',
    emergency: '王丽 13688889999',
    room: '203-2',
    createdAt: '2026-03-28',
    requestedLevel: '二级护理',
    chronicConditions: '高血压, 慢阻肺',
    medicationSummary: '厄贝沙坦、吸入剂',
    allergySummary: '无',
    adlScore: 58,
    cognitiveLevel: '轻度受损',
    riskNotes: '夜间偶发气促，需要氧饱和度观察',
    status: '计划已生成',
    confirmedCareLevel: '一级护理',
    reviewNote: '因夜间气促频次增加，人工上调一级护理。',
    confirmedAt: '2026-03-28 16:20',
    confirmedBy: '陈护士长',
  }),
  buildSeededApplication({
    id: 'E003',
    name: '李秀兰',
    age: 85,
    gender: '女',
    phone: '13766667777',
    emergency: '李楠 13511112222',
    room: '205-1',
    createdAt: '2026-03-26',
    requestedLevel: '二级护理',
    chronicConditions: '骨质疏松',
    medicationSummary: '钙片、维生素D',
    allergySummary: '无',
    adlScore: 72,
    cognitiveLevel: '清晰',
    riskNotes: '步态不稳，需要活动陪同',
    status: '已入住',
    confirmedCareLevel: '二级护理',
    reviewNote: '按 AI 建议确认，维持常规活动陪同。',
    confirmedAt: '2026-03-26 10:10',
    confirmedBy: '陈护士长',
  }),
]

export default function CheckinPage() {
  const initialSelectedApplication = INITIAL_APPLICATIONS[0]
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<AdmissionFormState>(EMPTY_FORM)
  const [applications, setApplications] = useState<AdmissionApplication[]>(INITIAL_APPLICATIONS)
  const [selectedId, setSelectedId] = useState(initialSelectedApplication?.id ?? '')
  const [formError, setFormError] = useState('')
  const [reviewLevel, setReviewLevel] = useState<CareLevel>(
    initialSelectedApplication?.confirmedCareLevel ?? initialSelectedApplication?.aiRecommendation.recommendedLevel ?? '二级护理',
  )
  const [reviewNote, setReviewNote] = useState(initialSelectedApplication?.reviewNote ?? '')

  const selectedApplication = useMemo(
    () => applications.find(application => application.id === selectedId) ?? applications[0],
    [applications, selectedId],
  )

  const filteredApplications = useMemo(
    () => applications.filter(application => (
      application.name.includes(search) || application.id.includes(search) || application.room.includes(search)
    )),
    [applications, search],
  )

  const stats = useMemo(() => ({
    submitted: applications.length,
    pendingConfirmation: applications.filter(application => application.status === '待人工确认').length,
    planGenerated: applications.filter(application => application.status === '计划已生成').length,
    admitted: applications.filter(application => application.status === '已入住').length,
  }), [applications])

  function updateForm<K extends keyof AdmissionFormState>(key: K, value: AdmissionFormState[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  function updateApplication(id: string, updater: (current: AdmissionApplication) => AdmissionApplication) {
    setApplications(current => current.map(application => (
      application.id === id ? updater(application) : application
    )))
  }

  function syncReviewDraft(application: AdmissionApplication) {
    setSelectedId(application.id)
    setReviewLevel(application.confirmedCareLevel ?? application.aiRecommendation.recommendedLevel)
    setReviewNote(application.reviewNote ?? '')
  }

  function handleCreateApplication() {
    if (!form.name.trim() || !form.age.trim() || !form.gender || !form.room.trim() || !form.adlScore.trim() || !form.cognitiveLevel) {
      setFormError('请先补齐姓名、年龄、性别、房间、ADL 评分和认知状态。')
      return
    }

    if (Number.isNaN(Number(form.age)) || Number.isNaN(Number(form.adlScore))) {
      setFormError('年龄和 ADL 评分必须是有效数字。')
      return
    }

    const application = createApplicationFromForm(form)
    setApplications(current => [application, ...current])
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

    const generatedPlan = buildCarePlan(reviewLevel, selectedApplication.aiRecommendation.focusTags)

    updateApplication(selectedApplication.id, current => ({
      ...current,
      status: '计划已生成',
      confirmedCareLevel: reviewLevel,
      reviewNote: reviewNote.trim() || '按 AI 建议确认。',
      confirmedAt: '2026-03-30 09:30',
      confirmedBy: '陈护士长',
      carePlan: generatedPlan,
    }))

    setFormError('')
  }

  function handleMarkAdmitted() {
    if (!selectedApplication) {
      return
    }

    updateApplication(selectedApplication.id, current => ({
      ...current,
      status: '已入住',
    }))
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
        subtitle="面向护理主管的入住首条闭环，当前数据全部由页面内 mock 生成。"
        badge={<Tag variant="info">Demo Data</Tag>}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          {[
            { title: '1. 入住录入', description: '补充慢病、用药、过敏、ADL 和认知状态，作为 AI 输入。' },
            { title: '2. AI 建议', description: '根据自理能力、认知和风险备注推荐护理级别与计划模板。' },
            { title: '3. 人工确认', description: '护理主管可保持 AI 建议，也可调整级别并写明原因。' },
            { title: '4. 计划提醒', description: '确认后生成护理计划预览和到点提醒，供员工任务中心承接。' },
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
      </FilterBar>

      {showForm && (
        <DataCard
          title="入住登记与 AI 评估输入"
          subtitle="当前为 demo mock 流程，提交后会立即生成 AI 护理分级建议。"
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
                    style={{ background: application.id === selectedId ? 'rgba(13,148,136,0.06)' : undefined }}
                  >
                    <td><span className="table-row-num">{index + 1}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-sm">{application.name.slice(0, 1)}</div>
                        <div>
                          <div className="font-semibold" style={{ fontSize: 14 }}>{application.name}</div>
                          <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{application.id} · {application.gender} · {application.age}岁</div>
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
                <div className="info-row"><span className="info-label">申请护理等级</span><span className="info-value">{selectedApplication.requestedLevel}</span></div>
                <div className="info-row"><span className="info-label">ADL / 认知状态</span><span className="info-value">{selectedApplication.adlScore} / {selectedApplication.cognitiveLevel}</span></div>
                <div className="info-row"><span className="info-label">慢病数量</span><span className="info-value">{splitList(selectedApplication.chronicConditions).length || 0} 项</span></div>
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
            subtitle="当前为 demo 预览，后续可直接对接任务中心与消息中心。"
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
                    ? `已生成 ${selectedApplication.carePlan.length} 条护理任务，并为责任护士/护理员创建同数量提醒。`
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
                  护理计划、任务和到点提醒将在护理主管确认后生成。当前页仅展示 demo 预览，不写入后端。
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
                <div className="info-row"><span className="info-label">慢病与病史</span><span className="info-value">{selectedApplication.chronicConditions || '未填写'}</span></div>
                <div className="info-row"><span className="info-label">长期用药</span><span className="info-value">{selectedApplication.medicationSummary || '未填写'}</span></div>
                <div className="info-row"><span className="info-label">过敏史</span><span className="info-value">{selectedApplication.allergySummary || '无'}</span></div>
                <div className="info-row"><span className="info-label">风险备注</span><span className="info-value">{selectedApplication.riskNotes || '常规观察'}</span></div>
              </div>
            </div>
          </DataCard>
        </div>
      ) : null}

      <DataCard title="发布与回滚说明" subtitle="当前只影响 Demo 页状态，不影响其他业务模块。">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div style={{ padding: 14, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>受影响用户</div>
            <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.6 }}>管理端护理主管与入住审核人员，可在单页内走完整个 demo 闭环。</div>
          </div>
          <div style={{ padding: 14, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>验证门禁</div>
            <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.6 }}>本次以 ESLint / TypeScript 静态校验为主，不引入新依赖、不接入真实 API。</div>
          </div>
          <div style={{ padding: 14, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>回滚路径</div>
            <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.6 }}>若需要回退，只需恢复本页的 mock 状态逻辑，不涉及数据库、配置或跨模块契约。</div>
          </div>
        </div>
      </DataCard>
    </div>
  )
}
