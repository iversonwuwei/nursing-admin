"use client"
import { DataCard, EmptyState, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard, type TagVariant } from "@/components/nh"
import { buildAiAssistantHref } from "@/lib/ai-context"
import { getSupplyDetailAiInsight, getSupplyProcurementInsight } from "@/lib/mock/admin-ai"
import { findLiveSupplyById, getResourceSnapshot, subscribeResourceWorkflow } from '@/lib/mock/resource-workflow'
import { ArrowLeft, Bot, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useMemo, useSyncExternalStore } from 'react'

const STATUS_TAG: Record<string, TagVariant> = { "正常": "success", "库存不足": "danger", "待上架": "warning" }

export default function SupplyDetailPage() {
  const params = useParams()
  const id = params.id as string
  const snapshot = useSyncExternalStore(
    subscribeResourceWorkflow,
    getResourceSnapshot,
    getResourceSnapshot,
  )
  const data = useMemo(() => findLiveSupplyById(id, snapshot), [id, snapshot])

  if (!data) {
    return (
      <div className="animate-fade-up">
        <PageHeader
          title="物资不存在"
          subtitle={`未找到编号 ${id} 对应的物资对象。`}
          actions={<Link href="/supplies" className="btn btn-secondary btn-sm"><ArrowLeft size={13} />返回物资管理</Link>}
        />

        <EmptyState
          variant="search"
          title="当前物资对象不存在"
          description="请返回物资管理页重新选择对象，或检查当前路由是否仍指向有效的物资。"
          action={<Link href="/supplies" className="btn btn-primary btn-sm">返回物资管理</Link>}
        />
      </div>
    )
  }

  const aiInsight = getSupplyDetailAiInsight({
    id: data.id,
    name: data.name,
    category: data.category,
    stock: data.stock,
    minStock: data.minStock,
    supplier: data.supplier,
    lastPurchase: data.lastPurchase,
    status: data.status,
    history: data.history.map(item => ({ ...item })),
  })
  const procurementInsight = getSupplyProcurementInsight({
    id: data.id,
    name: data.name,
    category: data.category,
    stock: data.stock,
    minStock: data.minStock,
    supplier: data.supplier,
    lastPurchase: data.lastPurchase,
    status: data.status,
    history: data.history.map(item => ({ ...item })),
  })
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = "inference") => buildAiAssistantHref({
    source: 'supply-detail',
    entityId: data.id,
    entityName: data.name,
    focus,
    target,
  })
  const stockGap = Math.max(0, data.minStock - data.stock)
  const totalInbound = data.history.reduce((sum, item) => sum + item.in, 0)
  const totalOutbound = data.history.reduce((sum, item) => sum + item.out, 0)

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={data.name}
        subtitle={`物资编号: ${data.id}`}
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/supplies" className="btn btn-secondary btn-sm"><ArrowLeft size={13} />返回物资管理</Link>
          </div>
        }
      />

      <InteractionRailLayout
        main={(
          <>
            <WorkflowOverviewCard
              eyebrow="Supply Detail"
              title={`${data.name} 库存对象总览`}
              description="主工作区只保留对象事实和库存台账，AI 补货建议与采购跟进后置展示，避免首屏变成说明书。"
              badge={<Tag variant={STATUS_TAG[data.status]}>{data.status}</Tag>}
              metrics={[
                { label: '当前库存', value: `${data.stock}${data.unit}`, hint: `最低库存 ${data.minStock}${data.unit}`, tone: data.stock <= data.minStock ? 'danger' : 'success' },
                { label: '库存缺口', value: stockGap > 0 ? `${stockGap}${data.unit}` : '充足', hint: stockGap > 0 ? '需要补货或调拨' : '当前无需紧急补货', tone: stockGap > 0 ? 'warning' : 'info' },
                { label: '本期出库', value: `${totalOutbound}${data.unit}`, hint: `累计入库 ${totalInbound}${data.unit}`, tone: 'primary' },
                { label: '供应商', value: data.supplier, hint: data.lastPurchase ? `最近采购 ${data.lastPurchase}` : '暂无最近采购记录', tone: 'neutral' },
              ]}
              signals={[
                { label: `物资分类：${data.category}`, tone: 'info' },
                { label: data.status === '库存不足' ? '当前状态提示应优先核对补货节奏与审批队列。' : '当前对象状态稳定，先核对库存台账再决定是否进入 AI 辅助。', tone: data.status === '库存不足' ? 'warning' : 'success' },
                { label: 'AI 建议只辅助判断，不跨越采购审批边界。', tone: 'neutral' },
              ]}
            />

            <div className="kpi-grid">
              <StatCard icon={<TrendingUp size={18} />} label="当前库存" value={`${data.stock}${data.unit}`} sub={`最低 ${data.minStock}${data.unit}`} color={data.stock <= data.minStock ? 'danger' : 'success'} />
              <StatCard icon={<TrendingUp size={18} />} label="库存缺口" value={stockGap > 0 ? `${stockGap}${data.unit}` : '充足'} sub="补货阈值判断" color={stockGap > 0 ? 'warning' : 'info'} />
              <StatCard icon={<TrendingUp size={18} />} label="累计入库" value={`${totalInbound}${data.unit}`} sub="当前记录周期" color="primary" />
              <StatCard icon={<TrendingUp size={18} />} label="累计出库" value={`${totalOutbound}${data.unit}`} sub="当前记录周期" color="warning" />
            </div>

            <DataCard title="库存事实与供应信息" subtitle="对象事实留在主工作区，方便先核对库存与供应商。" badge={<Tag variant="primary">Object Facts</Tag>}>
              <div className="detail-fact-grid">
                {[
                  { label: '当前库存', value: `${data.stock}${data.unit}`, meta: `最低库存 ${data.minStock}${data.unit}` },
                  { label: '单价', value: data.price, meta: '采购参考价' },
                  { label: '供应商', value: data.supplier, meta: data.contact },
                  { label: '最近采购', value: data.lastPurchase || '暂无记录', meta: `状态 ${data.status}` },
                ].map(item => (
                  <div key={item.label} className="detail-fact-card">
                    <div className="detail-fact-label">{item.label}</div>
                    <div className="detail-fact-value">{item.value}</div>
                    <div className="detail-fact-meta">{item.meta}</div>
                  </div>
                ))}
              </div>
            </DataCard>

            <DataCard icon={<TrendingUp size={15} />} title="进出库记录" subtitle="库存台账作为主工作区事实来源，先于 AI 建议阅读。">
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead><tr><th>日期</th><th>入库</th><th>出库</th><th>结存</th></tr></thead>
                  <tbody>
                    {data.history.map((history, index) => (
                      <tr key={index}>
                        <td><span className="text-sm" style={{ color: "var(--color-muted)" }}>{history.date}</span></td>
                        <td><span className="font-semibold" style={{ color: "var(--color-success)" }}>+{history.in}</span></td>
                        <td><span className="font-semibold" style={{ color: "var(--color-danger)" }}>-{history.out}</span></td>
                        <td><span className="font-semibold text-sm">{history.balance}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="对象上下文" subtitle="当前对象边界与人工决策责任后置显示。" badge={<Tag variant="info">Context</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">物资分类：{data.category} · 当前状态：{data.status}</div>
                <div className="page-help-card-item">供应商：{data.supplier} · 联系方式：{data.contact}</div>
                <div className="page-help-card-item">补货与采购建议仅作辅助，最终下单仍需人工审批与仓储确认。</div>
              </div>
            </DataCard>

            <DataCard
              icon={<Bot size={16} />}
              title={aiInsight.title}
              subtitle="补货侧解释后置，避免主工作区被建议文案占满。"
              badge={<Tag variant="warning">Supply AI</Tag>}
            >
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ borderRadius: 12, background: "var(--color-bg)", padding: 14, fontSize: 12.5, lineHeight: 1.7, color: "var(--color-text)" }}>
                  {aiInsight.summary}
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {aiInsight.actions.map(action => (
                    <div key={action} className="page-help-card-item">{action}</div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 12, color: "var(--color-primary)", fontWeight: 600 }}>置信度 {aiInsight.confidence}%</div>
                  <Link href={buildAiHref('restock-gap', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
                </div>
              </div>
            </DataCard>

            <DataCard
              icon={<Bot size={16} />}
              title={procurementInsight.title}
              subtitle="采购跟进放在后置区，强调它是跟进建议而不是自动决策。"
              badge={<Tag variant="info">Procurement</Tag>}
            >
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ borderRadius: 12, background: "var(--color-bg)", padding: 14, fontSize: 12.5, lineHeight: 1.7, color: "var(--color-text)" }}>
                  {procurementInsight.summary}
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {procurementInsight.actions.map(action => (
                    <div key={action} className="page-help-card-item">{action}</div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 12, color: "var(--color-primary)", fontWeight: 600 }}>置信度 {procurementInsight.confidence}%</div>
                  <Link href={buildAiHref('procurement-follow-up', 'logs')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
                </div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="补货与采购口径迁移到显式帮助页"
              summary="物资详情页首屏只保留对象事实和库存台账，完整补货边界与采购说明不再回流到主工作区。"
              items={[
                '先核对当前库存、最低库存和历史台账。',
                '再阅读 AI 补货建议与采购跟进动作。',
                '最终是否补货、何时采购仍由人工审批决定。',
              ]}
              href="/supplies/help"
              actionLabel="查看物资详情帮助"
            />
          </>
        )}
      />
    </div>
  )
}
