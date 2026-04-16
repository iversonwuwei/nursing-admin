'use client'

import { DataCard, EmptyState, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { getOrganizationBedAiInsight, getOrganizationDetailAiInsight, getOrganizationStaffAiInsight } from '@/lib/mock/admin-ai'
import {
  activateOrganizationDraft,
  findLiveOrganizationById,
  getMasterDataSnapshot,
  getOrganizationStaffRecords,
  subscribeMasterDataWorkflow,
} from '@/lib/mock/master-data-workflow'
import { AlertTriangle, ArrowLeft, Bed, Bot, Building2, Users } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo, useState, useSyncExternalStore } from 'react'

const TABS = [
  { id: 'overview', label: '机构概览' },
  { id: 'beds', label: '床位管理' },
  { id: 'staff', label: '员工管理' },
]

export default function OrgDetailPage() {
  const params = useParams()
  const id = params.id as string
  const snapshot = useSyncExternalStore(
    subscribeMasterDataWorkflow,
    getMasterDataSnapshot,
    getMasterDataSnapshot,
  )
  const [activeTab, setActiveTab] = useState('overview')
  const orgRecord = useMemo(() => findLiveOrganizationById(id, snapshot), [id, snapshot])
  const staffData = useMemo(() => (orgRecord ? getOrganizationStaffRecords(orgRecord.id) : []), [orgRecord])
  const bedData = useMemo(() => {
    if (!orgRecord) {
      return []
    }

    const rooms = snapshot.rooms.filter(room => room.organizationId === orgRecord.id)
    return rooms.flatMap(room => room.bedsInfo.map((bed, index) => ({
      id: `${room.id}-${index + 1}`,
      room: `${room.id}-${index + 1}`,
      status: bed.status === 'occupied' ? 'occupied' : bed.status === 'maintenance' ? 'reserved' : 'available',
    })))
  }, [orgRecord, snapshot.rooms])

  if (!orgRecord) {
    return (
      <div className="animate-fade-up">
        <PageHeader
          title="机构不存在"
          subtitle={`未找到编号 ${id} 对应的机构对象。`}
          actions={<Link href="/organizations" className="btn btn-secondary btn-sm"><ArrowLeft size={13} />返回机构管理</Link>}
        />

        <EmptyState
          variant="search"
          title="当前机构对象不存在"
          description="请返回机构管理页重新选择对象，或检查当前路由是否仍指向已存在的机构。"
          action={<Link href="/organizations" className="btn btn-primary btn-sm">返回机构管理</Link>}
        />
      </div>
    )
  }

  const occupancy = orgRecord.totalBeds > 0 ? Math.round((orgRecord.occupiedBeds / orgRecord.totalBeds) * 100) : 0
  const orgData = {
    id: orgRecord.id,
    name: orgRecord.name,
    address: orgRecord.address,
    phone: orgRecord.phone,
    beds: orgRecord.totalBeds,
    occupied: orgRecord.occupiedBeds,
    staff: orgRecord.staffCount,
    manager: orgRecord.manager,
    established: orgRecord.establishedDate,
    area: orgRecord.description,
  }
  const aiInsight = getOrganizationDetailAiInsight(orgData)
  const reservedBeds = bedData.filter(item => item.status === 'reserved').length
  const availableBeds = bedData.filter(item => item.status === 'available').length
  const occupiedBeds = bedData.filter(item => item.status === 'occupied').length
  const bedAiInsight = getOrganizationBedAiInsight({
    name: orgData.name,
    occupied: occupiedBeds,
    reserved: reservedBeds,
    available: availableBeds,
  })
  const staffAiInsight = getOrganizationStaffAiInsight(staffData.map(item => ({ name: item.name, role: item.role, status: item.status })))
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: focus === 'staff-roster' ? 'organization-staff' : 'organization-detail',
    entityId: orgData.id,
    entityName: orgData.name,
    focus,
    target,
  })
  const staffActive = staffData.filter(item => item.status === '在职').length
  const caregivers = staffData.filter(item => item.role.includes('护工')).length
  const nurses = staffData.filter(item => item.role.includes('护士')).length
  const activeTabMeta = TABS.find(item => item.id === activeTab) ?? TABS[0]
  const activeInsight = activeTab === 'beds' ? bedAiInsight : activeTab === 'staff' ? staffAiInsight : aiInsight
  const activeInsightHref = activeTab === 'beds'
    ? buildAiHref('bed-turnover', 'inference')
    : activeTab === 'staff'
      ? buildAiHref('staff-roster', 'logs')
      : buildAiHref('overview-risk', 'inference')
  const activeInsightTag = activeTab === 'beds' ? 'Beds AI' : activeTab === 'staff' ? 'Staff AI' : 'Org AI'
  const consistencyWarnings = [
    ...(bedData.length !== orgRecord.totalBeds ? [`床位派生数 ${bedData.length} 与机构总床位 ${orgRecord.totalBeds} 不一致。`] : []),
    ...(orgRecord.lifecycleStatus !== '待启用' && staffData.length !== orgRecord.staffCount ? [`员工名册 ${staffData.length} 人与机构员工数 ${orgRecord.staffCount} 不一致。`] : []),
  ]

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={orgData.name}
        subtitle={`机构编号: ${orgData.id}`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/organizations" className="btn btn-secondary btn-sm">
              <ArrowLeft size={13} />返回
            </Link>
            {orgRecord.lifecycleStatus === '待启用' ? (
              <button className="btn btn-primary btn-sm" onClick={() => activateOrganizationDraft(orgRecord.id)}>
                启用机构
              </button>
            ) : null}
          </div>
        }
      />

      <InteractionRailLayout
        main={(
          <>
            <WorkflowOverviewCard
              eyebrow="Organization Detail"
              title={`${orgData.name} 对象总览`}
              description={`当前聚焦 ${activeTabMeta.label}。先确认机构状态、承接压力和当前对象事实，再进入对应台账继续核对。`}
              badge={<Tag variant={orgRecord.lifecycleStatus === '待启用' ? 'warning' : 'success'}>{orgRecord.lifecycleStatus}</Tag>}
              metrics={[
                { label: '生命周期', value: orgRecord.lifecycleStatus, hint: `当前状态 ${orgRecord.status}`, tone: orgRecord.lifecycleStatus === '待启用' ? 'warning' : 'success' },
                { label: '入住率', value: `${occupancy}%`, hint: `${orgData.occupied}/${orgData.beds} 床位使用`, tone: occupancy >= 90 ? 'danger' : occupancy >= 70 ? 'warning' : 'success' },
                { label: '可调配床位', value: availableBeds, hint: reservedBeds > 0 ? `预留 ${reservedBeds} 床` : '当前无预留床位', tone: availableBeds === 0 ? 'danger' : 'info' },
                { label: '员工名册', value: staffData.length, hint: `负责人 ${orgData.manager}`, tone: 'primary' },
              ]}
              signals={[
                { label: `当前工作区：${activeTabMeta.label}`, tone: 'info' },
                { label: orgRecord.lifecycleStatus === '待启用' ? '待启用机构仅保留启用动作，不开放无落点编辑入口。' : '当前详情页保持只读治理与对象下钻，不在这里展开额外流程。', tone: orgRecord.lifecycleStatus === '待启用' ? 'warning' : 'neutral' },
                ...(consistencyWarnings.length > 0 ? [{ label: `检测到 ${consistencyWarnings.length} 条对象一致性提示，请在后置区复核。`, tone: 'danger' as const }] : []),
              ]}
            />

            <div className="kpi-grid">
              <StatCard icon={<Bed size={18} />} label="床位总数" value={orgData.beds} sub="机构总床位" color="info" />
              <StatCard icon={<Users size={18} />} label="入住人数" value={orgData.occupied} sub="当前入住" color="success" />
              <StatCard icon={<Bed size={18} />} label="可用床位" value={availableBeds} sub={reservedBeds > 0 ? `预留 ${reservedBeds} 床` : '可立即承接'} color={availableBeds === 0 ? 'danger' : 'warning'} />
              <StatCard icon={<Building2 size={18} />} label="在岗员工" value={staffActive} sub={orgRecord.lifecycleStatus === '待启用' ? '启用后补录' : `名册 ${staffData.length} 人`} color="primary" />
            </div>

            <DataCard
              title="当前工作区"
              subtitle="详情页只保留当前对象事实和台账切换，说明与 AI 解释后置。"
              badge={<Tag variant="primary">{activeTabMeta.label}</Tag>}
            >
              <div className="detail-tab-row">
                {TABS.map(({ id: tabId, label }) => (
                  <button
                    key={tabId}
                    type="button"
                    className={`detail-tab${activeTab === tabId ? ' is-active' : ''}`}
                    onClick={() => setActiveTab(tabId)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 16, display: 'grid', gap: 16 }}>
                {activeTab === 'overview' ? (
                  <>
                    <div className="detail-fact-grid">
                      {[
                        { label: '机构名称', value: orgData.name, meta: `负责人 ${orgData.manager}` },
                        { label: '机构编号', value: orgData.id, meta: `联系电话 ${orgData.phone}` },
                        { label: '成立日期', value: orgData.established, meta: `地址 ${orgData.address}` },
                        { label: '机构说明', value: orgData.area, meta: orgRecord.activationNote ?? '当前未记录额外启用说明。' },
                      ].map(item => (
                        <div key={item.label} className="detail-fact-card">
                          <div className="detail-fact-label">{item.label}</div>
                          <div className="detail-fact-value">{item.value}</div>
                          <div className="detail-fact-meta">{item.meta}</div>
                        </div>
                      ))}
                    </div>

                    <div className="page-grid-2">
                      <div className="page-help-card-item">当前入住率 {occupancy}%，空床 {Math.max(0, orgData.beds - orgData.occupied)} 床。若准备接收新老人，优先核对空床和预留床位。</div>
                      <div className="page-help-card-item">机构生命周期为 {orgRecord.lifecycleStatus}。{orgRecord.lifecycleStatus === '待启用' ? '启用前只核对对象事实，不开放额外治理动作。' : '如需继续排查，请切换到床位或员工台账。'}</div>
                    </div>
                  </>
                ) : null}

                {activeTab === 'beds' ? (
                  <>
                    <div className="ledger-metric-grid">
                      {[
                        { title: '已入住床位', value: occupiedBeds, description: '当前已占用的床位数' },
                        { title: '预留床位', value: reservedBeds, description: '等待入住或维护中的床位' },
                        { title: '可用床位', value: availableBeds, description: '可立即承接的新空床位' },
                        { title: '床位总量', value: bedData.length, description: '派生自当前机构房间快照' },
                      ].map(item => (
                        <div key={item.title} className="ledger-metric-card">
                          <div className="ledger-metric-label">{item.title}</div>
                          <div className="ledger-metric-value">{item.value}</div>
                          <div className="ledger-metric-description">{item.description}</div>
                        </div>
                      ))}
                    </div>

                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr><th>房间号</th><th>状态</th></tr>
                        </thead>
                        <tbody>
                          {bedData.map(bed => (
                            <tr key={bed.id}>
                              <td><span className="font-semibold text-sm" style={{ fontFamily: 'monospace' }}>{bed.room}</span></td>
                              <td>
                                <Tag variant={bed.status === 'occupied' ? 'success' : bed.status === 'reserved' ? 'warning' : 'neutral'}>
                                  {bed.status === 'occupied' ? '已入住' : bed.status === 'reserved' ? '预留' : '可用'}
                                </Tag>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : null}

                {activeTab === 'staff' ? (
                  <>
                    <div className="ledger-metric-grid">
                      {[
                        { title: '员工名册', value: staffData.length, description: '当前机构员工快照总数' },
                        { title: '在岗员工', value: staffActive, description: '当前状态为在职的员工' },
                        { title: '护士人数', value: nurses, description: '需要优先看排班与护理密度' },
                        { title: '护工人数', value: caregivers, description: '执行端人力配置参考' },
                      ].map(item => (
                        <div key={item.title} className="ledger-metric-card">
                          <div className="ledger-metric-label">{item.title}</div>
                          <div className="ledger-metric-value">{item.value}</div>
                          <div className="ledger-metric-description">{item.description}</div>
                        </div>
                      ))}
                    </div>

                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr><th>姓名</th><th>职位</th><th>部门</th><th>联系电话</th><th>状态</th></tr>
                        </thead>
                        <tbody>
                          {staffData.map(staff => (
                            <tr key={staff.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div className="avatar avatar-sm" style={{ background: 'rgba(13,148,136,0.1)', color: 'var(--color-primary)' }}>
                                    {staff.name.slice(0, 1)}
                                  </div>
                                  <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{staff.name}</span>
                                </div>
                              </td>
                              <td><span className="text-sm">{staff.role}</span></td>
                              <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{staff.department}</span></td>
                              <td><span className="text-sm" style={{ fontFamily: 'monospace', fontSize: 12 }}>{staff.phone}</span></td>
                              <td><Tag variant="success">{staff.status}</Tag></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : null}
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard
              title="对象上下文"
              subtitle="状态、负责人和当前工作区后置展示，避免与台账争抢首屏。"
              badge={<Tag variant="info">Context</Tag>}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">机构状态：{orgRecord.status} · 生命周期：{orgRecord.lifecycleStatus}</div>
                <div className="page-help-card-item">负责人：{orgData.manager} · 联系电话：{orgData.phone}</div>
                <div className="page-help-card-item">当前查看 {activeTabMeta.label}，对象上下文始终固定为 {orgData.name}。</div>
              </div>
            </DataCard>

            {consistencyWarnings.length > 0 ? (
              <DataCard
                icon={<AlertTriangle size={16} />}
                title="一致性提示"
                subtitle="当前页继续可读，但建议先校验对象口径。"
                badge={<Tag variant="warning">Check</Tag>}
              >
                <div style={{ display: 'grid', gap: 10 }}>
                  {consistencyWarnings.map(item => (
                    <div key={item} className="page-help-card-item">{item}</div>
                  ))}
                </div>
              </DataCard>
            ) : null}

            <DataCard
              icon={<Bot size={16} />}
              title={activeInsight.title}
              subtitle="AI 解释后置展示，只辅助判断当前对象风险与动作优先级。"
              badge={<Tag variant={activeTab === 'overview' ? 'primary' : 'warning'}>{activeInsightTag}</Tag>}
            >
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
                  {activeInsight.summary}
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {activeInsight.actions.map(action => (
                    <div key={action} className="page-help-card-item">{action}</div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>置信度 {activeInsight.confidence}%</div>
                  <Link href={activeInsightHref} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
                </div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整说明继续承接到机构管理帮助页"
              summary="机构详情首屏只保留对象事实、当前台账和必要状态，长说明不再回流到当前页。"
              items={[
                '先确认机构是否待启用，再决定是否继续看床位或员工台账。',
                'AI 解释只辅助判断对象风险，不替代运营或人力决策。',
                '若对象不存在或口径不一致，应先返回机构管理重新核对。',
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
