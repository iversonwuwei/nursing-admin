'use client'

export const CARE_LEVELS = ['特级护理', '一级护理', '二级护理', '三级护理'] as const
export const COGNITIVE_LEVELS = ['清晰', '轻度受损', '中度受损', '重度受损'] as const

export type CareLevel = (typeof CARE_LEVELS)[number]
export type CognitiveLevel = (typeof COGNITIVE_LEVELS)[number]
export type AdmissionStatus = '待人工确认' | '计划已生成' | '已入住'
export type AdmissionSourceType = 'manual-form' | 'document-import'
export type AssessmentStatus = AdmissionStatus
export type AssessmentSourceType = AdmissionSourceType
export type TaskPriority = '高' | '中' | '常规'
export type TaskStatus = '待执行' | '已生成' | '执行中' | '已完成' | '持续跟踪'
export type ReminderStatus = '待发送' | '已生成' | '已读' | '需升级' | '已处理'
export type ServiceMode = '机构护理' | '居家护理' | '社区护理'
export type SettlementStatus = '待初审' | '待复核' | '待拨付' | '已结算'
export type EvidenceStatus = '齐全' | '待补充'

export interface TaskAuditRecord {
  status: TaskStatus
  handledBy?: string
  handledAt?: string
  handledAtIso?: string
  actionNote?: string
  exceptionReason?: string
}

export interface ReminderAuditRecord {
  status: ReminderStatus
  handledBy?: string
  handledAt?: string
  handledAtIso?: string
  actionNote?: string
  exceptionReason?: string
}

interface AssessmentWorkflowState {
  assessmentCases: AssessmentCase[]
  taskStateMap: Record<string, TaskAuditRecord>
  reminderStateMap: Record<string, ReminderAuditRecord>
}

