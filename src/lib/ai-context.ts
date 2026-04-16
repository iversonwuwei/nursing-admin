import type { CareScene } from '@/lib/care-scenes'

export type AiContextTarget = 'inference' | 'rules' | 'logs'

export interface AiTrackingContext {
  source: string
  entityId?: string
  entityName?: string
  focus?: string
  target?: AiContextTarget
  scene?: CareScene
}

type SearchParamsLike = Pick<URLSearchParams, 'get'>

const AI_SOURCE_LABELS: Record<string, string> = {
  'incidents-list': '事故列表',
  'organizations-list': '机构列表',
  'organization-detail': '机构详情',
  'organization-staff': '机构员工',
  'rooms-list': '房间列表',
  'room-detail': '房间详情',
  'staff-list': '员工列表',
  'supplies-list': '物资列表',
  'supply-detail': '物资详情',
  'staff-detail': '员工详情',
  'staff-schedule': '排班管理',
  'nursing-checkin': '服务打卡管理',
  'analytics-report': 'AI 报表中心',
  'elderly-checkin': '个案评定中心',
  'equipment-list': '设备列表',
  'equipment-detail': '设备详情',
  'alerts-center': '报警中心',
  'staff-tasks': '员工任务',
  financial: '财务收支',
  'equipment-status': '设备状态',
  'health-monitoring': '健康监测',
  'incident-detail': '事故详情',
  'elderly-detail': '长者详情',
}

const AI_TARGET_LABELS: Record<AiContextTarget, string> = {
  inference: '推理详情页',
  rules: '规则治理页',
  logs: '问答日志页',
}

export function buildAiAssistantHref(context: AiTrackingContext) {
  return appendAiTrackingContext('/ai-assistant', context)
}

export function appendAiTrackingContext(href: string, context: AiTrackingContext | null) {
  if (!context) return href

  const query = new URLSearchParams()
  query.set('source', context.source)

  if (context.entityId) query.set('entityId', context.entityId)
  if (context.entityName) query.set('entityName', context.entityName)
  if (context.focus) query.set('focus', context.focus)
  if (context.target) query.set('target', context.target)
  if (context.scene) query.set('scene', context.scene)

  const separator = href.includes('?') ? '&' : '?'
  const serialized = query.toString()
  return serialized ? `${href}${separator}${serialized}` : href
}

export function readAiTrackingContext(searchParams: SearchParamsLike | null | undefined): AiTrackingContext | null {
  const source = searchParams?.get('source')

  if (!source) return null

  const target = searchParams?.get('target')
  return {
    source,
    entityId: searchParams?.get('entityId') ?? undefined,
    entityName: searchParams?.get('entityName') ?? undefined,
    focus: searchParams?.get('focus') ?? undefined,
    target: target === 'inference' || target === 'rules' || target === 'logs' ? target : undefined,
    scene: searchParams?.get('scene') === 'institutional' || searchParams?.get('scene') === 'home'
      ? searchParams.get('scene') as CareScene
      : undefined,
  }
}

export function getAiSourceLabel(source?: string) {
  if (!source) return '-'
  return AI_SOURCE_LABELS[source] ?? source
}

export function getAiTargetLabel(target?: string) {
  if (!target) return 'AI 总览'
  return AI_TARGET_LABELS[target as AiContextTarget] ?? target
}

export function getAiSceneLabel(scene?: CareScene) {
  if (scene === 'institutional') return '机构养老'
  if (scene === 'home') return '居家养老'
  return '通用视角'
}

export function getSuggestedAiLogChannel(context: AiTrackingContext | null) {
  if (!context) return null

  if (['health-monitoring', 'elderly-detail', 'incident-detail', 'incidents-list', 'alerts-center'].includes(context.source)) {
    return 'Admin / 健康总览'
  }

  if (['staff-list', 'staff-detail', 'staff-schedule', 'staff-tasks', 'nursing-checkin', 'elderly-checkin'].includes(context.source)) {
    return 'Admin / 任务中心'
  }

  if (['organizations-list', 'organization-detail', 'organization-staff', 'rooms-list', 'room-detail', 'supplies-list', 'supply-detail', 'equipment-list', 'equipment-detail', 'equipment-status', 'financial', 'analytics-report'].includes(context.source)) {
    return 'Admin / 报表中心'
  }

  return null
}

export function getSuggestedAiLogKeywords(context: AiTrackingContext | null) {
  if (!context) return []

  const keywordMap: Record<string, string[]> = {
    'incidents-list': ['风险', '解释', '复盘'],
    'alerts-center': ['报警', '升级', '风险'],
    'health-monitoring': ['风险', '复测', '异常'],
    'elderly-detail': ['风险', '复测', '异常'],
    'incident-detail': ['风险', '复测', '异常'],
    'organizations-list': ['运营', '摘要', '承接'],
    'rooms-list': ['运营', '摘要', '排房'],
    'staff-list': ['任务', '排班', '覆盖'],
    'staff-detail': ['任务', '交接', '班次'],
    'staff-schedule': ['任务', '班次', 'SLA'],
    'staff-tasks': ['任务', '优先级', 'SLA'],
    'nursing-checkin': ['任务', '回执', '留痕'],
    'elderly-checkin': ['评定', '认定', '解释'],
    'analytics-report': ['运营', '周报', '监管'],
    financial: ['运营', '周报', '摘要'],
    'organization-detail': ['运营', '摘要', '承接'],
    'organization-staff': ['运营', '摘要', '任务'],
    'room-detail': ['运营', '摘要', '巡检'],
    'supplies-list': ['运营', '摘要', '补货'],
    'supply-detail': ['运营', '摘要', '补货'],
    'equipment-list': ['设备', '巡检', '维保'],
    'equipment-detail': ['设备', '监测', '风险'],
    'equipment-status': ['设备', '监测', '风险'],
  }

  const keywords = [...(keywordMap[context.source] ?? [])]

  if (context.focus) {
    if (context.focus.includes('health') || context.focus.includes('risk')) keywords.push('风险')
    if (context.focus.includes('task') || context.focus.includes('schedule')) keywords.push('任务')
    if (context.focus.includes('incident') || context.focus.includes('alert')) keywords.push('解释')
    if (context.focus.includes('financial') || context.focus.includes('procurement')) keywords.push('摘要')
    if (context.focus.includes('room') || context.focus.includes('allocation')) keywords.push('排房')
    if (context.focus.includes('coverage') || context.focus.includes('workforce')) keywords.push('排班')
    if (context.focus.includes('equipment') || context.focus.includes('maintenance')) keywords.push('设备')
  }

  if (context.scene === 'institutional') keywords.push('机构养老')
  if (context.scene === 'home') keywords.push('居家养老')

  return [...new Set(keywords)]
}