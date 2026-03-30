import { alertRecords } from '@/lib/data/alerts-data'
import { healthVitals } from '@/lib/data/health-data'

export interface AppAiModuleCard {
  id: string
  title: string
  summary: string
  primaryMetric: string
  status: '已接入' | '预览中'
}

export interface StaffAppAiFocus {
  title: string
  reason: string
  slaHint: string
  severity: '高' | '中' | '常规'
}

export interface FamilyAppAiSummary {
  title: string
  summary: string
  mood: string
  recommendation: string
}

export interface ElderAiProfile {
  statusSummary: string
  familyBrief: string
  followupActions: string[]
  confidence: number
}

export interface StaffAiProfile {
  shiftSummary: string
  handoverDraft: string
  recommendedActions: string[]
  workloadLevel: '高负荷' | '平稳'
}

export interface VisitAiSuggestion {
  title: string
  summary: string
  action: string
  type: '现场' | '视频' | '沟通'
}

export const STAFF_APP_AI_MODULES: AppAiModuleCard[] = [
  {
    id: 'shift-brief',
    title: '班次摘要',
    summary: '根据待办、报警和重点老人，生成上班即看的 AI 班次摘要。',
    primaryMetric: '3 条重点对象',
    status: '已接入',
  },
  {
    id: 'task-copilot',
    title: '任务 Copilot',
    summary: '对高 SLA 护理任务给出优先级、路径与执行提醒。',
    primaryMetric: '4 条优先任务',
    status: '已接入',
  },
  {
    id: 'alert-responder',
    title: '报警响应提示',
    summary: '把跌倒、健康异常、设备失联转换为下一步动作建议。',
    primaryMetric: '2 条需升级',
    status: '预览中',
  },
  {
    id: 'handover-draft',
    title: '交接班草稿',
    summary: '汇总本班异常、未完成任务和重点关注老人。',
    primaryMetric: '1 份草稿',
    status: '预览中',
  },
]

export const FAMILY_APP_AI_MODULES: AppAiModuleCard[] = [
  {
    id: 'today-summary',
    title: '今日状态摘要',
    summary: '用家属友好的语言汇总健康、护理和情绪状态。',
    primaryMetric: '1 条日报',
    status: '已接入',
  },
  {
    id: 'health-explainer',
    title: '健康解释',
    summary: '把血压、血氧、睡眠等指标解释成可理解的结论和建议。',
    primaryMetric: '2 条解释',
    status: '已接入',
  },
  {
    id: 'visit-assistant',
    title: '探视助手',
    summary: '结合老人状态推荐现场探视、视频探视和沟通方式。',
    primaryMetric: '3 条建议',
    status: '预览中',
  },
  {
    id: 'care-qa',
    title: '护理问答',
    summary: '帮助家属理解今日护理执行和注意事项。',
    primaryMetric: '4 个高频问答',
    status: '预览中',
  },
]

export const STAFF_APP_FOCUS: StaffAppAiFocus[] = [
  {
    title: '先处理周玉兰的低氧复测',
    reason: '血氧持续低于 93%，同时伴随体温偏高，属于需优先复核的健康异常。',
    slaHint: '建议 10 分钟内完成复测并回执。',
    severity: '高',
  },
  {
    title: '跟进 101-1 的一级护理晨间任务',
    reason: '任务来自高护理等级对象，且提醒策略包含超时升级。',
    slaHint: '建议本班首小时内完成。',
    severity: '中',
  },
  {
    title: '排查 301-1 的设备低电量',
    reason: '设备盲区会放大高压老人监测风险，适合与巡房合并处理。',
    slaHint: '建议巡房时一并完成更换。',
    severity: '常规',
  },
]

export const FAMILY_APP_SUMMARIES: FamilyAppAiSummary[] = [
  {
    title: '今日状态稳定',
    summary: '张桂英今天整体状态平稳，已完成晨间护理和两次体征测量，血压略高但在持续观察中。',
    mood: '情绪平稳',
    recommendation: '建议晚上视频沟通时多鼓励休息，并提醒按时服药。',
  },
  {
    title: '需关注夜间血氧',
    summary: '周玉兰今日出现低氧与低热组合异常，机构已安排医生复测和加密观察。',
    mood: '需安抚',
    recommendation: '如家属今晚沟通，建议先以关心休息和呼吸情况为主。',
  },
]

export function getElderAiProfile(elderId: string): ElderAiProfile {
  const vital = healthVitals.find(item => item.elderlyId === elderId) ?? healthVitals[0]
  const openAlerts = alertRecords.filter(item => item.elderlyId === elderId && item.status !== 'resolved')
  const alertSummary = openAlerts.length > 0 ? `当前还有 ${openAlerts.length} 条待闭环事件。` : '当前无待闭环报警事件。'

  return {
    statusSummary: `${vital.elderlyName} 当前主要关注 ${vital.abnormalItems.length > 0 ? vital.abnormalItems.join('、') : '日常观察'}。${alertSummary}`,
    familyBrief: `适合家属查看的摘要是：今天状态总体${vital.isAbnormal ? '需要关注' : '稳定'}，机构已完成既定护理并持续观察体征变化。`,
    followupActions: [
      '继续关注下一次体征测量结果，确认异常是否持续。',
      '如今晚家属视频沟通，可同步护理人员的观察结论。',
      '若连续两次指标异常，建议升级为正式健康风险说明。',
    ],
    confidence: vital.isAbnormal ? 91 : 84,
  }
}

export function getStaffAiProfile(staffId: string): StaffAiProfile {
  void staffId

  return {
    shiftSummary: '本班次的核心重点是先处理 1 条低氧复测、1 条一级护理任务和 1 条设备盲区排查，适合按“先健康风险、后计划任务、再设备巡查”的顺序推进。',
    handoverDraft: '交接建议：周玉兰需继续观察夜间血氧，张桂英的晨间护理已完成但高压仍需复测，301-1 的设备低电量需设备部继续跟进。',
    recommendedActions: [
      '先完成高风险健康对象的复测与医生同步。',
      '对已开始执行的护理任务补齐回执备注，避免交班信息缺失。',
      '把设备问题与巡房路线合并，减少重复往返。',
    ],
    workloadLevel: '高负荷',
  }
}

export function getVisitAiSuggestions(): VisitAiSuggestion[] {
  return [
    {
      title: '张桂英更适合晚间视频沟通',
      summary: '今日血压略高但整体状态稳定，晚间视频探视更利于减少线下折腾。',
      action: '建议给家属推送 19:30 的视频探视窗口。',
      type: '视频',
    },
    {
      title: '周桂芳的待审核探视建议改为短时现场探视',
      summary: '老人近期情绪波动较明显，短时现场见面更适合做情绪安抚。',
      action: '审核通过时附带“控制 30 分钟以内”的建议。',
      type: '现场',
    },
    {
      title: '家属沟通文案应先给结论再给解释',
      summary: '对健康异常、视频延迟、探视变更等场景，先说明当前状态，再补充原因和建议动作。',
      action: '可在消息中心预置一条 AI 沟通草稿。',
      type: '沟通',
    },
  ]
}