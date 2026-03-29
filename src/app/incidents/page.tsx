'use client'

import { EmptyState, FilterBar, FilterItem, PageHeader, Pagination, StatCard, Tag, type TagVariant } from '@/components/nh'
import { AlertTriangle, ChevronRight, Plus, Search, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const INCIDENTS = [
  { id: 'I001', title: '老人摔倒', level: '严重', elder: '张桂英', room: '201-1', time: '2026-03-28 16:30', status: '处理中', desc: '如厕时不慎摔倒，右臂擦伤，已送医处理' },
  { id: 'I002', title: '设备故障', level: '一般', elder: null, room: '三楼走廊', time: '2026-03-27 09:15', status: '已结案', desc: '三楼走廊照明灯故障，后勤当日修复' },
  { id: 'I003', title: '老人走失', level: '严重', elder: '王建国', room: '203-2', time: '2026-03-26 14:00', status: '已结案', desc: '私自外出，30分钟后在附近公园找到' },
  { id: 'I004', title: '食物过敏', level: '轻微', elder: '李秀兰', room: '205-1', time: '2026-03-25 12:00', status: '已结案', desc: '午餐后出现皮疹，医务室处理后好转' },
]

const LEVEL_TAG: Record<string, TagVariant> = { '严重': 'danger', '一般': 'warning', '轻微': 'info' }
const STATUS_TAG: Record<string, TagVariant> = { '处理中': 'warning', '已结案': 'success' }

export default function IncidentsPage() {
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const filtered = INCIDENTS.filter(i => {
    if (search && !i.title.includes(search) && !i.id.includes(search)) return false
    if (levelFilter && i.level !== levelFilter) return false
    return true
  })
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="animate-fade-up">

      <PageHeader
        title="事故报告"
        subtitle={`共 ${INCIDENTS.length} 条记录 · ${INCIDENTS.filter(i => i.status === '处理中').length} 条处理中`}
        actions={
          <button className="btn btn-primary btn-sm">
            <Plus size={13} />新增报告
          </button>
        }
      />

      <div className="kpi-grid">
        <StatCard icon={<ShieldAlert size={18} />} label="事故总数" value={INCIDENTS.length} color="primary" />
        <StatCard icon={<AlertTriangle size={18} />} label="严重事故" value={INCIDENTS.filter(i => i.level === '严重').length} color="danger" />
        <StatCard icon={<ShieldAlert size={18} />} label="处理中" value={INCIDENTS.filter(i => i.status === '处理中').length} sub="需立即处理" color="warning" />
        <StatCard icon={<ShieldAlert size={18} />} label="本月结案" value={INCIDENTS.filter(i => i.status === '已结案').length} color="success" />
      </div>

      <FilterBar>
        <FilterItem label="">
          <div className="input-wrap" style={{ minWidth: 180 }}>
            <span className="input-icon"><Search size={14} /></span>
            <input
              className="input"
              placeholder="搜索事故标题..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              style={{ paddingLeft: 34 }}
            />
          </div>
        </FilterItem>
        <FilterItem label="">
          <select
            className="select"
            value={levelFilter}
            onChange={e => { setLevelFilter(e.target.value); setPage(1) }}
            style={{ minWidth: 120 }}
          >
            <option value="">全部级别</option>
            <option value="严重">严重</option>
            <option value="一般">一般</option>
            <option value="轻微">轻微</option>
          </select>
        </FilterItem>
      </FilterBar>

      {paged.length === 0 ? (
        <EmptyState variant="search" title="暂无数据" description="调整筛选条件试试" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {paged.map(inc => (
            <Link key={inc.id} href={`/incidents/${inc.id}`} style={{ textDecoration: 'none' }}>
              <div className="list-item-card">
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: LEVEL_TAG[inc.level] === 'danger'
                    ? 'rgba(239,68,68,0.1)' : LEVEL_TAG[inc.level] === 'warning'
                    ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)',
                  color: LEVEL_TAG[inc.level] === 'danger'
                    ? 'var(--color-danger)' : LEVEL_TAG[inc.level] === 'warning'
                    ? 'var(--color-warning)' : 'var(--color-info)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ShieldAlert size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{inc.title}</span>
                    <Tag variant={LEVEL_TAG[inc.level]}>{inc.level}</Tag>
                    <Tag variant={STATUS_TAG[inc.status]}>{inc.status}</Tag>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {inc.elder && <span className="text-xs" style={{ color: 'var(--color-muted)' }}>👤 {inc.elder}</span>}
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>📍 {inc.room}</span>
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>🕐 {inc.time}</span>
                  </div>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
              </div>
            </Link>
          ))}
        </div>
      )}
      <Pagination current={page} total={filtered.length} pageSize={pageSize} onChange={setPage} />

    </div>
  )
}
