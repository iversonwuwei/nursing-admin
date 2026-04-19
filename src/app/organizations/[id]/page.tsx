'use client'

import { DataCard, EmptyState, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { activateAdminOrganization, fetchAdminOrganizationDetail, type AdminOrganizationDetail, type AdminOrganizationSummary } from '@/lib/organizations/admin-organization-api'
import { AlertTriangle, ArrowLeft, Bed, Bot, Building2, Users } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const TABS = [
  { id: 'overview', label: '机构概览' },
  { id: 'beds', label: '床位管理' },
  { id: 'staff', label: '员工管理' },
] as const

function getOccupancy(summary: Pick<AdminOrganizationSummary, 'totalBeds' | 'occupiedBeds'>) {
  return summary.totalBeds > 0 ? Math.round((summary.occupiedBeds / summary.totalBeds) * 100) : 0
}

function buildOverviewInsight(organization: AdminOrganizationSummary) {
  const occupancy = getOccupancy(organization)
  return {
    title: '机构风险摘要',
    summary: occupancy >= 90
      ? `${organization.name} 当前入住率 ${occupancy}%，可调配床位仅 ${organization.availableBeds} 床，需优先关注容量余量。`
      : `${organization.name} 当前入住率 ${occupancy}%，可调配床位 ${organization.availableBeds} 床，容量仍可承接新增入住。`,
    actions: [
      organization.lifecycleStatus === '待启用' ? '先完成机构启用，再继续下钻房间与执行台账。' : '继续核对容量趋势和待启用房间。',
      organization.roomCount === 0 ? '当前没有真实 rooms 数据，需先补齐房间台账。' : 'rooms 已接通，可继续查看房间与清洁状态。',
    ],
    confidence: organization.roomCount === 0 ? 62 : 88,
  }
}

function buildBedsInsight(organization: AdminOrganizationSummary, rooms: AdminOrganizationDetail['rooms']) {
  const pendingRooms = rooms.filter(room => room.status === '待启用').length
  const fullRooms = rooms.filter(room => room.status === '已满').length
  return {
    title: '床位承接摘要',
    summary: `${organization.name} 当前共有 ${rooms.length} 间房，已满 ${fullRooms} 间，待启用 ${pendingRooms} 间，可调配床位 ${organization.availableBeds} 床。`,
    actions: [
      pendingRooms > 0 ? '优先启用待启用房间，释放可计入口径的真实床位。' : '当前房间均已纳入真实台账，可继续观察清洁与入住节奏。',
      fullRooms > 0 ? '对已满房间关注退住和空床转换速度。' : '当前没有已满房间，容量风险相对可控。',
    ],
    confidence: rooms.length === 0 ? 58 : 90,
  }
}

function buildStaffInsight(organization: AdminOrganizationSummary, staff: AdminOrganizationDetail['staff']) {
  const pendingOnboarding = staff.filter(item => item.lifecycleStatus === '待入职').length
  const partnerStaff = staff.filter(item => item.employmentSource === '第三方合作').length
  return {
    title: '员工接入状态',
    summary: `${organization.name} 当前已绑定 ${staff.length} 名员工，其中待入职 ${pendingOnboarding} 名、第三方合作 ${partnerStaff} 名。`,
    actions: [
      staff.length === 0 ? '当前机构还没有已绑定员工，可从员工新建页直接带机构归属建档。' : '当前名册已来自真实 staffing 主档，可继续核对岗位、来源和待入职状态。',
      pendingOnboarding > 0 ? '优先复核待入职员工，避免机构员工数已纳入口径但尚未进入排班。' : '当前没有待入职员工，机构员工名册已处于稳定状态。',
    ],
    confidence: staff.length === 0 ? 82 : 93,
  }
}

export default function OrgDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('overview')
  const [detail, setDetail] = useState<AdminOrganizationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activationLoading, setActivationLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadDetail() {
      setLoading(true)
      setError('')

      try {
        const response = await fetchAdminOrganizationDetail(id)
        if (!active) {
          return
        }

        setDetail(response)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : '机构详情查询失败。')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadDetail()
    return () => {
      active = false
    }
  }, [id])

  const organization = detail?.organization ?? null
  const rooms = detail?.rooms ?? []
  const staffRecords = detail?.staff ?? []
  const occupancy = organization ? getOccupancy(organization) : 0
  const reservedBeds = rooms.filter(item => item.status === '待启用' || item.status === '维护中').reduce((sum, item) => sum + Math.max(0, item.capacity - item.occupied), 0)
  const availableBeds = organization?.availableBeds ?? 0
  const occupiedBeds = organization?.occupiedBeds ?? 0
  const activeTabMeta = TABS.find(item => item.id === activeTab) ?? TABS[0]
  const consistencyWarnings = organization ? [
    ...(organization.totalBeds !== rooms.reduce((sum, room) => sum + room.capacity, 0) ? ['机构床位汇总与房间容量汇总不一致。'] : []),
  ] : []

  const activeInsight = organization
    ? activeTab === 'beds'
      ? buildBedsInsight(organization, rooms)
      : activeTab === 'staff'
        ? buildStaffInsight(organization, staffRecords)
        : buildOverviewInsight(organization)
    : null

  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: activeTab === 'staff' ? 'organization-staff' : 'organization-detail',
    entityId: id,
    entityName: organization?.name ?? '机构详情',
    focus,
    target,
  })

  async function handleActivate() {
    if (!organization) {
      return
    }

    setActivationLoading(true)
    setError('')

    try {
      const updated = await activateAdminOrganization(organization.id)
      setDetail(current => current ? { ...current, organization: updated } : current)
    } catch (activationError) {
      setError(activationError instanceof Error ? activationError.message : '机构启用失败。')
    } finally {
      setActivationLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-up">
        <PageHeader title="机构详情" subtitle="正在加载真实机构详情与 rooms 聚合数据" actions={<Link href="/organizations" className="btn btn-secondary btn-sm"><ArrowLeft size={13} />返回机构管理</Link>} />
        <DataCard title="机构详情加载中" subtitle="当前从 organization service 与 rooms 聚合读取真实对象。" />
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="animate-fade-up">
        <PageHeader title="机构不存在" subtitle={`未找到编号 ${id} 对应的机构对象。`} actions={<Link href="/organizations" className="btn btn-secondary btn-sm"><ArrowLeft size={13} />返回机构管理</Link>} />
        <EmptyState
          variant="search"
          title="当前机构对象不存在"
          description={error || '请返回机构管理页重新选择对象，或检查当前路由是否仍指向已存在的机构。'}
          action={<Link href="/organizations" className="btn btn-primary btn-sm">返回机构管理</Link>}
        />
      </div>
    )
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={organization.name}
        subtitle={`机构编号: ${organization.id}`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/organizations" className="btn btn-secondary btn-sm">
              <ArrowLeft size={13} />返回
            </Link>
            {organization.lifecycleStatus === '待启用' ? (
              <button className="btn btn-primary btn-sm" onClick={handleActivate} disabled={activationLoading}>
                {activationLoading ? '启用中...' : '启用机构'}
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
              title={`${organization.name} 对象总览`}
              description={`当前聚焦 ${activeTabMeta.label}。详情页基于真实机构主档、房间台账和员工主档聚合，不再从本地 organizations workflow 派生床位或员工数据。`}
              badge={<Tag variant={organization.lifecycleStatus === '待启用' ? 'warning' : 'success'}>{organization.lifecycleStatus}</Tag>}
              metrics={[
                { label: '生命周期', value: organization.lifecycleStatus, hint: `当前状态 ${organization.status}`, tone: organization.lifecycleStatus === '待启用' ? 'warning' : 'success' },
                { label: '入住率', value: `${occupancy}%`, hint: `${organization.occupiedBeds}/${organization.totalBeds} 床位使用`, tone: occupancy >= 90 ? 'danger' : occupancy >= 70 ? 'warning' : 'success' },
                { label: '可调配床位', value: organization.availableBeds, hint: reservedBeds > 0 ? `待启用或维护 ${reservedBeds} 床` : '当前无待启用床位', tone: organization.availableBeds === 0 ? 'danger' : 'info' },
                { label: '房间台账', value: organization.roomCount, hint: `负责人 ${organization.manager}`, tone: 'primary' },
              ]}
              signals={[
                { label: `当前工作区：${activeTabMeta.label}`, tone: 'info' },
                { label: organization.lifecycleStatus === '待启用' ? '待启用机构仅保留启用动作，不开放无落点编辑入口。' : '当前详情页保持只读治理与对象下钻，不在这里展开额外流程。', tone: organization.lifecycleStatus === '待启用' ? 'warning' : 'neutral' },
                ...(consistencyWarnings.length > 0 ? [{ label: `检测到 ${consistencyWarnings.length} 条对象一致性提示，请在后置区复核。`, tone: 'danger' as const }] : []),
              ]}
            />

            {error ? (
              <DataCard title="机构链路提示" subtitle={error} badge={<Tag variant="warning">Live Error</Tag>} />
            ) : null}

            <div className="kpi-grid">
              <StatCard icon={<Bed size={18} />} label="床位总数" value={organization.totalBeds} sub="机构总床位" color="info" />
              <StatCard icon={<Users size={18} />} label="入住人数" value={occupiedBeds} sub="当前入住" color="success" />
              <StatCard icon={<Bed size={18} />} label="可用床位" value={availableBeds} sub={reservedBeds > 0 ? `待启用或维护 ${reservedBeds} 床` : '可立即承接'} color={availableBeds === 0 ? 'danger' : 'warning'} />
              <StatCard icon={<Building2 size={18} />} label="房间台账" value={organization.roomCount} sub={organization.roomCount === 0 ? '尚未建档' : '真实 rooms 聚合'} color="primary" />
            </div>

            <DataCard title="当前工作区" subtitle="详情页只保留当前对象事实和台账切换，说明与 AI 解释后置。" badge={<Tag variant="primary">{activeTabMeta.label}</Tag>}>
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
                        { label: '机构名称', value: organization.name, meta: `负责人 ${organization.manager}` },
                        { label: '机构编号', value: organization.id, meta: `联系电话 ${organization.phone}` },
                        { label: '成立日期', value: organization.establishedDate, meta: `地址 ${organization.address}` },
                        { label: '机构说明', value: organization.description, meta: organization.activationNote ?? '当前未记录额外启用说明。' },
                      ].map(item => (
                        <div key={item.label} className="detail-fact-card">
                          <div className="detail-fact-label">{item.label}</div>
                          <div className="detail-fact-value">{item.value}</div>
                          <div className="detail-fact-meta">{item.meta}</div>
                        </div>
                      ))}
                    </div>

                    <div className="page-grid-2">
                      <div className="page-help-card-item">当前入住率 {occupancy}%，空床 {organization.availableBeds} 床。若准备接收新老人，优先核对待启用房间和当前空床。</div>
                      <div className="page-help-card-item">机构生命周期为 {organization.lifecycleStatus}。{organization.lifecycleStatus === '待启用' ? '启用前只核对对象事实，不开放额外治理动作。' : '如需继续排查，请切换到床位或员工台账。'}</div>
                    </div>
                  </>
                ) : null}

                {activeTab === 'beds' ? (
                  <>
                    <div className="ledger-metric-grid">
                      {[
                        { title: '已入住床位', value: occupiedBeds, description: '当前真实已占用床位数' },
                        { title: '待启用或维护', value: reservedBeds, description: '待启用机构房间或维护中容量' },
                        { title: '可用床位', value: availableBeds, description: '可立即承接的新空床位' },
                        { title: '房间总量', value: rooms.length, description: '来自当前机构真实 rooms 台账' },
                      ].map(item => (
                        <div key={item.title} className="ledger-metric-card">
                          <div className="ledger-metric-label">{item.title}</div>
                          <div className="ledger-metric-value">{item.value}</div>
                          <div className="ledger-metric-description">{item.description}</div>
                        </div>
                      ))}
                    </div>

                    {rooms.length === 0 ? (
                      <EmptyState
                        variant="search"
                        title="当前机构还没有真实房间台账"
                        description="先到 rooms 页面或新增房间页完成建档，机构详情才会展示真实床位承接事实。"
                        action={<Link href="/rooms/new" className="btn btn-primary btn-sm">新增房间</Link>}
                      />
                    ) : (
                        <div className="table-wrap">
                          <table className="table">
                            <thead>
                              <tr><th>房间</th><th>楼层</th><th>房型</th><th>床位</th><th>状态</th><th>清洁</th></tr>
                            </thead>
                            <tbody>
                              {rooms.map(room => (
                                <tr key={room.roomId}>
                                  <td><span className="font-semibold text-sm" style={{ fontFamily: 'monospace' }}>{room.roomId}</span> {room.name}</td>
                                  <td><span className="text-sm">{room.floorName}</span></td>
                                  <td><span className="text-sm">{room.type}</span></td>
                                  <td><span className="text-sm">{room.occupied}/{room.capacity}</span></td>
                                  <td><Tag variant={room.status === '已满' ? 'danger' : room.status === '待启用' || room.status === '维护中' ? 'warning' : 'success'}>{room.status}</Tag></td>
                                  <td><Tag variant={room.cleanStatus === '已清洁' ? 'success' : 'warning'}>{room.cleanStatus}</Tag></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                    )}
                  </>
                ) : null}

                {activeTab === 'staff' ? (
                  <>
                    <div className="ledger-metric-grid">
                      {[
                        { title: '员工接入状态', value: organization.staffIntegrationStatus === 'live' ? '已接通' : '待接通', description: '当前机构员工归属字段接入状态' },
                        { title: '机构员工数', value: organization.staffCount, description: '当前真实已归属到机构的员工数' },
                        { title: '待入职', value: staffRecords.filter(item => item.lifecycleStatus === '待入职').length, description: '已归属机构但仍待人工确认入职' },
                        { title: '第三方合作', value: staffRecords.filter(item => item.employmentSource === '第三方合作').length, description: '当前机构合作来源员工数' },
                      ].map(item => (
                        <div key={item.title} className="ledger-metric-card">
                          <div className="ledger-metric-label">{item.title}</div>
                          <div className="ledger-metric-value">{item.value}</div>
                          <div className="ledger-metric-description">{item.description}</div>
                        </div>
                      ))}
                    </div>

                    {staffRecords.length === 0 ? (
                      <EmptyState
                        variant="default"
                        title="当前机构暂无已绑定员工"
                        description="可从员工新建页直接绑定该机构；只有写入真实 organization 归属的员工，才会出现在这里。"
                        action={<Link href={`/staff/new?organizationId=${encodeURIComponent(organization.id)}&organizationName=${encodeURIComponent(organization.name)}`} className="btn btn-primary btn-sm">新增机构员工</Link>}
                      />
                    ) : (
                        <div className="table-wrap">
                          <table className="table">
                            <thead>
                              <tr><th>姓名</th><th>岗位</th><th>部门</th><th>来源</th><th>状态</th><th>联系电话</th></tr>
                            </thead>
                            <tbody>
                              {staffRecords.map(staff => (
                                <tr key={staff.id}>
                                  <td>
                                  <Link href={`/staff/${staff.id}`} className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                                    {staff.name}
                                  </Link>
                                </td>
                                <td><span className="text-sm">{staff.role}</span></td>
                                <td><span className="text-sm">{staff.department}</span></td>
                                <td>
                                  <div style={{ display: 'grid', gap: 4 }}>
                                    <Tag variant={staff.employmentSource === '第三方合作' ? 'warning' : 'success'}>{staff.employmentSource}</Tag>
                                    {staff.partnerAgencyName ? <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{staff.partnerAgencyName}</span> : null}
                                  </div>
                                </td>
                                <td>
                                  <div style={{ display: 'grid', gap: 4 }}>
                                    <Tag variant={staff.lifecycleStatus === '待入职' ? 'warning' : staff.status === '休假' ? 'warning' : staff.status === '离职' ? 'danger' : 'success'}>{staff.lifecycleStatus === '待入职' ? '待入职' : staff.status}</Tag>
                                  </div>
                                </td>
                                <td><span className="text-sm">{staff.phone}</span></td>
                              </tr>
                            ))}
                            </tbody>
                          </table>
                        </div>
                    )}
                  </>
                ) : null}
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="对象上下文" subtitle="状态、负责人和当前工作区后置展示，避免与台账争抢首屏。" badge={<Tag variant="info">Context</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">机构状态：{organization.status} · 生命周期：{organization.lifecycleStatus}</div>
                <div className="page-help-card-item">负责人：{organization.manager} · 联系电话：{organization.phone}</div>
                <div className="page-help-card-item">当前查看 {activeTabMeta.label}，对象上下文始终固定为 {organization.name}。</div>
              </div>
            </DataCard>

            {consistencyWarnings.length > 0 ? (
              <DataCard icon={<AlertTriangle size={16} />} title="一致性提示" subtitle="当前页继续可读，但建议先校验对象口径。" badge={<Tag variant="warning">Check</Tag>}>
                <div style={{ display: 'grid', gap: 10 }}>
                  {consistencyWarnings.map(item => (
                    <div key={item} className="page-help-card-item">{item}</div>
                  ))}
                </div>
              </DataCard>
            ) : null}

            {activeInsight ? (
              <DataCard icon={<Bot size={16} />} title={activeInsight.title} subtitle="AI 解释后置展示，只辅助判断当前对象风险与动作优先级。" badge={<Tag variant={activeTab === 'overview' ? 'primary' : 'warning'}>{activeTab === 'overview' ? 'Org AI' : activeTab === 'beds' ? 'Beds AI' : 'Staff AI'}</Tag>}>
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
                    <Link href={activeTab === 'beds' ? buildAiHref('bed-turnover', 'inference') : activeTab === 'staff' ? buildAiHref('staff-roster', 'logs') : buildAiHref('overview-risk', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
                  </div>
                </div>
              </DataCard>
            ) : null}

            <PageHelpCard
              title="页面帮助"
              subtitle="完整说明继续承接到机构管理帮助页"
              summary="机构详情首屏只保留对象事实、真实房间台账和必要状态，长说明不再回流到当前页。"
              items={[
                '先确认机构是否待启用，再决定是否继续看床位或员工台账。',
                'AI 解释只辅助判断对象风险，不替代运营或人力决策。',
                '员工 tab 现在直接展示真实机构员工名册，不再回退本地 mock。',
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
