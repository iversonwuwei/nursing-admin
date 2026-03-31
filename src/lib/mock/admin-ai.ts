import { organizations } from '@/lib/data'
import { alertRecords, type AlertRecord } from '@/lib/data/alerts-data'
import { healthTrends, healthVitals } from '@/lib/data/health-data'
import type { AdmissionApplication, StaffTaskItem } from '@/lib/mock/admission-workflow'

export interface AiRuleToggle {
  id: string
  name: string
  description: string
  enabled: boolean
  scope: string
  lastUpdated: string
}

export interface AiModelStatus {
  id: string
  name: string
  version: string
  owner: string
  status: '运行中' | '灰度中' | '待回收'
  latencyMs: number
  lastUpdated: string
}

export interface AiQueryLog {
  id: string
  agent: string
  channel: string
  operator: string
  summary: string
  outcome: string
  createdAt: string
  source?: string
  focus?: string
  entityId?: string
  entityName?: string
}

export interface AiContextInferenceCard {
  id: string
  title: string
  summary: string
  action: string
  variant: AiDashboardInsight['variant']
}

export interface AiContextRuleCard {
  id: string
  ruleId: string
  title: string
  summary: string
  rollback: string
  variant: AiDashboardInsight['variant']
}

export interface AiDashboardInsight {
  id: string
  title: string
  summary: string
  value: string
  href: string
  variant: 'danger' | 'warning' | 'info' | 'primary' | 'success'
}

export interface AiHealthInsight {
  elderlyId: string
  elderlyName: string
  roomNumber: string
  severity: '高风险' | '中风险'
  title: string
  explanation: string
  action: string
  confidence: number
}

export interface AiHealthFollowupAction {
  elderlyId: string
  elderlyName: string
  title: string
  summary: string
  action: string
  severity: AiHealthInsight['severity']
  confidence: number
}

export interface AiAlertSuggestion {
  title: string
  explanation: string
  actions: string[]
  escalation: string
  confidence: number
}

export interface AiTaskRecommendation {
  taskId: string
  title: string
  elderlyName: string
  level: '立即处理' | '本班关注' | '按计划推进'
  reason: string
  slaHint: string
  confidence: number
}

export interface AiRecommendationRecord {
  id: string
  elderlyName: string
  createdAt: string
  recommendedLevel: string
  confirmedLevel: string
  status: string
  confidence: number
  reasonSummary: string
  confirmedBy: string
  planTemplateCode: string
}

export interface AiOpsReport {
  title: string
  periodLabel: string
  generatedAt: string
  overview: string
  highlights: string[]
  anomalies: string[]
  recommendedActions: string[]
}

export interface MonthlyFinanceRecord {
  month: string
  income: number
  expense: number
  profit: number
}

export interface FinanceIncomeCategory {
  name: string
  amount: number
  ratio: number
}

export interface FinanceExpenseCategory {
  item: string
  amount: number
  ratio: number
  category: string
}

export interface AiFinanceInsight {
  id: string
  title: string
  metric: string
  summary: string
  action: string
  variant: AiDashboardInsight['variant']
}

export interface DeviceMonitorPoint {
  id: string
  name: string
  room: string
  status: string
  runtimeHours: number
  metrics: {
    battery: number
    hr?: number | null
    bp?: string | null
    temp?: number | null
    spo2?: number | null
  }
  alert?: {
    level: string
    msg: string
  } | null
}

export interface DeviceAlertHistoryRecord {
  time: string
  device: string
  room: string
  type: string
  msg: string
}

export interface AiDeviceInsight {
  deviceId: string
  deviceName: string
  room: string
  severity: '高风险' | '中风险'
  summary: string
  action: string
  confidence: number
}

export interface HealthArchiveRecord {
  id: string
  name: string
  room: string
  bp: string
  bloodSugar: number
  o2: number
  lastCheck: string
  alert: string | null
}

export interface MedicationSchedule {
  name: string
  patient: string
  nextTime: string
  status: string
}

export interface AiArchiveHealthInsight {
  elderlyId: string
  elderlyName: string
  severity: '高风险' | '关注'
  title: string
  explanation: string
  action: string
  confidence: number
}

export interface IncidentDetailAiInput {
  id: string
  title: string
  level: string
  status: string
  desc: string
  handling: string[]
  nextStep: string | null
  elder: string | null
  attachments: string[]
}

export interface AiIncidentInsight {
  title: string
  summary: string
  risk: string
  actions: string[]
  closureHint: string
  confidence: number
}

export interface AiIncidentFollowupInsight {
  title: string
  summary: string
  actions: string[]
  confidence: number
}

export interface IncidentListAiInput {
  id: string
  title: string
  level: string
  status: string
  room: string
  elder: string | null
  time: string
  desc: string
}

export interface AiIncidentListInsight {
  id: string
  title: string
  summary: string
  action: string
  variant: AiDashboardInsight['variant']
}

export interface RoomListAiInput {
  id: string
  name: string
  floor: number
  type: string
  capacity: number
  occupied: number
  status: string
  org: string
}

export interface AiRoomInsight {
  id: string
  title: string
  metric: string
  summary: string
  action: string
  variant: AiDashboardInsight['variant']
}

export interface SupplyListAiInput {
  id: string
  name: string
  category: string
  unit: string
  stock: number
  minStock: number
  price: string
  supplier: string
  status: string
}

export interface AiSupplyInsight {
  id: string
  title: string
  metric: string
  summary: string
  action: string
  variant: AiDashboardInsight['variant']
}

export interface EquipmentStatusAiInput {
  id: string
  name: string
  room: string
  type: string
  status: string
  signal: number
  battery: number
  uptime: number
  lastAlert: string | null
}

export interface EquipmentListAiInput {
  id: string
  name: string
  category: string
  location: string
  status: string
  maintenanceDate: string
}

export interface EquipmentListAlarmAiInput {
  id: string
  equipmentId: string
  equipmentName: string
  type: string
  status: string
}

export interface AiEquipmentStatusInsight {
  id: string
  title: string
  summary: string
  action: string
  variant: AiDashboardInsight['variant']
}

export interface AiEquipmentListInsight {
  id: string
  title: string
  summary: string
  action: string
  variant: AiDashboardInsight['variant']
}

export interface OrganizationListAiInput {
  id: string
  name: string
  totalBeds: number
  occupiedBeds: number
  staffCount: number
  address: string
  phone: string
}

export interface AiOrganizationInsight {
  id: string
  title: string
  metric: string
  summary: string
  action: string
  variant: AiDashboardInsight['variant']
}

export interface StaffListAiInput {
  id: string
  name: string
  role: string
  department: string
  status: string
}

export interface AiStaffInsight {
  id: string
  title: string
  metric: string
  summary: string
  action: string
  variant: AiDashboardInsight['variant']
}

export interface RoomDetailAiInput {
  id: string
  type: string
  beds: number
  occupied: number
  status: string
  cleanStatus: string
  lastClean: string
  nextClean: string
  facilities: string[]
  bedOccupants: Array<{
    careLevel?: string
    elderName?: string
  }>
}

export interface AiRoomDetailInsight {
  title: string
  summary: string
  actions: string[]
  confidence: number
}

export interface SupplyDetailAiInput {
  id: string
  name: string
  category: string
  stock: number
  minStock: number
  supplier: string
  lastPurchase: string
  status: string
  history: Array<{
    date: string
    in: number
    out: number
    balance: number
  }>
}

export interface AiSupplyDetailInsight {
  title: string
  summary: string
  actions: string[]
  confidence: number
}

export interface OrganizationDetailAiInput {
  id: string
  name: string
  beds: number
  occupied: number
  staff: number
  manager: string
}

export interface AiOrganizationDetailInsight {
  title: string
  summary: string
  actions: string[]
  confidence: number
}

export interface OrganizationBedAiInput {
  name: string
  occupied: number
  reserved: number
  available: number
}

export interface OrganizationStaffAiInput {
  name: string
  role: string
  status: string
}

export interface ScheduleMatrixAiInput {
  name: string
  shifts: string[]
}

export interface AiScheduleInsight {
  id: string
  title: string
  metric: string
  summary: string
  action: string
  variant: AiDashboardInsight['variant']
}

export interface EquipmentDetailAiInput {
  id: string
  name: string
  room: string
  type: string
  status: string
  signal: number
  battery: number
  uptime: number
  maintenance: {
    last: string
    next: string
    cycle: string
  }
  history: Array<{
    time: string
    hr?: number
    spo2?: number
    note: string
  }>
}

export interface AiEquipmentDetailInsight {
  title: string
  summary: string
  actions: string[]
  confidence: number
}

export interface StaffDetailActionAiInput {
  id: string
  name: string
  role: string
  department: string
  performance: number
  attendance: number
  satisfaction: number
  schedule: Array<{
    day: string
    shift: string
  }>
}

export interface AiStaffDetailActionInsight {
  title: string
  summary: string
  actions: string[]
  confidence: number
}

export interface ElderDetailActionAiInput {
  id: string
  name: string
  roomNumber: string
  careLevel: string
  medicalHistory: string[]
  allergies: string[]
  status: string
}

export interface AiElderDetailActionInsight {
  title: string
  summary: string
  actions: string[]
  confidence: number
}

export const AI_RULE_TOGGLES: AiRuleToggle[] = [
  {
    id: 'admission-assessment',
    name: '入住评估 Agent',
    description: '基于 ADL、认知、慢病与风险备注推荐护理级别和计划模板。',
    enabled: true,
    scope: '入住办理',
    lastUpdated: '03-30 09:10',
  },
  {
    id: 'health-risk',
    name: '健康风险预警',
    description: '解释体征异常组合，生成需人工复核的重点观察建议。',
    enabled: true,
    scope: '健康总览 / Dashboard',
    lastUpdated: '03-30 09:22',
  },
  {
    id: 'task-priority',
    name: '任务优先级建议',
    description: '根据护理等级、执行状态、提醒策略给出当班优先顺序。',
    enabled: true,
    scope: '员工任务',
    lastUpdated: '03-30 09:35',
  },
  {
    id: 'alert-explainer',
    name: '报警解释与升级建议',
    description: '为健康异常、跌倒、设备失联等事件输出可执行处理建议。',
    enabled: true,
    scope: '报警中心',
    lastUpdated: '03-30 09:42',
  },
  {
    id: 'ops-brief',
    name: '运营周报摘要',
    description: '聚合入住、报警、风险与执行率，生成院长摘要草稿。',
    enabled: false,
    scope: '报表中心',
    lastUpdated: '03-30 09:48',
  },
  {
    id: 'resource-orchestration',
    name: '资源编排摘要',
    description: '为机构、房间、物资等列表页输出承接、分配与补货建议。',
    enabled: true,
    scope: '机构 / 房间 / 物资',
    lastUpdated: '03-30 10:26',
  },
  {
    id: 'equipment-watch',
    name: '设备巡检建议',
    description: '围绕设备列表与监测状态输出维保、补电与备用方案建议。',
    enabled: true,
    scope: '设备列表 / 设备状态',
    lastUpdated: '03-30 10:29',
  },
  {
    id: 'workforce-coverage',
    name: '人员覆盖摘要',
    description: '识别员工列表与排班场景中的关键岗位覆盖和替班风险。',
    enabled: true,
    scope: '员工列表 / 排班管理',
    lastUpdated: '03-30 10:31',
  },
]

