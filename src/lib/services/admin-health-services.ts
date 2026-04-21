import { fetchAdminVitals, type AdminVitalsEntry } from '@/lib/services/admin-vital-services'

export type HealthMetricKey = 'bp' | 'hr' | 'sleep'

export const VITAL_RANGES = {
  heartRate: { min: 60, max: 100, unit: '次/分' },
  bloodPressureHigh: { min: 90, max: 140, unit: 'mmHg' },
  bloodPressureLow: { min: 60, max: 90, unit: 'mmHg' },
  bloodOxygen: { min: 94, max: 100, unit: '%' },
  bloodSugar: { min: 3.9, max: 7.0, unit: 'mmol/L' },
  temperature: { min: 36.0, max: 37.3, unit: '°C' },
} as const

export interface DerivedHealthVital extends AdminVitalsEntry {
  systolic: number
  diastolic: number
  isAbnormal: boolean
  abnormalItems: string[]
  severityScore: number
  recordedAtLabel: string
}

export interface HealthTrendPoint {
  dateKey: string
  label: string
  heartRateAvg: number
  bloodPressureHighAvg: number
  bloodPressureLowAvg: number
  bloodOxygenAvg: number
  bloodSugarAvg: number
  sampleCount: number
}

export interface HealthOverview {
  totalMonitored: number
  normalCount: number
  abnormalCount: number
  criticalCount: number
  avgHeartRate: number
  avgBloodOxygen: string
}

export interface AiHealthInsight {
  elderlyId: string
  elderlyName: string
  roomNumber: string
  severity: '高风险' | '中风险'
  title: string
  explanation: string
  action: string
  confidence: number
}

export interface AiHealthFollowupAction {
  elderlyId: string
  elderlyName: string
  title: string
  summary: string
  action: string
  severity: '高风险' | '中风险'
  confidence: number
}

export interface HealthMonitoringData {
  records: AdminVitalsEntry[]
  latestVitals: DerivedHealthVital[]
  overview: HealthOverview
  trends: HealthTrendPoint[]
  aiInsights: AiHealthInsight[]
  followupActions: AiHealthFollowupAction[]
  trendNarratives: string[]
}

