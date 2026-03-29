'use client'

import { EmptyState, FilterBar, FilterItem, PageHeader, Pagination, StatCard, Tag, type TagVariant } from '@/components/nh'
import { Plus, Search, ShieldCheck, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const STAFF = [
  { id: 'S001', name: '王美丽', role: '护理主管', department: '护理部', phone: '13800138001', status: '在职', gender: '女' },
  { id: 'S002', name: '李建国', role: '护士', department: '护理部', phone: '13800138002', status: '在职', gender: '男' },
  { id: 'S003', name: '赵晓红', role: '护士', department: '护理部', phone: '13800138003', status: '在职', gender: '女' },
  { id: 'S004', name: '周明', role: '后勤主管', department: '后勤部', phone: '13800138004', status: '在职', gender: '男' },
  { id: 'S005', name: '吴静', role: '心理咨询师', department: '心理部', phone: '13800138005', status: '在职', gender: '女' },
  { id: 'S006', name: '郑伟', role: '厨师长', department: '后勤部', phone: '13800138006', status: '休假', gender: '男' },
]

const ROLE_TAG: Record<string, TagVariant> = {
  '护理主管': 'primary', '护士': 'info', '后勤主管': 'warning',
  '心理咨询师': 'purple', '厨师长': 'neutral',
}
const STATUS_TAG: Record<string, TagVariant> = { '在职': 'success', '休假': 'warning', '离职': 'danger' }

export default function StaffPage() {
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const departments = [...new Set(STAFF.map(s => s.department))]

  const filtered = STAFF.filter(s => {
    if (search && !s.name.includes(search) && !s.id.includes(search)) return false
    if (deptFilter && s.department !== deptFilter) return false
    return true
  })
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="animate-fade-up">

      <PageHeader
        title="员工列表"
        subtitle={`共 ${STAFF.length} 名员工`}
        actions={
          <button className="btn btn-primary btn-sm">
            <Plus size={13} />添加员工
          </button>
        }
      />

      <div className="kpi-grid">
        <StatCard icon={<UserCheck size={18} />} label="员工总数" value={STAFF.length} color="primary" />
        <StatCard icon={<ShieldCheck size={18} />} label="在职" value={STAFF.filter(s => s.status === '在职').length} color="success" />
        <StatCard icon={<UserCheck size={18} />} label="护理团队" value={STAFF.filter(s => s.department === '护理部').length} sub="护理部" color="info" />
        <StatCard icon={<UserCheck size={18} />} label="休假中" value={STAFF.filter(s => s.status === '休假').length} color="warning" />
      </div>

      <FilterBar>
        <FilterItem label="">
          <div className="input-wrap" style={{ minWidth: 180 }}>
            <span className="input-icon"><Search size={14} /></span>
            <input
              className="input"
              placeholder="搜索姓名/工号..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              style={{ paddingLeft: 34 }}
            />
          </div>
        </FilterItem>
        <FilterItem label="">
          <select
            className="select"
            value={deptFilter}
            onChange={e => { setDeptFilter(e.target.value); setPage(1) }}
            style={{ minWidth: 130 }}
          >
            <option value="">全部部门</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
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
                <th>工号</th>
                <th>职位</th>
                <th>部门</th>
                <th>状态</th>
                <th>联系方式</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(s => (
                <tr key={s.id} className="table-hover-row">
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar avatar-sm" style={{
                        background: 'rgba(13,148,136,0.1)', color: 'var(--color-primary)',
                      }}>
                        {s.name.slice(0, 1)}
                      </div>
                      <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{s.name}</span>
                    </div>
                  </td>
                  <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{s.id}</span></td>
                  <td><Tag variant={ROLE_TAG[s.role]}>{s.role}</Tag></td>
                  <td><span className="text-sm">{s.department}</span></td>
                  <td><Tag variant={STATUS_TAG[s.status]}>{s.status}</Tag></td>
                  <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{s.phone}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <Link href={`/staff/${s.id}`} className="btn btn-ghost btn-sm">详情</Link>
                      <Link href="/staff/schedule" className="btn btn-ghost btn-sm">排班</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {paged.length === 0 && <EmptyState variant="search" title="暂无数据" description="调整筛选条件试试" />}
        <Pagination current={page} total={filtered.length} pageSize={pageSize} onChange={setPage} />
      </div>

    </div>
  )
}
