"use client"

import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard, type TagVariant } from "@/components/nh"
import { buildAiAssistantHref } from "@/lib/ai-context"
import { getCareScene, withSceneQuery } from "@/lib/care-scenes"
import { fetchAdminElderHealthSummary, fetchAdminElderProfile, type AdminElderHealthSummaryResponse, type AdminElderProfileResponse } from "@/lib/elderly/admin-elderly-api"
import { getElderDetailActionAiInsight } from "@/lib/mock/admin-ai"
import { getAdmissionApplicationsSnapshot, subscribeAdmissionWorkflow } from "@/lib/mock/admission-workflow"
import { getElderAiProfile } from "@/lib/mock/app-ai"
import { findLiveElderlyById } from "@/lib/mock/elderly-registry"
import { ArrowLeft, Bot, Edit, ScanFace } from "lucide-react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState, useSyncExternalStore } from "react"

type ElderLocalSnapshot = {
  id: string
  name: string
  gender: "男" | "女"
  age: number
  idCard: string
  phone: string
  roomNumber: string
  careLevel: string
  checkInDate: string
  birthday: string
  emergencyContact: string
  status: "入住" | "离院" | "待入住"
  medicalHistory: string[]
  allergies: string[]
  habits: string[]
  height: number
  weight: number
}

type SourceDescriptor = {
  label: string
  variant: TagVariant
}

type LoadableState<T> = {
  data: T | null
  error: string
  loaded: boolean
}

function maskPhone(value: string) {
  if (!value || value.startsWith('待补录') || value.includes('*')) {
    return value || '待补录'
  }

  if (value.length < 7) {
    return value
  }

  return `${value.slice(0, 3)}****${value.slice(-4)}`
}

function maskIdCard(value: string) {
  if (!value || value.startsWith('待补录') || value.includes('*')) {
    return value || '待补录'
  }

  if (value.length < 8) {
    return value
  }

  return `${value.slice(0, 3)}***********${value.slice(-4)}`
}

function formatRoom(roomNumber: string, bedNumber: string) {
  return bedNumber && bedNumber !== '-' ? `${roomNumber}-${bedNumber}` : roomNumber
}

function mapAdmissionStatus(value?: string): ElderLocalSnapshot['status'] {
  if (!value) {
    return '待入住'
  }

  const normalized = value.trim().toLowerCase()
  if (normalized.includes('active') || value.includes('入住')) {
    return '入住'
  }

  if (normalized.includes('leave') || normalized.includes('discharge') || value.includes('离院')) {
    return '离院'
  }

  if (normalized.includes('pending') || value.includes('待')) {
    return '待入住'
  }

  return '入住'
}

function formatSyncTime(value?: string) {
  if (!value) {
    return '未同步'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== 'number') {
    return '待补录'
  }

  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 2,
  }).format(value)
}

function getProfileStatus(profile: AdminElderProfileResponse | null, loading: boolean, error: string): SourceDescriptor {
  if (profile) {
    return { label: 'Live Profile', variant: 'success' }
  }

  if (loading) {
    return { label: 'Profile Syncing', variant: 'info' }
  }

  if (error) {
    return { label: 'Profile Unavailable', variant: 'warning' }
  }

  return { label: 'Local Snapshot', variant: 'warning' }
}

function getHealthStatus(health: AdminElderHealthSummaryResponse | null, loading: boolean, error: string): SourceDescriptor {
  if (health) {
    return { label: 'Live Health', variant: 'success' }
  }

  if (loading) {
    return { label: 'Health Syncing', variant: 'info' }
  }

  if (error) {
    return { label: 'Health Unavailable', variant: 'warning' }
  }

  return { label: 'Local Snapshot', variant: 'warning' }
}

