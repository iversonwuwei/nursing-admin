'use client'

import { DataCard, EmptyState, FilterBar, FilterItem, PageHeader, Pagination, StatCard, Tag, type TagVariant } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { getStaffAiInsights, getStaffAiNarratives } from '@/lib/mock/admin-ai'
import { confirmStaffOnboarding, getResourceSnapshot, subscribeResourceWorkflow } from '@/lib/mock/resource-workflow'
import { Bot, Plus, Search, ShieldCheck, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState, useSyncExternalStore } from 'react'

const ROLE_TAG: Record<string, TagVariant> = {
  '护理主管': 'primary', '护士': 'info', '后勤主管': 'warning',
  '心理咨询师': 'purple', '厨师长': 'neutral',
}
const STATUS_TAG: Record<string, TagVariant> = { '在职': 'success', '休假': 'warning', '离职': 'danger', '待入职': 'info' }

export default function StaffPage() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('selected')
  const fromNew = searchParams.get('entry') === 'staff-new'
  const snapshot = useSyncExternalStore(
    subscribeResourceWorkflow,
    getResourceSnapshot,
    getResourceSnapshot,
  )
  const staff = snapshot.staff
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const departments = [...new Set(staff.map(s => s.department))]
  const selectedStaff = useMemo(
    () => staff.find(item => item.id === preselectedId) ?? null,
    [preselectedId, staff],
  )
  const aiInsights = getStaffAiInsights(staff)
  const aiNarratives = getStaffAiNarratives(staff)
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'staff-list',
    entityId: 'staff-board',
    entityName: '员工列表',
    focus,
    target,
  })

  const filtered = staff.filter(s => {
    if (search && !s.name.includes(search) && !s.id.includes(search)) return false
    if (deptFilter && s.department !== deptFilter) return false
    return true
  })
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="animate-fade-up">

      <PageHeader
        title="员工列表"
        subtitle={`共 ${staff.length} 名员工${selectedStaff && fromNew ? ' · 包含最新待入职记录' : ''}`}
        actions={
          <Link href="/staff/new" className="btn btn-primary btn-sm">
            <Plus size={13} />添加员工
          </Link>
        }
      />

      <div className="kpi-grid">
        <StatCard icon={<UserCheck size={18} />} label="员工总数" value={staff.length} color="primary" />
        <StatCard icon={<ShieldCheck size={18} />} label="在职" value={staff.filter(s => s.status === '在职').length} color="success" />
        <StatCard icon={<UserCheck size={18} />} label="护理团队" value={staff.filter(s => s.department === '护理部').length} sub="护理部" color="info" />
        <StatCard icon={<UserCheck size={18} />} label="待入职" value={staff.filter(s => s.lifecycleStatus === '待入职').length} color="warning" />
      </div>

      {selectedStaff && fromNew ? (
        <DataCard
          title="来自新增员工页"
          subtitle={`${selectedStaff.name} 已进入待入职闭环。确认后再纳入排班与任务口径。`}
          badge={<Tag variant={selectedStaff.lifecycleStatus === '待入职' ? 'warning' : 'success'}>{selectedStaff.lifecycleStatus}</Tag>}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
              当前角色 {selectedStaff.role}，部门 {selectedStaff.department}，联系电话 {selectedStaff.phone}。
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

      <div className="dashboard-grid-2" style={{ marginBottom: 16 }}>
        <DataCard
          icon={<Bot size={16} />}
          title="AI 人员摘要"
          subtitle="辅助看出勤覆盖和人员结构，不直接评价员工绩效。"
          badge={<Tag variant="info">Workforce View</Tag>}
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
            <Link href={buildAiHref('staff-coverage', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
          </div>
        </DataCard>

        <DataCard
          icon={<UserCheck size={16} />}
          title="AI 结构建议"
          subtitle="强调角色和部门覆盖，为后续接排班与任务提供基础。"
        >
          <div style={{ display: 'grid', gap: 10 }}>
            {aiNarratives.map(item => (
              <div key={item} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
                {item}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <Link href={buildAiHref('staff-structure', 'logs')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
          </div>
        </DataCard>
      </div>

      <FilterBar>
        <FilterItem label="">
          <div className="input-wrap" style={{ minWidth: 180 }}>
            <span className="input-icon"><Search size={14} /></span>
            <input
              className="input"
              placeholder="搜索姓名/工号..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              style={{ paddingLeft: 34 }}
            />
          </div>
        </FilterItem>
        <FilterItem label="">
          <select
            className="select"
            value={deptFilter}
            onChange={e => { setDeptFilter(e.target.value); setPage(1) }}
            style={{ minWidth: 130 }}
          >
            <option value="">全部部门</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
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
          <table className="table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>工号</th>
                <th>职位</th>
                <th>部门</th>
                <th>状态</th>
                <th>联系方式</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(s => (
                <tr key={s.id} className="table-hover-row">
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar avatar-sm" style={{
                        background: 'rgba(13,148,136,0.1)', color: 'var(--color-primary)',
                      }}>
                        {s.name.slice(0, 1)}
                      </div>
                      <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{s.name}</span>
                    </div>
                  </td>
                  <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{s.id}</span></td>
                  <td><Tag variant={ROLE_TAG[s.role]}>{s.role}</Tag></td>
                  <td><span className="text-sm">{s.department}</span></td>
                  <td><Tag variant={STATUS_TAG[s.status]}>{s.status}</Tag></td>
                  <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{s.phone}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <Link href={`/staff/${s.id}`} className="btn btn-ghost btn-sm">详情</Link>
                      <Link href="/staff/schedule" className="btn btn-ghost btn-sm">排班</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {paged.length === 0 && <EmptyState variant="search" title="暂无数据" description="调整筛选条件试试" />}
        <Pagination current={page} total={filtered.length} pageSize={pageSize} onChange={setPage} />
      </div>

    </div>
  )
}
