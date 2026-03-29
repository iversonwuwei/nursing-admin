// 健康体征模拟数据

export interface HealthVital {
  elderlyId: string
  elderlyName: string
  roomNumber: string
  timestamp: string
  heartRate: number
  bloodPressureHigh: number
  bloodPressureLow: number
  bloodOxygen: number
  bloodSugar: number
  temperature: number
  isAbnormal: boolean
  abnormalItems: string[]
}

export interface HealthTrend {
  date: string
  heartRateAvg: number
  bloodPressureHighAvg: number
  bloodPressureLowAvg: number
  bloodOxygenAvg: number
  bloodSugarAvg: number
}

// 过去7天的趋势数据
export const healthTrends: HealthTrend[] = [
  { date: '03-23', heartRateAvg: 71, bloodPressureHighAvg: 138, bloodPressureLowAvg: 84, bloodOxygenAvg: 96.2, bloodSugarAvg: 6.2 },
  { date: '03-24', heartRateAvg: 73, bloodPressureHighAvg: 142, bloodPressureLowAvg: 86, bloodOxygenAvg: 95.8, bloodSugarAvg: 6.5 },
  { date: '03-25', heartRateAvg: 70, bloodPressureHighAvg: 140, bloodPressureLowAvg: 85, bloodOxygenAvg: 96.5, bloodSugarAvg: 6.1 },
  { date: '03-26', heartRateAvg: 75, bloodPressureHighAvg: 148, bloodPressureLowAvg: 90, bloodOxygenAvg: 95.2, bloodSugarAvg: 6.8 },
  { date: '03-27', heartRateAvg: 72, bloodPressureHighAvg: 144, bloodPressureLowAvg: 87, bloodOxygenAvg: 96.0, bloodSugarAvg: 6.4 },
  { date: '03-28', heartRateAvg: 74, bloodPressureHighAvg: 146, bloodPressureLowAvg: 88, bloodOxygenAvg: 95.5, bloodSugarAvg: 6.6 },
  { date: '03-29', heartRateAvg: 71, bloodPressureHighAvg: 141, bloodPressureLowAvg: 85, bloodOxygenAvg: 96.1, bloodSugarAvg: 6.3 },
]

// 当前在线监测的老人体征数据
export const healthVitals: HealthVital[] = [
  {
    elderlyId: 'E001',
    elderlyName: '张秀英',
    roomNumber: '101-1',
    timestamp: '2026-03-29 19:45',
    heartRate: 72,
    bloodPressureHigh: 145,
    bloodPressureLow: 88,
    bloodOxygen: 95,
    bloodSugar: 6.8,
    temperature: 36.5,
    isAbnormal: true,
    abnormalItems: ['血压偏高'],
  },
  {
    elderlyId: 'E002',
    elderlyName: '王建国',
    roomNumber: '203-2',
    timestamp: '2026-03-29 19:50',
    heartRate: 68,
    bloodPressureHigh: 130,
    bloodPressureLow: 82,
    bloodOxygen: 97,
    bloodSugar: 5.8,
    temperature: 36.4,
    isAbnormal: false,
    abnormalItems: [],
  },
  {
    elderlyId: 'E003',
    elderlyName: '李淑芳',
    roomNumber: '301-1',
    timestamp: '2026-03-29 19:42',
    heartRate: 78,
    bloodPressureHigh: 155,
    bloodPressureLow: 92,
    bloodOxygen: 94,
    bloodSugar: 6.5,
    temperature: 36.8,
    isAbnormal: true,
    abnormalItems: ['血压偏高', '血氧偏低'],
  },
  {
    elderlyId: 'E004',
    elderlyName: '赵德明',
    roomNumber: '405-1',
    timestamp: '2026-03-29 19:55',
    heartRate: 70,
    bloodPressureHigh: 125,
    bloodPressureLow: 78,
    bloodOxygen: 98,
    bloodSugar: 5.4,
    temperature: 36.3,
    isAbnormal: false,
    abnormalItems: [],
  },
  {
    elderlyId: 'E005',
    elderlyName: '陈丽华',
    roomNumber: '201-1',
    timestamp: '2026-03-29 19:30',
    heartRate: 76,
    bloodPressureHigh: 138,
    bloodPressureLow: 85,
    bloodOxygen: 96,
    bloodSugar: 6.2,
    temperature: 36.5,
    isAbnormal: false,
    abnormalItems: [],
  },
  {
    elderlyId: 'E006',
    elderlyName: '周玉兰',
    roomNumber: '102-2',
    timestamp: '2026-03-29 19:20',
    heartRate: 82,
    bloodPressureHigh: 162,
    bloodPressureLow: 98,
    bloodOxygen: 93,
    bloodSugar: 7.2,
    temperature: 37.1,
    isAbnormal: true,
    abnormalItems: ['血压偏高', '血氧偏低', '体温偏高'],
  },
  {
    elderlyId: 'E007',
    elderlyName: '吴建华',
    roomNumber: '302-1',
    timestamp: '2026-03-29 19:35',
    heartRate: 65,
    bloodPressureHigh: 118,
    bloodPressureLow: 74,
    bloodOxygen: 98,
    bloodSugar: 5.1,
    temperature: 36.2,
    isAbnormal: false,
    abnormalItems: [],
  },
  {
    elderlyId: 'E008',
    elderlyName: '孙桂英',
    roomNumber: '204-1',
    timestamp: '2026-03-29 19:10',
    heartRate: 80,
    bloodPressureHigh: 150,
    bloodPressureLow: 91,
    bloodOxygen: 95,
    bloodSugar: 6.9,
    temperature: 36.6,
    isAbnormal: true,
    abnormalItems: ['血压偏高'],
  },
]

// 体征参考范围
export const VITAL_RANGES = {
  heartRate: { min: 60, max: 100, unit: '次/分' },
  bloodPressureHigh: { min: 90, max: 140, unit: 'mmHg' },
  bloodPressureLow: { min: 60, max: 90, unit: 'mmHg' },
  bloodOxygen: { min: 94, max: 100, unit: '%' },
  bloodSugar: { min: 3.9, max: 7.0, unit: 'mmol/L' },
  temperature: { min: 36.0, max: 37.3, unit: '°C' },
}

// 统计摘要
export const healthStats = {
  totalMonitored: healthVitals.length,
  normalCount: healthVitals.filter(v => !v.isAbnormal).length,
  abnormalCount: healthVitals.filter(v => v.isAbnormal).length,
  criticalCount: healthVitals.filter(v => v.abnormalItems.length >= 2).length,
  avgHeartRate: Math.round(healthVitals.reduce((s, v) => s + v.heartRate, 0) / healthVitals.length),
  avgBloodOxygen: (healthVitals.reduce((s, v) => s + v.bloodOxygen, 0) / healthVitals.length).toFixed(1),
}