function formatDateTimeLabel(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function formatDayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDayLabel(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function average(values: number[], fallback: number) {
  if (values.length === 0) return fallback
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function parseBloodPressure(value: string) {
  const parts = value.split('/').map(item => Number(item.trim()))
  return {
    systolic: Number.isFinite(parts[0]) ? parts[0] : 0,
    diastolic: Number.isFinite(parts[1]) ? parts[1] : 0,
  }
}

function evaluateAbnormalItems(record: AdminVitalsEntry) {
  const { systolic, diastolic } = parseBloodPressure(record.bloodPressure)
  const abnormalItems: string[] = []

  if (record.heartRate < VITAL_RANGES.heartRate.min || record.heartRate > VITAL_RANGES.heartRate.max) {
    abnormalItems.push(record.heartRate > VITAL_RANGES.heartRate.max ? '心率偏高' : '心率偏低')
  }

  if (systolic < VITAL_RANGES.bloodPressureHigh.min || systolic > VITAL_RANGES.bloodPressureHigh.max || diastolic < VITAL_RANGES.bloodPressureLow.min || diastolic > VITAL_RANGES.bloodPressureLow.max) {
    abnormalItems.push(systolic > VITAL_RANGES.bloodPressureHigh.max || diastolic > VITAL_RANGES.bloodPressureLow.max ? '血压偏高' : '血压偏低')
  }

  if (record.oxygen < VITAL_RANGES.bloodOxygen.min) {
    abnormalItems.push('血氧偏低')
  }

  if (record.bloodSugar < VITAL_RANGES.bloodSugar.min || record.bloodSugar > VITAL_RANGES.bloodSugar.max) {
    abnormalItems.push(record.bloodSugar > VITAL_RANGES.bloodSugar.max ? '血糖偏高' : '血糖偏低')
  }

  if (record.temperature < VITAL_RANGES.temperature.min || record.temperature > VITAL_RANGES.temperature.max) {
    abnormalItems.push(record.temperature > VITAL_RANGES.temperature.max ? '体温偏高' : '体温偏低')
  }

  return { systolic, diastolic, abnormalItems }
}

function buildSeverityScore(vital: DerivedHealthVital) {
  let score = vital.abnormalItems.length * 2
  if (vital.systolic >= 160 || vital.diastolic >= 100) score += 2
  if (vital.oxygen <= 92) score += 2
  if (vital.temperature >= 38) score += 1
  if (vital.heartRate >= 110 || vital.heartRate <= 50) score += 1
  return score
}

export function deriveLatestHealthVitals(records: AdminVitalsEntry[]) {
  const sorted = [...records].sort((left, right) => Date.parse(right.recordedAtUtc) - Date.parse(left.recordedAtUtc))
  const latestByElder = new Map<string, DerivedHealthVital>()

  for (const record of sorted) {
    if (latestByElder.has(record.elderId)) continue
    const { systolic, diastolic, abnormalItems } = evaluateAbnormalItems(record)
    const vital: DerivedHealthVital = {
      ...record,
      systolic,
      diastolic,
      abnormalItems,
      isAbnormal: abnormalItems.length > 0,
      severityScore: 0,
      recordedAtLabel: formatDateTimeLabel(record.recordedAtUtc),
    }
    vital.severityScore = buildSeverityScore(vital)
    latestByElder.set(record.elderId, vital)
  }

  return [...latestByElder.values()].sort((left, right) => Date.parse(right.recordedAtUtc) - Date.parse(left.recordedAtUtc))
}

export function buildHealthOverview(vitals: DerivedHealthVital[]): HealthOverview {
  const totalMonitored = vitals.length
  const abnormalCount = vitals.filter(item => item.isAbnormal).length
  const criticalCount = vitals.filter(item => item.severityScore >= 5).length
  const normalCount = totalMonitored - abnormalCount
  const avgHeartRate = totalMonitored > 0
    ? Math.round(vitals.reduce((sum, item) => sum + item.heartRate, 0) / totalMonitored)
    : 0
  const avgBloodOxygen = totalMonitored > 0
    ? (vitals.reduce((sum, item) => sum + item.oxygen, 0) / totalMonitored).toFixed(1)
    : '0.0'

  return {
    totalMonitored,
    normalCount,
    abnormalCount,
    criticalCount,
    avgHeartRate,
    avgBloodOxygen,
  }
}

export function buildHealthTrendPoints(records: AdminVitalsEntry[], days = 7): HealthTrendPoint[] {
  const now = new Date()
  const buckets = new Map<string, AdminVitalsEntry[]>()
  const allSystolic = records.map(item => parseBloodPressure(item.bloodPressure).systolic).filter(value => value > 0)
  const allDiastolic = records.map(item => parseBloodPressure(item.bloodPressure).diastolic).filter(value => value > 0)
  const heartRateFallback = round(average(records.map(item => item.heartRate), 72))
  const systolicFallback = round(average(allSystolic, 135))
  const diastolicFallback = round(average(allDiastolic, 84))
  const oxygenFallback = round(average(records.map(item => item.oxygen), 96), 1)
  const sugarFallback = round(average(records.map(item => item.bloodSugar), 5.8), 1)

  for (const record of records) {
    const date = new Date(record.recordedAtUtc)
    if (Number.isNaN(date.getTime())) continue
    const key = formatDayKey(date)
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.push(record)
    } else {
      buckets.set(key, [record])
    }
  }

  const points: HealthTrendPoint[] = []
  let previous: HealthTrendPoint | null = null

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now)
    date.setHours(0, 0, 0, 0)
    date.setDate(now.getDate() - offset)
    const key = formatDayKey(date)
    const bucket = buckets.get(key) ?? []
    const systolicValues = bucket.map(item => parseBloodPressure(item.bloodPressure).systolic).filter(value => value > 0)
    const diastolicValues = bucket.map(item => parseBloodPressure(item.bloodPressure).diastolic).filter(value => value > 0)
    const point: HealthTrendPoint = {
      dateKey: key,
      label: formatDayLabel(date),
      heartRateAvg: round(average(bucket.map(item => item.heartRate), previous?.heartRateAvg ?? heartRateFallback)),
      bloodPressureHighAvg: round(average(systolicValues, previous?.bloodPressureHighAvg ?? systolicFallback)),
      bloodPressureLowAvg: round(average(diastolicValues, previous?.bloodPressureLowAvg ?? diastolicFallback)),
      bloodOxygenAvg: round(average(bucket.map(item => item.oxygen), previous?.bloodOxygenAvg ?? oxygenFallback), 1),
      bloodSugarAvg: round(average(bucket.map(item => item.bloodSugar), previous?.bloodSugarAvg ?? sugarFallback), 1),
      sampleCount: bucket.length,
    }
    points.push(point)
    previous = point
  }

  return points
}

