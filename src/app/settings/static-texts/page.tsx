'use client'

import { DataCard, EmptyState, FilterBar, FilterItem, InteractionRailLayout, PageHeader, PageHelpCard, Pagination, Tag } from '@/components/nh'
import {
  fetchStaticTextNamespaceTotals,
  fetchStaticTexts,
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
  const helpHref = '/help/settings'
  const [search, setSearch] = useState('')
  const [nsFilter, setNsFilter] = useState('')
  const [localeFilter, setLocaleFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [paged, setPaged] = useState<StaticTextItem[]>([])
  const [total, setTotal] = useState(0)
  const [namespaceTotals, setNamespaceTotals] = useState<Record<string, number>>(() =>
    Object.fromEntries(NAMESPACES.map(namespace => [namespace, 0])),
  )
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [result, totals] = await Promise.all([
        fetchStaticTexts({
          ns: nsFilter || undefined,
          locale: localeFilter || undefined,
          keyword: search || undefined,
          page,
          pageSize,
        }),
        fetchStaticTextNamespaceTotals(),
      ])
      setPaged(result.items)
      setTotal(result.total)
      setNamespaceTotals(totals)
    } catch {
      setPaged([])
      setTotal(0)
      setNamespaceTotals(Object.fromEntries(NAMESPACES.map(namespace => [namespace, 0])))
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

      <InteractionRailLayout
        main={(
          <>
            <div className="kpi-grid" style={{ marginBottom: 16 }}>
              {NAMESPACES.map(ns => {
                const count = namespaceTotals[ns] ?? 0
                return (
                  <DataCard key={ns} title={NAMESPACE_LABELS[ns]} subtitle={`${count} 条文本`}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)' }}>{count}</div>
                  </DataCard>
                )
              })}
            </div>

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

            {loading ? (
              <div style={{ marginBottom: 16, fontSize: 12.5, color: 'var(--color-muted)' }}>
                正在同步 Config Service 的静态文本与命名空间统计...
              </div>
            ) : null}

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
          </>
        )}
        rail={(
          <>
            <DataCard title="当前筛选焦点" subtitle="主区只保留检索和列表，筛选口径说明后置到这里。" badge={<Tag variant="info">Text Governance</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">命名空间：{nsFilter ? NAMESPACE_LABELS[nsFilter as TextNamespace] : '全部命名空间'}</div>
                <div className="page-help-card-item">语言：{localeFilter || '全部语言'}</div>
                <div className="page-help-card-item">当前结果：{total} 条，编辑动作仍保持禁用，只开放检索与核对。</div>
              </div>
            </DataCard>

            <DataCard title="变更边界" subtitle="静态文本页用于核对与筛选，不在首屏讲解全量配置规则。">
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">命名空间统计和文本列表必须围绕同一查询结果集保持一致。</div>
                <div className="page-help-card-item">查询失败时优先暴露空列表，不把长说明重新堆回主区。</div>
                <div className="page-help-card-item">完整设置体系与治理口径统一从帮助页进入。</div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整系统配置说明迁移到显式帮助页"
              summary="静态文本管理首屏只保留统计、筛选与列表，完整配置治理说明统一后置。"
              items={[
                '先用命名空间和语言缩小范围，再核对文本 Key。',
                '当前页只负责检索与查看，不直接执行发布或回滚。',
                '如需完整配置边界，进入系统配置帮助页。',
              ]}
              href={helpHref}
              actionLabel="查看系统配置帮助"
            />
          </>
        )}
      />
    </div>
  )
}