function buildLocalDetail(id: string, applications: ReturnType<typeof getAdmissionApplicationsSnapshot>): ElderLocalSnapshot | null {
  const record = findLiveElderlyById(id, applications)

  if (!record) {
    return null
  }

  return {
    id: record.id,
    name: record.name,
    gender: record.gender,
    age: record.age,
    idCard: maskIdCard(record.idCard),
    phone: maskPhone(record.phone),
    roomNumber: formatRoom(record.roomNumber, record.bedNumber),
    careLevel: record.careLevel,
    checkInDate: record.checkInDate,
    birthday: record.birthDate,
    emergencyContact: `${record.emergencyContact} ${maskPhone(record.emergencyPhone)}`.trim(),
    status: record.status,
    medicalHistory: record.medicalHistory.length > 0 ? record.medicalHistory : ['待补录'],
    allergies: record.allergies.length > 0 ? record.allergies : ['无'],
    habits: record.remarks ? [record.remarks] : ['待补录'],
    height: 165,
    weight: 60,
  }
}

function buildAiProfile(elderId: string, elderName: string, health: AdminElderHealthSummaryResponse | null) {
  if (!health) {
    const fallback = getElderAiProfile(elderId)

    return {
      ...fallback,
      statusSummary: `${elderName} 当前尚未命中真实健康摘要，页面暂以本地健康说明辅助阅读。`,
      familyBrief: `适合家属查看的摘要是：当前仍以本地快照为主，机构会继续补齐最新健康同步。`,
    }
  }

  const needsAttention = health.oxygen < 95 || health.heartRate > 100 || health.riskSummary.includes('风险')

  return {
    statusSummary: `${elderName} 当前健康摘要：${health.riskSummary}。血压 ${health.bloodPressure}，心率 ${health.heartRate} 次/分，血氧 ${health.oxygen}%。`,
    familyBrief: `适合家属查看的摘要是：今天状态总体${needsAttention ? '需要继续观察' : '相对稳定'}，机构已根据最新健康摘要持续跟进。`,
    followupActions: [
      `继续关注 ${formatSyncTime(health.updatedAtUtc)} 之后的下一次生命体征采集。`,
      needsAttention
        ? '优先复核血氧、心率和风险摘要变化，必要时升级为正式健康提醒。'
        : '维持当前护理节奏，并在家属沟通时同步最新健康摘要。',
      '如后续出现连续异常，建议把健康摘要与护理回执一起纳入 AI 解释上下文。',
    ],
    confidence: needsAttention ? 92 : 87,
  }
}

