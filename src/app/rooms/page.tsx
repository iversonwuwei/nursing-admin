'use client'

import { EmptyState, FilterBar, FilterItem, PageHeader, Pagination, StatCard, Tag, type TagVariant } from '@/components/nh'
import { organizations } from '@/lib/data'
import { ChevronRight, DoorOpen, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const ROOMS: Array<{
  id: string; name: string; floor: number; type: string
  capacity: number; occupied: number; status: string; org: string
}> = [
  { id: 'R001', name: '阳光单人间', floor: 2, type: '单人间', capacity: 1, occupied: 1, status: '已满', org: '静安分院' },
  { id: 'R002', name: '温馨双人间', floor: 2, type: '双人间', capacity: 2, occupied: 1, status: '可入住', org: '静安分院' },
  { id: 'R003', name: '豪华套房', floor: 3, type: '套间', capacity: 2, occupied: 0, status: '可入住', org: '静安分院' },
  { id: 'R004', name: '标准双人间', floor: 2, type: '双人间', capacity: 2, occupied: 2, status: '已满', org: '浦东分院' },
  { id: 'R005', name: '单人护理间', floor: 1, type: '护理间', capacity: 1, occupied: 1, status: '已满', org: '浦东分院' },
]

const STATUS_TAG: Record<string, TagVariant> = { '已满': 'danger', '可入住': 'success', '维护中': 'warning' }

export default function RoomsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const filtered = ROOMS.filter(r => !search || r.name.includes(search))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const totalBeds = ROOMS.reduce((s, r) => s + r.capacity, 0)
  const occupied = ROOMS.reduce((s, r) => s + r.occupied, 0)
  const occupancy = Math.round((occupied / totalBeds) * 100)

  return (
    <div className="animate-fade-up">

      <PageHeader
        title="房间管理"
        subtitle={`共 ${ROOMS.length} 间房间 · ${organizations.length} 家分院`}
        actions={
          <button className="btn btn-primary btn-sm">
            <Plus size={13} />新增房间
          </button>
        }
      />

      <div className="kpi-grid">
        <StatCard icon={<DoorOpen size={18} />} label="房间总数" value={ROOMS.length} color="primary" />
        <StatCard icon={<DoorOpen size={18} />} label="总床位数" value={totalBeds} sub={`已入住 ${occupied}`} color="info" />
        <StatCard icon={<DoorOpen size={18} />} label="入住率" value={`${occupancy}%`} sub="整体床位使用" color="success" />
        <StatCard icon={<DoorOpen size={18} />} label="可入住" value={ROOMS.filter(r => r.status === '可入住').length} sub="房间可立即入住" color="warning" />
      </div>

      <FilterBar>
        <FilterItem label="">
          <div className="input-wrap" style={{ minWidth: 180 }}>
            <span className="input-icon"><Search size={14} /></span>
            <input
              className="input"
              placeholder="搜索房间名称..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              style={{ paddingLeft: 34 }}
            />
          </div>
        </FilterItem>
      </FilterBar>

      <div style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>房间名称</th>
                <th>所属机构</th>
                <th>楼层</th>
                <th>房型</th>
                <th>床位</th>
                <th>入住情况</th>
                <th>状态</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(r => (
                <tr key={r.id} className="table-hover-row">
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                        background: 'rgba(13,148,136,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-primary)',
                      }}>
                        <DoorOpen size={16} />
                      </div>
                      <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{r.name}</span>
                    </div>
                  </td>
                  <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{r.org}</span></td>
                  <td><span className="text-sm">{r.floor}F</span></td>
                  <td><span className="text-sm">{r.type}</span></td>
                  <td><span className="text-sm">{r.occupied}/{r.capacity}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, maxWidth: 80 }}>
                        <div style={{
                          height: 4, background: 'var(--color-bg)', borderRadius: 999,
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${(r.occupied / r.capacity) * 100}%`,
                            height: '100%', borderRadius: 999,
                            background: r.occupied === r.capacity ? 'var(--color-danger)' : 'var(--color-success)',
                          }} />
                        </div>
                      </div>
                      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        {r.occupied}/{r.capacity}
                      </span>
                    </div>
                  </td>
                  <td><Tag variant={STATUS_TAG[r.status]}>{r.status}</Tag></td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/rooms/${r.id}`} className="btn btn-ghost btn-sm">
                      查看 <ChevronRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {paged.length === 0 && <EmptyState variant="search" title="暂无数据" description="调整搜索条件试试" />}
        <Pagination current={page} total={filtered.length} pageSize={pageSize} onChange={setPage} />
      </div>

    </div>
  )
}
