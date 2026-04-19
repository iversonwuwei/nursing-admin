export interface ScheduleBoardAssignmentItem {
  assignmentId: string
  planId: string
  shift: string
  elderlyName: string
  packageName: string
  room: string
  status: string
}

export interface ScheduleBoardCellItem {
  dayLabel: string
  assignments: ScheduleBoardAssignmentItem[]
}

export interface ScheduleBoardStaffRowItem {
  staffId: string
  staffName: string
  staffRole: string
  employmentSource: string
  partnerAgencyName?: string | null
  assignedPlans: number
  exceptionPlans: number
  pendingReviewPlans: number
  cells: ScheduleBoardCellItem[]
}

export interface ScheduleBoardDaySummaryItem {
  dayLabel: string
  shifts: Array<{ shift: string; count: number }>
}

export interface ScheduleAttentionPlanItem {
  id: string
  elderlyName: string
  packageName: string
  ownerRole: string
  ownerName: string
  shift: string
  status: string
}

export interface ScheduleBoardSnapshot {
  weekLabel: string
  activePlans: number
  pendingReviewPlans: number
  unassignedPlans: number
  thirdPartyAssignedPlans: number
  publishedAssignments: number
  shiftDemand: Array<{ shift: string; count: number }>
  staffRows: ScheduleBoardStaffRowItem[]
  daySummaries: ScheduleBoardDaySummaryItem[]
  attentionPlans: ScheduleAttentionPlanItem[]
}

export interface NursingWorkflowObservability {
  pendingReviewPlans: number
  unassignedPlans: number
  archivedPlans: number
  completedTasks: number
  auditRecords: number
  taskCompletionTotal: number
  planArchiveTotal: number
  unassignedBacklogGauge: number
}

export interface AdminWorkflowBoardSnapshot {
  schedule: ScheduleBoardSnapshot
  observability: NursingWorkflowObservability
}

export const EMPTY_WORKFLOW_BOARD: AdminWorkflowBoardSnapshot = {
  schedule: {
    weekLabel: '本周排班',
    activePlans: 0,
    pendingReviewPlans: 0,
    unassignedPlans: 0,
    thirdPartyAssignedPlans: 0,
    publishedAssignments: 0,
    shiftDemand: [],
    staffRows: [],
    daySummaries: [],
    attentionPlans: [],
  },
  observability: {
    pendingReviewPlans: 0,
    unassignedPlans: 0,
    archivedPlans: 0,
    completedTasks: 0,
    auditRecords: 0,
    taskCompletionTotal: 0,
    planArchiveTotal: 0,
    unassignedBacklogGauge: 0,
  },
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return null
  }

  return response.json()
}

export async function fetchAdminWorkflowBoard(): Promise<AdminWorkflowBoardSnapshot> {
  const response = await fetch('/api/nursing/workflow/board', {
    cache: 'no-store',
  })

  if (!response.ok) {
    const payload = await readJsonResponse(response) as { detail?: string; title?: string; message?: string } | null
    throw new Error(payload?.detail ?? payload?.title ?? payload?.message ?? `workflow board request failed: ${response.status}`)
  }

  const payload = await response.json() as Partial<{
    schedule: Partial<ScheduleBoardSnapshot>
    observability: Partial<NursingWorkflowObservability>
  }>

  return {
    schedule: {
      weekLabel: payload.schedule?.weekLabel ?? EMPTY_WORKFLOW_BOARD.schedule.weekLabel,
      activePlans: payload.schedule?.activePlans ?? 0,
      pendingReviewPlans: payload.schedule?.pendingReviewPlans ?? 0,
      unassignedPlans: payload.schedule?.unassignedPlans ?? 0,
      thirdPartyAssignedPlans: payload.schedule?.thirdPartyAssignedPlans ?? 0,
      publishedAssignments: payload.schedule?.publishedAssignments ?? 0,
      shiftDemand: Array.isArray(payload.schedule?.shiftDemand) ? payload.schedule.shiftDemand : [],
      staffRows: Array.isArray(payload.schedule?.staffRows) ? payload.schedule.staffRows : [],
      daySummaries: Array.isArray(payload.schedule?.daySummaries) ? payload.schedule.daySummaries : [],
      attentionPlans: Array.isArray(payload.schedule?.attentionPlans) ? payload.schedule.attentionPlans : [],
    },
    observability: {
      pendingReviewPlans: payload.observability?.pendingReviewPlans ?? 0,
      unassignedPlans: payload.observability?.unassignedPlans ?? 0,
      archivedPlans: payload.observability?.archivedPlans ?? 0,
      completedTasks: payload.observability?.completedTasks ?? 0,
      auditRecords: payload.observability?.auditRecords ?? 0,
      taskCompletionTotal: payload.observability?.taskCompletionTotal ?? 0,
      planArchiveTotal: payload.observability?.planArchiveTotal ?? 0,
      unassignedBacklogGauge: payload.observability?.unassignedBacklogGauge ?? 0,
    },
  }
}