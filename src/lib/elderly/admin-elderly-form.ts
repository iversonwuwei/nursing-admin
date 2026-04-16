import type { AdminCreateElderAdmissionRequest, AdminUpdateElderProfileRequest } from '@/lib/elderly/admin-elderly-api'
import type { AdmissionFormState } from '@/lib/mock/admission-workflow'

function splitMultiValue(value: string) {
  return value
    .split(/[、,，;；\n]/)
    .map(item => item.trim())
    .filter(Boolean)
}

function normalizeList(items: string[]) {
  return Array.from(new Set(items.map(item => item.trim()).filter(Boolean)))
}

function parseMonthlySubsidy(value: string) {
  const normalized = value.trim()
  if (!normalized) {
    return null
  }

  const amount = Number(normalized)
  if (!Number.isFinite(amount) || amount <= 0) {
    return null
  }

  return Math.round(amount * 100) / 100
}

function parseAge(value: string) {
  const age = Number.parseInt(value, 10)
  return Number.isFinite(age) ? age : 0
}

function parseAdlScore(value: string) {
  const score = Number.parseInt(value, 10)
  return Number.isFinite(score) && score >= 0 && score <= 100 ? score : null
}

function parseEmergencyContact(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return { familyContactName: '', familyContactPhone: '' }
  }

  const phoneMatch = trimmed.match(/1\d{10}/)
  if (!phoneMatch) {
    return { familyContactName: trimmed, familyContactPhone: '' }
  }

  const familyContactPhone = phoneMatch[0]
  const familyContactName = trimmed.replace(familyContactPhone, '').replace(/\s+/g, ' ').trim()
  return {
    familyContactName: familyContactName || trimmed,
    familyContactPhone,
  }
}

function buildMedicalAlerts(form: AdmissionFormState) {
  const allergyItems = splitMultiValue(form.allergySummary).filter(item => item !== '无')
  const riskNotes = form.riskNotes.trim()

  return normalizeList([
    ...splitMultiValue(form.chronicConditions),
    ...allergyItems,
    ...(riskNotes ? [riskNotes] : []),
  ])
}

export function buildAdminCreateElderAdmissionRequest(
  form: AdmissionFormState,
  admissionReference = `ADM-${Date.now()}`,
): AdminCreateElderAdmissionRequest {
  const { familyContactName, familyContactPhone } = parseEmergencyContact(form.emergency)

  return {
    admissionReference,
    elderName: form.name.trim(),
    age: parseAge(form.age),
    gender: form.gender,
    careLevel: form.requestedLevel,
    roomNumber: form.room.trim(),
    identityCard: form.identityCard.trim() || null,
    birthDate: form.birthDate.trim() || null,
    elderPhone: form.phone.trim() || null,
    familyContactName,
    familyContactPhone,
    adlScore: parseAdlScore(form.adlScore),
    cognitiveLevel: form.cognitiveLevel || null,
    medicalAlerts: buildMedicalAlerts(form),
    entrustmentType: form.entrustmentType || null,
    entrustmentOrganization: form.entrustmentOrganization.trim() || null,
    monthlySubsidy: parseMonthlySubsidy(form.monthlySubsidy),
    serviceItems: normalizeList(form.serviceItems),
    serviceNotes: form.serviceNotes.trim() || null,
  }
}

export function buildAdminUpdateElderProfileRequest(form: AdmissionFormState): AdminUpdateElderProfileRequest {
  const { familyContactName, familyContactPhone } = parseEmergencyContact(form.emergency)

  return {
    age: parseAge(form.age),
    gender: form.gender || null,
    careLevel: form.requestedLevel,
    roomNumber: form.room.trim(),
    identityCard: form.identityCard.trim() || null,
    birthDate: form.birthDate.trim() || null,
    elderPhone: form.phone.trim() || null,
    familyContactName,
    familyContactPhone,
    adlScore: parseAdlScore(form.adlScore),
    cognitiveLevel: form.cognitiveLevel || null,
    medicalAlerts: buildMedicalAlerts(form),
    entrustmentType: form.entrustmentType || null,
    entrustmentOrganization: form.entrustmentOrganization.trim() || null,
    monthlySubsidy: parseMonthlySubsidy(form.monthlySubsidy),
    serviceItems: normalizeList(form.serviceItems),
    serviceNotes: form.serviceNotes.trim() || null,
  }
}