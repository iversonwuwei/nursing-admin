import { DataCard, InteractionRailLayout, PageHeader, Tag } from '@/components/nh'
import { AlertTriangle, Bot, Shield } from 'lucide-react'
import Link from 'next/link'

const ALERT_HELP_STEPS = [
  '先看待处理紧急告警，再处理处理中事件，最后回看已解决记录。',
  '高等级事件必须先确认现场责任人，再补录处置结果与升级对象。',
  'AI 只提供解释与升级建议，不直接替代人工关闭事件。',
]

export default function AlertsHelpPage() {
  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title="报警中心帮助"
        subtitle="承接报警中心被移出的完整说明，避免工作台首屏继续堆积长说明卡片。"
        actions={<Link href="/alerts" className="btn btn-secondary btn-sm">返回报警中心</Link>}
      />

      <InteractionRailLayout
        main={(
          <>
            <DataCard icon={<AlertTriangle size={16} />} title="推荐操作顺序" badge={<Tag variant="warning">Alert Workflow</Tag>}>
              <div className="page-help-card-list">
                {ALERT_HELP_STEPS.map(step => (
                  <div key={step} className="page-help-card-item">{step}</div>
                ))}
              </div>
            </DataCard>

            <DataCard icon={<Shield size={16} />} title="模块边界" subtitle="帮助理解不同报警模块的职责，不要求在首屏完整阅读。">
              <div className="page-help-card-list">
                <div className="page-help-card-item">紧急呼叫：优先解决“谁先到场、谁接单”。</div>
                <div className="page-help-card-item">离床预警：重点确认夜间巡视、回床确认和疑似走失前状态。</div>
                <div className="page-help-card-item">异常预警 / SOS：重点确认是否需要医生、安保或家属联动升级。</div>
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <DataCard icon={<Bot size={16} />} title="AI 与人工边界" subtitle="帮助页保留完整边界说明，页面只保留简短提示。" badge={<Tag variant="info">Human In The Loop</Tag>}>
            <div className="page-help-card-list">
              <div className="page-help-card-item">AI 可做：事件解释、风险摘要、升级建议、排序辅助。</div>
              <div className="page-help-card-item">AI 不做：直接关闭高等级事件、替代责任人确认、替代现场到场记录。</div>
              <div className="page-help-card-item">当接口失败或队列为空时，以页面上的 API 状态卡和空态提示为准，不以帮助说明替代实时状态。</div>
            </div>
          </DataCard>
        )}
      />
    </div>
  )
}