'use client'

import { DataCard, EmptyState, InteractionRailLayout, PageHeader, PageHelpCard, ProgressBar, StatCard, Tag, WorkflowOverviewCard, type TagVariant } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { activateAdminOrganization, fetchAdminOrganizationList, type AdminOrganizationSummary } from '@/lib/organizations/admin-organization-api'
import { Bed, Bot, Building2, ChevronRight, MapPin, Phone, Users } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

function getOccupancyRate(organization: Pick<AdminOrganizationSummary, 'totalBeds' | 'occupiedBeds'>) {
  return organization.totalBeds > 0 ? Math.round((organization.occupiedBeds / organization.totalBeds) * 100) : 0
}

function buildOrgInsights(organizations: AdminOrganizationSummary[]): Array<{ id: string; title: string; summary: string; metric: string; action: string; variant: TagVariant }> {
  if (organizations.length === 0) {
    return [] as Array<{ id: string; title: string; summary: string; metric: string; action: string; variant: TagVariant }>
  }

  const highestOccupancy = [...organizations].sort((left, right) => getOccupancyRate(right) - getOccupancyRate(left))[0]
  const pending = organizations.filter(item => item.lifecycleStatus === '待启用')
  const highestCapacity = [...organizations].sort((left, right) => right.totalBeds - left.totalBeds)[0]

  return [
    {
      id: 'occupancy',
      title: '高承接压力机构',
      summary: `${highestOccupancy.name} 当前入住率 ${getOccupancyRate(highestOccupancy)}%，可用床位 ${highestOccupancy.availableBeds} 床。`,
      metric: `${getOccupancyRate(highestOccupancy)}%`,
      action: highestOccupancy.availableBeds === 0 ? '优先补充新房间或跨机构协调床位。' : '继续关注空床消耗速度和后续入院压力。',
      variant: getOccupancyRate(highestOccupancy) >= 90 ? 'danger' : 'warning',
    },
    {
      id: 'pending',
      title: '待启用机构队列',
      summary: pending.length > 0 ? `当前仍有 ${pending.length} 家机构待启用，启用前不会进入经营总览。` : '当前没有待启用机构，机构主档已全部进入运营台账。',
      metric: `${pending.length} 家`,
      action: pending.length > 0 ? '优先完成机构资料复核和开业确认。' : '继续通过房间建档补齐各机构容量事实。',
      variant: pending.length > 0 ? 'warning' : 'success',
    },
    {
      id: 'capacity',
      title: '房间容量覆盖',
      summary: `${highestCapacity.name} 当前房间覆盖 ${highestCapacity.roomCount} 间，合计 ${highestCapacity.totalBeds} 床。`,
      metric: `${highestCapacity.roomCount} 间`,
      action: highestCapacity.roomCount === 0 ? '当前机构还没有真实房间台账，需先完成 rooms 建档。' : '容量事实已接到 rooms，可继续检查待启用房间。',
      variant: highestCapacity.roomCount === 0 ? 'warning' : 'info',
    },
  ]
}

function buildOrgNarratives(organizations: AdminOrganizationSummary[]) {
  if (organizations.length === 0) {
    return ['当前没有真实机构数据。建议先建档机构主档，再进入房间建档。']
  }

  const pending = organizations.filter(item => item.lifecycleStatus === '待启用').map(item => item.name)
  const missingRooms = organizations.filter(item => item.roomCount === 0).map(item => item.name)
  const saturated = organizations.filter(item => getOccupancyRate(item) >= 90).map(item => item.name)

  return [
    pending.length > 0 ? `待启用机构仍包括 ${pending.slice(0, 3).join('、')}，启用前不建议把这些对象混入经营对比。` : '当前机构主档已全部启用，机构列表只展示真实运营对象。',
    missingRooms.length > 0 ? `${missingRooms.slice(0, 3).join('、')} 还没有真实房间台账，当前床位汇总为 0，需继续补 rooms 数据。` : '所有机构都已经具备真实 rooms 事实，可直接比较容量与入住率。',
    saturated.length > 0 ? `入住率偏高的机构有 ${saturated.slice(0, 3).join('、')}，建议优先检查新增房间或跨机构协调空间。` : '当前没有机构接近满载，容量风险可控。',
  ]
}

