'use client'

// ── Mode ─────────────────────────────────────────────────────

export type ContentManagementMode = 'demo' | 'bff'

const CONTENT_MODE: ContentManagementMode =
  process.env.NEXT_PUBLIC_CONTENT_MANAGEMENT_MODE === 'bff' ? 'bff' : 'demo'

export function getContentManagementMode(): ContentManagementMode { return CONTENT_MODE }
export function isContentManagementDemoMode() { return CONTENT_MODE === 'demo' }

// ── Types ────────────────────────────────────────────────────

export interface StaticTextItem {
  id: string
  namespace: string
  textKey: string
  locale: string
  textValue: string
  description: string
  version: number
  updatedBy: string
  updatedAt: string
}

export interface OptionGroup {
  id: string
  groupCode: string
  groupName: string
  description: string
  isSystem: boolean
  status: 'active' | 'archived'
  itemCount: number
  updatedAt: string
}

export interface OptionItem {
  id: string
  groupId: string
  optionCode: string
  labelZh: string
  labelEn: string
  sortOrder: number
  isActive: boolean
  isDefault: boolean
  updatedAt: string
}

export interface ContentAuditLog {
  id: string
  operatorName: string
  resourceType: string
  resourceId: string
  action: string
  beforeSnapshot: string | null
  afterSnapshot: string | null
  createdAt: string
}

// ── Namespaces ───────────────────────────────────────────────

export const NAMESPACES = ['app_family', 'app_nani', 'admin', 'common'] as const
export type TextNamespace = (typeof NAMESPACES)[number]

export const NAMESPACE_LABELS: Record<TextNamespace, string> = {
  app_family: '家属 APP',
  app_nani: '员工 APP',
  admin: '管理后台',
  common: '通用',
}

export const LOCALES = ['zh-CN', 'en-US'] as const

export const ACTION_LABELS: Record<string, string> = {
  create: '新建',
  update: '编辑',
  delete: '删除',
  enable: '启用',
  disable: '禁用',
}

export const RESOURCE_TYPE_LABELS: Record<string, string> = {
  static_text: '静态文本',
  option_group: '选项分组',
  option_item: '选项条目',
}

// ── Mock Static Texts ────────────────────────────────────────

const _staticTexts: StaticTextItem[] = [
  { id: 'ST-001', namespace: 'app_family', textKey: 'error.network_timeout', locale: 'zh-CN', textValue: '网络连接超时，请检查网络设置后重试。', description: '通用网络错误提示', version: 2, updatedBy: '张管理员', updatedAt: '2026-04-01' },
  { id: 'ST-002', namespace: 'app_family', textKey: 'visit.booking_success', locale: 'zh-CN', textValue: '探视预约已成功提交，工作人员将在24小时内审核。', description: '家属APP探视预约成功提示', version: 3, updatedBy: '张管理员', updatedAt: '2026-04-03' },
  { id: 'ST-003', namespace: 'app_family', textKey: 'visit.cancel_confirm', locale: 'zh-CN', textValue: '确定要取消本次探视预约吗？取消后需重新预约。', description: '家属APP探视取消确认', version: 1, updatedBy: '李编辑', updatedAt: '2026-03-28' },
  { id: 'ST-004', namespace: 'app_nani', textKey: 'task.remind_upcoming', locale: 'zh-CN', textValue: '您有一项护理任务即将开始，请及时前往执行。', description: '员工APP任务即将开始提醒', version: 2, updatedBy: '张管理员', updatedAt: '2026-03-30' },
  { id: 'ST-005', namespace: 'app_nani', textKey: 'task.completed', locale: 'zh-CN', textValue: '护理任务已完成，感谢您的辛勤工作！', description: '员工APP任务完成提示', version: 1, updatedBy: '李编辑', updatedAt: '2026-03-25' },
  { id: 'ST-006', namespace: 'app_nani', textKey: 'handoff.pending', locale: 'zh-CN', textValue: '您有一条交接班记录待确认，请尽快处理。', description: '员工APP交接班提醒', version: 1, updatedBy: '李编辑', updatedAt: '2026-03-26' },
  { id: 'ST-007', namespace: 'admin', textKey: 'admission.review_required', locale: 'zh-CN', textValue: '该入住申请需要护理主管复核确认。', description: '管理后台入住审核提示', version: 1, updatedBy: '张管理员', updatedAt: '2026-04-01' },
  { id: 'ST-008', namespace: 'admin', textKey: 'device.alarm_threshold', locale: 'zh-CN', textValue: '设备报警阈值已更新，请确认新规则生效。', description: '管理后台设备阈值变更提示', version: 2, updatedBy: '王运维', updatedAt: '2026-04-02' },
  { id: 'ST-009', namespace: 'common', textKey: 'auth.session_expired', locale: 'zh-CN', textValue: '登录已过期，请重新登录。', description: '通用会话过期提示', version: 1, updatedBy: '张管理员', updatedAt: '2026-03-20' },
  { id: 'ST-010', namespace: 'common', textKey: 'error.server_error', locale: 'zh-CN', textValue: '服务器异常，请稍后重试或联系管理员。', description: '通用服务端错误提示', version: 1, updatedBy: '张管理员', updatedAt: '2026-03-20' },
  { id: 'ST-011', namespace: 'app_family', textKey: 'health.bp_warning', locale: 'zh-CN', textValue: '您的家人血压偏高，护理人员已关注。', description: '家属APP血压预警通知', version: 1, updatedBy: '李编辑', updatedAt: '2026-04-05' },
  { id: 'ST-012', namespace: 'app_family', textKey: 'activity.signup_success', locale: 'zh-CN', textValue: '活动报名成功，届时会提前通知您。', description: '家属APP活动报名成功', version: 1, updatedBy: '李编辑', updatedAt: '2026-04-04' },
]

