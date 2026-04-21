'use client'

import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard } from '@/components/nh'
import { fetchAdminOrganizationList, type AdminOrganizationSummary } from '@/lib/organizations/admin-organization-api'
import { BedDouble, Building2, ChevronRight, Users } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

interface BranchRow {
  id: string
  name: string
  address: string
  beds: number
  occupied: number
  staff: number
  elders: number
  lifecycleStatus: AdminOrganizationSummary['lifecycleStatus']
  status: AdminOrganizationSummary['status']
}

function toBranchRow(summary: AdminOrganizationSummary): BranchRow {
  return {
    id: summary.id,
    name: summary.name,
    address: summary.address,
    beds: summary.totalBeds,
    occupied: summary.occupiedBeds,
    staff: summary.staffCount,
    elders: summary.elderlyCount,
    lifecycleStatus: summary.lifecycleStatus,
    status: summary.status,
  }
}

export default function BranchPage() {
  const [branches, setBranches] = useState<BranchRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const loading = branches === null && error === null

  useEffect(() => {
    let cancelled = false

    fetchAdminOrganizationList({ pageSize: 200 })
      .then(response => {
        if (cancelled) return
        setBranches(response.items.map(toBranchRow))
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : '分院概览加载失败。'
        setError(message)
      })

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const handleReload = () => {
    setBranches(null)
    setError(null)
    setReloadToken(token => token + 1)
  }

  const totals = useMemo(() => {
    if (!branches) {
      return { totalBeds: 0, totalOccupied: 0, totalStaff: 0, occupancyRate: 0 }
    }
    const totalBeds = branches.reduce((sum, branch) => sum + branch.beds, 0)
    const totalOccupied = branches.reduce((sum, branch) => sum + branch.occupied, 0)
    const totalStaff = branches.reduce((sum, branch) => sum + branch.staff, 0)
    const occupancyRate = totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0
    return { totalBeds, totalOccupied, totalStaff, occupancyRate }
  }, [branches])

  const sortedBranches = useMemo(() => {
    if (!branches) return []
    return [...branches].sort((left, right) => {
      const leftRate = left.beds > 0 ? left.occupied / left.beds : 0
      const rightRate = right.beds > 0 ? right.occupied / right.beds : 0
      return rightRate - leftRate
    })
  }, [branches])

  const priorityBranches = sortedBranches.slice(0, 3)
  const { totalBeds, totalOccupied, totalStaff, occupancyRate } = totals

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="分院管理"
        subtitle="首页式总览只负责告诉你先看哪家分院，再进入具体详情。"
      />

      <InteractionRailLayout
        main={(
          <>
            <WorkflowOverviewCard
              eyebrow="Branch Overview"
              title="多院区运营优先级总览"
              description="分院总览现在直接读取组织服务聚合口径，先暴露整体承载压力，再把优先查看的分院前置成统一入口。"
              badge={<Tag variant={loading ? 'neutral' : error ? 'danger' : 'primary'}>{loading ? 'Loading' : error ? 'Live Unavailable' : 'Live Snapshot'}</Tag>}
              metrics={[
                { label: '分院总数', value: branches?.length ?? 0, hint: loading ? '加载中…' : '当前租户下已建档机构数量', tone: 'info' },
                { label: '床位总数', value: totalBeds, hint: loading ? '加载中…' : `在院 ${totalOccupied} 人`, tone: 'primary' },
                { label: '整体入住率', value: branches ? `${occupancyRate}%` : '--', hint: loading ? '加载中…' : occupancyRate >= 90 ? '高承载，优先看床位周转' : '当前承载可控', tone: occupancyRate >= 90 ? 'warning' : 'success' },
                { label: '员工总数', value: totalStaff, hint: loading ? '加载中…' : '院区员工规模总览', tone: 'success' },
              ]}
              signals={[
                priorityBranches[0]
                  ? { label: `${priorityBranches[0].name} 当前入住率最高，建议先进入核实床位与协同压力`, tone: 'warning' }
                  : { label: '暂无已建档分院，请先前往机构管理建档', tone: 'info' },
                { label: '数据来自 /api/admin/organizations 聚合口径；营收维度待 Billing 按机构聚合后接入', tone: 'info' },
              ]}
            />

            {error && (
              <DataCard title="Live Unavailable" subtitle="分院概览暂时无法从组织服务读取。" badge={<Tag variant="danger">Error</Tag>}>
                <div className="home-context-stack">
                  <div className="home-context-item">
                    <div className="home-context-title">错误信息</div>
                    <div className="home-context-description">{error}</div>
                  </div>
                  <div className="home-context-item">
                    <button type="button" className="btn btn-sm" onClick={handleReload}>重试</button>
                  </div>
                </div>
              </DataCard>
            )}

            <div className="kpi-grid">
              <StatCard icon={<Building2 size={18} />} label="分院总数" value={branches?.length ?? 0} color="primary" />
              <StatCard icon={<BedDouble size={18} />} label="床位总数" value={totalBeds} sub={`在院 ${totalOccupied} 人`} color="info" />
              <StatCard icon={<Users size={18} />} label="员工总数" value={totalStaff} sub="多院区协同" color="success" />
              <StatCard icon={<Building2 size={18} />} label="重点分院" value={priorityBranches[0]?.name ?? '--'} sub="当前优先关注" color="warning" />
            </div>

            <DataCard title="优先查看分院" subtitle="先确定哪家院区需要先看，再进入详情页。" badge={<Tag variant="warning">Priority Queue</Tag>}>
              {loading ? (
                <div className="home-context-description">加载中…</div>
              ) : priorityBranches.length === 0 ? (
                <div className="home-context-stack">
                  <div className="home-context-item">
                    <div className="home-context-title">暂无分院记录</div>
                    <div className="home-context-description">当前租户下还没有已建档机构，请先在机构管理中完成建档与启用。</div>
                  </div>
                  <Link href="/organizations" className="btn btn-sm">进入机构管理</Link>
                </div>
              ) : (
                    <div className="branch-summary-list">
                      {priorityBranches.map(branch => {
                    const occupancy = branch.beds > 0 ? Math.round((branch.occupied / branch.beds) * 100) : 0
                    return (
                      <div key={branch.id} className="branch-summary-card">
                        <div className="branch-summary-head">
                          <div className="branch-summary-title-wrap">
                            <div className="branch-summary-icon"><Building2 size={18} /></div>
                            <div>
                              <div className="branch-summary-title">{branch.name}</div>
                              <div className="branch-summary-address">{branch.address || '地址待补充'}</div>
                            </div>
                          </div>
                          <Tag variant={occupancy >= 90 ? 'warning' : 'success'}>{occupancy >= 90 ? '优先关注' : '当前稳定'}</Tag>
                        </div>
                        <div className="branch-summary-metrics">
                          <div className="branch-summary-metric">
                            <div className="branch-summary-metric-value">{branch.beds}</div>
                            <div className="branch-summary-metric-label">床位</div>
                          </div>
                          <div className="branch-summary-metric">
                            <div className="branch-summary-metric-value">{branch.occupied}</div>
                            <div className="branch-summary-metric-label">在院</div>
                          </div>
                          <div className="branch-summary-metric">
                            <div className="branch-summary-metric-value">{occupancy}%</div>
                            <div className="branch-summary-metric-label">入住率</div>
                          </div>
                          <div className="branch-summary-metric">
                            <div className="branch-summary-metric-value">{branch.staff}</div>
                            <div className="branch-summary-metric-label">员工</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                    </div>
              )}
            </DataCard>

            <DataCard title="全部院区入口" subtitle="保持概览入口角色，不在这里展开详情处理。" badge={<Tag variant="info">Entry Board</Tag>}>
              {loading ? (
                <div className="home-context-description">加载中…</div>
              ) : sortedBranches.length === 0 ? (
                <div className="home-context-description">暂无分院入口。</div>
              ) : (
                    <div className="ops-entry-grid">
                      {sortedBranches.map(branch => {
                    const occupancy = branch.beds > 0 ? Math.round((branch.occupied / branch.beds) * 100) : 0
                    return (
                      <Link key={branch.id} href={`/organizations/${branch.id}`} className="ops-entry-card">
                        <div className="ops-entry-head">
                          <div className="ops-entry-title-wrap">
                            <div className="ops-entry-icon"><Building2 size={16} /></div>
                            <div className="ops-entry-title">{branch.name}</div>
                          </div>
                          <Tag variant={occupancy >= 90 ? 'warning' : 'neutral'}>{occupancy}%</Tag>
                        </div>
                        <div className="ops-entry-subtitle">
                          {(branch.address || '地址待补充')} · 床位 {branch.beds} · 在院 {branch.elders} · 员工 {branch.staff} · 营收 接入中
                        </div>
                        <div className="ops-focus-actions">
                          <span className="btn btn-ghost btn-sm">进入机构详情 <ChevronRight size={12} /></span>
                        </div>
                      </Link>
                    )
                  })}
                    </div>
              )}
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="上下文说明" subtitle="后置区只保留多院区判断所需的最小背景。" badge={<Tag variant="info">Branch Context</Tag>}>
              <div className="home-context-stack">
                <div className="home-context-item">
                  <div className="home-context-title">当前边界</div>
                  <div className="home-context-description">分院概览已切到组织服务聚合口径（床位/在院/员工），营收仍保留“接入中”占位，待 Billing 按机构聚合后补齐。</div>
                </div>
                <div className="home-context-item">
                  <div className="home-context-title">建议顺序</div>
                  <div className="home-context-description">先看优先查看分院，再从入口卡进入机构详情页确认承接能力、人员配置和经营压力。</div>
                </div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整说明后置到帮助页"
              summary="分院页现在只保留多院区总览、优先分院和统一入口，并已从本地硬编码切到组织服务真实聚合。"
              items={[
                '先看整体入住率和重点分院。',
                '再从入口卡进入 /organizations/{id} 详情页。',
                '营收字段标注“接入中”时，等 Billing 按机构聚合后会自动可见。',
              ]}
              href="/help/branch"
              actionLabel="查看页面帮助"
            />
          </>
        )}
      />
    </div>
  )
}
