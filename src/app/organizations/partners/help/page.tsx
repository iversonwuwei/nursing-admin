import { DataCard, InteractionRailLayout, PageHeader, Tag } from '@/components/nh'
import Link from 'next/link'

export default function PartnerOrganizationsHelpPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="定点机构协同帮助"
        subtitle="完整角色边界、场景差异和协同顺序后置到帮助页，首屏对象池只保留必要展开与入口。"
        actions={<Link href="/organizations/partners" className="btn btn-secondary btn-sm">返回定点机构协同</Link>}
      />

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="页面定位" subtitle="这页负责先判断当前场景下该优先关注哪类定点机构。">
              <div style={{ fontSize: 12.5, lineHeight: 1.8, color: 'var(--color-text)' }}>
                定点机构协同页承担的是对象池管理和协同分流，不负责完整制度说明。主工作区只保留场景化总览、评估机构/护理服务机构对象池，以及展开后的关键事实和跳转入口。
              </div>
            </DataCard>

            <DataCard title="角色边界" subtitle="评估机构和护理服务机构必须保持清晰分工。">
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">评估机构：负责首评、复评、抽检和材料复核，不进入执行护工排班或第三方执行绑定。</div>
                <div className="page-help-card-item">护理服务机构：负责第三方人员绑定、服务执行协同和月结对账，不主导认定结论。</div>
                <div className="page-help-card-item">首屏对象卡只展示联系人、结算方式、合同周期和关联人数，不重复承载整套培训性说明。</div>
              </div>
            </DataCard>

            <DataCard title="建议顺序" subtitle="先判断场景，再展开对象。">
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">机构场景：优先查看评估机构是否稳定承接认定协同，再检查护理服务机构的人力绑定能力。</div>
                <div className="page-help-card-item">居家场景：优先确认护理服务机构是否能承接上门执行，再回看评估机构的认定支持能力。</div>
                <div className="page-help-card-item">对象展开后只做事实确认和跳转，不在当前页处理完整协同流程。</div>
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="主要入口" subtitle="帮助页右侧保留最常用的继续处理入口。" badge={<Tag variant="info">Entrypoints</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <Link href="/organizations/partners" className="btn btn-secondary btn-sm">返回对象池</Link>
                <Link href="/organizations/partners/new" className="btn btn-primary btn-sm">新增定点机构</Link>
                <Link href="/elderly/checkin" className="btn btn-secondary btn-sm">查看评估认定</Link>
              </div>
            </DataCard>

            <DataCard title="交付边界" subtitle="明确当前页保留什么，不承接什么。">
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">对象池页负责协同分流，不直接处理规则配置、执行排班或财务审批。</div>
                <div className="page-help-card-item">若发现机构类型和人员绑定冲突，应先回到对象池校验机构类型和关联数据。</div>
                <div className="page-help-card-item">完整规则治理仍在相关配置页完成，不在当前协同页扩展新流程。</div>
              </div>
            </DataCard>
          </>
        )}
      />
    </div>
  )
}