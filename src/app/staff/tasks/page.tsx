"use client"

import { DataCard, FilterBar, FilterItem, PageHeader, StatCard, Tag } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { getAiTaskRecommendations } from '@/lib/mock/admin-ai'
import {
  completeStaffTask,
  getAdmissionApplicationsSnapshot,
  getLevelVariant,
  getStaffTaskItems,
  getStatusVariant,
  getTaskPriorityVariant,
  getTaskStatusVariant,
  saveTaskAuditNote,
  startStaffTask,
  subscribeAdmissionWorkflow,
} from '@/lib/mock/admission-workflow'
import { BellRing, Bot, CheckCircle2, ClipboardList, ListChecks, PlayCircle, Search, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState, useSyncExternalStore } from 'react'

const PRIORITY_OPTIONS = ['全部', '高', '中', '常规'] as const
const SOURCE_STATUS_OPTIONS = ['全部', '计划已生成', '已入住'] as const
const TASK_STATUS_OPTIONS = ['全部', '待执行', '已生成', '执行中', '已完成', '持续跟踪'] as const

export default function StaffTasksPage() {
  const applications = useSyncExternalStore(
    subscribeAdmissionWorkflow,
    getAdmissionApplicationsSnapshot,
    getAdmissionApplicationsSnapshot,
  )
  const taskItems = useMemo(() => getStaffTaskItems(applications), [applications])
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState<(typeof PRIORITY_OPTIONS)[number]>('全部')
  const [sourceStatus, setSourceStatus] = useState<(typeof SOURCE_STATUS_OPTIONS)[number]>('全部')
  const [taskStatus, setTaskStatus] = useState<(typeof TASK_STATUS_OPTIONS)[number]>('全部')
  const [taskNoteDrafts, setTaskNoteDrafts] = useState<Record<string, string>>({})
  const [taskSaveStates, setTaskSaveStates] = useState<Record<string, 'saved' | undefined>>({})

  const filteredTasks = useMemo(() => taskItems.filter(task => {
    const matchesSearch = !search
      || task.elderlyName.includes(search)
      || task.title.includes(search)
      || task.owner.includes(search)
      || task.room.includes(search)

    const matchesPriority = priority === '全部' || task.priority === priority
    const matchesSourceStatus = sourceStatus === '全部' || task.sourceStatus === sourceStatus
    const matchesTaskStatus = taskStatus === '全部' || task.status === taskStatus

    return matchesSearch && matchesPriority && matchesSourceStatus && matchesTaskStatus
  }), [priority, search, sourceStatus, taskItems, taskStatus])

  const stats = useMemo(() => ({
    total: taskItems.length,
    highPriority: taskItems.filter(task => task.priority === '高').length,
    inProgress: taskItems.filter(task => task.status === '执行中').length,
    completed: taskItems.filter(task => task.status === '已完成').length,
  }), [taskItems])
  const aiRecommendations = useMemo(() => getAiTaskRecommendations(taskItems), [taskItems])
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'staff-tasks',
    entityId: 'task-board',
    entityName: '员工任务',
    focus,
    target,
  })

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

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title="员工任务"
        subtitle={`来自入住评估共享 store 的派生任务视图 · 当前 ${taskItems.length} 条任务，覆盖 ${applications.length} 条入住记录`}
      />

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard icon={<ClipboardList size={18} />} label="任务总数" value={stats.total} sub="护理计划自动派生" color="primary" />
        <StatCard icon={<ShieldAlert size={18} />} label="高优先级" value={stats.highPriority} sub="一级/特级护理任务" color="warning" />
        <StatCard icon={<BellRing size={18} />} label="执行中" value={stats.inProgress} sub="已被当班人员领取" color="info" />
        <StatCard icon={<ListChecks size={18} />} label="已完成" value={stats.completed} sub="当前班次闭环数" color="success" />
      </div>

      <DataCard
        title="同步说明"
        subtitle="任务数据不再写死在标准页配置中，而是由入住页确认后的护理计划实时推导。"
        badge={<Tag variant="info">Live Mock Sync</Tag>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div style={{ padding: 14, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>数据入口</div>
            <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>入住页人工确认护理等级后，自动生成 care plan 并同步到本页。</div>
          </div>
          <div style={{ padding: 14, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>可见范围</div>
            <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>当前仅展示 demo 任务，不接真实工单系统，不改动后端契约。</div>
          </div>
          <div style={{ padding: 14, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>回滚方式</div>
            <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>若需回退，可恢复本页对标准静态配置的依赖，不影响其余页面。</div>
          </div>
        </div>
      </DataCard>

      <DataCard
        icon={<Bot size={16} />}
        title="AI 优先级建议"
        subtitle="当前只做建议排序，不自动改派责任人或直接改写任务状态。"
        badge={<Tag variant="warning">人工决定执行顺序</Tag>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
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

      <FilterBar>
        <FilterItem label="搜索">
          <div className="input-wrap" style={{ minWidth: 240 }}>
            <span className="input-icon"><Search size={14} /></span>
            <input
              className="input"
              placeholder="搜索长者、任务、责任人或房间..."
              value={search}
              onChange={event => setSearch(event.target.value)}
              style={{ paddingLeft: 34 }}
            />
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
            <select className="select" value={sourceStatus} onChange={event => setSourceStatus(event.target.value as (typeof SOURCE_STATUS_OPTIONS)[number])}>
              {SOURCE_STATUS_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
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

      <DataCard title="护理执行任务" subtitle="展示入住计划生成后的首日任务，以及已入住后的持续跟踪项。">
        {filteredTasks.length > 0 ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>任务</th>
                  <th>长者</th>
                  <th>责任人</th>
                  <th>护理等级</th>
                  <th>优先级</th>
                  <th>执行状态</th>
                  <th>提醒策略</th>
                  <th>来源状态</th>
                  <th style={{ textAlign: 'right' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => {
                  const aiRecommendation = aiRecommendations.find(item => item.taskId === task.id)

                  return (
                    <tr key={task.id} className="table-hover-row">
                      <td><Tag variant="primary">{task.scheduledTime}</Tag></td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{task.title}</span>
                          <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>来源编号 {task.sourceId}</span>
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
                              saveTaskAuditNote(
                                task.id,
                                task.status,
                                getTaskDraft(task.id, task.actionNote),
                                task.exceptionReason,
                                task.handledBy,
                                task.handledAt,
                                task.handledAtIso,
                              )
                              markTaskSaved(task.id)
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
                      <td><Tag variant={getLevelVariant(task.careLevel)}>{task.careLevel}</Tag></td>
                      <td><Tag variant={getTaskPriorityVariant(task.priority)}>{task.priority}</Tag></td>
                      <td><Tag variant={getTaskStatusVariant(task.status)}>{task.status}</Tag></td>
                      <td><span style={{ fontSize: 12.5, color: 'var(--color-muted)' }}>{task.reminder}</span></td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <Tag variant={getStatusVariant(task.sourceStatus)}>{task.sourceStatus}</Tag>
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
                          <button className="btn btn-primary btn-sm" onClick={() => completeStaffTask(task.id, '责任护士', getTaskDraft(task.id, task.actionNote) || '护理任务已按计划完成。')}>
                            完成任务
                          </button>
                        ) : (
                          <button className="btn btn-secondary btn-sm" onClick={() => startStaffTask(task.id, '当班护理员', getTaskDraft(task.id, task.actionNote) || '已领取任务，准备开始执行。')}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <PlayCircle size={14} />
                              开始执行
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
            当前筛选条件下暂无同步任务。请先在入住页确认护理等级，生成护理计划后再返回查看。
          </div>
        )}
      </DataCard>
    </div>
  )
}