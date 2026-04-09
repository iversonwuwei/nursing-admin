'use client'

import { EmptyState, FilterBar, FilterItem, PageHeader, Pagination, Tag, type TagVariant } from '@/components/nh'
import {
    ACTION_LABELS,
    fetchAuditLogs,
    RESOURCE_TYPE_LABELS,
    type ContentAuditLog,
} from '@/lib/mock/content-management-workflow'
import { ChevronLeft, Clock, Eye, Search } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

const ACTION_TAG: Record<string, TagVariant> = {
  create: 'success',
  update: 'info',
  delete: 'danger',
  enable: 'primary',
  disable: 'neutral',
}

export default function AuditLogsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const pageSize = 10

  const [paged, setPaged] = useState<ContentAuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchAuditLogs({
        resourceType: typeFilter || undefined,
        keyword: search || undefined,
        page,
        pageSize,
      })
      setPaged(result.items)
      setTotal(result.total)
    } catch {
      setPaged([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [typeFilter, search, page, pageSize])

  useEffect(() => { loadData() }, [loadData])

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="操作日志"
        subtitle={`共 ${total} 条变更记录 · 追踪内容管理操作`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/settings" className="btn btn-secondary btn-sm">
              <ChevronLeft size={13} />返回系统配置
            </Link>
          </div>
        }
      />

      <FilterBar>
        <FilterItem label="">
          <div className="input-wrap" style={{ minWidth: 200 }}>
            <span className="input-icon"><Search size={14} /></span>
            <input
              className="input"
              placeholder="搜索操作人/资源 ID..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              style={{ paddingLeft: 34 }}
            />
          </div>
        </FilterItem>
        <FilterItem label="">
          <select
            className="select"
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
            style={{ minWidth: 140 }}
          >
            <option value="">全部资源类型</option>
            {Object.entries(RESOURCE_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
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
                <th>时间</th>
                <th>操作人</th>
                <th>资源类型</th>
                <th>资源 ID</th>
                <th>操作</th>
                <th style={{ textAlign: 'right' }}>详情</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? null : paged.map(log => (
                <>
                  <tr key={log.id} className="table-hover-row">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={13} style={{ color: 'var(--color-muted)' }} />
                        <span className="text-sm" style={{ color: 'var(--color-muted)' }}>{log.createdAt}</span>
                      </div>
                    </td>
                    <td><span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{log.operatorName}</span></td>
                    <td><Tag variant="info">{RESOURCE_TYPE_LABELS[log.resourceType] ?? log.resourceType}</Tag></td>
                    <td><code style={{ fontSize: 12 }}>{log.resourceId}</code></td>
                    <td><Tag variant={ACTION_TAG[log.action] ?? 'neutral'}>{ACTION_LABELS[log.action] ?? log.action}</Tag></td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                      >
                        <Eye size={12} /> {expandedId === log.id ? '收起' : '查看'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr key={`${log.id}-detail`}>
                      <td colSpan={6} style={{ padding: '12px 16px', background: 'var(--color-bg)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 6, textTransform: 'uppercase' }}>变更前</div>
                            <pre style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--color-text)', background: 'var(--color-card)', padding: 10, borderRadius: 'var(--radius-md)', overflow: 'auto', maxHeight: 120, margin: 0, border: '1px solid var(--color-border)' }}>
                              {log.beforeSnapshot ? JSON.stringify(JSON.parse(log.beforeSnapshot), null, 2) : '—'}
                            </pre>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 6, textTransform: 'uppercase' }}>变更后</div>
                            <pre style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--color-text)', background: 'var(--color-card)', padding: 10, borderRadius: 'var(--radius-md)', overflow: 'auto', maxHeight: 120, margin: 0, border: '1px solid var(--color-border)' }}>
                              {log.afterSnapshot ? JSON.stringify(JSON.parse(log.afterSnapshot), null, 2) : '—'}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
        {paged.length === 0 && (
          <EmptyState variant="search" title="暂无日志" description="调整筛选条件试试" />
        )}
        <Pagination current={page} total={total} pageSize={pageSize} onChange={setPage} />
      </div>
    </div>
  )
}
