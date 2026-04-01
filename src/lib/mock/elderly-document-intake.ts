import {
    EMPTY_FORM,
    generateAiRecommendation,
    type AdmissionFormState,
    type CareLevel,
    type CognitiveLevel,
} from '@/lib/mock/admission-workflow'

export interface DocumentImportFormState extends AdmissionFormState {
  identityCard: string
  birthDate: string
}

export interface UploadedDocumentMeta {
  name: string
  sizeLabel: string
  typeLabel: string
}

export interface ImportTemplateOption {
  id: string
  label: string
  description: string
  files: string[]
}

export interface DocumentAiExtractionResult {
  form: DocumentImportFormState
  confidence: number
  coverage: number
  recommendedLevel: CareLevel
  focusTags: string[]
  reasons: string[]
  archiveSummary: string
  healthInsights: string[]
  riskSignals: string[]
  missingFields: string[]
  documentNames: string[]
}

type TemplateSeed = {
  id: string
  label: string
  description: string
  files: string[]
  defaults: Partial<DocumentImportFormState>
  archiveSummary: string
}

const TEMPLATE_SEEDS: TemplateSeed[] = [
  {
    id: 'chronic-followup',
    label: '慢病复评资料包',
    description: '身份证扫描件、近 3 个月门诊病历、体检报告与用药清单。',
    files: ['身份证正反面.pdf', '门诊病历.jpg', '体检报告.pdf', '长期用药清单.docx'],
    defaults: {
      name: '赵桂兰',
      identityCard: '310101194402085122',
      birthDate: '1944-02-08',
      age: '82',
      gender: '女',
      phone: '13812344321',
      emergency: '赵明 13912345670',
      room: '306-1',
      requestedLevel: '一级护理',
      chronicConditions: '高血压、糖尿病、骨质疏松',
      medicationSummary: '缬沙坦、二甲双胍、钙片',
      allergySummary: '无',
      adlScore: '52',
      cognitiveLevel: '轻度受损',
      riskNotes: '近半年有两次跌倒史，夜间起夜频繁，需要离床关注。',
    },
    archiveSummary: '资料包包含身份信息、慢病病史、长期用药和跌倒风险线索，适合直接进入入住审核复核。',
  },
  {
    id: 'post-discharge',
    label: '出院转入住资料包',
    description: '出院小结、身份证、护理评估表与家属授权书。',
    files: ['出院小结.pdf', '护理评估表.xlsx', '家属授权书.pdf', '身份证照片.png'],
    defaults: {
      name: '周建国',
      identityCard: '310101194811164538',
      birthDate: '1948-11-16',
      age: '77',
      gender: '男',
      phone: '13911112222',
      emergency: '周芳 13933334444',
      room: '508-2',
      requestedLevel: '二级护理',
      chronicConditions: '冠心病、慢阻肺',
      medicationSummary: '阿司匹林、吸入剂、厄贝沙坦',
      allergySummary: '头孢过敏',
      adlScore: '61',
      cognitiveLevel: '清晰',
      riskNotes: '夜间偶发气促，餐后需观察咳嗽与吞咽情况。',
    },
    archiveSummary: '资料包带有完整出院记录与护理评估，适合快速补齐入住前的身份与健康档案。',
  },
]

const REQUIRED_FIELD_LABELS = [
  { key: 'name', label: '姓名' },
  { key: 'age', label: '年龄' },
  { key: 'gender', label: '性别' },
  { key: 'phone', label: '联系电话' },
  { key: 'emergency', label: '紧急联系人' },
  { key: 'room', label: '入住房间' },
  { key: 'adlScore', label: 'ADL 评分' },
  { key: 'cognitiveLevel', label: '认知状态' },
] as const

const CHRONIC_KEYWORDS = ['高血压', '糖尿病', '冠心病', '慢阻肺', '阿尔茨海默症', '骨质疏松']
const ALLERGY_KEYWORDS = ['青霉素过敏', '头孢过敏', '磺胺类过敏']

