'use client'

import { useState } from 'react'
import Link from 'next/link'
import { StatCard, Tag, PageHeader, FilterBar, FilterItem, Pagination, EmptyState } from '@/components/nh'
import { Search, Plus, Package, ChevronRight, AlertTriangle } from 'lucide-react'

const SUPPLIES = [
  { id: 'SP001', name: '成人护理垫', category: '护理用品', unit: '包', stock: 45, minStock: 50, price: '¥38', supplier: '稳健医疗', status: '库存不足' },
  { id: 'SP002', name: '一次性手套', category: '防护用品', unit: '盒', stock: 120, minStock: 80, price: '¥25', supplier: '蓝帆医疗', status: '正常' },
  { id: 'SP003', name: '医用酒精', category: '消毒用品', unit: '瓶', stock: 28, minStock: 30, price: '¥15', supplier: '利尔康', status: '库存不足' },
  { id: 'SP004', name: '纸尿裤L码', category: '护理用品', unit: '包', stock: 85, minStock: 60, price: '¥68', supplier: '可靠股份', status: '正常' },
  { id: 'SP005', name: '创可贴', category: '医疗用品', unit: '盒', stock: 200, minStock: 50, price: '¥12', supplier: '云南白药', status: '正常' },
]

const STATUS_TAG: Record<string, string> = { '库存不足': 'danger', '正常': 'success' }
const CAT_TAG: Record<string, string> = { '护理用品': 'primary', '防护用品': 'warning', '消毒用品': 'info', '医疗用品': 'purple' }

export default function SuppliesPage() {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const lowStock = SUPPLIES.filter(s => s.status === '库存不足').length
  const filtered = SUPPLIES.filter(s => {
    if (search && !s.name.includes(search)) return false
    if (catFilter && s.category !== catFilter) return false
    return true
  })
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="animate-fade-up">

      <PageHeader
        title="物资管理"
        subtitle={`共 ${SUPPLIES.length} 种物资`}
        actions={
          <button className="btn btn-primary btn-sm">
            <Plus size={13} />采购入库
          </button>
        }
      />

      <div className="kpi-grid">
        <StatCard icon={<Package size={18} />} label="物品种类" value={SUPPLIES.length} color="primary" />
        <StatCard icon={<AlertTriangle size={18} />} label="库存不足" value={lowStock} sub="需立即采购" color="danger" />
        <StatCard icon={<Package size={18} />} label="库存正常" value={SUPPLIES.length - lowStock} color="success" />
        <StatCard icon={<Package size={18} />} label="本月采购" value={12} sub="采购次数" color="info" />
      </div>

      <FilterBar>
        <FilterItem label="">
          <div className="input-wrap" style={{ minWidth: 180 }}>
            <span className="input-icon"><Search size={14} /></span>
            <input
              className="input"
              placeholder="搜索物资名称..."
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
            {[...new Set(SUPPLIES.map(s => s.category))].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
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
                <th>物资名称</th>
                <th>分类</th>
                <th>单位</th>
                <th>库存</th>
                <th>最低库存</th>
                <th>单价</th>
                <th>供应商</th>
                <th>状态</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(s => (
                <tr key={s.id} className="table-hover-row">
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                        background: 'rgba(13,148,136,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-primary)',
                      }}>
                        <Package size={16} />
                      </div>
                      <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{s.name}</span>
                    </div>
                  </td>
                  <td><Tag variant={CAT_TAG[s.category] as any}>{s.category}</Tag></td>
                  <td><span className="text-sm">{s.unit}</span></td>
                  <td>
                    <span className="font-semibold text-sm" style={{
                      color: s.status === '库存不足' ? 'var(--color-danger)' : 'var(--color-text)',
                    }}>
                      {s.stock}
                    </span>
                  </td>
                  <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{s.minStock}</span></td>
                  <td><span className="text-sm">{s.price}</span></td>
                  <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{s.supplier}</span></td>
                  <td><Tag variant={STATUS_TAG[s.status] as any}>{s.status}</Tag></td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/supplies/${s.id}`} className="btn btn-ghost btn-sm">
                      入库 <ChevronRight size={12} />
                    </Link>
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
