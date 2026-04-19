"use client"

import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard, type TagVariant } from "@/components/nh"
import { buildAiAssistantHref } from "@/lib/ai-context"
import { getCareScene, withSceneQuery } from "@/lib/care-scenes"
import { fetchAdminElderHealthSummary, fetchAdminElderProfile, type AdminElderHealthSummaryResponse, type AdminElderProfileResponse } from "@/lib/elderly/admin-elderly-api"
import { ArrowLeft, Edit, ScanFace } from "lucide-react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

type SourceDescriptor = {
  label: string
  variant: TagVariant
}

type LoadableState<T> = {
  data: T | null
  error: string
  loaded: boolean
}

type FollowupInsight = {
  title: string
  summary: string
  actions: string[]
}

const pendingBackfillStatus: SourceDescriptor = {
  label: 'Pending Backfill',
  variant: 'warning',
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

function mapAdmissionStatus(value?: string) {
  if (!value) {
    return '待同步'
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

  return '待入住'
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

function formatBirthDate(value?: string | null) {
  if (!value) {
    return '待同步'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '待同步'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function hasText(value?: string | null): value is string {
  return typeof value === 'string' && value.trim().length > 0
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

  return { label: 'Pending Profile', variant: 'warning' }
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

  return { label: 'Pending Health', variant: 'warning' }
}

function resolveFieldSource(hasValue: boolean, status: SourceDescriptor, loaded: boolean, error: string) {
  if (hasValue) {
    return status
  }

  if (!loaded || error) {
    return status
  }

  return pendingBackfillStatus
}

function buildDetailSummaries(elderName: string, health: AdminElderHealthSummaryResponse | null, profile: AdminElderProfileResponse | null) {
  const needsAttention = health ? (health.oxygen < 95 || health.heartRate > 100 || health.riskSummary.includes('风险')) : false
  const profileLabel = profile?.careLevel ?? '护理等级待同步'
  const medicalAlerts = profile?.medicalAlerts.length ? profile.medicalAlerts.join('、') : '医疗提醒待同步'

  return {
    statusSummary: health
      ? `${elderName} 当前健康摘要：${health.riskSummary}。血压 ${health.bloodPressure}，心率 ${health.heartRate} 次/分，血氧 ${health.oxygen}%。`
      : `${elderName} 当前尚未同步真实健康摘要，详情页不会再回退本地健康快照，请等待 Health Service 回写。`,
    familyBrief: health
      ? `适合家属查看的摘要是：今天状态总体${needsAttention ? '需要继续观察' : '相对稳定'}，机构已根据最新健康摘要持续跟进。`
      : `适合家属查看的摘要是：当前健康摘要仍在同步中，机构会在真实档案回写后继续跟进。`,
    followupActions: [
      health
        ? `继续关注 ${formatSyncTime(health.updatedAtUtc)} 之后的下一次生命体征采集。`
        : '优先确认 Health Service 是否已完成该对象健康建档与最近一次回写。',
      needsAttention
        ? `优先复核血氧、心率和风险摘要变化，并结合 ${profileLabel} 对象的照护强度决定是否升级。`
        : '维持当前护理节奏，并在家属沟通时同步最新健康摘要。',
      `同步核对医疗提醒：${medicalAlerts}。`,
    ],
  }
}

function buildFollowupInsight(profile: AdminElderProfileResponse | null, health: AdminElderHealthSummaryResponse | null, elderId: string): FollowupInsight {
  const displayName = profile?.elderName ?? `对象 ${elderId}`
  const careLevel = profile?.careLevel ?? '护理等级待同步'
  const status = profile ? mapAdmissionStatus(profile.admissionStatus) : '待同步'
  const alerts = profile?.medicalAlerts.length ? profile.medicalAlerts : []
  const highCare = careLevel.includes('特级') || careLevel.includes('L4') || careLevel.includes('L3')

  return {
    title: '管理跟进建议',
    summary: health
      ? highCare
        ? `${displayName} 当前属于 ${careLevel}，应优先围绕风险摘要、医疗提醒和交接连续性安排后续跟进。`
        : `${displayName} 当前状态为 ${status}，适合继续把健康观察、家属沟通和护理记录串成一条管理闭环。`
      : `${displayName} 当前尚未命中真实健康摘要，建议先完成健康建档，再决定是否升级管理动作。`,
    actions: [
      alerts.length > 0
        ? `建议把医疗提醒 ${alerts.join('、')} 纳入交接摘要与异常解释的默认上下文。`
        : '当前未同步到医疗提醒，建议先补齐 Elder Service 主档或健康标签。',
      profile?.roomNumber
        ? `建议围绕房间 ${profile.roomNumber} 的护理动作、报警事件和家属沟通统一追踪。`
        : '当前房间信息待同步，建议先确认床位和房间分配状态。',
      health?.riskSummary
        ? `结合风险摘要“${health.riskSummary}”确认是否需要升级为正式跟进任务。`
        : '待真实健康摘要回写后，再决定是否生成正式跟进任务。',
    ],
  }
}

export default function ElderlyDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const scene = getCareScene(searchParams.get('scene'))
  const id = params.id as string
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

  const liveProfile = profileEntry?.data ?? null
  const liveHealth = healthEntry?.data ?? null
  const profileLoading = !profileEntry?.loaded
  const healthLoading = !healthEntry?.loaded
  const profileLoaded = Boolean(profileEntry?.loaded)
  const healthLoaded = Boolean(healthEntry?.loaded)
  const profileError = profileEntry?.error ?? ''
  const healthError = healthEntry?.error ?? ''
  const displayName = liveProfile?.elderName ?? `对象 ${id}`
  const displayRoomNumber = hasText(liveProfile?.roomNumber) ? liveProfile.roomNumber : '房间待同步'
  const displayCareLevel = hasText(liveProfile?.careLevel) ? liveProfile.careLevel : '护理等级待同步'
  const displayStatus = liveProfile ? mapAdmissionStatus(liveProfile.admissionStatus) : profileLoading ? '同步中' : '待同步'
  const profileStatus = getProfileStatus(liveProfile, profileLoading, profileError)
  const healthStatus = getHealthStatus(liveHealth, healthLoading, healthError)
  const hasLiveGender = hasText(liveProfile?.gender)
  const hasLiveAge = typeof liveProfile?.age === 'number' && liveProfile.age > 0
  const hasLiveIdentityCard = Boolean(liveProfile?.identityCard)
  const hasLivePhone = Boolean(liveProfile?.elderPhone)
  const displayGender = hasLiveGender ? liveProfile!.gender : '待同步'
  const displayAge = hasLiveAge ? `${liveProfile!.age}岁` : '待同步'
  const detailSummaries = buildDetailSummaries(displayName, liveHealth, liveProfile)
  const actionInsight = buildFollowupInsight(liveProfile, liveHealth, id)
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'elderly-detail',
    entityId: id,
    entityName: displayName,
    focus,
    target,
    scene: scene ?? undefined,
  })
  const helpHref = '/elderly/help'
  const profileFieldSource = (hasValue: boolean) => resolveFieldSource(hasValue, profileStatus, profileLoaded, profileError)
  const healthFieldSource = (hasValue: boolean) => resolveFieldSource(hasValue, healthStatus, healthLoaded, healthError)

  const sourceMapItems = [
    {
      title: '长者主档',
      status: profileStatus,
      description: liveProfile
        ? '姓名、护理等级、房间、入住状态、家属联系人以及机构委托字段全部来自 Elder Service。'
        : '当前未命中真实主档；页面只显示待同步占位，不再回退本地个人档案。',
      error: profileError,
    },
    {
      title: '健康摘要',
      status: healthStatus,
      description: liveHealth
        ? `风险摘要与体征来自 Health Service，最近同步 ${formatSyncTime(liveHealth.updatedAtUtc)}。`
        : '当前未命中真实健康摘要；页面只显示待同步占位，不再回退本地健康样本。',
      error: healthError,
    },
    {
      title: '缺口字段',
      status: pendingBackfillStatus,
      description: '未入当前后端契约的字段统一显示待同步，由后端后续补齐，不再由前端 mock 或 workflow 补位。',
      error: '',
    },
  ]

  const entrustmentItems = [
    { label: '委托类型', value: liveProfile?.entrustmentType ?? '待同步', source: profileFieldSource(hasText(liveProfile?.entrustmentType)) },
    { label: '委托单位', value: liveProfile?.entrustmentOrganization ?? '待同步', source: profileFieldSource(hasText(liveProfile?.entrustmentOrganization)) },
    { label: '月度补贴', value: typeof liveProfile?.monthlySubsidy === 'number' ? formatCurrency(liveProfile.monthlySubsidy) : '待同步', source: profileFieldSource(typeof liveProfile?.monthlySubsidy === 'number') },
    { label: '固定服务项', value: liveProfile?.serviceItems.length ? liveProfile.serviceItems.join('、') : '待同步', source: profileFieldSource(Boolean(liveProfile?.serviceItems.length)) },
    { label: '服务备注', value: liveProfile?.serviceNotes ?? '待同步', source: profileFieldSource(hasText(liveProfile?.serviceNotes)) },
  ]

  const basicInfoItems = [
    { label: '姓名', value: liveProfile?.elderName ?? '待同步', source: profileFieldSource(hasText(liveProfile?.elderName)) },
    { label: '性别', value: displayGender, source: profileFieldSource(hasLiveGender) },
    { label: '年龄', value: displayAge, source: profileFieldSource(hasLiveAge) },
    { label: '身份证', value: hasLiveIdentityCard ? maskIdCard(liveProfile!.identityCard!) : '待同步', source: profileFieldSource(hasLiveIdentityCard) },
    { label: '联系电话', value: hasLivePhone ? maskPhone(liveProfile!.elderPhone!) : '待同步', source: profileFieldSource(hasLivePhone) },
    { label: '出生日期', value: formatBirthDate(liveProfile?.birthDate), source: profileFieldSource(hasText(liveProfile?.birthDate)) },
    { label: '房间号', value: displayRoomNumber, source: profileFieldSource(hasText(liveProfile?.roomNumber)) },
    { label: '护理等级', value: displayCareLevel, source: profileFieldSource(hasText(liveProfile?.careLevel)) },
    { label: '入住状态', value: displayStatus, source: profileFieldSource(Boolean(liveProfile)) },
    { label: '家属联系人', value: liveProfile?.familyContactName ?? '待同步', source: profileFieldSource(hasText(liveProfile?.familyContactName)) },
    { label: '家属电话', value: hasText(liveProfile?.familyContactPhone) ? maskPhone(liveProfile.familyContactPhone) : '待同步', source: profileFieldSource(hasText(liveProfile?.familyContactPhone)) },
  ]

  const healthInfoItems = [
    { label: '风险摘要', value: liveHealth?.riskSummary ?? '待同步', source: healthFieldSource(hasText(liveHealth?.riskSummary)) },
    { label: '血压', value: liveHealth?.bloodPressure ?? '待同步', source: healthFieldSource(hasText(liveHealth?.bloodPressure)) },
    { label: '心率', value: liveHealth ? `${liveHealth.heartRate} 次/分` : '待同步', source: healthFieldSource(Boolean(liveHealth)) },
    { label: '体温', value: liveHealth ? `${liveHealth.temperature}°C` : '待同步', source: healthFieldSource(Boolean(liveHealth)) },
    { label: '血糖', value: liveHealth ? `${liveHealth.bloodSugar} mmol/L` : '待同步', source: healthFieldSource(Boolean(liveHealth)) },
    { label: '血氧', value: liveHealth ? `${liveHealth.oxygen}%` : '待同步', source: healthFieldSource(Boolean(liveHealth)) },
    { label: '医疗提醒', value: liveProfile?.medicalAlerts.length ? liveProfile.medicalAlerts.join('、') : '待同步', source: profileFieldSource(Boolean(liveProfile?.medicalAlerts.length)) },
    { label: 'ADL 分值', value: typeof liveProfile?.adlScore === 'number' ? String(liveProfile.adlScore) : '待同步', source: profileFieldSource(typeof liveProfile?.adlScore === 'number') },
    { label: '认知状态', value: liveProfile?.cognitiveLevel ?? '待同步', source: profileFieldSource(hasText(liveProfile?.cognitiveLevel)) },
    { label: '最新同步', value: formatSyncTime(liveHealth?.updatedAtUtc), source: healthFieldSource(Boolean(liveHealth?.updatedAtUtc)) },
  ]

  const subtitleParts = [
    id,
    hasText(liveProfile?.roomNumber) ? liveProfile.roomNumber : null,
    hasLiveGender ? liveProfile!.gender : null,
    hasLiveAge ? `${liveProfile!.age}岁` : null,
    hasText(liveProfile?.careLevel) ? liveProfile.careLevel : null,
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
            <Link href={withSceneQuery('/elderly/face', scene, { selected: id, entry: 'elderly-detail' })} className="btn btn-secondary btn-sm flex items-center gap-2">
              <ScanFace size={13} />人脸录入
            </Link>
            <Link href={withSceneQuery(`/elderly/${id}/edit`, scene)} className="btn btn-primary btn-sm flex items-center gap-2">
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
              description="主区只保留真实档案、机构委托和健康信息；未同步字段统一显示待同步。"
              badge={<Tag variant={displayStatus === '入住' ? 'success' : displayStatus === '待入住' ? 'warning' : 'neutral'}>{displayStatus}</Tag>}
              metrics={[
                { label: '主档状态', value: profileStatus.label, hint: displayRoomNumber, tone: profileStatus.variant === 'success' ? 'success' : profileStatus.variant === 'info' ? 'info' : 'warning' },
                { label: '健康状态', value: healthStatus.label, hint: formatSyncTime(liveHealth?.updatedAtUtc), tone: healthStatus.variant === 'success' ? 'success' : healthStatus.variant === 'info' ? 'info' : 'warning' },
                { label: '护理等级', value: displayCareLevel, hint: displayAge, tone: 'primary' },
                { label: '委托口径', value: entrustmentItems[0]?.value ?? '待同步', hint: entrustmentItems[1]?.value ?? '待同步', tone: entrustmentItems[0]?.source.variant === 'success' ? 'success' : 'warning' },
              ]}
              signals={[
                { label: profileError || '详情页已停止使用本地个人档案补位，未同步字段会直接显示待同步。', tone: profileError ? 'warning' : 'success' },
                { label: healthError || '健康摘要仅来自 Health Service，未同步时不会回退本地健康样本。', tone: healthError ? 'warning' : 'info' },
                { label: scene === 'home' ? '当前为居家养老视角，详情动作仍保持同一对象事实结构。' : scene === 'institutional' ? '当前为机构养老视角，优先服务院内档案核对。' : '当前为综合视角，兼容台账和详情回流入口。', tone: 'neutral' },
              ]}
            />

            <div className="kpi-grid">
              <StatCard icon={<Edit size={18} />} label="入住状态" value={displayStatus} sub={displayRoomNumber} color={displayStatus === '入住' ? 'success' : displayStatus === '待入住' ? 'warning' : 'info'} />
              <StatCard icon={<Edit size={18} />} label="护理等级" value={displayCareLevel} sub={displayGender} color="primary" />
              <StatCard icon={<Edit size={18} />} label="主档来源" value={profileStatus.label} sub={liveProfile ? '已命中 Elder Service' : '仅显示真实字段占位'} color={profileStatus.variant === 'success' ? 'success' : profileStatus.variant === 'info' ? 'info' : 'warning'} />
              <StatCard icon={<Edit size={18} />} label="健康来源" value={healthStatus.label} sub={formatSyncTime(liveHealth?.updatedAtUtc)} color={healthStatus.variant === 'success' ? 'success' : healthStatus.variant === 'info' ? 'info' : 'warning'} />
            </div>

            <DataCard
              title="数据来源边界"
              subtitle="首屏基础档案、机构委托和健康摘要都只接入 BFF；未入后端契约的字段不再使用前端补位。"
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

            <DataCard title="基础档案" subtitle="姓名、房间、护理等级和入住状态只读取 live profile；缺失字段统一显示待同步。" badge={<Tag variant="primary">Profile</Tag>}>
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

            <DataCard title="机构委托" subtitle="委托类型、委托单位、月补贴与固定服务项只读取 live profile，缺失时直接标注待同步。" badge={<Tag variant="warning">Entrustment</Tag>}>
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

            <DataCard title="健康信息" subtitle="风险摘要与生命体征只读取 live health；护理依赖字段从 live profile 补充。" badge={<Tag variant="info">Health</Tag>}>
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
                <div className="page-help-card-item">来源：{profileStatus.label} / {healthStatus.label} / {pendingBackfillStatus.label}</div>
                <div className="page-help-card-item">场景：{scene === 'home' ? '居家养老' : scene === 'institutional' ? '机构养老' : '综合视角'}，最终对象事实仍以详情页主区为准。</div>
              </div>
            </DataCard>

            <DataCard title="状态摘要" subtitle="把当前真实健康与主档信息压缩成可读结论。" badge={<Tag variant="primary">Live Summary</Tag>}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ padding: 14, borderRadius: 10, background: "var(--color-bg)", fontSize: 13, lineHeight: 1.7, color: "var(--color-text)" }}>
                  {detailSummaries.statusSummary}
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {detailSummaries.followupActions.map(item => (
                    <div key={item} className="page-help-card-item">{item}</div>
                  ))}
                </div>
                <div>
                  <Link href={buildAiHref('elder-status', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
                </div>
              </div>
            </DataCard>

            <DataCard title="家属沟通摘要" subtitle="同一份真实数据在家属端的表达应更温和、更结论导向。" badge={<Tag variant="success">Family Brief</Tag>}>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ padding: 14, borderRadius: 10, background: "var(--color-bg)", fontSize: 13, lineHeight: 1.7, color: "var(--color-text)" }}>
                  {detailSummaries.familyBrief}
                </div>
                <div>
                  <Link href={buildAiHref('family-brief', 'logs')} className="btn btn-secondary btn-sm">带上下文追踪</Link>
                </div>
              </div>
            </DataCard>

            <DataCard title={actionInsight.title} subtitle="把真实主档与健康上下文转成管理侧跟进动作。" badge={<Tag variant="warning">Follow-up</Tag>}>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ padding: 14, borderRadius: 10, background: "var(--color-bg)", fontSize: 13, lineHeight: 1.7, color: "var(--color-text)" }}>
                  {actionInsight.summary}
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {actionInsight.actions.map(item => (
                    <div key={item} className="page-help-card-item">{item}</div>
                  ))}
                </div>
                <div>
                  <Link href={buildAiHref('elder-management', 'rules')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
                </div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整长者模块说明迁移到显式帮助页"
              summary="长者详情页现在只保留对象事实、委托信息和健康摘要，摘要卡片与管理动作统一后置。"
              items={[
                '先核对基础档案、委托信息和健康字段来源。',
                '再查看状态摘要、家属沟通摘要和管理跟进建议。',
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
