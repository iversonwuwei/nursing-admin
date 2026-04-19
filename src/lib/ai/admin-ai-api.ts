import type { AiTrackingContext } from '@/lib/ai-context'
import type {
    AiContextRuleCard,
    AiDashboardInsight,
    AiHealthInsight,
    AiQueryLog,
    AiRuleToggle,
} from '@/lib/mock/admin-ai'
import type { FamilyAppAiSummary, StaffAppAiFocus, VisitAiSuggestion } from '@/lib/mock/app-ai'

export type AdminAiMode = 'demo' | 'bff'

const ADMIN_AI_MODE: AdminAiMode = 'bff'

interface AiResultEnvelope<T> {
  available: boolean
  capability: string
  provider: string
  model: string
  result: T | null
  cached: boolean
  latencyMs: number
  traceId: string
  auditId: string
}

interface AiDashboardInsightsResponse {
  summary: string
  keyInsights: string[]
  actionItems: string[]
}

interface AiHealthRiskResponse {
  riskLevel: string
  explanation: string
  recommendations: string[]
  monitoringPoints: string[]
}

interface AiAlertSuggestionResponse {
  suggestedAction: string
  rationale: string
  priority: string
  steps: string[]
}

interface AiOpsReportResponse {
  reportTitle: string
  summary: string
  highlights: string[]
  concerns: string[]
  recommendations: string[]
}

interface AiTaskPriorityResponse {
  rankedTasks: Array<{
    taskId: string
    rank: number
    priority: string
    reason: string
  }>
  rationale: string
}

interface AiShiftSummaryResponse {
  summary: string
  keyPoints: string[]
  handoverItems: string[]
}

interface AiHandoverDraftResponse {
  draft: string
  criticalItems: string[]
}

interface AiEscalationDraftResponse {
  draft: string
  suggestedRecipient: string
  priority: string
}

interface AiFamilyTodaySummaryResponse {
  summary: string
  frequentQuestions: Array<{
    question: string
    answer: string
  }>
}

interface AiHealthExplainResponse {
  explanation: string
  recommendation: string
}

interface AiVisitAssistantResponse {
  suggestedTimeSlots: string[]
  visitTips: string[]
  recommendation: string
}

export interface AiDashboardInsightsRequest {
  totalElders: number
  activeCarePlans: number
  openAlerts: number
  pendingTasks: number
  occupancyPercent: number
  additionalContext?: string
}

export interface AdminAiHealthRiskRequest {
  elderId: string
  elderName: string
  roomNumber: string
  bloodPressure: string
  heartRate: number
  temperature: number
  bloodSugar: number
  oxygen: number
  currentMedications?: string
  medicalHistory?: string
}

export interface AdminAiAlertSuggestionRequest {
  alertType: string
  alertDescription: string
  severity: string
  elderContext?: string
  recentHistory?: string
}

export interface AdminAiTaskPriorityItem {
  taskId: string
  title: string
  elderName: string
  careLevel: string
  dueAt: string
  status: string
}

export interface StaffAiShiftSummaryRequest {
  shift: string
  completedTasks: number
  pendingTasks: number
  alerts: number
  notes?: string
}

export interface StaffAiHandoverDraftRequest {
  fromShift: string
  toShift: string
  completedItems: string[]
  pendingItems: string[]
  alerts: string[]
}

export interface StaffAiEscalationDraftRequest {
  alertType: string
  elderName: string
  description: string
  currentStatus: string
}

export interface StaffAiCareCopilotRequest {
  alertType: string
  alertDescription: string
  severity: string
  elderContext?: string
  recentHistory?: string
}

export interface FamilyAiTodaySummaryRequest {
  elderName: string
  careLevel: string
  healthSummary: string
  completedTasks: number
  pendingTasks: number
  recentNotes: string[]
}

export interface FamilyAiHealthExplainRequest {
  elderName: string
  metricName: string
  metricValue: string
  normalRange: string
  trendDescription?: string
}

export interface FamilyAiVisitAssistantRequest {
  elderName: string
  careLevel: string
  recentHealthSummary?: string
  preferredTimeSlots?: string[]
}

export interface FamilyAiChatRequest {
  message: string
  conversationId?: string
}

interface AiChatResponse {
  reply: string
  conversationId: string
}

