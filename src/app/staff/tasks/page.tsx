"use client"

import { DataCard, FilterBar, FilterItem, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard, type TagVariant } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { getCareScene, matchesAdmissionScene, matchesEmploymentScene } from '@/lib/care-scenes'
import { getAiTaskRecommendations } from '@/lib/mock/admin-ai'
import {
  completeStaffTask,
  getAdmissionApplicationsSnapshot,
  getAssessmentStatusLabel,
  getAssessmentStatusVariant,
  getLevelVariant,
  getStaffTaskItems,
  getTaskPriorityVariant,
  getTaskStatusVariant,
  saveTaskAuditNote,
  startStaffTask,
  subscribeAdmissionWorkflow,
} from '@/lib/mock/assessment-workflow'
import {
  completeServicePlanTask,
  getNursingServiceSnapshot,
  isNursingWorkflowDemoMode,
  refreshNursingServiceWorkflow,
  resetNursingServiceWorkflowDemo,
  saveServicePlanTaskAuditNote,
  startServicePlanTask,
  subscribeNursingServiceWorkflow,
} from '@/lib/mock/nursing-service-workflow'
import { BellRing, Bot, CheckCircle2, ClipboardList, PlayCircle, Search, ShieldAlert, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'

const PRIORITY_OPTIONS = ['全部', '高', '中', '常规'] as const
const TASK_STATUS_OPTIONS = ['全部', '待执行', '已生成', '执行中', '已完成', '持续跟踪'] as const
const SOURCE_STATUS_OPTIONS = [
  { value: '全部', label: '全部' },
  { value: '待人工确认', label: '待认定确认' },
  { value: '计划已生成', label: '认定结论已生成' },
  { value: '已入住', label: '认定已生效' },
] as const
const SCENE_OPTIONS = ['全部', '首次认定', '复评复核', '抽检回访'] as const

type UnifiedTaskItem = {
  id: string
  elderlyName: string
  room: string
  title: string
  owner: string
  reminder: string
  scheduledTime: string
  careLevel: string
  priority: '高' | '中' | '常规'
  status: '待执行' | '已生成' | '执行中' | '已完成' | '持续跟踪'
  sourceId: string
  sourceStatus: '待人工确认' | '计划已生成' | '已入住'
  handledBy?: string
  handledAt?: string
  handledAtIso?: string
  actionNote?: string
  exceptionReason?: string
  originLabel: '入住护理' | '服务计划'
  originStatusLabel?: string
  packageName?: string
  shift?: string
  ownerRole?: string
  employmentSource?: string | null
}

function getTaskScene(task: UnifiedTaskItem) {
  if (task.sourceStatus === '待人工确认') {
    return '首次认定' as const
  }

  if (task.sourceStatus === '计划已生成') {
    return '复评复核' as const
  }

  return '抽检回访' as const
}

function getTaskSourceLabel(task: UnifiedTaskItem) {
  return task.originLabel === '入住护理' ? '个案受理派生' : '模板派生任务'
}

function getTaskSourceHint(task: UnifiedTaskItem) {
  return task.originLabel === '入住护理' ? '来自个案评定链路' : '来自认定模板与派案链路'
}

function formatAssessmentPlanLabel(value?: string) {
  if (!value) {
    return ''
  }

  return value.replace(/套餐/g, '方案').replace(/包/g, '方案')
}

function getTaskDisplayTitle(task: UnifiedTaskItem) {
  if (task.originLabel === '入住护理') {
    if (task.sourceStatus === '待人工确认') {
      return `首评资料核验 · ${task.careLevel}`
    }

    if (task.sourceStatus === '计划已生成') {
      return `复评结论复核 · ${task.careLevel}`
    }

    return `抽检回访核验 · ${task.careLevel}`
  }

  const planLabel = formatAssessmentPlanLabel(task.packageName)
  if (task.originStatusLabel === '待复核') {
    return `认定模板复核 · ${planLabel}`
  }

  if (task.originStatusLabel === '异常插单') {
    return `抽检整改加派 · ${planLabel}`
  }

  return `现场评定执行 · ${planLabel}`
}

function getOriginStatusPresentation(task: UnifiedTaskItem): { label: string; variant: TagVariant } {
  if (task.originLabel === '入住护理') {
    return {
      label: getAssessmentStatusLabel(task.sourceStatus),
      variant: getAssessmentStatusVariant(task.sourceStatus),
    }
  }

  if (task.originStatusLabel === '异常插单') {
    return { label: '抽检整改加派', variant: 'danger' as const }
  }

  if (task.originStatusLabel === '执行中') {
    return { label: '现场评定中', variant: 'success' as const }
  }

  if (task.originStatusLabel === '已归档') {
    return { label: '认定任务已归档', variant: 'neutral' as const }
  }

  return { label: '模板待复核', variant: 'warning' as const }
}

function normalizeLevel(task: UnifiedTaskItem) {
  if (task.careLevel === '全护' || task.careLevel === '专项康复') {
    return '一级护理' as const
  }

  if (task.careLevel === '半自理') {
    return '二级护理' as const
  }

  if (task.careLevel === '自理') {
    return '三级护理' as const
  }

  return task.careLevel as Parameters<typeof getLevelVariant>[0]
}

export default function StaffTasksPage() {
  const searchParams = useSearchParams()
  const scene = getCareScene(searchParams.get('scene'))
  const demoMode = isNursingWorkflowDemoMode()
  const applications = useSyncExternalStore(
    subscribeAdmissionWorkflow,
    getAdmissionApplicationsSnapshot,
    getAdmissionApplicationsSnapshot,
  )
  const serviceSnapshot = useSyncExternalStore(
    subscribeNursingServiceWorkflow,
    getNursingServiceSnapshot,
    getNursingServiceSnapshot,
  )
  const applicationSourceMap = useMemo(
    () => Object.fromEntries(applications.map(item => [item.id, item.sourceType ?? 'manual-form'])),
    [applications],
  )
  const scheduleStaffMap = useMemo(
    () => new Map(serviceSnapshot.schedule.staffRows.map(item => [item.staffName, item])),
    [serviceSnapshot.schedule.staffRows],
  )
  const admissionTaskItems = useMemo<UnifiedTaskItem[]>(() => getStaffTaskItems(applications).map(task => ({
    ...task,
    originLabel: '入住护理',
    employmentSource: applicationSourceMap[task.sourceId] === 'document-import' ? '第三方合作' : '自有团队',
  })), [applicationSourceMap, applications])
  const servicePlanTaskItems = useMemo<UnifiedTaskItem[]>(() => serviceSnapshot.tasks.map(task => ({
    ...task,
    ownerRole: task.ownerRole,
    employmentSource: scheduleStaffMap.get(task.ownerName)?.employmentSource ?? (task.ownerRole.includes('第三方') ? '第三方合作' : '自有团队'),
  })), [scheduleStaffMap, serviceSnapshot.tasks])
  const taskItems = useMemo(
    () => [...admissionTaskItems, ...servicePlanTaskItems].sort((left, right) => left.scheduledTime.localeCompare(right.scheduledTime)),
    [admissionTaskItems, servicePlanTaskItems],
  )
  const sceneScopedTaskItems = useMemo(() => taskItems.filter(task => {
    if (task.originLabel === '入住护理') {
      return matchesAdmissionScene(applicationSourceMap[task.sourceId], scene)
    }

    return matchesEmploymentScene(task.employmentSource, scene)
  }), [applicationSourceMap, scene, taskItems])
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState<(typeof PRIORITY_OPTIONS)[number]>('全部')
  const [sourceStatus, setSourceStatus] = useState<(typeof SOURCE_STATUS_OPTIONS)[number]['value']>('全部')
  const [taskStatus, setTaskStatus] = useState<(typeof TASK_STATUS_OPTIONS)[number]>('全部')
  const [sceneFilter, setSceneFilter] = useState<(typeof SCENE_OPTIONS)[number]>('全部')
  const [taskNoteDrafts, setTaskNoteDrafts] = useState<Record<string, string>>({})
  const [taskSaveStates, setTaskSaveStates] = useState<Record<string, 'saved' | undefined>>({})
  const [serviceActionError, setServiceActionError] = useState('')
  const [serviceActionBusy, setServiceActionBusy] = useState('')

  useEffect(() => {
    void refreshNursingServiceWorkflow().catch(() => { })
  }, [])

  const filteredTasks = useMemo(() => sceneScopedTaskItems.filter(task => {
    const matchesSearch = !search
      || task.elderlyName.includes(search)
      || task.title.includes(search)
      || task.owner.includes(search)
      || task.room.includes(search)
      || (task.packageName?.includes(search) ?? false)

    const matchesPriority = priority === '全部' || task.priority === priority
    const matchesSourceStatus = sourceStatus === '全部' || task.sourceStatus === sourceStatus
    const matchesTaskStatus = taskStatus === '全部' || task.status === taskStatus
    const matchesScene = sceneFilter === '全部' || getTaskScene(task) === sceneFilter

    return matchesSearch && matchesPriority && matchesSourceStatus && matchesTaskStatus && matchesScene
  }), [priority, sceneFilter, sceneScopedTaskItems, search, sourceStatus, taskStatus])

  const sceneMeta = scene === 'home'
    ? {
      title: '上门评定回执任务',
      subtitle: '聚焦资料导入个案、第三方协同与上门回执补录',
      overviewTitle: '居家回执任务总览',
      overviewDescription: '任务中心优先收敛居家导入个案、第三方协同与上门回执备注，避免上门执行和评定复核断档。',
    }
    : scene === 'institutional'
      ? {
        title: '院内执行任务台',
        subtitle: '聚焦院内手工建档个案、自有团队执行与护理跟办',
        overviewTitle: '院内执行任务总览',
        overviewDescription: '任务中心优先收敛院内首评、复评和自有团队执行备注，减少当班执行跨页切换。',
      }
      : {
        title: '现场评定任务',
        subtitle: '统一承接首评、复评复核、抽检回访与整改跟进任务',
        overviewTitle: '现场评定任务总览',
        overviewDescription: '任务中心按首评、复评、抽检和整改四类执行场景组织优先级，既能看当前负荷，也能把模板复核缺口、个案状态和执行备注收敛到同一个入口。',
      }

  const stats = useMemo(() => ({
    total: sceneScopedTaskItems.length,
    highPriority: sceneScopedTaskItems.filter(task => task.priority === '高').length,
    inProgress: sceneScopedTaskItems.filter(task => task.status === '执行中').length,
    pendingPlanReviews: sceneScopedTaskItems.filter(task => task.originLabel === '服务计划' && task.originStatusLabel === '待复核').length,
    completed: sceneScopedTaskItems.filter(task => task.status === '已完成').length,
  }), [sceneScopedTaskItems])
  const aiRecommendations = useMemo(
    () => getAiTaskRecommendations(sceneScopedTaskItems as Parameters<typeof getAiTaskRecommendations>[0]),
    [sceneScopedTaskItems],
  )
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'staff-tasks',
    entityId: 'task-board',
    entityName: '员工任务',
    focus,
    target,
    scene: scene ?? undefined,
  })
  const helpHref = '/staff/help'

    function getTaskDraft(taskId: string, fallback?: string) {
      return taskNoteDrafts[taskId] ?? fallback ?? ''
    }

    function updateTaskDraft(taskId: string, value: string) {
      setTaskNoteDrafts(current => ({ ...current, [taskId]: value }))
    }

    function getTaskDraftStatus(taskId: string, persistedNote?: string) {
      const hasLocalDraft = Object.prototype.hasOwnProperty.call(taskNoteDrafts, taskId)
      const currentDraft = getTaskDraft(taskId, persistedNote)

      if (!hasLocalDraft && !persistedNote) {
        return '将使用默认说明'
      }

      if (currentDraft === (persistedNote ?? '')) {
        return '备注已保存'
      }

      return '备注待提交'
    }

    function markTaskSaved(taskId: string) {
      setTaskSaveStates(current => ({ ...current, [taskId]: 'saved' }))
      window.setTimeout(() => {
        setTaskSaveStates(current => ({ ...current, [taskId]: undefined }))
      }, 1400)
    }

    async function persistTaskNote(task: UnifiedTaskItem) {
      const draft = getTaskDraft(task.id, task.actionNote)
      if (task.originLabel === '服务计划') {
        await saveServicePlanTaskAuditNote(
          task.id,
          task.status === '执行中' ? '执行中' : task.status === '已完成' ? '已完成' : '待执行',
          draft,
          task.handledBy,
          task.handledAt,
          task.handledAtIso,
        )
        return
      }

      saveTaskAuditNote(
        task.id,
        task.status,
        draft,
        task.exceptionReason,
        task.handledBy,
        task.handledAt,
        task.handledAtIso,
      )
    }

    async function runServiceTaskAction(key: string, action: () => Promise<unknown>) {
      setServiceActionBusy(key)
      setServiceActionError('')
      try {
        await action()
      } catch (error) {
        setServiceActionError(error instanceof Error ? error.message : '护理任务同步失败。')
      } finally {
        setServiceActionBusy('')
      }
    }

    async function handleResetDemo() {
      setServiceActionBusy('workflow:reset')
      setServiceActionError('')
      try {
        await resetNursingServiceWorkflowDemo()
      } catch (error) {
        setServiceActionError(error instanceof Error ? error.message : '护理 workflow demo 重置失败。')
      } finally {
        setServiceActionBusy('')
      }
    }

    return (
      <div className="page-root animate-fade-up">
        <PageHeader
          title={sceneMeta.title}
          subtitle={`${sceneMeta.subtitle} · 当前 ${sceneScopedTaskItems.length} 条任务`}
          actions={demoMode ? <button className="btn btn-ghost btn-sm" disabled={serviceActionBusy.length > 0} onClick={() => void handleResetDemo()}>{serviceActionBusy === 'workflow:reset' ? '重置中...' : '重置 Demo 数据'}</button> : undefined}
        />

        <InteractionRailLayout
          main={(
            <>
              <WorkflowOverviewCard
                eyebrow="Task Operations"
                title={sceneMeta.overviewTitle}
                description={sceneMeta.overviewDescription}
                badge={<Tag variant="info">Unified Workflow</Tag>}
                metrics={[
                  { label: '当前任务池', value: stats.total, hint: `当前筛选后 ${filteredTasks.length} 条`, tone: 'primary' },
                  { label: '高优先级任务', value: stats.highPriority, hint: '复评升级与抽检整改优先', tone: stats.highPriority > 0 ? 'warning' : 'success' },
                  { label: '执行中任务', value: stats.inProgress, hint: `已完成 ${stats.completed} 条`, tone: 'info' },
                  { label: '模板待复核', value: stats.pendingPlanReviews, hint: '需先回模板页处理后再落任务', tone: stats.pendingPlanReviews > 0 ? 'danger' : 'success' },
                ]}
                signals={[
                  { label: serviceSnapshot.loading ? '任务与模板链路同步中' : '任务与模板链路已同步', tone: serviceSnapshot.loading ? 'warning' : 'success' },
                  { label: serviceActionError || serviceSnapshot.error || '当前无同步异常', tone: serviceActionError || serviceSnapshot.error ? 'danger' : 'neutral' },
                  ...(aiRecommendations[0] ? [{ label: `AI 首要建议：${aiRecommendations[0].title}`, tone: 'info' as const }] : []),
                ]}
                actions={
                  <>
                    <Link href="/nursing/plans" className="btn btn-secondary btn-sm">前往模板复核</Link>
                    <Link href={buildAiHref('task-priority', 'logs')} className="btn btn-secondary btn-sm">AI 优先级建议</Link>
                  </>
                }
              />

              <div className="kpi-grid" style={{ marginBottom: 16 }}>
                <StatCard icon={<ClipboardList size={18} />} label="任务总数" value={stats.total} sub="多来源执行台账" color="primary" />
                <StatCard icon={<ShieldAlert size={18} />} label="高优先级" value={stats.highPriority} sub="复评升级与抽检整改任务" color="warning" />
                <StatCard icon={<BellRing size={18} />} label="执行中" value={stats.inProgress} sub="已被评估员或复核人领取" color="info" />
                <StatCard icon={<Sparkles size={18} />} label="模板待复核" value={stats.pendingPlanReviews} sub="需先回到模板页处理" color="danger" />
              </div>

              <FilterBar>
                <FilterItem label="搜索">
                  <div className="input-wrap" style={{ minWidth: 240 }}>
                    <span className="input-icon"><Search size={14} /></span>
                    <input
                      className="input"
                      placeholder="搜索长者、任务、责任人、套餐或房间..."
                      value={search}
                      onChange={event => setSearch(event.target.value)}
                      style={{ paddingLeft: 34 }}
                    />
                  </div>
                </FilterItem>
                <FilterItem label="任务场景">
                  <div className="select-wrap" style={{ minWidth: 140 }}>
                    <select className="select" value={sceneFilter} onChange={event => setSceneFilter(event.target.value as (typeof SCENE_OPTIONS)[number])}>
                      {SCENE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <span className="select-arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg></span>
                  </div>
                </FilterItem>
                <FilterItem label="优先级">
                  <div className="select-wrap" style={{ minWidth: 140 }}>
                    <select className="select" value={priority} onChange={event => setPriority(event.target.value as (typeof PRIORITY_OPTIONS)[number])}>
                      {PRIORITY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <span className="select-arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg></span>
                  </div>
                </FilterItem>
                <FilterItem label="来源状态">
                  <div className="select-wrap" style={{ minWidth: 140 }}>
                    <select className="select" value={sourceStatus} onChange={event => setSourceStatus(event.target.value as (typeof SOURCE_STATUS_OPTIONS)[number]['value'])}>
                      {SOURCE_STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    <span className="select-arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg></span>
                  </div>
                </FilterItem>
                <FilterItem label="执行状态">
                  <div className="select-wrap" style={{ minWidth: 140 }}>
                    <select className="select" value={taskStatus} onChange={event => setTaskStatus(event.target.value as (typeof TASK_STATUS_OPTIONS)[number])}>
                      {TASK_STATUS_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <span className="select-arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg></span>
                  </div>
                </FilterItem>
              </FilterBar>

              <DataCard title="评定执行任务" subtitle={scene === 'home' ? '展示居家上门评定、第三方协同与回执补录任务。' : scene === 'institutional' ? '展示院内首评、复评和自有团队执行任务。' : '统一展示首评、复评复核、抽检回访和整改任务，保留执行备注和归档口径。'} badge={<Tag variant="primary">Task Board</Tag>}>
                {filteredTasks.length > 0 ? (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>时间</th>
                          <th>任务</th>
                          <th>长者</th>
                          <th>责任人</th>
                          <th>认定等级</th>
                          <th>优先级</th>
                          <th>执行状态</th>
                          <th>提醒策略</th>
                          <th>任务场景</th>
                          <th>流程状态</th>
                          <th style={{ textAlign: 'right' }}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTasks.map(task => {
                          const aiRecommendation = aiRecommendations.find(item => item.taskId === task.id)
                          const isServiceTask = task.originLabel === '服务计划'

                          return (
                            <tr key={task.id} className="table-hover-row">
                              <td><Tag variant="primary">{task.scheduledTime}</Tag></td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{getTaskDisplayTitle(task)}</span>
                                  <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>来源编号 {task.sourceId}</span>
                                  {task.packageName ? <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>关联方案 {formatAssessmentPlanLabel(task.packageName)}</span> : null}
                                  {task.shift ? <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>执行班次 {task.shift}</span> : null}
                                  {aiRecommendation ? (
                                    <span style={{ fontSize: 12, color: 'var(--color-primary)', lineHeight: 1.6 }}>AI 建议 {aiRecommendation.level} · {aiRecommendation.slaHint}</span>
                                  ) : null}
                                  {task.handledBy && task.handledAt ? (
                                    <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>最近回执 {task.handledBy} · {task.handledAt}</span>
                                  ) : null}
                                  {task.actionNote ? (
                                    <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>操作说明 {task.actionNote}</span>
                                  ) : null}
                                  {task.exceptionReason ? (
                                    <span style={{ fontSize: 12, color: 'var(--color-danger)' }}>异常原因 {task.exceptionReason}</span>
                                  ) : null}
                                  <textarea
                                    className="input"
                                    rows={2}
                                    style={{
                                      width: '100%',
                                      height: 'auto',
                                      padding: '8px 10px',
                                      resize: 'vertical',
                                      marginTop: 4,
                                      borderColor: taskSaveStates[task.id] === 'saved' ? 'var(--color-success)' : undefined,
                                      boxShadow: taskSaveStates[task.id] === 'saved' ? '0 0 0 3px rgba(34,197,94,0.12)' : undefined,
                                    }}
                                    placeholder="输入执行备注，例如观察结果、完成情况、异常补充..."
                                    value={getTaskDraft(task.id, task.actionNote)}
                                    onChange={event => updateTaskDraft(task.id, event.target.value)}
                                    onBlur={() => {
                                      void runServiceTaskAction(`task:${task.id}:note`, async () => {
                                        await persistTaskNote(task)
                                        markTaskSaved(task.id)
                                      })
                                    }}
                                  />
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                    <span style={{ fontSize: 11.5, color: getTaskDraftStatus(task.id, task.actionNote) === '备注待提交' ? 'var(--color-warning)' : 'var(--color-muted)' }}>
                                      {getTaskDraftStatus(task.id, task.actionNote)}
                                    </span>
                                    {taskSaveStates[task.id] === 'saved' ? (
                                      <span style={{ fontSize: 11.5, color: 'var(--color-success)', fontWeight: 600 }}>已自动保存</span>
                                    ) : null}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{task.elderlyName}</span>
                                  <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{task.room}</span>
                                </div>
                              </td>
                              <td><span style={{ fontSize: 13, color: 'var(--color-text)' }}>{task.owner}</span></td>
                              <td><Tag variant={getLevelVariant(normalizeLevel(task))}>{task.careLevel}</Tag></td>
                              <td><Tag variant={getTaskPriorityVariant(task.priority)}>{task.priority}</Tag></td>
                              <td><Tag variant={getTaskStatusVariant(task.status)}>{task.status}</Tag></td>
                              <td><span style={{ fontSize: 12.5, color: 'var(--color-muted)' }}>{task.reminder}</span></td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <Tag variant={getTaskScene(task) === '抽检回访' ? 'danger' : getTaskScene(task) === '复评复核' ? 'warning' : 'info'}>{getTaskScene(task)}</Tag>
                                  <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{getTaskSourceLabel(task)} · {getTaskSourceHint(task)}</span>
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <Tag variant={getOriginStatusPresentation(task).variant}>{getOriginStatusPresentation(task).label}</Tag>
                                  <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{task.sourceId}</span>
                                </div>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                {task.status === '已完成' ? (
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-success)', fontSize: 12.5, fontWeight: 600 }}>
                                    <CheckCircle2 size={14} />
                                    已完成
                                  </div>
                                ) : task.status === '执行中' ? (
                                  <button
                                    className="btn btn-primary btn-sm"
                                    disabled={serviceActionBusy.length > 0}
                                    onClick={() => {
                                      if (isServiceTask) {
                                        void runServiceTaskAction(`task:${task.id}:complete`, () => completeServicePlanTask(task.id, '责任评估员', getTaskDraft(task.id, task.actionNote) || '认定派生任务已执行完成并归档。'))
                                        return
                                      }

                                        completeStaffTask(task.id, '责任评估员', getTaskDraft(task.id, task.actionNote) || '个案评定任务已按要求完成。')
                                      }}
                                    >
                                      {serviceActionBusy === `task:${task.id}:complete` ? '归档中...' : '完成任务'}
                                    </button>
                                  ) : isServiceTask && task.originStatusLabel === '待复核' ? (
                                    <Link href="/nursing/plans" className="btn btn-secondary btn-sm">前往模板复核</Link>
                                  ) : (
                                    <button
                                      className="btn btn-secondary btn-sm"
                                      disabled={serviceActionBusy.length > 0}
                                      onClick={() => {
                                        if (isServiceTask) {
                                          void runServiceTaskAction(`task:${task.id}:start`, () => startServicePlanTask(task.id, '当班评估员', getTaskDraft(task.id, task.actionNote) || '已接收认定派生任务，准备开始现场执行。'))
                                          return
                                        }

                                      startStaffTask(task.id, '当班评估员', getTaskDraft(task.id, task.actionNote) || '已领取个案评定任务，准备开始执行。')
                                    }}
                                  >
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                      <PlayCircle size={14} />
                                      {serviceActionBusy === `task:${task.id}:start` ? '执行中...' : '开始执行'}
                                    </span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: 24,
                      textAlign: 'center',
                      color: 'var(--color-muted)',
                      fontSize: 13,
                      lineHeight: 1.7,
                    }}
                  >
                    当前筛选条件下暂无同步任务。请先在个案评定页确认认定结论，或在模板页完成复核后再返回查看。
                  </div>
                )}
              </DataCard>
            </>
          )}
          rail={(
            <>
              <DataCard
                title="联动说明"
                subtitle={scene === 'home' ? '任务台账优先消费居家导入个案与第三方协同执行链路。' : scene === 'institutional' ? '任务台账优先消费院内认定个案与自有团队执行链路。' : '任务台账不再只依赖个案受理，而是同时消费个案评定与认定模板两条 workflow。'}
                badge={<Tag variant="info">Workflow Sync</Tag>}
              >
                {serviceSnapshot.loading ? (
                  <div style={{ marginBottom: 12, fontSize: 12.5, color: 'var(--color-warning)' }}>{demoMode ? '正在同步前端 demo 护理任务看板，请稍候。' : '正在同步护理工作流任务看板，请稍候。'}</div>
                ) : null}
                {serviceSnapshot.error || serviceActionError ? (
                  <div style={{ marginBottom: 12, fontSize: 12.5, color: 'var(--color-danger)' }}>{serviceSnapshot.error || serviceActionError}</div>
                ) : null}
                <div style={{ display: 'grid', gap: 10 }}>
                  <div className="page-help-card-item">数据入口：个案评定页确认认定后生成首评任务；模板页复核通过后生成复评、抽检和整改派生任务。</div>
                  <div className="page-help-card-item">执行口径：模板派生任务完成后会反写归档状态，避免模板页与任务中心双向不一致。</div>
                  <div className="page-help-card-item">待处理提醒：当前还有 {stats.pendingPlanReviews} 条认定模板待复核，未复核前不会进入现场评定闭环。</div>
                  <div className="page-help-card-item">回滚方式：若需回退，可先移除模板派生来源，仅保留个案评定派生任务，不影响现有 assessment store。</div>
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-muted)' }}>当前已完成 {stats.completed} 条任务归档或闭环，执行备注会保留在各自来源 store 内。</div>
              </DataCard>

              <DataCard
                icon={<Bot size={16} />}
                title="AI 优先级建议"
                subtitle="当前只做建议排序，不自动改派责任人或直接改写任务状态。"
                badge={<Tag variant="warning">人工决定执行顺序</Tag>}
              >
                <div style={{ display: 'grid', gap: 12 }}>
                  {aiRecommendations.map(item => (
                    <div key={item.taskId} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--color-muted)' }}>{item.elderlyName}</div>
                        </div>
                        <Tag variant={item.level === '立即处理' ? 'danger' : item.level === '本班关注' ? 'warning' : 'info'}>{item.level}</Tag>
                      </div>
                      <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>{item.reason}</div>
                      <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.slaHint}</div>
                      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>置信度 {item.confidence}%</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12 }}>
                  <Link href={buildAiHref('task-priority', 'logs')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
                </div>
              </DataCard>

              <PageHelpCard
                title="页面帮助"
                subtitle="完整任务协同边界迁移到显式帮助页"
                summary="员工任务页现在只保留任务总览、筛选条件和执行表格，完整 workflow 联动说明与 AI 优先级解释统一后置。"
                items={[
                  '先看任务总览和模板待复核缺口，再决定执行顺序。',
                  '任务表格用于处理执行、备注和归档，不替代模板复核结论。',
                  '若需要完整员工协同边界与路径说明，进入帮助页查看。',
                ]}
                href={helpHref}
                actionLabel="查看员工管理帮助"
              />
            </>
          )}
        />
      </div>
    )
  }