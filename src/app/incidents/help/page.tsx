import { DataCard, InteractionRailLayout, PageHeader, Tag } from '@/components/nh'
import { AlertTriangle, Bot, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export default function IncidentsHelpPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="事故报告帮助"
        subtitle="承接事故报告页被移出的完整处置说明，避免主区继续混入复盘性长文案。"
        actions={<Link href="/incidents" className="btn btn-secondary btn-sm">返回事故报告</Link>}
      />

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="页面定位" subtitle="事故报告页负责帮助值班主管先接单、再推进处理。">
              <div style={{ fontSize: 12.5, lineHeight: 1.8, color: 'var(--color-text)' }}>
                页面主区只保留处置总览、优先队列、筛选列表和回流入口，帮助值班主管先看待分派、再看处理中、最后回看已结案记录。AI 摘要与复盘建议已经后置到右轨和帮助页，不再挤占首屏处置空间。
              </div>
            </DataCard>

            <DataCard icon={<ShieldAlert size={16} />} title="主工作区内容" subtitle="这些内容直接支撑事故处置动作。">
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '事故处置总览：先确认严重事故、待分派和结案率。',
                  '处置优先队列：优先暴露最需要立即接手的事故。',
                  '新建报告回流：新增事故返回后立即进入分派闭环。',
                  '筛选列表：按级别和关键词快速进入事故详情。',
                ].map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard icon={<AlertTriangle size={16} />} title="推荐处理顺序" subtitle="帮助页保留完整处置节奏。" badge={<Tag variant="warning">Safety Flow</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '先分派待分派事故，优先确认严重事件的现场负责人与通知动作。',
                  '再推进处理中事故，补齐下一步动作、处置说明和升级状态。',
                  '最后回看已结案事故，做复盘与制度修正。',
                ].map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>

            <DataCard icon={<Bot size={16} />} title="AI 与人工边界" subtitle="帮助页保留完整边界，主区只保留简短提示。" badge={<Tag variant="info">Human In The Loop</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">AI 可做：事故摘要、优先级提示、复盘建议和日志追踪入口。</div>
                <div className="page-help-card-item">AI 不做：替代责任人确认、替代现场到场记录、替代正式结案。</div>
                <div className="page-help-card-item">事故是否升级、是否结案、是否追责，仍需人工依据制度与现场信息确认。</div>
              </div>
            </DataCard>
          </>
        )}
      />
    </div>
  )
}