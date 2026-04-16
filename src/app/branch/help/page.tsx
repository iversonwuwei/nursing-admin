import { DataCard, InteractionRailLayout, PageHeader, Tag } from '@/components/nh'
import Link from 'next/link'

export default function BranchHelpPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="分院管理帮助"
        subtitle="分院页首屏只保留多院区总览、优先分院和统一入口；完整说明在这里查看。"
        actions={<Link href="/branch" className="btn btn-secondary btn-sm">返回分院管理</Link>}
      />

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="页面定位" subtitle="分院页是多院区概览入口，不是详情处理页。">
              <div style={{ fontSize: 12.5, lineHeight: 1.8, color: 'var(--color-text)' }}>
                页面首屏负责告诉区域运营当前先看哪家分院，再进入机构总览或详情页，不再停留在旧式扁平分院卡片列表。
              </div>
            </DataCard>

            <DataCard title="主工作区内容" subtitle="这些内容直接影响多院区优先级判断。">
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '多院区运营优先级总览：先看整体承载压力与重点分院。',
                  '优先查看分院：把需要先跟进的院区前置出来。',
                  '全部院区入口：统一从入口板进入机构总览，不在分院页展开详情处理。',
                ].map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="后置上下文区" subtitle="用于补充分院页当前边界和建议顺序。" badge={<Tag variant="info">Branch Context</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '当前仍是本地分院概览数据，本轮不引入新的写路径。',
                  '建议先看优先分院，再下钻到机构总览或详情页。',
                  '帮助页保留完整说明，首屏不再重新堆叠解释性卡片。',
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
