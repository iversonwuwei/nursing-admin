'use client'

import { Bot, BriefcaseMedical, CalendarDays, Sparkles, Users } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { getCareScene, matchesEmploymentScene } from '@/lib/care-scenes'
import {
    EMPTY_WORKFLOW_BOARD,
    fetchAdminWorkflowBoard,
    type AdminWorkflowBoardSnapshot,
} from '@/lib/nursing-workflow/admin-workflow-board-api'

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const SHIFTS: Record<string, { bg: string; color: string; label: string }> = {
  白班: { bg: 'rgba(34,197,94,0.1)', color: 'var(--color-success)', label: '白班' },
  夜班: { bg: 'rgba(59,130,246,0.1)', color: 'var(--color-info)', label: '夜班' },
  休息: { bg: 'var(--color-bg)', color: 'var(--color-muted)', label: '休息' },
  早班: { bg: 'rgba(245,158,11,0.1)', color: 'var(--color-warning)', label: '早班' },
  中班: { bg: 'rgba(249,115,22,0.1)', color: 'var(--color-warning)', label: '中班' },
  晚班: { bg: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', label: '晚班' },
}

function formatAssessmentPlanLabel(value: string) {
  return value.replace(/套餐/g, '方案').replace(/包/g, '方案')
}

export default function SchedulePage() {
  const searchParams = useSearchParams()
  const scene = getCareScene(searchParams.get('scene'))
    const [workflowBoard, setWorkflowBoard] = useState<AdminWorkflowBoardSnapshot>(EMPTY_WORKFLOW_BOARD)
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')

  useEffect(() => {
      let disposed = false

      async function loadWorkflowBoard() {
          try {
              const snapshot = await fetchAdminWorkflowBoard()

              if (disposed) {
                  return
              }

              setWorkflowBoard(snapshot)
              setLoadError('')
          } catch (error) {
              if (disposed) {
                  return
              }

              setWorkflowBoard(EMPTY_WORKFLOW_BOARD)
              setLoadError(error instanceof Error ? error.message : '护理工作流看板不可用。')
          } finally {
              if (!disposed) {
                  setLoading(false)
              }
          }
      }

      void loadWorkflowBoard()

      return () => {
          disposed = true
      }
  }, [])

    const schedule = workflowBoard.schedule
  const visibleStaffRows = useMemo(
    () => schedule.staffRows.filter(item => matchesEmploymentScene(item.employmentSource, scene)),
    [scene, schedule.staffRows],
  )
  const visibleStaffNames = useMemo(
    () => new Set(visibleStaffRows.map(item => item.staffName)),
    [visibleStaffRows],
  )
  const visibleShiftDemand = useMemo(() => {
    const counters = new Map<string, number>()

    visibleStaffRows.forEach(item => {
      item.cells.forEach(cell => {
        cell.assignments.forEach(assignment => {
          counters.set(assignment.shift, (counters.get(assignment.shift) ?? 0) + 1)
        })
      })
    })

    return Object.entries(SHIFTS).map(([shift]) => ({ shift, count: counters.get(shift) ?? 0 }))
  }, [visibleStaffRows])
  const visibleAssignments = useMemo(
    () => visibleShiftDemand.reduce((sum, item) => sum + item.count, 0),
    [visibleShiftDemand],
  )
  const visiblePendingReviewPlans = useMemo(
    () => visibleStaffRows.reduce((sum, item) => sum + item.pendingReviewPlans, 0),
    [visibleStaffRows],
  )
  const visibleAttentionPlans = useMemo(
    () => schedule.attentionPlans.filter(item => visibleStaffNames.has(item.ownerName)),
    [schedule.attentionPlans, visibleStaffNames],
  )
  const sceneMeta = scene === 'home'
    ? {
          title: '居家派案排期',
          subtitle: `${schedule.weekLabel} · 聚焦第三方协同、上门窗口与路线分派`,
          overviewTitle: `${schedule.weekLabel} 居家派案总览`,
          overviewDescription: '排期页优先展示第三方协同人员、上门评定窗口和跨区域派案缺口，方便居家评定主管快速调度。',
      }
    : scene === 'institutional'
      ? {
              title: '机构派班排期',
              subtitle: `${schedule.weekLabel} · 聚焦自有团队、院内班次与执行覆盖`,
              overviewTitle: `${schedule.weekLabel} 机构派班总览`,
              overviewDescription: '排期页优先展示院内自有团队班次、执行覆盖和待复核模板，方便值班主管调整当班负荷。',
          }
      : {
              title: '派案排期',
              subtitle: `${schedule.weekLabel} · 直接查看后端返回的真实日期、班次与评定派案`,
              overviewTitle: `${schedule.weekLabel} 派案排期总览`,
              overviewDescription: '排期页把待复核模板、待分派案件和执行覆盖面放在同一屏里，方便排班主管直接基于真实派案做决策。',
          }
  const liveScheduleHighlights = useMemo(
    () => ([
      {
        id: 'live-assignment-coverage',
        title: '真实派案覆盖',
        summary: visibleAssignments > 0
          ? `本周已同步 ${visibleAssignments} 条真实班次分派，当前页不再额外叠加前端本地 AI 排班摘要。`
          : '当前真实派案为空，页面保持 live 空态并等待 Care Service 返回新分派。',
        metric: `${visibleAssignments} 条`,
        action: visibleAssignments > 0 ? '优先检查班次覆盖是否与待复核模板一致。' : '先回到模板页确认是否已生成并发布派案。',
        variant: visibleAssignments > 0 ? 'success' as const : 'info' as const,
      },
      {
        id: 'live-review-gap',
        title: '待复核模板',
        summary: visiblePendingReviewPlans > 0
          ? `当前仍有 ${visiblePendingReviewPlans} 条模板待复核，建议先清理模板缺口，再继续调整排期。`
          : '当前没有待复核模板，排班主管可以直接围绕真实派案做覆盖调整。',
        metric: `${visiblePendingReviewPlans} 条`,
        action: visiblePendingReviewPlans > 0 ? '返回模板页完成复核，避免派案与模板口径不一致。' : '继续检查重点计划和班次覆盖是否存在空档。',
        variant: visiblePendingReviewPlans > 0 ? 'warning' as const : 'success' as const,
      },
      {
        id: 'live-attention-plans',
        title: '重点计划关注',
        summary: visibleAttentionPlans.length > 0
          ? `当前场景有 ${visibleAttentionPlans.length} 条重点计划需要优先盯办，建议按责任人和班次逐条确认。`
          : '当前场景没有重点计划堆积，说明真实派案与模板关注项基本对齐。',
        metric: `${visibleAttentionPlans.length} 条`,
        action: visibleAttentionPlans.length > 0 ? '优先核对责任人、班次和抽检加派情况。' : '继续保持当前派案节奏，关注新增计划写入。',
        variant: visibleAttentionPlans.length > 0 ? 'danger' as const : 'info' as const,
      },
    ]),
    [visibleAssignments, visibleAttentionPlans.length, visiblePendingReviewPlans],
  )
  const overviewSignals = useMemo(
      () => ([
          { label: loading ? '派案板同步中' : '派案板已同步', tone: loading ? 'warning' as const : 'success' as const },
          { label: loadError || '当前无派案同步异常', tone: loadError ? 'danger' as const : 'neutral' as const },
          {
              label: visibleAssignments > 0 ? `当前已同步 ${visibleAssignments} 条真实分派` : '当前真实分派为空',
              tone: visibleAssignments > 0 ? 'success' as const : 'info' as const,
          },
          {
              label: visiblePendingReviewPlans > 0 ? `仍有 ${visiblePendingReviewPlans} 条模板待复核` : '当前无待复核模板',
              tone: visiblePendingReviewPlans > 0 ? 'warning' as const : 'neutral' as const,
          },
      ]),
      [loadError, loading, visibleAssignments, visiblePendingReviewPlans],
  )
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'staff-schedule',
    entityId: 'schedule-board',
    entityName: schedule.weekLabel,
    focus,
    target,
    scene: scene ?? undefined,
  })
  const helpHref = '/staff/help'

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title={sceneMeta.title}
              subtitle={loadError
                  ? `${sceneMeta.subtitle} · 当前仅保留 live 错误态，不再回退 demo workflow。`
                  : sceneMeta.subtitle}
        actions={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/nursing/plans" className="btn btn-secondary btn-sm">查看认定模板</Link>
                <button className="btn btn-primary btn-sm" disabled>真实派案已发布</button>
          </div>
        }
      />

      <InteractionRailLayout
        main={(
          <>
            <WorkflowOverviewCard
              eyebrow="Schedule Operations"
              title={sceneMeta.overviewTitle}
              description={sceneMeta.overviewDescription}
                          badge={<Tag variant={loadError ? 'danger' : 'success'}>{loadError ? 'Live Unavailable' : 'Live Workflow'}</Tag>}
              metrics={[
                { label: '排期评估员', value: visibleStaffRows.length, hint: '当前场景排期池人数', tone: 'primary' },
                { label: '已发布派案', value: visibleAssignments, hint: `累计 ${visibleAssignments} 条班次分派`, tone: 'success' },
                { label: '待复核模板', value: visiblePendingReviewPlans, hint: '需先回到模板页确认', tone: visiblePendingReviewPlans > 0 ? 'warning' : 'success' },
                { label: '重点计划', value: visibleAttentionPlans.length, hint: '当前场景需优先关注', tone: visibleAttentionPlans.length > 0 ? 'danger' : 'success' },
              ]}
              signals={overviewSignals}
              actions={
                <>
                  <Link href="/nursing/plans" className="btn btn-secondary btn-sm">查看认定模板</Link>
                  <Link href={buildAiHref('schedule-adjustment', 'rules')} className="btn btn-secondary btn-sm">查看 AI 运营中心</Link>
                </>
              }
            />

            <div className="kpi-grid" style={{ marginBottom: 16 }}>
              <StatCard icon={<Users size={18} />} label="排期评估员" value={visibleStaffRows.length} color="primary" />
              <StatCard icon={<CalendarDays size={18} />} label="已发布派案" value={visibleAssignments} color="success" />
              <StatCard icon={<Sparkles size={18} />} label="模板待复核" value={visiblePendingReviewPlans} sub="需先回到模板页确认" color="warning" />
              <StatCard icon={<BriefcaseMedical size={18} />} label="重点计划" value={visibleAttentionPlans.length} sub="当前场景需优先关注" color="danger" />
            </div>

                      {loading ? (
                          <DataCard title="正在同步派案看板" subtitle="Care service 与 Admin BFF 正在返回本周真实派案，请稍候。" badge={<Tag variant="warning">Loading</Tag>} />
            ) : null}

                      {loadError ? (
                          <DataCard title="派案同步异常" subtitle={loadError} badge={<Tag variant="danger">Live Unavailable</Tag>}>
                              <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
                                  当前页只展示真实 workflow board 结果。链路恢复前不会继续回退 demo 派案板或本地 AI 排班摘要。
                              </div>
                          </DataCard>
            ) : null}

            <DataCard title="班次矩阵" subtitle="主区保留真实排期矩阵，先支撑派案、补位和主管判断。" badge={<Tag variant="primary">Schedule Matrix</Tag>}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                {Object.entries(SHIFTS).map(([name, cfg]) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 4, background: cfg.bg, border: `1.5px solid ${cfg.color}` }} />
                    <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{cfg.label}</span>
                  </div>
                ))}
              </div>

                          {visibleStaffRows.length === 0 ? (
                              <div style={{ borderRadius: 12, background: 'var(--color-bg)', padding: 16, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                                  {loadError ? '当前无法显示真实排期矩阵。' : '当前场景没有可展示的真实派案矩阵。'}
                              </div>
                          ) : (
                                  <div style={{ overflowX: 'auto' }}>
                                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                          <thead>
                                              <tr>
                                                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-bg)', background: 'var(--color-bg)', position: 'sticky', left: 0, zIndex: 2, minWidth: 240 }}>
                                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                          <Users size={14} />员工
                                                      </div>
                                                  </th>
                                                  {DAYS.map(day => (
                                                      <th key={day} style={{ padding: '12px 8px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--color-text)', borderBottom: '1px solid var(--color-bg)', background: 'var(--color-bg)', minWidth: 150 }}>
                                                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                                              <CalendarDays size={13} style={{ color: 'var(--color-primary)' }} />{day}
                                                          </div>
                                                      </th>
                                                  ))}
                                              </tr>
                                          </thead>
                                          <tbody>
                                              {visibleStaffRows.map((item, rowIndex) => (
                                                  <tr key={item.staffId} style={{ background: rowIndex % 2 === 0 ? '#FFFFFF' : 'var(--color-bg)' }}>
                                                      <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-bg)', verticalAlign: 'top' }}>
                                                          <div style={{ display: 'grid', gap: 8 }}>
                                                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', flexShrink: 0 }}>
                                                                      {item.staffName.charAt(0)}
                                                                  </div>
                                                                  <div>
                                                                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{item.staffName}</div>
                                                                      <div style={{ marginTop: 3, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                                          <Tag variant="info">{item.staffRole}</Tag>
                                                                          <Tag variant={item.employmentSource === '第三方合作' ? 'warning' : 'primary'}>{item.employmentSource}</Tag>
                                                                      </div>
                                                                  </div>
                                                              </div>
                                                              <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--color-muted)' }}>
                                                                  已承接 {item.assignedPlans} 条评定任务{item.exceptionPlans > 0 ? ` · 抽检加派 ${item.exceptionPlans} 条` : ''}{item.pendingReviewPlans > 0 ? ` · 待复核 ${item.pendingReviewPlans} 条` : ''}
                                                                  {item.partnerAgencyName ? ` · ${item.partnerAgencyName}` : ''}
                                                              </div>
                                                          </div>
                                                      </td>
                                                      {DAYS.map(day => {
                                                          const cell = item.cells.find(entry => entry.dayLabel === day)
                                                          return (
                                                              <td key={`${item.staffId}-${day}`} style={{ padding: '8px', borderBottom: '1px solid var(--color-bg)', verticalAlign: 'top' }}>
                                                                  {cell && cell.assignments.length > 0 ? (
                                                                      <div style={{ display: 'grid', gap: 6 }}>
                                                                          {cell.assignments.map(assignment => {
                                                                              const cfg = SHIFTS[assignment.shift] ?? SHIFTS.休息
                                                                              return (
                                                                                  <div key={assignment.assignmentId} style={{ borderRadius: 10, border: '1px solid var(--color-border)', padding: 8, background: '#fff' }}>
                                                                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                                                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                                                                                          <Tag variant={assignment.status === '异常插单' ? 'danger' : assignment.status === '执行中' ? 'success' : 'neutral'}>{assignment.status}</Tag>
                                                                                      </div>
                                                                                      <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>{assignment.elderlyName}</div>
                                                                                      <div style={{ marginTop: 2, fontSize: 11.5, color: 'var(--color-muted)', lineHeight: 1.5 }}>{formatAssessmentPlanLabel(assignment.packageName)} · {assignment.room}</div>
                                                                                  </div>
                                                                              )
                                                                          })}
                                                                      </div>
                                                                  ) : (
                                                                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: SHIFTS.休息.bg, color: SHIFTS.休息.color }}>
                                                                          休息
                                                                      </div>
                                                                  )}
                                                              </td>
                                                          )
                                                      })}
                                                  </tr>
                                              ))}
                                          </tbody>
                                      </table>
                                  </div>
                          )}
            </DataCard>

            <DataCard title="每日班次汇总" subtitle="主区保留日汇总，先服务主管快速看覆盖缺口。" badge={<Tag variant="info">Day Summary</Tag>}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                {schedule.daySummaries.map(day => (
                  <div key={day.dayLabel} className="data-card" style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>{day.dayLabel}</div>
                    {day.shifts.length > 0 ? day.shifts.map(item => {
                      const cfg = SHIFTS[item.shift] ?? SHIFTS.休息
                      return (
                        <div key={`${day.dayLabel}-${item.shift}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }}>
                          <span style={{ fontSize: 11, color: cfg.color, fontWeight: 600 }}>{item.shift}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)' }}>{item.count}条</span>
                        </div>
                      )
                    }) : (
                      <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>暂无分派</div>
                    )}
                  </div>
                ))}
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard
              icon={<Bot size={16} />}
                    title="真实派案摘要"
                    subtitle="live 模式下只展示真实派案与模板缺口摘要，不再直接渲染前端本地 AI 排班建议。"
                    badge={<Tag variant={loadError ? 'warning' : 'success'}>{loadError ? 'Live Status' : 'Live Read Model'}</Tag>}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                        {liveScheduleHighlights.map(item => (
                  <div key={item.id} style={{ borderRadius: 12, border: '1px solid var(--color-border)', padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                        <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.summary}</div>
                      </div>
                      <Tag variant={item.variant}>{item.metric}</Tag>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.6, color: 'var(--color-text)' }}>{item.action}</div>
                  </div>
                ))}
                <div>
                            <Link href={buildAiHref('schedule-density', 'inference')} className="btn btn-secondary btn-sm">查看 AI 运营中心</Link>
                </div>
              </div>
            </DataCard>

            <DataCard
              icon={<Sparkles size={16} />}
              title="认定联动总览"
                    subtitle="模板、任务和派案已统一进同一条后端链路，优先暴露待复核和待分派缺口。"
            >
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
                  {visibleShiftDemand.map(item => (
                    <div key={item.shift} style={{ borderRadius: 12, background: 'var(--color-bg)', padding: 12 }}>
                      <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{item.shift}</div>
                      <div style={{ marginTop: 4, fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>{item.count} 条分派</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {visibleAttentionPlans.length > 0 ? visibleAttentionPlans.slice(0, 4).map(plan => (
                    <div key={plan.id} style={{ borderRadius: 12, border: '1px solid var(--color-border)', padding: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{plan.elderlyName} · {formatAssessmentPlanLabel(plan.packageName)}</div>
                        <Tag variant={plan.status === '待复核' ? 'warning' : 'danger'}>{plan.status}</Tag>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.6 }}>责任角色 {plan.ownerRole} · 当前责任人 {plan.ownerName} · 执行班次 {plan.shift}</div>
                    </div>
                  )) : (
                    <div style={{ borderRadius: 12, background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                      当前场景没有待复核或待分派的认定模板，派案与任务负荷处于一致状态。
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Link href="/nursing/plans" className="btn btn-secondary btn-sm">查看认定模板</Link>
                  <Link href={buildAiHref('schedule-adjustment', 'rules')} className="btn btn-secondary btn-sm">查看 AI 运营中心</Link>
                </div>
              </div>
            </DataCard>

                <DataCard
                    icon={<CalendarDays size={16} />}
                    title="Live 模式说明"
                    subtitle="当前页在 live 模式下优先展示真实派案和模板缺口，不再直接渲染前端本地 AI 调整建议。"
                    badge={<Tag variant="info">Deterministic Read Model</Tag>}
                >
                    <div className="page-help-card-item">
                        当前页已经切到真实派案只读模型：班次矩阵、重点计划、待复核模板和覆盖摘要都直接来自护理工作流快照。若需要 AI 解释，请进入 AI 运营中心查看独立推理或规则页，而不是在排班页继续混用前端本地 AI 摘要。
                    </div>
                </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整人力协同边界迁移到显式帮助页"
              summary="员工排班页现在只保留排期总览、班次矩阵和每日汇总，完整协同口径与 AI 说明统一后置。"
              items={[
                '先看排期总览和模板缺口，再决定是否调整班次。',
                '班次矩阵用于核对真实派案覆盖，不替代主管排班确认。',
                '若需要完整人力协同边界与路径说明，进入帮助页查看。',
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