import { DataCard, InteractionRailLayout, PageHeader, Tag } from '@/components/nh'
import Link from 'next/link'

export default function ElderlyHelpPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="长者模块帮助"
        subtitle="老人台账、入住审核、人脸录入等页面只保留主流程；完整说明统一在这里查看。"
        actions={<Link href="/elderly" className="btn btn-secondary btn-sm">返回老人列表</Link>}
      />

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="页面定位" subtitle="长者模块的各个页面都优先承载执行，不承担说明页职责。">
              <div style={{ fontSize: 12.5, lineHeight: 1.8, color: 'var(--color-text)' }}>
                无论是老人列表、入住审核还是人脸录入，首屏都只负责帮助前台和主管判断当前任务并继续处理，不再把说明性内容堆在主工作区。
              </div>
            </DataCard>

            <DataCard title="主工作区内容" subtitle="这些内容直接支撑长者模块处理。">
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '老人台账总览：先看入住率、待人工确认、人脸待处理和特护对象。',
                  '人脸录入工作台：保留队列、三角度采集、激活与退回重录动作。',
                  '新建数据闭环：确认录入、导入、待确认和计划生成的治理状态。',
                  '主列表区：搜索、筛选、分页、详情跳转和人脸快捷动作都保留在这里。',
                ].map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="后置上下文区" subtitle="用于补充视角、闭环状态和治理边界。" badge={<Tag variant="info">Module Context</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '机构养老与居家视角属于治理视角切换，不应和主列表争抢首屏注意力。',
                  '人脸录入状态需要在主区可见，但完整解释留在帮助页。',
                  '帮助页承接完整边界说明，首屏只保留最小必要上下文。',
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