// ── Mock Option Groups ───────────────────────────────────────

const _optionGroups: OptionGroup[] = [
  { id: 'OG-001', groupCode: 'care_level', groupName: '护理等级', description: '老人护理等级选项', isSystem: true, status: 'active', itemCount: 4, updatedAt: '2026-04-01' },
  { id: 'OG-002', groupCode: 'alert_type', groupName: '报警类型', description: '设备与健康报警分类', isSystem: true, status: 'active', itemCount: 6, updatedAt: '2026-04-01' },
  { id: 'OG-003', groupCode: 'room_type', groupName: '房间类型', description: '房间类型选项', isSystem: true, status: 'active', itemCount: 3, updatedAt: '2026-03-28' },
  { id: 'OG-004', groupCode: 'activity_type', groupName: '活动类型', description: '院内活动分类', isSystem: false, status: 'active', itemCount: 5, updatedAt: '2026-04-03' },
  { id: 'OG-005', groupCode: 'incident_type', groupName: '事故类型', description: '安全事故分类', isSystem: true, status: 'active', itemCount: 4, updatedAt: '2026-03-25' },
  { id: 'OG-006', groupCode: 'visit_type', groupName: '探视类型', description: '家属探视方式', isSystem: false, status: 'active', itemCount: 3, updatedAt: '2026-04-02' },
  { id: 'OG-007', groupCode: 'gender', groupName: '性别', description: '人员性别选项', isSystem: true, status: 'active', itemCount: 2, updatedAt: '2026-03-20' },
  { id: 'OG-008', groupCode: 'payment_status', groupName: '缴费状态', description: '账单缴费状态', isSystem: true, status: 'active', itemCount: 3, updatedAt: '2026-03-22' },
]

// ── Mock Option Items ────────────────────────────────────────

