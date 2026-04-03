import type { AssessmentCase, AssessmentStatus, CareLevel } from '@/lib/mock/assessment-workflow'

export type AssessmentScene = '首次认定' | '复评复核' | '抽检回访'
export type NursingItemCategory = '基础照护' | '专项护理' | '康复支持' | '风险干预'
export type NursingItemStatus = '草稿' | '已启用' | '已停用'
export type RuleSetStatus = '草稿' | '待复核' | '已生效' | '已停用'
export type AssessmentTemplateStatus = '草稿' | '待复核' | '已启用' | '已归档'

export interface NursingCatalogItem {
  id: string
  code: string
  name: string
  category: NursingItemCategory
  serviceModes: string[]
  durationLabel: string
  evidenceRequirements: string[]
  applicableLevels: CareLevel[]
  description: string
  owner: string
  linkedRuleSets: number
  status: NursingItemStatus
  updatedAt: string
}

export interface AssessmentRuleSetRecord {
  id: string
  name: string
  version: string
  scene: AssessmentScene
  applicableLevels: CareLevel[]
  scoreRangeLabel: string
  thresholdSummary: string
  evidenceRequirements: string[]
  nursingItemIds: string[]
  qualityGate: string
  owner: string
  status: RuleSetStatus
  updatedAt: string
}

export interface AssessmentTemplateRecord {
  id: string
  name: string
  scene: AssessmentScene
  targetLevels: CareLevel[]
  ruleSetId: string
  ruleSetName: string
  nursingItemIds: string[]
  nursingItemNames: string[]
  evidenceRequirements: string[]
  conclusionSummary: string
  followupAction: string
  owner: string
  status: AssessmentTemplateStatus
  updatedAt: string
}

export interface NursingItemFormState {
  name: string
  category: NursingItemCategory
  serviceModes: string
  durationLabel: string
  evidenceRequirements: string
  applicableLevels: string
  description: string
}

export interface AssessmentRuleSetFormState {
  name: string
  version: string
  scene: AssessmentScene
  applicableLevels: string
  scoreRangeLabel: string
  thresholdSummary: string
  evidenceRequirements: string
  nursingItemIds: string
  qualityGate: string
}

export interface AssessmentTemplateFormState {
  name: string
  scene: AssessmentScene
  targetLevels: string
  ruleSetId: string
  nursingItemIds: string
  evidenceRequirements: string
  conclusionSummary: string
  followupAction: string
}

export interface AssessmentConfigObservability {
  enabledNursingItems: number
  activeRuleSets: number
  activeTemplates: number
  pendingReviews: number
  levelCoverage: number
}

export interface AssessmentConfigSnapshot {
  nursingItems: NursingCatalogItem[]
  ruleSets: AssessmentRuleSetRecord[]
  templates: AssessmentTemplateRecord[]
  observability: AssessmentConfigObservability
  loading: boolean
  error: string
}

interface AssessmentConfigState {
  nursingItems: NursingCatalogItem[]
  ruleSets: AssessmentRuleSetRecord[]
  templates: AssessmentTemplateRecord[]
}

export interface AssessmentConfigRecommendation {
  scene: AssessmentScene
  ruleSet: AssessmentRuleSetRecord | null
  template: AssessmentTemplateRecord | null
  nursingItems: NursingCatalogItem[]
}

export const EMPTY_NURSING_ITEM_FORM: NursingItemFormState = {
  name: '',
  category: '基础照护',
  serviceModes: '居家护理，机构护理',
  durationLabel: '',
  evidenceRequirements: '',
  applicableLevels: '二级护理',
  description: '',
}

export const EMPTY_RULE_SET_FORM: AssessmentRuleSetFormState = {
  name: '',
  version: 'v1.0',
  scene: '首次认定',
  applicableLevels: '二级护理',
  scoreRangeLabel: '',
  thresholdSummary: '',
  evidenceRequirements: '',
  nursingItemIds: '',
  qualityGate: '',
}

export const EMPTY_TEMPLATE_FORM: AssessmentTemplateFormState = {
  name: '',
  scene: '首次认定',
  targetLevels: '二级护理',
  ruleSetId: '',
  nursingItemIds: '',
  evidenceRequirements: '',
  conclusionSummary: '',
  followupAction: '',
}