function createEmptyImportForm(): DocumentImportFormState {
  return {
    ...EMPTY_FORM,
    identityCard: '',
    birthDate: '',
  }
}

function normalizeDate(value: string) {
  return value.replace(/[年./]/g, '-').replace(/月/g, '-').replace(/日/g, '').replace(/--+/g, '-').trim()
}

function deriveBirthDateFromIdentityCard(identityCard: string) {
  const normalized = identityCard.trim().toUpperCase()
  if (!/^\d{17}[\dX]$/.test(normalized)) {
    return ''
  }

  return `${normalized.slice(6, 10)}-${normalized.slice(10, 12)}-${normalized.slice(12, 14)}`
}

function dedupeJoin(items: string[]) {
  return Array.from(new Set(items.filter(Boolean))).join('、')
}

function matchFirst(text: string, pattern: RegExp) {
  const matched = text.match(pattern)
  return matched?.[1]?.trim() ?? ''
}

function buildSizeLabel(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`
  }

  return `${size} B`
}

export function mapFilesToUploadMeta(files: FileList | null): UploadedDocumentMeta[] {
  if (!files) {
    return []
  }

  return Array.from(files).map(file => ({
    name: file.name,
    sizeLabel: buildSizeLabel(file.size),
    typeLabel: file.type || '未识别类型',
  }))
}

export function getImportTemplateOptions(): ImportTemplateOption[] {
  return TEMPLATE_SEEDS.map(template => ({
    id: template.id,
    label: template.label,
    description: template.description,
    files: template.files,
  }))
}

function getTemplateSeed(templateId?: string) {
  return TEMPLATE_SEEDS.find(item => item.id === templateId)
}

function applyKeywordFallbacks(form: DocumentImportFormState, text: string) {
  if (!form.chronicConditions) {
    const chronic = CHRONIC_KEYWORDS.filter(keyword => text.includes(keyword))
    form.chronicConditions = dedupeJoin(chronic)
  }

  if (!form.allergySummary) {
    const allergy = ALLERGY_KEYWORDS.filter(keyword => text.includes(keyword))
    form.allergySummary = allergy.length > 0 ? dedupeJoin(allergy) : '无'
  }

  if (!form.cognitiveLevel) {
    if (text.includes('重度认知') || text.includes('阿尔茨海默')) {
      form.cognitiveLevel = '重度受损'
    } else if (text.includes('中度认知')) {
      form.cognitiveLevel = '中度受损'
    } else if (text.includes('轻度认知') || text.includes('记忆下降')) {
      form.cognitiveLevel = '轻度受损'
    }
  }
}

export function simulateDocumentAiExtraction(input: {
  templateId?: string
  rawText: string
  operatorNotes: string
  uploadedFiles: UploadedDocumentMeta[]
}): DocumentAiExtractionResult {
  const template = getTemplateSeed(input.templateId)
  const form: DocumentImportFormState = {
    ...createEmptyImportForm(),
    ...(template?.defaults ?? {}),
  }
  const combinedText = [input.rawText, input.operatorNotes, input.uploadedFiles.map(file => file.name).join('；')]
    .filter(Boolean)
    .join('\n')

  const identityCard = combinedText.match(/\d{17}[\dXx]/)?.[0] ?? form.identityCard
  const birthDate = matchFirst(combinedText, /(?:出生日期|生日)[:：]?\s*([0-9]{4}[年./-][0-9]{1,2}[月./-][0-9]{1,2}日?)/)
  const primaryPhone = combinedText.match(/1\d{10}/)?.[0] ?? form.phone
  const allPhones = combinedText.match(/1\d{10}/g) ?? []

  form.name = matchFirst(combinedText, /姓名[:：]?\s*([^\n，,；;]+)/) || form.name
  form.gender = (matchFirst(combinedText, /性别[:：]?\s*(男|女)/) as DocumentImportFormState['gender']) || form.gender
  form.age = matchFirst(combinedText, /年龄[:：]?\s*(\d{2,3})/) || form.age
  form.identityCard = identityCard
  form.birthDate = normalizeDate(birthDate) || form.birthDate || deriveBirthDateFromIdentityCard(identityCard)
  form.phone = primaryPhone
  form.emergency = matchFirst(combinedText, /(?:紧急联系人|联系人)[:：]?\s*([^\n]+)/) || form.emergency || (allPhones[1] ? `待补录 ${allPhones[1]}` : '')
  form.room = matchFirst(combinedText, /(?:房间|床位|入住单元)[:：]?\s*([A-Za-z]?\d{3,4}(?:[-/]\d)?)/) || form.room
  form.adlScore = matchFirst(combinedText, /ADL(?:评分)?[:：]?\s*(\d{1,3})/i) || form.adlScore
  form.cognitiveLevel = (matchFirst(combinedText, /(?:认知状态|认知评估)[:：]?\s*(清晰|轻度受损|中度受损|重度受损)/) as CognitiveLevel) || form.cognitiveLevel
  form.chronicConditions = matchFirst(combinedText, /(?:慢病|既往病史|主要诊断)[:：]?\s*([^\n]+)/) || form.chronicConditions
  form.medicationSummary = matchFirst(combinedText, /(?:长期用药|用药清单|出院带药)[:：]?\s*([^\n]+)/) || form.medicationSummary
  form.allergySummary = matchFirst(combinedText, /(?:过敏史|药物过敏)[:：]?\s*([^\n]+)/) || form.allergySummary
  form.riskNotes = matchFirst(combinedText, /(?:风险备注|风险提示|照护提示|特殊注意)[:：]?\s*([^\n]+)/) || form.riskNotes
  form.requestedLevel = (matchFirst(combinedText, /(?:护理等级|申请护理等级)[:：]?\s*(特级护理|一级护理|二级护理|三级护理)/) as CareLevel) || form.requestedLevel

  applyKeywordFallbacks(form, combinedText)

  const aiRecommendation = generateAiRecommendation({
    age: Number(form.age || '0'),
    chronicConditions: form.chronicConditions,
    adlScore: Number(form.adlScore || '0'),
    cognitiveLevel: form.cognitiveLevel || '清晰',
    riskNotes: form.riskNotes,
  })

  if (!form.requestedLevel) {
    form.requestedLevel = aiRecommendation.recommendedLevel
  }

  const missingFields = REQUIRED_FIELD_LABELS
    .filter(item => !String(form[item.key]).trim())
    .map(item => item.label)
  const recognizedRequired = REQUIRED_FIELD_LABELS.length - missingFields.length
  const coverage = Math.round((recognizedRequired / REQUIRED_FIELD_LABELS.length) * 100)
  const documentNames = [
    ...(template?.files ?? []),
    ...input.uploadedFiles.map(file => file.name),
  ]
  const confidence = Math.max(
    52,
    Math.min(
      97,
      Math.round((template ? 18 : 8) + coverage * 0.6 + input.uploadedFiles.length * 4 + (input.rawText.trim() ? 10 : 0)),
    ),
  )

  return {
    form,
    confidence,
    coverage,
    recommendedLevel: aiRecommendation.recommendedLevel,
    focusTags: aiRecommendation.focusTags,
    reasons: aiRecommendation.reasons,
    archiveSummary: template?.archiveSummary ?? 'AI 已从资料摘要中提取身份字段、病史线索和照护风险，待人工复核后进入入住审核。',
    healthInsights: [
      form.chronicConditions ? `慢病与病史：${form.chronicConditions}` : '慢病与病史：待补录',
      form.medicationSummary ? `长期用药：${form.medicationSummary}` : '长期用药：待补录',
      form.allergySummary ? `过敏史：${form.allergySummary}` : '过敏史：待补录',
      form.riskNotes ? `照护风险：${form.riskNotes}` : '照护风险：待补录',
    ],
    riskSignals: aiRecommendation.focusTags,
    missingFields,
    documentNames,
  }
}