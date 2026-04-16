import { DataCard, InteractionRailLayout, PageHeader, Tag } from '@/components/nh'
import { Monitor, Wrench } from 'lucide-react'
import Link from 'next/link'

export default function EquipmentHelpPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="设备管理帮助"
        subtitle="承接设备列表与设备详情中被移出的完整说明，避免设备台账主区继续堆积巡检和维保解释。"
        actions={<Link href="/equipment" className="btn btn-secondary btn-sm">返回设备列表</Link>}
      />

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="页面定位" subtitle="设备模块负责先找出要处理哪台设备，再决定去验收、巡检还是维保。">
              <div style={{ fontSize: 12.5, lineHeight: 1.8, color: 'var(--color-text)' }}>
                设备列表页主区只保留优先队列、筛选表格和关键入口，设备详情页主区只保留对象状态、实时指标、历史数据和设备事实。这样值班工程和护理协同用户可以先完成对象核对与动作决策，不再被说明型内容打断。
              </div>
            </DataCard>

            <DataCard icon={<Monitor size={16} />} title="主工作区保留内容" subtitle="这些内容必须留在首屏，因为它们直接支撑设备处理动作。">
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">设备列表：先看待验收、待维修和告警设备，再从表格进入详情。</div>
                <div className="page-help-card-item">设备详情：先核对设备状态、实时指标和历史数据。</div>
                <div className="page-help-card-item">主动作：新增、验收、进入详情、进入实时监控。</div>
                <div className="page-help-card-item">空态与错误：筛选无结果或状态异常时必须显式提示。</div>
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard icon={<Wrench size={16} />} title="AI 与人工边界" subtitle="帮助页保留完整边界说明，主区只保留入口。" badge={<Tag variant="warning">Ops Boundary</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">AI 可做：巡检排序、维保摘要、异常设备解释和上下文跳转。</div>
                <div className="page-help-card-item">AI 不做：替代设备验收、替代维修判定、替代正式停用决策。</div>
                <div className="page-help-card-item">设备是否验收通过、是否维修、是否报废，仍由人工结合现场情况确认。</div>
              </div>
            </DataCard>

            <DataCard title="相关入口" subtitle="帮助页只承接说明，不承载设备主动作。">
              <div style={{ display: 'grid', gap: 10 }}>
                <Link href="/equipment" className="btn btn-secondary btn-sm">进入设备列表</Link>
                <Link href="/devices/realtime" className="btn btn-secondary btn-sm">进入实时监控</Link>
              </div>
            </DataCard>
          </>
        )}
      />
    </div>
  )
}