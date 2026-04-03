"use client"

import { DataCard, EmptyState, FilterBar, FilterItem, PageHeader, StatCard, Tag, WorkflowOverviewCard, type TagVariant } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { getActivityStats, getOperationsSnapshot, publishActivityDraft, subscribeOperationsWorkflow } from '@/lib/mock/operations-workflow'
import { sortActivitiesByPriority } from '@/lib/operations-priority'
import { CalendarHeart, ChevronRight, Clock, Plus, Search, Users } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState, useSyncExternalStore } from 'react'

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
  const activities = useSyncExternalStore(
    subscribeOperationsWorkflow,
    () => getOperationsSnapshot().activities,
    () => getOperationsSnapshot().activities,
  )
  const [search, setSearch] = useState('')
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
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'activities-list',
    entityId: 'activity-board',
    entityName: '活动管理',
    focus,
    target,
  })

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

      <WorkflowOverviewCard
        eyebrow="Activity Operations"
        title="活动运营总览"
        description="先处理待发布活动，再跟踪今日进行中与报名饱和的活动，避免运营只看活动数量而错过发布和承载风险。"
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
              <button className="btn btn-primary btn-sm" onClick={() => publishActivityDraft(selectedActivity.id)}>
                发布活动
              </button>
            ) : (
              <Link href={`/activities/${selectedActivity.id}`} className="btn btn-secondary btn-sm">查看详情</Link>
            )}
          </div>
        </DataCard>
      ) : null}

      <div className="dashboard-grid-2" style={{ marginBottom: 16 }}>
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

        <DataCard
          icon={<ChevronRight size={16} />}
          title="推荐处理路径"
          subtitle="把活动从排期、发布、执行收束成一条运营路径。"
        >
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              '先发布待发布活动，避免活动计划停留在草稿态。',
              '再检查今日进行中活动，跟进签到、场地和老师执行情况。',
              '最后回看高装载活动，提前处理容量和家属通知压力。',
            ].map(item => (
              <div key={item} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>{item}</div>
            ))}
          </div>
        </DataCard>
      </div>

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

      {filtered.length === 0 ? (
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
    </div>
  )
}