export default function ElderlyDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const scene = getCareScene(searchParams.get('scene'))
  const id = params.id as string
  const applications = useSyncExternalStore(
    subscribeAdmissionWorkflow,
    getAdmissionApplicationsSnapshot,
    getAdmissionApplicationsSnapshot,
  )
  const localSnapshot = useMemo(() => buildLocalDetail(id, applications), [applications, id])
  const workflowApplication = useMemo(() => applications.find(item => item.id === id) ?? null, [applications, id])
  const [profileStates, setProfileStates] = useState<Record<string, LoadableState<AdminElderProfileResponse>>>({})
  const [healthStates, setHealthStates] = useState<Record<string, LoadableState<AdminElderHealthSummaryResponse>>>({})
  const profileEntry = profileStates[id]
  const healthEntry = healthStates[id]

  useEffect(() => {
    let cancelled = false

    if (!profileEntry?.loaded) {
      void fetchAdminElderProfile(id)
        .then(profile => {
          if (!cancelled) {
            setProfileStates(current => ({
              ...current,
              [id]: {
                data: profile,
                error: '',
                loaded: true,
              },
            }))
          }
        })
        .catch(error => {
          if (!cancelled) {
            setProfileStates(current => ({
              ...current,
              [id]: {
                data: null,
                error: error instanceof Error ? error.message : '长者主档读取失败。',
                loaded: true,
              },
            }))
          }
        })
    }

    if (!healthEntry?.loaded) {
      void fetchAdminElderHealthSummary(id)
        .then(health => {
          if (!cancelled) {
            setHealthStates(current => ({
              ...current,
              [id]: {
                data: health,
                error: '',
                loaded: true,
              },
            }))
          }
        })
        .catch(error => {
          if (!cancelled) {
            setHealthStates(current => ({
              ...current,
              [id]: {
                data: null,
                error: error instanceof Error ? error.message : '健康摘要读取失败。',
                loaded: true,
              },
            }))
          }
        })
    }

    return () => {
      cancelled = true
    }
  }, [healthEntry?.loaded, id, profileEntry?.loaded])

  const data = useMemo(() => localSnapshot ?? {
    id,
    name: '未知长者',
    gender: '男' as const,
    age: 0,
    idCard: '待补录',
    phone: '待补录',
    roomNumber: '待分配',
    careLevel: '待评估',
    checkInDate: '待同步',
    birthday: '待补录',
    emergencyContact: '待补录',
    status: '待入住' as const,
    medicalHistory: ['待补录'],
    allergies: ['待补录'],
    habits: ['待补录'],
    height: 0,
    weight: 0,
  }, [id, localSnapshot])
  const liveProfile = profileEntry?.data ?? null
  const liveHealth = healthEntry?.data ?? null
  const profileLoading = !profileEntry?.loaded
  const healthLoading = !healthEntry?.loaded
  const profileError = profileEntry?.error ?? ''
  const healthError = healthEntry?.error ?? ''
  const localSnapshotCompatible = !liveProfile || !localSnapshot || localSnapshot.name === liveProfile.elderName
  const displayName = liveProfile?.elderName ?? data.name
  const displayRoomNumber = liveProfile?.roomNumber ?? data.roomNumber
  const displayCareLevel = liveProfile?.careLevel ?? data.careLevel
  const displayStatus = liveProfile ? mapAdmissionStatus(liveProfile.admissionStatus) : data.status
  const profileStatus = getProfileStatus(liveProfile, profileLoading, profileError)
  const healthStatus = getHealthStatus(liveHealth, healthLoading, healthError)
  const localStatus: SourceDescriptor = { label: 'Local Snapshot', variant: 'neutral' }
  const pendingBackfillStatus: SourceDescriptor = { label: 'Pending Backfill', variant: 'warning' }
  const hasLiveGender = liveProfile?.gender === '男' || liveProfile?.gender === '女'
  const hasLiveAge = typeof liveProfile?.age === 'number' && liveProfile.age > 0
  const hasLiveIdentityCard = Boolean(liveProfile?.identityCard)
  const hasLivePhone = Boolean(liveProfile?.elderPhone)
  const displayGender = hasLiveGender ? liveProfile.gender : localSnapshotCompatible ? data.gender : '待同步'
  const displayAge = hasLiveAge ? `${liveProfile.age}岁` : localSnapshotCompatible && data.age > 0 ? `${data.age}岁` : '年龄待同步'
  const localFieldStatus: SourceDescriptor = localSnapshotCompatible
    ? localStatus
    : { label: 'Snapshot Withheld', variant: 'warning' }
  const masterFieldStatus: SourceDescriptor = hasLiveGender || hasLiveAge || hasLiveIdentityCard || hasLivePhone
    ? profileStatus
    : localFieldStatus
  const aiProfile = buildAiProfile(data.id, displayName, liveHealth)
  const actionInsight = getElderDetailActionAiInsight({
    id: data.id,
    name: displayName,
    roomNumber: displayRoomNumber,
    careLevel: displayCareLevel,
    medicalHistory: liveProfile?.medicalAlerts.length ? [...liveProfile.medicalAlerts] : localSnapshotCompatible ? [...data.medicalHistory] : ['待同步'],
    allergies: localSnapshotCompatible ? [...data.allergies] : ['待同步'],
    status: displayStatus,
  })
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'elderly-detail',
    entityId: data.id,
    entityName: displayName,
    focus,
    target,
    scene: scene ?? undefined,
  })
  const helpHref = '/elderly/help'

  const sourceMapItems = [
    {
      title: '长者主档',
      status: profileStatus,
      description: liveProfile
        ? `姓名、护理等级、房间、入住状态、家属联系人以及机构委托字段来自 Elder Service。`
        : '当前回退到本地详情快照，主档未命中真实服务链路。',
      error: profileError,
    },
    {
      title: '健康摘要',
      status: healthStatus,
      description: liveHealth
        ? `风险摘要与体征来自 Health Service，最近同步 ${formatSyncTime(liveHealth.updatedAtUtc)}。`
        : '当前回退到本地健康说明，生命体征未命中真实服务链路。',
      error: healthError,
    },
    {
      title: '补位字段',
      status: masterFieldStatus,
      description: hasLiveGender || hasLiveAge || hasLiveIdentityCard || hasLivePhone
        ? '性别、年龄、证件号、联系电话已切到 Elder Service 主档；其余生活习惯与体征补位字段仍由前端 local snapshot 提供。'
        : localSnapshotCompatible
          ? '证件号、手机号、生日、习惯、身高体重等字段仍由前端 local snapshot 补位。'
          : '本地补位记录与 live 主档不一致，已停止使用本地个人字段，待后端契约补齐。',
      error: '',
    },
  ]

  const entrustmentSource = liveProfile?.entrustmentType
    || liveProfile?.entrustmentOrganization
    || typeof liveProfile?.monthlySubsidy === 'number'
    || (liveProfile?.serviceItems.length ?? 0) > 0
    ? profileStatus
    : workflowApplication
      ? localStatus
      : pendingBackfillStatus

  const entrustmentItems = [
    { label: '委托类型', value: liveProfile?.entrustmentType ?? workflowApplication?.entrustmentType ?? '待补录', source: entrustmentSource },
    { label: '委托单位', value: liveProfile?.entrustmentOrganization ?? workflowApplication?.entrustmentOrganization ?? '待补录', source: entrustmentSource },
    { label: '月度补贴', value: typeof liveProfile?.monthlySubsidy === 'number' ? formatCurrency(liveProfile.monthlySubsidy) : typeof workflowApplication?.monthlySubsidy === 'number' ? formatCurrency(workflowApplication.monthlySubsidy) : '待补录', source: entrustmentSource },
    { label: '固定服务项', value: liveProfile?.serviceItems.length ? liveProfile.serviceItems.join('、') : workflowApplication?.serviceItems?.length ? workflowApplication.serviceItems.join('、') : '待补录', source: entrustmentSource },
    { label: '服务备注', value: liveProfile?.serviceNotes ?? workflowApplication?.serviceNotes ?? '暂无备注', source: entrustmentSource },
  ]

  const basicInfoItems = [
    { label: '姓名', value: displayName, source: liveProfile ? profileStatus : localStatus },
    { label: '性别', value: displayGender, source: hasLiveGender ? profileStatus : localFieldStatus },
    { label: '年龄', value: displayAge, source: hasLiveAge ? profileStatus : localFieldStatus },
    { label: '身份证', value: liveProfile?.identityCard ?? (localSnapshotCompatible ? data.idCard : '待同步'), source: hasLiveIdentityCard ? profileStatus : localFieldStatus },
    { label: '联系电话', value: liveProfile?.elderPhone ?? (localSnapshotCompatible ? data.phone : '待同步'), source: hasLivePhone ? profileStatus : localFieldStatus },
    { label: '入住日期', value: localSnapshotCompatible ? data.checkInDate : '待同步', source: localFieldStatus },
    { label: '房间号', value: displayRoomNumber, source: liveProfile ? profileStatus : localStatus },
    { label: '护理等级', value: displayCareLevel, source: liveProfile ? profileStatus : localStatus },
    { label: '入住状态', value: displayStatus, source: liveProfile ? profileStatus : localStatus },
    { label: '家属联系人', value: liveProfile?.familyContactName ?? data.emergencyContact, source: liveProfile ? profileStatus : localStatus },
  ]

  const healthInfoItems = [
    { label: '风险摘要', value: liveHealth?.riskSummary ?? '待同步真实健康摘要', source: liveHealth ? healthStatus : localStatus },
    { label: '血压', value: liveHealth?.bloodPressure ?? '待同步', source: liveHealth ? healthStatus : localStatus },
    { label: '心率', value: liveHealth ? `${liveHealth.heartRate} 次/分` : '待同步', source: liveHealth ? healthStatus : localStatus },
    { label: '体温', value: liveHealth ? `${liveHealth.temperature}°C` : '待同步', source: liveHealth ? healthStatus : localStatus },
    { label: '血糖', value: liveHealth ? `${liveHealth.bloodSugar} mmol/L` : '待同步', source: liveHealth ? healthStatus : localStatus },
    { label: '血氧', value: liveHealth ? `${liveHealth.oxygen}%` : '待同步', source: liveHealth ? healthStatus : localStatus },
    { label: '医疗提醒', value: liveProfile?.medicalAlerts.length ? liveProfile.medicalAlerts.join('、') : '待同步', source: liveProfile?.medicalAlerts.length ? profileStatus : localStatus },
    { label: '既往病史', value: localSnapshotCompatible ? data.medicalHistory.join('、') : '待同步', source: localFieldStatus },
    { label: '过敏史', value: localSnapshotCompatible ? data.allergies.join('、') : '待同步', source: localFieldStatus },
    { label: '生活习惯', value: localSnapshotCompatible ? data.habits.join('、') : '待同步', source: localFieldStatus },
    { label: '身高/体重', value: localSnapshotCompatible && data.height > 0 && data.weight > 0 ? `${data.height}cm / ${data.weight}kg` : '待同步', source: localFieldStatus },
    { label: '最新同步', value: formatSyncTime(liveHealth?.updatedAtUtc), source: liveHealth ? healthStatus : localStatus },
  ]

  const subtitleParts = [
    displayRoomNumber,
    localSnapshotCompatible ? displayGender : null,
    localSnapshotCompatible ? displayAge : null,
    displayCareLevel,
    scene === 'home' ? '居家视角' : scene === 'institutional' ? '机构视角' : null,
  ].filter(Boolean)

  return (
    <div className="page-root animate-fade-up">

      <PageHeader
        title={displayName}
        subtitle={subtitleParts.join(' · ')}
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href={withSceneQuery('/elderly', scene)} className="btn btn-secondary btn-sm"><ArrowLeft size={13} />返回老人列表</Link>
            <Link href={withSceneQuery('/elderly/face', scene, { selected: data.id, entry: 'elderly-detail' })} className="btn btn-secondary btn-sm flex items-center gap-2">
              <ScanFace size={13} />人脸录入
            </Link>
            <Link href={withSceneQuery(`/elderly/${data.id}/edit`, scene)} className="btn btn-primary btn-sm flex items-center gap-2">
              <Edit size={13} />编辑信息
            </Link>
          </div>
        }
      />

      <InteractionRailLayout
        main={(
          <>
            <WorkflowOverviewCard
              eyebrow="Elder Detail"
              title={`${displayName} 对象总览`}
              description="主区只保留档案事实、机构委托和健康信息，AI 状态摘要与管理跟进动作后置展示。"
              badge={<Tag variant={displayStatus === '入住' ? 'success' : displayStatus === '待入住' ? 'warning' : 'neutral'}>{displayStatus}</Tag>}
              metrics={[
                { label: '主档状态', value: profileStatus.label, hint: displayRoomNumber, tone: profileStatus.variant === 'success' ? 'success' : profileStatus.variant === 'info' ? 'info' : 'warning' },
                { label: '健康状态', value: healthStatus.label, hint: formatSyncTime(liveHealth?.updatedAtUtc), tone: healthStatus.variant === 'success' ? 'success' : healthStatus.variant === 'info' ? 'info' : 'warning' },
                { label: '护理等级', value: displayCareLevel, hint: localSnapshotCompatible ? displayAge : '个人字段待同步', tone: 'primary' },
                { label: '委托口径', value: entrustmentItems[0]?.value ?? '待补录', hint: entrustmentItems[1]?.value ?? '待补录', tone: entrustmentSource.variant === 'success' ? 'success' : entrustmentSource.variant === 'warning' ? 'warning' : 'neutral' },
              ]}
              signals={[
                { label: profileError || '长者主档已优先走 live profile，缺口字段再回退补位。', tone: profileError ? 'warning' : 'success' },
                { label: healthError || '风险摘要和生命体征优先走 live health，便于先核对对象健康状态。', tone: healthError ? 'warning' : 'info' },
                { label: scene === 'home' ? '当前为居家养老视角，详情动作仍保持同一对象事实结构。' : scene === 'institutional' ? '当前为机构养老视角，优先服务院内档案核对。' : '当前为综合视角，兼容台账和详情回流入口。', tone: 'neutral' },
              ]}
            />

            <div className="kpi-grid">
              <StatCard icon={<Edit size={18} />} label="入住状态" value={displayStatus} sub={displayRoomNumber} color={displayStatus === '入住' ? 'success' : displayStatus === '待入住' ? 'warning' : 'info'} />
              <StatCard icon={<Edit size={18} />} label="护理等级" value={displayCareLevel} sub={displayGender} color="primary" />
              <StatCard icon={<Edit size={18} />} label="主档来源" value={profileStatus.label} sub={liveProfile ? '已命中 Elder Service' : '使用本地补位'} color={profileStatus.variant === 'success' ? 'success' : profileStatus.variant === 'info' ? 'info' : 'warning'} />
              <StatCard icon={<Edit size={18} />} label="健康来源" value={healthStatus.label} sub={formatSyncTime(liveHealth?.updatedAtUtc)} color={healthStatus.variant === 'success' ? 'success' : healthStatus.variant === 'info' ? 'info' : 'warning'} />
            </div>

            <DataCard
              title="数据来源边界"
              subtitle="首屏基础档案、机构委托和健康摘要已接入 BFF，未入后端契约的字段继续保留 local snapshot 补位。"
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                {sourceMapItems.map(item => (
                  <div
                    key={item.title}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 12,
                      padding: 12,
                      background: 'var(--color-panel)',
                      display: 'grid',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                      <Tag variant={item.status.variant}>{item.status.label}</Tag>
                    </div>
                    <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.description}</div>
                    {item.error ? (
                      <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--color-danger)' }}>{item.error}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            </DataCard>

            <DataCard title="基础档案" subtitle="姓名、房间、护理等级和入住状态优先读取 live profile；联系方式与证件信息仍为 local snapshot。" badge={<Tag variant="primary">Profile</Tag>}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                {basicInfoItems.map(({ label, value, source }) => (
                  <div key={label}>
                    <div className="text-xs text-muted mb-1" style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{label}</div>
                    <div style={{ display: 'grid', gap: 6 }}>
                      <div className="text-sm font-semibold">{value}</div>
                      <div><Tag variant={source.variant}>{source.label}</Tag></div>
                    </div>
                  </div>
                ))}
              </div>
            </DataCard>

            <DataCard title="机构委托" subtitle="委托类型、委托单位、月补贴与固定服务项优先读取 live profile；若主档尚未补齐，则回退 workflow 兼容快照。" badge={<Tag variant="warning">Entrustment</Tag>}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                {entrustmentItems.map(({ label, value, source }) => (
                  <div key={label}>
                    <div className="text-xs text-muted mb-1" style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{label}</div>
                    <div style={{ display: 'grid', gap: 6 }}>
                      <div className="text-sm font-semibold">{value}</div>
                      <div><Tag variant={source.variant}>{source.label}</Tag></div>
                    </div>
                  </div>
                ))}
              </div>
            </DataCard>

            <DataCard title="健康信息" subtitle="风险摘要与生命体征优先读取 live health；病史、过敏与习惯字段仍为 local snapshot 补位。" badge={<Tag variant="info">Health</Tag>}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                {healthInfoItems.map(({ label, value, source }) => (
                  <div key={label}>
                    <div className="text-xs text-muted mb-1" style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{label}</div>
                    <div style={{ display: 'grid', gap: 6 }}>
                      <div className="text-sm font-semibold">{value}</div>
                      <div><Tag variant={source.variant}>{source.label}</Tag></div>
                    </div>
                  </div>
                ))}
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="对象上下文" subtitle="当前对象边界、同步来源和场景口径后置显示。" badge={<Tag variant="info">Context</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">对象：{displayName} · {displayRoomNumber} · {displayStatus}</div>
                <div className="page-help-card-item">来源：{profileStatus.label} / {healthStatus.label} / {localStatus.label}</div>
                <div className="page-help-card-item">场景：{scene === 'home' ? '居家养老' : scene === 'institutional' ? '机构养老' : '综合视角'}，最终对象事实仍以详情页主区为准。</div>
              </div>
            </DataCard>

            <DataCard title="AI 状态摘要" subtitle="把当前健康、报警和后续动作压缩成可读结论。" badge={<Tag variant="primary">Admin + Family AI</Tag>}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ padding: 14, borderRadius: 10, background: "var(--color-bg)", fontSize: 13, lineHeight: 1.7, color: "var(--color-text)" }}>
                  {aiProfile.statusSummary}
                </div>
                <div style={{ fontSize: 12, color: "var(--color-primary)", fontWeight: 700 }}>置信度 {aiProfile.confidence}%</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Tag variant={profileStatus.variant}>{profileStatus.label}</Tag>
                  <Tag variant={healthStatus.variant}>{healthStatus.label}</Tag>
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {aiProfile.followupActions.map(item => (
                    <div key={item} className="page-help-card-item">{item}</div>
                  ))}
                </div>
                <div>
                  <Link href={buildAiHref('elder-status', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
                </div>
              </div>
            </DataCard>

            <DataCard title="家属端摘要草稿" subtitle="同一份数据在家属端的表达应更温和、更结论导向。" badge={<Tag variant="success">Family Brief</Tag>}>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ padding: 14, borderRadius: 10, background: "var(--color-bg)", fontSize: 13, lineHeight: 1.7, color: "var(--color-text)" }}>
                  {aiProfile.familyBrief}
                </div>
                <div>
                  <Link href={buildAiHref('family-brief', 'logs')} className="btn btn-secondary btn-sm">带上下文追踪</Link>
                </div>
              </div>
            </DataCard>

            <DataCard title={actionInsight.title} subtitle="把病史、护理等级和房间上下文转成管理侧跟进动作。" badge={<Tag variant="warning">Admin Follow-up</Tag>}>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 700, color: "var(--color-text)" }}>
                  <Bot size={16} style={{ color: "var(--color-primary)" }} />
                  AI 管理动作
                </div>
                <div style={{ padding: 14, borderRadius: 10, background: "var(--color-bg)", fontSize: 13, lineHeight: 1.7, color: "var(--color-text)" }}>
                  {actionInsight.summary}
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {actionInsight.actions.map(item => (
                    <div key={item} className="page-help-card-item">{item}</div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 12, color: "var(--color-primary)", fontWeight: 600 }}>置信度 {actionInsight.confidence}%</div>
                  <Link href={buildAiHref('elder-management', 'rules')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
                </div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整长者模块说明迁移到显式帮助页"
              summary="长者详情页现在只保留对象事实、委托信息和健康摘要，AI 状态结论与管理动作统一后置。"
              items={[
                '先核对基础档案、委托信息和健康字段来源。',
                '再查看 AI 状态摘要、家属端表达和管理跟进动作。',
                '若需要完整长者模块边界说明，进入帮助页查看。',
              ]}
              href={helpHref}
              actionLabel="查看长者帮助"
            />
          </>
        )}
      />
    </div>
  )
}
