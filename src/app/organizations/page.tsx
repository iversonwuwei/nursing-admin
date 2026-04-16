'use client'

import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, ProgressBar, StatCard, Tag, WorkflowOverviewCard } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { getOrganizationAiInsights, getOrganizationAiNarratives } from '@/lib/mock/admin-ai'
import { activateOrganizationDraft, getMasterDataSnapshot, getOrganizationStats, subscribeMasterDataWorkflow } from '@/lib/mock/master-data-workflow'
import { Bed, Bot, Building2, ChevronRight, MapPin, Phone, Users } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState, useSyncExternalStore } from 'react'

function getOccupancyRate(organization: {
  totalBeds: number
  occupiedBeds: number
}) {
  return organization.totalBeds > 0 ? Math.round((organization.occupiedBeds / organization.totalBeds) * 100) : 0
}

export default function OrganizationsPage() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('selected')
  const fromNew = searchParams.get('entry') === 'organizations-new'
  const snapshot = useSyncExternalStore(
    subscribeMasterDataWorkflow,
    getMasterDataSnapshot,
    getMasterDataSnapshot,
  )
  const organizations = snapshot.organizations
  const totalStats = useMemo(() => getOrganizationStats(organizations), [organizations])
  const [selectedId, setSelectedId] = useState<string | null>(preselectedId)
  const selectedOrganization = useMemo(
    () => organizations.find(item => item.id === selectedId) ?? organizations.find(item => item.id === preselectedId) ?? null,
    [organizations, preselectedId, selectedId],
  )
  const aiInsights = getOrganizationAiInsights(organizations)
  const aiNarratives = getOrganizationAiNarratives(organizations)
  const pendingActivationCount = organizations.filter(item => item.lifecycleStatus === '待启用').length
  const prioritizedOrganizations = useMemo(() => [...organizations].sort((left, right) => {
    const leftPending = left.lifecycleStatus === '待启用' ? 1 : 0
    const rightPending = right.lifecycleStatus === '待启用' ? 1 : 0
    if (rightPending !== leftPending) {
      return rightPending - leftPending
    }

    return getOccupancyRate(right) - getOccupancyRate(left)
  }), [organizations])
  const attentionOrganizations = prioritizedOrganizations.slice(0, 3)
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'organizations-list',
    entityId: 'org-board',
    entityName: '机构管理',
    focus,
    target,
  })

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="机构管理"
        subtitle={`共 ${organizations.length} 家连锁机构`}
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
                ? `${selectedOrganization.address} · 负责人 ${selectedOrganization.manager}。当前页面把机构生命周期、床位承接、入住密度和经营关注点收敛到同一页，方便总部视角快速比较。`
                : '机构页当前同时承担经营盘点、资源对比和新机构启用闭环。'}
              badge={selectedOrganization ? <Tag variant={selectedOrganization.lifecycleStatus === '待启用' ? 'warning' : 'success'}>{selectedOrganization.lifecycleStatus}</Tag> : <Tag variant="info">Chain Overview</Tag>}
              metrics={[
                { label: '机构总数', value: totalStats.totalOrgs, hint: '当前连锁机构总盘子', tone: 'primary' },
                { label: '平均入住率', value: `${totalStats.avgOccupancy}%`, hint: `总床位 ${totalStats.totalBeds}`, tone: totalStats.avgOccupancy >= 90 ? 'danger' : totalStats.avgOccupancy >= 75 ? 'warning' : 'success' },
                { label: '待启用机构', value: pendingActivationCount, hint: '完成复核后再纳入经营台账', tone: pendingActivationCount > 0 ? 'warning' : 'success' },
                { label: '当前选中机构', value: selectedOrganization?.name ?? '未选择', hint: selectedOrganization ? `${selectedOrganization.occupiedBeds}/${selectedOrganization.totalBeds} 床位使用` : '可展开下方机构查看详情', tone: selectedOrganization ? 'info' : 'neutral' },
              ]}
              signals={[
                { label: pendingActivationCount > 0 ? `待启用机构 ${pendingActivationCount} 家` : '当前无待启用机构', tone: pendingActivationCount > 0 ? 'warning' : 'success' },
                ...(attentionOrganizations[0] ? [{ label: `最高承接压力：${attentionOrganizations[0].name}`, tone: getOccupancyRate(attentionOrganizations[0]) >= 90 ? 'danger' as const : 'info' as const }] : []),
                ...(selectedOrganization ? [{ label: `当前查看：${selectedOrganization.manager} 负责`, tone: 'neutral' as const }] : []),
              ]}
              actions={
                <>
                  <Link href="/organizations/new" className="btn btn-secondary btn-sm">新增机构</Link>
                  <Link href="/organizations/partners" className="btn btn-secondary btn-sm">查看定点机构</Link>
                </>
              }
            />

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
                    当前机构状态为 {selectedOrganization.status}，床位数 {selectedOrganization.totalBeds}，负责人 {selectedOrganization.manager}。
                  </div>
                  {selectedOrganization.lifecycleStatus === '待启用' ? (
                    <button className="btn btn-primary btn-sm" onClick={() => activateOrganizationDraft(selectedOrganization.id)}>
                      启用机构
                    </button>
                  ) : (
                    <Link href={`/organizations/${selectedOrganization.id}`} className="btn btn-secondary btn-sm">查看详情</Link>
                  )}
                </div>
              </DataCard>
            ) : null}

            <DataCard
              icon={<Building2 size={16} />}
              title="优先关注机构"
              subtitle="按生命周期和承接压力排序，先暴露需要总部干预或快速启用的机构。"
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
                        {org.address} · 负责人 {org.manager} · 员工 {org.staffCount} 人
                      </div>
                      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, color: 'var(--color-text)' }}>
                        <span>{org.occupiedBeds}/{org.totalBeds} 床位</span>
                        <span>{org.totalBeds - org.occupiedBeds} 床空余</span>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 2 }}>
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
                            { label: '总床位', value: `${org.totalBeds} 床` },
                            { label: '入住人数', value: `${org.occupiedBeds} 人` },
                            { label: '空床位', value: `${org.totalBeds - org.occupiedBeds} 床` },
                            { label: '员工数', value: `${org.staffCount} 人` },
                          ].map(item => (
                            <div key={item.label} style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--color-bg)', textAlign: 'center' }}>
                              <div className="text-xs" style={{ color: 'var(--color-muted)', marginBottom: 3 }}>{item.label}</div>
                              <div className="font-bold" style={{ color: 'var(--color-text)', fontSize: 15 }}>{item.value}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {org.lifecycleStatus === '待启用' ? (
                            <button className="btn btn-primary btn-sm" onClick={() => activateOrganizationDraft(org.id)}>
                              启用机构
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
        rail={(
          <>
            <DataCard icon={<Building2 size={16} />} title="经营上下文" subtitle="右侧只保留总部判断所需的最小经营边界。">
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">连锁机构：{totalStats.totalOrgs} 家，床位总量 {totalStats.totalBeds} 床。</div>
                <div className="page-help-card-item">平均入住率：{totalStats.avgOccupancy}%，待启用机构 {pendingActivationCount} 家。</div>
                <div className="page-help-card-item">当前关注机构：{selectedOrganization?.name ?? '未选择'}。</div>
              </div>
            </DataCard>

            <DataCard icon={<Bot size={16} />} title="AI 机构摘要" subtitle="帮助管理层看见机构承接压力与人员配置密度，不替代经营判断。" badge={<Tag variant="info">Operations View</Tag>}>
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

            <DataCard icon={<Building2 size={16} />} title="AI 调配建议" subtitle="强调机构间资源不均衡，而不是只展示总量。">
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
              summary="机构管理页首屏只保留经营比较、优先关注队列和机构详情展开，完整口径、总部判断顺序和 AI 边界迁到帮助页。"
              items={[
                '先看待启用与高入住率机构，再进入机构详情。',
                'AI 摘要只辅助比较经营压力，不替代管理判断。',
                '机构启用、详情展开和定点机构切换仍是主工作区动作。',
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