const STORAGE_KEY = 'nursing-admin-v2/assessment-config-workflow'
const listeners = new Set<() => void>()

let workflowState = createInitialState()
let snapshotState = buildSnapshot(workflowState)
let hasLoaded = false

function splitList(value: string) {
  return value
    .split(/[，,、\n]/)
    .map(item => item.trim())
    .filter(Boolean)
}

function toCareLevels(value: string) {
  const levels = splitList(value)
  return levels.filter((item): item is CareLevel => ['特级护理', '一级护理', '二级护理', '三级护理'].includes(item))
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function getNowLabel() {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
}

function emit() {
  listeners.forEach(listener => listener())
}

function persist() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workflowState))
}

function buildSnapshot(state: AssessmentConfigState): AssessmentConfigSnapshot {
  const enabledNursingItems = state.nursingItems.filter(item => item.status === '已启用').length
  const activeRuleSets = state.ruleSets.filter(item => item.status === '已生效').length
  const activeTemplates = state.templates.filter(item => item.status === '已启用').length
  const pendingReviews = state.ruleSets.filter(item => item.status === '待复核').length + state.templates.filter(item => item.status === '待复核').length
  const levelCoverage = new Set(state.ruleSets.flatMap(item => item.applicableLevels)).size

  return {
    nursingItems: state.nursingItems,
    ruleSets: state.ruleSets,
    templates: state.templates,
    observability: {
      enabledNursingItems,
      activeRuleSets,
      activeTemplates,
      pendingReviews,
      levelCoverage,
    },
    loading: false,
    error: '',
  }
}

function mergeSeededRecords<T extends { id: string }>(seeded: T[], stored: T[]) {
  const storedMap = new Map(stored.map(item => [item.id, item]))
  const mergedSeeded = seeded.map(seed => {
    const current = storedMap.get(seed.id)
    return current ? { ...current, ...seed } : seed
  })
  const extras = stored.filter(item => !seeded.some(seed => seed.id === item.id))
  return [...mergedSeeded, ...extras]
}

function syncState(nextState: AssessmentConfigState) {
  workflowState = nextState
  snapshotState = buildSnapshot(nextState)
  persist()
  emit()
}

function ensureLoaded() {
  if (hasLoaded || typeof window === 'undefined') {
    return
  }

  hasLoaded = true
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    snapshotState = buildSnapshot(workflowState)
    return
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AssessmentConfigState>
    if (Array.isArray(parsed.nursingItems) && Array.isArray(parsed.ruleSets) && Array.isArray(parsed.templates)) {
      const seededState = createInitialState()
      workflowState = {
        nursingItems: mergeSeededRecords(seededState.nursingItems, parsed.nursingItems),
        ruleSets: mergeSeededRecords(seededState.ruleSets, parsed.ruleSets),
        templates: mergeSeededRecords(seededState.templates, parsed.templates),
      }
      snapshotState = buildSnapshot(workflowState)
      persist()
      return
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
  }

  workflowState = createInitialState()
  snapshotState = buildSnapshot(workflowState)
}

