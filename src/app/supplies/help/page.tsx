import { DataCard, InteractionRailLayout, PageHeader, Tag } from '@/components/nh'
import Link from 'next/link'

export default function SuppliesHelpPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="物资管理帮助"
        subtitle="补货边界、采购跟进和库存解释统一后置，列表页与详情页都通过这里承接完整说明。"
        actions={<Link href="/supplies" className="btn btn-secondary btn-sm">返回物资管理</Link>}
      />

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="页面定位" subtitle="物资详情页是对象级库存核对页，不是采购审批页。">
              <div style={{ fontSize: 12.5, lineHeight: 1.8, color: 'var(--color-text)' }}>
                详情页负责展示当前库存、最低库存、供应商信息和进出库台账，帮助采购、仓储和值班协同用户先核对对象事实，再决定是否需要进一步参考 AI 补货建议或采购跟进行动。
              </div>
            </DataCard>

            <DataCard title="主工作区保留内容" subtitle="这些内容直接支撑对象级判断。">
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">库存对象总览：当前库存、缺口、供应商与最近采购。</div>
                <div className="page-help-card-item">库存事实与供应信息：单价、联系人、物资状态和最低库存阈值。</div>
                <div className="page-help-card-item">进出库记录：按日期核对入库、出库和结存，作为所有后续动作的事实基础。</div>
              </div>
            </DataCard>

            <DataCard title="决策边界" subtitle="AI 只辅助判断，不直接做采购结论。">
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">AI 补货建议帮助发现库存缺口和周转节奏，但不自动创建采购动作。</div>
                <div className="page-help-card-item">采购跟进建议帮助整理供应商与时间窗口，最终仍需人工审批、仓储确认和执行记录。</div>
                <div className="page-help-card-item">若对象不存在或台账口径异常，应优先修复数据映射，不要直接依据 AI 建议执行采购。</div>
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="建议顺序" subtitle="先核对事实，再看解释。" badge={<Tag variant="info">Order</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">先看当前库存、最低库存和历史台账。</div>
                <div className="page-help-card-item">再看 AI 补货建议与采购跟进动作。</div>
                <div className="page-help-card-item">最后决定是否进入人工补货或采购审批流程。</div>
              </div>
            </DataCard>

            <DataCard title="主要入口" subtitle="帮助页保留返回和继续处理入口。">
              <div style={{ display: 'grid', gap: 10 }}>
                <Link href="/supplies" className="btn btn-secondary btn-sm">返回物资管理</Link>
                <Link href="/ai-assistant" className="btn btn-secondary btn-sm">查看 AI 运营中心</Link>
              </div>
            </DataCard>
          </>
        )}
      />
    </div>
  )
}