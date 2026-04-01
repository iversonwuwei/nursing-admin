import { elderlyList } from '@/lib/data/elderly'
import type { AdmissionApplication, CareLevel } from '@/lib/mock/admission-workflow'
import type { Elderly } from '@/lib/types'

const CARE_LEVEL_TO_ELDERLY_LEVEL: Record<CareLevel, Elderly['careLevel']> = {
  '特级护理': '特级护理',
  '一级护理': '全护理',
  '二级护理': '半自理',
  '三级护理': '自理',
}

function splitList(value: string) {
  return value
    .split(/[，,、\n]/)
    .map(item => item.trim())
    .filter(Boolean)
}

function normalizeAllergies(value: string) {
  const items = splitList(value)
  if (items.length === 1 && ['无', '暂无', '无过敏史'].includes(items[0])) {
    return []
  }
  return items
}

function parseRoom(value: string) {
  const [roomNumber, bedNumber] = value.split(/[-/]/)
  return {
    roomNumber: roomNumber?.trim() || value.trim(),
    bedNumber: bedNumber?.trim() || '1',
  }
}

function parseEmergency(value: string) {
  const phoneMatch = value.match(/1\d{10}/)
  const phone = phoneMatch?.[0] ?? ''
  const contact = value.replace(phone, '').replace(/[，,]/g, ' ').trim() || '待补录'

  return {
    contact,
    phone,
  }
}

function buildBirthDate(age: number) {
  const year = Math.max(1900, new Date().getFullYear() - age)
  return `${year}-01-01`
}

export function mapAdmissionLevelToElderlyLevel(level: CareLevel): Elderly['careLevel'] {
  return CARE_LEVEL_TO_ELDERLY_LEVEL[level]
}

export function buildElderlyRecordFromAdmission(application: AdmissionApplication): Elderly {
  const { roomNumber, bedNumber } = parseRoom(application.room)
  const emergency = parseEmergency(application.emergency)
  const careLevel = mapAdmissionLevelToElderlyLevel(
    application.confirmedCareLevel ?? application.aiRecommendation.recommendedLevel,
  )

  return {
    id: application.id,
    name: application.name,
    age: application.age,
    gender: application.gender,
    idCard: `待补录-${application.id}`,
    birthDate: buildBirthDate(application.age),
    phone: application.phone || '待补录',
    emergencyContact: emergency.contact,
    emergencyPhone: emergency.phone || application.phone || '待补录',
    careLevel,
    status: application.status === '已入住' ? '入住' : '待入住',
    organizationId: 'O001',
    roomNumber,
    bedNumber,
    checkInDate: (application.confirmedAt || application.createdAt).slice(0, 10),
    medicalHistory: splitList(application.chronicConditions),
    allergies: normalizeAllergies(application.allergySummary),
    remarks: application.riskNotes || application.reviewNote || '来自入住闭环录入',
  }
}

export function buildLiveElderlyList(applications: AdmissionApplication[]) {
  const existingIds = new Set(elderlyList.map(item => item.id))
  const workflowRecords = applications
    .filter(application => !existingIds.has(application.id))
    .map(buildElderlyRecordFromAdmission)
    .sort((left, right) => right.checkInDate.localeCompare(left.checkInDate))

  return [...workflowRecords, ...elderlyList]
}

export function findLiveElderlyById(id: string, applications: AdmissionApplication[]) {
  const existing = elderlyList.find(item => item.id === id)
  if (existing) {
    return existing
  }

  const application = applications.find(item => item.id === id)
  return application ? buildElderlyRecordFromAdmission(application) : undefined
}