function buildHealthExplanation(vital: DerivedHealthVital) {
  if (vital.abnormalItems.length === 0) {
    return `${vital.elderName} 当前生命体征稳定，暂无需要升级的组合异常。`
  }

  const lead = vital.abnormalItems[0]
  if (lead === '血压偏高') {
    return `${vital.elderName} 当前血压 ${vital.bloodPressure}，已超出常规监测区间${vital.abnormalItems.length > 1 ? `，并伴随 ${vital.abnormalItems.slice(1).join('、')}` : ''}。`
  }
  if (lead === '血氧偏低') {
    return `${vital.elderName} 当前血氧 ${vital.oxygen}% ，需重点复核呼吸状态与夜间监测连续性。`
  }
  if (lead === '心率偏高' || lead === '心率偏低') {
    return `${vital.elderName} 当前心率 ${vital.heartRate} 次/分，建议结合血压与既往病史继续复测。`
  }
  return `${vital.elderName} 当前出现 ${vital.abnormalItems.join('、')}，建议值班人员尽快复核。`
}

function buildHealthAction(vital: DerivedHealthVital) {
  if (vital.severityScore >= 6) {
    return '建议 30 分钟内完成复测，并视情况升级医生或报警中心。'
  }
  if (vital.abnormalItems.includes('血氧偏低')) {
    return '建议先复核监测设备佩戴状态，再安排血氧复测。'
  }
  if (vital.abnormalItems.includes('血压偏高')) {
    return '建议安排 30 分钟/2 小时双周期复测，并记录干预结果。'
  }
  return '建议继续观察并在下一次巡检时补录复测结果。'
}

export function buildHealthAiInsights(vitals: DerivedHealthVital[]): AiHealthInsight[] {
  return vitals
    .filter(item => item.isAbnormal)
    .sort((left, right) => right.severityScore - left.severityScore)
    .map(item => ({
      elderlyId: item.elderId,
      elderlyName: item.elderName,
      roomNumber: item.roomNumber,
      severity: item.severityScore >= 5 ? '高风险' : '中风险',
      title: item.abnormalItems.join(' / '),
      explanation: buildHealthExplanation(item),
      action: buildHealthAction(item),
      confidence: Math.min(97, 78 + item.severityScore * 3),
    }))
}

export function buildHealthFollowupActions(insights: ReadonlyArray<AiHealthInsight>): AiHealthFollowupAction[] {
  return insights.slice(0, 4).map(item => ({
    elderlyId: item.elderlyId,
    elderlyName: item.elderlyName,
    title: item.title,
    summary: item.explanation,
    action: item.action,
    severity: item.severity,
    confidence: item.confidence,
  }))
}

export function buildHealthTrendNarratives(points: HealthTrendPoint[]) {
  if (points.length < 2) {
    return ['当前趋势样本不足，建议继续采集更多体征记录后再判断日趋势。']
  }

  const latest = points[points.length - 1]
  const previous = points[points.length - 2]
  const highestPressure = Math.max(...points.map(item => item.bloodPressureHighAvg))

  return [
    latest.bloodPressureHighAvg > previous.bloodPressureHighAvg
      ? `近 24 小时平均高压从 ${previous.bloodPressureHighAvg} mmHg 回升到 ${latest.bloodPressureHighAvg} mmHg，说明高压波动仍未完全收敛。`
      : `近 24 小时平均高压从 ${previous.bloodPressureHighAvg} mmHg 回落到 ${latest.bloodPressureHighAvg} mmHg，短期控制趋势略有改善。`,
    latest.bloodOxygenAvg < 96
      ? `血氧均值目前为 ${latest.bloodOxygenAvg}% ，已逼近重点观察阈值，建议重点复核慢病与夜间监测对象。`
      : `血氧均值维持在 ${latest.bloodOxygenAvg}% ，整体仍处在可控区间。`,
    `近 7 日高压峰值达到 ${highestPressure} mmHg，说明当前异常更偏向持续性波动，而不是单点噪声。`,
  ]
}

export function isNightObservation(recordedAtUtc: string) {
  const date = new Date(recordedAtUtc)
  if (Number.isNaN(date.getTime())) return false
  const hour = date.getHours()
  return hour >= 22 || hour < 6
}

export async function fetchHealthMonitoringData(limit = 500): Promise<HealthMonitoringData> {
  const records = await fetchAdminVitals({ take: limit })
  const latestVitals = deriveLatestHealthVitals(records)
  const overview = buildHealthOverview(latestVitals)
  const trends = buildHealthTrendPoints(records)
  const aiInsights = buildHealthAiInsights(latestVitals)
  const followupActions = buildHealthFollowupActions(aiInsights)
  const trendNarratives = buildHealthTrendNarratives(trends)

  return {
    records,
    latestVitals,
    overview,
    trends,
    aiInsights,
    followupActions,
    trendNarratives,
  }
}
