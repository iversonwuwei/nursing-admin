import { DataCard, InteractionRailLayout, PageHeader, Tag } from '@/components/nh'
import Link from 'next/link'

export default function OrganizationsHelpPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="机构管理帮助"
        subtitle="机构页首屏只保留经营比较、优先关注和机构展开；完整经营口径与 AI 边界在这里查看。"
        actions={<Link href="/organizations" className="btn btn-secondary btn-sm">返回机构管理</Link>}
      />

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="页面定位" subtitle="机构页用于总部视角比较承接压力与生命周期状态。">
              <div style={{ fontSize: 12.5, lineHeight: 1.8, color: 'var(--color-text)' }}>
                该页负责在同一屏内比较待启用机构、高入住率机构和当前选中机构的基本承接能力，帮助总部先判断哪里需要介入，再下钻到机构详情或定点机构协同页。
              </div>
            </DataCard>

            <DataCard title="主工作区内容" subtitle="这些内容直接支持经营比较和启用闭环。">
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '机构经营总览：快速判断总盘子、入住率和待启用状态。',
                  '优先关注机构：按承接压力与生命周期排序，帮助总部先做判断。',
                  '机构列表展开：查看床位、员工和启用动作，进入详情继续下钻。',
                ].map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="右侧信息轨" subtitle="只保留经营边界与 AI 解释。" badge={<Tag variant="info">Operations View</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '经营上下文：总机构数、床位总量、平均入住率与当前选中对象。',
                  'AI 机构摘要：辅助发现承接压力和人员配置密度。',
                  'AI 调配建议：帮助比较机构间不均衡，不替代管理判断。',
                ].map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>

            <DataCard title="建议顺序" subtitle="优先总部判断，再决定是否下钻。">
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '先看待启用机构。',
                  '再看高入住率机构。',
                  '最后再用 AI 摘要补充经营背景。',
                ].map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>
          </>
        )}
      />
    </div>
  )
}