const _optionItems: Record<string, OptionItem[]> = {
  'OG-001': [
    { id: 'OI-001', groupId: 'OG-001', optionCode: 'self_care', labelZh: '自理', labelEn: 'Self-care', sortOrder: 0, isActive: true, isDefault: false, updatedAt: '2026-04-01' },
    { id: 'OI-002', groupId: 'OG-001', optionCode: 'partial_care', labelZh: '半自理', labelEn: 'Partial Care', sortOrder: 1, isActive: true, isDefault: true, updatedAt: '2026-04-01' },
    { id: 'OI-003', groupId: 'OG-001', optionCode: 'full_care', labelZh: '全护理', labelEn: 'Full Care', sortOrder: 2, isActive: true, isDefault: false, updatedAt: '2026-04-01' },
    { id: 'OI-004', groupId: 'OG-001', optionCode: 'special_care', labelZh: '特护', labelEn: 'Special Care', sortOrder: 3, isActive: true, isDefault: false, updatedAt: '2026-04-01' },
  ],
  'OG-002': [
    { id: 'OI-010', groupId: 'OG-002', optionCode: 'fall', labelZh: '跌倒报警', labelEn: 'Fall Alert', sortOrder: 0, isActive: true, isDefault: false, updatedAt: '2026-04-01' },
    { id: 'OI-011', groupId: 'OG-002', optionCode: 'device', labelZh: '设备报警', labelEn: 'Device Alert', sortOrder: 1, isActive: true, isDefault: false, updatedAt: '2026-04-01' },
    { id: 'OI-012', groupId: 'OG-002', optionCode: 'health', labelZh: '健康异常', labelEn: 'Health Alert', sortOrder: 2, isActive: true, isDefault: false, updatedAt: '2026-04-01' },
    { id: 'OI-013', groupId: 'OG-002', optionCode: 'call', labelZh: '呼叫请求', labelEn: 'Call Request', sortOrder: 3, isActive: true, isDefault: false, updatedAt: '2026-04-01' },
    { id: 'OI-014', groupId: 'OG-002', optionCode: 'sos', labelZh: 'SOS 紧急', labelEn: 'SOS', sortOrder: 4, isActive: true, isDefault: false, updatedAt: '2026-04-01' },
    { id: 'OI-015', groupId: 'OG-002', optionCode: 'geofence', labelZh: '围栏越界', labelEn: 'Geofence', sortOrder: 5, isActive: false, isDefault: false, updatedAt: '2026-04-01' },
  ],
  'OG-003': [
    { id: 'OI-020', groupId: 'OG-003', optionCode: 'single', labelZh: '单人间', labelEn: 'Single Room', sortOrder: 0, isActive: true, isDefault: false, updatedAt: '2026-03-28' },
    { id: 'OI-021', groupId: 'OG-003', optionCode: 'double', labelZh: '双人间', labelEn: 'Double Room', sortOrder: 1, isActive: true, isDefault: true, updatedAt: '2026-03-28' },
    { id: 'OI-022', groupId: 'OG-003', optionCode: 'multi', labelZh: '多人间', labelEn: 'Multi-bed Room', sortOrder: 2, isActive: true, isDefault: false, updatedAt: '2026-03-28' },
  ],
  'OG-004': [
    { id: 'OI-030', groupId: 'OG-004', optionCode: 'health_lecture', labelZh: '健康讲座', labelEn: 'Health Lecture', sortOrder: 0, isActive: true, isDefault: false, updatedAt: '2026-04-03' },
    { id: 'OI-031', groupId: 'OG-004', optionCode: 'handicraft', labelZh: '手工活动', labelEn: 'Handicraft', sortOrder: 1, isActive: true, isDefault: false, updatedAt: '2026-04-03' },
    { id: 'OI-032', groupId: 'OG-004', optionCode: 'exercise', labelZh: '体育锻炼', labelEn: 'Exercise', sortOrder: 2, isActive: true, isDefault: false, updatedAt: '2026-04-03' },
    { id: 'OI-033', groupId: 'OG-004', optionCode: 'entertainment', labelZh: '文娱活动', labelEn: 'Entertainment', sortOrder: 3, isActive: true, isDefault: false, updatedAt: '2026-04-03' },
    { id: 'OI-034', groupId: 'OG-004', optionCode: 'birthday', labelZh: '生日会', labelEn: 'Birthday Party', sortOrder: 4, isActive: true, isDefault: false, updatedAt: '2026-04-03' },
  ],
  'OG-005': [
    { id: 'OI-040', groupId: 'OG-005', optionCode: 'fall_injury', labelZh: '跌倒伤害', labelEn: 'Fall Injury', sortOrder: 0, isActive: true, isDefault: false, updatedAt: '2026-03-25' },
    { id: 'OI-041', groupId: 'OG-005', optionCode: 'medication_error', labelZh: '用药差错', labelEn: 'Medication Error', sortOrder: 1, isActive: true, isDefault: false, updatedAt: '2026-03-25' },
    { id: 'OI-042', groupId: 'OG-005', optionCode: 'skin_issue', labelZh: '皮肤破损', labelEn: 'Skin Issue', sortOrder: 2, isActive: true, isDefault: false, updatedAt: '2026-03-25' },
    { id: 'OI-043', groupId: 'OG-005', optionCode: 'other', labelZh: '其他', labelEn: 'Other', sortOrder: 3, isActive: true, isDefault: false, updatedAt: '2026-03-25' },
  ],
  'OG-006': [
    { id: 'OI-050', groupId: 'OG-006', optionCode: 'onsite', labelZh: '到院探视', labelEn: 'On-site Visit', sortOrder: 0, isActive: true, isDefault: true, updatedAt: '2026-04-02' },
    { id: 'OI-051', groupId: 'OG-006', optionCode: 'video', labelZh: '视频探视', labelEn: 'Video Visit', sortOrder: 1, isActive: true, isDefault: false, updatedAt: '2026-04-02' },
    { id: 'OI-052', groupId: 'OG-006', optionCode: 'outing', labelZh: '外出探视', labelEn: 'Outing Visit', sortOrder: 2, isActive: true, isDefault: false, updatedAt: '2026-04-02' },
  ],
  'OG-007': [
    { id: 'OI-060', groupId: 'OG-007', optionCode: 'male', labelZh: '男', labelEn: 'Male', sortOrder: 0, isActive: true, isDefault: false, updatedAt: '2026-03-20' },
    { id: 'OI-061', groupId: 'OG-007', optionCode: 'female', labelZh: '女', labelEn: 'Female', sortOrder: 1, isActive: true, isDefault: false, updatedAt: '2026-03-20' },
  ],
  'OG-008': [
    { id: 'OI-070', groupId: 'OG-008', optionCode: 'pending', labelZh: '待支付', labelEn: 'Pending', sortOrder: 0, isActive: true, isDefault: true, updatedAt: '2026-03-22' },
    { id: 'OI-071', groupId: 'OG-008', optionCode: 'paid', labelZh: '已支付', labelEn: 'Paid', sortOrder: 1, isActive: true, isDefault: false, updatedAt: '2026-03-22' },
    { id: 'OI-072', groupId: 'OG-008', optionCode: 'overdue', labelZh: '逾期', labelEn: 'Overdue', sortOrder: 2, isActive: true, isDefault: false, updatedAt: '2026-03-22' },
  ],
}