export interface AdmissionFormState {
  name: string
  identityCard: string
  birthDate: string
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

export type AssessmentFormState = AdmissionFormState

export interface CareTaskPreview {
  id: string
  time: string
  title: string
  owner: string
  reminder: string
}

export interface AiRecommendation {
  recommendedLevel: CareLevel
  confidence: number
  assessmentScore: number
  reasonSummary: string
  reasons: string[]
  focusTags: string[]
  planTemplateCode: string
}

export interface AdmissionApplication {
  id: string
  name: string
  identityCard?: string
  birthDate?: string
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
  sourceType?: AdmissionSourceType
  sourceLabel?: string
  sourceDocumentNames?: string[]
  sourceSummary?: string
}

export type AssessmentCase = AdmissionApplication

export interface CreateAdmissionOptions {
  sourceType?: AdmissionSourceType
  sourceLabel?: string
  sourceDocumentNames?: string[]
  sourceSummary?: string
}

export type CreateAssessmentOptions = CreateAdmissionOptions

export interface StaffTaskItem {
  id: string
  elderlyName: string
  room: string
  title: string
  owner: string
  reminder: string
  scheduledTime: string
  careLevel: CareLevel
  priority: TaskPriority
  status: TaskStatus
  sourceId: string
  sourceStatus: AdmissionStatus
  handledBy?: string
  handledAt?: string
  handledAtIso?: string
  actionNote?: string
  exceptionReason?: string
}

export interface ReminderItem {
  id: string
  title: string
  recipient: string
  scheduledTime: string
  channel: string
  policy: string
  status: ReminderStatus
  elderlyName: string
  room: string
  sourceId: string
  handledBy?: string
  handledAt?: string
  handledAtIso?: string
  actionNote?: string
  exceptionReason?: string
}

export interface SettlementLineItem {
  id: string
  label: string
  quantity: number
  unit: string
  unitPrice: number
  amount: number
}

export interface SettlementCase {
  id: string
  assessmentId: string
  elderlyName: string
  institutionName: string
  serviceMode: ServiceMode
  periodLabel: string
  careLevel: CareLevel
  status: SettlementStatus
  evidenceStatus: EvidenceStatus
  totalAmount: number
  fundAmount: number
  copayAmount: number
  submittedAt: string
  reviewedAt?: string
  paidAt?: string
  nextAction: string
  riskFlags: string[]
  settlementNote: string
  lineItems: SettlementLineItem[]
  sourceStatus: AssessmentStatus
  confirmedBy?: string
}

export const EMPTY_FORM: AdmissionFormState = {
  name: '',
  identityCard: '',
  birthDate: '',
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

export const EMPTY_ASSESSMENT_FORM = EMPTY_FORM

export function validateAdmissionForm(form: AdmissionFormState) {
  if (
    !form.name.trim()
    || !form.age.trim()
    || !form.gender
    || !form.phone.trim()
    || !form.emergency.trim()
    || !form.room.trim()
    || !form.adlScore.trim()
    || !form.cognitiveLevel
  ) {
    return '请先补齐姓名、年龄、性别、联系电话、紧急联系人、房间、ADL 评分和认知状态。'
  }

  const age = Number(form.age)
  if (Number.isNaN(age) || age < 55 || age > 120) {
    return '年龄需填写为 55 到 120 岁之间的有效数字。'
  }

  const adlScore = Number(form.adlScore)
  if (Number.isNaN(adlScore) || adlScore < 0 || adlScore > 100) {
    return 'ADL 评分必须是 0 到 100 之间的有效数字。'
  }

  if (form.phone.trim().replace(/\D/g, '').length < 11) {
    return '联系电话至少填写 11 位有效手机号。'
  }

  if (form.identityCard.trim() && !/^\d{17}[\dXx]$/.test(form.identityCard.trim())) {
    return '身份证号需填写为 18 位有效证件号码。'
  }

  if (form.requestedLevel === '特级护理' && !form.riskNotes.trim()) {
    return '特级护理申请请补充风险备注，便于护理主管复核。'
  }

  return ''
}

export const validateAssessmentForm = validateAdmissionForm

const STORAGE_KEY = 'nursing-admin-v2/admission-workflow'

function splitList(value: string) {
  return value
    .split(/[，,、\n]/)
    .map(item => item.trim())
    .filter(Boolean)
}

function deriveBirthDateFromIdentityCard(identityCard: string) {
  const normalized = identityCard.trim().toUpperCase()
  if (!/^\d{17}[\dX]$/.test(normalized)) {
    return ''
  }

  const year = normalized.slice(6, 10)
  const month = normalized.slice(10, 12)
  const day = normalized.slice(12, 14)
  return `${year}-${month}-${day}`
}

function deriveCareLevel(score: number): CareLevel {
  if (score >= 7) return '特级护理'
  if (score >= 5) return '一级护理'
  if (score >= 3) return '二级护理'
  return '三级护理'
}

function getTaskPriority(level: CareLevel): TaskPriority {
  if (level === '特级护理' || level === '一级护理') return '高'
  if (level === '二级护理') return '中'
  return '常规'
}

export function getLevelVariant(level: CareLevel) {
  if (level === '特级护理') return 'danger'
  if (level === '一级护理') return 'warning'
  if (level === '二级护理') return 'info'
  return 'success'
}

export function getAssessmentSourceLabel(sourceType?: AssessmentSourceType) {
  if (sourceType === 'document-import') {
    return '资料导入'
  }

  return '人工录入'
}

export const getAdmissionSourceLabel = getAssessmentSourceLabel

export function getAssessmentStatusLabel(status: AssessmentStatus) {
  if (status === '待人工确认') return '待认定确认'
  if (status === '计划已生成') return '认定结论已生成'
  return '认定已生效'
}

export function getAssessmentStatusVariant(status: AssessmentStatus) {
  if (status === '待人工确认') return 'warning'
  if (status === '计划已生成') return 'primary'
  return 'success'
}

export const getStatusVariant = getAssessmentStatusVariant

export function getSettlementStatusVariant(status: SettlementStatus) {
  if (status === '待初审') return 'warning'
  if (status === '待复核') return 'primary'
  if (status === '待拨付') return 'info'
  return 'success'
}

export function getEvidenceStatusVariant(status: EvidenceStatus) {
  return status === '齐全' ? 'success' : 'warning'
}

export function getTaskPriorityVariant(priority: TaskPriority) {
  if (priority === '高') return 'danger'
  if (priority === '中') return 'warning'
  return 'info'
}

export function getTaskStatusVariant(status: TaskStatus) {
  if (status === '已完成') return 'success'
  if (status === '执行中') return 'primary'
  if (status === '持续跟踪') return 'info'
  if (status === '已生成') return 'warning'
  return 'neutral'
}

export function getReminderStatusVariant(status: ReminderStatus) {
  if (status === '已处理') return 'success'
  if (status === '已读') return 'info'
  if (status === '需升级') return 'danger'
  if (status === '已生成') return 'primary'
  return 'warning'
}

function getBaseTaskStatus(sourceStatus: AdmissionStatus): TaskStatus {
  if (sourceStatus === '已入住') return '持续跟踪'
  if (sourceStatus === '计划已生成') return '已生成'
  return '待执行'
}

function getBaseReminderStatus(task: StaffTaskItem): ReminderStatus {
  if (task.reminder.includes('超时升级')) return '需升级'
  if (task.sourceStatus === '已入住') return '待发送'
  return '已生成'
}

function formatAuditTimestamp() {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
}

function getAuditTimestampIso() {
  return new Date().toISOString()
}

function roundCurrency(value: number) {
  return Math.round(value)
}

function getSettlementPricing(level: CareLevel) {
  if (level === '特级护理') {
    return { dailyRate: 260, visitUnitPrice: 22, rehabUnitPrice: 48, fundRate: 0.9 }
  }

  if (level === '一级护理') {
    return { dailyRate: 220, visitUnitPrice: 20, rehabUnitPrice: 42, fundRate: 0.85 }
  }

  if (level === '二级护理') {
    return { dailyRate: 180, visitUnitPrice: 18, rehabUnitPrice: 36, fundRate: 0.8 }
  }

  return { dailyRate: 140, visitUnitPrice: 16, rehabUnitPrice: 30, fundRate: 0.75 }
}

function inferRiskFlags(application: AssessmentCase) {
  const flags: string[] = []

  if (application.confirmedCareLevel && application.confirmedCareLevel !== application.aiRecommendation.recommendedLevel) {
    flags.push('人工调整护理等级，需保留复核依据')
  }

  if (application.aiRecommendation.focusTags.includes('跌倒预防')) {
    flags.push('跌倒风险服务需补齐签认')
  }

  if (application.aiRecommendation.focusTags.includes('吞咽观察')) {
    flags.push('吞咽观察记录需同步上传')
  }

  if (application.sourceType === 'document-import') {
    flags.push('导入资料需复核识别字段')
  }

  return flags
}

function buildSettlementLineItems(application: AssessmentCase): SettlementLineItem[] {
  const careLevel = application.confirmedCareLevel ?? application.aiRecommendation.recommendedLevel
  const pricing = getSettlementPricing(careLevel)
  const planSize = application.carePlan?.length ?? 3
  const riskQuantity = Math.max(1, Math.min(4, application.aiRecommendation.focusTags.length))
  const lineItems: SettlementLineItem[] = [
    {
      id: `${application.id}-daily-care`,
      label: '基础照护服务',
      quantity: 15,
      unit: '天',
      unitPrice: pricing.dailyRate,
      amount: 15 * pricing.dailyRate,
    },
    {
      id: `${application.id}-visit`,
      label: '巡视与风险干预',
      quantity: planSize * 4,
      unit: '次',
      unitPrice: pricing.visitUnitPrice,
      amount: planSize * 4 * pricing.visitUnitPrice,
    },
  ]

  if (application.cognitiveLevel !== '清晰' || application.aiRecommendation.focusTags.includes('提醒陪护')) {
    lineItems.push({
      id: `${application.id}-escort`,
      label: '认知照护与陪护提醒',
      quantity: riskQuantity * 5,
      unit: '次',
      unitPrice: 14,
      amount: riskQuantity * 5 * 14,
    })
  }

  lineItems.push({
    id: `${application.id}-rehab`,
    label: '康复训练/健康指导',
    quantity: Math.max(3, planSize),
    unit: '次',
    unitPrice: pricing.rehabUnitPrice,
    amount: Math.max(3, planSize) * pricing.rehabUnitPrice,
  })

  return lineItems.map(item => ({
    ...item,
    amount: roundCurrency(item.amount),
  }))
}

const SEEDED_SETTLEMENT_META: Record<string, Partial<SettlementCase>> = {
  E002: {
    serviceMode: '机构护理',
    institutionName: '城南长护险护理中心',
    periodLabel: '2026年4月上半月',
    status: '待复核',
    evidenceStatus: '齐全',
    submittedAt: '2026-04-01 11:20',
    reviewedAt: '2026-04-02 09:10',
    nextAction: '等待质控复核结论',
    riskFlags: ['一级护理人工上调需质控复核'],
    settlementNote: '已附人工上调依据与护理主管说明。',
  },
  E003: {
    serviceMode: '机构护理',
    institutionName: '城南长护险护理中心',
    periodLabel: '2026年3月下半月',
    status: '已结算',
    evidenceStatus: '齐全',
    submittedAt: '2026-03-27 09:00',
    reviewedAt: '2026-03-28 14:20',
    paidAt: '2026-03-31 18:00',
    nextAction: '进入下期抽检复盘',
    riskFlags: [],
    settlementNote: '认定已生效并完成评估费结算。',
  },
}

function normalizeTaskStateMap(input: unknown): Record<string, TaskAuditRecord> {
  if (!input || typeof input !== 'object') {
    return {}
  }

  return Object.fromEntries(Object.entries(input).map(([key, value]) => {
    if (typeof value === 'string') {
      return [key, { status: value as TaskStatus }]
    }

    if (value && typeof value === 'object' && 'status' in value) {
      const record = value as TaskAuditRecord
      return [key, {
        status: record.status,
        handledBy: record.handledBy,
        handledAt: record.handledAt,
        handledAtIso: record.handledAtIso,
        actionNote: record.actionNote,
        exceptionReason: record.exceptionReason,
      }]
    }

    return [key, { status: '待执行' as TaskStatus }]
  }))
}

function normalizeReminderStateMap(input: unknown): Record<string, ReminderAuditRecord> {
  if (!input || typeof input !== 'object') {
    return {}
  }

  return Object.fromEntries(Object.entries(input).map(([key, value]) => {
    if (typeof value === 'string') {
      return [key, { status: value as ReminderStatus }]
    }

    if (value && typeof value === 'object' && 'status' in value) {
      const record = value as ReminderAuditRecord
      return [key, {
        status: record.status,
        handledBy: record.handledBy,
        handledAt: record.handledAt,
        handledAtIso: record.handledAtIso,
        actionNote: record.actionNote,
        exceptionReason: record.exceptionReason,
      }]
    }

    return [key, { status: '已生成' as ReminderStatus }]
  }))
}

export function buildCarePlan(level: CareLevel, focusTags: string[]): CareTaskPreview[] {
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

export function generateAiRecommendation(input: {
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

export function createApplicationFromForm(form: AdmissionFormState, options: CreateAdmissionOptions = {}): AdmissionApplication {
  const age = Number(form.age)
  const adlScore = Number(form.adlScore)
  const identityCard = form.identityCard.trim()
  const birthDate = form.birthDate.trim() || (identityCard ? deriveBirthDateFromIdentityCard(identityCard) : '')
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
    identityCard: identityCard || undefined,
    birthDate: birthDate || undefined,
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
    sourceType: options.sourceType ?? 'manual-form',
    sourceLabel: options.sourceLabel,
    sourceDocumentNames: options.sourceDocumentNames,
    sourceSummary: options.sourceSummary,
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

function createInitialAssessmentCases(): AssessmentCase[] {
  return [
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
}

function createInitialState(): AssessmentWorkflowState {
  return {
    assessmentCases: createInitialAssessmentCases(),
    taskStateMap: {},
    reminderStateMap: {},
  }
}

let assessmentWorkflowState = createInitialState()
let hydrated = false
const listeners = new Set<() => void>()

function persistState() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assessmentWorkflowState))
}

function hydrateState() {
  if (typeof window === 'undefined' || hydrated) {
    return
  }

  hydrated = true
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    persistState()
    return
  }

  try {
    const parsed = JSON.parse(raw) as AssessmentWorkflowState | AdmissionApplication[] | { applications?: AdmissionApplication[] }
    const legacyParsed = parsed as { applications?: AdmissionApplication[]; taskStateMap?: unknown; reminderStateMap?: unknown }
    const assessmentParsed = parsed as AssessmentWorkflowState
    if (Array.isArray(parsed) && parsed.length > 0) {
      assessmentWorkflowState = {
        assessmentCases: parsed,
        taskStateMap: {},
        reminderStateMap: {},
      }
      persistState()
      return
    }

    if (
      parsed
      && typeof parsed === 'object'
      && !Array.isArray(parsed)
      && Array.isArray(legacyParsed.applications)
    ) {
      assessmentWorkflowState = {
        assessmentCases: legacyParsed.applications,
        taskStateMap: normalizeTaskStateMap(legacyParsed.taskStateMap),
        reminderStateMap: normalizeReminderStateMap(legacyParsed.reminderStateMap),
      }
      persistState()
      return
    }

    if (
      parsed
      && typeof parsed === 'object'
      && !Array.isArray(parsed)
      && Array.isArray(assessmentParsed.assessmentCases)
    ) {
      assessmentWorkflowState = {
        assessmentCases: assessmentParsed.assessmentCases,
        taskStateMap: normalizeTaskStateMap(assessmentParsed.taskStateMap),
        reminderStateMap: normalizeReminderStateMap(assessmentParsed.reminderStateMap),
      }
    }
  } catch {
    assessmentWorkflowState = createInitialState()
    persistState()
  }
}

function notifyListeners() {
  persistState()
  listeners.forEach(listener => listener())
}

export function getAdmissionApplicationsSnapshot() {
  hydrateState()
  return assessmentWorkflowState.assessmentCases
}

export const getAssessmentCasesSnapshot = getAdmissionApplicationsSnapshot

export function subscribeAdmissionWorkflow(listener: () => void) {
  hydrateState()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const subscribeAssessmentWorkflow = subscribeAdmissionWorkflow

export function addAdmissionApplication(form: AdmissionFormState, options?: CreateAdmissionOptions) {
  hydrateState()
  const application = createApplicationFromForm(form, options)
  assessmentWorkflowState = {
    ...assessmentWorkflowState,
    assessmentCases: [application, ...assessmentWorkflowState.assessmentCases],
  }
  notifyListeners()
  return application
}

export const submitAssessmentCase = addAdmissionApplication

export function confirmAdmissionPlan(id: string, reviewLevel: CareLevel, reviewNote: string, confirmedBy = '陈护士长') {
  hydrateState()
  let updatedApplication: AdmissionApplication | undefined
  const nextAssessmentCases = assessmentWorkflowState.assessmentCases.map(application => {
    if (application.id !== id) {
      return application
    }

    updatedApplication = {
      ...application,
      status: '计划已生成',
      confirmedCareLevel: reviewLevel,
      reviewNote: reviewNote.trim() || '按 AI 建议确认。',
      confirmedAt: '2026-03-30 09:30',
      confirmedBy,
      carePlan: buildCarePlan(reviewLevel, application.aiRecommendation.focusTags),
    }

    return updatedApplication
  })
  assessmentWorkflowState = {
    ...assessmentWorkflowState,
    assessmentCases: nextAssessmentCases,
  }
  notifyListeners()
  return updatedApplication
}

export const confirmAssessmentDecision = confirmAdmissionPlan

export function markAdmissionAsAdmitted(id: string) {
  hydrateState()
  let updatedApplication: AdmissionApplication | undefined
  const nextAssessmentCases = assessmentWorkflowState.assessmentCases.map(application => {
    if (application.id !== id) {
      return application
    }

    updatedApplication = {
      ...application,
      status: '已入住',
    }

    return updatedApplication
  })
  assessmentWorkflowState = {
    ...assessmentWorkflowState,
    assessmentCases: nextAssessmentCases,
  }
  notifyListeners()
  return updatedApplication
}

export const activateAssessmentBenefits = markAdmissionAsAdmitted

export function getSettlementCases(applications: AssessmentCase[]): SettlementCase[] {
  hydrateState()
  return applications
    .filter(application => application.status !== '待人工确认')
    .map((application, index) => {
      const seededMeta = SEEDED_SETTLEMENT_META[application.id]
      const careLevel = application.confirmedCareLevel ?? application.aiRecommendation.recommendedLevel
      const pricing = getSettlementPricing(careLevel)
      const lineItems = buildSettlementLineItems(application)
      const totalAmount = roundCurrency(lineItems.reduce((sum, item) => sum + item.amount, 0))
      const defaultRiskFlags = inferRiskFlags(application)
      const fundAmount = roundCurrency(totalAmount * pricing.fundRate)
      const copayAmount = roundCurrency(totalAmount - fundAmount)
      const defaultStatus: SettlementStatus = application.status === '已入住' ? '待拨付' : '待初审'
      const defaultEvidenceStatus: EvidenceStatus = defaultRiskFlags.length > 0 ? '待补充' : '齐全'

      return {
        id: `SET-${application.id}`,
        assessmentId: application.id,
        elderlyName: application.name,
        institutionName: seededMeta?.institutionName ?? '城南长护险护理中心',
        serviceMode: seededMeta?.serviceMode ?? (index % 2 === 0 ? '机构护理' : '居家护理'),
        periodLabel: seededMeta?.periodLabel ?? '2026年4月上半月',
        careLevel,
        status: seededMeta?.status ?? defaultStatus,
        evidenceStatus: seededMeta?.evidenceStatus ?? defaultEvidenceStatus,
        totalAmount,
        fundAmount,
        copayAmount,
        submittedAt: seededMeta?.submittedAt ?? application.confirmedAt ?? application.createdAt,
        reviewedAt: seededMeta?.reviewedAt,
        paidAt: seededMeta?.paidAt,
        nextAction: seededMeta?.nextAction ?? (defaultRiskFlags.length > 0 ? '补齐签认与执行回单后提交初审' : '可直接进入医保初审'),
        riskFlags: seededMeta?.riskFlags ?? defaultRiskFlags,
        settlementNote: seededMeta?.settlementNote ?? '结算金额由当前 demo 评定场景、资料完整性与模拟收费项推导，仅用于前端流程演示。',
        lineItems,
        sourceStatus: application.status,
        confirmedBy: application.confirmedBy,
      }
    })
    .sort((left, right) => left.submittedAt < right.submittedAt ? 1 : -1)
}

export function startStaffTask(taskId: string, handledBy = '当班护理员', actionNote = '已领取任务，准备开始执行。') {
  hydrateState()
  const handledAtIso = getAuditTimestampIso()
  assessmentWorkflowState = {
    ...assessmentWorkflowState,
    taskStateMap: {
      ...assessmentWorkflowState.taskStateMap,
      [taskId]: {
        status: '执行中',
        handledBy,
        handledAt: formatAuditTimestamp(),
        handledAtIso,
        actionNote,
      },
    },
  }
  notifyListeners()
}

export function completeStaffTask(taskId: string, handledBy = '责任护士', actionNote = '护理任务已按计划完成。') {
  hydrateState()
  const previousRecord = assessmentWorkflowState.taskStateMap[taskId]
  const handledAtIso = getAuditTimestampIso()
  assessmentWorkflowState = {
    ...assessmentWorkflowState,
    taskStateMap: {
      ...assessmentWorkflowState.taskStateMap,
      [taskId]: {
        status: '已完成',
        handledBy,
        handledAt: formatAuditTimestamp(),
        handledAtIso,
        actionNote,
        exceptionReason: previousRecord?.exceptionReason,
      },
    },
  }
  notifyListeners()
}

export function saveTaskAuditNote(
  taskId: string,
  status: TaskStatus,
  actionNote: string,
  exceptionReason?: string,
  handledBy?: string,
  handledAt?: string,
  handledAtIso?: string,
) {
  hydrateState()
  const previousRecord = assessmentWorkflowState.taskStateMap[taskId]
  assessmentWorkflowState = {
    ...assessmentWorkflowState,
    taskStateMap: {
      ...assessmentWorkflowState.taskStateMap,
      [taskId]: {
        status,
        handledBy: previousRecord?.handledBy ?? handledBy,
        handledAt: previousRecord?.handledAt ?? handledAt,
        handledAtIso: previousRecord?.handledAtIso ?? handledAtIso,
        actionNote,
        exceptionReason: exceptionReason ?? previousRecord?.exceptionReason,
      },
    },
  }
  notifyListeners()
}

export function markReminderAsRead(reminderId: string, handledBy = '值班护士', actionNote = '已确认收到提醒，待后续处理。') {
  hydrateState()
  const handledAtIso = getAuditTimestampIso()
  assessmentWorkflowState = {
    ...assessmentWorkflowState,
    reminderStateMap: {
      ...assessmentWorkflowState.reminderStateMap,
      [reminderId]: {
        status: '已读',
        handledBy,
        handledAt: formatAuditTimestamp(),
        handledAtIso,
        actionNote,
      },
    },
  }
  notifyListeners()
}

export function resolveReminder(
  reminderId: string,
  handledBy = '护理主管',
  actionNote = '提醒事项已完成处置并关闭。',
  exceptionReason?: string,
) {
  hydrateState()
  const previousRecord = assessmentWorkflowState.reminderStateMap[reminderId]
  const handledAtIso = getAuditTimestampIso()
  assessmentWorkflowState = {
    ...assessmentWorkflowState,
    reminderStateMap: {
      ...assessmentWorkflowState.reminderStateMap,
      [reminderId]: {
        status: '已处理',
        handledBy,
        handledAt: formatAuditTimestamp(),
        handledAtIso,
        actionNote,
        exceptionReason: exceptionReason ?? previousRecord?.exceptionReason,
      },
    },
  }
  notifyListeners()
}

export function saveReminderAuditNote(
  reminderId: string,
  status: ReminderStatus,
  actionNote: string,
  exceptionReason?: string,
  handledBy?: string,
  handledAt?: string,
  handledAtIso?: string,
) {
  hydrateState()
  const previousRecord = assessmentWorkflowState.reminderStateMap[reminderId]
  assessmentWorkflowState = {
    ...assessmentWorkflowState,
    reminderStateMap: {
      ...assessmentWorkflowState.reminderStateMap,
      [reminderId]: {
        status,
        handledBy: previousRecord?.handledBy ?? handledBy,
        handledAt: previousRecord?.handledAt ?? handledAt,
        handledAtIso: previousRecord?.handledAtIso ?? handledAtIso,
        actionNote,
        exceptionReason: exceptionReason ?? previousRecord?.exceptionReason,
      },
    },
  }
  notifyListeners()
}

export function getStaffTaskItems(applications: AdmissionApplication[]): StaffTaskItem[] {
  hydrateState()
  return applications
    .filter(application => application.carePlan && application.carePlan.length > 0)
    .flatMap(application => application.carePlan!.map(task => {
      const id = `${application.id}-${task.id}`
      const audit = assessmentWorkflowState.taskStateMap[id]
      return {
        id,
        elderlyName: application.name,
        room: application.room,
        title: task.title,
        owner: task.owner,
        reminder: task.reminder,
        scheduledTime: task.time,
        careLevel: application.confirmedCareLevel ?? application.aiRecommendation.recommendedLevel,
        priority: getTaskPriority(application.confirmedCareLevel ?? application.aiRecommendation.recommendedLevel),
        status: audit?.status ?? getBaseTaskStatus(application.status),
        sourceId: application.id,
        sourceStatus: application.status,
        handledBy: audit?.handledBy,
        handledAt: audit?.handledAt,
        handledAtIso: audit?.handledAtIso,
        actionNote: audit?.actionNote,
        exceptionReason: audit?.exceptionReason,
      }
    }))
    .sort((left, right) => left.scheduledTime.localeCompare(right.scheduledTime))
}

export function getReminderItems(applications: AdmissionApplication[]): ReminderItem[] {
  hydrateState()
  return getStaffTaskItems(applications).map(task => {
    const id = `reminder-${task.id}`
    const audit = assessmentWorkflowState.reminderStateMap[id]
    return {
      id,
      title: `${task.title} · ${task.elderlyName}`,
      recipient: task.owner,
      scheduledTime: task.scheduledTime,
      channel: '站内消息 / 班次提醒',
      policy: task.reminder,
      status: audit?.status ?? getBaseReminderStatus(task),
      elderlyName: task.elderlyName,
      room: task.room,
      sourceId: task.sourceId,
      handledBy: audit?.handledBy,
      handledAt: audit?.handledAt,
      handledAtIso: audit?.handledAtIso,
      actionNote: audit?.actionNote,
      exceptionReason: audit?.exceptionReason,
    }
  })
}

export function resetAdmissionWorkflowMock() {
  assessmentWorkflowState = createInitialState()
  hydrated = true
  notifyListeners()
}