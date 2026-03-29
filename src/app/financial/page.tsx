"use client"
import { useState } from "react"
import { PieChart, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { DataCard } from "@/components/nh"

const MONTHLY = [
  { month: "3月", income: 298000, expense: 186000, profit: 112000 },
  { month: "2月", income: 285000, expense: 179000, profit: 106000 },
  { month: "1月", income: 312000, expense: 195000, profit: 117000 },
]

const CATEGORIES = [
  { name: "床位费", amount: 186000, ratio: 62, color: "var(--color-primary)" },
  { name: "护理费", amount: 62000, ratio: 21, color: "var(--color-info)" },
  { name: "餐费", amount: 28000, ratio: 9, color: "var(--color-purple)" },
  { name: "其他", amount: 22000, ratio: 8, color: "var(--color-warning)" },
]

const EXPENSES = [
  { item: "人员工资", amount: 98000, ratio: 53, category: "人力", color: "var(--color-primary)" },
  { item: "医疗物资", amount: 32000, ratio: 17, category: "物资", color: "var(--color-info)" },
  { item: "餐饮成本", amount: 24000, ratio: 13, category: "餐饮", color: "var(--color-purple)" },
  { item: "水电能耗", amount: 15000, ratio: 8, category: "能耗", color: "var(--color-warning)" },
  { item: "设备维护", amount: 9000, ratio: 5, category: "维护", color: "var(--color-success)" },
  { item: "其他支出", amount: 8000, ratio: 4, category: "其他", color: "var(--color-danger)" },
]

/* Shared row for income/expense breakdown */
function BreakdownRow({ label, amount, ratio, color }: { label: string; amount: number; ratio: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--color-bg)" }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: "var(--color-text)", flex: 1 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)" }}>¥{amount.toLocaleString()}</span>
      <span style={{ fontSize: 12, color: "var(--color-muted)", width: 40, textAlign: "right" }}>{ratio}%</span>
      <div style={{ width: 80, height: 6, background: "var(--color-bg)", borderRadius: 999 }}>
        <div style={{ height: "100%", width: `${ratio}%`, background: color, borderRadius: 999 }} />
      </div>
    </div>
  )
}

export default function FinancialPage() {
  const current = MONTHLY[0]
  const profitRate = Math.round(current.profit / current.income * 100)

  return (
    <div className="page-root animate-fade-up">
      <div className="flex-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ letterSpacing: "-0.03em" }}>财务收支</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>{current.month}财务汇总 · 收入¥{current.income.toLocaleString()} · 支出¥{current.expense.toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm">导出报表</button>
          <button className="btn btn-primary btn-sm">记账</button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="page-grid-4">
        {[
          { label: "本月收入", value: `¥${current.income.toLocaleString()}`, icon: TrendingUp, color: "var(--color-success)", bg: "rgba(34,197,94,0.1)", delta: "+4.6%", up: true },
          { label: "本月支出", value: `¥${current.expense.toLocaleString()}`, icon: TrendingDown, color: "var(--color-danger)", bg: "rgba(239,68,68,0.1)", delta: "+3.9%", up: true },
          { label: "本月利润", value: `¥${current.profit.toLocaleString()}`, icon: DollarSign, color: "var(--color-primary)", bg: "var(--color-primary-light)", delta: "+5.7%", up: true },
          { label: "利润率", value: `${profitRate}%`, icon: PieChart, color: "var(--color-purple)", bg: "rgba(139,92,246,0.1)", delta: "+0.8%", up: true },
        ].map(({ label, value, icon: Icon, color, bg, delta, up }) => (
          <div key={label} className="data-card eq-stat-card" style={{ padding: "16px 20px" }}>
            <div className="eq-stat-card-header">
              <div style={{ fontSize: 12, color: "var(--color-muted)", fontWeight: 500 }}>{label}</div>
              <div className="kpi-stat-icon-box" style={{ background: bg }}>
                <Icon size={18} style={{ color }} />
              </div>
            </div>
            <div className="eq-stat-card-value">{value}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
              {up
                ? <ArrowUpRight size={14} style={{ color: "var(--color-success)" }} />
                : <ArrowDownRight size={14} style={{ color: "var(--color-danger)" }} />
              }
              <span style={{ fontSize: 12, fontWeight: 700, color: up ? "var(--color-success)" : "var(--color-danger)" }}>{delta}</span>
              <span style={{ fontSize: 12, color: "var(--color-muted)" }}>环比</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="page-grid-2" style={{ alignItems: "start" }}>
        {/* Income breakdown */}
        <DataCard>
          <div className="data-card-header">
            <div className="flex gap-2" style={{ alignItems: "center" }}>
              <div className="data-card-icon-wrap" style={{ background: "rgba(34,197,94,0.1)", color: "var(--color-success)" }}>
                <TrendingUp size={18} />
              </div>
              <div>
                <div className="text-sm font-bold">收入构成</div>
                <div style={{ fontSize: 12, color: "var(--color-muted)" }}>本月收入来源分布</div>
              </div>
            </div>
          </div>
          <div style={{ padding: "0 12px 12px" }}>
            {CATEGORIES.map(cat => (
              <BreakdownRow key={cat.name} label={cat.name} amount={cat.amount} ratio={cat.ratio} color={cat.color} />
            ))}
          </div>
        </DataCard>

        {/* Expense breakdown */}
        <DataCard>
          <div className="data-card-header">
            <div className="flex gap-2" style={{ alignItems: "center" }}>
              <div className="data-card-icon-wrap" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-danger)" }}>
                <TrendingDown size={18} />
              </div>
              <div>
                <div className="text-sm font-bold">支出构成</div>
                <div style={{ fontSize: 12, color: "var(--color-muted)" }}>本月支出分类分布</div>
              </div>
            </div>
          </div>
          <div style={{ padding: "0 12px 12px" }}>
            {EXPENSES.map(ex => (
              <BreakdownRow key={ex.item} label={ex.item} amount={ex.amount} ratio={ex.ratio} color={ex.color} />
            ))}
          </div>
        </DataCard>
      </div>
    </div>
  )
}
