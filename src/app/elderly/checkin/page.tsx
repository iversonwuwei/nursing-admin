'use client'

import { DataCard, FilterBar, FilterItem, InteractionRailLayout, PageHeader, StatCard, Tag, WorkflowOverviewCard } from '@/components/nh'
import { ModuleEntitlementGate } from '@/components/platform/ModuleEntitlementGate'
import { getCareScene, withSceneQuery } from '@/lib/care-scenes'
import {
    activateAdminAssessmentCase,
    confirmAdminAssessmentDecision,
    createAdminAssessmentCase,
    fetchAdminAssessmentCases,
    type AdminAssessmentCaseResponse,
    type AdminCreateAssessmentCaseRequest,
} from '@/lib/elderly/admin-elderly-api'
import { Bot, Building2, CheckCircle2, ClipboardCheck, Home as HomeIcon, Plus, Search, Shield, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

const CARE_LEVELS = ['特级护理', '一级护理', '二级护理', '三级护理'] as const
const COGNITIVE_LEVELS = ['正常', '轻度受损', '中度受损', '重度受损'] as const

type CareLevel = typeof CARE_LEVELS[number]
type AssessmentStatus = '待人工确认' | '计划已生成' | '已入住'

type AssessmentFormState = {
    elderName: string
    age: string
    gender: string
    phone: string
    emergencyContact: string
    roomNumber: string
    requestedCareLevel: CareLevel
    chronicConditions: string
    medicationSummary: string
    allergySummary: string
    adlScore: string
    cognitiveLevel: string
    riskNotes: string
    entrustmentType: string
    entrustmentOrganization: string
    monthlySubsidy: string
    serviceItems: string
    serviceNotes: string
}

const EMPTY_FORM: AssessmentFormState = {
    elderName: '',
    age: '',
    gender: '女',
    phone: '',
    emergencyContact: '',
    roomNumber: '',
    requestedCareLevel: '二级护理',
    chronicConditions: '',
    medicationSummary: '',
    allergySummary: '',
    adlScore: '',
    cognitiveLevel: '轻度受损',
    riskNotes: '',
    entrustmentType: '',
    entrustmentOrganization: '',
    monthlySubsidy: '',
    serviceItems: '',
    serviceNotes: '',
}

const PENDING_INTEGRATION_ITEMS = [
    {
        title: '规则集匹配',
        summary: '当前 live 版本不再读取 assessment-config-workflow，本区块等待真实规则服务接入。',
    },
    {
        title: '认定模板与护理项',
        summary: '模板命中与护理项编排未接入真实接口，页面只显示 Pending Integration。',
    },
    {
        title: '协同机构与执行回执',
        summary: '机构接单、任务派发和提醒回执不再从本地 store 伪造，等待后续聚合服务。',
    },
] as const

function formatDateTime(value?: string | null) {
  if (!value) {
      return '暂无'
  }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return '暂无'
  }

    return new Intl.DateTimeFormat('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date)
}

function formatElapsed(value?: string | null) {
    if (!value) {
        return '暂无'
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
    return '暂无'
  }

    const diffMs = Math.max(0, Date.now() - date.getTime())
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

  if (days > 0) {
      return `${days}天${hours % 24}小时`
  }

  if (hours > 0) {
    return `${hours}小时`
  }

    return `${Math.max(1, Math.floor(diffMs / (1000 * 60)))}分钟`
}

function getStatusVariant(status: string) {
    if (status === '已入住') return 'success'
    if (status === '计划已生成') return 'primary'
    return 'warning'
}

function getLevelVariant(level: string) {
    if (level === '特级护理') return 'danger'
    if (level === '一级护理') return 'warning'
    if (level === '二级护理') return 'primary'
    return 'info'
}

function buildSceneMeta(scene: ReturnType<typeof getCareScene>) {
    if (scene === 'home') {
        return {
            title: '居家个案评定中心',
            subtitle: '资料受理 -> AI 建议 -> 人工认定 -> 生效确认',
            actionLabel: '补录居家评定申请',
            sourceType: 'document-import',
            sourceLabel: '资料导入',
            sourceSummary: '居家评估资料已导入，待人工复核。',
        }
  }

    if (scene === 'institutional') {
        return {
            title: '机构评估认定中心',
            subtitle: '院内受理 -> AI 建议 -> 人工认定 -> 生效确认',
            actionLabel: '新建机构评定申请',
            sourceType: 'manual-form',
            sourceLabel: '前台建档',
            sourceSummary: '院内首评待处理。',
        }
  }

    return {
        title: '长护险评估认定',
        subtitle: '申请受理 -> AI 辅助评估 -> 人工认定 -> 生效确认',
        actionLabel: '新建评估申请',
        sourceType: 'manual-form',
        sourceLabel: '前台建档',
        sourceSummary: '综合评定申请待处理。',
    }
}

function validateForm(form: AssessmentFormState) {
    if (!form.elderName.trim()) return '请填写长者姓名。'
    if (!form.age.trim() || Number(form.age) <= 0) return '请填写正确年龄。'
    if (!form.phone.trim()) return '请填写联系电话。'
    if (!form.emergencyContact.trim()) return '请填写紧急联系人。'
    if (!form.roomNumber.trim()) return '请填写房间号或服务地址。'
    if (!form.adlScore.trim() || Number(form.adlScore) < 0) return '请填写正确的 ADL 评分。'
    if (!form.cognitiveLevel.trim()) return '请选择认知状态。'
    return ''
}

function toRequest(form: AssessmentFormState, sceneMeta: ReturnType<typeof buildSceneMeta>): AdminCreateAssessmentCaseRequest {
    return {
        elderName: form.elderName.trim(),
        age: Number(form.age),
        gender: form.gender.trim(),
        phone: form.phone.trim(),
        emergencyContact: form.emergencyContact.trim(),
        roomNumber: form.roomNumber.trim(),
        requestedCareLevel: form.requestedCareLevel,
        chronicConditions: form.chronicConditions.trim(),
        medicationSummary: form.medicationSummary.trim(),
        allergySummary: form.allergySummary.trim(),
        adlScore: Number(form.adlScore),
        cognitiveLevel: form.cognitiveLevel.trim(),
        riskNotes: form.riskNotes.trim(),
        entrustmentType: form.entrustmentType.trim() || null,
        entrustmentOrganization: form.entrustmentOrganization.trim() || null,
        monthlySubsidy: form.monthlySubsidy.trim() ? Number(form.monthlySubsidy) : null,
        serviceItems: form.serviceItems.split(/[，,]/).map(item => item.trim()).filter(Boolean),
        serviceNotes: form.serviceNotes.trim() || null,
        sourceType: sceneMeta.sourceType,
        sourceLabel: sceneMeta.sourceLabel,
        sourceDocumentNames: sceneMeta.sourceType === 'document-import' ? ['居家评估资料'] : [],
        sourceSummary: sceneMeta.sourceSummary,
    }
}

export default function CheckinPage() {
  const searchParams = useSearchParams()
  const scene = getCareScene(searchParams.get('scene'))
  const selectedFromQuery = searchParams.get('selected')
  const selectedFromNew = searchParams.get('entry') === 'elderly-new'
  const selectedFromImport = searchParams.get('entry') === 'elderly-import'
    const sceneMeta = buildSceneMeta(scene)

    const [cases, setCases] = useState<AdminAssessmentCaseResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | AssessmentStatus>('all')
    const [showForm, setShowForm] = useState(selectedFromNew || selectedFromImport)
    const [form, setForm] = useState<AssessmentFormState>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [selectedId, setSelectedId] = useState(selectedFromQuery ?? '')
    const [reviewLevel, setReviewLevel] = useState<CareLevel>('二级护理')
    const [reviewNote, setReviewNote] = useState('')
    const [decisionBusy, setDecisionBusy] = useState(false)
    const [activateBusy, setActivateBusy] = useState(false)

    useEffect(() => {
        let cancelled = false

      async function loadCases() {
          try {
              setLoading(true)
              const response = await fetchAdminAssessmentCases({ scene: scene ?? undefined, page: 1, pageSize: 100 })

              if (cancelled) {
                  return
              }

          setCases(response.items)
          setLoadError('')
      } catch (error) {
          if (cancelled) {
              return
          }

            setCases([])
            setLoadError(error instanceof Error ? error.message : '个案评定列表加载失败。')
        } finally {
            if (!cancelled) {
                setLoading(false)
            }
        }
    }

      void loadCases()

      return () => {
          cancelled = true
      }
  }, [scene])

    const filteredCases = useMemo(() => {
        return cases
            .filter(item => statusFilter === 'all' || item.status === statusFilter)
            .filter(item => !search.trim() || [item.elderName, item.assessmentId, item.roomNumber].some(value => value.includes(search.trim())))
    }, [cases, search, statusFilter])

    const selectedCase = useMemo(() => {
        return cases.find(item => item.assessmentId === selectedId)
            ?? cases.find(item => item.assessmentId === selectedFromQuery)
            ?? filteredCases[0]
            ?? cases[0]
            ?? null
    }, [cases, filteredCases, selectedFromQuery, selectedId])

    useEffect(() => {
        if (!selectedCase) {
            return
    }

      setSelectedId(selectedCase.assessmentId)
      setReviewLevel((selectedCase.confirmedCareLevel ?? selectedCase.aiRecommendation.recommendedLevel) as CareLevel)
      setReviewNote(selectedCase.reviewNote ?? '')
  }, [selectedCase])

    const stats = useMemo(() => ({
        total: cases.length,
        pending: cases.filter(item => item.status === '待人工确认').length,
        planned: cases.filter(item => item.status === '计划已生成').length,
        active: cases.filter(item => item.status === '已入住').length,
    }), [cases])

  function updateForm<K extends keyof AssessmentFormState>(key: K, value: AssessmentFormState[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

    async function handleCreateCase() {
        const validationError = validateForm(form)
    if (validationError) {
      setFormError(validationError)
      return
    }

      try {
          setSubmitting(true)
          const created = await createAdminAssessmentCase(toRequest(form, sceneMeta))
          setCases(current => [created, ...current])
          setSelectedId(created.assessmentId)
          setShowForm(false)
        setForm(EMPTY_FORM)
        setFormError('')
    } catch (error) {
        setFormError(error instanceof Error ? error.message : '个案评定创建失败。')
    } finally {
        setSubmitting(false)
    }
  }

    async function handleConfirmDecision() {
        if (!selectedCase) {
      return
    }

      if (reviewLevel !== selectedCase.aiRecommendation.recommendedLevel && !reviewNote.trim()) {
      setFormError('人工调整护理级别时，请填写调整说明。')
      return
    }

      try {
          setDecisionBusy(true)
          const updated = await confirmAdminAssessmentDecision(selectedCase.assessmentId, {
              confirmedCareLevel: reviewLevel,
              reviewNote: reviewNote.trim() || null,
              confirmedBy: '护理主管',
          })
          setCases(current => current.map(item => item.assessmentId === updated.assessmentId ? updated : item))
          setFormError('')
    } catch (error) {
        setFormError(error instanceof Error ? error.message : '人工认定确认失败。')
    } finally {
        setDecisionBusy(false)
    }
  }

    async function handleActivateCase() {
        if (!selectedCase) {
      return
    }

      try {
          setActivateBusy(true)
          const updated = await activateAdminAssessmentCase(selectedCase.assessmentId)
          setCases(current => current.map(item => item.assessmentId === updated.assessmentId ? updated : item))
          setFormError('')
      } catch (error) {
          setFormError(error instanceof Error ? error.message : '认定生效失败。')
      } finally {
          setActivateBusy(false)
    }
  }

  return (
    <ModuleEntitlementGate
      module="ltci-service"
      pageTitle={sceneMeta.title}
      moduleLabel="评定与长护险"
          disabledSummary="当前租户未开通评定与长护险模块。页面保留为只读禁用态，避免认定受理和生效链路超出套餐边界。"
      fallbackLinks={[
        { href: '/', label: '返回首页' },
        { href: '/operations/daily', label: '进入日班工作台' },
      ]}
    >
          <div className="page-root animate-fade-up">
              <PageHeader
          title={sceneMeta.title}
                  subtitle={`${sceneMeta.subtitle} · 当前 ${stats.total} 条真实 assessment case`}
                  actions={(
                      <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={() => setShowForm(current => !current)}>
                          <Plus size={14} />
                          {sceneMeta.actionLabel}
                      </button>
                  )}
              />

              <WorkflowOverviewCard
                  eyebrow="Assessment Command Center"
                  title={selectedCase ? `${selectedCase.elderName} 的认定工作台` : sceneMeta.title}
                  description={selectedCase
                      ? `${selectedCase.roomNumber} · ${selectedCase.sourceLabel}。当前页面只保留真实 assessment case、AI 建议和人工认定主流程。`
                      : '当前页面已切换为真实 assessment case 模式，不再读取 assessment-workflow、assessment-config-workflow 或 master-data-workflow。'}
                  badge={<Tag variant="primary">Live Assessment</Tag>}
                  metrics={[
                      { label: '评定申请', value: stats.total, hint: '真实 assessment case', tone: 'primary' },
                      { label: '待人工确认', value: stats.pending, hint: '需要人工认定', tone: stats.pending > 0 ? 'warning' : 'success' },
                      { label: '计划已生成', value: stats.planned, hint: '可推进到生效', tone: stats.planned > 0 ? 'info' : 'success' },
                      { label: '已入住', value: stats.active, hint: '认定已生效', tone: 'success' },
                  ]}
                  signals={[
                      { label: loadError || 'assessment case 已从真实 API 加载', tone: loadError ? 'danger' : 'success' },
                      { label: `当前场景：${scene === 'home' ? '居家' : scene === 'institutional' ? '机构' : '综合'}`, tone: 'info' },
                      { label: '规则集 / 模板 / 协同机构 当前仅显示 Pending Integration', tone: 'warning' },
                      { label: '创建个案时由 Admin BFF 先调用 AI，再写入 Elder Service', tone: 'primary' },
                  ]}
                  actions={
                      <>
                          <Link href={withSceneQuery('/elderly/new', scene)} className="btn btn-secondary btn-sm">前往长者建档</Link>
                          <Link href={withSceneQuery('/elderly/import', scene)} className="btn btn-secondary btn-sm">前往资料导入</Link>
                      </>
                  }
              />

              <div className="kpi-grid" style={{ marginBottom: 16 }}>
                  <StatCard icon={<ClipboardCheck size={18} />} label="待人工确认" value={stats.pending} sub="优先处理待确认个案" color={stats.pending > 0 ? 'warning' : 'success'} />
                  <StatCard icon={<Bot size={18} />} label="AI 建议已生成" value={stats.total} sub="创建即写入真实 AI 建议" color="primary" />
                  <StatCard icon={<CheckCircle2 size={18} />} label="计划已生成" value={stats.planned} sub="人工认定已完成" color={stats.planned > 0 ? 'info' : 'success'} />
                  <StatCard icon={<HomeIcon size={18} />} label="已入住" value={stats.active} sub="认定已生效" color="success" />
              </div>

              {showForm ? (
                  <DataCard
                      icon={<UserPlus size={16} />}
                      title={sceneMeta.actionLabel}
                      subtitle="创建后会实时调用 AI admission-assessment，并把结果与表单一起落入真实 assessment case。"
                      badge={<Tag variant="primary">Create Live Case</Tag>}
                      action={<button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>收起</button>}
                  >
                      <div style={{ display: 'grid', gap: 12 }}>
                          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                              <input className="input" placeholder="长者姓名" value={form.elderName} onChange={event => updateForm('elderName', event.target.value)} />
                              <input className="input" placeholder="年龄" inputMode="numeric" value={form.age} onChange={event => updateForm('age', event.target.value)} />
                              <select className="select" value={form.gender} onChange={event => updateForm('gender', event.target.value)}>
                                  <option value="女">女</option>
                                  <option value="男">男</option>
                              </select>
                              <input className="input" placeholder="联系电话" value={form.phone} onChange={event => updateForm('phone', event.target.value)} />
                              <input className="input" placeholder="紧急联系人" value={form.emergencyContact} onChange={event => updateForm('emergencyContact', event.target.value)} />
                              <input className="input" placeholder="房间号 / 服务地址" value={form.roomNumber} onChange={event => updateForm('roomNumber', event.target.value)} />
                              <select className="select" value={form.requestedCareLevel} onChange={event => updateForm('requestedCareLevel', event.target.value as CareLevel)}>
                                  {CARE_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                              </select>
                              <input className="input" placeholder="ADL 评分" inputMode="numeric" value={form.adlScore} onChange={event => updateForm('adlScore', event.target.value)} />
                              <select className="select" value={form.cognitiveLevel} onChange={event => updateForm('cognitiveLevel', event.target.value)}>
                                  {COGNITIVE_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                              </select>
                              <input className="input" placeholder="委托类型" value={form.entrustmentType} onChange={event => updateForm('entrustmentType', event.target.value)} />
                              <input className="input" placeholder="委托单位" value={form.entrustmentOrganization} onChange={event => updateForm('entrustmentOrganization', event.target.value)} />
                              <input className="input" placeholder="月度补贴" inputMode="decimal" value={form.monthlySubsidy} onChange={event => updateForm('monthlySubsidy', event.target.value)} />
                          </div>
                          <textarea className="textarea" placeholder="慢病与既往病史" rows={3} value={form.chronicConditions} onChange={event => updateForm('chronicConditions', event.target.value)} />
                          <textarea className="textarea" placeholder="长期用药" rows={3} value={form.medicationSummary} onChange={event => updateForm('medicationSummary', event.target.value)} />
                          <textarea className="textarea" placeholder="过敏史" rows={2} value={form.allergySummary} onChange={event => updateForm('allergySummary', event.target.value)} />
                          <textarea className="textarea" placeholder="风险备注" rows={3} value={form.riskNotes} onChange={event => updateForm('riskNotes', event.target.value)} />
                          <input className="input" placeholder="服务项，使用逗号分隔" value={form.serviceItems} onChange={event => updateForm('serviceItems', event.target.value)} />
                          <textarea className="textarea" placeholder="服务备注" rows={2} value={form.serviceNotes} onChange={event => updateForm('serviceNotes', event.target.value)} />
                          {formError ? <div style={{ color: 'var(--color-danger)', fontSize: 12 }}>{formError}</div> : null}
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <button className="btn btn-primary btn-sm" onClick={handleCreateCase} disabled={submitting}>{submitting ? '提交中...' : '创建真实个案'}</button>
                              <button className="btn btn-secondary btn-sm" onClick={() => setForm(EMPTY_FORM)} disabled={submitting}>重置</button>
                          </div>
                      </div>
                  </DataCard>
              ) : null}

              <InteractionRailLayout
                  main={(
                      <>
                          <FilterBar>
                              <FilterItem label="搜索">
                                  <div className="filter-input-wrap">
                                      <Search size={14} />
                                      <input className="filter-input" placeholder="姓名 / 个案编号 / 房间号" value={search} onChange={event => setSearch(event.target.value)} />
                                  </div>
                              </FilterItem>
                              <FilterItem label="状态">
                                  <select className="select" value={statusFilter} onChange={event => setStatusFilter(event.target.value as 'all' | AssessmentStatus)}>
                                      <option value="all">全部状态</option>
                                      <option value="待人工确认">待人工确认</option>
                                      <option value="计划已生成">计划已生成</option>
                                      <option value="已入住">已入住</option>
                                  </select>
                              </FilterItem>
                          </FilterBar>

                          <DataCard
                              icon={<ClipboardCheck size={16} />}
                              title="真实个案列表"
                              subtitle={loading ? '正在从 assessment API 加载...' : `当前共 ${filteredCases.length} 条个案`}
                              badge={<Tag variant="primary">Live Data</Tag>}
                          >
                              {loadError ? <div style={{ fontSize: 12.5, color: 'var(--color-danger)' }}>{loadError}</div> : null}

                              {!loading && filteredCases.length === 0 ? (
                                  <div style={{ display: 'grid', gap: 12 }}>
                                      <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                                          当前没有可展示的真实 assessment case。可以从本页直接新建，或者从长者建档、资料导入入口进入。
                                      </div>
                                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>新建评定申请</button>
                                          <Link href={withSceneQuery('/elderly/new', scene)} className="btn btn-secondary btn-sm">前往长者建档</Link>
                                          <Link href={withSceneQuery('/elderly/import', scene)} className="btn btn-secondary btn-sm">前往资料导入</Link>
                                      </div>
                                  </div>
                              ) : null}

                              <div style={{ display: 'grid', gap: 12 }}>
                                  {filteredCases.map(item => {
                                      const isSelected = item.assessmentId === selectedCase?.assessmentId
                                      const effectiveLevel = item.confirmedCareLevel ?? item.aiRecommendation.recommendedLevel

                      return (
                        <button
                            key={item.assessmentId}
                            type="button"
                            onClick={() => setSelectedId(item.assessmentId)}
                            style={{
                            textAlign: 'left',
                            border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                            background: isSelected ? 'color-mix(in srgb, var(--color-primary) 8%, white)' : 'white',
                            borderRadius: 16,
                            padding: 14,
                                display: 'grid',
                                gap: 10,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{item.elderName}</div>
                                    <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{item.assessmentId} · {item.roomNumber}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <Tag variant={getStatusVariant(item.status)}>{item.status}</Tag>
                                    <Tag variant={getLevelVariant(effectiveLevel)}>{effectiveLevel}</Tag>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, color: 'var(--color-muted)' }}>
                                <span>{item.sourceLabel}</span>
                                <span>创建于 {formatDateTime(item.createdAtUtc)}</span>
                                <span>AI 置信度 {item.aiRecommendation.confidence}%</span>
                                <span>已等待 {formatElapsed(item.confirmedAtUtc ?? item.createdAtUtc)}</span>
                            </div>
                          </button>
                      )
                  })}
                              </div>
                          </DataCard>

                          <DataCard
                              icon={<Building2 size={16} />}
                              title="Pending Integration"
                              subtitle="以下模块不再从浏览器本地 store 读取，等待后端或聚合接口接入。"
                              badge={<Tag variant="warning">Pending Integration</Tag>}
                          >
                              <div style={{ display: 'grid', gap: 12 }}>
                                  {PENDING_INTEGRATION_ITEMS.map(item => (
                                      <div key={item.title} style={{ border: '1px solid var(--color-border)', borderRadius: 16, padding: 14, display: 'grid', gap: 6 }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                                              <Tag variant="warning">Pending Integration</Tag>
                                          </div>
                          <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{item.summary}</div>
                      </div>
                  ))}
                              </div>
                          </DataCard>
            </>
          )}
          rail={(
              selectedCase ? (
                  <>
                      <DataCard
                          icon={<Shield size={16} />}
                          title="个案概览"
                          subtitle={`${selectedCase.gender} · ${selectedCase.age}岁 · ${selectedCase.sourceLabel}`}
                          badge={<Tag variant={getStatusVariant(selectedCase.status)}>{selectedCase.status}</Tag>}
                      >
                          <div style={{ display: 'grid', gap: 10, fontSize: 12.5, color: 'var(--color-text)' }}>
                              <div>申请等级：<Tag variant={getLevelVariant(selectedCase.requestedCareLevel)}>{selectedCase.requestedCareLevel}</Tag></div>
                              <div>慢病与既往病史：{selectedCase.chronicConditions || '未填写'}</div>
                              <div>长期用药：{selectedCase.medicationSummary || '未填写'}</div>
                              <div>过敏史：{selectedCase.allergySummary || '未填写'}</div>
                              <div>风险备注：{selectedCase.riskNotes || '未填写'}</div>
                              <div>委托信息：{selectedCase.entrustmentType || '未填写'} / {selectedCase.entrustmentOrganization || '未填写'}</div>
                              <div>服务项：{selectedCase.serviceItems.length > 0 ? selectedCase.serviceItems.join('、') : '未填写'}</div>
                              <div>创建时间：{formatDateTime(selectedCase.createdAtUtc)}</div>
                          </div>
                      </DataCard>

                      <DataCard
                          icon={<Bot size={16} />}
                          title="AI 建议"
                          subtitle={`模板编码 ${selectedCase.aiRecommendation.planTemplateCode}`}
                          badge={<Tag variant="primary">{selectedCase.aiRecommendation.confidence}%</Tag>}
                      >
                          <div style={{ display: 'grid', gap: 10 }}>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                  <Tag variant={getLevelVariant(selectedCase.aiRecommendation.recommendedLevel)}>{selectedCase.aiRecommendation.recommendedLevel}</Tag>
                                  <Tag variant="info">评分 {selectedCase.aiRecommendation.assessmentScore}</Tag>
                                  {selectedCase.aiRecommendation.focusTags.map(tag => <Tag key={tag} variant="info">{tag}</Tag>)}
                              </div>
                              <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>{selectedCase.aiRecommendation.reasonSummary}</div>
                              <div style={{ display: 'grid', gap: 6, fontSize: 12.5, color: 'var(--color-muted)' }}>
                                  {selectedCase.aiRecommendation.reasons.map(reason => <div key={reason}>- {reason}</div>)}
                              </div>
                          </div>
                      </DataCard>

                      <DataCard
                          icon={<ClipboardCheck size={16} />}
                          title="人工认定"
                          subtitle="人工确认后状态会推进为计划已生成。"
                          badge={<Tag variant={selectedCase.confirmedCareLevel ? 'success' : 'warning'}>{selectedCase.confirmedCareLevel ? '已确认' : '待确认'}</Tag>}
                      >
                          <div style={{ display: 'grid', gap: 12 }}>
                              <select className="select" value={reviewLevel} onChange={event => setReviewLevel(event.target.value as CareLevel)} disabled={decisionBusy || selectedCase.status === '已入住'}>
                                  {CARE_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                              </select>
                              <textarea className="textarea" rows={4} placeholder="人工认定说明" value={reviewNote} onChange={event => setReviewNote(event.target.value)} disabled={decisionBusy || selectedCase.status === '已入住'} />
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                  <button className="btn btn-primary btn-sm" onClick={handleConfirmDecision} disabled={decisionBusy || selectedCase.status === '已入住'}>
                                      {decisionBusy ? '提交中...' : '确认人工认定'}
                                  </button>
                                  <button className="btn btn-secondary btn-sm" onClick={handleActivateCase} disabled={activateBusy || selectedCase.status !== '计划已生成'}>
                                      {activateBusy ? '生效中...' : '标记认定生效'}
                                  </button>
                              </div>
                              <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                                  当前人工结论：{selectedCase.confirmedCareLevel ?? '尚未确认'} · 认定人：{selectedCase.confirmedBy ?? '未填写'} · 时间：{formatDateTime(selectedCase.confirmedAtUtc)}
                              </div>
                              {formError ? <div style={{ color: 'var(--color-danger)', fontSize: 12 }}>{formError}</div> : null}
                          </div>
                      </DataCard>

                      <DataCard
                          icon={<CheckCircle2 size={16} />}
                          title="生效与回滚说明"
                          subtitle="当前交付只真实化 assessment case 主流程。"
                          badge={<Tag variant="info">Harness Gate</Tag>}
                      >
                          <div style={{ display: 'grid', gap: 8, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
                              <div>健康信号：列表、AI 建议和人工认定结果必须来自真实 assessment API。</div>
                              <div>加载态：进入页面时拉取 assessment case 列表；空态保留新建入口。</div>
                              <div>错误态：API 调用失败时展示明确错误；未接通模块统一展示 Pending Integration。</div>
                              <div>回滚方式：回退 assessment routes、BFF 编排和当前页面 live-only 实现。</div>
                          </div>
                      </DataCard>
                  </>
              ) : (
                  <DataCard
                      icon={<Shield size={16} />}
                      title="暂无可查看个案"
                      subtitle="当前没有选中的真实个案。"
                      badge={<Tag variant="info">Empty</Tag>}
                  >
                      <div style={{ display: 'grid', gap: 10 }}>
                              <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                                  可以先新建评定申请，或者从长者建档 / 资料导入入口进入。
                              </div>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                  <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>新建评定申请</button>
                                  <Link href={withSceneQuery('/elderly/new', scene)} className="btn btn-secondary btn-sm">长者建档</Link>
                              </div>
                          </div>
                      </DataCard>
                  )
          )}
        />
          </div>
    </ModuleEntitlementGate>
  )
}