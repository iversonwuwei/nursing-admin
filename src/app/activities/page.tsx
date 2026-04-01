"use client"

import { DataCard, EmptyState, FilterBar, FilterItem, PageHeader, StatCard, Tag, type TagVariant } from '@/components/nh'
import { getActivityStats, getOperationsSnapshot, publishActivityDraft, subscribeOperationsWorkflow } from '@/lib/mock/operations-workflow'
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
          {filtered.map(act => (
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