export const AI_MODEL_STATUSES: AiModelStatus[] = [
  {
    id: 'm1',
    name: 'Admission Care Classifier',
    version: 'v0.9.3',
    owner: 'AI Service',
    status: '运行中',
    latencyMs: 820,
    lastUpdated: '03-30 09:10',
  },
  {
    id: 'm2',
    name: 'Health Risk Explainer',
    version: 'v0.7.8',
    owner: 'Health Service',
    status: '灰度中',
    latencyMs: 1160,
    lastUpdated: '03-30 09:26',
  },
  {
    id: 'm3',
    name: 'Ops Brief Generator',
    version: 'v0.5.2',
    owner: 'Analytics Service',
    status: '待回收',
    latencyMs: 1480,
    lastUpdated: '03-29 18:40',
  },
]

export const AI_QUERY_LOGS: AiQueryLog[] = [
  {
    id: 'Q-3001',
    agent: '入住评估 Agent',
    channel: 'Admin / 入住办理',
    operator: '护理主管',
    summary: '根据 ADL、认知状态与慢病信息生成护理级别建议。',
    outcome: '已采纳 AI 建议并生成计划模板 PLAN-A1。',
    createdAt: '03-30 09:16',
    source: 'elderly-detail',
    focus: 'elder-management',
    entityId: 'E001',
    entityName: '张桂英',
  },
  {
    id: 'Q-3002',
    agent: '风险预警 Agent',
    channel: 'Admin / 健康总览',
    operator: '值班医生',
    summary: '解释夜间血氧偏低与高压偏高组合风险。',
    outcome: '生成复测与医生复核建议，等待人工确认。',
    createdAt: '03-30 09:24',
    source: 'health-monitoring',
    focus: 'health-risk',
    entityId: 'E001',
    entityName: '张桂英',
  },
  {
    id: 'Q-3003',
    agent: '护理助手 Agent',
    channel: 'Admin / 任务中心',
    operator: '当班护理员',
    summary: '输出当前班次高 SLA 任务优先级。',
    outcome: '已将 3 条任务标记为本班重点关注。',
    createdAt: '03-30 09:31',
    source: 'staff-tasks',
    focus: 'task-priority',
    entityId: 'task-board',
    entityName: '员工任务',
  },
  {
    id: 'Q-3004',
    agent: '运营分析 Agent',
    channel: 'Admin / 报表中心',
    operator: '院长',
    summary: '生成本周运营摘要并解释报警上升原因。',
    outcome: '已生成周报草稿，等待导出。',
    createdAt: '03-30 09:44',
    source: 'financial',
    focus: 'financial-interpretation',
    entityId: '3月',
    entityName: '3月财务收支',
  },
  {
    id: 'Q-3005',
    agent: '事件复盘 Agent',
    channel: 'Admin / 健康总览',
    operator: '护理主管',
    summary: '对处理中事故生成闭环风险与复盘建议。',
    outcome: '已补充事故处理节点，待进入结案复核。',
    createdAt: '03-30 10:02',
    source: 'incidents-list',
    focus: 'incident-review',
    entityId: 'incident-board',
    entityName: '事故报告',
  },
  {
    id: 'Q-3006',
    agent: '机构运营 Agent',
    channel: 'Admin / 报表中心',
    operator: '院长',
    summary: '识别机构承接压力与资源调配机会。',
    outcome: '已生成机构承接压力摘要，等待晨会确认。',
    createdAt: '03-30 10:08',
    source: 'organizations-list',
    focus: 'organization-overview',
    entityId: 'org-board',
    entityName: '机构管理',
  },
  {
    id: 'Q-3007',
    agent: '补货策略 Agent',
    channel: 'Admin / 报表中心',
    operator: '采购专员',
    summary: '对库存不足物资生成补货优先级与采购建议。',
    outcome: '已将 2 项物资标记为需优先补货。',
    createdAt: '03-30 10:13',
    source: 'supplies-list',
    focus: 'supply-restock',
    entityId: 'supply-board',
    entityName: '物资管理',
  },
  {
    id: 'Q-3008',
    agent: '报警解释 Agent',
    channel: 'Admin / 健康总览',
    operator: '值班医生',
    summary: '对待处理报警生成升级建议与处理说明。',
    outcome: '已标出紧急事件优先级，等待人工接单。',
    createdAt: '03-30 10:18',
    source: 'alerts-center',
    focus: 'alert-escalation',
    entityId: 'alerts-board',
    entityName: '报警中心',
  },
  {
    id: 'Q-3009',
    agent: '排房协同 Agent',
    channel: 'Admin / 报表中心',
    operator: '入住协调员',
    summary: '对可入住房间生成承接顺序与空床周转建议。',
    outcome: '已标出 2 间优先可承接房间，等待人工排房确认。',
    createdAt: '03-30 10:24',
    source: 'rooms-list',
    focus: 'room-allocation',
    entityId: 'room-board',
    entityName: '房间管理',
  },
  {
    id: 'Q-3010',
    agent: '人员覆盖 Agent',
    channel: 'Admin / 任务中心',
    operator: '护理主管',
    summary: '识别员工列表中的关键岗位缺口与休假覆盖风险。',
    outcome: '已提示护理部补位检查，等待排班主管确认。',
    createdAt: '03-30 10:27',
    source: 'staff-list',
    focus: 'staff-coverage',
    entityId: 'staff-board',
    entityName: '员工列表',
  },
  {
    id: 'Q-3011',
    agent: '设备巡检 Agent',
    channel: 'Admin / 报表中心',
    operator: '后勤主管',
    summary: '对待维修和维保预警设备生成优先巡检与备用方案建议。',
    outcome: '已标出 2 台优先巡检设备，等待本班处理。',
    createdAt: '03-30 10:32',
    source: 'equipment-list',
    focus: 'equipment-patrol',
    entityId: 'equipment-board',
    entityName: '设备列表',
  },
]

export function getAiLogsForContext(context: {
  source?: string
  focus?: string
  entityId?: string
  entityName?: string
}) {
  const exact = AI_QUERY_LOGS.filter(item => {
    if (context.source && item.source !== context.source) return false
    if (context.focus && item.focus && item.focus !== context.focus) return false

    if (context.entityId) {
      const matchesEntityId = item.entityId === context.entityId
      const matchesEntityName = context.entityName ? item.entityName === context.entityName : false
      if (item.entityId || item.entityName) {
        return matchesEntityId || matchesEntityName
      }
    }

    return true
  })

  if (exact.length > 0) return exact

  return AI_QUERY_LOGS.filter(item => {
    if (context.source && item.source === context.source) return true
    if (context.focus && item.focus === context.focus) return true
    if (context.entityId && item.entityId === context.entityId) return true
    if (context.entityName && item.entityName === context.entityName) return true
    return false
  })
}

export function getAiInferenceCardsForContext(context: {
  source: string
  focus?: string
  entityId?: string
  entityName?: string
}) {
  const logs = getAiLogsForContext(context)
  const latestLog = logs[0]
  const entityLabel = context.entityName ?? '当前对象'

  if (['health-monitoring', 'elderly-detail', 'incident-detail', 'incidents-list', 'alerts-center'].includes(context.source)) {
    return [
      {
        id: 'risk-explanation',
        title: '风险解释优先',
        summary: `${entityLabel} 当前更适合输出“结论 + 解释 + 下一步动作”，避免 AI 越过人工复核直接处置。${latestLog ? ` 最近留痕为“${latestLog.summary}”。` : ''}`,
        action: latestLog?.outcome ?? '建议先完成人工复测、责任人确认或事件复盘，再决定是否进入规则治理。',
        variant: 'danger',
      },
      {
        id: 'evidence-check',
        title: '证据留痕检查',
        summary: context.focus
          ? `当前关注点为 ${context.focus}，推理说明应至少保留对象、原因、责任人与下一步动作。`
          : '当前未指定关注点，建议优先检查推理文案是否完整保留对象、原因和动作边界。',
        action: '如需核对边界，可继续转到日志审计页确认 source、focus 与 outcome 是否一致。',
        variant: 'warning',
      },
    ] satisfies AiContextInferenceCard[]
  }

  if (['staff-list', 'staff-detail', 'staff-schedule', 'staff-tasks'].includes(context.source)) {
    return [
      {
        id: 'coverage-judgement',
        title: '覆盖判断样本',
        summary: `${entityLabel} 当前更偏向班次覆盖和岗位缺口识别，AI 应只提示压力点，不直接改写排班或责任人。${latestLog ? ` 最近动作记录为“${latestLog.summary}”。` : ''}`,
        action: latestLog?.outcome ?? '建议结合休假、班次与任务量做人工复核，再决定是否调班。',
        variant: 'info',
      },
      {
        id: 'handoff-observation',
        title: '交接观察点',
        summary: '人员相关推理的价值在于帮助管理层看覆盖、交接和替班风险，而不是评价个人绩效。',
        action: '优先核对关键岗位是否有补位、交接说明是否充足、异常任务是否落到具体负责人。',
        variant: 'warning',
      },
    ] satisfies AiContextInferenceCard[]
  }

  if (['equipment-list', 'equipment-detail', 'equipment-status'].includes(context.source)) {
    return [
      {
        id: 'patrol-priority',
        title: '巡检优先级',
        summary: `${entityLabel} 当前更偏向维保、补电和备用方案排序，AI 应优先解释“为什么先看这台设备”。${latestLog ? ` 最近样本为“${latestLog.summary}”。` : ''}`,
        action: latestLog?.outcome ?? '建议先确认是否存在连续监测盲区，再安排巡检和备用设备。',
        variant: 'warning',
      },
      {
        id: 'fallback-path',
        title: '人工兜底路径',
        summary: '设备类推理必须保留人工巡检与备用设备兜底路径，不能把“解释异常”视为“问题已解决”。',
        action: '如短时间无法恢复，需回退到人工巡查或备用设备流程，并补充日志留痕。',
        variant: 'danger',
      },
    ] satisfies AiContextInferenceCard[]
  }

  return [
    {
      id: 'ops-signal',
      title: '运营解释样本',
      summary: `${entityLabel} 当前更偏向承接、分配或补货类推理，AI 价值在于帮助管理层快速看见资源压力和优先级。${latestLog ? ` 最近留痕为“${latestLog.summary}”。` : ''}`,
      action: latestLog?.outcome ?? '建议先由人工确认资源分配、补货或承接动作，再决定是否升级到规则治理。',
      variant: 'primary',
    },
    {
      id: 'decision-boundary',
      title: '人工确认边界',
      summary: '这类推理只提供排序、摘要和建议，不直接改写床位、采购或机构运营状态。',
      action: '优先确认负责人、执行时点和回退路径，避免 AI 建议直接进入执行链路。',
      variant: 'info',
    },
  ] satisfies AiContextInferenceCard[]
}

