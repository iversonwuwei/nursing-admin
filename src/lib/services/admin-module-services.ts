export interface AdminAlertModuleSummary {
  module: string
  pending: number
  processing: number
  resolved: number
  critical: number
}

export interface AdminAlertSummaryResponse {
  modules: AdminAlertModuleSummary[]
  generatedAtUtc: string
}

export interface AdminAlertQueueItemResponse {
  alertId: string
  module: string
  type: string
  level: string
  status: string
  elderId: string
  elderlyName: string
  roomNumber: string
  description: string
  deviceName?: string | null
  occurredAt: string
  handledBy?: string | null
  handledAt?: string | null
  resolution?: string | null
}

export interface AdminFinanceSummaryResponse {
  pendingReview: number
  issued: number
  overdue: number
  pendingArchive: number
  actionRequired: number
  failedNotifications: number
  generatedAtUtc: string
}

export interface BillingInvoiceResponse {
  invoiceId: string
  tenantId: string
  elderId: string
  elderName: string
  packageName: string
  amount: number
  dueAtUtc: string
  status: string
  notificationStatus: string
  createdAtUtc: string
  updatedAtUtc?: string | null
}

export interface BillingInvoiceCreateRequest {
  elderId: string
  elderName: string
  packageName: string
  amount: number
  dueAtUtc: string
}

export interface AdminNotificationSummaryResponse {
  queued: number
  delivered: number
  failed: number
  broadcasts: number
  visitNotices: number
  scheduledReminders: number
  generatedAtUtc: string
}

export interface NotificationMessageResponse {
  notificationId: string
  tenantId: string
  audience: string
  audienceKey: string
  category: string
  title: string
  body: string
  sourceService: string
  sourceEntityId: string
  createdAtUtc: string
  updatedAtUtc?: string | null
  status: string
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return null
  }

  return response.json()
}

async function requestJson<T>(path: string, init?: RequestInit) {
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
    throw new Error(payload?.detail ?? payload?.title ?? payload?.message ?? `request failed: ${response.status}`)
  }

  return readJsonResponse(response) as Promise<T>
}

export async function fetchAlertCenterSnapshot() {
  const [summary, queue] = await Promise.all([
    requestJson<AdminAlertSummaryResponse>('/alerts/summary'),
    requestJson<AdminAlertQueueItemResponse[]>('/alerts'),
  ])

  return { summary, queue }
}

export async function submitAlertAction(alertId: string, action: string, note?: string) {
  return requestJson<AdminAlertQueueItemResponse>(`/alerts/${encodeURIComponent(alertId)}/actions`, {
    method: 'POST',
    body: JSON.stringify({ action, note }),
  })
}

export async function fetchFinanceCenterSnapshot() {
  const [summary, invoices] = await Promise.all([
    requestJson<AdminFinanceSummaryResponse>('/finance/summary'),
    requestJson<BillingInvoiceResponse[]>('/finance/invoices'),
  ])

  return { summary, invoices }
}

export async function createFinanceInvoice(payload: BillingInvoiceCreateRequest) {
  return requestJson<BillingInvoiceResponse>('/finance/invoices', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchNotificationCenterSnapshot() {
  const [summary, queue] = await Promise.all([
    requestJson<AdminNotificationSummaryResponse>('/notifications/summary'),
    requestJson<NotificationMessageResponse[]>('/notifications/queue'),
  ])

  return { summary, queue }
}