function createInitialState(): AssessmentConfigState {
  const nursingItems: NursingCatalogItem[] = [
    {
      id: 'item-home-safety',
      code: 'NI-001',
      name: '居家环境与风险评估',
      category: '风险干预',
      serviceModes: ['居家护理'],
      durationLabel: '45 分钟/次',
      evidenceRequirements: ['现场照片', '风险点清单', '家属确认'],
      applicableLevels: ['一级护理', '二级护理'],
      description: '用于首评阶段核验居家场景下的照护风险、辅助器具和环境安全条件。',
      owner: '评定规则组',
      linkedRuleSets: 2,
      status: '已启用',
      updatedAt: '03-28 10:30',
    },
    {
      id: 'item-adl-observation',
      code: 'NI-002',
      name: 'ADL 现场观察',
      category: '基础照护',
      serviceModes: ['机构护理', '居家护理', '社区护理'],
      durationLabel: '30 分钟/次',
      evidenceRequirements: ['观察记录', '签名确认'],
      applicableLevels: ['特级护理', '一级护理', '二级护理', '三级护理'],
      description: '围绕进食、如厕、移动、穿脱衣等核心动作形成标准观察记录。',
      owner: '评定规则组',
      linkedRuleSets: 3,
      status: '已启用',
      updatedAt: '03-29 09:20',
    },
    {
      id: 'item-cognitive-judge',
      code: 'NI-003',
      name: '认知与行为能力判定',
      category: '专项护理',
      serviceModes: ['机构护理', '居家护理'],
      durationLabel: '20 分钟/次',
      evidenceRequirements: ['认知量表', '家属补充说明'],
      applicableLevels: ['一级护理', '二级护理', '三级护理'],
      description: '用于识别认知障碍、夜间游走、服药依从性差等影响长期护理的行为表现。',
      owner: '评定规则组',
      linkedRuleSets: 2,
      status: '已启用',
      updatedAt: '03-27 16:10',
    },
    {
      id: 'item-pressure-ulcer',
      code: 'NI-004',
      name: '压疮与皮肤完整性评估',
      category: '风险干预',
      serviceModes: ['机构护理', '居家护理'],
      durationLabel: '15 分钟/次',
      evidenceRequirements: ['体表记录', '风险分层'],
      applicableLevels: ['特级护理', '一级护理'],
      description: '用于高风险失能个案的皮肤照护需求判定和翻身频次建议。',
      owner: '质控复核组',
      linkedRuleSets: 1,
      status: '已启用',
      updatedAt: '04-02 09:10',
    },
  ]

  const ruleSets: AssessmentRuleSetRecord[] = [
    {
      id: 'rule-initial-home',
      name: '居家失能首评规则集',
      version: 'v2.3',
      scene: '首次认定',
      applicableLevels: ['一级护理', '二级护理'],
      scoreRangeLabel: 'ADL 35-65 + 认知修正项',
      thresholdSummary: '满足 ADL 阈值且至少 2 项核心照护依赖，进入居家长护建议。',
      evidenceRequirements: ['身份证明', '参保材料', 'ADL 记录', '现场照片'],
      nursingItemIds: ['item-home-safety', 'item-adl-observation', 'item-cognitive-judge'],
      qualityGate: '双人复核后方可出具认定意见',
      owner: '评定规则组',
      status: '已生效',
      updatedAt: '03-30 11:10',
    },
    {
      id: 'rule-review-recheck',
      name: '复评与等级调整规则集',
      version: 'v1.6',
      scene: '复评复核',
      applicableLevels: ['特级护理', '一级护理', '二级护理'],
      scoreRangeLabel: '近 90 日状态变化 + 风险事件修正',
      thresholdSummary: '以状态变化、跌倒史、压疮风险和照护负荷变化作为复评主判断口径。',
      evidenceRequirements: ['复评申请', '近 90 日回访记录', '异常事件摘要'],
      nursingItemIds: ['item-adl-observation', 'item-cognitive-judge', 'item-pressure-ulcer'],
      qualityGate: '复评结果需由主管签名确认',
      owner: '质控复核组',
      status: '已生效',
      updatedAt: '04-02 10:20',
    },
    {
      id: 'rule-initial-critical',
      name: '高依赖首评规则集',
      version: 'v1.1',
      scene: '首次认定',
      applicableLevels: ['特级护理'],
      scoreRangeLabel: 'ADL 0-40 + 风险加权项',
      thresholdSummary: '针对高依赖个案，重点校验吞咽、翻身、压疮和夜间风险，支持特级护理首评意见。',
      evidenceRequirements: ['身份证明', '参保材料', 'ADL 记录', '风险评估单', '现场照片'],
      nursingItemIds: ['item-home-safety', 'item-adl-observation', 'item-cognitive-judge', 'item-pressure-ulcer'],
      qualityGate: '高依赖首评需主管二次复核并确认复评触发点。',
      owner: '评定规则组',
      status: '已生效',
      updatedAt: '04-03 09:10',
    },
    {
      id: 'rule-spot-check',
      name: '抽检回访规则集',
      version: 'v1.2',
      scene: '抽检回访',
      applicableLevels: ['一级护理', '二级护理', '三级护理'],
      scoreRangeLabel: '随机抽检 + 案卷一致性校验',
      thresholdSummary: '重点核验评定依据、档案一致性和回访签认完整性。',
      evidenceRequirements: ['案卷摘要', '回访记录', '影像签认'],
      nursingItemIds: ['item-home-safety', 'item-adl-observation'],
      qualityGate: '抽检异常必须进入整改闭环',
      owner: '质控复核组',
      status: '已生效',
      updatedAt: '03-26 17:05',
    },
  ]

  const templates: AssessmentTemplateRecord[] = [
    {
      id: 'template-initial-critical',
      name: '首评特级照护建议模板',
      scene: '首次认定',
      targetLevels: ['特级护理'],
      ruleSetId: 'rule-initial-critical',
      ruleSetName: '高依赖首评规则集',
      nursingItemIds: ['item-home-safety', 'item-adl-observation', 'item-cognitive-judge', 'item-pressure-ulcer'],
      nursingItemNames: ['居家环境与风险评估', 'ADL 现场观察', '认知与行为能力判定', '压疮与皮肤完整性评估'],
      evidenceRequirements: ['身份证明', 'ADL 记录', '风险评估单', '现场照片'],
      conclusionSummary: '适用于高依赖首评个案，输出特级照护建议、重点风险和 24 小时内复核要求。',
      followupAction: '认定结论生效后 24 小时内启动首次回访并核验资料完整性。',
      owner: '评定规则组',
      status: '已启用',
      updatedAt: '04-03 09:20',
    },
    {
      id: 'template-initial-l1',
      name: '首评一级照护建议模板',
      scene: '首次认定',
      targetLevels: ['一级护理'],
      ruleSetId: 'rule-initial-home',
      ruleSetName: '居家失能首评规则集',
      nursingItemIds: ['item-home-safety', 'item-adl-observation', 'item-cognitive-judge'],
      nursingItemNames: ['居家环境与风险评估', 'ADL 现场观察', '认知与行为能力判定'],
      evidenceRequirements: ['身份证明', '参保材料', 'ADL 记录', '现场照片'],
      conclusionSummary: '适用于首评阶段的高依赖个案，输出一级照护建议、风险标签和复评触发条件。',
      followupAction: '认定结论生效后 14 日内安排首次复核或家访核验。',
      owner: '评定规则组',
      status: '已启用',
      updatedAt: '04-02 16:00',
    },
    {
      id: 'template-initial-l2',
      name: '首评二级照护建议模板',
      scene: '首次认定',
      targetLevels: ['二级护理'],
      ruleSetId: 'rule-initial-home',
      ruleSetName: '居家失能首评规则集',
      nursingItemIds: ['item-home-safety', 'item-adl-observation'],
      nursingItemNames: ['居家环境与风险评估', 'ADL 现场观察'],
      evidenceRequirements: ['身份证明', 'ADL 记录', '现场照片'],
      conclusionSummary: '适用于居家场景下的中度依赖个案，输出二级照护建议与重点风险说明。',
      followupAction: '出具认定意见后 30 日内安排首次回访。',
      owner: '评定规则组',
      status: '已启用',
      updatedAt: '03-30 15:10',
    },
    {
      id: 'template-review-l1',
      name: '复评一级照护调整模板',
      scene: '复评复核',
      targetLevels: ['一级护理'],
      ruleSetId: 'rule-review-recheck',
      ruleSetName: '复评与等级调整规则集',
      nursingItemIds: ['item-adl-observation', 'item-cognitive-judge', 'item-pressure-ulcer'],
      nursingItemNames: ['ADL 现场观察', '认知与行为能力判定', '压疮与皮肤完整性评估'],
      evidenceRequirements: ['复评申请', '异常事件摘要', '压疮风险记录'],
      conclusionSummary: '适用于因功能下降或风险增加而触发等级上调的复评案件。',
      followupAction: '结论下发后 7 日内复核资料一致性。',
      owner: '质控复核组',
      status: '已启用',
      updatedAt: '04-02 11:00',
    },
    {
      id: 'template-spot-check',
      name: '抽检回访一致性模板',
      scene: '抽检回访',
      targetLevels: ['一级护理', '二级护理', '三级护理'],
      ruleSetId: 'rule-spot-check',
      ruleSetName: '抽检回访规则集',
      nursingItemIds: ['item-home-safety', 'item-adl-observation'],
      nursingItemNames: ['居家环境与风险评估', 'ADL 现场观察'],
      evidenceRequirements: ['回访记录', '案卷摘要', '影像签认'],
      conclusionSummary: '用于抽检认定一致性与文档留痕完整性。',
      followupAction: '抽检异常需在 48 小时内补齐整改说明。',
      owner: '质控复核组',
      status: '已启用',
      updatedAt: '03-29 18:00',
    },
  ]

  return {
    nursingItems,
    ruleSets,
    templates,
  }
}