export interface AdminAiChatRequest {
  message: string
  conversationId?: string
  userRole?: string
}

export interface AdminAiOpsReportRequest {
  reportType: string
  period: string
  metricsJson?: string
}

export interface AdminAiOpsReportResult {
  title: string
  summary: string
  highlights: string[]
  concerns: string[]
  recommendations: string[]
}

interface AiRuleResponse {
  ruleId: string
  ruleCode: string
  ruleName: string
  description: string
  capability: string
  isEnabled: boolean
  priority: number
  updatedAtUtc: string
}

interface AiAuditLogResponse {
  auditId: string
  tenantId: string
  userId: string
  capability: string
  provider: string
  model: string
  endpoint: string
  cached: boolean
  latencyMs: number
  success: boolean
  errorMessage?: string | null
  createdAtUtc: string
}

interface AiAuditLogListResponse {
  items: AiAuditLogResponse[]
  total: number
  page: number
  pageSize: number
}

export interface AdminAiAuditLogQuery {
  capability?: string
  page?: number
  pageSize?: number
}

export interface AdminAiAuditLogResult {
  items: AiQueryLog[]
  total: number
  page: number
  pageSize: number
}

export interface AdminAiModelStatus {
  provider: string
  model: string
  capability: string
  isReachable: boolean
  latencyMs?: number | null
  checkedAtUtc: string
  configuredProvider?: string | null
  configuredModel?: string | null
  usesProviderDefaultModel: boolean
  configurationSource: string
}

function formatTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

function capabilityLabel(capability: string) {
  const labels: Record<string, string> = {
    'dashboard-insights': '运营摘要',
    'health-risk': '健康风险',
    'alert-suggestion': '报警建议',
    'task-priority': '任务优先级',
    'admission-assessment': '入住评估',
    'ops-report': '运营报告',
    'financial-insights': '财务洞察',
    'device-insights': '设备洞察',
    'incident-analysis': '事故分析',
    'resource-insights': '资源洞察',
    chat: '运营问答',
    'elder-detail-action': '长者详情建议',
    'shift-summary': '班次摘要',
    'handover-draft': '交接班草稿',
    'escalation-draft': '升级草稿',
    'today-summary': '家属日报',
    'health-explain': '健康解读',
    'visit-assistant': '探视助手',
    'visit-risk': '探视风险',
  }

  return labels[capability] ?? capability
}

function capabilityChannel(capability: string) {
  if (capability === 'admission-assessment') return 'Admin / 入住办理'
  if (['health-risk', 'alert-suggestion', 'incident-analysis', 'elder-detail-action'].includes(capability)) return 'Admin / 健康总览'
  if (capability === 'task-priority') return 'Admin / 任务中心'
  if (['shift-summary', 'handover-draft', 'escalation-draft'].includes(capability)) return 'Staff / AI 预览'
  if (['today-summary', 'health-explain', 'visit-assistant', 'visit-risk'].includes(capability)) return 'Family / AI 预览'
  return 'Admin / 报表中心'
}

function mapRiskSeverity(level: string): AiHealthInsight['severity'] {
  return /高|critical/i.test(level) ? '高风险' : '中风险'
}

function mapTaskSeverity(priority: string): StaffAppAiFocus['severity'] {
  if (/高|urgent|critical|立即/i.test(priority)) return '高'
  if (/中|warning|关注|priority/i.test(priority)) return '中'
  return '常规'
}

export function getAdminAiMode() {
  return ADMIN_AI_MODE
}

export function isAdminAiDemoMode() {
  return ADMIN_AI_MODE === 'demo'
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return null
  }

  return response.json()
}

async function requestAdminAi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/ai${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const payload = await readJsonResponse(response) as { detail?: string; title?: string; message?: string } | null
    throw new Error(payload?.detail ?? payload?.title ?? payload?.message ?? `ai request failed: ${response.status}`)
  }

  return await response.json() as T
}

