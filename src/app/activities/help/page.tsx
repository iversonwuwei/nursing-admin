import { DataCard, InteractionRailLayout, PageHeader, Tag } from '@/components/nh'
import { CalendarHeart, Users } from 'lucide-react'
import Link from 'next/link'

export default function ActivitiesHelpPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="活动管理帮助"
        subtitle="承接活动管理页被移出的完整说明，避免首屏继续堆积路径解释和培训性文案。"
        actions={<Link href="/activities" className="btn btn-secondary btn-sm">返回活动管理</Link>}
      />

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="页面定位" subtitle="活动管理页负责帮助运营先决定要发布谁、盯住谁。">
              <div style={{ fontSize: 12.5, lineHeight: 1.8, color: 'var(--color-text)' }}>
                页面主区只保留活动总览、优先队列、筛选列表和回流入口，帮助运营人员快速确定哪些活动需要先发布、哪些活动正在执行、哪些活动接近容量上限。长说明与路径解释已经后置，不再与列表混排。
              </div>
            </DataCard>

            <DataCard icon={<CalendarHeart size={16} />} title="主工作区内容" subtitle="这些内容必须留在首屏，因为它们直接支撑运营动作。">
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '活动运营总览：先确认今日活动数、待发布数和装载率。',
                  '活动优先队列：优先暴露待发布、今日执行和高装载活动。',
                  '新建活动回流：从新建页返回后立即决定发布还是继续补充。',
                  '筛选列表：用于快速进入活动详情，不在列表里承载长说明。',
                ].map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard icon={<Users size={16} />} title="推荐操作顺序" subtitle="后置保留统一操作节奏。" badge={<Tag variant="warning">Ops Flow</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '先发布待发布活动，确保活动进入报名与执行链路。',
                  '再检查今日进行中活动，关注签到、场地和老师执行状态。',
                  '最后回看高装载活动，提前处置扩容和家属通知压力。',
                ].map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>

            <DataCard title="AI 与人工边界" subtitle="帮助页保留完整边界说明，主区只保留入口。" badge={<Tag variant="info">Human In The Loop</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">AI 可做：提供运营视角、容量风险提示和对象上下文入口。</div>
                <div className="page-help-card-item">AI 不做：替代排期确认、替代活动发布、替代现场执行复核。</div>
                <div className="page-help-card-item">活动是否发布、是否扩容、是否调整场地，仍由运营人员最终确认。</div>
              </div>
            </DataCard>
          </>
        )}
      />
    </div>
  )
}