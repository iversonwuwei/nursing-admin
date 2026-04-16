"use client"
import { DataCard, EmptyState, FilterBar, FilterItem, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard, type TagVariant } from "@/components/nh"
import { getAdmissionApplicationsSnapshot, subscribeAdmissionWorkflow } from "@/lib/mock/admission-workflow"
import { buildLiveElderlyList } from "@/lib/mock/elderly-registry"
import {
  activateFaceEnrollment,
  captureFaceSample,
  findFaceEnrollmentRecordByElderlyId,
  getFaceEnrollmentSnapshot,
  returnFaceEnrollmentForRetake,
  startFaceEnrollment,
  subscribeFaceEnrollmentWorkflow,
  validateFaceActivation,
  validateFaceCaptureContext,
  validateRetakeReason,
  type FaceCaptureStepKey,
  type FaceEnrollmentStatus,
} from "@/lib/mock/face-enrollment-workflow"
import { AlertCircle, Camera, CheckCircle2, ChevronRight, ScanFace, Search } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useMemo, useState, useSyncExternalStore } from "react"

type FaceQueueItem = {
  elderlyId: string
  name: string
  room: string
  careLevel: string
  status: FaceEnrollmentStatus
  progress: number
  qualityScore: number
  qualitySummary: string
  lastUpdated: string
  operator: string
  deviceLabel: string
  activationNote?: string
  retakeReason?: string
  capturedSteps: FaceCaptureStepKey[]
}

const STATUS_VARIANT: Record<FaceEnrollmentStatus, TagVariant> = {
  '待录入': 'neutral',
  '采集中': 'warning',
  '待确认': 'info',
  '已生效': 'success',
  '需重录': 'danger',
}

const STEP_LABELS: Array<{ key: FaceCaptureStepKey; title: string; description: string }> = [
  { key: 'front', title: '正脸样本', description: '正视镜头，确认五官无遮挡。' },
  { key: 'left', title: '左侧脸样本', description: '左转 30 到 45 度，保证轮廓清晰。' },
  { key: 'right', title: '右侧脸样本', description: '右转 30 到 45 度，补齐侧脸特征。' },
]

function progressForStatus(status: FaceEnrollmentStatus, capturedSteps: FaceCaptureStepKey[]) {
  if (status === '已生效') {
    return 100
  }

  if (status === '需重录') {
    return 20
  }

  if (capturedSteps.length >= 3) {
    return 90
  }

  if (capturedSteps.length === 2) {
    return 65
  }

  if (capturedSteps.length === 1) {
    return 35
  }

  return 0
}

function buildQueueItem(record: ReturnType<typeof findFaceEnrollmentRecordByElderlyId>, elder: ReturnType<typeof buildLiveElderlyList>[number]): FaceQueueItem {
  const status = record?.status ?? '待录入'
  const capturedSteps = record?.capturedSteps ?? []
  return {
    elderlyId: elder.id,
    name: elder.name,
    room: `${elder.roomNumber}-${elder.bedNumber}`,
    careLevel: elder.careLevel,
    status,
    progress: progressForStatus(status, capturedSteps),
    qualityScore: record?.qualityScore ?? 0,
    qualitySummary: record?.qualitySummary ?? '尚未开始采集，请先记录三个角度样本。',
    lastUpdated: record?.lastUpdated ?? '——',
    operator: record?.operator ?? '前台接待 李敏',
    deviceLabel: record?.deviceLabel ?? '前台采集终端 A',
    activationNote: record?.activationNote,
    retakeReason: record?.retakeReason,
    capturedSteps,
  }
}

