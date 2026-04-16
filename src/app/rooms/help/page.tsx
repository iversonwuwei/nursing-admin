import { DataCard, InteractionRailLayout, PageHeader, Tag } from '@/components/nh'
import Link from 'next/link'

export default function RoomsHelpPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="房间管理帮助"
        subtitle="房间页首屏只保留承接队列、筛选和资源表；完整排房边界与 AI 解释统一后置到这里。"
        actions={<Link href="/rooms" className="btn btn-secondary btn-sm">返回房间管理</Link>}
      />

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="页面定位" subtitle="房间页用于处理房间承接与资源启用，不直接做自动排房。">
              <div style={{ fontSize: 12.5, lineHeight: 1.8, color: 'var(--color-text)' }}>
                该页负责汇总房间容量、待启用状态、清洁与维护阻塞，以及对象级房间列表，帮助入住协调和床位运营先确认真实可承接资源，再决定是否继续进入入住承接或 AI 辅助判断。
              </div>
            </DataCard>

            <DataCard title="主工作区内容" subtitle="这些内容直接支撑下一步资源处理动作。">
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">承接总览与 KPI：先判断整体入住率、可承接床位、待启用和清洁维护积压。</div>
                <div className="page-help-card-item">优先队列与房间表：优先处理待启用、维护中和未清洁房间，再进入对象详情。</div>
                <div className="page-help-card-item">新增房间回流提示：新建对象先进入待启用，由列表页完成启用闭环。</div>
              </div>
            </DataCard>

            <DataCard title="决策边界" subtitle="AI 只辅助解释资源差异，不直接替代排房。">
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">AI 排房摘要用于解释可承接能力和机构差异，不自动生成入住决策。</div>
                <div className="page-help-card-item">待启用、维护中和未清洁房间都不应被当作立即可用资源。</div>
                <div className="page-help-card-item">若容量与状态口径异常，应先修复房间主数据，再参考 AI 说明。</div>
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="建议顺序" subtitle="先确认事实，再看解释。" badge={<Tag variant="info">Capacity Order</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">先看待启用、维护和清洁阻塞。</div>
                <div className="page-help-card-item">再看优先队列和对象级房间详情。</div>
                <div className="page-help-card-item">最后参考 AI 排房摘要与机构差异解释。</div>
              </div>
            </DataCard>

            <DataCard title="主要入口" subtitle="帮助页只保留继续处理入口。">
              <div style={{ display: 'grid', gap: 10 }}>
                <Link href="/elderly/checkin" className="btn btn-secondary btn-sm">进入入住承接</Link>
                <Link href="/rooms/new" className="btn btn-secondary btn-sm">新增房间</Link>
                <Link href="/ai-assistant" className="btn btn-secondary btn-sm">查看 AI 运营中心</Link>
              </div>
            </DataCard>
          </>
        )}
      />
    </div>
  )
}