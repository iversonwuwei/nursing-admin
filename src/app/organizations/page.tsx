'use client'

import { DataCard, PageHeader, ProgressBar, StatCard, Tag } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { getOrganizationAiInsights, getOrganizationAiNarratives } from '@/lib/mock/admin-ai'
import { activateOrganizationDraft, getMasterDataSnapshot, getOrganizationStats, subscribeMasterDataWorkflow } from '@/lib/mock/master-data-workflow'
import { Bed, Bot, Building2, ChevronRight, MapPin, Phone, Users } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState, useSyncExternalStore } from 'react'

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
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'organizations-list',
    entityId: 'org-board',
    entityName: '机构管理',
    focus,
    target,
  })

  const occRate = (o: typeof organizations[0]) =>
    o.totalBeds > 0 ? Math.round((o.occupiedBeds / o.totalBeds) * 100) : 0

  return (
    <div className="animate-fade-up">

      <PageHeader
        title="机构管理"
        subtitle={`共 ${organizations.length} 家连锁机构`}
        actions={
          <Link href="/organizations/new" className="btn btn-primary btn-sm">新增机构</Link>
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

      <div className="dashboard-grid-2" style={{ marginBottom: 16 }}>
        <DataCard
          icon={<Bot size={16} />}
          title="AI 机构摘要"
          subtitle="帮助管理层看见机构承接压力与人员配置密度，不替代经营判断。"
          badge={<Tag variant="info">Operations View</Tag>}
        >
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

        <DataCard
          icon={<Building2 size={16} />}
          title="AI 调配建议"
          subtitle="强调机构间资源不均衡，而不是只展示总量。"
        >
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
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {organizations.map(org => {
          const rate = occRate(org)
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
                  <ProgressBar
                    value={rate}
                    color={rate >= 90 ? 'danger' : rate >= 70 ? 'warning' : 'success'}
                    showLabel
                    size="sm"
                  />
                  <span className="text-xs font-semibold" style={{
                    color: rate >= 90 ? 'var(--color-danger)' : rate >= 70 ? 'var(--color-warning)' : 'var(--color-success)',
                    whiteSpace: 'nowrap',
                  }}>
                    {org.occupiedBeds}/{org.totalBeds} 床
                  </span>
                </div>
              }
              action={
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => setSelectedId(isSelected ? null : org.id)}
                  style={{ color: 'var(--color-muted)' }}
                >
                  <ChevronRight size={14} style={{ transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'transform 200ms ease' }} />
                </button>
              }
            >
              {isSelected && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                    {[
                      { label: '总床位', value: `${org.totalBeds} 床` },
                      { label: '入住人数', value: `${org.occupiedBeds} 人` },
                      { label: '空床位', value: `${org.totalBeds - org.occupiedBeds} 床` },
                      { label: '员工数', value: `${org.staffCount} 人` },
                    ].map(item => (
                      <div key={item.label} style={{
                        padding: '10px 12px', borderRadius: 10,
                        background: 'var(--color-bg)', textAlign: 'center',
                      }}>
                        <div className="text-xs" style={{ color: 'var(--color-muted)', marginBottom: 3 }}>{item.label}</div>
                        <div className="font-bold" style={{ color: 'var(--color-text)', fontSize: 15 }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {org.lifecycleStatus === '待启用' ? (
                        <button className="btn btn-primary btn-sm" onClick={() => activateOrganizationDraft(org.id)}>
                          启用机构
                        </button>
                      ) : null}
                      <Link href={`/organizations/${org.id}`} className="btn btn-ghost btn-sm">
                        查看详情 <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </DataCard>
          )
        })}
      </div>

    </div>
  )
}
