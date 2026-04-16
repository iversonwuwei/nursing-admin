import { DataCard, InteractionRailLayout, PageHeader, Tag } from '@/components/nh'
import Link from 'next/link'

export default function DailyOperationsHelpPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="日班工作台帮助"
        subtitle="日班工作台首屏只保留收口总览、优先队列和统一入口；完整来源边界与补位判断在这里查看。"
        actions={<Link href="/operations/daily" className="btn btn-secondary btn-sm">返回日班工作台</Link>}
      />

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="页面定位" subtitle="日班工作台负责把当班决策压成固定节奏。">
              <div style={{ fontSize: 12.5, lineHeight: 1.8, color: 'var(--color-text)' }}>
                页面首屏应先帮助值班管理者确定今天先处理什么，再决定进入哪个模块，而不是把数据来源解释、补位说明、AI 分析入口和训练性文案都放在主工作区。
              </div>
            </DataCard>

            <DataCard title="主工作区内容" subtitle="这些内容直接支撑当班判断。">
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '当班收口总览：确认 aggregate、workflow 和本地补位是否健康。',
                  '班次优先队列：明确先处理告警、事故还是评定任务。',
                  '统一运营入口：确认去哪处理，不在页面里分散查找。',
                ].map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="后置上下文区" subtitle="用于补充来源边界和资源信号。" badge={<Tag variant="info">Shift Context</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '数据来源边界：确认哪些数字来自 aggregate，哪些还是本地补位。',
                  '资源支撑信号：只辅助判断是否补位，不抢主入口。',
                  '帮助入口：完整说明在帮助页，不重新堆回日班工作台首屏。',
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