function mapDashboardEnvelopeToInsights(envelope: AiResultEnvelope<AiDashboardInsightsResponse>): AiDashboardInsight[] {
  if (!envelope.available || !envelope.result) {
    return [
      {
        id: 'ai-unavailable',
        title: 'AI 服务不可用',
        summary: '当前环境未返回可用的运营摘要结果，已保留页面结构供人工继续查看。',
        value: '不可用',
        href: '/ai-assistant/inference',
        variant: 'warning',
      },
    ]
  }

  return [
    {
      id: 'ai-summary',
      title: 'AI 总结',
      summary: envelope.result.summary,
      value: envelope.cached ? '缓存命中' : '实时生成',
      href: '/ai-assistant/inference',
      variant: envelope.cached ? 'success' : 'primary',
    },
    {
      id: 'ai-key-insights',
      title: '关键洞察',
      summary: envelope.result.keyInsights.join('；') || '暂无关键洞察。',
      value: `${envelope.result.keyInsights.length} 条`,
      href: '/ai-assistant/inference',
      variant: 'warning',
    },
    {
      id: 'ai-action-items',
      title: '行动建议',
      summary: envelope.result.actionItems.join('；') || '暂无行动建议。',
      value: `${envelope.result.actionItems.length} 条`,
      href: '/ai-assistant/rules',
      variant: 'info',
    },
  ]
}

function mapRuleResponse(rule: AiRuleResponse): AiRuleToggle {
  return {
    id: rule.ruleId,
    name: rule.ruleName,
    description: rule.description,
    enabled: rule.isEnabled,
    scope: capabilityLabel(rule.capability),
    lastUpdated: formatTimestamp(rule.updatedAtUtc),
  }
}

function mapAuditLogResponse(log: AiAuditLogResponse): AiQueryLog {
  return {
    id: log.auditId,
    agent: capabilityLabel(log.capability),
    channel: capabilityChannel(log.capability),
    operator: log.userId,
    summary: `${log.provider} / ${log.model}${log.cached ? ' / 缓存命中' : ' / 实时推理'}`,
    outcome: log.success
      ? `调用 ${log.endpoint} 成功，耗时 ${log.latencyMs} ms。`
      : `调用 ${log.endpoint} 失败：${log.errorMessage ?? '未知错误'}。`,
    createdAt: formatTimestamp(log.createdAtUtc),
    focus: log.capability,
    entityId: log.auditId,
    entityName: capabilityLabel(log.capability),
  }
}

export function getPrimaryCapabilityForContext(context: AiTrackingContext | null) {
  if (!context) return undefined

  const sourceMap: Record<string, string> = {
    'alerts-center': 'alert-suggestion',
    'elderly-detail': 'elder-detail-action',
    'health-monitoring': 'health-risk',
    'incident-detail': 'incident-analysis',
    'incidents-list': 'incident-analysis',
    'staff-tasks': 'task-priority',
    financial: 'financial-insights',
    'organizations-list': 'resource-insights',
    'organization-detail': 'resource-insights',
    'organization-staff': 'resource-insights',
    'rooms-list': 'resource-insights',
    'room-detail': 'resource-insights',
    'supplies-list': 'resource-insights',
    'supply-detail': 'resource-insights',
    'staff-list': 'resource-insights',
    'staff-detail': 'resource-insights',
    'staff-schedule': 'resource-insights',
    'equipment-list': 'device-insights',
    'equipment-detail': 'device-insights',
    'equipment-status': 'device-insights',
  }

  return sourceMap[context.source]
}

export function buildAiRuleCardsForContext(rules: AiRuleToggle[], context: AiTrackingContext | null): AiContextRuleCard[] {
  const capability = getPrimaryCapabilityForContext(context)
  const scopedRules = capability
    ? rules.filter(item => item.id === capability || item.name.includes(capabilityLabel(capability)) || item.scope.includes(capabilityLabel(capability)))
    : rules

  return scopedRules.slice(0, 3).map(item => ({
    id: `rule-card:${item.id}`,
    ruleId: item.id,
    title: item.name,
    summary: `${item.description} 当前状态：${item.enabled ? '已启用' : '已停用'}。`,
    rollback: '回滚方式：关闭规则后回退为纯人工判定与人工处置。',
    variant: item.enabled ? 'warning' : 'info',
  }))
}