export function getAiRuleCardsForContext(context: {
  source: string
  focus?: string
  entityId?: string
  entityName?: string
}) {
  const logs = getAiLogsForContext(context)
  const latestLog = logs[0]
  const makeCard = (ruleId: string, summary: string, rollback: string, variant: AiDashboardInsight['variant']) => {
    const rule = AI_RULE_TOGGLES.find(item => item.id === ruleId)

    if (!rule) return null

    return {
      id: `${context.source}-${ruleId}`,
      ruleId,
      title: rule.name,
      summary: latestLog ? `${summary} 最近一条相关留痕为“${latestLog.summary}”。` : summary,
      rollback,
      variant,
    } satisfies AiContextRuleCard
  }

  const cards = ['health-monitoring', 'elderly-detail', 'incident-detail', 'incidents-list', 'alerts-center'].includes(context.source)
    ? [
        makeCard('health-risk', '需重点确认健康/事件类推理是否仍停留在解释和建议层，没有越权自动处置。', '关闭后回退为纯人工复测、人工分级与人工结案。', 'danger'),
        makeCard('alert-explainer', '需确认报警解释是否保留升级建议和责任人，而不是直接代替接单或关闭事件。', '关闭后回退为人工查看原始报警并手动决定升级路径。', 'warning'),
      ]
    : ['staff-list', 'staff-detail', 'staff-schedule', 'staff-tasks'].includes(context.source)
      ? [
          makeCard('workforce-coverage', '需确认岗位覆盖摘要只提示缺口和风险，不直接形成排班结果。', '关闭后回退为主管人工看列表、人工调班。', 'info'),
          makeCard('task-priority', '需确认任务优先级建议不会直接改写责任人、时限和完成状态。', '关闭后回退为班次负责人按原看板手工排序。', 'warning'),
        ]
      : ['equipment-list', 'equipment-detail', 'equipment-status'].includes(context.source)
        ? [
            makeCard('equipment-watch', '需确认设备巡检建议只输出优先级、补电和备用路径，不直接更改设备状态。', '关闭后回退为后勤按告警和维保计划人工巡检。', 'warning'),
            makeCard('alert-explainer', '如设备异常会影响监测能力，需确认升级建议不会跳过人工确认。', '关闭后回退为人工判断是否升级为正式事件。', 'danger'),
          ]
        : [
            makeCard('resource-orchestration', '需确认资源编排摘要只提供承接、分配和补货排序，不直接改写业务状态。', '关闭后回退为运营人员手工查看列表和生成决策。', 'primary'),
            makeCard('ops-brief', '需确认运营摘要只做聚合说明，不被误用为自动执行依据。', '关闭后回退为人工汇总报表和晨会讨论。', 'info'),
          ]

  return cards.filter((item): item is AiContextRuleCard => Boolean(item))
}

function getHealthSeverityScore(vital: (typeof healthVitals)[number]) {
  let score = 0

  score += vital.abnormalItems.length * 2

  if (vital.bloodPressureHigh >= 160) score += 2
  if (vital.bloodOxygen <= 93) score += 3
  if (vital.temperature >= 37.1) score += 1

  return score
}

function getHealthExplanation(vital: (typeof healthVitals)[number]) {
  const reasons = vital.abnormalItems.join('、')

  if (vital.bloodOxygen <= 93) {
    return `${reasons}同时出现，说明该老人存在连续低氧与循环负荷升高的组合风险。`
  }

  if (vital.bloodPressureHigh >= 155) {
    return `${reasons}，更像是持续性高压波动而非一次性测量偏差，需安排复测。`
  }

  return `${reasons}，目前更适合按重点观察路径处理，避免遗漏后续恶化。`
}

function getHealthAction(vital: (typeof healthVitals)[number]) {
  if (vital.bloodOxygen <= 93) {
    return '10 分钟内安排复测血氧并通知医生复核，必要时升级为正式健康报警。'
  }

  if (vital.bloodPressureHigh >= 155) {
    return '本班次补充两次血压复测，并核对近期用药与睡眠情况。'
  }

  return '维持当前观察频率，并在下一次护理执行时补录异常说明。'
}

function getAlertTitle(alert: AlertRecord) {
  if (alert.type === 'fall') return '疑似跌倒事件解释'
  if (alert.type === 'device') return '设备监测盲区解释'
  if (alert.type === 'health') return '健康异常解释'
  return '呼叫事件建议'
}

function getAlertActions(alert: AlertRecord) {
  if (alert.type === 'fall') {
    return ['先确认意识与疼痛情况，再排查是否需要医生到场。', '在 15 分钟内补充体征复测与现场留观记录。']
  }

  if (alert.type === 'device') {
    return ['优先恢复监测链路，避免形成连续盲区。', '若 10 分钟内无法恢复，转人工巡查并登记设备工单。']
  }

  if (alert.type === 'health') {
    return ['先复测异常指标，确认是否为连续异常。', '若合并低氧或高热，直接通知医生复核。']
  }

  return ['优先判断是否属于生活协助或紧急呼救。', '若超过 5 分钟未响应，应自动升级为值班提醒。']
}

function getAlertEscalation(alert: AlertRecord) {
  if (alert.level === 'critical') return '若 10 分钟内未形成处理记录，建议自动升级到护理主管与值班医生。'
  if (alert.type === 'device') return '若同类设备在同楼层连续 2 次失联，建议转设备部排查。'
  return '若本班内重复出现同类事件，建议生成 follow-up 任务。'
}

export function getAiDashboardInsights(applications: AdmissionApplication[]) {
  const highRiskHealthCount = healthVitals.filter(vital => getHealthSeverityScore(vital) >= 5).length
  const openAlertCount = alertRecords.filter(alert => alert.status !== 'resolved').length
  const pendingAdmissions = applications.filter(item => item.status === '待人工确认').length
  const generatedPlans = applications.filter(item => item.status !== '待人工确认').length

  return [
    {
      id: 'risk-elders',
      title: 'AI 高风险老人',
      summary: '结合体征异常组合与连续报警，建议优先查看健康总览中的重点对象。',
      value: `${highRiskHealthCount} 人`,
      href: '/health',
      variant: 'danger',
    },
    {
      id: 'open-alerts',
      title: 'AI 待解释事件',
      summary: '当前仍有报警需要解释与升级判断，建议在报警中心完成人工确认。',
      value: `${openAlertCount} 条`,
      href: '/alerts',
      variant: 'warning',
    },
    {
      id: 'pending-admissions',
      title: '待确认入住评估',
      summary: 'AI 已输出建议但尚未完成人工确认，闭环仍停留在入住办理阶段。',
      value: `${pendingAdmissions} 单`,
      href: '/elderly/checkin',
      variant: 'info',
    },
    {
      id: 'generated-plans',
      title: '已形成 AI 闭环',
      summary: '已从 AI 建议推进到计划、任务与提醒，可进入任务和通知中心继续跟踪。',
      value: `${generatedPlans} 单`,
      href: '/staff/tasks',
      variant: 'success',
    },
  ] as AiDashboardInsight[]
}

export function getAiDashboardActions(applications: AdmissionApplication[]) {
  const topRisk = getHealthAiInsights()[0]
  const pendingAdmissions = applications.filter(item => item.status === '待人工确认').length

  return [
    `优先处理 ${topRisk?.elderlyName ?? '重点老人'} 的健康风险，避免连续异常转正式报警。`,
    pendingAdmissions > 0
      ? `还有 ${pendingAdmissions} 条入住评估待护理主管确认，当前闭环未完全释放到任务中心。`
      : '入住评估链路当前无待确认项，可继续抽查已生成计划的执行回执。',
    '建议在报表中心导出 AI 周报摘要，用于院长晨会说明本周风险与执行质量。',
  ]
}

export function getHealthAiInsights() {
  return healthVitals
    .filter(vital => vital.isAbnormal)
    .sort((left, right) => getHealthSeverityScore(right) - getHealthSeverityScore(left))
    .map(vital => ({
      elderlyId: vital.elderlyId,
      elderlyName: vital.elderlyName,
      roomNumber: vital.roomNumber,
      severity: getHealthSeverityScore(vital) >= 5 ? '高风险' : '中风险',
      title: vital.abnormalItems.join(' / '),
      explanation: getHealthExplanation(vital),
      action: getHealthAction(vital),
      confidence: Math.min(97, 78 + getHealthSeverityScore(vital) * 3),
    })) satisfies AiHealthInsight[]
}

export function getHealthFollowupActions(insights: ReadonlyArray<AiHealthInsight>) {
  return insights.slice(0, 4).map(item => ({
    elderlyId: item.elderlyId,
    elderlyName: item.elderlyName,
    title: item.title,
    summary: item.explanation,
    action: item.action,
    severity: item.severity,
    confidence: item.confidence,
  })) satisfies AiHealthFollowupAction[]
}

export function getHealthTrendNarratives() {
  const latest = healthTrends[healthTrends.length - 1]
  const previous = healthTrends[healthTrends.length - 2]
  const highestPressure = Math.max(...healthTrends.map(item => item.bloodPressureHighAvg))

  return [
    latest.bloodPressureHighAvg > previous.bloodPressureHighAvg
      ? `近 24 小时平均高压从 ${previous.bloodPressureHighAvg} mmHg 回升到 ${latest.bloodPressureHighAvg} mmHg，说明高压波动仍未完全收敛。`
      : `近 24 小时平均高压从 ${previous.bloodPressureHighAvg} mmHg 回落到 ${latest.bloodPressureHighAvg} mmHg，短期控制趋势略有改善。`,
    latest.bloodOxygenAvg < 96
      ? `血氧均值目前为 ${latest.bloodOxygenAvg}% ，已逼近重点观察阈值，建议重点复核慢病与夜间监测对象。`
      : `血氧均值维持在 ${latest.bloodOxygenAvg}% ，整体仍处在可控区间。`,
    `本周高压峰值出现在 ${highestPressure} mmHg，说明异常更偏向持续性波动，而不是单点噪声。`,
  ]
}

