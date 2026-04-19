import type { AdminEquipmentRecord } from '@/lib/services/admin-operations-services'

export type EquipmentMonitorAlertLevel = 'warning' | 'danger'

export interface EquipmentDerivedAlert {
  id: string
  equipmentId: string
  equipmentName: string
  status: '待处理' | '已处理'
  type: string
  msg: string
}

export interface EquipmentMonitorPoint {
  id: string
  name: string
  room: string
  status: 'online' | 'warning' | 'offline'
  runtimeHours: number
  metrics: {
    hr: number | null
    bp: string | null
    temp: number | null
    spo2: number | null
    battery: number
  }
  alert: null | {
    level: EquipmentMonitorAlertLevel
    msg: string
  }
}

export interface EquipmentStatusRow {
  id: string
  name: string
  room: string
  type: string
  status: 'online' | 'warning' | 'offline'
  signal: number
  battery: number
  uptime: number
  lastAlert: string | null
}

function getMonitorStatus(item: AdminEquipmentRecord): EquipmentMonitorPoint['status'] {
  if (item.status === '已报废' || item.signal <= 0 || item.battery <= 0) {
    return 'offline'
  }

  if (item.lifecycleStatus === '待验收' || item.status === '待维修' || item.status === '维修中' || item.signal <= 50 || item.battery <= 30) {
    return 'warning'
  }

  return 'online'
}

function buildAlert(item: AdminEquipmentRecord, monitorStatus: EquipmentMonitorPoint['status']): EquipmentMonitorPoint['alert'] {
  if (monitorStatus === 'offline') {
    return { level: 'danger', msg: item.status === '已报废' ? '设备已下线' : '设备离线' }
  }

  if (item.lifecycleStatus === '待验收') {
    return { level: 'warning', msg: '待验收' }
  }

  if (item.status === '待维修' || item.status === '维修中') {
    return { level: 'warning', msg: item.status }
  }

  if (item.battery <= 30) {
    return { level: 'warning', msg: '电量低于 30%' }
  }

  if (item.signal <= 50) {
    return { level: 'warning', msg: '信号弱' }
  }

  return null
}

export function buildEquipmentAlerts(equipment: readonly AdminEquipmentRecord[]): EquipmentDerivedAlert[] {
  const alerts = equipment
    .map<EquipmentDerivedAlert | null>(item => {
      if (item.lifecycleStatus === '待验收') {
        return { id: `${item.id}-acceptance`, equipmentId: item.id, equipmentName: item.name, status: '待处理' as const, type: '资产验收', msg: item.acceptanceNote ?? '设备待验收' }
      }

      if (item.status === '待维修' || item.status === '维修中') {
        return { id: `${item.id}-maintenance`, equipmentId: item.id, equipmentName: item.name, status: '待处理' as const, type: '设备维保', msg: item.acceptanceNote ?? item.remarks ?? item.status }
      }

      if (item.battery <= 30) {
        return { id: `${item.id}-battery`, equipmentId: item.id, equipmentName: item.name, status: '待处理' as const, type: '电量预警', msg: `设备电量 ${item.battery}%` }
      }

      if (item.signal <= 50) {
        return { id: `${item.id}-signal`, equipmentId: item.id, equipmentName: item.name, status: '待处理' as const, type: '连接预警', msg: `设备信号 ${item.signal}%` }
      }

      return null
    })

  return alerts.filter((item): item is EquipmentDerivedAlert => item !== null)
}

export function buildEquipmentMonitorPoints(equipment: readonly AdminEquipmentRecord[]): EquipmentMonitorPoint[] {
  return equipment.map(item => {
    const status = getMonitorStatus(item)
    return {
      id: item.id,
      name: item.name,
      room: item.room,
      status,
      runtimeHours: item.uptime,
      metrics: {
        hr: item.metrics.hr > 0 ? item.metrics.hr : null,
        bp: item.metrics.bp === '--' ? null : item.metrics.bp,
        temp: item.metrics.temp > 0 ? item.metrics.temp : null,
        spo2: item.metrics.spo2 > 0 ? item.metrics.spo2 : null,
        battery: item.battery,
      },
      alert: buildAlert(item, status),
    }
  })
}

export function buildEquipmentStatusRows(equipment: readonly AdminEquipmentRecord[]): EquipmentStatusRow[] {
  return buildEquipmentMonitorPoints(equipment).map(item => ({
    id: item.id,
    name: item.name,
    room: item.room,
    type: equipment.find(record => record.id === item.id)?.type ?? '设备',
    status: item.status,
    signal: equipment.find(record => record.id === item.id)?.signal ?? 0,
    battery: item.metrics.battery,
    uptime: item.runtimeHours,
    lastAlert: item.alert?.msg ?? null,
  }))
}