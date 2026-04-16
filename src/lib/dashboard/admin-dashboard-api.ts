export interface AdminDashboardKpis {
  elderCount: number
  tenantCount: number
  pendingAlerts: number
  workflowPendingCount: number
}

export interface AdminDashboardAlertModule {
  label: string
  pending: number
  processing: number
  resolved: number
  critical: number
  totalOpen: number
}

export interface AdminDashboardMetricItem {
  label: string
  value: number
}

export interface AdminDashboardStaffLeaderboardItem {
  name: string
  role: string
  tasks: number
  completed: number
  completionRate: number
  trend: 'up' | 'down'
}

export interface AdminDashboardOverviewResponse {
  generatedAtUtc: string
  kpis: AdminDashboardKpis
  alertModules: AdminDashboardAlertModule[]
  notificationBreakdown: AdminDashboardMetricItem[]
  financeBreakdown: AdminDashboardMetricItem[]
  workflowBreakdown: AdminDashboardMetricItem[]
  staffLeaderboard: AdminDashboardStaffLeaderboardItem[]
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return null
  }

  return response.json()
}

export async function fetchAdminDashboardOverview(): Promise<AdminDashboardOverviewResponse> {
  const response = await fetch('/api/dashboard/overview', {
    cache: 'no-store',
  })

  if (!response.ok) {
    const payload = await readJsonResponse(response) as { detail?: string; title?: string; message?: string } | null
    throw new Error(payload?.detail ?? payload?.title ?? payload?.message ?? `dashboard request failed: ${response.status}`)
  }

  return await response.json() as AdminDashboardOverviewResponse
}