// ── Mock Audit Logs ──────────────────────────────────────────

const _auditLogs: ContentAuditLog[] = [
  { id: 'AL-001', operatorName: '张管理员', resourceType: 'static_text', resourceId: 'ST-002', action: 'update', beforeSnapshot: '{"textValue":"探视预约已提交，请等待审批。"}', afterSnapshot: '{"textValue":"探视预约已成功提交，工作人员将在24小时内审核。"}', createdAt: '2026-04-03 14:22' },
  { id: 'AL-002', operatorName: '张管理员', resourceType: 'static_text', resourceId: 'ST-001', action: 'update', beforeSnapshot: '{"textValue":"网络连接超时，请重试。"}', afterSnapshot: '{"textValue":"网络连接超时，请检查网络设置后重试。"}', createdAt: '2026-04-01 10:15' },
  { id: 'AL-003', operatorName: '李编辑', resourceType: 'static_text', resourceId: 'ST-011', action: 'create', beforeSnapshot: null, afterSnapshot: '{"namespace":"app_family","textKey":"health.bp_warning","textValue":"您的家人血压偏高，护理人员已关注。"}', createdAt: '2026-04-05 09:30' },
  { id: 'AL-004', operatorName: '李编辑', resourceType: 'option_item', resourceId: 'OI-034', action: 'create', beforeSnapshot: null, afterSnapshot: '{"optionCode":"birthday","labelZh":"生日会"}', createdAt: '2026-04-03 16:00' },
  { id: 'AL-005', operatorName: '张管理员', resourceType: 'option_group', resourceId: 'OG-006', action: 'create', beforeSnapshot: null, afterSnapshot: '{"groupCode":"visit_type","groupName":"探视类型"}', createdAt: '2026-04-02 11:00' },
  { id: 'AL-006', operatorName: '王运维', resourceType: 'static_text', resourceId: 'ST-008', action: 'update', beforeSnapshot: '{"textValue":"设备报警阈值已更新。"}', afterSnapshot: '{"textValue":"设备报警阈值已更新，请确认新规则生效。"}', createdAt: '2026-04-02 15:30' },
  { id: 'AL-007', operatorName: '张管理员', resourceType: 'option_item', resourceId: 'OI-015', action: 'disable', beforeSnapshot: '{"isActive":true}', afterSnapshot: '{"isActive":false}', createdAt: '2026-04-01 09:45' },
  { id: 'AL-008', operatorName: '李编辑', resourceType: 'static_text', resourceId: 'ST-012', action: 'create', beforeSnapshot: null, afterSnapshot: '{"namespace":"app_family","textKey":"activity.signup_success","textValue":"活动报名成功，届时会提前通知您。"}', createdAt: '2026-04-04 10:20' },
]

