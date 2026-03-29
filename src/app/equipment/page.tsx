'use client'

import { useState } from 'react'
import Link from 'next/link'
import { StatCard, Tag, PageHeader, FilterBar, FilterItem, Pagination, EmptyState, type TagVariant } from '@/components/nh'
import { equipmentList, equipmentAlarms } from '@/lib/data'
import { Search, Plus, Wifi, AlertTriangle, CheckCircle2 } from 'lucide-react'

const CATEGORY_TAG: Record<string, TagVariant> = {
  '医疗设备': 'info', '康复设备': 'warning', '生活设备': 'primary', '智能设备': 'purple',
}
const STATUS_TAG: Record<string, TagVariant> = {
  '正常': 'success', '维修中': 'warning', '已报废': 'danger', '待维修': 'warning',
}

export default function EquipmentPage() {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const filtered = equipmentList.filter(e => {
    if (search && !e.name.includes(search) && !e.id.includes(search)) return false
    if (catFilter && e.category !== catFilter) return false
    return true
  })
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  const stats = {
    total: equipmentList.length,
    normal: equipmentList.filter(e => e.status === '正常').length,
    alarm: equipmentAlarms.filter(a => a.status === '待处理').length,
    repair: equipmentList.filter(e => e.status === '维修中' || e.status === '待维修').length,
  }

  const categories = [...new Set(equipmentList.map(e => e.category))]

  return (
    <div className="animate-fade-up">

      <PageHeader
        title="设备列表"
        subtitle={`共 ${equipmentList.length} 台设备`}
        actions={
          <button className="btn btn-primary btn-sm">
            <Plus size={13} />添加设备
          </button>
        }
      />

      <div className="kpi-grid">
        <StatCard icon={<Wifi size={18} />} label="设备总数" value={stats.total} color="primary" />
        <StatCard icon={<CheckCircle2 size={18} />} label="正常运行" value={stats.normal} color="success" />
        <StatCard icon={<AlertTriangle size={18} />} label="待处理告警" value={stats.alarm} sub="需立即处理" color="danger" />
        <StatCard icon={<Wifi size={18} />} label="维修中" value={stats.repair} sub="设备维护" color="warning" />
      </div>

      <FilterBar>
        <FilterItem label="">
          <div className="input-wrap" style={{ minWidth: 180 }}>
            <span className="input-icon"><Search size={14} /></span>
            <input
              className="input"
              placeholder="搜索设备名称..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              style={{ paddingLeft: 34 }}
            />
          </div>
        </FilterItem>
        <FilterItem label="">
          <select
            className="select"
            value={catFilter}
            onChange={e => { setCatFilter(e.target.value); setPage(1) }}
            style={{ minWidth: 130 }}
          >
            <option value="">全部分类</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
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
                <th>设备名称</th>
                <th>分类</th>
                <th>型号</th>
                <th>位置</th>
                <th>状态</th>
                <th>采购日期</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(e => (
                <tr key={e.id} className="table-hover-row">
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                        background: STATUS_TAG[e.status] === 'success'
                          ? 'rgba(34,197,94,0.1)' : STATUS_TAG[e.status] === 'warning'
                          ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                        color: STATUS_TAG[e.status] === 'success'
                          ? 'var(--color-success)' : STATUS_TAG[e.status] === 'warning'
                          ? 'var(--color-warning)' : 'var(--color-danger)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Wifi size={16} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{e.name}</div>
                        <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{e.id}</div>
                      </div>
                    </div>
                  </td>
                  <td><Tag variant={CATEGORY_TAG[e.category]}>{e.category}</Tag></td>
                  <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{e.model}</span></td>
                  <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{e.location}</span></td>
                  <td><Tag variant={STATUS_TAG[e.status]}>{e.status}</Tag></td>
                  <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{e.purchaseDate}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <Link href={`/devices/${e.id}`} className="btn btn-ghost btn-sm">详情</Link>
                      <Link href="/devices/realtime" className="btn btn-ghost btn-sm">监控</Link>
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
