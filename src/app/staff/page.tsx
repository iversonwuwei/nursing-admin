'use client'

import { DataCard, EmptyState, FilterBar, FilterItem, InteractionRailLayout, PageHeader, PageHelpCard, Pagination, StatCard, Tag, WorkflowOverviewCard, type TagVariant } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { getStaffAiInsights, getStaffAiNarratives } from '@/lib/mock/admin-ai'
import { getMasterDataSnapshot, subscribeMasterDataWorkflow } from '@/lib/mock/master-data-workflow'
import { confirmStaffOnboarding, getResourceSnapshot, subscribeResourceWorkflow } from '@/lib/mock/resource-workflow'
import { sortStaffByPriority } from '@/lib/resource-operations-priority'
import { Bot, Building2, Plus, Search, ShieldCheck, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState, useSyncExternalStore } from 'react'

const ROLE_TAG: Record<string, TagVariant> = {
  '护理主管': 'primary', '护士': 'info', '后勤主管': 'warning',
  '心理咨询师': 'purple', '厨师长': 'neutral', '护工': 'success', '康复师': 'info',
}
const STATUS_TAG: Record<string, TagVariant> = { '在职': 'success', '休假': 'warning', '离职': 'danger', '待入职': 'info' }
const SOURCE_TAG: Record<string, TagVariant> = { '自营': 'primary', '第三方合作': 'warning' }

