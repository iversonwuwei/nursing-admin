// 报警记录模拟数据

export type AlertLevel = 'critical' | 'warning' | 'info'
export type AlertStatus = 'pending' | 'processing' | 'resolved'
export type AlertType = 'fall' | 'device' | 'health' | 'call' | 'bedExit' | 'sos'

export interface AlertRecord {
  id: string
  type: AlertType
  level: AlertLevel
  status: AlertStatus
  elderlyId: string
  elderlyName: string
  roomNumber: string
  deviceName?: string
  description: string
  occurredAt: string
  handledBy?: string
  handledAt?: string
  resolution?: string
}

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  fall: '跌倒报警',
  device: '设备报警',
  health: '健康异常',
  call: '紧急呼叫',
  bedExit: '离床预警',
  sos: 'SOS 求助',
}

export const ALERT_LEVEL_LABELS: Record<AlertLevel, string> = {
  critical: '紧急',
  warning: '警告',
  info: '提示',
}

export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
}

export const alertRecords: AlertRecord[] = [
  {
    id: 'A20260001',
    type: 'fall',
    level: 'critical',
    status: 'resolved',
    elderlyId: 'E001',
    elderlyName: '张秀英',
    roomNumber: '101-1',
    deviceName: '智能手环 S3',
    description: '检测到突然跌倒，体征数据异常',
    occurredAt: '2026-03-29 08:32',
    handledBy: '李护士',
    handledAt: '2026-03-29 08:45',
    resolution: '老人已扶起，身体无恙，血压略高，留观30分钟后恢复正常',
  },
  {
    id: 'A20260002',
    type: 'health',
    level: 'warning',
    status: 'resolved',
    elderlyId: 'E003',
    elderlyName: '李淑芳',
    roomNumber: '301-1',
    description: '血压持续偏高，超出正常范围已超过2小时',
    occurredAt: '2026-03-29 09:15',
    handledBy: '王医生',
    handledAt: '2026-03-29 10:00',
    resolution: '遵医嘱服用降压药，每30分钟复测，2小时后血压降至正常范围',
  },
  {
    id: 'A20260003',
    type: 'device',
    level: 'warning',
    status: 'pending',
    elderlyId: 'E002',
    elderlyName: '王建国',
    roomNumber: '203-2',
    deviceName: '智能手环 S1',
    description: '设备信号中断超过5分钟，无法获取体征数据',
    occurredAt: '2026-03-29 14:22',
    resolution: '',
  },
  {
    id: 'A20260004',
    type: 'call',
    level: 'info',
    status: 'processing',
    elderlyId: 'E005',
    elderlyName: '陈丽华',
    roomNumber: '201-1',
    description: '呼叫护工，协助如厕',
    occurredAt: '2026-03-29 15:05',
    handledBy: '张护工',
    resolution: '',
  },
  {
    id: 'A20260005',
    type: 'health',
    level: 'critical',
    status: 'processing',
    elderlyId: 'E006',
    elderlyName: '周玉兰',
    roomNumber: '102-2',
    description: '血氧持续低于93%，心率偏快，体温37.1°C',
    occurredAt: '2026-03-29 17:30',
    handledBy: '王医生',
    resolution: '',
  },
  {
    id: 'A20260006',
    type: 'fall',
    level: 'critical',
    status: 'pending',
    elderlyId: 'E008',
    elderlyName: '孙桂英',
    roomNumber: '204-1',
    deviceName: '智能手环 S5',
    description: '检测到突然跌倒，疑似骨折风险',
    occurredAt: '2026-03-29 18:10',
    resolution: '',
  },
  {
    id: 'A20260007',
    type: 'device',
    level: 'info',
    status: 'resolved',
    elderlyId: 'E004',
    elderlyName: '赵德明',
    roomNumber: '405-1',
    deviceName: '智能床垫 M2',
    description: '床垫传感器离线，现已恢复',
    occurredAt: '2026-03-29 11:00',
    handledBy: '设备部',
    handledAt: '2026-03-29 11:20',
    resolution: '传感器电池耗尽，已更换电池，设备恢复正常',
  },
  {
    id: 'A20260008',
    type: 'health',
    level: 'warning',
    status: 'resolved',
    elderlyId: 'E001',
    elderlyName: '张秀英',
    roomNumber: '101-1',
    description: '午餐后血糖偏高，测得7.8 mmol/L',
    occurredAt: '2026-03-29 12:30',
    handledBy: '李护士',
    handledAt: '2026-03-29 12:50',
    resolution: '提醒按时服药，30分钟后复测，血糖降至6.5 mmol/L',
  },
  {
    id: 'A20260009',
    type: 'call',
    level: 'info',
    status: 'resolved',
    elderlyId: 'E007',
    elderlyName: '吴建华',
    roomNumber: '302-1',
    description: '呼叫护工，需要喝水',
    occurredAt: '2026-03-29 13:15',
    handledBy: '张护工',
    handledAt: '2026-03-29 13:18',
    resolution: '已协助老人饮水',
  },
  {
    id: 'A20260010',
    type: 'device',
    level: 'warning',
    status: 'pending',
    elderlyId: 'E003',
    elderlyName: '李淑芳',
    roomNumber: '301-1',
    deviceName: '智能手环 S2',
    description: '设备低电量告警，电量低于15%',
    occurredAt: '2026-03-29 19:00',
    resolution: '',
  },
  {
    id: 'A20260011',
    type: 'bedExit',
    level: 'warning',
    status: 'pending',
    elderlyId: 'E009',
    elderlyName: '沈月琴',
    roomNumber: '208-2',
    deviceName: '智能床垫 M5',
    description: '夜间连续两次离床超过 6 分钟，存在跌倒与走失风险',
    occurredAt: '2026-03-29 21:18',
    resolution: '',
  },
  {
    id: 'A20260012',
    type: 'sos',
    level: 'critical',
    status: 'processing',
    elderlyId: 'E010',
    elderlyName: '高秀梅',
    roomNumber: '106-1',
    deviceName: '床旁 SOS 按钮 B1',
    description: '老人主动触发 SOS 求助，已联动护士站和值班医生',
    occurredAt: '2026-03-29 22:05',
    handledBy: '夜班护士长',
    resolution: '',
  },
]

export const alertStats = {
  total: alertRecords.length,
  pending: alertRecords.filter(a => a.status === 'pending').length,
  processing: alertRecords.filter(a => a.status === 'processing').length,
  resolved: alertRecords.filter(a => a.status === 'resolved').length,
  critical: alertRecords.filter(a => a.level === 'critical').length,
  today: alertRecords.filter(a => a.occurredAt.startsWith('2026-03-29')).length,
}
