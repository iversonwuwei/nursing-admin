"use client"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Package, ArrowLeft, Edit, TrendingUp } from "lucide-react"
import { DataCard, Tag } from "@/components/nh"

const SUPPLY_DATA: Record<string, any> = {
  "SP001": {
    id: "SP001", name: "成人护理垫", category: "护理用品", unit: "包",
    stock: 45, minStock: 50, price: "¥38", supplier: "稳健医疗",
    contact: "李经理 138****1234", lastPurchase: "2026-03-10",
    status: "库存不足",
    history: [
      { date: "2026-03-10", in: 50, out: 8, balance: 45 },
      { date: "2026-02-25", in: 0, out: 12, balance: 53 },
      { date: "2026-02-15", in: 60, out: 10, balance: 65 },
      { date: "2026-02-01", in: 0, out: 15, balance: 55 },
    ]
  },
}

const STATUS_TAG: Record<string, string> = { "正常": "success", "库存不足": "danger", "即将过期": "warning" }

export default function SupplyDetailPage() {
  const params = useParams()
  const id = params.id as string
  const data = SUPPLY_DATA[id] || SUPPLY_DATA["SP001"]

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
          <Tag variant={STATUS_TAG[data.status] as any}>{data.status}</Tag>
          <button className="btn btn-primary btn-sm flex items-center gap-2">
            <Edit size={14} />编辑
          </button>
        </div>
      </div>

      {/* Stock overview */}
      <div className="data-card">
        <div className="data-card-body">
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
      </div>

      {/* History */}
      <div className="data-card">
        <div className="data-card-header">
          <div className="data-card-title">
            <div className="data-card-icon-wrap"><TrendingUp size={15} /></div>
            <div className="text-sm font-bold">进出库记录</div>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="table-base">
            <thead><tr><th>日期</th><th>入库</th><th>出库</th><th>结存</th></tr></thead>
            <tbody>
              {data.history.map((h: any, i: number) => (
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
      </div>
    </div>
  )
}