// ── Public API ───────────────────────────────────────────────

export function getStaticTexts() { return _staticTexts }

export function getStaticTextsByFilter(ns?: string, locale?: string, keyword?: string) {
  let result = [..._staticTexts]
  if (ns) result = result.filter(t => t.namespace === ns)
  if (locale) result = result.filter(t => t.locale === locale)
  if (keyword) {
    const kw = keyword.toLowerCase()
    result = result.filter(t => t.textKey.toLowerCase().includes(kw) || t.textValue.toLowerCase().includes(kw))
  }
  return result
}

export function getOptionGroups() { return _optionGroups }

export function getOptionGroupsByFilter(status?: string, keyword?: string) {
  let result = [..._optionGroups]
  if (status) result = result.filter(g => g.status === status)
  if (keyword) {
    const kw = keyword.toLowerCase()
    result = result.filter(g => g.groupCode.toLowerCase().includes(kw) || g.groupName.toLowerCase().includes(kw))
  }
  return result
}

export function getOptionItemsByGroupId(groupId: string) {
  return _optionItems[groupId] ?? []
}

export function getAuditLogs() { return _auditLogs }

export function getAuditLogsByFilter(resourceType?: string, keyword?: string) {
  let result = [..._auditLogs]
  if (resourceType) result = result.filter(l => l.resourceType === resourceType)
  if (keyword) {
    const kw = keyword.toLowerCase()
    result = result.filter(l => l.operatorName.toLowerCase().includes(kw) || l.resourceId.toLowerCase().includes(kw))
  }
  return result
}

// ── BFF Async API ────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function formatDateTime(iso: string): string {
  if (!iso) return ''
  return iso.replace('T', ' ').slice(0, 16)
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return null
  return response.json()
}

async function requestContentApi<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/content${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const payload = await readJsonResponse(response) as { detail?: string; title?: string; message?: string } | null
    throw new Error(payload?.detail ?? payload?.title ?? payload?.message ?? `content API failed: ${response.status}`)
  }

  return await response.json() as T
}

// ── Static Text (async) ─────────────────────────────────────

interface StaticTextBffResponse {
  id: string; tenantId: string; namespace: string; textKey: string; locale: string
  textValue: string; description: string | null; version: number; updatedBy: string | null
  createdAtUtc: string; updatedAtUtc: string
}

function mapStaticText(r: StaticTextBffResponse): StaticTextItem {
  return {
    id: r.id, namespace: r.namespace, textKey: r.textKey, locale: r.locale,
    textValue: r.textValue, description: r.description ?? '', version: r.version,
    updatedBy: r.updatedBy ?? '', updatedAt: formatDate(r.updatedAtUtc),
  }
}

export interface PaginatedResult<T> { items: T[]; total: number }

export async function fetchStaticTexts(params?: {
  ns?: string; locale?: string; keyword?: string; page?: number; pageSize?: number
}): Promise<PaginatedResult<StaticTextItem>> {
  if (CONTENT_MODE === 'demo') {
    const all = getStaticTextsByFilter(params?.ns, params?.locale, params?.keyword)
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 20
    return { items: all.slice((page - 1) * pageSize, page * pageSize), total: all.length }
  }

  const qs = new URLSearchParams()
  if (params?.ns) qs.set('ns', params.ns)
  if (params?.locale) qs.set('locale', params.locale)
  if (params?.keyword) qs.set('keyword', params.keyword)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
  const search = qs.toString()

  const result = await requestContentApi<{ items: StaticTextBffResponse[]; total: number }>(
    `/static-texts${search ? `?${search}` : ''}`,
  )
  return { items: result.items.map(mapStaticText), total: result.total }
}