export default function FacePage() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('selected')
  const entry = searchParams.get('entry')
  const scene = searchParams.get('scene')
  const admissionSnapshot = useSyncExternalStore(
    subscribeAdmissionWorkflow,
    getAdmissionApplicationsSnapshot,
    getAdmissionApplicationsSnapshot,
  )
  const faceSnapshot = useSyncExternalStore(
    subscribeFaceEnrollmentWorkflow,
    getFaceEnrollmentSnapshot,
    getFaceEnrollmentSnapshot,
  )
  const liveElderlyList = useMemo(() => buildLiveElderlyList(admissionSnapshot), [admissionSnapshot])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<FaceEnrollmentStatus | ''>('')
  const [selectedId, setSelectedId] = useState<string | null>(preselectedId)
  const [operatorDrafts, setOperatorDrafts] = useState<Record<string, string>>({})
  const [deviceDrafts, setDeviceDrafts] = useState<Record<string, string>>({})
  const [activationNotes, setActivationNotes] = useState<Record<string, string>>({})
  const [retakeNotes, setRetakeNotes] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const queue = useMemo(
    () => liveElderlyList.map(elder => buildQueueItem(findFaceEnrollmentRecordByElderlyId(elder.id, faceSnapshot), elder)),
    [faceSnapshot, liveElderlyList],
  )
  const filtered = useMemo(
    () => queue.filter(item => {
      if (search && !item.name.includes(search) && !item.elderlyId.includes(search)) {
        return false
      }
      if (statusFilter && item.status !== statusFilter) {
        return false
      }
      return true
    }),
    [queue, search, statusFilter],
  )

  const selected = useMemo(() => {
    const preferredId = selectedId ?? preselectedId
    return filtered.find(item => item.elderlyId === preferredId)
      ?? queue.find(item => item.elderlyId === preferredId)
      ?? queue.find(item => item.status === '待录入')
      ?? queue.find(item => item.status === '需重录')
      ?? queue[0]
      ?? null
  }, [filtered, preselectedId, queue, selectedId])

  const selectedOperator = selected ? operatorDrafts[selected.elderlyId] ?? selected.operator : ''
  const selectedDevice = selected ? deviceDrafts[selected.elderlyId] ?? selected.deviceLabel : ''
  const selectedActivationNote = selected ? activationNotes[selected.elderlyId] ?? selected.activationNote ?? '' : ''
  const selectedRetakeNote = selected ? retakeNotes[selected.elderlyId] ?? selected.retakeReason ?? '' : ''
  const helpHref = '/elderly/help'

  const stats = {
    total: queue.length,
    done: queue.filter(item => item.status === '已生效').length,
    inProgress: queue.filter(item => item.status === '采集中').length,
    pending: queue.filter(item => item.status === '待录入' || item.status === '需重录').length,
    review: queue.filter(item => item.status === '待确认').length,
  }

  const entryLabel = entry === 'elderly-detail' ? '老人详情页' : entry === 'elderly-list' ? '老人列表页' : ''
  const sceneMeta = scene === 'home'
    ? {
      title: '居家人脸录入',
      subtitle: `按居家养老协同视角处理人脸录入任务，已生效 ${stats.done} 位`,
    }
    : {
      title: '人脸录入',
      subtitle: `共 ${queue.length} 位老人进入人脸录入口径，已生效 ${stats.done} 位`,
    }

  function updateError(message: string) {
    if (!selected) {
      return
    }

    setErrors(current => ({
      ...current,
      [selected.elderlyId]: message,
    }))
  }

  function clearError() {
    if (!selected) {
      return
    }

    setErrors(current => ({
      ...current,
      [selected.elderlyId]: '',
    }))
  }

  function resolveEntrySource() {
    if (entry === 'elderly-detail') {
      return 'elderly-detail' as const
    }

    if (entry === 'elderly-list') {
      return 'elderly-list' as const
    }

    return 'face-page' as const
  }

  function handleStart() {
    if (!selected) {
      return
    }

    const validationMessage = validateFaceCaptureContext(selectedOperator, selectedDevice)
    if (validationMessage) {
      updateError(validationMessage)
      return
    }

    clearError()
    startFaceEnrollment({
      elderlyId: selected.elderlyId,
      elder: selected.name,
      room: selected.room,
      operator: selectedOperator,
      deviceLabel: selectedDevice,
      entrySource: resolveEntrySource(),
    })
  }

  function handleCapture(step: FaceCaptureStepKey) {
    if (!selected) {
      return
    }

    const validationMessage = validateFaceCaptureContext(selectedOperator, selectedDevice)
    if (validationMessage) {
      updateError(validationMessage)
      return
    }

    clearError()
    if (selected.status === '待录入' || selected.status === '需重录') {
      startFaceEnrollment({
        elderlyId: selected.elderlyId,
        elder: selected.name,
        room: selected.room,
        operator: selectedOperator,
        deviceLabel: selectedDevice,
        entrySource: resolveEntrySource(),
      })
    }
    captureFaceSample(selected.elderlyId, step, selectedOperator, selectedDevice)
  }

  function handleActivate() {
    if (!selected) {
      return
    }

    const record = findFaceEnrollmentRecordByElderlyId(selected.elderlyId, faceSnapshot)
    const validationMessage = validateFaceActivation(record, selectedActivationNote)
    if (validationMessage) {
      updateError(validationMessage)
      return
    }

    clearError()
    activateFaceEnrollment(selected.elderlyId, selectedActivationNote)
  }

  function handleRetake() {
    if (!selected) {
      return
    }

    const validationMessage = validateRetakeReason(selectedRetakeNote)
    if (validationMessage) {
      updateError(validationMessage)
      return
    }

    clearError()
    returnFaceEnrollmentForRetake(selected.elderlyId, selectedRetakeNote)
  }

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title={sceneMeta.title}
        subtitle={sceneMeta.subtitle}
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/elderly" className="btn btn-secondary btn-sm">返回老人列表</Link>
            <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={handleStart} data-testid="face-start-button">
              <Camera size={14} />{selected && (selected.status === '待录入' || selected.status === '需重录') ? '开始采集' : '继续处理'}
            </button>
          </div>
        }
      />

      <InteractionRailLayout
        main={(
          <>
            {selected && entryLabel ? (
              <DataCard
                title={`来自${entryLabel}`}
                subtitle={`${selected.name} 的人脸录入已定位到当前工作台。`}
                badge={<Tag variant={STATUS_VARIANT[selected.status]}>{selected.status}</Tag>}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                    当前对象 {selected.name}，房间 {selected.room}，可在单页内完成采集、退回和激活。
                  </div>
                  <Link href={`/elderly/${selected.elderlyId}`} className="btn btn-secondary btn-sm">查看老人档案</Link>
                </div>
              </DataCard>
            ) : null}

            <WorkflowOverviewCard
              eyebrow="Face Enrollment"
              title="人脸录入闭环"
              description="让前台或护理主管在单页内完成队列选择、三角度采集、质量确认和模板激活。"
              badge={<Tag variant="primary">Execution First</Tag>}
              metrics={[
                { label: '需录入老人', value: stats.total, hint: '当前进入录入口径的对象', tone: 'primary' },
                { label: '已生效', value: stats.done, hint: '模板已可用于识别', tone: stats.done > 0 ? 'success' : 'neutral' },
                { label: '采集中', value: stats.inProgress, hint: '仍在补齐三角度样本', tone: stats.inProgress > 0 ? 'warning' : 'neutral' },
                { label: '待确认/需重录', value: stats.review + stats.pending, hint: '需要人工确认或退回', tone: stats.review + stats.pending > 0 ? 'warning' : 'success' },
              ]}
              signals={[
                { label: '主区保留队列、采集、激活动作，避免在多个页面来回切换', tone: 'info' },
                { label: selected ? `当前焦点对象：${selected.name} · ${selected.room}` : '当前无焦点对象，先从队列选择待处理老人', tone: selected ? 'neutral' : 'warning' },
                { label: '异常模板必须在当前页显式退回重录，不能依赖口头确认', tone: 'warning' },
              ]}
            />

            <div className="kpi-grid" style={{ marginBottom: 16 }}>
              {[
                { label: '需录入老人', value: stats.total, icon: ScanFace },
                { label: '已生效', value: stats.done, icon: CheckCircle2 },
                { label: '采集中', value: stats.inProgress, icon: Camera },
                { label: '待确认/需重录', value: stats.review + stats.pending, icon: AlertCircle },
              ].map(({ label, value, icon: Icon }) => (
                <StatCard key={label} icon={<Icon size={18} />} label={label} value={value} color={label === '已生效' ? 'success' : label === '采集中' ? 'warning' : label === '待确认/需重录' ? 'danger' : 'primary'} />
              ))}
            </div>

            <FilterBar>
              <FilterItem label="搜索">
                <div className="input-wrap" style={{ minWidth: 220 }}>
                  <span className="input-icon"><Search size={14} /></span>
                  <input className="input" placeholder="搜索姓名或编号..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
                </div>
              </FilterItem>
              <FilterItem label="状态">
                <select className="select" value={statusFilter} onChange={event => setStatusFilter(event.target.value as FaceEnrollmentStatus | '')} style={{ minWidth: 140 }}>
                  <option value="">全部状态</option>
                  <option value="待录入">待录入</option>
                  <option value="采集中">采集中</option>
                  <option value="待确认">待确认</option>
                  <option value="已生效">已生效</option>
                  <option value="需重录">需重录</option>
                </select>
              </FilterItem>
            </FilterBar>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16, alignItems: 'start' }}>
              <DataCard title="录入队列" subtitle="先处理待确认和需重录对象，再消化待录入任务。" className="min-w-0">
                <div style={{ overflowX: 'auto' }} data-testid="face-queue-table">
                  <table className="table">
                    <thead>
                      <tr><th>老人</th><th>房间</th><th>状态</th><th>质量</th><th>最后更新</th><th></th></tr>
                    </thead>
                    <tbody>
                      {filtered.map(item => (
                        <tr key={item.elderlyId}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 38, height: 38, borderRadius: '50%', background: item.status === '已生效' ? 'linear-gradient(135deg, var(--color-primary-light), var(--color-primary))' : 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.status === '已生效' ? 'white' : 'var(--color-muted)' }}>
                                {item.status === '已生效' ? item.name.charAt(0) : <ScanFace size={18} />}
                              </div>
                              <div>
                                <div className="font-semibold text-sm">{item.name}</div>
                                <div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{item.elderlyId} · {item.careLevel}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{item.room}</span></td>
                          <td><Tag variant={STATUS_VARIANT[item.status]}>{item.status}</Tag></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 6, background: 'var(--color-bg)', borderRadius: 999 }}>
                                <div style={{ height: '100%', width: `${item.progress}%`, background: item.progress >= 100 ? 'var(--color-success)' : item.progress >= 80 ? 'var(--color-info)' : item.progress > 0 ? 'var(--color-warning)' : 'var(--color-border)', borderRadius: 999 }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: item.qualityScore >= 85 ? 'var(--color-success)' : item.qualityScore > 0 ? 'var(--color-warning)' : 'var(--color-muted)', width: 36 }}>{item.qualityScore || item.progress}%</span>
                            </div>
                          </td>
                          <td><span className="text-xs" style={{ color: 'var(--color-muted)' }}>{item.lastUpdated}</span></td>
                          <td>
                            <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={() => setSelectedId(item.elderlyId)}>
                              {item.status === '待录入' ? '录入' : item.status === '已生效' ? '查看' : '继续'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length === 0 ? (
                    <EmptyState variant="search" title="暂无匹配对象" description="调整搜索词或状态筛选后重试。" />
                  ) : null}
                </div>
              </DataCard>

              {selected ? (
                <DataCard
                  title={`${selected.name} 人脸录入`}
                  subtitle={`${selected.room} · ${selected.careLevel}`}
                  badge={<Tag variant={STATUS_VARIANT[selected.status]}>{selected.status}</Tag>}
                  action={<Link href={`/elderly/${selected.elderlyId}`} className="btn btn-secondary btn-sm">查看档案 <ChevronRight size={12} /></Link>}
                  className="min-w-0"
                >
                  <div style={{ display: 'grid', gap: 12 }} data-testid="face-workflow-card">
                    <div style={{ borderRadius: 10, border: '1px solid var(--color-border)', padding: 14 }}>
                      <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>质量摘要</div>
                      <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.7, color: 'var(--color-text)' }}>{selected.qualitySummary}</div>
                      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-primary)', fontWeight: 700 }}>质量评分 {selected.qualityScore}% · 当前进度 {selected.progress}%</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>采集操作人</div>
                        <input
                          className="input"
                          value={selectedOperator}
                          onChange={event => setOperatorDrafts(current => ({ ...current, [selected.elderlyId]: event.target.value }))}
                          placeholder="如 前台接待 李敏"
                          style={{ marginTop: 8 }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>采集终端</div>
                        <input
                          className="input"
                          value={selectedDevice}
                          onChange={event => setDeviceDrafts(current => ({ ...current, [selected.elderlyId]: event.target.value }))}
                          placeholder="如 前台采集终端 A"
                          style={{ marginTop: 8 }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: 10 }}>
                      {STEP_LABELS.map(step => {
                        const done = selected.capturedSteps.includes(step.key)
                        return (
                          <div key={step.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderRadius: 10, border: '1px solid var(--color-border)', padding: 12 }} data-testid={`face-step-${step.key}`}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{step.title}</div>
                              <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.6, color: 'var(--color-muted)' }}>{step.description}</div>
                            </div>
                            {done ? (
                              <Tag variant="success">已采集</Tag>
                            ) : (
                              <button className="btn btn-secondary btn-sm" onClick={() => handleCapture(step.key)} data-testid={`face-capture-${step.key}`}>
                                采集
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div>
                      <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>激活备注</div>
                      <textarea
                        className="input"
                        value={selectedActivationNote}
                        onChange={event => setActivationNotes(current => ({ ...current, [selected.elderlyId]: event.target.value }))}
                        placeholder="填写为什么可以激活，例如已完成三角度采集且光照稳定。"
                        style={{ marginTop: 8, minHeight: 84, resize: 'vertical', paddingTop: 10 }}
                      />
                    </div>

                    <div>
                      <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>退回重录原因</div>
                      <textarea
                        className="input"
                        value={selectedRetakeNote}
                        onChange={event => setRetakeNotes(current => ({ ...current, [selected.elderlyId]: event.target.value }))}
                        placeholder="如 逆光、遮挡、佩戴口罩导致模板质量不足。"
                        style={{ marginTop: 8, minHeight: 72, resize: 'vertical', paddingTop: 10 }}
                      />
                    </div>

                    {errors[selected.elderlyId] ? (
                      <div style={{ borderRadius: 10, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)', padding: 12, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-danger)' }}>
                        {errors[selected.elderlyId]}
                      </div>
                    ) : null}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                        健康信号：状态变化必须在当前页显式可见，避免前台或护理主管依赖口头确认。
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="btn btn-ghost btn-sm" onClick={handleRetake} data-testid="face-retake-button">退回重录</button>
                        <button className="btn btn-primary btn-sm" onClick={handleActivate} data-testid="face-activate-button">确认激活</button>
                      </div>
                    </div>
                  </div>
                </DataCard>
              ) : (
                <DataCard title="当前无可处理对象">
                  <EmptyState variant="search" title="当前无可处理对象" description="请从老人列表或详情重新进入，或放宽搜索条件。" />
                </DataCard>
              )}
            </div>
          </>
        )}
        rail={(
          <>
            <DataCard title="当前处理上下文" subtitle="对象事实和入口来源后置展示，避免打散采集操作。" badge={<Tag variant="info">Enrollment Context</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">入口：{entryLabel || '人脸录入页直达'}{scene === 'home' ? ' · 居家养老视角' : ' · 机构/综合视角'}</div>
                <div className="page-help-card-item">当前状态：{selected ? `${selected.name} · ${selected.room} · ${selected.status}` : '尚未选中处理对象'}</div>
                <div className="page-help-card-item">执行原则：先选对象，再补齐三角度样本，最后人工确认激活。</div>
              </div>
            </DataCard>

            <DataCard title="闭环边界" subtitle="帮助前台和主管判断哪些信息应该留在主区，哪些应后置。" badge={<Tag variant="warning">Boundary</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">主区只保留队列、采集按钮、质量摘要、退回重录和确认激活动作。</div>
                <div className="page-help-card-item">如果模板质量不足，必须在当前页留下退回原因，方便后续追溯。</div>
                <div className="page-help-card-item">帮助说明和页面定位放到右轨或帮助页，不再挤占执行工作台。</div>
              </div>
            </DataCard>

            <DataCard title="现场健康信号" subtitle="用于判断当前流程是否可安全发布和继续操作。" badge={<Tag variant="success">Health Signal</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">状态从待录入到已生效的变化必须在队列和对象卡片上同步可见。</div>
                <div className="page-help-card-item">待确认或需重录对象应优先暴露在队列中，不被说明信息遮挡。</div>
                <div className="page-help-card-item">移动端下右轨会后置到主区之后，但采集动作仍保留在主流程卡片中。</div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整长者模块说明迁移到显式帮助页"
              summary="人脸录入页只保留执行闭环，模块定位、边界说明和使用顺序统一在帮助页查看。"
              items={[
                '先从队列选择对象，再执行三角度样本采集。',
                '激活前必须补充操作人、终端和必要备注。',
                '若页面需要完整说明，进入长者帮助页查看。',
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
