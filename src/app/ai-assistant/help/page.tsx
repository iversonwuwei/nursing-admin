import { DataCard, InteractionRailLayout, PageHeader, Tag } from '@/components/nh'
import Link from 'next/link'

export default function AiAssistantHelpPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="AI 运营入口帮助"
        subtitle="AI 入口首屏只保留总览、导航和主路径；完整上下文追踪、fallback 边界与治理说明在这里查看。"
        actions={<Link href="/ai-assistant" className="btn btn-secondary btn-sm">返回 AI 运营入口</Link>}
      />

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="页面定位" subtitle="AI 入口页负责导航和解释，不直接执行业务动作。">
              <div style={{ fontSize: 12.5, lineHeight: 1.8, color: 'var(--color-text)' }}>
                当前页把推理详情、即时问答、规则治理、问答日志以及员工端/家属端预览统一成一个 AI 运营入口，但根页本身只负责总览与分流，具体问答已经拆到独立页面。
              </div>
            </DataCard>

            <DataCard title="主工作区内容" subtitle="这些内容直接支撑 AI 入口使用。">
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  'AI 总览：确认当前追踪对象、待确认建议和运行模式。',
                  '推荐进入路径：先进入最接近当前业务上下文的子页。',
                  '子页导航：把问答、推理、规则和日志拆成独立工作页。',
                ].map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="右侧信息轨" subtitle="用于承接上下文追踪、fallback 和总览级摘要。" badge={<Tag variant="info">AI Context</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '当前追踪上下文：明确来源页面、场景、对象和关注点。',
                  'Fallback 边界：真实链路异常时，解释为什么页面回退。',
                  '当前摘要信号：只保留总览级风险摘要，详细治理去子页。',
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