export function getAlertAiSuggestion(alert: AlertRecord): AiAlertSuggestion {
  const confidenceBase = alert.level === 'critical' ? 93 : alert.level === 'warning' ? 87 : 80

  return {
    title: getAlertTitle(alert),
    explanation:
      alert.type === 'device'
        ? '该事件的核心风险不是设备本身，而是监测数据中断后造成的护理盲区。'
        : alert.type === 'health'
          ? '该事件更像是连续指标异常而非一次性偏差，建议以人工复测作为第一确认动作。'
          : alert.type === 'fall'
            ? '跌倒类事件需要先确认身体损伤与二次跌倒风险，再决定是否升级医疗处置。'
            : '当前更偏向服务响应场景，但若长时间无人接单，会转化为满意度和时效风险。',
    actions: getAlertActions(alert),
    escalation: getAlertEscalation(alert),
    confidence: confidenceBase,
  }
}

export function getOpenAlertAiSummary() {
  const openAlerts = alertRecords.filter(alert => alert.status !== 'resolved')
  const critical = openAlerts.filter(alert => alert.level === 'critical').length
  const device = openAlerts.filter(alert => alert.type === 'device').length

  return {
    total: openAlerts.length,
    critical,
    summary: critical > 0
      ? `当前有 ${critical} 条紧急事件仍待闭环，建议值班医生与护理主管同步跟进。`
      : '当前无紧急级未结事件，重点关注处理中和待处理的设备与健康异常。',
    deviceSummary: device > 0
      ? `${device} 条未闭环事件与设备状态有关，需防止形成连续监测盲区。`
      : '当前未发现设备盲区类未结事件。',
  }
}

export function getAiTaskRecommendations(tasks: StaffTaskItem[]) {
  return tasks
    .map(task => {
      const score =
        (task.priority === '高' ? 6 : task.priority === '中' ? 4 : 2)
        + (task.status === '执行中' ? 3 : task.status === '已生成' ? 2 : task.status === '待执行' ? 1 : 0)
        + (task.sourceStatus === '计划已生成' ? 2 : 1)
      const level: AiTaskRecommendation['level'] = score >= 9 ? '立即处理' : score >= 6 ? '本班关注' : '按计划推进'

      return {
        taskId: task.id,
        title: task.title,
        elderlyName: task.elderlyName,
        level,
        reason:
          task.priority === '高'
            ? `该任务来自${task.careLevel}，且提醒策略为${task.reminder}，更适合优先进入当班看板。`
            : `该任务优先级为${task.priority}，建议结合当前责任人与房间位置按计划推进。`,
        slaHint:
          score >= 9
            ? '建议 15 分钟内形成执行回执。'
            : score >= 6
              ? '建议本班内优先完成。'
              : '可按既定时段推进。',
        confidence: Math.min(96, 74 + score * 2),
      }
    })
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, 4) satisfies AiTaskRecommendation[]
}

export function getAiRecommendationRecords(applications: AdmissionApplication[]) {
  return [...applications]
    .sort((left, right) => (right.createdAt > left.createdAt ? 1 : -1))
    .slice(0, 6)
    .map(item => ({
      id: item.id,
      elderlyName: item.name,
      createdAt: item.createdAt,
      recommendedLevel: item.aiRecommendation.recommendedLevel,
      confirmedLevel: item.confirmedCareLevel ?? '待确认',
      status: item.status,
      confidence: item.aiRecommendation.confidence,
      reasonSummary: item.aiRecommendation.reasonSummary,
      confirmedBy: item.confirmedBy ?? '待人工确认',
      planTemplateCode: item.aiRecommendation.planTemplateCode,
    })) satisfies AiRecommendationRecord[]
}

export function getAiOpsReport(period: '周报' | '月报', applications: AdmissionApplication[]): AiOpsReport {
  const totalBeds = organizations.reduce((sum, item) => sum + item.totalBeds, 0)
  const occupiedBeds = organizations.reduce((sum, item) => sum + item.occupiedBeds, 0)
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
  const unresolvedAlerts = alertRecords.filter(item => item.status !== 'resolved').length
  const abnormalHealth = healthVitals.filter(item => item.isAbnormal).length
  const generatedPlans = applications.filter(item => item.status !== '待人工确认').length
  const generatedAt = new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())

  return {
    title: period === '周报' ? 'AI 院长周报草稿' : 'AI 月度经营摘要',
    periodLabel: period === '周报' ? '近 7 天' : '近 30 天',
    generatedAt,
    overview:
      period === '周报'
        ? `本周机构运营整体稳定，床位入住率保持在 ${occupancyRate}% ，但健康异常与未闭环报警仍集中在重点关注老人群体，建议继续把 AI 解释结果前置到晨会和交接班。`
        : `本月机构入住率维持在 ${occupancyRate}% 的高位，AI 入住评估已形成 ${generatedPlans} 条建议闭环，但风险预警和报表自动生成仍处在半自动阶段。`,
    highlights: [
      `当前共有 ${generatedPlans} 条入住记录已从 AI 建议推进到护理计划或已入住状态。`,
      `健康总览中有 ${abnormalHealth} 位老人处于异常观察状态，适合纳入值班重点名单。`,
      `未闭环报警 ${unresolvedAlerts} 条，其中高优先级事件建议继续走人工复核。`,
    ],
    anomalies: [
      '连续高压与低氧组合异常仍然集中在少数高风险老人，说明当前观察资源需要更聚焦。',
      '设备失联类事件虽然数量不高，但一旦叠加健康监测对象，会显著放大风险盲区。',
      period === '周报'
        ? 'AI 运营摘要已具备展示价值，但规则启停与模型状态还未形成独立治理台账。'
        : '月度报表导出链路仍依赖人工点击，尚未形成自动订阅与送达回执。',
    ],
    recommendedActions: [
      '继续推进报警解释卡与健康解释卡的人工确认流程，避免 AI 输出停留在只读状态。',
      '将任务中心的 AI 优先级建议纳入交接班模板，提升班次切换时的关注一致性。',
      '在 AI 运营入口统一查看模型版本、规则开关和问答日志，降低分散维护成本。',
    ],
  }
}

export function getFinancialAiInsights(
  monthly: ReadonlyArray<MonthlyFinanceRecord>,
  incomeCategories: ReadonlyArray<FinanceIncomeCategory>,
  expenses: ReadonlyArray<FinanceExpenseCategory>,
) {
  const current = monthly[0]
  const previous = monthly[1] ?? current
  const margin = current.income > 0 ? Math.round((current.profit / current.income) * 100) : 0
  const previousMargin = previous.income > 0 ? Math.round((previous.profit / previous.income) * 100) : margin
  const marginDelta = margin - previousMargin
  const topIncome = [...incomeCategories].sort((left, right) => right.amount - left.amount)[0]
  const topExpense = [...expenses].sort((left, right) => right.amount - left.amount)[0]
  const laborExpense = expenses.find(item => item.category === '人力' || item.item.includes('工资'))

  return [
    {
      id: 'finance-margin',
      title: '利润率解读',
      metric: `${margin}%`,
      summary:
        marginDelta >= 0
          ? `本月利润率较上月提升 ${Math.abs(marginDelta)} 个点，当前经营结构仍处在可控区间。`
          : `本月利润率较上月回落 ${Math.abs(marginDelta)} 个点，需核对成本波动是否会延续到下月。`,
      action: '优先复核本月新增支出项与一次性成本，确认是否需要修正预算。',
      variant: marginDelta >= 0 ? 'success' : 'warning',
    },
    {
      id: 'finance-income',
      title: '收入集中度',
      metric: `${topIncome?.ratio ?? 0}%`,
      summary: `${topIncome?.name ?? '主收入项'}仍是主要收入来源，当前收入结构对床位利用率变化较为敏感。`,
      action: '建议把续住率、空床填充率和护理增值服务一起纳入下周经营跟踪。',
      variant: 'info',
    },
    {
      id: 'finance-expense',
      title: '成本压力点',
      metric: `¥${(topExpense?.amount ?? 0).toLocaleString()}`,
      summary: `${topExpense?.item ?? '主要支出'}是本月最大支出项${laborExpense ? `，其中人力成本占比 ${laborExpense.ratio}%` : ''}。`,
      action: '建议结合排班、耗材消耗和设备维护单，核对是否存在可优化的重复支出。',
      variant: topExpense?.ratio && topExpense.ratio >= 50 ? 'warning' : 'primary',
    },
  ] satisfies AiFinanceInsight[]
}

export function getFinancialAiNarratives(
  monthly: ReadonlyArray<MonthlyFinanceRecord>,
  expenses: ReadonlyArray<FinanceExpenseCategory>,
) {
  const current = monthly[0]
  const previous = monthly[1] ?? current
  const expenseDelta = current.expense - previous.expense
  const maintenanceExpense = expenses.find(item => item.category === '维护')

  return [
    expenseDelta > 0
      ? `本月支出较上月增加 ¥${expenseDelta.toLocaleString()}，建议先拆分为人力、耗材和维护三类来源查看是否属于阶段性上升。`
      : `本月支出较上月减少 ¥${Math.abs(expenseDelta).toLocaleString()}，当前成本控制方向有效，但仍需验证是否影响服务质量。`,
    maintenanceExpense
      ? `设备维护支出为 ¥${maintenanceExpense.amount.toLocaleString()}，适合和设备告警页联动查看是否存在重复故障。`
      : '本月未识别出明显的设备维护支出异常，可继续关注人力与医疗物资波动。',
    'AI 当前只做经营解读和关注点归纳，不自动记账或改写正式财务报表。',
  ]
}

