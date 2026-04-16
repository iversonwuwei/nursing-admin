import { type AlertRecord } from '@/lib/data/alerts-data'
import { OPERATIONS_TODAY, type LiveActivity, type LiveIncident } from '@/lib/mock/operations-workflow'

function getActivityDateTime(activity: Pick<LiveActivity, 'date' | 'time'>) {
  return `${activity.date} ${activity.time}`
}

export function getAlertPriorityScore(alert: Pick<AlertRecord, 'status' | 'level' | 'type'>) {
  const statusWeight = { pending: 300, processing: 200, resolved: 100 }[alert.status]
  const levelWeight = { critical: 90, warning: 60, info: 30 }[alert.level]
  const typeWeight = { fall: 20, health: 16, device: 12, call: 10, bedExit: 18, sos: 24 }[alert.type]

  return statusWeight + levelWeight + typeWeight
}

export function sortAlertsByPriority(alerts: AlertRecord[]) {
  return [...alerts].sort((left, right) => {
    const scoreDiff = getAlertPriorityScore(right) - getAlertPriorityScore(left)
    if (scoreDiff !== 0) return scoreDiff
    return right.occurredAt.localeCompare(left.occurredAt)
  })
}

export function getActivityPriorityScore(activity: Pick<LiveActivity, 'lifecycleStatus' | 'status' | 'date' | 'participants' | 'capacity'>, today = OPERATIONS_TODAY) {
  const lifecycleWeight = activity.lifecycleStatus === '待发布' ? 320 : 0
  const todayWeight = activity.date === today ? 120 : 0
  const statusWeight = {
    '进行中': 180,
    '报名中': 120,
    '待发布': 80,
    '已完成': 20,
  }[activity.status]
  const fillRate = activity.capacity > 0 ? Math.round((activity.participants / activity.capacity) * 100) : 0
  const fillWeight = fillRate >= 85 ? 30 : fillRate >= 60 ? 18 : 8

  return lifecycleWeight + todayWeight + statusWeight + fillWeight
}

export function sortActivitiesByPriority(activities: LiveActivity[], today = OPERATIONS_TODAY) {
  return [...activities].sort((left, right) => {
    const scoreDiff = getActivityPriorityScore(right, today) - getActivityPriorityScore(left, today)
    if (scoreDiff !== 0) return scoreDiff
    return getActivityDateTime(left).localeCompare(getActivityDateTime(right))
  })
}

export function getIncidentPriorityScore(incident: Pick<LiveIncident, 'status' | 'level' | 'elder'>) {
  const statusWeight = { '待分派': 320, '处理中': 220, '已结案': 80 }[incident.status]
  const levelWeight = { '严重': 90, '一般': 60, '轻微': 30 }[incident.level]
  const elderWeight = incident.elder ? 12 : 0

  return statusWeight + levelWeight + elderWeight
}

export function sortIncidentsByPriority(incidents: LiveIncident[]) {
  return [...incidents].sort((left, right) => {
    const scoreDiff = getIncidentPriorityScore(right) - getIncidentPriorityScore(left)
    if (scoreDiff !== 0) return scoreDiff
    return right.time.localeCompare(left.time)
  })
}