import { DataCard, InteractionRailLayout, PageHeader, Tag } from '@/components/nh'
import { FileSpreadsheet, ShieldCheck, Wallet } from 'lucide-react'
import Link from 'next/link'

export default function FinancialHelpPage() {
  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title="财务中心帮助"
        subtitle="承接财务页的模块解释、流程说明和异常口径，减少工作台首屏阅读负担。"
        actions={<Link href="/financial" className="btn btn-secondary btn-sm">返回财务中心</Link>}
      />

      <InteractionRailLayout
        main={(
          <>
            <DataCard icon={<Wallet size={16} />} title="主任务顺序" badge={<Tag variant="warning">Finance Workflow</Tag>}>
              <div className="page-help-card-list">
                <div className="page-help-card-item">先确认当前账单或结算单是否可推进，再决定是否开票或补齐资料。</div>
                <div className="page-help-card-item">失败通知、待处理账单和资料待补充个案优先进入人工处置队列。</div>
                <div className="page-help-card-item">只有会影响下一步决策的金额与状态摘要保留在页面右侧，其余解释迁到本帮助页。</div>
              </div>
            </DataCard>

            <DataCard icon={<FileSpreadsheet size={16} />} title="模块边界" subtitle="完整模块说明不再放在工作台首屏。">
              <div className="page-help-card-list">
                <div className="page-help-card-item">费用计算：确认服务包、耗材、附加项和人工调整是否进入应收。</div>
                <div className="page-help-card-item">账单生成：只在资料满足条件时进入出账，避免把脏数据推进 Billing。</div>
                <div className="page-help-card-item">票据归档：属于收尾环节，不应与主列表争夺首屏注意力。</div>
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <DataCard icon={<ShieldCheck size={16} />} title="异常处理口径" badge={<Tag variant="info">Failure Handling</Tag>}>
            <div className="page-help-card-list">
              <div className="page-help-card-item">live 模式下，以真实账单队列和财务摘要为准；接口失败才回退 demo 视图。</div>
              <div className="page-help-card-item">资料待补充结算单保持禁用，不允许为了演示便利直接发起真实开票。</div>
              <div className="page-help-card-item">AI 稽核属于辅助诊断，不替代财务和评定主管的最终确认。</div>
            </div>
          </DataCard>
        )}
      />
    </div>
  )
}