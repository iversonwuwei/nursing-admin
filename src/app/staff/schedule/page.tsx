'use client'

import { DataCard, PageHeader, StatCard, Tag } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { getScheduleAiInsights, getScheduleAiNarratives } from '@/lib/mock/admin-ai'
import { getNursingServiceSnapshot, isNursingWorkflowDemoMode, refreshNursingServiceWorkflow, resetNursingServiceWorkflowDemo, subscribeNursingServiceWorkflow } from '@/lib/mock/nursing-service-workflow'
import { Bot, BriefcaseMedical, CalendarDays, Sparkles, Users } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'

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
  const demoMode = isNursingWorkflowDemoMode()
  const [resetBusy, setResetBusy] = useState(false)
  const serviceSnapshot = useSyncExternalStore(
    subscribeNursingServiceWorkflow,
    getNursingServiceSnapshot,
    getNursingServiceSnapshot,
  )

  useEffect(() => {
    void refreshNursingServiceWorkflow().catch(() => {})
  }, [])

  const schedule = serviceSnapshot.schedule
  const aiInputs = useMemo(
    () => schedule.staffRows.map(item => ({
      name: item.staffName,
      shifts: DAYS.map(day => {
        const cell = item.cells.find(entry => entry.dayLabel === day)
        if (!cell || cell.assignments.length === 0) {
          return '休息'
        }

        return Array.from(new Set(cell.assignments.map(entry => entry.shift))).join('/')
      }),
    })),
    [schedule.staffRows],
  )
  const aiInsights = getScheduleAiInsights(aiInputs)
  const aiNarratives = getScheduleAiNarratives(aiInputs)
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'staff-schedule',
    entityId: 'schedule-board',
    entityName: schedule.weekLabel,
    focus,
    target,
  })

  async function handleResetDemo() {
    setResetBusy(true)
    try {
      await resetNursingServiceWorkflowDemo()
    } finally {
      setResetBusy(false)
    }
  }

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title="派案排期"
        subtitle={demoMode ? `${schedule.weekLabel} · 直接查看前端 demo 评定派案、班次与复评分派` : `${schedule.weekLabel} · 直接查看后端返回的真实日期、班次与评定派案`}
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {demoMode ? <button className="btn btn-ghost btn-sm" disabled={resetBusy} onClick={() => void handleResetDemo()}>{resetBusy ? '重置中...' : '重置 Demo 数据'}</button> : null}
            <Link href="/nursing/plans" className="btn btn-secondary btn-sm">查看认定模板</Link>
            <button className="btn btn-primary btn-sm" disabled>{demoMode ? 'Demo 派案已发布' : '真实派案已发布'}</button>
          </div>
        }
      />

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard icon={<Users size={18} />} label="排期评估员" value={schedule.staffRows.length} color="primary" />
        <StatCard icon={<CalendarDays size={18} />} label="已发布派案" value={schedule.publishedAssignments} color="success" />
        <StatCard icon={<Sparkles size={18} />} label="模板待复核" value={schedule.pendingReviewPlans} sub="需先回到模板页确认" color="warning" />
        <StatCard icon={<BriefcaseMedical size={18} />} label="待分派案件" value={schedule.unassignedPlans} sub="当前未落到具体评估员" color="danger" />
      </div>

      {serviceSnapshot.loading ? (
        <DataCard title="正在同步派案看板" subtitle={demoMode ? '前端 demo 派案板正在刷新本地演示分派，请稍候。' : 'Care service 与 Admin BFF 正在返回本周真实派案，请稍候。'} badge={<Tag variant="warning">Loading</Tag>} />
      ) : null}

      {serviceSnapshot.error ? (
        <DataCard title="派案同步异常" subtitle={serviceSnapshot.error} badge={<Tag variant="danger">Workflow Error</Tag>} />
      ) : null}

      <div className="dashboard-grid-2" style={{ marginBottom: 16 }}>
        <DataCard
          icon={<Bot size={16} />}
          title="AI 排班摘要"
          subtitle={demoMode ? '基于 demo 派案板识别班次密度、夜班覆盖和连续上班风险，不自动改排期。' : '基于真实派案板识别班次密度、夜班覆盖和连续上班风险，不自动改排期。'}
          badge={<Tag variant="warning">排班主管确认</Tag>}
        >
          <div style={{ display: 'grid', gap: 10 }}>
            {aiInsights.map(item => (
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
              <Link href={buildAiHref('schedule-density', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
            </div>
          </div>
        </DataCard>

        <DataCard
          icon={<Sparkles size={16} />}
          title="认定联动总览"
          subtitle={demoMode ? '模板、任务和派案已统一进同一条前端 demo 链路，优先暴露待复核和待分派缺口。' : '模板、任务和派案已统一进同一条后端链路，优先暴露待复核和待分派缺口。'}
        >
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
              {schedule.shiftDemand.map(item => (
                <div key={item.shift} style={{ borderRadius: 12, background: 'var(--color-bg)', padding: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{item.shift}</div>
                  <div style={{ marginTop: 4, fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>{item.count} 条分派</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {schedule.attentionPlans.length > 0 ? schedule.attentionPlans.slice(0, 4).map(plan => (
                <div key={plan.id} style={{ borderRadius: 12, border: '1px solid var(--color-border)', padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{plan.elderlyName} · {formatAssessmentPlanLabel(plan.packageName)}</div>
                    <Tag variant={plan.status === '待复核' ? 'warning' : 'danger'}>{plan.status}</Tag>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.6 }}>责任角色 {plan.ownerRole} · 当前责任人 {plan.ownerName} · 执行班次 {plan.shift}</div>
                </div>
              )) : (
                <div style={{ borderRadius: 12, background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                  当前没有待复核或待分派的认定模板，派案与任务负荷处于一致状态。
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link href="/nursing/plans" className="btn btn-secondary btn-sm">查看认定模板</Link>
              <Link href={buildAiHref('schedule-adjustment', 'rules')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
            </div>
          </div>
        </DataCard>
      </div>

      <DataCard
        icon={<CalendarDays size={16} />}
        title="AI 调整建议"
          subtitle={demoMode ? '把 demo 派案板转成管理可读摘要，而不是只看格子。' : '把真实派案板转成管理可读摘要，而不是只看格子。'}
      >
        <div style={{ display: 'grid', gap: 10 }}>
          {aiNarratives.map(item => (
            <div key={item} style={{ borderRadius: 12, background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
              {item}
            </div>
          ))}
        </div>
      </DataCard>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 16, flexWrap: 'wrap' }}>
        {Object.entries(SHIFTS).map(([name, cfg]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 4, background: cfg.bg, border: `1.5px solid ${cfg.color}` }} />
            <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{cfg.label}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <DataCard>
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
                {schedule.staffRows.map((item, rowIndex) => (
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
        </DataCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginTop: 16 }}>
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
    </div>
  )
}