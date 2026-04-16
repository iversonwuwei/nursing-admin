import { DataCard, InteractionRailLayout, PageHeader, Tag } from '@/components/nh'
import Link from 'next/link'

export default function HomeHelpPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="首页帮助"
        subtitle="首页首屏只保留院务优先级总览、主动作和专页入口；完整上下文说明在这里查看。"
        actions={<Link href="/" className="btn btn-secondary btn-sm">返回首页</Link>}
      />

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="页面定位" subtitle="首页是经营与当班优先级入口，不是培训手册。">
              <div style={{ fontSize: 12.5, lineHeight: 1.8, color: 'var(--color-text)' }}>
                首页负责把服务端聚合快照、评估认定积压、设备告警和关键入口压成一个管理摘要，帮助院长和值班管理者先定优先级，再进入具体工作台和列表页。AI 解释、趋势图和分析型块已经移出首页，不再和主动作混排。
              </div>
            </DataCard>

            <DataCard title="主工作区内容" subtitle="这些内容必须留在首屏主区，因为它们直接影响下一步动作。">
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '院务总览卡：确认今日待处理事项、在管长者、服务租户和工作流积压。',
                  '今日优先动作：先处理告警、认定与护理任务，再决定进入哪个工作台。',
                  '执行与复核入口：把护理任务、健康监测、财务与通知退回各自专页，只在首页保留必要摘要。',
                  '快速入口：只保留高频导航，不再与说明型卡片混排。',
                ].map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>

            <DataCard title="后置上下文区内容" subtitle="这些内容放在主区之后，用来补足判断上下文。">
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '场景切换：机构养老和居家养老属于视角切换，不应和主任务争抢首屏注意力。',
                  '快照来源：帮助判断当前是 Live Snapshot、Syncing 还是 Live Unavailable。',
                  '租户模块摘要：帮助理解为什么某些导航可见、某些模块不可见。',
                  '帮助入口：完整说明在帮助页，不再把长解释重新堆回首页。',
                ].map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="建议顺序" subtitle="先看什么，后看什么。" badge={<Tag variant="warning">Manager First</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '先看院务总览与信号，确认是否存在告警或认定积压。',
                  '再看今日优先动作，决定进入哪个工作台或专页。',
                  '最后再看视角切换、快照来源和模块摘要，作为上下文补充。',
                ].map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>

            <DataCard title="相关入口" subtitle="帮助页不承载主动作，只提供回跳。">
              <div style={{ display: 'grid', gap: 8 }}>
                <Link href="/operations/daily" className="btn btn-secondary btn-sm">进入日班工作台</Link>
                <Link href="/elderly/checkin" className="btn btn-secondary btn-sm">进入评估认定</Link>
                <Link href="/alerts" className="btn btn-secondary btn-sm">查看实时告警</Link>
              </div>
            </DataCard>
          </>
        )}
      />
    </div>
  )
}