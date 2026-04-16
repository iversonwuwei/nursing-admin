import { DataCard, InteractionRailLayout, PageHeader, Tag } from '@/components/nh'
import { ScrollText, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function AiLogsHelpPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="AI 日志帮助"
        subtitle="承接 AI 日志页被移出的完整说明，避免审计主区继续堆积过滤边界和使用说明。"
        actions={<Link href="/ai-assistant/logs" className="btn btn-secondary btn-sm">返回 AI 日志</Link>}
      />

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="页面定位" subtitle="AI 日志页负责帮助审计人员先找到要看的留痕，再核对结果。">
              <div style={{ fontSize: 12.5, lineHeight: 1.8, color: 'var(--color-text)' }}>
                AI 日志页主区只保留 tracking context、筛选条和日志明细。这样审计人员可以先定位对象和场景，再看结果型留痕，不会被大段说明性文字打断检索动作。
              </div>
            </DataCard>

            <DataCard icon={<ScrollText size={16} />} title="主工作区内容" subtitle="这些内容必须留在首屏，因为它们直接支撑日志审计。">
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '当前审计追踪：确认对象、场景和默认关注点。',
                  '日志 KPI：快速判断当前日志量与命中结果数量。',
                  '筛选条：按关键词和场景收窄结果集。',
                  '日志明细：核对 agent、操作人、摘要和结果留痕。',
                ].map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard icon={<ShieldCheck size={16} />} title="审计边界" subtitle="帮助页保留完整边界说明，主区只保留必要提示。" badge={<Tag variant="warning">Audit Boundary</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">当前页展示的是结果型日志，不等于完整提示词与工具执行轨迹。</div>
                <div className="page-help-card-item">Demo 与 Live 模式都必须保留页面骨架与显式空态，不允许静默清空。</div>
                <div className="page-help-card-item">默认关键词和场景映射只用于辅助过滤，不替代人工审计判断。</div>
              </div>
            </DataCard>

            <DataCard title="相关入口" subtitle="帮助页不承接审计动作，只提供回跳。">
              <div style={{ display: 'grid', gap: 8 }}>
                <Link href="/ai-assistant/logs" className="btn btn-secondary btn-sm">进入 AI 日志</Link>
                <Link href="/ai-assistant" className="btn btn-secondary btn-sm">返回 AI 总览</Link>
              </div>
            </DataCard>
          </>
        )}
      />
    </div>
  )
}