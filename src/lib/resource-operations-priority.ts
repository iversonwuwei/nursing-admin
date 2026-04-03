import type { LiveRoom } from '@/lib/mock/master-data-workflow'
import type { LiveStaffRecord, LiveSupplyRecord } from '@/lib/mock/resource-workflow'

type StaffPriorityCandidate = Pick<LiveStaffRecord, 'lifecycleStatus' | 'status' | 'employmentSource' | 'createdAt'>
type RoomPriorityCandidate = Pick<LiveRoom, 'lifecycleStatus' | 'status' | 'cleanStatus' | 'nextClean'>
type SupplyPriorityCandidate = Pick<LiveSupplyRecord, 'lifecycleStatus' | 'status' | 'stock' | 'minStock' | 'name'>

export type MonitorPriorityCandidate = {
  name: string
  status: 'online' | 'offline'
  alert?: {
    level: 'warning' | 'danger'
    msg: string
  } | null
  metrics: {
    battery: number
  }
}

export function getStaffPriorityScore(staff: StaffPriorityCandidate) {
  if (staff.lifecycleStatus === '待入职') return 0
  if (staff.status === '休假') return 1
  if (staff.employmentSource === '第三方合作') return 2
  return 3
}

export function sortStaffByPriority<T extends StaffPriorityCandidate>(records: readonly T[]) {
  return [...records].sort((left, right) => {
    const scoreDiff = getStaffPriorityScore(left) - getStaffPriorityScore(right)
    if (scoreDiff !== 0) return scoreDiff
    return right.createdAt.localeCompare(left.createdAt)
  })
}

export function getRoomPriorityScore(room: RoomPriorityCandidate) {
  if (room.lifecycleStatus === '待启用') return 0
  if (room.status === '维护中') return 1
  if (room.cleanStatus !== '已清洁') return 2
  if (room.status === '可入住') return 3
  return 4
}

export function sortRoomsByPriority<T extends RoomPriorityCandidate>(rooms: readonly T[]) {
  return [...rooms].sort((left, right) => {
    const scoreDiff = getRoomPriorityScore(left) - getRoomPriorityScore(right)
    if (scoreDiff !== 0) return scoreDiff
    return left.nextClean.localeCompare(right.nextClean)
  })
}

export function getSupplyPriorityScore(supply: SupplyPriorityCandidate) {
  if (supply.lifecycleStatus === '待上架') return 0
  if (supply.status === '库存不足') return 1
  if (supply.stock <= supply.minStock * 1.2) return 2
  return 3
}

export function sortSuppliesByPriority<T extends SupplyPriorityCandidate>(supplies: readonly T[]) {
  return [...supplies].sort((left, right) => {
    const scoreDiff = getSupplyPriorityScore(left) - getSupplyPriorityScore(right)
    if (scoreDiff !== 0) return scoreDiff

    const leftGap = left.minStock - left.stock
    const rightGap = right.minStock - right.stock
    if (leftGap !== rightGap) return rightGap - leftGap

    return left.name.localeCompare(right.name)
  })
}

export function getMonitorPriorityScore(point: MonitorPriorityCandidate) {
  const alertLevel = point.alert?.level

  if (alertLevel === 'danger' || point.status === 'offline') return 0
  if (alertLevel === 'warning') return 1
  if (point.metrics.battery < 50) return 2
  return 3
}

export function sortMonitorPointsByPriority<T extends MonitorPriorityCandidate>(points: readonly T[]) {
  return [...points].sort((left, right) => {
    const scoreDiff = getMonitorPriorityScore(left) - getMonitorPriorityScore(right)
    if (scoreDiff !== 0) return scoreDiff

    if (left.metrics.battery !== right.metrics.battery) {
      return left.metrics.battery - right.metrics.battery
    }

    return left.name.localeCompare(right.name)
  })
}