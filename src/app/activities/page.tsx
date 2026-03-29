'use client'

import { useState } from 'react'
import Link from 'next/link'
import { StatCard, Tag, PageHeader, FilterBar, FilterItem, EmptyState } from '@/components/nh'
import { Search, Plus, ChevronRight, CalendarHeart, Users, Clock } from 'lucide-react'

const ACTIVITIES = [
  { id: 'A001', name: '太极晨练', category: '运动健身', date: '2026-03-29', time: '07:00', duration: 60, participants: 28, capacity: 30, location: '院内花园', status: '进行中' },
  { id: 'A002', name: '手工编织课', category: '文娱活动', date: '2026-03-29', time: '09:00', duration: 90, participants: 15, capacity: 20, location: '三楼活动室', status: '报名中' },
  { id: 'A003', name: '健康讲座', category: '健康教育', date: '2026-03-29', time: '14:00', duration: 120, participants: 42, capacity: 50, location: '二楼会议室', status: '报名中' },
  { id: 'A004', name: '棋牌活动', category: '文娱活动', date: '2026-03-28', time: '15:00', duration: 120, participants: 18, capacity: 20, location: '一楼棋牌室', status: '已完成' },
  { id: 'A005', name: '生日会', category: '节日活动', date: '2026-03-30', time: '15:00', duration: 90, participants: 0, capacity: 60, location: '多功能厅', status: '报名中' },
]

const STATUS_TAG: Record<string, string> = {
  '进行中': 'success', '报名中': 'info', '已完成': 'neutral',
}

export default function ActivitiesPage() {
  const [search, setSearch] = useState('')
  const todayActs = ACTIVITIES.filter(a => a.date === '2026-03-29')
  const inProgress = todayActs.filter(a => a.status === '进行中').length
  const filtered = ACTIVITIES.filter(a => !search || a.name.includes(search))

  return (
    <div className="animate-fade-up">

      <PageHeader
        title="活动管理"
        subtitle={`今日 ${todayActs.length} 场 · 共 ${ACTIVITIES.length} 项计划`}
        actions={
          <button className="btn btn-primary btn-sm">
            <Plus size={14} />新建活动
          </button>
        }
      />

      {/* Stat Cards Row */}
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard
          icon={<CalendarHeart size={18} />}
          label="今日活动"
          value={todayActs.length}
          sub="正在开展"
          color="primary"
        />
        <StatCard
          icon={<Users size={18} />}
          label="参与人次"
          value={todayActs.reduce((s, a) => s + a.participants, 0)}
          sub="今日累计"
          color="success"
        />
        <StatCard
          icon={<Clock size={18} />}
          label="进行中"
          value={inProgress}
          sub="正在开展"
          color="warning"
        />
        <StatCard
          icon={<CalendarHeart size={18} />}
          label="本月场次"
          value={38}
          sub="已完成 32 场"
          trend={{ value: '+6', direction: 'up' }}
          color="purple"
        />
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
                    <Tag variant={STATUS_TAG[act.status] as any}>{act.status}</Tag>
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
