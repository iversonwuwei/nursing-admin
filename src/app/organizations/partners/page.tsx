'use client'

import { DataCard, EmptyState, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard } from '@/components/nh'
import { getCareScene, withSceneQuery } from '@/lib/care-scenes'
import {
  activatePartnerDraft,
  getMasterDataSnapshot,
  getPartnerStats,
  isAssessmentPartnerAgency,
  isServicePartnerAgency,
  subscribeMasterDataWorkflow,
} from '@/lib/mock/master-data-workflow'
import { getResourceSnapshot, subscribeResourceWorkflow } from '@/lib/mock/resource-workflow'
import { AlertTriangle, Building2, Handshake, Plus, ShieldCheck, UserCheck, Users } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState, useSyncExternalStore } from 'react'

export default function PartnerOrganizationsPage() {
  const searchParams = useSearchParams()
  const scene = getCareScene(searchParams.get('scene'))
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
  const sceneMeta = scene === 'home'
    ? {
      title: '居家定点机构协同',
      subtitle: `共 ${partners.length} 家定点机构，当前优先聚焦居家上门评定与护理服务承接`,
    }
    : scene === 'institutional'
      ? {
        title: '机构定点评估协同',
        subtitle: `共 ${partners.length} 家定点机构，当前优先聚焦院内认定协同与评估接口`,
      }
      : {
        title: '定点机构协同',
        subtitle: `共 ${partners.length} 家定点机构，其中评估机构 ${stats.assessmentPartners} 家、护理服务机构 ${stats.servicePartners} 家`,
      }
  const partnerSections = scene === 'home'
    ? [
      {
        key: 'service',
        title: '护理服务机构',
        subtitle: '优先承接居家第三方人员绑定、上门服务执行协同和结算对账。',
        badgeVariant: 'primary' as const,
        items: servicePartners,
        emptyTitle: '暂无护理服务机构',
        emptyDescription: '新增护理服务机构后，可绑定第三方员工和护工。',
      },
      {
        key: 'assessment',
        title: '评估机构',
        subtitle: '负责居家长护险评估认定、复评抽检和材料复核。',
        badgeVariant: 'info' as const,
        items: assessmentPartners,
        emptyTitle: '暂无评估机构',
        emptyDescription: '新增评估机构后，可在评估认定页引用。',
      },
    ]
    : [
      {
        key: 'assessment',
        title: '评估机构',
        subtitle: '负责长护险评估认定、复评抽检和材料复核，不进入执行人员绑定。',
        badgeVariant: 'info' as const,
        items: assessmentPartners,
        emptyTitle: '暂无评估机构',
        emptyDescription: '新增评估机构后，可在评估认定页引用。',
      },
      {
        key: 'service',
        title: '护理服务机构',
        subtitle: '负责第三方人员绑定、服务执行协同和结算对账。',
        badgeVariant: 'primary' as const,
        items: servicePartners,
        emptyTitle: '暂无护理服务机构',
        emptyDescription: '新增护理服务机构后，可绑定第三方员工和护工。',
      },
    ]

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
            <div className="detail-fact-grid">
              {[
                { label: '机构类型', value: partner.institutionType },
                { label: '联系人', value: `${partner.contactName} / ${partner.contactPhone}` },
                { label: '结算方式', value: partner.settlementMode },
                { label: '合同周期', value: `${partner.contractStart} 至 ${partner.contractEnd}` },
                { label: isAssessment ? '认定协同人员' : '关联人员', value: `${affiliations.staff} 人` },
                { label: isAssessment ? '执行绑定' : '关联护工', value: isAssessment ? '不参与排班绑定' : `${affiliations.caregivers} 人` },
              ].map(item => (
                <div key={item.label} className="detail-fact-card">
                  <div className="detail-fact-label">{item.label}</div>
                  <div className="detail-fact-value">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="page-help-card-item">{partner.description}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {partner.lifecycleStatus === '待启用' ? <button className="btn btn-primary btn-sm" onClick={() => activatePartnerDraft(partner.id)}>启用机构</button> : null}
              {isAssessment ? (
                <Link href={withSceneQuery('/elderly/checkin', scene)} className="btn btn-secondary btn-sm">查看评估认定</Link>
              ) : (
                  <Link href={withSceneQuery('/staff', scene, { partner: partner.id })} className="btn btn-secondary btn-sm">查看关联人员</Link>
              )}
            </div>
          </div>
        ) : null}
      </DataCard>
    )
  }

  const selectedPartnerAffiliations = selectedPartner ? getPartnerAffiliations(selectedPartner.id) : null
  const helpHref = withSceneQuery('/organizations/partners/help', scene)
  const collaborationWarnings = selectedPartner && selectedPartner.institutionType === '评估机构' && (selectedPartnerAffiliations?.caregivers ?? 0) > 0
    ? ['评估机构当前出现了执行护工关联，建议核对机构类型或人员归属。']
    : []

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={sceneMeta.title}
        subtitle={sceneMeta.subtitle}
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/organizations" className="btn btn-secondary btn-sm">机构管理</Link>
            <Link href="/organizations/partners/new" className="btn btn-primary btn-sm"><Plus size={13} />新增定点机构</Link>
          </div>
        }
      />

      <InteractionRailLayout
        main={(
          <>
            <WorkflowOverviewCard
              eyebrow="Partner Collaboration"
              title={sceneMeta.title}
              description={scene === 'home'
                ? '居家场景优先看护理服务机构是否能承接上门执行，再用评估机构补足认定协同。'
                : scene === 'institutional'
                  ? '机构场景优先看评估机构是否稳定承接认定，再检查护理服务机构的人力绑定能力。'
                  : '当前页先给出协同池总览，再按机构类型下钻具体协同对象。'}
              badge={<Tag variant="primary">Scene First</Tag>}
              metrics={[
                { label: '定点机构', value: stats.totalPartners, hint: '当前协同池总量', tone: 'primary' },
                { label: '评估机构', value: stats.assessmentPartners, hint: '仅参与认定与复核', tone: 'info' },
                { label: '护理服务机构', value: stats.servicePartners, hint: `${stats.activeServicePartners} 家已启用`, tone: 'success' },
                { label: '协同人员', value: linkedStaff.length, hint: `其中护工 ${linkedCaregivers.length} 人`, tone: 'warning' },
              ]}
              signals={[
                { label: scene === 'home' ? '当前是居家协同视角，优先看护理服务机构的承接与执行绑定。' : scene === 'institutional' ? '当前是机构协同视角，优先看评估机构的认定支持能力。' : '当前是通用协同视角，先看场景总览再展开对象。', tone: 'info' },
                { label: selectedPartner ? `当前聚焦：${selectedPartner.name}` : '当前未选择具体协同机构', tone: selectedPartner ? 'primary' : 'neutral' },
                ...(stats.totalPartners === 0 ? [{ label: '当前无定点机构，需先完成新增后再进入协同闭环。', tone: 'warning' as const }] : []),
              ]}
            />

            <div className="kpi-grid">
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
                    <Link href={selectedPartner.institutionType === '评估机构' ? withSceneQuery('/elderly/checkin', scene) : withSceneQuery('/staff', scene, { partner: selectedPartner.id })} className="btn btn-secondary btn-sm">{selectedPartner.institutionType === '评估机构' ? '查看评估认定' : '查看关联人员'}</Link>
                  )}
                </div>
              </DataCard>
            ) : null}

            {partners.length === 0 ? (
              <EmptyState title="暂无定点机构" description="先创建评估机构或护理服务机构，再进入认定协同或人员绑定。" />
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {partnerSections.map(section => (
                  <DataCard key={section.key} title={section.title} subtitle={section.subtitle} badge={<Tag variant={section.badgeVariant}>{section.items.length} 家</Tag>}>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {section.items.length === 0 ? <EmptyState title={section.emptyTitle} description={section.emptyDescription} /> : section.items.map(renderPartnerCard)}
                    </div>
                  </DataCard>
                ))}
              </div>
            )}
          </>
        )}
        rail={(
          <>
            <DataCard
              title="协同上下文"
              subtitle="首屏后置显示当前场景、对象焦点和下一步处理入口。"
              badge={<Tag variant="info">Context</Tag>}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">当前场景：{scene === 'home' ? '居家协同' : scene === 'institutional' ? '机构协同' : '通用协同'}。</div>
                <div className="page-help-card-item">当前聚焦：{selectedPartner ? `${selectedPartner.name} · ${selectedPartner.institutionType}` : '未选择具体机构，先从对象池展开查看。'}</div>
                <div className="page-help-card-item">下一步优先动作：{selectedPartner ? selectedPartner.institutionType === '评估机构' ? '进入评估认定闭环' : '检查关联人员与执行绑定' : '先按场景选择目标机构类型'}</div>
              </div>
            </DataCard>

            {selectedPartner && selectedPartnerAffiliations ? (
              <DataCard
                icon={<Building2 size={16} />}
                title="当前选中机构摘要"
                subtitle="对象事实与协同边界后置展示，不再塞回对象卡首屏。"
                badge={<Tag variant={selectedPartner.institutionType === '评估机构' ? 'info' : 'primary'}>{selectedPartner.institutionType}</Tag>}
              >
                <div style={{ display: 'grid', gap: 10 }}>
                  <div className="page-help-card-item">联系人：{selectedPartner.contactName} · {selectedPartner.contactPhone}</div>
                  <div className="page-help-card-item">服务区域：{selectedPartner.serviceArea} · 结算方式：{selectedPartner.settlementMode}</div>
                  <div className="page-help-card-item">关联人员：{selectedPartnerAffiliations.staff} 人{selectedPartner.institutionType === '评估机构' ? '，不参与执行绑定。' : `，其中护工 ${selectedPartnerAffiliations.caregivers} 人。`}</div>
                </div>
              </DataCard>
            ) : null}

            {collaborationWarnings.length > 0 ? (
              <DataCard
                icon={<AlertTriangle size={16} />}
                title="协同口径提示"
                subtitle="检测到机构类型与执行绑定边界可能冲突。"
                badge={<Tag variant="warning">Check</Tag>}
              >
                <div style={{ display: 'grid', gap: 10 }}>
                  {collaborationWarnings.map(item => (
                    <div key={item} className="page-help-card-item">{item}</div>
                  ))}
                </div>
              </DataCard>
            ) : null}

            <DataCard
              title="协同边界"
              subtitle="角色边界后置保留，避免对象池内重复展开长说明。"
              badge={<Tag variant="warning">Boundary</Tag>}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">评估机构只负责认定、复评和材料复核，不进入执行护工排班。</div>
                <div className="page-help-card-item">护理服务机构负责第三方人员绑定、服务执行协同和月结对账。</div>
                <div className="page-help-card-item">首页只保留对象池与展开入口，完整协同口径迁移到帮助页。</div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整协同说明迁移到显式帮助页"
              summary="定点机构协同页现在只保留场景总览、对象池和展开入口，角色边界与培训性说明统一后置。"
              items={[
                '先按场景判断优先关注评估机构还是护理服务机构。',
                '再展开具体机构，看启用状态、联系人和关联人员。',
                '若需要完整角色边界和协同口径，进入帮助页查看。',
              ]}
              href={helpHref}
              actionLabel="查看定点机构帮助"
            />
          </>
        )}
      />
    </div>
  )
}