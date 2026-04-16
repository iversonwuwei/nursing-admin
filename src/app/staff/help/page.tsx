import { DataCard, InteractionRailLayout, PageHeader, Tag } from '@/components/nh'
import Link from 'next/link'

export default function StaffHelpPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="员工管理帮助"
        subtitle="员工页首屏只保留待处理人员、筛选和列表；完整协同口径与 AI 结构解释在这里查看。"
        actions={<Link href="/staff" className="btn btn-secondary btn-sm">返回员工页</Link>}
      />

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="页面定位" subtitle="员工页用于处理待入职、补位与协同关系，而不是做说明堆叠。">
              <div style={{ fontSize: 12.5, lineHeight: 1.8, color: 'var(--color-text)' }}>
                该页负责汇总员工、协同人员、待入职记录和过滤条件，帮助排班、任务中心和合作机构协同保持同一套事实口径。
              </div>
            </DataCard>

            <DataCard title="主工作区内容" subtitle="这些内容直接影响下一步的人力调度动作。">
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '人员协同总览：快速判断在岗、待入职、休假和第三方协同规模。',
                  '优先处理人员：先处理待入职、休假补位和关键协同人员。',
                  '筛选与人员列表：确认部门、来源、合作机构和具体人员详情。',
                ].map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="右侧信息轨" subtitle="只保留协同边界、推荐路径和 AI 结构解释。" badge={<Tag variant="info">Workforce View</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '协同边界：当前视角、合作机构规模和最薄弱部门。',
                  '推荐处理路径：待入职 -> 协同边界 -> AI 结构观察。',
                  'AI 人员摘要：只辅助看覆盖与结构，不做绩效评价。',
                ].map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>

            <DataCard title="相关入口" subtitle="帮助页只保留回跳，不承载主动作。">
              <div style={{ display: 'grid', gap: 8 }}>
                <Link href="/staff/schedule" className="btn btn-secondary btn-sm">进入排班台</Link>
                <Link href="/staff/tasks" className="btn btn-secondary btn-sm">查看任务中心</Link>
                <Link href="/ai-assistant" className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
              </div>
            </DataCard>
          </>
        )}
      />
    </div>
  )
}