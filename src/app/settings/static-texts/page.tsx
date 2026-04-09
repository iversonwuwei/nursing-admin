'use client'

import { DataCard, EmptyState, FilterBar, FilterItem, PageHeader, Pagination, Tag } from '@/components/nh'
import {
    fetchStaticTexts,
    getStaticTextsByFilter,
    LOCALES,
    NAMESPACE_LABELS,
    NAMESPACES,
    type StaticTextItem,
    type TextNamespace,
} from '@/lib/mock/content-management-workflow'
import { ChevronLeft, FileText, Languages, Pencil, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

export default function StaticTextsPage() {
  const [search, setSearch] = useState('')
  const [nsFilter, setNsFilter] = useState('')
  const [localeFilter, setLocaleFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [paged, setPaged] = useState<StaticTextItem[]>([])
  const [total, setTotal] = useState(0)
  const [, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchStaticTexts({
        ns: nsFilter || undefined,
        locale: localeFilter || undefined,
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
  }, [nsFilter, localeFilter, search, page, pageSize])

  useEffect(() => { loadData() }, [loadData])

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="静态文本管理"
        subtitle={`共 ${total} 条静态文本 · 覆盖 ${NAMESPACES.length} 个命名空间`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/settings" className="btn btn-secondary btn-sm">
              <ChevronLeft size={13} />返回系统配置
            </Link>
            <button className="btn btn-primary btn-sm" disabled>
              <Plus size={13} />新增文本
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        {NAMESPACES.map(ns => {
          const count = getStaticTextsByFilter(ns).length
          return (
            <DataCard key={ns} title={NAMESPACE_LABELS[ns]} subtitle={`${count} 条文本`}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)' }}>{count}</div>
            </DataCard>
          )
        })}
      </div>

      {/* Filters */}
      <FilterBar>
        <FilterItem label="">
          <div className="input-wrap" style={{ minWidth: 200 }}>
            <span className="input-icon"><Search size={14} /></span>
            <input
              className="input"
              placeholder="搜索 Key / 文本内容..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              style={{ paddingLeft: 34 }}
            />
          </div>
        </FilterItem>
        <FilterItem label="">
          <select
            className="select"
            value={nsFilter}
            onChange={e => { setNsFilter(e.target.value); setPage(1) }}
            style={{ minWidth: 140 }}
          >
            <option value="">全部命名空间</option>
            {NAMESPACES.map(ns => (
              <option key={ns} value={ns}>{NAMESPACE_LABELS[ns as TextNamespace]}</option>
            ))}
          </select>
        </FilterItem>
        <FilterItem label="">
          <select
            className="select"
            value={localeFilter}
            onChange={e => { setLocaleFilter(e.target.value); setPage(1) }}
            style={{ minWidth: 120 }}
          >
            <option value="">全部语言</option>
            {LOCALES.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </FilterItem>
      </FilterBar>

      {/* Table */}
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
                <th>命名空间</th>
                <th>文本 Key</th>
                <th>语言</th>
                <th>内容</th>
                <th>版本</th>
                <th>最后编辑</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? null : paged.map(t => (
                <tr key={t.id} className="table-hover-row">
                  <td>
                    <Tag variant={
                      t.namespace === 'app_family' ? 'primary'
                      : t.namespace === 'app_nani' ? 'info'
                      : t.namespace === 'admin' ? 'warning'
                      : 'neutral'
                    }>
                      {NAMESPACE_LABELS[t.namespace as TextNamespace] ?? t.namespace}
                    </Tag>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={14} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
                      <code style={{ fontSize: 12, color: 'var(--color-text)' }}>{t.textKey}</code>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Languages size={13} style={{ color: 'var(--color-muted)' }} />
                      <span className="text-sm">{t.locale}</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm" style={{ color: 'var(--color-text)', maxWidth: 280, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.textValue}
                    </span>
                  </td>
                  <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>v{t.version}</span></td>
                  <td>
                    <div>
                      <div className="text-sm" style={{ color: 'var(--color-text)' }}>{t.updatedBy}</div>
                      <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{t.updatedAt}</div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-sm" disabled>
                      <Pencil size={12} /> 编辑
                    </button>
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