export default function StaffPage() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('selected')
  const fromNew = searchParams.get('entry') === 'staff-new'
  const preselectedPartnerId = searchParams.get('partner') ?? ''
  const scene = searchParams.get('scene')
  const snapshot = useSyncExternalStore(
    subscribeResourceWorkflow,
    getResourceSnapshot,
    getResourceSnapshot,
  )
  const masterSnapshot = useSyncExternalStore(
    subscribeMasterDataWorkflow,
    getMasterDataSnapshot,
    getMasterDataSnapshot,
  )
  const staff = snapshot.staff
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState(scene === 'home' ? '第三方合作' : '')
  const [partnerFilter, setPartnerFilter] = useState(preselectedPartnerId)
  const [page, setPage] = useState(1)
  const pageSize = 10
  const departments = [...new Set(staff.map(item => item.department))]
  const activePartners = masterSnapshot.partners.filter(item => item.lifecycleStatus === '已启用' && item.institutionType === '护理服务机构')
  const selectedStaff = useMemo(
    () => staff.find(item => item.id === preselectedId) ?? null,
    [preselectedId, staff],
  )
  const selectedPartner = activePartners.find(item => item.id === partnerFilter) ?? null
  const aiInsights = getStaffAiInsights(staff)
  const aiNarratives = getStaffAiNarratives(staff)
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'staff-list',
    entityId: 'staff-board',
    entityName: '员工列表',
    focus,
    target,
  })

  const filtered = staff.filter(item => {
    if (search && !item.name.includes(search) && !item.id.includes(search)) return false
    if (deptFilter && item.department !== deptFilter) return false
    if (sourceFilter && item.employmentSource !== sourceFilter) return false
    if (partnerFilter && item.partnerAgencyId !== partnerFilter) return false
    return true
  })
  const activeStaffCount = staff.filter(item => item.status === '在职').length
  const pendingOnboardingCount = staff.filter(item => item.lifecycleStatus === '待入职').length
  const partnerStaffCount = staff.filter(item => item.employmentSource === '第三方合作').length
  const leaveCount = staff.filter(item => item.status === '休假').length
  const departmentCoverage = departments
    .map(department => ({
      department,
      count: staff.filter(item => item.department === department && item.status === '在职').length,
    }))
    .sort((left, right) => left.count - right.count)
  const weakestDepartment = departmentCoverage[0]
  const sortedStaff = useMemo(() => sortStaffByPriority(filtered), [filtered])
  const prioritizedStaff = sortedStaff.slice(0, 4)
  const paged = sortedStaff.slice((page - 1) * pageSize, page * pageSize)
  const sceneMeta = scene === 'home'
    ? {
      title: '协同人员池',
      subtitle: `共 ${partnerStaffCount} 名第三方协同人员${selectedPartner ? ` · 当前查看 ${selectedPartner.name}` : ''}`,
      description: selectedPartner
        ? `当前聚焦 ${selectedPartner.name} 的居家养老协同用工与待确认入职闭环，优先保证上门排期和服务边界一致。`
        : '当前聚焦居家养老协同视角，默认前置第三方合作人员与护理服务机构绑定关系。',
      signalsLabel: selectedPartner ? `当前按护理服务机构筛选：${selectedPartner.name}` : '当前按居家养老协同视角筛选第三方人员',
      addLabel: '添加协同人员',
      addHref: '/staff/new?scene=home',
    }
    : {
      title: '员工列表',
      subtitle: `共 ${staff.length} 名员工${selectedPartner ? ` · 当前查看 ${selectedPartner.name}` : ''}${selectedStaff && fromNew ? ' · 包含最新待入职记录' : ''}`,
      description: selectedPartner
        ? `当前聚焦 ${selectedPartner.name} 的协同用工与待确认入职闭环，优先保证排班、任务和机构协同口径一致。`
        : '优先处理待入职、休假补位和第三方合作人员，确保排班、任务与机构协同的同一口径。',
      signalsLabel: selectedPartner ? `当前按护理服务机构筛选：${selectedPartner.name}` : '当前显示全院人员与合作机构视角',
      addLabel: '添加员工',
      addHref: '/staff/new',
    }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={sceneMeta.title}
        subtitle={sceneMeta.subtitle}
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href={sceneMeta.addHref} className="btn btn-primary btn-sm"><Plus size={12} />{sceneMeta.addLabel}</Link>
            <Link href="/staff/schedule" className="btn btn-secondary btn-sm">进入排班台</Link>
          </div>
        }
      />

      <InteractionRailLayout
        main={(
          <>
            <WorkflowOverviewCard
              eyebrow="Workforce Operations"
              title="人员协同总览"
              description={sceneMeta.description}
              badge={<Tag variant="info">Resource View</Tag>}
              metrics={[
                { label: '在岗人数', value: activeStaffCount, hint: `总人数 ${staff.length}`, tone: 'success' },
                { label: '待入职确认', value: pendingOnboardingCount, hint: '确认后再进入排班与任务', tone: pendingOnboardingCount > 0 ? 'warning' : 'neutral' },
                { label: '第三方协同', value: partnerStaffCount, hint: `合作机构 ${activePartners.length} 家`, tone: partnerStaffCount > 0 ? 'info' : 'neutral' },
                { label: '休假补位', value: leaveCount, hint: weakestDepartment ? `${weakestDepartment.department} 在岗 ${weakestDepartment.count} 人` : '暂无部门缺口', tone: leaveCount > 0 ? 'warning' : 'neutral' },
              ]}
              signals={[
                { label: aiInsights[0] ? `${aiInsights[0].title}：${aiInsights[0].action}` : '暂无 AI 人员提醒', tone: aiInsights[0]?.variant === 'warning' ? 'warning' : 'info' },
                { label: sceneMeta.signalsLabel, tone: 'neutral' },
                { label: weakestDepartment ? `当前最薄弱部门：${weakestDepartment.department}` : '当前部门覆盖均衡', tone: weakestDepartment && weakestDepartment.count < 2 ? 'warning' : 'success' },
              ]}
              actions={
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Link href="/staff/schedule" className="btn btn-secondary btn-sm">进入排班台</Link>
                  <Link href="/staff/tasks" className="btn btn-secondary btn-sm">查看任务中心</Link>
                  <Link href={buildAiHref('staff-coverage', 'inference')} className="btn btn-primary btn-sm">查看 AI 建议</Link>
                </div>
              }
            />

            <div className="kpi-grid">
              <StatCard icon={<UserCheck size={18} />} label="员工总数" value={staff.length} color="primary" />
              <StatCard icon={<ShieldCheck size={18} />} label="在职" value={activeStaffCount} color="success" />
              <StatCard icon={<Building2 size={18} />} label="服务机构协同" value={partnerStaffCount} sub="已绑护理服务机构" color="warning" />
              <StatCard icon={<UserCheck size={18} />} label="待入职" value={pendingOnboardingCount} color="warning" />
            </div>

            {selectedStaff && fromNew ? (
              <DataCard
                title="来自新增员工页"
                subtitle={`${selectedStaff.name} 已进入待入职闭环。确认后再纳入排班与任务口径。`}
                badge={<Tag variant={selectedStaff.lifecycleStatus === '待入职' ? 'warning' : 'success'}>{selectedStaff.lifecycleStatus}</Tag>}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                    当前角色 {selectedStaff.role}，部门 {selectedStaff.department}，来源 {selectedStaff.employmentSource}{selectedStaff.partnerAgencyName ? `，护理服务机构 ${selectedStaff.partnerAgencyName}` : ''}，联系电话 {selectedStaff.phone}。
                  </div>
                  {selectedStaff.lifecycleStatus === '待入职' ? (
                    <button className="btn btn-primary btn-sm" onClick={() => confirmStaffOnboarding(selectedStaff.id)}>
                      确认入职
                    </button>
                  ) : (
                    <Link href={`/staff/${selectedStaff.id}`} className="btn btn-secondary btn-sm">查看详情</Link>
                  )}
                </div>
              </DataCard>
            ) : null}

            <DataCard icon={<ShieldCheck size={16} />} title="优先处理人员" subtitle="把需要确认、补位或重点协同的人员直接前置到首屏。" badge={<Tag variant="warning">Priority Queue</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                {prioritizedStaff.map(item => {
                  const actionLabel = item.lifecycleStatus === '待入职'
                    ? '先确认入职再纳入口径'
                    : item.status === '休假'
                      ? '关注班次补位与任务转派'
                      : item.employmentSource === '第三方合作'
                        ? '确认合作机构协同边界'
                        : '维持当前排班与任务节奏'

                  return (
                    <div key={item.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.name} · {item.role}</div>
                          <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>
                            {item.department} · {item.employmentSource}{item.partnerAgencyName ? ` · ${item.partnerAgencyName}` : ''}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <Tag variant={STATUS_TAG[item.status]}>{item.status}</Tag>
                          <Tag variant={item.lifecycleStatus === '待入职' ? 'warning' : 'success'}>{item.lifecycleStatus}</Tag>
                        </div>
                      </div>
                      <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>{actionLabel}</div>
                    </div>
                  )
                })}
              </div>
            </DataCard>

            <FilterBar>
              <FilterItem label="">
                <div className="input-wrap" style={{ minWidth: 180 }}>
                  <span className="input-icon"><Search size={14} /></span>
                  <input className="input" placeholder="搜索姓名/工号..." value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} style={{ paddingLeft: 34 }} />
                </div>
              </FilterItem>
              <FilterItem label="">
                <select className="select" value={deptFilter} onChange={event => { setDeptFilter(event.target.value); setPage(1) }} style={{ minWidth: 130 }}>
                  <option value="">全部部门</option>
                  {departments.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
              </FilterItem>
              <FilterItem label="">
                <select className="select" value={sourceFilter} onChange={event => { setSourceFilter(event.target.value); setPage(1) }} style={{ minWidth: 130 }}>
                  <option value="">全部来源</option>
                  <option value="自营">自营</option>
                  <option value="第三方合作">第三方合作</option>
                </select>
              </FilterItem>
              <FilterItem label="">
                <select className="select" value={partnerFilter} onChange={event => { setPartnerFilter(event.target.value); setPage(1) }} style={{ minWidth: 180 }}>
                  <option value="">全部服务机构</option>
                  {activePartners.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </FilterItem>
            </FilterBar>

            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>姓名</th>
                      <th>工号</th>
                      <th>职位</th>
                      <th>部门</th>
                      <th>来源</th>
                      <th>关联机构</th>
                      <th>状态</th>
                      <th>联系方式</th>
                      <th style={{ textAlign: 'right' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map(item => (
                      <tr key={item.id} className="table-hover-row">
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="avatar avatar-sm" style={{ background: 'rgba(13,148,136,0.1)', color: 'var(--color-primary)' }}>
                              {item.name.slice(0, 1)}
                            </div>
                            <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{item.name}</span>
                          </div>
                        </td>
                        <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{item.id}</span></td>
                        <td><Tag variant={ROLE_TAG[item.role]}>{item.role}</Tag></td>
                        <td><span className="text-sm">{item.department}</span></td>
                        <td><Tag variant={SOURCE_TAG[item.employmentSource]}>{item.employmentSource}</Tag></td>
                        <td>
                          <div style={{ display: 'grid', gap: 3 }}>
                            <span className="text-sm" style={{ color: 'var(--color-text)' }}>{item.partnerAgencyName ?? '内部团队'}</span>
                            {item.partnerAffiliationRole ? <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{item.partnerAffiliationRole}</span> : null}
                          </div>
                        </td>
                        <td><Tag variant={STATUS_TAG[item.status]}>{item.status}</Tag></td>
                        <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{item.phone}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <Link href={`/staff/${item.id}`} className="btn btn-ghost btn-sm">详情</Link>
                            <Link href="/staff/schedule" className="btn btn-ghost btn-sm">排班</Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {paged.length === 0 ? <EmptyState variant="search" title="暂无数据" description="调整筛选条件试试" /> : null}
              <Pagination current={page} total={filtered.length} pageSize={pageSize} onChange={setPage} />
            </div>
          </>
        )}
        rail={(
          <>
            <DataCard icon={<Building2 size={16} />} title="协同边界" subtitle="右侧只保留人员协同判断所需的最小上下文。">
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">当前视角：{sceneMeta.title}。</div>
                <div className="page-help-card-item">合作机构：{activePartners.length} 家，第三方协同 {partnerStaffCount} 人。</div>
                <div className="page-help-card-item">当前最薄弱部门：{weakestDepartment ? `${weakestDepartment.department} · ${weakestDepartment.count} 人` : '暂无明显缺口'}。</div>
              </div>
            </DataCard>

            <DataCard icon={<Building2 size={16} />} title="推荐处理路径" subtitle="把人员变更快速落到排班、任务和 AI 分析闭环。">
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '先确认待入职或休假人员，避免排班口径滞后。',
                  '再检查护理服务机构协同人员，确认驻场角色和服务边界。',
                  '最后进入 AI 运营中心复核部门覆盖与班次压力。',
                ].map(item => (
                  <div key={item} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>{item}</div>
                ))}
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link href="/staff/schedule" className="btn btn-secondary btn-sm">排班补位</Link>
                <Link href="/staff/tasks" className="btn btn-secondary btn-sm">任务协同</Link>
              </div>
            </DataCard>

            <DataCard icon={<Bot size={16} />} title="AI 人员摘要" subtitle="辅助看出勤覆盖和人员结构，不直接评价员工绩效。" badge={<Tag variant="info">Workforce View</Tag>}>
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
                <Link href={buildAiHref('staff-coverage', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
              </div>
            </DataCard>

            <DataCard icon={<UserCheck size={16} />} title="AI 结构建议" subtitle="强调角色和部门覆盖，为后续接排班与任务提供基础。">
              <div style={{ display: 'grid', gap: 10 }}>
                {aiNarratives.map(item => (
                  <div key={item} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>{item}</div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <Link href={buildAiHref('staff-structure', 'logs')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整说明迁到帮助页"
              summary="员工页首屏只保留待处理人员、筛选和列表；协同口径、推荐路径和 AI 结构解释迁到帮助页。"
              items={[
                '先确认待入职与休假补位，再看全表。',
                '第三方协同只做边界判断，不和主列表混排。',
                'AI 摘要仅用于人员结构观察，不替代绩效判断。',
              ]}
              href="/staff/help"
              actionLabel="查看员工管理帮助"
            />
          </>
        )}
      />
    </div>
  )
}