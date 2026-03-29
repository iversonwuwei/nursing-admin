'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { StatCard, Tag, PageHeader, FilterBar, FilterItem, Pagination, EmptyState, type TagVariant } from '@/components/nh'
import { elderlyList } from '@/lib/data'
import { Search, Plus, UserPlus, ChevronRight, Users, Home, UserCheck, UserPlus as NewUser } from 'lucide-react'

const LEVEL_TAG: Record<string, TagVariant> = {
  '特级护理': 'danger', '全护理': 'warning', '半自理': 'info', '自理': 'success',
}
const STATUS_TAG: Record<string, TagVariant> = {
  '入住': 'success', '待入住': 'warning', '离院': 'neutral',
}

export default function ElderlyPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const filtered = elderlyList.filter(e => {
    if (search && !e.name.includes(search) && !e.id.includes(search)) return false
    if (statusFilter && e.status !== statusFilter) return false
    if (levelFilter && e.careLevel !== levelFilter) return false
    return true
  })

  const total = filtered.length
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  // Top stats
  const totalBeds = 360
  const occupiedBeds = elderlyList.filter(e => e.status === '入住').length
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
  const critical = elderlyList.filter(e => e.careLevel === '特级护理').length
  const newThisMonth = 2

  return (
    <div className="animate-fade-up">

      <PageHeader
        title="老人列表"
        subtitle={`共 ${elderlyList.length} 位老人登记在册`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm">
              <UserPlus size={13} />批量导入
            </button>
            <button className="btn btn-primary btn-sm">
              <Plus size={13} />新增老人
            </button>
          </div>
        }
      />

      {/* Top Stats Row */}
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard
          icon={<Home size={18} />}
          label="入住率"
          value={`${occupancyRate}%`}
          sub={`${occupiedBeds}/${totalBeds} 床`}
          color="primary"
        />
        <StatCard
          icon={<Users size={18} />}
          label="登记总数"
          value={elderlyList.length}
          color="success"
        />
        <StatCard
          icon={<UserCheck size={18} />}
          label="特护人数"
          value={critical}
          sub="需重点关注"
          color="danger"
        />
        <StatCard
          icon={<NewUser size={18} />}
          label="本月新入住"
          value={newThisMonth}
          sub="本月新增"
          trend={{ value: '+1', direction: 'up' }}
          color="info"
        />
      </div>

      <FilterBar>
        <FilterItem label="">
          <div className="input-wrap" style={{ minWidth: 180 }}>
            <span className="input-icon"><Search size={14} /></span>
            <input
              className="input"
              placeholder="搜索姓名/编号..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              style={{ paddingLeft: 34 }}
            />
          </div>
        </FilterItem>
        <FilterItem label="">
          <select
            className="select"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            style={{ minWidth: 120 }}
          >
            <option value="">全部状态</option>
            <option value="入住">入住</option>
            <option value="待入住">待入住</option>
            <option value="离院">离院</option>
          </select>
        </FilterItem>
        <FilterItem label="">
          <select
            className="select"
            value={levelFilter}
            onChange={e => { setLevelFilter(e.target.value); setPage(1) }}
            style={{ minWidth: 120 }}
          >
            <option value="">全部护理等级</option>
            <option value="特级护理">特级护理</option>
            <option value="全护理">全护理</option>
            <option value="半自理">半自理</option>
            <option value="自理">自理</option>
          </select>
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
                <th>姓名</th>
                <th>性别</th>
                <th>年龄</th>
                <th>护理等级</th>
                <th>状态</th>
                <th>房间</th>
                <th>入住日期</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? null : paged.map(e => (
                <tr key={e.id} className="table-hover-row" onClick={() => router.push(`/elderly/${e.id}`)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar avatar-sm" style={{ background: 'rgba(13,148,136,0.1)', color: 'var(--color-primary)' }}>
                        {e.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{e.name}</div>
                        <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{e.id}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="text-sm">{e.gender}</span></td>
                  <td><span className="text-sm">{e.age}岁</span></td>
                  <td><Tag variant={LEVEL_TAG[e.careLevel]}>{e.careLevel}</Tag></td>
                  <td><Tag variant={STATUS_TAG[e.status]}>{e.status}</Tag></td>
                  <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{e.roomNumber}</span></td>
                  <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{e.checkInDate}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <Link
                      href={`/elderly/${e.id}`}
                      className="btn btn-ghost btn-sm"
                      onClick={e => e.stopPropagation()}
                    >
                      查看 <ChevronRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {paged.length === 0 && (
          <EmptyState variant="search" title="暂无数据" description="调整筛选条件试试" />
        )}
        <Pagination current={page} total={total} pageSize={pageSize} onChange={setPage} />
      </div>

    </div>
  )
}
