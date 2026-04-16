'use client'

import { DataCard, EmptyState, FilterBar, FilterItem, PageHeader, StatCard, Tag, WorkflowOverviewCard } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { getCareScene, matchesEmploymentScene, withSceneQuery } from '@/lib/care-scenes'
import {
    getNursingServiceSnapshot,
    isNursingWorkflowDemoMode,
    refreshNursingServiceWorkflow,
    resetNursingServiceWorkflowDemo,
    reviewServiceClockInRecord,
    subscribeNursingServiceWorkflow,
    type ServiceClockInRecord,
} from '@/lib/mock/nursing-service-workflow'
import { AlertTriangle, CheckCircle2, ClipboardCheck, Search, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'

const STATUS_OPTIONS = ['全部', '待执行', '服务中', '异常待复核', '待主管确认', '已确认'] as const
const SHIFT_OPTIONS = ['全部', '早班', '中班', '晚班', '夜班', '白班'] as const

function getStatusVariant(status: ServiceClockInRecord['status']) {
  if (status === '已确认') return 'success' as const
  if (status === '待主管确认') return 'info' as const
  if (status === '异常待复核') return 'danger' as const
  if (status === '服务中') return 'warning' as const
  return 'neutral' as const
}

export function NursingCheckinManagementPage() {
  const searchParams = useSearchParams()
  const scene = getCareScene(searchParams.get('scene'))
  const demoMode = isNursingWorkflowDemoMode()
  const serviceSnapshot = useSyncExternalStore(
    subscribeNursingServiceWorkflow,
    getNursingServiceSnapshot,
    getNursingServiceSnapshot,
  )
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>('全部')
  const [shift, setShift] = useState<(typeof SHIFT_OPTIONS)[number]>('全部')
  const [busyAction, setBusyAction] = useState('')
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    void refreshNursingServiceWorkflow().catch(() => {})
  }, [])

  const records = serviceSnapshot.clockInRecords
  const staffEmploymentMap = useMemo(
    () => new Map(serviceSnapshot.schedule.staffRows.map(item => [item.staffName, item.employmentSource])),
    [serviceSnapshot.schedule.staffRows],
  )
  const sceneScopedRecords = useMemo(() => records.filter(record => {
    const employmentSource = staffEmploymentMap.get(record.ownerName) ?? (record.ownerRole.includes('第三方') ? '第三方合作' : '自有团队')
    return matchesEmploymentScene(employmentSource, scene)
  }), [records, scene, staffEmploymentMap])
  const sceneMeta = scene === 'home'
    ? {
      title: '居家服务回执台',
      subtitle: '聚焦第三方协同到场、回执补录与主管复核',
      overviewTitle: '居家服务留痕总览',
      overviewDescription: '把上门服务到场、异常说明和主管确认收敛到同一条居家回执链路，避免跨机构协同断档。',
    }
    : scene === 'institutional'
      ? {
        title: '机构服务打卡台',
        subtitle: '聚焦院内自有团队执行留痕与主管确认',
        overviewTitle: '机构服务打卡总览',
        overviewDescription: '把院内到场留痕、异常说明和主管确认收敛成一条可追踪的执行管理链路。',
      }
      : {
        title: '打卡管理台',
        subtitle: '统一查看服务到场、执行中、异常待复核与主管确认结果',
        overviewTitle: '服务打卡与主管确认总览',
        overviewDescription: '这不是单纯的任务状态镜像，而是把到场留痕、异常说明和主管确认收敛成一条可追踪的管理链路。',
      }
  const filteredRecords = useMemo(() => records.filter(record => {
    const matchesSearch = !search
      || record.elderlyName.includes(search)
      || record.ownerName.includes(search)
      || record.packageName.includes(search)
      || record.room.includes(search)
    const matchesStatus = status === '全部' || record.status === status
    const matchesShift = shift === '全部' || record.shift === shift
    return matchesSearch && matchesStatus && matchesShift
  }), [records, search, shift, status])
  const visibleFilteredRecords = useMemo(() => filteredRecords.filter(record => sceneScopedRecords.some(item => item.id === record.id)), [filteredRecords, sceneScopedRecords])

  const stats = useMemo(() => ({
    total: sceneScopedRecords.length,
    inProgress: sceneScopedRecords.filter(record => record.status === '服务中').length,
    exceptions: sceneScopedRecords.filter(record => record.status === '异常待复核').length,
    pendingReview: sceneScopedRecords.filter(record => record.status === '待主管确认').length,
    confirmed: sceneScopedRecords.filter(record => record.status === '已确认').length,
  }), [sceneScopedRecords])
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'nursing-checkin',
    entityId: scene ?? 'general',
    entityName: scene === 'home' ? '居家服务留痕' : scene === 'institutional' ? '机构服务打卡' : '服务打卡管理',
    focus,
    target,
    scene: scene ?? undefined,
  })

  async function handleResetDemo() {
    setBusyAction('workflow:reset')
    setActionError('')
    try {
      await resetNursingServiceWorkflowDemo()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '重置打卡 demo 失败。')
    } finally {
      setBusyAction('')
    }
  }

  async function handleReview(record: ServiceClockInRecord) {
    const key = `record:${record.id}:review`
    setBusyAction(key)
    setActionError('')
    try {
      await reviewServiceClockInRecord(record.id)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '主管确认失败。')
    } finally {
      setBusyAction('')
    }
  }

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title={sceneMeta.title}
        subtitle={`${sceneMeta.subtitle} · 当前 ${sceneScopedRecords.length} 条打卡记录`}
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {demoMode ? (
              <button className="btn btn-ghost btn-sm" disabled={busyAction.length > 0} onClick={() => void handleResetDemo()}>
                {busyAction === 'workflow:reset' ? '重置中...' : '重置 Demo 数据'}
              </button>
            ) : null}
            <Link href={withSceneQuery('/staff/tasks', scene)} className="btn btn-secondary btn-sm">返回现场评定任务</Link>
            <Link href={withSceneQuery('/staff/schedule', scene)} className="btn btn-secondary btn-sm">查看派案排期</Link>
            <Link href={buildAiHref(scene === 'home' ? 'home-checkin-audit' : 'institutional-checkin-audit', 'logs')} className="btn btn-secondary btn-sm">查看 AI 留痕</Link>
          </div>
        }
      />

      <WorkflowOverviewCard
        eyebrow="Clock-in Operations"
        title={sceneMeta.overviewTitle}
        description={sceneMeta.overviewDescription}
        badge={<Tag variant={demoMode ? 'info' : 'success'}>{demoMode ? 'Demo Workflow' : 'Live Workflow'}</Tag>}
        metrics={[
          { label: '打卡总数', value: stats.total, hint: `当前筛选后 ${visibleFilteredRecords.length} 条`, tone: 'primary' },
          { label: '服务中', value: stats.inProgress, hint: '已到场但尚未形成闭环', tone: stats.inProgress > 0 ? 'warning' : 'success' },
          { label: '异常待复核', value: stats.exceptions, hint: '需主管或值班管理介入', tone: stats.exceptions > 0 ? 'danger' : 'success' },
          { label: '待主管确认', value: stats.pendingReview, hint: `已确认 ${stats.confirmed} 条`, tone: stats.pendingReview > 0 ? 'info' : 'success' },
        ]}
        signals={[
          { label: serviceSnapshot.loading ? '打卡看板同步中' : '打卡看板已同步', tone: serviceSnapshot.loading ? 'warning' : 'success' },
          { label: actionError || serviceSnapshot.error || '当前无打卡同步异常', tone: actionError || serviceSnapshot.error ? 'danger' : 'neutral' },
        ]}
        actions={
          <>
            <Link href={withSceneQuery('/staff/tasks', scene)} className="btn btn-secondary btn-sm">查看任务执行</Link>
            <Link href={withSceneQuery('/staff/schedule', scene)} className="btn btn-secondary btn-sm">查看班次负荷</Link>
            <Link href={buildAiHref(scene === 'home' ? 'home-checkin-compliance' : 'institutional-checkin-compliance', 'rules')} className="btn btn-secondary btn-sm">查看 AI 治理</Link>
          </>
        }
      />

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard icon={<ClipboardCheck size={18} />} label="打卡总数" value={stats.total} sub="覆盖本班次服务任务" color="primary" />
        <StatCard icon={<AlertTriangle size={18} />} label="异常待复核" value={stats.exceptions} sub="需主管判断是否整改" color="danger" />
        <StatCard icon={<ShieldCheck size={18} />} label="待主管确认" value={stats.pendingReview} sub="服务已完成但未确认" color="info" />
        <StatCard icon={<CheckCircle2 size={18} />} label="已确认" value={stats.confirmed} sub="可进入当班回放与复盘" color="success" />
      </div>

      <FilterBar>
        <FilterItem label="搜索">
          <div className="input-icon">
            <Search size={14} />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="搜索长者 / 服务人 / 房间 / 套餐" />
          </div>
        </FilterItem>
        <FilterItem label="状态">
          <select value={status} onChange={event => setStatus(event.target.value as (typeof STATUS_OPTIONS)[number])}>
            {STATUS_OPTIONS.map(option => <option key={option}>{option}</option>)}
          </select>
        </FilterItem>
        <FilterItem label="班次">
          <select value={shift} onChange={event => setShift(event.target.value as (typeof SHIFT_OPTIONS)[number])}>
            {SHIFT_OPTIONS.map(option => <option key={option}>{option}</option>)}
          </select>
        </FilterItem>
      </FilterBar>

      <DataCard title="打卡记录列表" subtitle={scene === 'home' ? '优先处理第三方协同和上门服务回执中的异常待复核与待主管确认记录。' : scene === 'institutional' ? '优先处理院内自有团队执行中的异常待复核与待主管确认记录。' : '优先处理异常待复核与待主管确认记录，避免服务已完成但管理链路停留在中间态。'}>
        {visibleFilteredRecords.length === 0 ? (
          <EmptyState variant="search" title="暂无打卡记录" description="调整搜索词、状态或班次后再试。" />
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
              {visibleFilteredRecords.map(record => (
              <div key={record.id} style={{ border: '1px solid var(--color-border)', borderRadius: 16, padding: 16, display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>{record.elderlyName} · {record.packageName}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.7 }}>
                      {record.room} · {record.shift} · 责任人 {record.ownerName} / {record.ownerRole}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Tag variant={getStatusVariant(record.status)}>{record.status}</Tag>
                    <Tag variant="neutral">{record.method}</Tag>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                  <div style={{ borderRadius: 12, background: 'var(--color-bg)', padding: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>计划到场</div>
                    <div style={{ marginTop: 4, fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{record.scheduledTime}</div>
                  </div>
                  <div style={{ borderRadius: 12, background: 'var(--color-bg)', padding: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>实际打卡</div>
                    <div style={{ marginTop: 4, fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{record.checkedInAt ?? '待到场'}</div>
                  </div>
                  <div style={{ borderRadius: 12, background: 'var(--color-bg)', padding: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>闭环时间</div>
                    <div style={{ marginTop: 4, fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{record.completedAt ?? '待闭环'}</div>
                  </div>
                </div>

                {record.exceptionNote ? (
                  <div style={{ borderRadius: 12, background: 'rgba(239, 68, 68, 0.08)', padding: 12, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
                    <strong>异常说明:</strong> {record.exceptionNote}
                  </div>
                ) : null}

                {record.reviewNote ? (
                  <div style={{ borderRadius: 12, background: 'rgba(34, 197, 94, 0.08)', padding: 12, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
                    <strong>主管确认:</strong> {record.reviewNote}{record.reviewedBy ? ` · ${record.reviewedBy}` : ''}{record.reviewedAt ? ` · ${record.reviewedAt}` : ''}
                  </div>
                ) : null}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(record.status === '待主管确认' || record.status === '异常待复核') ? (
                    <button className="btn btn-primary btn-sm" disabled={busyAction.length > 0} onClick={() => void handleReview(record)}>
                      {busyAction === `record:${record.id}:review` ? '确认中...' : '主管确认'}
                    </button>
                  ) : null}
                  <Link href={withSceneQuery('/staff/tasks', scene)} className="btn btn-secondary btn-sm">回到任务台账</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </DataCard>
    </div>
  )
}