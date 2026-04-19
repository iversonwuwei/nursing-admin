"use client"

import { CircleAlert, FileSpreadsheet, ShieldCheck, Wallet, Waypoints } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard } from "@/components/nh"
import { ModuleEntitlementGate } from "@/components/platform/ModuleEntitlementGate"
import { buildAiAssistantHref } from "@/lib/ai-context"
import { getCareScene } from "@/lib/care-scenes"
import {
    fetchFinanceCenterSnapshot,
    type AdminFinanceSummaryResponse,
    type BillingInvoiceResponse,
} from "@/lib/services/admin-module-services"

const FINANCE_WORKFLOW_STAGES = [
    "费用计算",
    "账单生成",
    "通知触达",
    "欠费预警",
    "票据归档",
] as const

function formatCurrency(amount: number) {
  return `¥${amount.toLocaleString()}`
}

function formatTimestamp(value?: string | null) {
    if (!value) {
        return "--"
  }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleString("zh-CN")
}

function StatusRow({ label, count, amount, color }: { label: string; count: number; amount: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--color-bg)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-text)" }}>{label}</div>
          <div style={{ fontSize: 12, color: "var(--color-muted)" }}>{count} 单</div>
        </div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>{formatCurrency(amount)}</div>
    </div>
  )
}

function getNotificationVariant(status: string) {
    if (status === "Failed") {
        return "danger" as const
    }

    if (status === "Delivered") {
        return "success" as const
    }

    return "info" as const
}

function getInvoiceVariant(status: string) {
    if (status === "ActionRequired" || status === "Overdue") {
        return "warning" as const
    }

    if (status === "Paid") {
        return "success" as const
    }

    return "info" as const
}

