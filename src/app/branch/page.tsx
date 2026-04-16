'use client'

import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard } from '@/components/nh'
import { BedDouble, Building2, ChevronRight, Users } from 'lucide-react'
import Link from 'next/link'

const BRANCHES = [
  { id: 'B001', name: '总院', address: '朝阳区建国路88号', beds: 120, occupied: 108, staff: 45, revenue: '¥2,840,000' },
  { id: 'B002', name: '分院A', address: '海淀区中关村大街12号', beds: 80, occupied: 72, staff: 30, revenue: '¥1,920,000' },
  { id: 'B003', name: '分院B', address: '东城区东单北大街56号', beds: 60, occupied: 45, staff: 22, revenue: '¥1,380,000' },
  { id: 'B004', name: '分院C', address: '西城区金融街28号', beds: 40, occupied: 32, staff: 15, revenue: '¥960,000' },
]

export default function BranchPage() {
  const totalBeds = BRANCHES.reduce((sum, branch) => sum + branch.beds, 0)
  const totalOccupied = BRANCHES.reduce((sum, branch) => sum + branch.occupied, 0)
  const totalStaff = BRANCHES.reduce((sum, branch) => sum + branch.staff, 0)
  const occupancyRate = totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0
  const sortedBranches = [...BRANCHES].sort((left, right) => (right.occupied / right.beds) - (left.occupied / left.beds))
  const priorityBranches = sortedBranches.slice(0, 3)

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
              description="分院页不再只是旧式卡片列表，而是先给出整体承载压力，再把优先查看的分院前置成统一入口。"
              badge={<Tag variant="primary">Fluent Rollup</Tag>}
              metrics={[
                { label: '分院总数', value: BRANCHES.length, hint: '当前纳入分院总览的院区数量', tone: 'info' },
                { label: '床位总数', value: totalBeds, hint: `在院 ${totalOccupied} 人`, tone: 'primary' },
                { label: '整体入住率', value: `${occupancyRate}%`, hint: occupancyRate >= 90 ? '高承载，优先看床位周转' : '当前承载可控', tone: occupancyRate >= 90 ? 'warning' : 'success' },
                { label: '员工总数', value: totalStaff, hint: '院区员工规模总览', tone: 'success' },
              ]}
              signals={[
                { label: `${priorityBranches[0]?.name ?? '总院'} 当前入住率最高，建议先进入核实床位与协同压力`, tone: 'warning' },
                { label: '当前仍为本地概览数据，后续接真实组织服务时再切 live aggregate', tone: 'info' },
              ]}
            />

            <div className="kpi-grid">
              <StatCard icon={<Building2 size={18} />} label="分院总数" value={BRANCHES.length} color="primary" />
              <StatCard icon={<BedDouble size={18} />} label="床位总数" value={totalBeds} sub={`在院 ${totalOccupied} 人`} color="info" />
              <StatCard icon={<Users size={18} />} label="员工总数" value={totalStaff} sub="多院区协同" color="success" />
              <StatCard icon={<Building2 size={18} />} label="重点分院" value={priorityBranches[0]?.name ?? '--'} sub="当前优先关注" color="warning" />
            </div>

            <DataCard title="优先查看分院" subtitle="先确定哪家院区需要先看，再进入详情页。" badge={<Tag variant="warning">Priority Queue</Tag>}>
              <div className="branch-summary-list">
                {priorityBranches.map(branch => {
                  const occupancy = Math.round((branch.occupied / branch.beds) * 100)
                  return (
                    <div key={branch.id} className="branch-summary-card">
                      <div className="branch-summary-head">
                        <div className="branch-summary-title-wrap">
                          <div className="branch-summary-icon"><Building2 size={18} /></div>
                          <div>
                            <div className="branch-summary-title">{branch.name}</div>
                            <div className="branch-summary-address">{branch.address}</div>
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
            </DataCard>

            <DataCard title="全部院区入口" subtitle="保持概览入口角色，不在这里展开详情处理。" badge={<Tag variant="info">Entry Board</Tag>}>
              <div className="ops-entry-grid">
                {sortedBranches.map(branch => {
                  const occupancy = Math.round((branch.occupied / branch.beds) * 100)
                  return (
                    <Link key={branch.id} href="/organizations" className="ops-entry-card">
                      <div className="ops-entry-head">
                        <div className="ops-entry-title-wrap">
                          <div className="ops-entry-icon"><Building2 size={16} /></div>
                          <div className="ops-entry-title">{branch.name}</div>
                        </div>
                        <Tag variant={occupancy >= 90 ? 'warning' : 'neutral'}>{occupancy}%</Tag>
                      </div>
                      <div className="ops-entry-subtitle">{branch.address} · 床位 {branch.beds} · 员工 {branch.staff} · 营收 {branch.revenue}</div>
                      <div className="ops-focus-actions">
                        <span className="btn btn-ghost btn-sm">进入机构总览 <ChevronRight size={12} /></span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="上下文说明" subtitle="后置区只保留多院区判断所需的最小背景。" badge={<Tag variant="info">Branch Context</Tag>}>
              <div className="home-context-stack">
                <div className="home-context-item">
                  <div className="home-context-title">当前边界</div>
                  <div className="home-context-description">当前仍是本地分院概览数据，本轮只收敛视觉层级和首屏信息顺序，不引入新的编辑或写入流程。</div>
                </div>
                <div className="home-context-item">
                  <div className="home-context-title">建议顺序</div>
                  <div className="home-context-description">先看优先查看分院，再进入机构页或详情页确认承接能力、人员配置和经营压力。</div>
                </div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整说明后置到帮助页"
              summary="分院页现在只保留多院区总览、优先分院和统一入口，不再使用旧式扁平列表卡片。"
              items={[
                '先看整体入住率和重点分院。',
                '再从统一入口进入机构总览。',
                '上下文区只保留边界说明和建议顺序。',
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
