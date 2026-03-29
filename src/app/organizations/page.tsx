'use client'

import { useState } from 'react'
import Link from 'next/link'
import { StatCard, DataCard, ProgressBar, PageHeader } from '@/components/nh'
import { organizations, totalStats } from '@/lib/data'
import { Building2, MapPin, Phone, ChevronRight, Bed, Users } from 'lucide-react'

export default function OrganizationsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const occRate = (o: typeof organizations[0]) =>
    o.totalBeds > 0 ? Math.round((o.occupiedBeds / o.totalBeds) * 100) : 0

  return (
    <div className="animate-fade-up">

      <PageHeader
        title="机构管理"
        subtitle={`共 ${organizations.length} 家连锁机构`}
        actions={
          <button className="btn btn-primary btn-sm">新增机构</button>
        }
      />

      <div className="kpi-grid">
        <StatCard icon={<Building2 size={18} />} label="机构总数" value={totalStats.totalOrgs} color="primary" />
        <StatCard icon={<Bed size={18} />} label="床位总数" value={totalStats.totalBeds} color="info" />
        <StatCard icon={<Users size={18} />} label="入住人数" value={totalStats.totalElderly} color="success" />
        <StatCard icon={<Building2 size={18} />} label="平均入住率" value={`${totalStats.avgOccupancy}%`} color="warning" />
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
                    <Link href={`/organizations/${org.id}`} className="btn btn-ghost btn-sm">
                      查看详情 <ChevronRight size={12} />
                    </Link>
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
