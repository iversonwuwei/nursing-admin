"use client"
import { useMemo, useSyncExternalStore } from 'react'
import { DataCard, Tag, type TagVariant } from "@/components/nh"
import { buildAiAssistantHref } from "@/lib/ai-context"
import { getSupplyDetailAiInsight, getSupplyProcurementInsight } from "@/lib/mock/admin-ai"
import { findLiveSupplyById, getResourceSnapshot, subscribeResourceWorkflow } from '@/lib/mock/resource-workflow'
import { ArrowLeft, Bot, Edit, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

const STATUS_TAG: Record<string, TagVariant> = { "正常": "success", "库存不足": "danger", "待上架": "warning" }

export default function SupplyDetailPage() {
  const params = useParams()
  const id = params.id as string
  const snapshot = useSyncExternalStore(
    subscribeResourceWorkflow,
    getResourceSnapshot,
    getResourceSnapshot,
  )
  const data = useMemo(
    () => findLiveSupplyById(id, snapshot) ?? snapshot.supplies[0],
    [id, snapshot],
  )
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

  return (
    <div className="page-root animate-fade-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/supplies" className="btn btn-ghost btn-icon btn-icon-sm btn-icon">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold" style={{ letterSpacing: "-0.02em" }}>{data.name}</h1>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>编号: {data.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tag variant="neutral">{data.category}</Tag>
          <Tag variant={STATUS_TAG[data.status]}>{data.status}</Tag>
          <button className="btn btn-primary btn-sm flex items-center gap-2">
            <Edit size={14} />编辑
          </button>
        </div>
      </div>

      <DataCard
        icon={<Bot size={16} />}
        title={aiInsight.title}
        subtitle="把库存缺口、出库节奏和供应商信息转成补货建议。"
        badge={<Tag variant="warning">Supply AI</Tag>}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ borderRadius: 12, background: "var(--color-bg)", padding: 14, fontSize: 12.5, lineHeight: 1.7, color: "var(--color-text)" }}>
            {aiInsight.summary}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {aiInsight.actions.map(action => (
              <div key={action} style={{ borderRadius: 10, border: "1px solid var(--color-border)", padding: "10px 12px", fontSize: 12.5, lineHeight: 1.6, color: "var(--color-text)" }}>
                {action}
              </div>
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
        subtitle="把库存与供应商节奏转成采购侧可跟进动作。"
        badge={<Tag variant="info">Procurement</Tag>}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ borderRadius: 12, background: "var(--color-bg)", padding: 14, fontSize: 12.5, lineHeight: 1.7, color: "var(--color-text)" }}>
            {procurementInsight.summary}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {procurementInsight.actions.map(action => (
              <div key={action} style={{ borderRadius: 10, border: "1px solid var(--color-border)", padding: "10px 12px", fontSize: 12.5, lineHeight: 1.6, color: "var(--color-text)" }}>
                {action}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 12, color: "var(--color-primary)", fontWeight: 600 }}>置信度 {procurementInsight.confidence}%</div>
            <Link href={buildAiHref('procurement-follow-up', 'logs')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
          </div>
        </div>
      </DataCard>

      {/* Stock overview */}
      <DataCard>
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "当前库存", value: `${data.stock}${data.unit}`, sub: `最低 ${data.minStock}${data.unit}` },
              { label: "单价", value: data.price, sub: "采购参考价" },
              { label: "供应商", value: data.supplier, sub: data.contact },
              { label: "最近采购", value: data.lastPurchase, sub: "" },
            ].map(({ label, value, sub }) => (
              <div key={label} style={{ padding: "12px 14px", background: "var(--color-bg)", borderRadius: 10 }}>
                <div className="text-xs font-semibold" style={{ color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                <div className="text-base font-bold mt-1">{value}</div>
                {sub && <div className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>{sub}</div>}
              </div>
            ))}
          </div>
        </div>
      </DataCard>

      {/* History */}
      <DataCard icon={<TrendingUp size={15} />} title="进出库记录">
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead><tr><th>日期</th><th>入库</th><th>出库</th><th>结存</th></tr></thead>
            <tbody>
              {data.history.map((h, i) => (
                <tr key={i}>
                  <td><span className="text-sm" style={{ color: "var(--color-muted)" }}>{h.date}</span></td>
                  <td><span className="font-semibold" style={{ color: "var(--color-success)" }}>+{h.in}</span></td>
                  <td><span className="font-semibold" style={{ color: "var(--color-danger)" }}>-{h.out}</span></td>
                  <td><span className="font-semibold text-sm">{h.balance}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataCard>
    </div>
  )
}