function findNursingItemNames(ids: string[]) {
  return workflowState.nursingItems.filter(item => ids.includes(item.id)).map(item => item.name)
}

export function getAssessmentConfigSnapshot() {
  ensureLoaded()
  return snapshotState
}

export function subscribeAssessmentConfigWorkflow(listener: () => void) {
  ensureLoaded()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function validateNursingItemForm(form: NursingItemFormState) {
  if (!form.name.trim() || !form.durationLabel.trim() || !form.description.trim()) {
    return '请先补齐护理项名称、标准时长和适用说明。'
  }

  if (splitList(form.serviceModes).length === 0) {
    return '请至少填写一个适用服务场景。'
  }

  if (toCareLevels(form.applicableLevels).length === 0) {
    return '请至少填写一个有效的适用等级。'
  }

  return ''
}

export function validateAssessmentRuleSetForm(form: AssessmentRuleSetFormState) {
  if (!form.name.trim() || !form.version.trim() || !form.scoreRangeLabel.trim() || !form.thresholdSummary.trim() || !form.qualityGate.trim()) {
    return '请先补齐规则集名称、版本、评分区间、阈值口径和质控门禁。'
  }

  if (toCareLevels(form.applicableLevels).length === 0) {
    return '规则集至少需要覆盖一个有效等级。'
  }

  if (splitList(form.evidenceRequirements).length === 0) {
    return '规则集至少需要一项证据要求。'
  }

  return ''
}

export function validateAssessmentTemplateForm(form: AssessmentTemplateFormState) {
  if (!form.name.trim() || !form.ruleSetId.trim() || !form.conclusionSummary.trim() || !form.followupAction.trim()) {
    return '请先补齐模板名称、关联规则集、结论摘要和后续动作。'
  }

  if (toCareLevels(form.targetLevels).length === 0) {
    return '模板至少需要一个目标等级。'
  }

  return ''
}

export async function addNursingCatalogItem(form: NursingItemFormState) {
  const item: NursingCatalogItem = {
    id: createId('item'),
    code: `NI-${String(workflowState.nursingItems.length + 1).padStart(3, '0')}`,
    name: form.name.trim(),
    category: form.category,
    serviceModes: splitList(form.serviceModes),
    durationLabel: form.durationLabel.trim(),
    evidenceRequirements: splitList(form.evidenceRequirements),
    applicableLevels: toCareLevels(form.applicableLevels),
    description: form.description.trim(),
    owner: '规则配置专员',
    linkedRuleSets: 0,
    status: '草稿',
    updatedAt: getNowLabel(),
  }

  syncState({
    ...workflowState,
    nursingItems: [item, ...workflowState.nursingItems],
  })

  return item
}

export async function activateNursingCatalogItem(itemId: string) {
  syncState({
    ...workflowState,
    nursingItems: workflowState.nursingItems.map(item => item.id === itemId ? { ...item, status: '已启用', updatedAt: getNowLabel() } : item),
  })
}

export async function deactivateNursingCatalogItem(itemId: string) {
  syncState({
    ...workflowState,
    nursingItems: workflowState.nursingItems.map(item => item.id === itemId ? { ...item, status: '已停用', updatedAt: getNowLabel() } : item),
  })
}

export async function addAssessmentRuleSet(form: AssessmentRuleSetFormState) {
  const ruleSet: AssessmentRuleSetRecord = {
    id: createId('rule'),
    name: form.name.trim(),
    version: form.version.trim(),
    scene: form.scene,
    applicableLevels: toCareLevels(form.applicableLevels),
    scoreRangeLabel: form.scoreRangeLabel.trim(),
    thresholdSummary: form.thresholdSummary.trim(),
    evidenceRequirements: splitList(form.evidenceRequirements),
    nursingItemIds: splitList(form.nursingItemIds),
    qualityGate: form.qualityGate.trim(),
    owner: '规则配置专员',
    status: '草稿',
    updatedAt: getNowLabel(),
  }

  syncState({
    ...workflowState,
    ruleSets: [ruleSet, ...workflowState.ruleSets],
  })

  return ruleSet
}

export async function submitAssessmentRuleSetReview(ruleSetId: string) {
  syncState({
    ...workflowState,
    ruleSets: workflowState.ruleSets.map(ruleSet => ruleSet.id === ruleSetId ? { ...ruleSet, status: '待复核', updatedAt: getNowLabel() } : ruleSet),
  })
}

export async function publishAssessmentRuleSet(ruleSetId: string) {
  syncState({
    ...workflowState,
    ruleSets: workflowState.ruleSets.map(ruleSet => ruleSet.id === ruleSetId ? { ...ruleSet, status: '已生效', updatedAt: getNowLabel() } : ruleSet),
  })
}

export async function deactivateAssessmentRuleSet(ruleSetId: string) {
  syncState({
    ...workflowState,
    ruleSets: workflowState.ruleSets.map(ruleSet => ruleSet.id === ruleSetId ? { ...ruleSet, status: '已停用', updatedAt: getNowLabel() } : ruleSet),
  })
}

export async function addAssessmentTemplate(form: AssessmentTemplateFormState) {
  const nursingItemIds = splitList(form.nursingItemIds)
  const ruleSet = workflowState.ruleSets.find(item => item.id === form.ruleSetId)
  const template: AssessmentTemplateRecord = {
    id: createId('template'),
    name: form.name.trim(),
    scene: form.scene,
    targetLevels: toCareLevels(form.targetLevels),
    ruleSetId: form.ruleSetId,
    ruleSetName: ruleSet?.name ?? '未匹配规则集',
    nursingItemIds,
    nursingItemNames: findNursingItemNames(nursingItemIds),
    evidenceRequirements: splitList(form.evidenceRequirements),
    conclusionSummary: form.conclusionSummary.trim(),
    followupAction: form.followupAction.trim(),
    owner: '认定方案专员',
    status: '草稿',
    updatedAt: getNowLabel(),
  }

  syncState({
    ...workflowState,
    templates: [template, ...workflowState.templates],
  })

  return template
}

export async function reviewAssessmentTemplate(templateId: string) {
  syncState({
    ...workflowState,
    templates: workflowState.templates.map(template => template.id === templateId ? { ...template, status: '待复核', updatedAt: getNowLabel() } : template),
  })
}

export async function activateAssessmentTemplate(templateId: string) {
  syncState({
    ...workflowState,
    templates: workflowState.templates.map(template => template.id === templateId ? { ...template, status: '已启用', updatedAt: getNowLabel() } : template),
  })
}

export async function archiveAssessmentTemplate(templateId: string) {
  syncState({
    ...workflowState,
    templates: workflowState.templates.map(template => template.id === templateId ? { ...template, status: '已归档', updatedAt: getNowLabel() } : template),
  })
}

export function getAssessmentSceneFromStatus(status: AssessmentStatus): AssessmentScene {
  if (status === '待人工确认') {
    return '首次认定'
  }

  if (status === '计划已生成') {
    return '复评复核'
  }

  return '抽检回访'
}

export function getAssessmentConfigRecommendation(level: CareLevel, scene: AssessmentScene): AssessmentConfigRecommendation {
  ensureLoaded()

  const ruleSet = workflowState.ruleSets.find(item => item.status === '已生效' && item.scene === scene && item.applicableLevels.includes(level)) ?? null
  const template = workflowState.templates.find(item => item.status === '已启用' && item.scene === scene && item.targetLevels.includes(level) && (!ruleSet || item.ruleSetId === ruleSet.id)) ?? null
  const nursingItemIds = new Set<string>([
    ...(ruleSet?.nursingItemIds ?? []),
    ...(template?.nursingItemIds ?? []),
  ])
  const nursingItems = workflowState.nursingItems.filter(item => nursingItemIds.has(item.id))

  return {
    scene,
    ruleSet,
    template,
    nursingItems,
  }
}

export function getAssessmentConfigForCase(assessmentCase: AssessmentCase) {
  return getAssessmentConfigRecommendation(
    assessmentCase.confirmedCareLevel ?? assessmentCase.aiRecommendation.recommendedLevel,
    getAssessmentSceneFromStatus(assessmentCase.status),
  )
}