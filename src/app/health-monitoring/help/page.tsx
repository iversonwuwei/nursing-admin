import { DataCard, InteractionRailLayout, PageHeader, Tag } from '@/components/nh'
import { Activity, Bot, Heart } from 'lucide-react'
import Link from 'next/link'

export default function HealthMonitoringHelpPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="健康监测帮助"
        subtitle="承接健康监测页被移出的完整说明，避免首屏同时承载对象卡和大段 AI 解释。"
        actions={<Link href="/health-monitoring" className="btn btn-secondary btn-sm">返回健康监测</Link>}
      />

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="页面定位" subtitle="健康监测页负责帮助值班人员先决定跟进谁、看什么趋势。">
              <div style={{ fontSize: 12.5, lineHeight: 1.8, color: 'var(--color-text)' }}>
                页面主区只保留总览指标、当班跟进队列、近 7 日趋势和生命体征对象卡，先帮助值班人员快速判断哪些老人需要立即跟进。AI 风险解释和趋势摘要已经后置，避免首屏判断空间被说明性内容占满。
              </div>
            </DataCard>

            <DataCard icon={<Heart size={16} />} title="主工作区内容" subtitle="这些内容直接支撑巡视和跟进动作。">
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '健康监测总览：先确认监测中人数、异常预警和严重异常数量。',
                  '当班跟进队列：优先暴露最需要立即跟进的老人。',
                  '趋势图：帮助看连续变化，不在趋势区重复堆叠说明文案。',
                  '生命体征对象卡：用于逐个对象核对和继续下钻。',
                ].map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard icon={<Activity size={16} />} title="异常视图规则" subtitle="帮助页保留筛选规则和空态口径。" badge={<Tag variant="warning">Monitoring Flow</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">切到异常视图后，只展示当前有异常信号的对象卡。</div>
                <div className="page-help-card-item">如果异常视图没有对象，页面会显示显式空态，提示值班人员切回全部视图继续巡视。</div>
                <div className="page-help-card-item">趋势图仍保留在主区，用于判断近期波动，不因为对象为空而隐藏。</div>
              </div>
            </DataCard>

            <DataCard icon={<Bot size={16} />} title="AI 与人工边界" subtitle="帮助页保留完整边界，主区只保留入口。" badge={<Tag variant="info">Human In The Loop</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">AI 可做：解释连续异常、生成跟进建议、总结趋势变化。</div>
                <div className="page-help-card-item">AI 不做：直接给医疗诊断、替代护理记录、替代升级决策。</div>
                <div className="page-help-card-item">是否上报医生、是否通知家属、是否升级为事故，仍由人工结合现场情况确认。</div>
              </div>
            </DataCard>
          </>
        )}
      />
    </div>
  )
}