export async function fetchStaticTextNamespaceTotals(): Promise<Record<string, number>> {
  if (CONTENT_MODE === 'demo') {
    return Object.fromEntries(NAMESPACES.map(namespace => [namespace, getStaticTextsByFilter(namespace).length]))
  }

  const totals = await Promise.all(
    NAMESPACES.map(async namespace => {
      const result = await fetchStaticTexts({ ns: namespace, page: 1, pageSize: 1 })
      return [namespace, result.total] as const
    }),
  )

  return Object.fromEntries(totals)
}

// ── Option Groups (async) ───────────────────────────────────

interface OptionGroupBffResponse {
  id: string; tenantId: string; groupCode: string; groupName: string
  description: string | null; isSystem: boolean; status: string; itemCount: number
  updatedAtUtc: string
}

function mapOptionGroup(r: OptionGroupBffResponse): OptionGroup {
  return {
    id: r.id, groupCode: r.groupCode, groupName: r.groupName,
    description: r.description ?? '', isSystem: r.isSystem,
    status: r.status as 'active' | 'archived', itemCount: r.itemCount,
    updatedAt: formatDate(r.updatedAtUtc),
  }
}

export async function fetchOptionGroups(params?: {
  status?: string; keyword?: string
}): Promise<OptionGroup[]> {
  if (CONTENT_MODE === 'demo') {
    return getOptionGroupsByFilter(params?.status, params?.keyword)
  }

  const qs = new URLSearchParams()
  if (params?.status) qs.set('status', params.status)
  if (params?.keyword) qs.set('keyword', params.keyword)
  const search = qs.toString()

  const result = await requestContentApi<{ items: OptionGroupBffResponse[] }>(
    `/option-groups${search ? `?${search}` : ''}`,
  )
  return result.items.map(mapOptionGroup)
}

// ── Option Items (async) ────────────────────────────────────

interface OptionItemBffResponse {
  id: string; groupId: string; optionCode: string; labelZh: string
  labelEn: string | null; sortOrder: number; isActive: boolean; isDefault: boolean
  updatedAtUtc: string
}

function mapOptionItem(r: OptionItemBffResponse): OptionItem {
  return {
    id: r.id, groupId: r.groupId, optionCode: r.optionCode,
    labelZh: r.labelZh, labelEn: r.labelEn ?? '', sortOrder: r.sortOrder,
    isActive: r.isActive, isDefault: r.isDefault,
    updatedAt: formatDate(r.updatedAtUtc),
  }
}

export async function fetchOptionItems(groupId: string): Promise<OptionItem[]> {
  if (CONTENT_MODE === 'demo') {
    return getOptionItemsByGroupId(groupId)
  }

  const items = await requestContentApi<OptionItemBffResponse[]>(
    `/option-groups/${encodeURIComponent(groupId)}/items`,
  )
  return items.map(mapOptionItem)
}

// ── Audit Logs (async) ──────────────────────────────────────

interface AuditLogBffResponse {
  id: string; tenantId: string; operatorId: string; operatorName: string
  resourceType: string; resourceId: string; action: string
  beforeSnapshot: string | null; afterSnapshot: string | null; createdAtUtc: string
}

function mapAuditLog(r: AuditLogBffResponse): ContentAuditLog {
  return {
    id: r.id, operatorName: r.operatorName, resourceType: r.resourceType,
    resourceId: r.resourceId, action: r.action,
    beforeSnapshot: r.beforeSnapshot, afterSnapshot: r.afterSnapshot,
    createdAt: formatDateTime(r.createdAtUtc),
  }
}

export async function fetchAuditLogs(params?: {
  resourceType?: string; keyword?: string; page?: number; pageSize?: number
}): Promise<PaginatedResult<ContentAuditLog>> {
  if (CONTENT_MODE === 'demo') {
    const all = getAuditLogsByFilter(params?.resourceType, params?.keyword)
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 20
    return { items: all.slice((page - 1) * pageSize, page * pageSize), total: all.length }
  }

  const qs = new URLSearchParams()
  if (params?.resourceType) qs.set('resourceType', params.resourceType)
  if (params?.keyword) qs.set('keyword', params.keyword)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
  const search = qs.toString()

  const result = await requestContentApi<{ items: AuditLogBffResponse[]; total: number }>(
    `/audit-logs${search ? `?${search}` : ''}`,
  )
  return { items: result.items.map(mapAuditLog), total: result.total }
}
