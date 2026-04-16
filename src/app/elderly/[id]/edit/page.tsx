'use client'

import { InstitutionalAdmissionFormSections } from '@/components/elderly/InstitutionalAdmissionFormSections'
import { DataCard, InteractionRailLayout, PageHelpCard, Tag } from '@/components/nh'
import { fetchAdminElderProfile, updateAdminElderProfile, type AdminElderProfileResponse } from '@/lib/elderly/admin-elderly-api'
import { buildAdminUpdateElderProfileRequest } from '@/lib/elderly/admin-elderly-form'
import {
  EMPTY_FORM,
  getAdmissionApplicationsSnapshot,
  getAssessmentStatusLabel,
  getAssessmentStatusVariant,
  subscribeAdmissionWorkflow,
  upsertAdmissionApplication,
  validateAdmissionForm,
  type AdmissionApplication,
  type AdmissionFormState,
} from '@/lib/mock/admission-workflow'
import { findLiveElderlyById } from '@/lib/mock/elderly-registry'
import type { Elderly } from '@/lib/types'
import { AlertCircle, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'

function buildFormFromApplication(application: AdmissionApplication): AdmissionFormState {
  return {
    name: application.name,
    identityCard: application.identityCard ?? '',
    birthDate: application.birthDate ?? '',
    age: String(application.age),
    gender: application.gender,
    phone: application.phone,
    emergency: application.emergency,
    room: application.room,
    requestedLevel: application.requestedLevel,
    chronicConditions: application.chronicConditions,
    medicationSummary: application.medicationSummary,
    allergySummary: application.allergySummary,
    adlScore: String(application.adlScore),
    cognitiveLevel: application.cognitiveLevel,
    riskNotes: application.riskNotes,
    entrustmentType: application.entrustmentType ?? '',
    entrustmentOrganization: application.entrustmentOrganization ?? '',
    monthlySubsidy: typeof application.monthlySubsidy === 'number' ? String(application.monthlySubsidy) : '',
    serviceItems: application.serviceItems ?? [],
    serviceNotes: application.serviceNotes ?? '',
  }
}

function buildFormFromElderly(record: Elderly): AdmissionFormState {
  return {
    ...EMPTY_FORM,
    name: record.name,
    identityCard: record.idCard,
    birthDate: record.birthDate,
    age: String(record.age),
    gender: record.gender,
    phone: record.phone,
    emergency: `${record.emergencyContact} ${record.emergencyPhone}`.trim(),
    room: `${record.roomNumber}-${record.bedNumber}`,
    requestedLevel: '二级护理',
    chronicConditions: record.medicalHistory.join('、'),
    allergySummary: record.allergies.length > 0 ? record.allergies.join('、') : '无',
    riskNotes: record.remarks ?? '',
  }
}

function buildFormFromProfile(profile: AdminElderProfileResponse, elderlyRecord: Elderly | null): AdmissionFormState {
  const liveEmergency = `${profile.familyContactName} ${profile.familyContactPhone ?? ''}`.trim()
  const localEmergency = elderlyRecord
    ? `${elderlyRecord.emergencyContact ?? ''} ${elderlyRecord.emergencyPhone ?? ''}`.trim()
    : ''

  return {
    ...EMPTY_FORM,
    name: elderlyRecord?.name ?? profile.elderName,
    identityCard: profile.identityCard ?? elderlyRecord?.idCard ?? '',
    birthDate: profile.birthDate ?? elderlyRecord?.birthDate ?? '',
    age: profile.age > 0 ? String(profile.age) : elderlyRecord ? String(elderlyRecord.age) : '',
    gender: (profile.gender === '男' || profile.gender === '女' ? profile.gender : elderlyRecord?.gender) ?? '',
    phone: profile.elderPhone ?? elderlyRecord?.phone ?? '',
    emergency: liveEmergency || localEmergency,
    room: profile.roomNumber,
    requestedLevel: profile.careLevel as AdmissionFormState['requestedLevel'],
    chronicConditions: profile.medicalAlerts.join('、'),
    medicationSummary: '',
    allergySummary: elderlyRecord?.allergies.join('、') ?? '',
    adlScore: typeof profile.adlScore === 'number' ? String(profile.adlScore) : '',
    cognitiveLevel: (profile.cognitiveLevel as AdmissionFormState['cognitiveLevel']) ?? '',
    riskNotes: elderlyRecord?.remarks ?? '',
    entrustmentType: (profile.entrustmentType as AdmissionFormState['entrustmentType']) ?? '',
    entrustmentOrganization: profile.entrustmentOrganization ?? '',
    monthlySubsidy: typeof profile.monthlySubsidy === 'number' ? String(profile.monthlySubsidy) : '',
    serviceItems: profile.serviceItems,
    serviceNotes: profile.serviceNotes ?? '',
  }
}

function mapWorkflowStatusFromAdmissionStatus(value?: string) {
  if (!value) {
    return '待人工确认' as const
  }

  const normalized = value.trim().toLowerCase()
  if (normalized.includes('active') || value.includes('入住')) {
    return '已入住' as const
  }

  if (normalized.includes('plan')) {
    return '计划已生成' as const
  }

  return '待人工确认' as const
}

export default function EditElderlyPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const scene = searchParams.get('scene')
  const applications = useSyncExternalStore(
    subscribeAdmissionWorkflow,
    getAdmissionApplicationsSnapshot,
    getAdmissionApplicationsSnapshot,
  )
  const application = useMemo(() => applications.find(item => item.id === id) ?? null, [applications, id])
  const elderlyRecord = useMemo(() => findLiveElderlyById(id, applications) ?? null, [applications, id])
  const [profileEntry, setProfileEntry] = useState<{ data: AdminElderProfileResponse | null; error: string; loaded: boolean }>({
    data: null,
    error: '',
    loaded: false,
  })

  useEffect(() => {
    let cancelled = false

    void fetchAdminElderProfile(id)
      .then(profile => {
        if (!cancelled) {
          setProfileEntry({ data: profile, error: '', loaded: true })
        }
      })
      .catch(error => {
        if (!cancelled) {
          setProfileEntry({
            data: null,
            error: error instanceof Error ? error.message : '长者主档读取失败。',
            loaded: true,
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [id])

  const liveProfile = profileEntry.data
  const initialForm = useMemo(
    () => application
      ? buildFormFromApplication(application)
      : liveProfile
        ? buildFormFromProfile(liveProfile, elderlyRecord)
        : elderlyRecord
          ? buildFormFromElderly(elderlyRecord)
          : EMPTY_FORM,
    [application, elderlyRecord, liveProfile],
  )

  const backHref = `/elderly/${id}${scene ? `?scene=${scene}` : ''}`
  const helpHref = '/elderly/help'

  if (!profileEntry.loaded && !application && !elderlyRecord) {
    return (
      <div className="page-root animate-fade-up" style={{ maxWidth: 900, margin: '0 auto' }}>
        <DataCard title="正在读取老人主档" subtitle="优先尝试从 elder profile 回填编辑表单。">
          <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>正在同步当前长者的真实主档与本地 workflow 快照，请稍候。</div>
        </DataCard>
      </div>
    )
  }

  if (!application && !elderlyRecord && !liveProfile) {
    return (
      <div className="page-root animate-fade-up" style={{ maxWidth: 900, margin: '0 auto' }}>
        <DataCard title="未找到老人档案" subtitle="当前老人既不在入住 workflow 中，也不在 live elder profile 中。">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>{profileEntry.error || '请先确认老人是否已完成入住建档或是否处于当前筛选场景。'}</div>
            <Link href="/elderly" className="btn btn-primary btn-sm">返回老人列表</Link>
          </div>
        </DataCard>
      </div>
    )
  }

  return (
    <div className="page-root animate-fade-up" style={{ maxWidth: 960, margin: '0 auto' }}>
      <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
        <Link href={backHref} className="btn btn-ghost btn-icon-sm btn-icon">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold" style={{ letterSpacing: '-0.02em' }}>编辑老人信息</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            {application
              ? `修改 ${application.name} 的入住建档与机构委托信息。`
              : liveProfile
                ? `当前正在为 ${liveProfile.elderName} 补齐机构入住 workflow 字段，并回写真实 elder profile。`
                : `当前正在为 ${elderlyRecord?.name} 补齐机构入住 workflow 字段。`}
          </p>
        </div>
      </div>

      <InteractionRailLayout
        main={(
          <>
            <DataCard
              title="编辑范围"
              subtitle="本页优先回写 elder profile，委托类型、月补贴和固定服务项会同步到认定中心与委托工作台。"
              badge={application ? <Tag variant={getAssessmentStatusVariant(application.status)}>{getAssessmentStatusLabel(application.status)}</Tag> : liveProfile ? <Tag variant="success">Live Profile</Tag> : <Tag variant="warning">待接入 workflow</Tag>}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                  {application
                    ? `${application.room} · 当前来源 ${application.sourceLabel ?? '入住建档'}。保存后会先更新 elder profile，再保留既有认定状态并重算本地 AI 建议与服务建议。`
                    : liveProfile
                      ? '当前老人为真实主档数据。首次保存后会生成同 id 的入住 workflow 兼容记录，后续由认定中心和委托工作台共用。'
                      : '当前老人为台账快照数据。首次保存后会生成同 id 的入住 workflow 记录，后续由认定中心和委托工作台共用。'}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Link href={`/elderly/entrustment?selected=${id}`} className="btn btn-secondary btn-sm">查看委托工作台</Link>
                  <Link href={`/elderly/checkin?scene=institutional&selected=${id}`} className="btn btn-secondary btn-sm">查看认定闭环</Link>
                </div>
              </div>
            </DataCard>

            <EditElderlyFormContent
              key={`${id}:${application?.id ?? elderlyRecord?.id ?? liveProfile?.elderId ?? 'fallback'}`}
              id={id}
              scene={scene}
              application={application}
              elderlyRecord={elderlyRecord}
              liveProfile={liveProfile}
              initialForm={initialForm}
              backHref={backHref}
            />
          </>
        )}
        rail={(
          <>
            <DataCard title="编辑边界" subtitle="主区只保留表单和保存动作。" badge={<Tag variant="warning">Boundary</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">保存时优先回写 elder profile，再同步 workflow 兼容快照。</div>
                <div className="page-help-card-item">委托类型、月补贴和固定服务项会影响认定中心与委托工作台。</div>
                <div className="page-help-card-item">完整委托边界与编辑顺序迁移到帮助页。</div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整老人编辑说明迁移到显式帮助页"
              summary="老人编辑页现在只保留表单和保存动作，委托边界与页面说明统一后置。"
              items={[
                '先补齐委托来源、月补贴和服务项，再保存主档。',
                '保存后会同步影响认定中心和委托工作台。',
                '若需要完整说明，进入老人帮助页查看。',
              ]}
              href={helpHref}
              actionLabel="查看老人帮助"
            />
          </>
        )}
      />
    </div>
  )
}

interface EditElderlyFormContentProps {
  id: string
  scene: string | null
  application: AdmissionApplication | null
  elderlyRecord: Elderly | null
  liveProfile: AdminElderProfileResponse | null
  initialForm: AdmissionFormState
  backHref: string
}

function EditElderlyFormContent({ id, scene, application, elderlyRecord, liveProfile, initialForm, backHref }: EditElderlyFormContentProps) {
  const router = useRouter()
  const [form, setForm] = useState<AdmissionFormState>(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function updateForm<K extends keyof AdmissionFormState>(key: K, value: AdmissionFormState[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const requireInstitutionalEntrustment = scene !== 'home' && application?.sourceType !== 'document-import'
    const validationError = validateAdmissionForm(form, { requireInstitutionalEntrustment })
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setLoading(true)

    try {
      await updateAdminElderProfile(id, buildAdminUpdateElderProfileRequest(form))

      const nextApplication = upsertAdmissionApplication(id, form, {
        fallbackId: id,
        fallbackStatus: application?.status ?? (liveProfile ? mapWorkflowStatusFromAdmissionStatus(liveProfile.admissionStatus) : elderlyRecord?.status === '入住' ? '已入住' : '待人工确认'),
        fallbackCreatedAt: application?.createdAt ?? elderlyRecord?.checkInDate ?? new Date().toISOString().slice(0, 10),
        sourceType: application?.sourceType ?? 'manual-form',
        sourceLabel: application?.sourceLabel ?? 'Elder Profile 编辑',
        sourceSummary: application?.sourceSummary ?? '由老人档案编辑页回写 elder profile，并同步本地 workflow 兼容快照。',
        confirmedCareLevel: application?.confirmedCareLevel,
        confirmedAt: application?.confirmedAt,
        confirmedBy: application?.confirmedBy,
        reviewNote: application?.reviewNote,
      })

      router.push(`/elderly/${nextApplication.id}${scene ? `?scene=${scene}` : ''}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '老人主档更新失败，请稍后重试。')
      setLoading(false)
      return
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      {error ? (
        <div className="form-error" style={{ marginTop: 16 }}>
          <AlertCircle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
          <span className="form-error-text">{error}</span>
        </div>
      ) : null}

      <div style={{ marginTop: 16 }}>
        <InstitutionalAdmissionFormSections form={form} onChange={updateForm} />
      </div>

      <div className="flex items-center justify-end gap-3" style={{ marginTop: 16 }}>
        <Link href={backHref} className="btn btn-ghost btn-md">取消</Link>
        <button type="submit" className="btn btn-primary btn-md" disabled={loading}>
          {loading ? (
            <span className="login-spinner animate-spin" />
          ) : (
            <>
              <Save size={15} />保存修改
            </>
          )}
        </button>
      </div>
    </form>
  )
}