export default function FinancialPage() {
    const searchParams = useSearchParams()
    const scene = getCareScene(searchParams.get("scene"))
    const [financeSummary, setFinanceSummary] = useState<AdminFinanceSummaryResponse | null>(null)
    const [financeInvoices, setFinanceInvoices] = useState<BillingInvoiceResponse[]>([])
    const [selectedLiveInvoiceId, setSelectedLiveInvoiceId] = useState("")
    const [financeIntegrationNote, setFinanceIntegrationNote] = useState("正在同步财务服务摘要与账单队列...")
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState("")

  useEffect(() => {
    let disposed = false

    async function loadFinanceSnapshot() {
      try {
        const snapshot = await fetchFinanceCenterSnapshot()

        if (disposed) {
          return
        }

        setFinanceSummary(snapshot.summary)
        setFinanceInvoices(snapshot.invoices)
          setLoadError("")
        setFinanceIntegrationNote(
          snapshot.invoices.length > 0
                ? "当前页面已接入真实财务摘要与账单队列；首屏只展示 Billing 持久化账单与通知风险。"
                : "当前页面已接入真实财务摘要，但当前账单队列为空；页面保持 live 空态，不再混用本地评定结算 workflow。",
        )
      } catch (error) {
        if (disposed) {
          return
        }

        setFinanceSummary(null)
        setFinanceInvoices([])
          setLoadError(error instanceof Error ? error.message : "财务服务不可用。")
          setFinanceIntegrationNote("财务服务当前不可用；页面保留 live 错误态与空态，不再回退评定结算演示视图。")
      } finally {
          if (!disposed) {
              setLoading(false)
          }
      }
    }

    void loadFinanceSnapshot()

    return () => {
      disposed = true
    }
  }, [])

    const sceneMeta = scene === "home"
        ? {
            title: "居家评定结算与质控",
            subtitle: "资料导入个案 -> 上门评定 -> 质控抽检 -> 评估费结算",
        }
      : scene === "institutional"
          ? {
              title: "机构评定结算与质控",
              subtitle: "院内认定个案 -> 结论复核 -> 质控抽检 -> 评估费结算",
          }
          : {
              title: "评定服务结算与质控",
              subtitle: "个案评定 -> 结论复核 -> 质控抽检 -> 评估费结算",
          }

  const selectedLiveInvoice = useMemo(
    () => financeInvoices.find(item => item.invoiceId === selectedLiveInvoiceId) ?? financeInvoices[0] ?? null,
    [financeInvoices, selectedLiveInvoiceId],
  )

  const liveInvoiceTotals = useMemo(() => {
    const totalAmount = financeInvoices.reduce((sum, item) => sum + item.amount, 0)
      const issuedAmount = financeInvoices.filter(item => item.status === "Issued").reduce((sum, item) => sum + item.amount, 0)
      const actionRequiredAmount = financeInvoices.filter(item => item.status === "ActionRequired").reduce((sum, item) => sum + item.amount, 0)
      const failedAmount = financeInvoices.filter(item => item.notificationStatus === "Failed").reduce((sum, item) => sum + item.amount, 0)

    return {
      totalAmount,
      issuedAmount,
      actionRequiredAmount,
      failedAmount,
    }
  }, [financeInvoices])

  const liveStatusSummary = useMemo(() => ([
    {
          label: "已出账",
          count: financeInvoices.filter(item => item.status === "Issued").length,
          amount: financeInvoices.filter(item => item.status === "Issued").reduce((sum, item) => sum + item.amount, 0),
          color: "var(--color-primary)",
    },
    {
        label: "待处理",
        count: financeInvoices.filter(item => item.status === "ActionRequired").length,
        amount: financeInvoices.filter(item => item.status === "ActionRequired").reduce((sum, item) => sum + item.amount, 0),
        color: "var(--color-warning)",
    },
    {
        label: "通知失败",
        count: financeInvoices.filter(item => item.notificationStatus === "Failed").length,
        amount: financeInvoices.filter(item => item.notificationStatus === "Failed").reduce((sum, item) => sum + item.amount, 0),
        color: "var(--color-danger)",
    },
    {
        label: "通知送达",
        count: financeInvoices.filter(item => item.notificationStatus === "Delivered").length,
        amount: financeInvoices.filter(item => item.notificationStatus === "Delivered").reduce((sum, item) => sum + item.amount, 0),
        color: "var(--color-success)",
    },
  ]), [financeInvoices])

    const financeOpsQueue = useMemo(
        () => financeInvoices.slice(0, 4).map(item => ({
            id: item.invoiceId,
            elderlyName: item.elderName,
            stage: item.status,
            risk: item.notificationStatus === "Failed"
                ? "账单通知失败，需要人工补发。"
                : item.status === "ActionRequired"
                    ? "账单仍待处理，需要确认催缴或补充动作。"
                    : "账单已进入真实 Billing 队列，可继续跟踪送达与归档。",
            nextAction: item.status === "ActionRequired"
                ? "确认催缴节点、责任人与回款计划。"
                : item.notificationStatus === "Pending"
                    ? "触发账单通知并跟踪回执。"
                    : "核对票据与到账说明。",
            receiptState: item.status === "Paid" ? "待归档票据" : "待补票据",
        })),
        [financeInvoices],
    )

    const buildAiHref = (focus: string, target: "inference" | "rules" | "logs" = "inference") => buildAiAssistantHref({
        source: "financial",
        entityId: selectedLiveInvoice?.invoiceId ?? "billing-live-board",
        entityName: selectedLiveInvoice ? `${selectedLiveInvoice.elderName}账单` : "财务账单看板",
        focus,
        target,
        scene: scene ?? undefined,
    })

  const financeHelpItems = useMemo(() => {
      const pendingReview = financeSummary?.pendingReview ?? 0
      const issued = financeSummary?.issued ?? 0
      const actionRequired = financeSummary?.actionRequired ?? 0

    return [
        `费用计算：${pendingReview} 单待初审或补资料。`,
        `账单生成：${issued} 单已出账，${actionRequired} 单待处理。`,
        `流程：${FINANCE_WORKFLOW_STAGES.join(" -> ")}`,
        loadError
            ? "当前为 live 错误态；链路恢复前不会回退到 demo workflow。"
            : "当前页只读取 Billing 摘要与账单队列，不再混用本地评定结算 store。",
    ]
  }, [financeSummary, loadError])

    const generatedAtLabel = financeSummary?.generatedAtUtc
        ? new Date(financeSummary.generatedAtUtc).toLocaleString("zh-CN", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "等待同步"

  return (
    <ModuleEntitlementGate
      module="finance-service"
      pageTitle={sceneMeta.title}
      moduleLabel="财务服务"
      disabledSummary="当前租户未开通财务服务。页面保留为只读禁用态，避免账单、结算和票据流程超出套餐边界。"
      fallbackLinks={[
          { href: "/", label: "返回首页" },
          { href: "/analytics", label: "查看运营分析" },
      ]}
    >
          <div className="page-root animate-fade-up">
              <PageHeader
          title={sceneMeta.title}
                  subtitle={loadError
                      ? `${sceneMeta.subtitle} · 当前仅保留 live 错误态，不再回退 demo workflow。`
                      : `${sceneMeta.subtitle} · 当前页面已切到真实财务链路，所有主视图均来自 Billing 持久化账单与摘要。`}
                  actions={(
                      <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-2">
                      <button className="btn btn-secondary btn-sm">导出账单清单</button>
                      <Link href={buildAiHref("billing-live-audit", "logs")} className="btn btn-secondary btn-sm">查看 AI 稽核</Link>
                  </div>
            </div>
          )}
        />

        <InteractionRailLayout
                  main={(
            <>
              <WorkflowOverviewCard
                eyebrow="Billing Overview"
                              title={selectedLiveInvoice ? `${selectedLiveInvoice.elderName} 账单总览` : "真实账单总览"}
                description={selectedLiveInvoice
                                  ? `${selectedLiveInvoice.packageName} · 到期 ${formatTimestamp(selectedLiveInvoice.dueAtUtc)}。当前视图只读取 Billing 持久化账单，不再混用前端本地结算 store。`
                                  : "当前页已切到真实 Billing 持久化账单视图，所有总览、列表与详情都来自后端。"}
                              badge={
                                  loadError
                                      ? <Tag variant="danger">Live Unavailable</Tag>
                                      : selectedLiveInvoice
                                          ? <Tag variant={getNotificationVariant(selectedLiveInvoice.notificationStatus)}>{selectedLiveInvoice.status}</Tag>
                                          : <Tag variant="success">Live Billing</Tag>
                              }
                metrics={[
                    { label: "真实账单数", value: financeInvoices.length, hint: "当前 Billing 持久化记录", tone: "primary" },
                    { label: "账单总额", value: formatCurrency(liveInvoiceTotals.totalAmount), hint: `已出账 ${formatCurrency(liveInvoiceTotals.issuedAmount)}`, tone: "success" },
                    { label: "待处理金额", value: formatCurrency(liveInvoiceTotals.actionRequiredAmount), hint: "ActionRequired 账单", tone: liveInvoiceTotals.actionRequiredAmount > 0 ? "warning" : "success" },
                    { label: "通知失败金额", value: formatCurrency(liveInvoiceTotals.failedAmount), hint: "需要补发或升级", tone: liveInvoiceTotals.failedAmount > 0 ? "danger" : "info" },
                ]}
                signals={[
                    { label: `快照时间：${generatedAtLabel}`, tone: loadError ? "warning" : "info" },
                    { label: financeSummary?.overdue ? `逾期账单 ${financeSummary.overdue} 单` : "当前无逾期账单", tone: financeSummary?.overdue ? "warning" : "success" },
                    { label: loadError || financeIntegrationNote, tone: loadError ? "danger" : "neutral" },
                ]}
                actions={(
                  <>
                    <button className="btn btn-secondary btn-sm">导出账单清单</button>
                        <Link href={buildAiHref("billing-live-audit", "logs")} className="btn btn-secondary btn-sm">查看 AI 稽核</Link>
                  </>
                )}
              />

              <div className="kpi-grid" style={{ marginBottom: 16 }}>
                <StatCard icon={<FileSpreadsheet size={18} />} label="真实账单" value={financeInvoices.length} sub="来自 Billing 持久化数据" color="primary" />
                <StatCard icon={<Wallet size={18} />} label="账单总额" value={formatCurrency(liveInvoiceTotals.totalAmount)} sub={`已出账 ${formatCurrency(liveInvoiceTotals.issuedAmount)}`} color="success" />
                <StatCard icon={<Waypoints size={18} />} label="待处理账单" value={financeSummary?.actionRequired ?? 0} sub="ActionRequired 状态" color="warning" />
                <StatCard icon={<CircleAlert size={18} />} label="通知失败" value={financeSummary?.failedNotifications ?? 0} sub="需要人工补发或升级" color="danger" />
              </div>

                          {loading ? (
                              <DataCard icon={<Wallet size={16} />} title="正在同步财务快照" subtitle="Billing 摘要与账单队列正在返回，请稍候。" badge={<Tag variant="warning">Loading</Tag>}>
                                  <div style={{ fontSize: 12.5, lineHeight: 1.7, color: "var(--color-muted)" }}>
                                      页面只等待真实链路，不再读取本地评定结算 store。
                                  </div>
                </DataCard>
                          ) : null}

                          {loadError ? (
                              <DataCard icon={<CircleAlert size={16} />} title="财务链路当前不可用" subtitle={loadError} badge={<Tag variant="danger">Live Unavailable</Tag>}>
                                  <div style={{ fontSize: 12.5, lineHeight: 1.7, color: "var(--color-text)" }}>
                                      当前页面只展示真实 Billing 结果。链路恢复前不会继续回退本地评定结算单或 demo 开票入口。
                                  </div>
                </DataCard>
                          ) : null}

                          <DataCard icon={<CircleAlert size={16} />} title="财务运营关注项" subtitle="把需要人工推进的真实账单、欠费和通知风险拉成一个可执行队列。">
                              {financeOpsQueue.length === 0 ? (
                                  <div style={{ padding: 16, borderRadius: 12, background: "var(--color-bg)", fontSize: 13, color: "var(--color-muted)" }}>
                                      {loadError ? "当前无法加载真实运营队列。" : "当前 Billing 队列为空，暂时没有需要推进的真实账单。"}
                                  </div>
                              ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {financeOpsQueue.map(item => (
                      <div key={item.id} style={{ borderRadius: 12, border: "1px solid var(--color-border)", padding: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-text)" }}>{item.elderlyName}</div>
                                <Tag variant={getInvoiceVariant(item.stage)}>{item.stage}</Tag>
                            </div>
                            <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: "var(--color-muted)" }}>{item.risk}</div>
                            <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.6, color: "var(--color-text)" }}>{item.nextAction}</div>
                            <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-muted)" }}>{item.receiptState}</div>
                        </div>
                    ))}
                  </div>
                              )}
                          </DataCard>

                          <div className="page-grid-2" style={{ alignItems: "start" }}>
                              <DataCard icon={<FileSpreadsheet size={16} />} title="真实账单列表" subtitle="当前列表完全来自 Billing 服务，不再展示本地结算单。">
                                  {financeInvoices.length === 0 ? (
                                      <div style={{ padding: 16, borderRadius: 12, background: "var(--color-bg)", fontSize: 13, color: "var(--color-muted)" }}>
                                          {loadError ? "链路恢复后可重新查看真实账单列表。" : "当前 Billing 数据库还没有账单记录。"}
                                      </div>
                                  ) : (
                                      <div style={{ display: "grid", gap: 10 }}>
                                              {financeInvoices.map(item => {
                                                  const isActive = item.invoiceId === selectedLiveInvoice?.invoiceId
                                                  return (
                                                      <button
                                key={item.invoiceId}
                                type="button"
                                className="btn-reset"
                                onClick={() => setSelectedLiveInvoiceId(item.invoiceId)}
                                style={{
                                    textAlign: "left",
                                    borderRadius: 14,
                                    border: isActive ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                                    background: isActive ? "var(--color-primary-soft)" : "var(--color-panel)",
                                    padding: 14,
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--color-text)" }}>{item.elderName}</div>
                                        <div style={{ marginTop: 4, fontSize: 12.5, color: "var(--color-muted)" }}>{item.invoiceId} · {item.packageName}</div>
                                    </div>
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                        <Tag variant={getInvoiceVariant(item.status)}>{item.status}</Tag>
                                        <Tag variant={getNotificationVariant(item.notificationStatus)}>{item.notificationStatus}</Tag>
                                    </div>
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10, fontSize: 12.5, color: "var(--color-text)" }}>
                                    <span>金额 {formatCurrency(item.amount)}</span>
                                    <span>到期 {new Date(item.dueAtUtc).toLocaleDateString("zh-CN")}</span>
                                    <span>创建 {formatTimestamp(item.createdAtUtc)}</span>
                                </div>
                              </button>
                          )
                      })}
                                      </div>
                                  )}
                              </DataCard>

                              <DataCard
                                  icon={<Wallet size={16} />}
                                  title={selectedLiveInvoice ? `${selectedLiveInvoice.elderName} 账单详情` : "账单详情"}
                                  subtitle={selectedLiveInvoice ? `${selectedLiveInvoice.packageName} · ${selectedLiveInvoice.invoiceId}` : "请选择左侧账单"}
                                  badge={selectedLiveInvoice ? <Tag variant={getNotificationVariant(selectedLiveInvoice.notificationStatus)}>{selectedLiveInvoice.notificationStatus}</Tag> : undefined}
                              >
                                  {!selectedLiveInvoice ? (
                                      <div style={{ padding: 16, borderRadius: 12, background: "var(--color-bg)", fontSize: 13, color: "var(--color-muted)" }}>
                                          {loadError ? "当前没有可展示的真实账单详情。" : "请选择左侧账单查看详情。"}
                                      </div>
                                  ) : (
                                      <>
                                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 14 }}>
                                              <div style={{ borderRadius: 12, background: "var(--color-bg)", padding: 12 }}>
                                                      <div style={{ fontSize: 12, color: "var(--color-muted)" }}>账单金额</div>
                                                      <div style={{ marginTop: 6, fontSize: 18, fontWeight: 800, color: "var(--color-text)" }}>{formatCurrency(selectedLiveInvoice.amount)}</div>
                                                  </div>
                                                  <div style={{ borderRadius: 12, background: "var(--color-bg)", padding: 12 }}>
                                                      <div style={{ fontSize: 12, color: "var(--color-muted)" }}>账单状态</div>
                                                      <div style={{ marginTop: 6, fontSize: 18, fontWeight: 800, color: "var(--color-primary)" }}>{selectedLiveInvoice.status}</div>
                                                  </div>
                                                  <div style={{ borderRadius: 12, background: "var(--color-bg)", padding: 12 }}>
                                                      <div style={{ fontSize: 12, color: "var(--color-muted)" }}>通知状态</div>
                                                      <div style={{ marginTop: 6, fontSize: 18, fontWeight: 800, color: selectedLiveInvoice.notificationStatus === "Failed" ? "var(--color-danger)" : "var(--color-success)" }}>{selectedLiveInvoice.notificationStatus}</div>
                                                  </div>
                                              </div>

                                          <div style={{ display: "grid", gap: 8, fontSize: 12.5, color: "var(--color-text)" }}>
                                              <div>账单号：{selectedLiveInvoice.invoiceId}</div>
                                              <div>老人编号：{selectedLiveInvoice.elderId}</div>
                                              <div>套餐：{selectedLiveInvoice.packageName}</div>
                                              <div>创建时间：{formatTimestamp(selectedLiveInvoice.createdAtUtc)}</div>
                                              <div>到期时间：{formatTimestamp(selectedLiveInvoice.dueAtUtc)}</div>
                                              <div>最后更新时间：{formatTimestamp(selectedLiveInvoice.updatedAtUtc)}</div>
                                          </div>
                                      </>
                                  )}
                              </DataCard>
                          </div>
            </>
          )}
          rail={(
            <>
              <DataCard
                title="API 对接状态"
                subtitle={financeIntegrationNote}
                      badge={<Tag variant={loadError ? "danger" : "success"}>{loadError ? "Live Unavailable" : "Live API"}</Tag>}
              >
                      <div style={{ fontSize: 12.5, lineHeight: 1.7, color: "var(--color-muted)" }}>
                          {loadError
                              ? "当前范围仍是财务摘要、账单队列、票据与通知风险；接口恢复前页面保持 live 错误态，不回退 demo workflow。"
                              : "当前范围：财务摘要、账单队列、票据与通知风险。live 模式下不再混用本地结算 store，也不再展示 demo 开票入口。"}
                      </div>
              </DataCard>

              <DataCard
                icon={<ShieldCheck size={16} />}
                      title="账单状态速览"
                      subtitle="只保留影响当前判断的真实状态摘要。"
                      badge={<Tag variant={loadError ? "warning" : "success"}>{loadError ? "Live Status" : "Live Summary"}</Tag>}
              >
                      <div style={{ padding: "0 4px" }}>
                          {liveStatusSummary.map(item => (
                    <StatusRow key={item.label} label={item.label} count={item.count} amount={item.amount} color={item.color} />
                  ))}
                </div>
              </DataCard>

              <PageHelpCard
                title="财务中心帮助"
                subtitle="完整模块说明、流程和稽核口径已迁到帮助页。"
                summary="首屏右侧只保留实时状态和少量决策摘要；更长的模块解释、归档说明和培训性内容不再默认展开。"
                items={financeHelpItems}
                href="/financial/help"
              />
            </>
          )}
        />
      </div>
    </ModuleEntitlementGate>
  )
}
