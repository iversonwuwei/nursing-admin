import { DataCard, InteractionRailLayout, PageHeader, Tag } from '@/components/nh'
import { BarChart3, ScrollText } from 'lucide-react'
import Link from 'next/link'

export default function AnalyticsHelpPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="数据分析帮助"
        subtitle="承接数据分析与报表中心被移出的完整说明，避免图表主区继续堆积解释性文案。"
        actions={<Link href="/data-dashboard" className="btn btn-secondary btn-sm">返回数据分析</Link>}
      />

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="页面定位" subtitle="分析页负责给管理者稳定的聚合结果，不负责培训式讲解。">
              <div style={{ fontSize: 12.5, lineHeight: 1.8, color: 'var(--color-text)' }}>
                数据分析页主区只保留 KPI、结构图表、排行表和报表草稿，帮助管理者先看数据结果，再决定是否进入报表导出或其他工作台。来源说明、兼容入口说明与导出边界已经迁移到帮助页和后置上下文区。
              </div>
            </DataCard>

            <DataCard icon={<BarChart3 size={16} />} title="主工作区内容" subtitle="这些内容必须留在首屏，因为它们直接支撑经营判断。">
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '聚合 KPI：先看长者、租户、告警和护理待处理数量。',
                  '结构图表：确认告警、通知、财务和护理工作流的当前分布。',
                  '效率排行：用于补充查看人员效率，不与说明卡混排。',
                  '报表草稿：周报、月报摘要与送达动作留在报表中心主区。',
                ].map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard icon={<ScrollText size={16} />} title="分析与报表边界" subtitle="帮助理解数据分析页和报表中心的职责差异。" badge={<Tag variant="warning">Analytics Boundary</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">数据分析页负责稳定展示聚合结果和结构图表。</div>
                <div className="page-help-card-item">报表中心负责把当前周期摘要整理成草稿，并给出送达动作。</div>
                <div className="page-help-card-item">两者都不应在主区堆积大段解释型文案，说明统一后置。</div>
              </div>
            </DataCard>

            <DataCard title="相关入口" subtitle="帮助页只承接说明，不承载分析主动作。">
              <div style={{ display: 'grid', gap: 8 }}>
                <Link href="/data-dashboard" className="btn btn-secondary btn-sm">进入数据分析</Link>
                <Link href="/analytics/report" className="btn btn-secondary btn-sm">进入报表中心</Link>
              </div>
            </DataCard>
          </>
        )}
      />
    </div>
  )
}