'use client'

import { DataCard, EmptyState, PageHeader, StatCard, Tag } from '@/components/nh'
import {
  activatePartnerDraft,
  getMasterDataSnapshot,
  getPartnerStats,
  isAssessmentPartnerAgency,
  isServicePartnerAgency,
  subscribeMasterDataWorkflow,
} from '@/lib/mock/master-data-workflow'
import { getResourceSnapshot, subscribeResourceWorkflow } from '@/lib/mock/resource-workflow'
import { Building2, Handshake, Plus, ShieldCheck, UserCheck, Users } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState, useSyncExternalStore } from 'react'

export default function PartnerOrganizationsPage() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('selected')
  const fromNew = searchParams.get('entry') === 'partners-new'
  const masterSnapshot = useSyncExternalStore(
    subscribeMasterDataWorkflow,
    getMasterDataSnapshot,
    getMasterDataSnapshot,
  )
  const resourceSnapshot = useSyncExternalStore(
    subscribeResourceWorkflow,
    getResourceSnapshot,
    getResourceSnapshot,
  )
  const partners = masterSnapshot.partners
  const stats = useMemo(() => getPartnerStats(partners), [partners])
  const assessmentPartners = useMemo(() => partners.filter(isAssessmentPartnerAgency), [partners])
  const servicePartners = useMemo(() => partners.filter(isServicePartnerAgency), [partners])
  const linkedStaff = resourceSnapshot.staff.filter(item => item.employmentSource === '第三方合作')
  const linkedCaregivers = linkedStaff.filter(item => item.role.includes('护工'))
  const [selectedId, setSelectedId] = useState<string | null>(preselectedId)
  const selectedPartner = useMemo(
    () => partners.find(item => item.id === selectedId) ?? partners.find(item => item.id === preselectedId) ?? null,
    [partners, preselectedId, selectedId],
  )

  function getPartnerAffiliations(id: string) {
    const records = linkedStaff.filter(item => item.partnerAgencyId === id)
    return {
      staff: records.length,
      caregivers: records.filter(item => item.role.includes('护工')).length,
    }
  }

  function getInstitutionTypeVariant(type: string) {
    return type === '评估机构' ? 'info' : 'primary'
  }

  function renderPartnerCard(partner: typeof partners[number]) {
    const affiliations = getPartnerAffiliations(partner.id)
    const isSelected = selectedId === partner.id
    const isAssessment = partner.institutionType === '评估机构'

    return (
      <DataCard
        key={partner.id}
        icon={<Building2 size={16} />}
        title={partner.name}
        subtitle={`${partner.institutionType} · ${partner.serviceType} · ${partner.serviceArea}`}
        badge={(
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Tag variant={getInstitutionTypeVariant(partner.institutionType)}>{partner.institutionType}</Tag>
            <Tag variant={partner.lifecycleStatus === '待启用' ? 'warning' : 'success'}>{partner.lifecycleStatus}</Tag>
            <Tag variant={partner.status === '合作中' ? 'primary' : partner.status === '暂停合作' ? 'danger' : 'neutral'}>{partner.status}</Tag>
          </div>
        )}
        action={<button className="btn btn-ghost btn-sm" onClick={() => setSelectedId(isSelected ? null : partner.id)}>{isSelected ? '收起' : '展开'}</button>}
      >
        {isSelected ? (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)', display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              {[
                { label: '机构类型', value: partner.institutionType },
                { label: '联系人', value: `${partner.contactName} / ${partner.contactPhone}` },
                { label: '结算方式', value: partner.settlementMode },
                { label: '合同周期', value: `${partner.contractStart} 至 ${partner.contractEnd}` },
                { label: isAssessment ? '认定协同人员' : '关联人员', value: `${affiliations.staff} 人` },
                { label: isAssessment ? '执行绑定' : '关联护工', value: isAssessment ? '不参与排班绑定' : `${affiliations.caregivers} 人` },
              ].map(item => (
                <div key={item.label} style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--color-bg)' }}>
                  <div className="text-xs" style={{ color: 'var(--color-muted)', marginBottom: 3 }}>{item.label}</div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{partner.description}</div>
            <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--color-bg)', fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
              {isAssessment
                ? '评估机构仅参与长护险资格认定、复评和材料复核，不应进入护工排班或执行人员绑定。'
                : '护理服务机构可进入第三方人员绑定、服务计划执行和月结对账链路。'}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {partner.lifecycleStatus === '待启用' ? <button className="btn btn-primary btn-sm" onClick={() => activatePartnerDraft(partner.id)}>启用机构</button> : null}
              {isAssessment ? (
                <Link href="/elderly/checkin" className="btn btn-secondary btn-sm">查看评估认定</Link>
              ) : (
                <Link href={`/staff?partner=${partner.id}`} className="btn btn-secondary btn-sm">查看关联人员</Link>
              )}
            </div>
          </div>
        ) : null}
      </DataCard>
    )
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="定点机构协同"
        subtitle={`共 ${partners.length} 家定点机构，其中评估机构 ${stats.assessmentPartners} 家、护理服务机构 ${stats.servicePartners} 家`}
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/organizations" className="btn btn-secondary btn-sm">机构管理</Link>
            <Link href="/organizations/partners/new" className="btn btn-primary btn-sm"><Plus size={13} />新增定点机构</Link>
          </div>
        }
      />

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard icon={<Handshake size={18} />} label="定点机构" value={stats.totalPartners} color="primary" />
        <StatCard icon={<ShieldCheck size={18} />} label="评估机构" value={stats.assessmentPartners} sub="仅参与认定复核" color="info" />
        <StatCard icon={<UserCheck size={18} />} label="护理服务机构" value={stats.servicePartners} sub={`${stats.activeServicePartners} 家已启用`} color="success" />
        <StatCard icon={<Users size={18} />} label="服务协同人员" value={linkedStaff.length} sub={`其中护工 ${linkedCaregivers.length} 人`} color="warning" />
      </div>

      {selectedPartner && fromNew ? (
        <DataCard
          title="来自新增定点机构页"
          subtitle={`${selectedPartner.name} 已进入待启用闭环。${selectedPartner.institutionType === '评估机构' ? '启用后将进入认定协同池。' : '启用后才能给第三方员工或护工绑定。'}`}
          badge={<Tag variant={selectedPartner.lifecycleStatus === '待启用' ? 'warning' : 'success'}>{selectedPartner.lifecycleStatus}</Tag>}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
              当前机构类型为 {selectedPartner.institutionType}，合作类型 {selectedPartner.serviceType}，服务区域 {selectedPartner.serviceArea}，结算方式 {selectedPartner.settlementMode}。
            </div>
            {selectedPartner.lifecycleStatus === '待启用' ? (
              <button className="btn btn-primary btn-sm" onClick={() => activatePartnerDraft(selectedPartner.id)}>
                启用机构
              </button>
            ) : (
              <Link href={selectedPartner.institutionType === '评估机构' ? '/elderly/checkin' : `/staff?partner=${selectedPartner.id}`} className="btn btn-secondary btn-sm">{selectedPartner.institutionType === '评估机构' ? '查看评估认定' : '查看关联人员'}</Link>
            )}
          </div>
        </DataCard>
      ) : null}

      <div style={{ display: 'grid', gap: 16 }}>
        {partners.length === 0 ? (
          <EmptyState title="暂无定点机构" description="先创建评估机构或护理服务机构，再进入认定协同或人员绑定。" />
        ) : (
          <>
            <DataCard title="评估机构" subtitle="负责长护险评估认定、复评抽检和材料复核，不进入执行人员绑定。" badge={<Tag variant="info">{assessmentPartners.length} 家</Tag>}>
              <div style={{ display: 'grid', gap: 12 }}>
                {assessmentPartners.length === 0 ? <EmptyState title="暂无评估机构" description="新增评估机构后，可在评估认定页引用。" /> : assessmentPartners.map(renderPartnerCard)}
              </div>
            </DataCard>
            <DataCard title="护理服务机构" subtitle="负责第三方人员绑定、服务执行协同和结算对账。" badge={<Tag variant="primary">{servicePartners.length} 家</Tag>}>
              <div style={{ display: 'grid', gap: 12 }}>
                {servicePartners.length === 0 ? <EmptyState title="暂无护理服务机构" description="新增护理服务机构后，可绑定第三方员工和护工。" /> : servicePartners.map(renderPartnerCard)}
              </div>
            </DataCard>
          </>
        )}
      </div>
    </div>
  )
}