export function getDeviceAiInsights(
  points: ReadonlyArray<DeviceMonitorPoint>,
  alerts: ReadonlyArray<DeviceAlertHistoryRecord>,
) {
  return [...points]
    .filter(point => point.status !== 'online' || Boolean(point.alert) || point.metrics.battery < 50)
    .sort((left, right) => {
      const leftScore = (left.status !== 'online' ? 4 : 0) + (left.alert?.level === 'danger' ? 3 : left.alert ? 2 : 0)
      const rightScore = (right.status !== 'online' ? 4 : 0) + (right.alert?.level === 'danger' ? 3 : right.alert ? 2 : 0)
      return rightScore - leftScore
    })
    .slice(0, 4)
    .map(point => {
      const relatedAlert = alerts.find(item => item.device.includes(point.name.replace(/ #\d+$/, '')))
      const isHighRisk = point.status !== 'online' || point.alert?.level === 'danger'

      return {
        deviceId: point.id,
        deviceName: point.name,
        room: point.room,
        severity: isHighRisk ? '高风险' : '中风险',
        summary:
          point.status !== 'online'
            ? '设备当前处于离线状态，核心风险是监测盲区而不是单次数据缺失。'
            : point.alert
              ? `${point.alert.msg}，若继续叠加运行时长和电量下降，容易在交接班时被忽略。`
              : '设备虽然在线，但电量已进入关注区，适合在下一轮巡检前完成补电。',
        action:
          point.status !== 'online'
            ? '10 分钟内确认电源与网络连接，未恢复则转人工巡房并登记工单。'
            : point.metrics.battery < 50
              ? '本班内安排补电或更换设备，避免在夜间形成连续盲区。'
              : `优先复核 ${relatedAlert?.msg ?? '最新异常记录'}，确认是否已形成处理闭环。`,
        confidence: isHighRisk ? 93 : 85,
      }
    }) satisfies AiDeviceInsight[]
}

export function getDeviceAiOverview(
  points: ReadonlyArray<DeviceMonitorPoint>,
  alerts: ReadonlyArray<DeviceAlertHistoryRecord>,
) {
  const offline = points.filter(point => point.status !== 'online').length
  const lowBattery = points.filter(point => point.metrics.battery < 50).length
  const dangerAlerts = alerts.filter(item => item.type === 'danger').length

  return [
    offline > 0
      ? `当前有 ${offline} 台设备离线，AI 建议先按“恢复监测链路”而不是“排查指标异常”来处理。`
      : '当前未发现离线设备，设备侧风险主要集中在预警和低电量对象。',
    lowBattery > 0
      ? `${lowBattery} 台设备电量低于 50%，如果与高龄重点老人绑定，建议前置到本班巡检清单。`
      : '当前设备电量整体稳定，可把注意力转向重复告警设备。',
    dangerAlerts > 0
      ? `最近告警记录中有 ${dangerAlerts} 条高等级事件，适合和事故/报警页联动排查是否形成服务盲区。`
      : '最近高等级设备告警较少，当前适合以预防性维护为主。',
  ]
}

export function getHealthArchiveAiInsights(records: ReadonlyArray<HealthArchiveRecord>) {
  return [...records]
    .filter(record => record.alert || Number.parseFloat(record.bp.split('/')[0]) >= 140 || record.bloodSugar >= 7 || record.o2 <= 95)
    .sort((left, right) => {
      const leftScore = (left.alert ? 3 : 0) + (left.o2 <= 95 ? 2 : 0) + (left.bloodSugar >= 7 ? 2 : 0)
      const rightScore = (right.alert ? 3 : 0) + (right.o2 <= 95 ? 2 : 0) + (right.bloodSugar >= 7 ? 2 : 0)
      return rightScore - leftScore
    })
    .slice(0, 4)
    .map(record => {
      const systolic = Number.parseFloat(record.bp.split('/')[0])
      const reasons = [
        record.alert,
        systolic >= 140 ? '血压波动' : null,
        record.bloodSugar >= 7 ? '血糖偏高' : null,
        record.o2 <= 95 ? '血氧偏低' : null,
      ].filter(Boolean).join('、')
      const highRisk = Boolean(record.alert) || record.o2 <= 95

      return {
        elderlyId: record.id,
        elderlyName: record.name,
        severity: highRisk ? '高风险' : '关注',
        title: reasons || '重点复核对象',
        explanation: `${record.name} 最近一次测量时间为 ${record.lastCheck}，当前更像是连续偏高或偏低信号，需要结合本班巡诊和用药记录一起复核。`,
        action: highRisk
          ? '建议优先安排复测并通知值班护士确认，必要时同步家属摘要。'
          : '建议在下一轮测量时重点关注，并补录异常原因说明。',
        confidence: highRisk ? 91 : 83,
      }
    }) satisfies AiArchiveHealthInsight[]
}

export function getMedicationAiSummary(medications: ReadonlyArray<MedicationSchedule>) {
  const pending = medications.filter(item => item.status === '待服用')

  if (pending.length === 0) {
    return '当前无待服用项目，AI 建议重点复核已执行记录是否已同步到护理执行回执。'
  }

  const earliest = [...pending].sort((left, right) => left.nextTime.localeCompare(right.nextTime))[0]
  return `当前仍有 ${pending.length} 项待服用，最早一项是 ${earliest.patient} 的 ${earliest.name}（${earliest.nextTime}），建议先和健康异常对象联动核对是否需要优先给药。`
}

export function getIncidentAiInsight(incident: IncidentDetailAiInput): AiIncidentInsight {
  const isFall = incident.title.includes('摔倒')
  const isDevice = incident.title.includes('设备')
  const isMissing = incident.title.includes('走失')
  const isProcessing = incident.status === '处理中'

  return {
    title: isFall ? 'AI 事件复盘建议' : isDevice ? 'AI 处置解释' : 'AI 跟进建议',
    summary:
      isFall
        ? '该事件重点不是单次受伤描述，而是是否已经完成二次跌倒风险和后续观察路径确认。'
        : isDevice
          ? '该事件的核心在于是否造成了巡查、照明或监测的服务盲区，而不只是设备是否修复。'
          : isMissing
            ? '走失类事件需要把找回结果、门禁改进和高风险时段策略视为同一个闭环。'
            : '当前事件已具备基础记录，AI 更适合补充后续跟进和结案标准。',
    risk:
      isProcessing
        ? '目前仍处于处理中状态，若没有明确下一步负责人和复核时间，闭环容易停留在说明层面。'
        : '虽然当前状态已结案，但仍建议检查是否已经沉淀为制度或巡检改进动作。',
    actions: [
      incident.handling[0] ?? '补充首个处置动作记录。',
      incident.handling[1] ?? '补充第二个关键节点记录。',
      incident.nextStep ?? '补充后续复盘或制度修订动作。',
    ],
    closureHint: isProcessing
      ? '结案前建议确认：人员已通知、复测/修复已完成、后续观察或预防动作已落表。'
      : '建议把本事件对应的预防动作沉淀到巡检、门禁或培训清单，避免只结案不复盘。',
    confidence: incident.level === '严重' ? 94 : 86,
  }
}

export function getIncidentFollowupInsight(incident: IncidentDetailAiInput): AiIncidentFollowupInsight {
  const attachmentCount = incident.attachments.length
  const handlingCount = incident.handling.length
  const isProcessing = incident.status === '处理中'

  return {
    title: 'AI 复盘追踪',
    summary: isProcessing
      ? `当前仍处于处理中，已记录 ${handlingCount} 个处理节点、${attachmentCount} 份附件，适合继续追踪负责人、复核时点和结案前置条件。`
      : `当前事件虽已结案，但仍保留 ${attachmentCount} 份材料，适合继续追踪是否已沉淀为制度和巡检动作。`,
    actions: [
      incident.nextStep ?? '补充下一步复诊、复查或制度修订安排。',
      attachmentCount > 0 ? '建议在结案前复核附件是否足以支撑复盘与问责留痕。' : '建议补充现场照片、病历或维修记录，避免复盘依据不足。',
      isProcessing ? '建议同步 AI 运营中心日志页，确认本事件的解释、通知和处理动作是否都已留痕。' : '建议将本事件的预防动作沉淀到巡检清单或培训清单。',
    ],
    confidence: incident.level === '严重' ? 92 : 85,
  }
}

export function getIncidentListAiInsights(incidents: ReadonlyArray<IncidentListAiInput>) {
  const processing = incidents.filter(item => item.status === '处理中')
  const severe = incidents.filter(item => item.level === '严重')
  const latestProcessing = [...processing].sort((left, right) => right.time.localeCompare(left.time))[0]

  return [
    {
      id: 'incident-processing',
      title: '处理中事件',
      summary: processing.length > 0
        ? `当前有 ${processing.length} 条事件仍在处理中，最新一条是 ${latestProcessing?.title ?? '重点事件'}，闭环风险集中在后续责任人与复核时间。`
        : '当前没有处理中事件，适合转向已结案事件的复盘与制度沉淀。',
      action: processing.length > 0
        ? '优先补齐处理中事件的下一步负责人和复核时间，避免事故长期停留在说明层。'
        : '抽查最近已结案事件，确认是否已经沉淀到巡检或培训动作。',
      variant: processing.length > 0 ? 'danger' : 'success',
    },
    {
      id: 'incident-severe',
      title: '严重事件复盘',
      summary: severe.length > 0
        ? `严重事件共 ${severe.length} 条，建议把跌倒、走失等高影响场景单独形成复盘模板。`
        : '当前未发现严重事件，事故页可更多用于过程沉淀与教育复盘。',
      action: '把高等级事件的“通知对象、后续观察、预防动作”纳入固定结案检查项。',
      variant: severe.length > 0 ? 'warning' : 'info',
    },
  ] satisfies AiIncidentListInsight[]
}

export function getIncidentListNarratives(incidents: ReadonlyArray<IncidentListAiInput>) {
  const byType = incidents.reduce<Record<string, number>>((accumulator, item) => {
    accumulator[item.title] = (accumulator[item.title] ?? 0) + 1
    return accumulator
  }, {})
  const topType = Object.entries(byType).sort((left, right) => right[1] - left[1])[0]

  return [
    topType
      ? `当前事故记录中“${topType[0]}”是最常见类型，适合优先形成标准复盘话术和预防动作模板。`
      : '当前事故类型分布较均匀，建议继续按场景积累复盘模板。',
    'AI 在事故列表页的价值是帮助管理层快速看见“哪类事件需要先复盘”，而不是替代正式事故认定。',
  ]
}

export function getRoomAiInsights(rooms: ReadonlyArray<RoomListAiInput>) {
  const totalCapacity = rooms.reduce((sum, item) => sum + item.capacity, 0)
  const totalOccupied = rooms.reduce((sum, item) => sum + item.occupied, 0)
  const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0
  const availableRooms = rooms.filter(item => item.status === '可入住')
  const emptyRooms = rooms.filter(item => item.occupied === 0)

  return [
    {
      id: 'room-occupancy',
      title: '床位利用率',
      metric: `${occupancyRate}%`,
      summary: `当前房间整体入住率为 ${occupancyRate}% ，管理重点不是总量，而是可入住房间是否足够支撑近期入住转化。`,
      action: '建议把空房和部分空床房按楼层、护理等级和房型重新整理成快速分配清单。',
      variant: occupancyRate >= 80 ? 'warning' : 'success',
    },
    {
      id: 'room-available',
      title: '可分配房间',
      metric: `${availableRooms.length} 间`,
      summary: emptyRooms.length > 0
        ? `其中 ${emptyRooms.length} 间为空房，可优先用于高匹配度入住安排。`
        : '当前可入住房间多为部分空床房，分配时需优先考虑同房匹配与护理强度。',
      action: '把“可立即入住”和“需二次确认床位”的房间在入住页分开提示。',
      variant: availableRooms.length > 0 ? 'info' : 'danger',
    },
  ] satisfies AiRoomInsight[]
}

export function getRoomAiNarratives(rooms: ReadonlyArray<RoomListAiInput>) {
  const byOrg = rooms.reduce<Record<string, { capacity: number; occupied: number }>>((accumulator, item) => {
    accumulator[item.org] ??= { capacity: 0, occupied: 0 }
    accumulator[item.org].capacity += item.capacity
    accumulator[item.org].occupied += item.occupied
    return accumulator
  }, {})
  const hottestOrg = Object.entries(byOrg)
    .map(([name, stat]) => ({ name, rate: stat.capacity > 0 ? Math.round((stat.occupied / stat.capacity) * 100) : 0 }))
    .sort((left, right) => right.rate - left.rate)[0]

  return [
    hottestOrg
      ? `${hottestOrg.name} 当前床位使用率最高，建议优先核对该分院近期可入住房间和待入住名单的匹配情况。`
      : '当前暂无机构级差异信号。',
    '房间页的 AI 重点应放在分配建议和入住承接能力，而不是自动替代排房决策。',
  ]
}

export function getSupplyAiInsights(supplies: ReadonlyArray<SupplyListAiInput>) {
  const lowStock = supplies.filter(item => item.stock < item.minStock)
  const mostUrgent = [...lowStock].sort((left, right) => (left.stock / left.minStock) - (right.stock / right.minStock))[0]
  const nursingSupplies = lowStock.filter(item => item.category === '护理用品').length

  return [
    {
      id: 'supply-low-stock',
      title: '低库存风险',
      metric: `${lowStock.length} 项`,
      summary: lowStock.length > 0
        ? `当前有 ${lowStock.length} 项库存低于安全线，最紧急的是 ${mostUrgent?.name ?? '重点物资'}。`
        : '当前库存均高于最低安全线，可转向采购节奏和周转率管理。',
      action: lowStock.length > 0
        ? '建议先锁定护理用品与高频消耗品的补货单，避免缺货直接影响一线执行。'
        : '建议继续按分类跟踪月度消耗波动，提前识别下一批补货窗口。',
      variant: lowStock.length > 0 ? 'danger' : 'success',
    },
    {
      id: 'supply-category',
      title: '护理用品关注',
      metric: `${nursingSupplies} 项`,
      summary: nursingSupplies > 0
        ? `低库存物资中有 ${nursingSupplies} 项属于护理用品，说明对班次执行影响更直接。`
        : '当前护理用品库存相对稳定，可重点关注消毒与防护用品的补货节奏。',
      action: '采购建议优先按“直接影响护理执行”与“可延后采购”两层排序。',
      variant: nursingSupplies > 0 ? 'warning' : 'info',
    },
  ] satisfies AiSupplyInsight[]
}

export function getSupplyAiNarratives(supplies: ReadonlyArray<SupplyListAiInput>) {
  const totalGap = supplies
    .filter(item => item.stock < item.minStock)
    .reduce((sum, item) => sum + (item.minStock - item.stock), 0)

  return [
    totalGap > 0
      ? `按最低安全线估算，当前至少还缺 ${totalGap} 个单位的物资补足量，适合先生成一张最小采购单。`
      : '当前物资整体充足，AI 更适合辅助识别潜在波动而非发起紧急采购。',
    '物资页的 AI 建议应强调补货优先级和缺货风险，不直接替代正式采购审批。',
  ]
}

export function getEquipmentStatusAiInsights(devices: ReadonlyArray<EquipmentStatusAiInput>) {
  const unstable = devices.filter(item => item.status !== 'online' || item.signal <= 45 || item.battery <= 20)
  return unstable
    .sort((left, right) => {
      const leftScore = (left.status === 'offline' ? 4 : left.status === 'warning' ? 2 : 0) + (left.battery <= 20 ? 2 : 0) + (left.signal <= 30 ? 2 : 0)
      const rightScore = (right.status === 'offline' ? 4 : right.status === 'warning' ? 2 : 0) + (right.battery <= 20 ? 2 : 0) + (right.signal <= 30 ? 2 : 0)
      return rightScore - leftScore
    })
    .slice(0, 4)
    .map(item => ({
      id: item.id,
      title: item.name,
      summary: item.status === 'offline'
        ? `设备当前离线，位于 ${item.room}，重点风险是该位置可能失去连续监测或呼叫能力。`
        : `${item.room} 的设备处于异常状态，当前信号 ${item.signal}% 、电量 ${item.battery}% ，需要尽快处理。`,
      action: item.status === 'offline'
        ? '优先检查电源与网络连接，若短时间无法恢复则转人工巡查或备用设备。'
        : item.battery <= 20
          ? '建议本班内优先补电或更换，避免从异常转为离线。'
          : '建议复核设备位置和信号源，确认是否为环境导致的弱连接。',
      variant: item.status === 'offline' ? 'danger' : 'warning',
    })) satisfies AiEquipmentStatusInsight[]
}

export function getEquipmentStatusNarratives(devices: ReadonlyArray<EquipmentStatusAiInput>) {
  const warningCount = devices.filter(item => item.status === 'warning').length
  const offlineCount = devices.filter(item => item.status === 'offline').length
  const lowBattery = devices.filter(item => item.battery <= 20).length

  return [
    offlineCount > 0
      ? `当前有 ${offlineCount} 台设备离线，应优先按“恢复监测能力”而不是“查看单台参数”来组织处理顺序。`
      : `当前无离线设备，但仍有 ${warningCount} 台设备处于异常状态，适合在本班内完成补电或位置排查。`,
    lowBattery > 0
      ? `${lowBattery} 台设备已接近电量耗尽，建议把补电动作并入例行巡检，避免夜间集中出问题。`
      : '当前设备电量总体可控，可把重点转向异常信号和重复告警对象。',
  ]
}

export function getEquipmentListAiInsights(devices: ReadonlyArray<EquipmentListAiInput>, alarms: ReadonlyArray<EquipmentListAlarmAiInput>) {
  const repairDevices = devices.filter(item => item.status === '维修中' || item.status === '待维修')
  const pendingAlarms = alarms.filter(item => item.status === '待处理')
  const maintenanceDue = pendingAlarms.filter(item => item.type.includes('维保')).length
  const topRepair = repairDevices[0]

  return [
    {
      id: 'equipment-repair',
      title: '维修优先设备',
      summary: repairDevices.length > 0
        ? `当前共有 ${repairDevices.length} 台设备处于维修相关状态，${topRepair?.name ?? '重点设备'} 需优先确认是否影响连续服务。`
        : '当前无维修中或待维修设备，AI 更适合继续盯维保到期和待处理告警。',
      action: repairDevices.length > 0
        ? '建议先核对维修中设备是否已有备用方案，再安排本班巡检顺序。'
        : '建议把注意力转到低电量、维保到期和待处理告警设备。',
      variant: repairDevices.length > 0 ? 'danger' : 'success',
    },
    {
      id: 'equipment-maintenance',
      title: '维保与告警',
      summary: pendingAlarms.length > 0
        ? `当前有 ${pendingAlarms.length} 条待处理设备告警，其中 ${maintenanceDue} 条与维保相关。`
        : '当前无待处理设备告警，适合继续维持例行巡检节奏。',
      action: '建议把维保到期、故障和电量不足拆成不同处理通道，避免都落入同一待办。',
      variant: pendingAlarms.length > 0 ? 'warning' : 'info',
    },
  ] satisfies AiEquipmentListInsight[]
}

export function getEquipmentListAiNarratives(devices: ReadonlyArray<EquipmentListAiInput>, alarms: ReadonlyArray<EquipmentListAlarmAiInput>) {
  const smartDevices = devices.filter(item => item.category === '智能设备').length
  const pendingAlarms = alarms.filter(item => item.status === '待处理').length

  return [
    pendingAlarms > 0
      ? `当前设备列表更需要优先回答“哪几台先巡检、哪几台需准备备用方案”，而不是平均分配处理精力。`
      : '当前设备整体稳定，可把重点转向维保节奏和关键位置设备连续可用性。',
    smartDevices > 0
      ? `当前共有 ${smartDevices} 台智能设备，建议把监测盲区和备用策略纳入同一张巡检清单。`
      : '当前智能设备占比较低，可优先关注传统设备的维保计划与故障恢复。',
  ]
}

export function getOrganizationAiInsights(organizationsList: ReadonlyArray<OrganizationListAiInput>) {
  const highestOccupancy = [...organizationsList]
    .map(item => ({ ...item, rate: item.totalBeds > 0 ? Math.round((item.occupiedBeds / item.totalBeds) * 100) : 0 }))
    .sort((left, right) => right.rate - left.rate)[0]
  const totalBeds = organizationsList.reduce((sum, item) => sum + item.totalBeds, 0)
  const totalOccupied = organizationsList.reduce((sum, item) => sum + item.occupiedBeds, 0)
  const totalStaff = organizationsList.reduce((sum, item) => sum + item.staffCount, 0)
  const avgOccupancy = totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0
  const staffPer100Beds = totalBeds > 0 ? Math.round((totalStaff / totalBeds) * 100) : 0

  return [
    {
      id: 'org-occupancy',
      title: '机构承接压力',
      metric: `${avgOccupancy}%`,
      summary: highestOccupancy
        ? `${highestOccupancy.name} 当前入住率最高，说明机构间承接压力并不均衡。`
        : '当前暂无机构承接差异信号。',
      action: '建议把高入住率机构的空床、待入住名单和转介节奏放到同一视图内复核。',
      variant: avgOccupancy >= 85 ? 'warning' : 'success',
    },
    {
      id: 'org-staffing',
      title: '人员配置密度',
      metric: `${staffPer100Beds}/100床`,
      summary: '当前以每百床员工数粗略衡量机构配置密度，适合用来识别高入住机构的人力压力。',
      action: '建议把人员配置与入住率、报警量联动查看，而不是单看员工总数。',
      variant: staffPer100Beds >= 35 ? 'info' : 'warning',
    },
  ] satisfies AiOrganizationInsight[]
}

export function getOrganizationAiNarratives(organizationsList: ReadonlyArray<OrganizationListAiInput>) {
  const underCapacity = organizationsList.filter(item => item.totalBeds > 0 && (item.occupiedBeds / item.totalBeds) < 0.7).length

  return [
    underCapacity > 0
      ? `当前有 ${underCapacity} 家机构入住率低于 70%，适合优先做入住转化和房型匹配优化。`
      : '当前各机构入住率整体较高，更需要关注高负荷机构的承接能力和调配空间。',
    '机构页的 AI 重点是识别资源不均衡和潜在调配机会，不直接替代经营决策。',
  ]
}

export function getStaffAiInsights(staffList: ReadonlyArray<StaffListAiInput>) {
  const onDuty = staffList.filter(item => item.status === '在职').length
  const leave = staffList.filter(item => item.status === '休假').length
  const nursing = staffList.filter(item => item.department === '护理部').length
  const departmentCount = new Set(staffList.map(item => item.department)).size

  return [
    {
      id: 'staff-duty',
      title: '当前在岗覆盖',
      metric: `${onDuty}/${staffList.length}`,
      summary: leave > 0
        ? `当前有 ${leave} 名员工休假，需关注是否影响护理或后勤连续性。`
        : '当前人员出勤稳定，可把关注点转向班次负荷和角色分布。',
      action: '建议把休假状态与排班页联动，确认关键岗位是否已补位。',
      variant: leave > 0 ? 'warning' : 'success',
    },
    {
      id: 'staff-structure',
      title: '部门结构',
      metric: `${nursing} 护理`,
      summary: `当前共覆盖 ${departmentCount} 个部门，其中护理部人数最多，说明一线执行压力仍集中在护理团队。`,
      action: '建议后续把员工页与任务、报警数据联动，形成更真实的班次负荷视图。',
      variant: 'info',
    },
  ] satisfies AiStaffInsight[]
}

export function getStaffAiNarratives(staffList: ReadonlyArray<StaffListAiInput>) {
  const roleCounts = staffList.reduce<Record<string, number>>((accumulator, item) => {
    accumulator[item.role] = (accumulator[item.role] ?? 0) + 1
    return accumulator
  }, {})
  const topRole = Object.entries(roleCounts).sort((left, right) => right[1] - left[1])[0]

  return [
    topRole
      ? `当前员工结构中“${topRole[0]}”占比最高，后续适合重点补齐这一角色的 AI 辅助与负荷观察。`
      : '当前尚未识别出明显的角色集中趋势。',
    '员工列表页的 AI 更适合辅助管理层看结构和覆盖，不直接评价员工绩效。',
  ]
}

export function getRoomDetailAiInsight(room: RoomDetailAiInput): AiRoomDetailInsight {
  const occupancyRate = room.beds > 0 ? Math.round((room.occupied / room.beds) * 100) : 0
  const highCare = room.bedOccupants.some(item => item.careLevel?.includes('特级') || item.careLevel?.includes('一级'))

  return {
    title: 'AI 房间跟进建议',
    summary: highCare
      ? `当前房间入住对象包含高护理等级老人，房间价值不只是床位，而是清洁、设施和呼叫能力是否持续可用。`
      : `当前房间入住率为 ${occupancyRate}% ，重点应放在清洁状态、可用设施和下一次入住承接准备。`,
    actions: [
      room.cleanStatus === '已清洁'
        ? `下次清洁时间为 ${room.nextClean}，建议结合护理等级确认是否需要加密清洁或巡检。`
        : '优先恢复房间清洁状态，再安排新的入住或护理动作。',
      room.facilities.includes('紧急呼叫')
        ? '建议把紧急呼叫和房间设施状态纳入同一张巡检清单。'
        : '建议补齐关键设施后再进入高护理等级入住分配。',
      room.occupied < room.beds
        ? '当前仍有可用床位，可结合护理等级和房型匹配做后续分配。'
        : '当前房间已满，建议关注房间维护和在住老人体验。',
    ],
    confidence: highCare ? 92 : 84,
  }
}

export function getSupplyDetailAiInsight(supply: SupplyDetailAiInput): AiSupplyDetailInsight {
  const gap = Math.max(0, supply.minStock - supply.stock)
  const totalOut = supply.history.reduce((sum, item) => sum + item.out, 0)
  const avgOut = supply.history.length > 0 ? Math.round(totalOut / supply.history.length) : 0

  return {
    title: 'AI 物资跟进建议',
    summary: gap > 0
      ? `${supply.name} 当前低于最低库存 ${gap} 个单位，按最近消耗节奏看，补货动作不宜继续延后。`
      : `${supply.name} 当前库存仍高于安全线，适合继续关注消耗节奏和采购时机。`,
    actions: [
      gap > 0
        ? `建议先补齐至少 ${gap}${supply.category === '护理用品' ? ' 个安全差额' : ' 个最低缺口'}，避免直接影响一线使用。`
        : '建议按周继续观察库存变化，避免过早采购积压。',
      `最近 ${supply.history.length} 次记录平均出库约 ${avgOut} 单位，可把它作为下一轮采购的粗略参考。`,
      `供应商为 ${supply.supplier}，建议把补货优先级与到货时效一起核对。`,
    ],
    confidence: gap > 0 ? 93 : 82,
  }
}

export function getOrganizationStaffAiInsight(staffList: ReadonlyArray<OrganizationStaffAiInput>): AiOrganizationDetailInsight {
  const activeCount = staffList.filter(item => item.status === '在职').length
  const managementCount = staffList.filter(item => item.role.includes('院长') || item.role.includes('护士长') || item.role.includes('主管')).length
  const clinicalCount = staffList.filter(item => item.role.includes('医') || item.role.includes('护')).length

  return {
    title: 'AI 员工配置建议',
    summary: managementCount > 0
      ? `当前员工结构中管理与一线角色并存，重点不是人数本身，而是 ${activeCount} 名在岗人员是否覆盖高峰时段与重点楼层。`
      : `当前员工列表以执行岗位为主，适合继续关注在岗覆盖与替班弹性。`,
    actions: [
      `当前共有 ${clinicalCount} 名医护相关岗位，建议与本机构报警量、排班夜班数一起复核是否存在高峰压力。`,
      managementCount > 0
        ? `当前有 ${managementCount} 名管理岗位，适合把晨会、交接班和追踪闭环明确到负责人。`
        : '当前管理岗位信息较少，建议明确谁负责班次和异常升级追踪。',
      '建议从此处进入 AI 运营中心查看员工、排班和任务之间的联动摘要。',
    ],
    confidence: activeCount === staffList.length ? 87 : 82,
  }
}

export function getOrganizationDetailAiInsight(organization: OrganizationDetailAiInput): AiOrganizationDetailInsight {
  const occupancyRate = organization.beds > 0 ? Math.round((organization.occupied / organization.beds) * 100) : 0
  const staffPer100Beds = organization.beds > 0 ? Math.round((organization.staff / organization.beds) * 100) : 0

  return {
    title: 'AI 机构跟进建议',
    summary: occupancyRate >= 90
      ? `${organization.name} 当前入住率为 ${occupancyRate}% ，机构更需要关注高负荷承接下的空床周转、人员覆盖和异常响应速度。`
      : `${organization.name} 当前入住率为 ${occupancyRate}% ，适合平衡入住转化与人员配置，不必只盯总量。`,
    actions: [
      `当前每百床约配置 ${staffPer100Beds} 名员工，建议结合任务量和报警量继续验证是否存在高峰时段压力。`,
      `建议由 ${organization.manager} 牵头，优先核对空床周转和待入住名单的匹配情况。`,
      occupancyRate >= 90
        ? '优先把高入住率下的清床、排房和家属沟通节奏做成固定晨会关注项。'
        : '可把当前富余承接能力与市场转化、房型匹配一起复核。',
    ],
    confidence: occupancyRate >= 90 ? 92 : 84,
  }
}

export function getOrganizationBedAiInsight(beds: OrganizationBedAiInput): AiOrganizationDetailInsight {
  const total = beds.occupied + beds.reserved + beds.available
  const occupancyRate = total > 0 ? Math.round((beds.occupied / total) * 100) : 0

  return {
    title: 'AI 床位调度建议',
    summary: beds.available <= 1
      ? `${beds.name} 当前可用床位仅剩 ${beds.available} 个，床位管理重点应从“统计空床”转为“周转速度与预留占用是否合理”。`
      : `${beds.name} 当前床位结构中有 ${beds.reserved} 个预留、${beds.available} 个可用，适合同步检查待入住与清床节奏。`,
    actions: [
      `当前床位入住率约为 ${occupancyRate}% ，建议优先复核预留床是否都对应明确入住计划。`,
      beds.reserved > 0
        ? '建议把预留床和待入住名单逐一匹配，避免预留长期占位但未真正转化。'
        : '当前无预留床位，可把重点放到空床准备和房型匹配效率。',
      beds.available <= 1
        ? '建议将清床、维修、消杀与家属确认节奏纳入同一晨会看板。'
        : '建议把可用床位与护理等级、房型偏好一起看，提升承接成功率。',
    ],
    confidence: beds.available <= 1 || beds.reserved >= 2 ? 91 : 83,
  }
}

function getMaxConsecutiveWorkDays(schedule: StaffDetailActionAiInput['schedule']) {
  let current = 0
  let max = 0

  for (const item of schedule) {
    if (item.shift === '休息') {
      current = 0
      continue
    }

    current += 1
    if (current > max) max = current
  }

  return max
}

export function getStaffDetailActionAiInsight(staff: StaffDetailActionAiInput): AiStaffDetailActionInsight {
  const maxConsecutive = getMaxConsecutiveWorkDays(staff.schedule)
  const weekendDuty = staff.schedule.filter(item => ['周六', '周日'].includes(item.day) && item.shift !== '休息').length

  return {
    title: 'AI 用工跟进建议',
    summary: maxConsecutive >= 5
      ? `${staff.name} 当前最长连续上班 ${maxConsecutive} 天，动作重点应放在疲劳风险和交接质量，而不是只看个人绩效。`
      : `${staff.name} 当前排班与绩效表现总体稳定，适合继续把高质量输出沉淀为班次经验与交接模板。`,
    actions: [
      `当前出勤率 ${staff.attendance}% 、满意度 ${staff.satisfaction}% ，建议与 ${staff.department} 的任务量一起判断是否存在隐性超负荷。`,
      weekendDuty > 0
        ? `本周包含 ${weekendDuty} 个周末班次，建议主管在排班复核时确认后续休息与补位安排。`
        : '本周未安排周末班，可把重点放在交接质量与重点老人覆盖。',
      staff.performance >= 90
        ? `可将 ${staff.role} 的高分表现转成可复制的交接或巡查模板，沉淀到 AI 运营中心。`
        : '建议结合本月任务完成质量做一次针对性复盘，再决定是否需要调班或培训。',
    ],
    confidence: maxConsecutive >= 5 || weekendDuty > 0 ? 90 : 84,
  }
}

export function getElderDetailActionAiInsight(elder: ElderDetailActionAiInput): AiElderDetailActionInsight {
  const highCare = elder.careLevel.includes('特级') || elder.careLevel.includes('一级')

  return {
    title: 'AI 管理动作建议',
    summary: highCare
      ? `${elder.name} 当前属于 ${elder.careLevel}，管理重点应放在高风险病史、用药禁忌和交接连续性，而不是只展示基本资料。`
      : `${elder.name} 当前状态为 ${elder.status}，适合继续把健康观察、家属沟通和护理记录串成一条管理闭环。`,
    actions: [
      elder.medicalHistory.length > 0
        ? `建议把既往病史 ${elder.medicalHistory.join('、')} 纳入交接摘要与异常解释的默认上下文。`
        : '建议继续补齐核心病史标签，避免后续 AI 解释上下文不足。',
      elder.allergies.length > 0
        ? `当前已记录过敏信息 ${elder.allergies.join('、')}，建议在护理和用药提醒中持续前置。`
        : '当前未记录过敏史，建议在下一次资料复核时确认。',
      `建议围绕房间 ${elder.roomNumber} 的护理动作、报警事件和家属沟通统一追踪。`,
    ],
    confidence: highCare ? 92 : 84,
  }
}

export function getScheduleAiInsights(schedule: ReadonlyArray<ScheduleMatrixAiInput>) {
  const totalPublished = schedule.flatMap(item => item.shifts).filter(item => item !== '休息').length
  const nightShiftCount = schedule.flatMap(item => item.shifts).filter(item => item === '夜班').length
  const consecutiveFiveDays = schedule.filter(item => item.shifts.slice(0, 5).every(shift => shift !== '休息')).length

  return [
    {
      id: 'schedule-published',
      title: '已发布班次密度',
      metric: `${totalPublished} 班`,
      summary: '当前排班以固定周视图发布，AI 更适合帮助看出密度和连续性，而不是直接自动排班。',
      action: '建议先把白班、夜班和休息的分布差异转成可复核摘要，再决定是否调班。',
      variant: 'info',
    },
    {
      id: 'schedule-night',
      title: '夜班覆盖',
      metric: `${nightShiftCount} 夜班`,
      summary: nightShiftCount > 0
        ? `当前夜班共 ${nightShiftCount} 个，适合重点观察是否由少数员工长期承担。`
        : '当前未识别到夜班安排，可把重点转向白班均衡度。',
      action: '建议把夜班与次日休息、连续上班天数一起看，避免只盯单日排班。',
      variant: nightShiftCount > 4 ? 'warning' : 'success',
    },
    {
      id: 'schedule-load',
      title: '连续上班关注',
      metric: `${consecutiveFiveDays} 人`,
      summary: consecutiveFiveDays > 0
        ? `有 ${consecutiveFiveDays} 名员工在工作周前 5 天均有班次，后续需结合岗位和班型确认疲劳风险。`
        : '当前没有明显的连续上班集中信号。',
      action: '后续接真实排班服务时，建议把连续班次和请假替班一起纳入 AI 检查项。',
      variant: consecutiveFiveDays > 2 ? 'warning' : 'info',
    },
  ] satisfies AiScheduleInsight[]
}

export function getScheduleAiNarratives(schedule: ReadonlyArray<ScheduleMatrixAiInput>) {
  const earlyShiftCount = schedule.flatMap(item => item.shifts).filter(item => item === '早班').length

  return [
    earlyShiftCount > 0
      ? `当前早班共 ${earlyShiftCount} 个，适合和晨间高频护理任务一起看是否存在峰值叠加。`
      : '当前未设置早班，需关注白班是否承担了过多晨间动作。',
    '排班页的 AI 重点应放在班次均衡和疲劳风险提示，不直接替代排班主管的最终调整。',
  ]
}

export function getEquipmentDetailAiInsight(device: EquipmentDetailAiInput): AiEquipmentDetailInsight {
  const latest = device.history[0]
  const lowSignal = device.signal <= 45
  const lowBattery = device.battery <= 20

  return {
    title: 'AI 设备跟进建议',
    summary: device.status !== 'online'
      ? `${device.name} 当前不处于稳定在线状态，重点不是单条指标，而是 ${device.room} 是否因此形成监测盲区。`
      : `${device.name} 当前在线运行，最近一条记录为“${latest?.note ?? '无备注'}”，适合把实时指标和维护节奏一起看。`,
    actions: [
      lowSignal
        ? '优先检查设备位置和网络环境，确认是否存在弱信号导致的连续数据不稳定。'
        : '当前信号强度基本可用，可继续关注电量与历史波动。',
      lowBattery
        ? '建议本班内完成补电或更换，避免设备从在线转为离线。'
        : `下一次维护时间为 ${device.maintenance.next}，建议提前把维保提醒并入设备工单节奏。`,
      `设备已连续运行 ${Math.floor(device.uptime / 60)} 小时，建议结合历史记录判断是否需要预防性维护。`,
    ],
    confidence: device.status !== 'online' || lowSignal || lowBattery ? 93 : 85,
  }
}

export function getEquipmentMaintenanceNarratives(device: EquipmentDetailAiInput) {
  const nextDate = new Date(`${device.maintenance.next}T00:00:00`)
  const today = new Date()
  const diffDays = Number.isNaN(nextDate.getTime()) ? null : Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const fluctuationCount = device.history.filter(item => item.note.includes('波动')).length

  return [
    diffDays !== null && diffDays <= 30
      ? `距离下次维护仅剩 ${diffDays} 天，建议提前把维保时间窗和房间护理安排对齐。`
      : `当前维护周期为 ${device.maintenance.cycle}，适合按计划把 ${device.maintenance.next} 作为下一次维保节点。`,
    fluctuationCount > 0
      ? `最近 ${device.history.length} 条历史记录中有 ${fluctuationCount} 条出现波动备注，维保时不应只检查硬件，也应复核安装环境。`
      : '近期历史记录较稳定，维保可优先做预防性巡检而不是故障处理。',
  ]
}

export function getRoomCareActionInsight(room: RoomDetailAiInput): AiRoomDetailInsight {
  const occupiedBeds = room.bedOccupants.filter(item => item.elderName).length
  const highCareCount = room.bedOccupants.filter(item => item.careLevel?.includes('特级') || item.careLevel?.includes('一级')).length

  return {
    title: 'AI 床位照护动作',
    summary: highCareCount > 0
      ? `当前房间有 ${highCareCount} 位高护理等级老人，床位动作重点应放在巡查、呼叫链路和清洁节奏的连续性。`
      : `当前房间共有 ${occupiedBeds} 个在住床位，适合同步检查可用设施和下一次清洁准备。`,
    actions: [
      room.cleanStatus === '已清洁'
        ? `建议围绕下次清洁时间 ${room.nextClean} 提前安排房间巡查，避免护理动作与清洁动作冲突。`
        : '当前应先恢复清洁状态，再安排新的入住或高频护理动作。',
      room.facilities.includes('紧急呼叫')
        ? '建议把紧急呼叫设施测试纳入本房间例行检查，特别是高护理等级对象所在床位。'
        : '建议补齐紧急呼叫等关键设施后，再安排高依赖老人入住。',
      occupiedBeds < room.beds
        ? '当前仍有空闲床位，可把房型匹配和护理等级一起作为后续承接条件。'
        : '当前床位已满，建议把重点放到服务质量和设施稳定性。',
    ],
    confidence: highCareCount > 0 ? 91 : 84,
  }
}

export function getSupplyProcurementInsight(supply: SupplyDetailAiInput): AiSupplyDetailInsight {
  const gap = Math.max(0, supply.minStock - supply.stock)
  const recentOut = supply.history[0]?.out ?? 0
  const latestBalance = supply.history[0]?.balance ?? supply.stock

  return {
    title: 'AI 采购跟进建议',
    summary: gap > 0
      ? `${supply.name} 当前较安全库存仍差 ${gap} 单位，采购动作重点应放在到货时效和消耗连续性，而不是只补到最低线。`
      : `${supply.name} 当前库存仍可支撑短期使用，适合利用现有窗口优化采购节奏。`,
    actions: [
      `最近一笔记录结存为 ${latestBalance}，最近一次出库 ${recentOut}，建议据此判断补货批量是否需要上调。`,
      `建议与供应商 ${supply.supplier} 预先确认补货时效，避免一线护理用品在高峰时段断供。`,
      gap > 0
        ? '建议将补货任务同步挂到 AI 运营中心，便于追踪是否形成真实采购闭环。'
        : '建议将当前库存优势用于平衡采购周期，避免高价临采。',
    ],
    confidence: gap > 0 ? 92 : 83,
  }
}

export function getAdminAiPromptReply(prompt: string) {
  const normalized = prompt.trim()

  if (!normalized) {
    return '请输入一个与入住评估、健康风险、报警解释或运营摘要相关的问题。'
  }

  if (normalized.includes('入住') || normalized.includes('护理级别')) {
    return '当前 Admin 端最成熟的 AI 闭环仍是入住评估。建议先在入住页完成人工确认，再去任务中心和提醒中心追踪是否形成执行回执。'
  }

  if (normalized.includes('报警') || normalized.includes('异常')) {
    return '报警类 AI 输出应该优先给出“结论 + 解释 + 下一步动作”，且高等级事件必须保留人工升级和人工关闭边界。'
  }

  if (normalized.includes('周报') || normalized.includes('月报') || normalized.includes('报表')) {
    return '运营分析 Agent 更适合在报表中心生成摘要草稿，而不是直接替代正式经营报表；当前建议先把风险、报警、任务执行率三类信号汇总输出。'
  }

  if (normalized.includes('任务') || normalized.includes('排班')) {
    return '任务中心的 AI 价值不在自动派单，而在于把高风险老人和高 SLA 任务提前推到本班的最前面，再由人工决定执行顺序。'
  }

  return '当前 Admin+AI 建议优先关注四类结果型能力：入住评估建议、健康风险解释、报警处理建议、运营摘要草稿。'
}