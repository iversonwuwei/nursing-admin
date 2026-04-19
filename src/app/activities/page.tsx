"use client"

import { DataCard, EmptyState, FilterBar, FilterItem, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard, type TagVariant } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { getActivityStats } from '@/lib/mock/operations-workflow'
import { sortActivitiesByPriority } from '@/lib/operations-priority'
import { fetchAdminActivities, publishAdminActivity, type AdminActivityRecord } from '@/lib/services/admin-operations-services'
import { CalendarHeart, ChevronRight, Clock, Plus, Search, Users } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

const STATUS_TAG: Record<string, TagVariant> = {
  '待发布': 'warning',
  '进行中': 'success',
  '报名中': 'info',
  '已完成': 'neutral',
}

export default function ActivitiesPage() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('selected')
  const fromNew = searchParams.get('entry') === 'activities-new'
  const [activities, setActivities] = useState<AdminActivityRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true

    fetchAdminActivities({ page: 1, pageSize: 200 })
      .then(response => {
        if (!active) {
          return
        }

        setActivities(response.items)
        setError('')
      })
      .catch((reason: unknown) => {
        if (!active) {
          return
        }

        setError(reason instanceof Error ? reason.message : '活动列表查询失败。')
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const stats = useMemo(() => getActivityStats(activities), [activities])
  const selectedActivity = useMemo(
    () => activities.find(item => item.id === preselectedId) ?? null,
    [activities, preselectedId],
  )
  const filtered = activities.filter(activity => {
    if (!search) {
      return true
    }

    return [activity.name, activity.id, activity.category, activity.location].some(field => field.includes(search))
  })
  const prioritizedActivities = useMemo(() => sortActivitiesByPriority(filtered).slice(0, 4), [filtered])
  const sortedActivities = useMemo(() => sortActivitiesByPriority(filtered), [filtered])
  const todayCapacity = activities.filter(item => item.date === '2026-03-29').reduce((sum, item) => sum + item.capacity, 0)
  const todayFillRate = todayCapacity > 0 ? Math.round((stats.todayParticipants / todayCapacity) * 100) : 0
  const upcomingActivity = sortedActivities[0] ?? null
  const helpHref = '/activities/help'
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'activities-list',
    entityId: 'activity-board',
    entityName: '活动管理',
    focus,
    target,
  })

  async function handlePublish(activityId: string) {
    setSubmittingId(activityId)
    try {
      const updated = await publishAdminActivity(activityId)
      setActivities(current => current.map(item => item.id === updated.id ? updated : item))
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '活动发布失败。')
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="活动管理"
        subtitle={`今日 ${stats.todayCount} 场 · 共 ${stats.total} 项计划`}
        actions={
          <Link href="/activities/new" className="btn btn-primary btn-sm">
            <Plus size={14} />新建活动
          </Link>
        }
      />

      <InteractionRailLayout
        main={(
          <>
            {error ? (
              <DataCard title="Live Unavailable" subtitle="活动实时链路当前不可用，页面不会回退本地草稿。" badge={<Tag variant="danger">Operations API</Tag>}>
                <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{error}</div>
              </DataCard>
            ) : null}

            <WorkflowOverviewCard
              eyebrow="Activity Operations"
              title="活动运营总览"
              description="主区只保留发布、执行和容量信号，先处理待发布活动，再跟踪今日执行与装载风险。"
              badge={<Tag variant="info">Event Board</Tag>}
              metrics={[
                { label: '今日活动', value: stats.todayCount, hint: `今日参与 ${stats.todayParticipants} 人次`, tone: 'primary' },
                { label: '进行中', value: stats.inProgress, hint: '需关注现场执行与签到', tone: stats.inProgress > 0 ? 'success' : 'neutral' },
                { label: '待发布', value: stats.pendingPublication, hint: '发布后才能进入报名与执行', tone: stats.pendingPublication > 0 ? 'warning' : 'success' },
                { label: '今日装载率', value: `${todayFillRate}%`, hint: `今日总容量 ${todayCapacity} 人`, tone: todayFillRate >= 80 ? 'warning' : 'info' },
              ]}
              signals={[
                { label: upcomingActivity ? `当前优先活动：${upcomingActivity.name}` : '当前没有活动待处理', tone: upcomingActivity?.lifecycleStatus === '待发布' ? 'warning' : 'info' },
                { label: selectedActivity && fromNew ? `新建活动已回流：${selectedActivity.name}` : '当前无新建活动回流阻塞', tone: selectedActivity && fromNew ? 'success' : 'neutral' },
                { label: '活动页当前按发布、执行、容量三类信号排序', tone: 'neutral' },
              ]}
              actions={
                <>
                  <Link href="/activities/new" className="btn btn-secondary btn-sm">新建活动</Link>
                  <Link href={buildAiHref('activity-operations', 'inference')} className="btn btn-secondary btn-sm">查看 AI 视角</Link>
                </>
              }
            />

            <div className="kpi-grid" style={{ marginBottom: 16 }}>
              <StatCard
                icon={<CalendarHeart size={18} />}
                label="今日活动"
                value={stats.todayCount}
                sub="正在开展"
                color="primary"
              />
              <StatCard
                icon={<Users size={18} />}
                label="参与人次"
                value={stats.todayParticipants}
                sub="今日累计"
                color="success"
              />
              <StatCard
                icon={<Clock size={18} />}
                label="进行中"
                value={stats.inProgress}
                sub="正在开展"
                color="warning"
              />
              <StatCard
                icon={<CalendarHeart size={18} />}
                label="待发布"
                value={stats.pendingPublication}
                sub="等待运营复核"
                color="info"
              />
            </div>

            {selectedActivity && fromNew ? (
              <DataCard
                title="来自新建活动页"
                subtitle={`${selectedActivity.name} 已进入待发布闭环。确认排期和场地后再开放报名。`}
                badge={<Tag variant={selectedActivity.lifecycleStatus === '待发布' ? 'warning' : 'success'}>{selectedActivity.lifecycleStatus}</Tag>}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                    当前计划安排在 {selectedActivity.date} {selectedActivity.time}，场地为 {selectedActivity.location}，负责人 {selectedActivity.teacher}。
                  </div>
                  {selectedActivity.lifecycleStatus === '待发布' ? (
                    <button className="btn btn-primary btn-sm" onClick={() => handlePublish(selectedActivity.id)} disabled={submittingId === selectedActivity.id}>
                      {submittingId === selectedActivity.id ? '发布中...' : '发布活动'}
                    </button>
                  ) : (
                    <Link href={`/activities/${selectedActivity.id}`} className="btn btn-secondary btn-sm">查看详情</Link>
                  )}
                </div>
              </DataCard>
            ) : null}

            <DataCard
              icon={<CalendarHeart size={16} />}
              title="活动优先队列"
              subtitle="按待发布、今日执行和装载压力统一排序，先展示最需要运营干预的活动。"
              badge={<Tag variant="warning">Priority Queue</Tag>}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                {prioritizedActivities.map(activity => {
                  const fillRate = activity.capacity > 0 ? Math.round((activity.participants / activity.capacity) * 100) : 0
                  const actionLabel = activity.lifecycleStatus === '待发布'
                    ? '先确认排期与场地，再正式发布'
                    : activity.date === '2026-03-29' && activity.status === '进行中'
                      ? '优先关注现场签到与执行反馈'
                      : fillRate >= 80
                        ? '接近容量上限，建议提前控场或扩容'
                        : '当前进入常规跟踪即可'

                  return (
                    <div key={activity.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{activity.name}</div>
                          <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{activity.date} {activity.time} · {activity.location} · {activity.participants}/{activity.capacity} 人</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <Tag variant={STATUS_TAG[activity.status]}>{activity.status}</Tag>
                          <Tag variant={activity.lifecycleStatus === '待发布' ? 'warning' : 'success'}>{activity.lifecycleStatus}</Tag>
                        </div>
                      </div>
                      <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>{actionLabel}</div>
                    </div>
                  )
                })}
              </div>
            </DataCard>

            <FilterBar>
              <FilterItem label="搜索">
                <div className="input-wrap" style={{ minWidth: 180 }}>
                  <span className="input-icon"><Search size={14} /></span>
                  <input
                    className="input"
                    placeholder="搜索活动名称..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ paddingLeft: 34, height: 36 }}
                  />
                </div>
              </FilterItem>
            </FilterBar>

            {loading ? (
              <DataCard title="活动加载中" subtitle="正在从 Operations Service 获取活动台账。">
                <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>首屏已切换到真实后端数据，不再读取前端 workflow 草稿。</div>
              </DataCard>
            ) : filtered.length === 0 ? (
              <EmptyState variant="search" title="暂无数据" description="尝试其他关键词搜索" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sortedActivities.map(act => (
                  <Link key={act.id} href={`/activities/${act.id}`} style={{ textDecoration: 'none' }}>
                    <div className="list-item-card">
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: 'rgba(13,148,136,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-primary)',
                      }}>
                        <CalendarHeart size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{act.name}</span>
                          <Tag variant={STATUS_TAG[act.status]}>{act.status}</Tag>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{act.date} {act.time}</span>
                          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>📍 {act.location}</span>
                          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{act.participants}/{act.capacity}人</span>
                        </div>
                      </div>
                      <ChevronRight size={14} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
        rail={(
          <>
            <DataCard
              icon={<Clock size={16} />}
              title="运营上下文"
              subtitle="首屏后置显示当前焦点、回流状态和容量压力。"
              badge={<Tag variant="info">Context</Tag>}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">当前优先：{upcomingActivity ? `${upcomingActivity.name} · ${upcomingActivity.lifecycleStatus}` : '暂无需要优先处理的活动。'}</div>
                <div className="page-help-card-item">新建回流：{selectedActivity && fromNew ? `${selectedActivity.name} 已进入发布闭环。` : '当前无新建活动回流阻塞。'}</div>
                <div className="page-help-card-item">容量信号：今日总容量 {todayCapacity} 人，装载率 {todayFillRate}%。</div>
              </div>
            </DataCard>

            {selectedActivity ? (
              <DataCard
                icon={<CalendarHeart size={16} />}
                title="当前选中活动"
                subtitle="对象事实后置展示，避免列表首屏混入长说明。"
                badge={<Tag variant={selectedActivity.lifecycleStatus === '待发布' ? 'warning' : 'success'}>{selectedActivity.lifecycleStatus}</Tag>}
              >
                <div style={{ display: 'grid', gap: 10 }}>
                  <div className="page-help-card-item">时间：{selectedActivity.date} {selectedActivity.time}</div>
                  <div className="page-help-card-item">场地：{selectedActivity.location} · 负责人：{selectedActivity.teacher}</div>
                  <div className="page-help-card-item">当前报名：{selectedActivity.participants}/{selectedActivity.capacity} 人，类别 {selectedActivity.category}。</div>
                </div>
              </DataCard>
            ) : null}

            <DataCard
              icon={<ChevronRight size={16} />}
              title="推荐处理路径"
              subtitle="完整说明后置到右轨，不再和活动列表争抢首屏。"
            >
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '先发布待发布活动，避免活动计划停留在草稿态。',
                  '再检查今日进行中活动，跟进签到、场地和老师执行情况。',
                  '最后回看高装载活动，提前处理容量和家属通知压力。',
                ].map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link href={buildAiHref('activity-operations', 'inference')} className="btn btn-secondary btn-sm">查看 AI 视角</Link>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整活动运营说明迁移到显式帮助页"
              summary="活动管理页现在只保留发布、执行、容量和对象列表，培训性说明与路径解释统一后置。"
              items={[
                '先看待发布与今日进行中活动，再决定是否进入详情页。',
                '容量、负责人和场地摘要只作为执行判断，不替代详情核对。',
                '若需要完整页面定位和操作顺序，进入帮助页查看。',
              ]}
              href={helpHref}
              actionLabel="查看活动帮助"
            />
          </>
        )}
      />
    </div>
  )
}