export default function OrganizationsPage() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('selected')
  const fromNew = searchParams.get('entry') === 'organizations-new'
  const [organizations, setOrganizations] = useState<AdminOrganizationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(preselectedId)
  const [activationId, setActivationId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadOrganizations() {
      setLoading(true)
      setError('')

      try {
        const response = await fetchAdminOrganizationList({ page: 1, pageSize: 100 })
        if (!active) {
          return
        }

        setOrganizations(response.items)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : '机构列表查询失败。')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadOrganizations()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (preselectedId) {
      setSelectedId(preselectedId)
    }
  }, [preselectedId])

  const totalStats = useMemo(() => {
    const totalBeds = organizations.reduce((sum, item) => sum + item.totalBeds, 0)
    const totalElderly = organizations.reduce((sum, item) => sum + item.elderlyCount, 0)
    const avgOccupancy = organizations.length > 0
      ? Math.round(organizations.reduce((sum, item) => sum + getOccupancyRate(item), 0) / organizations.length)
      : 0

    return {
      totalOrgs: organizations.length,
      totalBeds,
      totalElderly,
      avgOccupancy,
      pendingActivation: organizations.filter(item => item.lifecycleStatus === '待启用').length,
    }
  }, [organizations])

  const selectedOrganization = useMemo(
    () => organizations.find(item => item.id === selectedId) ?? organizations.find(item => item.id === preselectedId) ?? null,
    [organizations, preselectedId, selectedId],
  )
  const prioritizedOrganizations = useMemo(() => [...organizations].sort((left, right) => {
    const leftPending = left.lifecycleStatus === '待启用' ? 1 : 0
    const rightPending = right.lifecycleStatus === '待启用' ? 1 : 0
    if (rightPending !== leftPending) {
      return rightPending - leftPending
    }

    return getOccupancyRate(right) - getOccupancyRate(left)
  }), [organizations])
  const attentionOrganizations = prioritizedOrganizations.slice(0, 3)
  const aiInsights = useMemo(() => buildOrgInsights(organizations), [organizations])
  const aiNarratives = useMemo(() => buildOrgNarratives(organizations), [organizations])
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'organizations-list',
    entityId: 'org-board',
    entityName: '机构管理',
    focus,
    target,
  })

  async function handleActivate(organizationId: string) {
    setActivationId(organizationId)
    setError('')

    try {
      const updated = await activateAdminOrganization(organizationId)
      setOrganizations(current => current.map(item => item.id === organizationId ? updated : item))
      setSelectedId(organizationId)
    } catch (activationError) {
      setError(activationError instanceof Error ? activationError.message : '机构启用失败。')
    } finally {
      setActivationId(null)
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-up">
        <PageHeader title="机构管理" subtitle="正在加载真实机构主档与床位摘要" />
        <DataCard title="机构数据加载中" subtitle="当前从 organization service 和 rooms 聚合读取真实数据。" />
      </div>
    )
  }

  if (error && organizations.length === 0) {
    return (
      <div className="animate-fade-up">
        <PageHeader title="机构管理" subtitle="真实机构数据暂不可用" actions={<Link href="/organizations/new" className="btn btn-primary btn-sm">新增机构</Link>} />
        <EmptyState
          variant="danger"
          title="机构列表加载失败"
          description={error}
          action={<Link href="/organizations/new" className="btn btn-primary btn-sm">继续建档机构</Link>}
        />
      </div>
    )
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="机构管理"
        subtitle={`共 ${organizations.length} 家真实机构`}
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/organizations/new" className="btn btn-primary btn-sm">新增机构</Link>
            <Link href="/organizations/partners" className="btn btn-secondary btn-sm">查看定点机构</Link>
          </div>
        }
      />

      <InteractionRailLayout
        main={(
          <>
            <WorkflowOverviewCard
              eyebrow="Organization Operations"
              title={selectedOrganization ? `${selectedOrganization.name} 经营摘要` : '机构经营总览'}
              description={selectedOrganization
                ? `${selectedOrganization.address} · 负责人 ${selectedOrganization.manager}。当前页基于真实机构主档和房间容量聚合展示经营上下文。`
                : '机构页当前聚合机构主档、真实房间容量与待启用闭环，不再读取本地 organizations workflow。'}
              badge={selectedOrganization ? <Tag variant={selectedOrganization.lifecycleStatus === '待启用' ? 'warning' : 'success'}>{selectedOrganization.lifecycleStatus}</Tag> : <Tag variant="info">Chain Overview</Tag>}
              metrics={[
                { label: '机构总数', value: totalStats.totalOrgs, hint: '当前已建档机构总量', tone: 'primary' },
                { label: '平均入住率', value: `${totalStats.avgOccupancy}%`, hint: `总床位 ${totalStats.totalBeds}`, tone: totalStats.avgOccupancy >= 90 ? 'danger' : totalStats.avgOccupancy >= 75 ? 'warning' : 'success' },
                { label: '待启用机构', value: totalStats.pendingActivation, hint: '启用前不纳入经营口径', tone: totalStats.pendingActivation > 0 ? 'warning' : 'success' },
                { label: '当前选中机构', value: selectedOrganization?.name ?? '未选择', hint: selectedOrganization ? `${selectedOrganization.occupiedBeds}/${selectedOrganization.totalBeds} 床位使用` : '可展开下方机构查看详情', tone: selectedOrganization ? 'info' : 'neutral' },
              ]}
              signals={[
                { label: totalStats.pendingActivation > 0 ? `待启用机构 ${totalStats.pendingActivation} 家` : '当前无待启用机构', tone: totalStats.pendingActivation > 0 ? 'warning' : 'success' },
                ...(attentionOrganizations[0] ? [{ label: `最高承接压力：${attentionOrganizations[0].name}`, tone: getOccupancyRate(attentionOrganizations[0]) >= 90 ? 'danger' as const : 'info' as const }] : []),
                ...(selectedOrganization ? [{ label: `当前查看：${selectedOrganization.manager} 负责`, tone: 'neutral' as const }] : []),
              ]}
              actions={
                <>
                  <Link href="/organizations/new" className="btn btn-secondary btn-sm">新增机构</Link>
                  <Link href="/rooms/new" className="btn btn-secondary btn-sm">新增房间</Link>
                </>
              }
            />

            {error ? (
              <DataCard title="机构链路提示" subtitle={error} badge={<Tag variant="warning">Live Error</Tag>} />
            ) : null}

            <div className="kpi-grid">
              <StatCard icon={<Building2 size={18} />} label="机构总数" value={totalStats.totalOrgs} color="primary" />
              <StatCard icon={<Bed size={18} />} label="床位总数" value={totalStats.totalBeds} color="info" />
              <StatCard icon={<Users size={18} />} label="入住人数" value={totalStats.totalElderly} color="success" />
              <StatCard icon={<Building2 size={18} />} label="平均入住率" value={`${totalStats.avgOccupancy}%`} color="warning" />
            </div>

            {selectedOrganization && fromNew ? (
              <DataCard
                title="来自新增机构页"
                subtitle={`${selectedOrganization.name} 已进入待启用闭环。完成复核后再纳入机构经营台账。`}
                badge={<Tag variant={selectedOrganization.lifecycleStatus === '待启用' ? 'warning' : 'success'}>{selectedOrganization.lifecycleStatus}</Tag>}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                    当前机构状态为 {selectedOrganization.status}，负责人 {selectedOrganization.manager}，当前已聚合房间 {selectedOrganization.roomCount} 间。
                  </div>
                  {selectedOrganization.lifecycleStatus === '待启用' ? (
                    <button className="btn btn-primary btn-sm" onClick={() => handleActivate(selectedOrganization.id)} disabled={activationId === selectedOrganization.id}>
                      {activationId === selectedOrganization.id ? '启用中...' : '启用机构'}
                    </button>
                  ) : (
                    <Link href={`/organizations/${selectedOrganization.id}`} className="btn btn-secondary btn-sm">查看详情</Link>
                  )}
                </div>
              </DataCard>
            ) : null}

            {organizations.length === 0 ? (
              <EmptyState
                variant="default"
                title="当前没有真实机构数据"
                description="先新增机构主档，再继续房间建档和机构启用。"
                action={<Link href="/organizations/new" className="btn btn-primary btn-sm">新增机构</Link>}
              />
            ) : (
              <>
                  <DataCard
                    icon={<Building2 size={16} />}
                    title="优先关注机构"
                    subtitle="按生命周期和承接压力排序，优先暴露需要启用或扩容的机构。"
                    badge={<Tag variant="warning">Attention Queue</Tag>}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                      {attentionOrganizations.map(org => {
                        const rate = getOccupancyRate(org)
                        return (
                          <button
                            key={org.id}
                            type="button"
                            className="btn-reset"
                            onClick={() => setSelectedId(org.id)}
                            style={{ textAlign: 'left', borderRadius: 16, border: '1px solid var(--color-border)', padding: 16, background: org.id === selectedOrganization?.id ? 'rgba(13,148,136,0.08)' : 'var(--color-card)' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{org.name}</div>
                              <Tag variant={org.lifecycleStatus === '待启用' ? 'warning' : rate >= 90 ? 'danger' : 'info'}>{org.lifecycleStatus === '待启用' ? '待启用' : `入住率 ${rate}%`}</Tag>
                            </div>
                            <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                            {org.address} · 负责人 {org.manager} · 房间 {org.roomCount} 间
                          </div>
                          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, color: 'var(--color-text)' }}>
                            <span>{org.occupiedBeds}/{org.totalBeds} 床位</span>
                            <span>{org.availableBeds} 床空余</span>
                          </div>
                        </button>
                      )
                    })}
                    </div>
                  </DataCard>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {prioritizedOrganizations.map(org => {
                      const rate = getOccupancyRate(org)
                      const isSelected = selectedId === org.id

                    return (
                      <DataCard
                        key={org.id}
                        icon={<Building2 size={16} />}
                        title={org.name}
                        subtitle={
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 2, flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <MapPin size={11} style={{ color: 'var(--color-muted)' }} />
                              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{org.address}</span>
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Phone size={11} style={{ color: 'var(--color-muted)' }} />
                              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{org.phone}</span>
                            </span>
                          </div>
                        }
                        badge={
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Tag variant={org.lifecycleStatus === '待启用' ? 'warning' : 'success'}>{org.lifecycleStatus}</Tag>
                            <ProgressBar value={rate} color={rate >= 90 ? 'danger' : rate >= 70 ? 'warning' : 'success'} showLabel size="sm" />
                            <span className="text-xs font-semibold" style={{ color: rate >= 90 ? 'var(--color-danger)' : rate >= 70 ? 'var(--color-warning)' : 'var(--color-success)', whiteSpace: 'nowrap' }}>
                              {org.occupiedBeds}/{org.totalBeds} 床
                            </span>
                          </div>
                        }
                        action={
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelectedId(isSelected ? null : org.id)} style={{ color: 'var(--color-muted)' }}>
                            <ChevronRight size={14} style={{ transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'transform 200ms ease' }} />
                          </button>
                        }
                      >
                        {isSelected ? (
                          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                              {[
                                { label: '房间数', value: `${org.roomCount} 间` },
                                { label: '总床位', value: `${org.totalBeds} 床` },
                                { label: '入住人数', value: `${org.occupiedBeds} 人` },
                                { label: '可调配床位', value: `${org.availableBeds} 床` },
                              ].map(item => (
                                <div key={item.label} style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--color-bg)', textAlign: 'center' }}>
                                  <div className="text-xs" style={{ color: 'var(--color-muted)', marginBottom: 3 }}>{item.label}</div>
                                  <div className="font-bold" style={{ color: 'var(--color-text)', fontSize: 15 }}>{item.value}</div>
                                </div>
                              ))}
                            </div>
                            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {org.lifecycleStatus === '待启用' ? (
                                <button className="btn btn-primary btn-sm" onClick={() => handleActivate(org.id)} disabled={activationId === org.id}>
                                  {activationId === org.id ? '启用中...' : '启用机构'}
                                </button>
                              ) : null}
                              <Link href={`/organizations/${org.id}`} className="btn btn-ghost btn-sm">查看详情 <ChevronRight size={12} /></Link>
                            </div>
                          </div>
                        ) : null}
                      </DataCard>
                    )
                  })}
                  </div>
              </>
            )}
          </>
        )}
        rail={(
          <>
            <DataCard icon={<Building2 size={16} />} title="经营上下文" subtitle="右侧只保留机构主档与容量事实边界。">
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">连锁机构：{totalStats.totalOrgs} 家，床位总量 {totalStats.totalBeds} 床。</div>
                <div className="page-help-card-item">平均入住率：{totalStats.avgOccupancy}%，待启用机构 {totalStats.pendingActivation} 家。</div>
                <div className="page-help-card-item">当前关注机构：{selectedOrganization?.name ?? '未选择'}。</div>
              </div>
            </DataCard>

            <DataCard icon={<Bot size={16} />} title="AI 机构摘要" subtitle="基于真实机构与房间聚合，只辅助经营判断。" badge={<Tag variant="info">Operations View</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                {aiInsights.map(item => (
                  <div key={item.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                        <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.summary}</div>
                      </div>
                      <Tag variant={item.variant}>{item.metric}</Tag>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.6, color: 'var(--color-text)' }}>{item.action}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <Link href={buildAiHref('organization-overview', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
              </div>
            </DataCard>

            <DataCard icon={<Building2 size={16} />} title="AI 调配建议" subtitle="强调容量缺口、待启用和 rooms 覆盖缺失。">
              <div style={{ display: 'grid', gap: 10 }}>
                {aiNarratives.map(item => (
                  <div key={item} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
                    {item}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <Link href={buildAiHref('organization-capacity', 'logs')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整说明迁到帮助页"
              summary="机构管理页首屏只保留真实机构主档、容量比较、待启用闭环和详情入口。"
              items={[
                '先看待启用与高入住率机构，再进入机构详情。',
                'AI 摘要只辅助比较真实容量压力，不替代管理判断。',
                '房间台账仍在 rooms 页面维护，机构页只做聚合和启用治理。',
              ]}
              href="/organizations/help"
              actionLabel="查看机构管理帮助"
            />
          </>
        )}
      />
    </div>
  )
}