export async function fetchAdminAiDashboardInsights(payload: AiDashboardInsightsRequest) {
  const envelope = await requestAdminAi<AiResultEnvelope<AiDashboardInsightsResponse>>('/dashboard-insights', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return mapDashboardEnvelopeToInsights(envelope)
}

export async function fetchAdminAiOpsReport(payload: AdminAiOpsReportRequest): Promise<AdminAiOpsReportResult> {
  const envelope = await requestAdminAi<AiResultEnvelope<AiOpsReportResponse>>('/ops-report', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (!envelope.available || !envelope.result) {
    throw new Error('AI 运营报告当前不可用。')
  }

  return {
    title: envelope.result.reportTitle,
    summary: envelope.result.summary,
    highlights: envelope.result.highlights,
    concerns: envelope.result.concerns,
    recommendations: envelope.result.recommendations,
  }
}

export async function fetchAdminAiHealthRisk(payload: AdminAiHealthRiskRequest): Promise<AiHealthInsight> {
  const envelope = await requestAdminAi<AiResultEnvelope<AiHealthRiskResponse>>('/health-risk', {
    method: 'POST',
    body: JSON.stringify({
      elderId: payload.elderId,
      elderName: payload.elderName,
      bloodPressure: payload.bloodPressure,
      heartRate: payload.heartRate,
      temperature: payload.temperature,
      bloodSugar: payload.bloodSugar,
      oxygen: payload.oxygen,
      currentMedications: payload.currentMedications,
      medicalHistory: payload.medicalHistory,
    }),
  })

  if (!envelope.available || !envelope.result) {
    throw new Error('健康风险 AI 当前不可用。')
  }

  return {
    elderlyId: payload.elderId,
    elderlyName: payload.elderName,
    roomNumber: payload.roomNumber,
    severity: mapRiskSeverity(envelope.result.riskLevel),
    title: envelope.result.riskLevel,
    explanation: envelope.result.explanation,
    action: envelope.result.recommendations[0] ?? envelope.result.monitoringPoints[0] ?? '继续观察。',
    confidence: envelope.cached ? 90 : 86,
  }
}

export async function fetchAdminAiAlertSuggestion(payload: AdminAiAlertSuggestionRequest) {
  const envelope = await requestAdminAi<AiResultEnvelope<AiAlertSuggestionResponse>>('/alert-suggestion', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (!envelope.available || !envelope.result) {
    throw new Error('报警建议 AI 当前不可用。')
  }

  return envelope.result
}

export async function fetchAdminTaskPriorityFocus(tasks: AdminAiTaskPriorityItem[]): Promise<StaffAppAiFocus[]> {
  const envelope = await requestAdminAi<AiResultEnvelope<AiTaskPriorityResponse>>('/task-priority', {
    method: 'POST',
    body: JSON.stringify({ tasks }),
  })

  if (!envelope.available || !envelope.result) {
    throw new Error('任务优先级 AI 当前不可用。')
  }

  const taskMap = new Map(tasks.map(item => [item.taskId, item]))
  return envelope.result.rankedTasks.slice(0, 3).map(item => {
    const task = taskMap.get(item.taskId)
    return {
      title: task ? `${task.title} · ${task.elderName}` : item.taskId,
      reason: item.reason,
      slaHint: `${item.priority} · 排名 ${item.rank}`,
      severity: mapTaskSeverity(item.priority),
    }
  })
}

export async function sendAdminAiChat(payload: AdminAiChatRequest) {
  const envelope = await requestAdminAi<AiResultEnvelope<AiChatResponse>>('/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (!envelope.available || !envelope.result) {
    throw new Error('AI 问答当前不可用。')
  }

  return envelope.result
}

export async function fetchAdminAiRules() {
  const rules = await requestAdminAi<AiRuleResponse[]>('/rules')
  return rules.map(mapRuleResponse)
}

export async function toggleAdminAiRule(ruleId: string, isEnabled: boolean) {
  const rule = await requestAdminAi<AiRuleResponse>(`/rules/${encodeURIComponent(ruleId)}/toggle`, {
    method: 'PATCH',
    body: JSON.stringify({ isEnabled }),
  })

  return mapRuleResponse(rule)
}

export async function fetchAdminAiAuditLogs(query: AdminAiAuditLogQuery = {}): Promise<AdminAiAuditLogResult> {
  const search = new URLSearchParams()
  if (query.capability) search.set('capability', query.capability)
  if (query.page) search.set('page', String(query.page))
  if (query.pageSize) search.set('pageSize', String(query.pageSize))

  const payload = await requestAdminAi<AiAuditLogListResponse>(`/audit-logs${search.toString() ? `?${search.toString()}` : ''}`)
  return {
    items: payload.items.map(mapAuditLogResponse),
    total: payload.total,
    page: payload.page,
    pageSize: payload.pageSize,
  }
}

export async function fetchAdminAiModelsStatus() {
  return requestAdminAi<AdminAiModelStatus[]>('/models/status')
}

export async function fetchStaffAiShiftSummary(payload: StaffAiShiftSummaryRequest) {
  const envelope = await requestAdminAi<AiResultEnvelope<AiShiftSummaryResponse>>('/staff/shift-summary', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (!envelope.available || !envelope.result) {
    throw new Error('班次摘要 AI 当前不可用。')
  }

  return envelope.result
}

export async function fetchStaffAiCareCopilot(payload: StaffAiCareCopilotRequest) {
  const envelope = await requestAdminAi<AiResultEnvelope<AiAlertSuggestionResponse>>('/staff/care-copilot', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (!envelope.available || !envelope.result) {
    throw new Error('报警响应 AI 当前不可用。')
  }

  return envelope.result
}

export async function fetchStaffAiHandoverDraft(payload: StaffAiHandoverDraftRequest) {
  const envelope = await requestAdminAi<AiResultEnvelope<AiHandoverDraftResponse>>('/staff/handover-draft', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (!envelope.available || !envelope.result) {
    throw new Error('交接班 AI 当前不可用。')
  }

  return envelope.result
}

export async function fetchStaffAiEscalationDraft(payload: StaffAiEscalationDraftRequest) {
  const envelope = await requestAdminAi<AiResultEnvelope<AiEscalationDraftResponse>>('/staff/escalation-draft', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (!envelope.available || !envelope.result) {
    throw new Error('升级草稿 AI 当前不可用。')
  }

  return envelope.result
}

export async function fetchFamilyAiTodaySummary(payload: FamilyAiTodaySummaryRequest): Promise<FamilyAppAiSummary> {
  const envelope = await requestAdminAi<AiResultEnvelope<AiFamilyTodaySummaryResponse>>('/family/today-summary', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (!envelope.available || !envelope.result) {
    throw new Error('家属摘要 AI 当前不可用。')
  }

  return {
    title: `${payload.elderName} 今日状态`,
    summary: envelope.result.summary,
    mood: /风险|异常|关注/.test(payload.healthSummary) ? '需安抚' : '情绪平稳',
    recommendation: envelope.result.frequentQuestions[0]?.answer ?? '建议继续保持常规沟通。',
  }
}

export async function fetchFamilyAiHealthExplain(payload: FamilyAiHealthExplainRequest) {
  const envelope = await requestAdminAi<AiResultEnvelope<AiHealthExplainResponse>>('/family/health-explain', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (!envelope.available || !envelope.result) {
    throw new Error('健康解读 AI 当前不可用。')
  }

  return envelope.result
}

export async function fetchFamilyAiVisitAssistant(payload: FamilyAiVisitAssistantRequest): Promise<VisitAiSuggestion[]> {
  const envelope = await requestAdminAi<AiResultEnvelope<AiVisitAssistantResponse>>('/family/visit-assistant', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (!envelope.available || !envelope.result) {
    throw new Error('探视助手 AI 当前不可用。')
  }

  const result = envelope.result
  const slotSuggestions = result.suggestedTimeSlots.map(slot => ({
    title: `${payload.elderName} 推荐时段 ${slot}`,
    summary: result.recommendation,
    action: `建议优先安排 ${slot}。`,
    type: '视频' as const,
  }))
  const tipSuggestions = result.visitTips.slice(0, 2).map(tip => ({
    title: `${payload.elderName} 探视提示`,
    summary: tip,
    action: result.recommendation,
    type: '沟通' as const,
  }))

  return [...slotSuggestions, ...tipSuggestions].slice(0, 3)
}

export async function sendFamilyAiChat(payload: FamilyAiChatRequest) {
  const envelope = await requestAdminAi<AiResultEnvelope<AiChatResponse>>('/family/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (!envelope.available || !envelope.result) {
    throw new Error('家属问答 AI 当前不可用。')
  }

  return envelope.result
}