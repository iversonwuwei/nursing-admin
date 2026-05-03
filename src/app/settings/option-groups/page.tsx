'use client'

import { DataCard, EmptyState, FilterBar, FilterItem, InteractionRailLayout, PageHeader, PageHelpCard, Pagination, Tag } from '@/components/nh'
import {
    fetchOptionGroups,
    fetchOptionItems,
    type OptionGroup,
    type OptionItem,
} from '@/lib/mock/content-management-workflow'
import { ChevronLeft, ChevronRight, Layers, Lock, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

export default function OptionGroupsPage() {
  const helpHref = '/help/settings'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedGroup, setSelectedGroup] = useState<OptionGroup | null>(null)
  const pageSize = 20

  const [allGroups, setAllGroups] = useState<OptionGroup[]>([])
  const [, setLoading] = useState(true)

  const loadGroups = useCallback(async () => {
    setLoading(true)
    try {
      const groups = await fetchOptionGroups({
        status: statusFilter || undefined,
        keyword: search || undefined,
      })
      setAllGroups(groups)
    } catch {
      setAllGroups([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search])

  useEffect(() => { loadGroups() }, [loadGroups])

  const total = allGroups.length
  const paged = allGroups.slice((page - 1) * pageSize, page * pageSize)

  const [activeGroupItems, setActiveGroupItems] = useState<OptionItem[]>([])
  const [, setItemsLoading] = useState(false)

  useEffect(() => {
    if (!selectedGroup) {
      setActiveGroupItems([])
      return
    }
    let cancelled = false
    setItemsLoading(true)
    fetchOptionItems(selectedGroup.id)
      .then(items => { if (!cancelled) setActiveGroupItems(items) })
      .catch(() => { if (!cancelled) setActiveGroupItems([]) })
      .finally(() => { if (!cancelled) setItemsLoading(false) })
    return () => { cancelled = true }
  }, [selectedGroup])

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={selectedGroup ? `${selectedGroup.groupName} · 选项条目` : '下拉选项管理'}
        subtitle={
          selectedGroup
            ? `分组编码 ${selectedGroup.groupCode} · 共 ${activeGroupItems.length} 项`
            : `共 ${total} 个选项分组 · 管理系统下拉菜单数据源`
        }
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            {selectedGroup ? (
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedGroup(null)}>
                <ChevronLeft size={13} />返回分组列表
              </button>
            ) : (
              <Link href="/settings" className="btn btn-secondary btn-sm">
                <ChevronLeft size={13} />返回系统配置
              </Link>
            )}
            <button className="btn btn-primary btn-sm" disabled>
              <Plus size={13} />{selectedGroup ? '新增条目' : '新增分组'}
            </button>
          </div>
        }
      />

      <InteractionRailLayout
        main={(
          <>
            {!selectedGroup && (
              <>
                <FilterBar>
                  <FilterItem label="">
                    <div className="input-wrap" style={{ minWidth: 200 }}>
                      <span className="input-icon"><Search size={14} /></span>
                      <input
                        className="input"
                        placeholder="搜索分组编码/名称..."
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
                      <option value="active">启用</option>
                      <option value="archived">归档</option>
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
                    <table className="table table-compact">
                      <thead>
                        <tr>
                          <th>分组名称</th>
                          <th>分组编码</th>
                          <th>系统保留</th>
                          <th>状态</th>
                          <th>条目数</th>
                          <th>更新时间</th>
                          <th style={{ textAlign: 'right' }}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paged.length === 0 ? null : paged.map(g => (
                          <tr key={g.id} className="table-hover-row" onClick={() => setSelectedGroup(g)}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className="avatar avatar-sm" style={{ background: 'rgba(13,148,136,0.1)', color: 'var(--color-primary)' }}>
                                  <Layers size={14} />
                                </div>
                                <div>
                                  <div className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{g.groupName}</div>
                                  <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{g.description}</div>
                                </div>
                              </div>
                            </td>
                            <td><code style={{ fontSize: 12 }}>{g.groupCode}</code></td>
                            <td>
                              {g.isSystem ? (
                                <Tag variant="warning"><Lock size={10} style={{ marginRight: 2 }} />系统</Tag>
                              ) : (
                                <Tag variant="neutral">自定义</Tag>
                              )}
                            </td>
                            <td>
                              <Tag variant={g.status === 'active' ? 'success' : 'neutral'}>
                                {g.status === 'active' ? '启用' : '归档'}
                              </Tag>
                            </td>
                            <td><span className="text-sm" style={{ color: 'var(--color-text)' }}>{g.itemCount}</span></td>
                            <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{g.updatedAt}</span></td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={e => { e.stopPropagation(); setSelectedGroup(g) }}
                              >
                                查看条目 <ChevronRight size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {paged.length === 0 && (
                    <EmptyState variant="search" title="暂无分组" description="调整筛选条件试试" />
                  )}
                  <Pagination current={page} total={total} pageSize={pageSize} onChange={setPage} />
                </div>
              </>
            )}

            {selectedGroup && (
              <div style={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}>
                <div className="table-wrap">
                  <table className="table table-compact">
                    <thead>
                      <tr>
                        <th>排序</th>
                        <th>选项编码</th>
                        <th>中文标签</th>
                        <th>英文标签</th>
                        <th>状态</th>
                        <th>默认值</th>
                        <th>更新时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeGroupItems.length === 0 ? null : activeGroupItems.map(item => (
                        <tr key={item.id} className="table-hover-row">
                          <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{item.sortOrder}</span></td>
                          <td><code style={{ fontSize: 12 }}>{item.optionCode}</code></td>
                          <td><span className="text-sm" style={{ color: 'var(--color-text)' }}>{item.labelZh}</span></td>
                          <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{item.labelEn}</span></td>
                          <td>
                            <Tag variant={item.isActive ? 'success' : 'neutral'}>
                              {item.isActive ? '启用' : '禁用'}
                            </Tag>
                          </td>
                          <td>
                            {item.isDefault && <Tag variant="primary">默认</Tag>}
                          </td>
                          <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{item.updatedAt}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {activeGroupItems.length === 0 && (
                  <EmptyState variant="default" title="暂无条目" description="该分组下还没有选项条目" />
                )}
              </div>
            )}
          </>
        )}
        rail={(
          <>
            <DataCard
              title={selectedGroup ? '当前分组摘要' : '分组治理边界'}
              subtitle={selectedGroup ? '主区只保留条目表格，分组上下文和治理边界后置到这里。' : '主区只保留检索、列表和切换，不混排完整说明。'}
              badge={<Tag variant={selectedGroup ? (selectedGroup.status === 'active' ? 'success' : 'neutral') : 'info'}>{selectedGroup ? (selectedGroup.status === 'active' ? '启用' : '归档') : 'Config Taxonomy'}</Tag>}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                {selectedGroup ? (
                  <>
                    <div className="page-help-card-item">分组编码：{selectedGroup.groupCode} · 条目数：{activeGroupItems.length}</div>
                    <div className="page-help-card-item">系统保留：{selectedGroup.isSystem ? '是，优先核对引用影响' : '否，可按自定义分组治理'}</div>
                    <div className="page-help-card-item">默认值数量：{activeGroupItems.filter(item => item.isDefault).length}，启用条目：{activeGroupItems.filter(item => item.isActive).length}</div>
                  </>
                ) : (
                  <>
                    <div className="page-help-card-item">先筛分组，再进入条目视角，避免主区同时承载两层解释。</div>
                    <div className="page-help-card-item">系统分组优先核对兼容影响，自定义分组再看具体条目结构。</div>
                    <div className="page-help-card-item">帮助说明和配置边界统一后置，不和分组表格抢首屏注意力。</div>
                  </>
                )}
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整系统配置说明迁移到显式帮助页"
              summary="下拉选项管理首屏只保留分组检索、条目切换与表格，完整治理说明统一后置。"
              items={[
                '先从分组列表进入，再核对条目明细与默认值。',
                '系统保留分组优先关注影响范围，不在当前页直接做高风险变更。',
                '如需完整配置口径，进入系统配置帮助页。',
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
