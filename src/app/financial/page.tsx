"use client"

import { DataCard, PageHeader, StatCard, Tag, type TagVariant } from "@/components/nh"
import { buildAiAssistantHref } from "@/lib/ai-context"
import { getAssessmentConfigForCase, getAssessmentConfigSnapshot, subscribeAssessmentConfigWorkflow } from "@/lib/mock/assessment-config-workflow"
import {
  getAssessmentCasesSnapshot,
  getAssessmentStatusLabel,
  getEvidenceStatusVariant,
  getSettlementCases,
  getSettlementStatusVariant,
  subscribeAssessmentWorkflow,
} from "@/lib/mock/assessment-workflow"
import { Bot, CircleAlert, FileSpreadsheet, ShieldCheck, Wallet, Waypoints } from "lucide-react"
import Link from "next/link"
import { useMemo, useState, useSyncExternalStore } from "react"

function formatCurrency(amount: number) {
  return `¥${amount.toLocaleString()}`
}

function getRatio(value: number, total: number) {
  if (total <= 0) {
    return 0
  }

  return Math.round((value / total) * 100)
}

function StructureRow({ label, amount, ratio, color }: { label: string; amount: number; ratio: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--color-bg)" }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 13, color: "var(--color-text)" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>{formatCurrency(amount)}</span>
      <span style={{ width: 40, textAlign: "right", fontSize: 12, color: "var(--color-muted)" }}>{ratio}%</span>
      <div style={{ width: 72, height: 6, borderRadius: 999, background: "var(--color-bg)" }}>
        <div style={{ width: `${ratio}%`, height: "100%", borderRadius: 999, background: color }} />
      </div>
    </div>
  )
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

export default function FinancialPage() {
  const assessmentCases = useSyncExternalStore(
    subscribeAssessmentWorkflow,
    getAssessmentCasesSnapshot,
    getAssessmentCasesSnapshot,
  )
  useSyncExternalStore(
    subscribeAssessmentConfigWorkflow,
    getAssessmentConfigSnapshot,
    getAssessmentConfigSnapshot,
  )
  const settlementCases = useMemo(() => getSettlementCases(assessmentCases), [assessmentCases])
  const [selectedId, setSelectedId] = useState("")
  const assessmentProfiles = Object.fromEntries(assessmentCases.map(item => [item.id, getAssessmentConfigForCase(item)]))

  const selectedSettlement = useMemo(
    () => settlementCases.find(item => item.id === selectedId) ?? settlementCases[0],
    [selectedId, settlementCases],
  )

  const totals = useMemo(() => {
    const totalAmount = settlementCases.reduce((sum, item) => sum + item.totalAmount, 0)
    const fundAmount = settlementCases.reduce((sum, item) => sum + item.fundAmount, 0)
    const copayAmount = settlementCases.reduce((sum, item) => sum + item.copayAmount, 0)
    const riskCases = settlementCases.filter(item => item.riskFlags.length > 0 || item.evidenceStatus === "待补充").length
    const settledFundAmount = settlementCases
      .filter(item => item.status === "已结算")
      .reduce((sum, item) => sum + item.fundAmount, 0)
    const statusSummary = [
      {
        label: "待初审",
        count: settlementCases.filter(item => item.status === "待初审").length,
        amount: settlementCases.filter(item => item.status === "待初审").reduce((sum, item) => sum + item.fundAmount, 0),
        color: "var(--color-warning)",
      },
      {
        label: "待复核",
        count: settlementCases.filter(item => item.status === "待复核").length,
        amount: settlementCases.filter(item => item.status === "待复核").reduce((sum, item) => sum + item.fundAmount, 0),
        color: "var(--color-primary)",
      },
      {
        label: "待拨付",
        count: settlementCases.filter(item => item.status === "待拨付").length,
        amount: settlementCases.filter(item => item.status === "待拨付").reduce((sum, item) => sum + item.fundAmount, 0),
        color: "var(--color-info)",
      },
      {
        label: "已结算",
        count: settlementCases.filter(item => item.status === "已结算").length,
        amount: settlementCases.filter(item => item.status === "已结算").reduce((sum, item) => sum + item.fundAmount, 0),
        color: "var(--color-success)",
      },
    ]
    const sceneSummary = ["首次认定", "复评复核", "抽检回访"].map(scene => ({
      label: scene,
      amount: settlementCases
        .filter(item => assessmentProfiles[item.assessmentId]?.scene === scene)
        .reduce((sum, item) => sum + item.totalAmount, 0),
    }))

    return {
      totalAmount,
      fundAmount,
      copayAmount,
      riskCases,
      settledFundAmount,
      statusSummary,
      sceneSummary,
    }
  }, [assessmentProfiles, settlementCases])

  const aiInsights = useMemo<Array<{
    id: string
    title: string
    summary: string
    metric: string
    variant: TagVariant
    action: string
  }>>(() => {
    const incompleteEvidence = settlementCases.filter(item => item.evidenceStatus === "待补充").length
    const adjustedCases = settlementCases.filter(item => item.riskFlags.some(flag => flag.includes("人工调整"))).length
    const settledRate = getRatio(totals.settledFundAmount, totals.fundAmount)

    return [
      {
        id: "risk-evidence",
        title: "资料完整性需要先过门禁",
        summary: incompleteEvidence > 0
          ? `当前有 ${incompleteEvidence} 单仍缺评定签认或抽检补充资料，建议先补证据再发起结算初审。`
          : "当前结算单资料完整，可按批次推进结算初审。",
        metric: `${incompleteEvidence} 单待补`,
        variant: incompleteEvidence > 0 ? "warning" : "success",
        action: "把资料完整性作为发起评估费结算的前置门禁，避免复核退回。",
      },
      {
        id: "risk-review",
        title: "人工调整等级要带着复核依据走",
        summary: adjustedCases > 0
          ? `${adjustedCases} 单存在人工调整认定等级，结算时需附认定说明、规则版本和主管签字。`
          : "本期没有人工等级调整，可按标准路径复核。",
        metric: `${adjustedCases} 单需复核`,
        variant: adjustedCases > 0 ? "primary" : "success",
        action: "把认定说明与模板版本一并打包，减少质控往返。",
      },
      {
        id: "risk-progress",
        title: "评估费结算进度已形成连续看板",
        summary: `当前已确认结算额占应收评估费 ${getRatio(totals.fundAmount, totals.totalAmount)}%，其中已完成拨付占已确认金额 ${settledRate}%。`,
        metric: `${settledRate}% 已结算`,
        variant: settledRate >= 60 ? "success" : "info",
        action: "优先清理待拨付单，保证本期评估费按计划入账。",
      },
    ]
  }, [settlementCases, totals.fundAmount, totals.settledFundAmount, totals.totalAmount])

  const buildAiHref = (focus: string, target: "inference" | "rules" | "logs" = "inference") => buildAiAssistantHref({
    source: "financial",
    entityId: selectedSettlement?.id ?? "ltci-financial",
    entityName: selectedSettlement ? `${selectedSettlement.elderlyName}结算单` : "长护险结算看板",
    focus,
    target,
  })

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title="评定服务结算与质控"
        subtitle={`Demo 闭环：个案评定 -> 结论复核 -> 质控抽检 -> 评估费结算 · 当前 ${settlementCases.length} 单进入结算视图`}
        actions={(
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm">导出结算底稿</button>
            <button className="btn btn-primary btn-sm">发起评估费结算</button>
          </div>
        )}
      />

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard icon={<FileSpreadsheet size={18} />} label="评定结算单" value={settlementCases.length} sub="已进入结算视图" color="primary" />
        <StatCard icon={<Wallet size={18} />} label="应收评估费" value={formatCurrency(totals.totalAmount)} sub={`已确认 ${formatCurrency(totals.fundAmount)}`} color="success" />
        <StatCard icon={<Waypoints size={18} />} label="暂缓金额" value={formatCurrency(totals.copayAmount)} sub="待资料补齐或质控复核" color="info" />
        <StatCard icon={<CircleAlert size={18} />} label="待处置风险单" value={totals.riskCases} sub="资料缺失或需人工复核" color="warning" />
      </div>

      <div className="page-grid-2" style={{ alignItems: "start" }}>
        <DataCard
          icon={<ShieldCheck size={16} />}
          title="结算推进态势"
          subtitle="按资料初审、质控复核、拨付确认三个门禁拆开看当前评估费结算进度。"
          badge={<Tag variant="info">LTCI Settlement</Tag>}
        >
          <div style={{ padding: "0 4px" }}>
            {totals.statusSummary.map(item => (
              <StatusRow key={item.label} label={item.label} count={item.count} amount={item.amount} color={item.color} />
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12.5, lineHeight: 1.7, color: "var(--color-muted)" }}>
            当前页只展示已进入评估认定闭环的案件。待认定确认的申请不会提前进入结算视图，避免评估费口径漂移。
          </div>
        </DataCard>

        <DataCard
          icon={<Bot size={16} />}
          title="AI 稽核提示"
          subtitle="把资料完整性、人工调整和拨付进度转成可执行动作，仍需财务与评定主管复核。"
          badge={<Tag variant="warning">需人工确认</Tag>}
        >
          <div style={{ display: "grid", gap: 10 }}>
            {aiInsights.map(item => (
              <div key={item.id} style={{ borderRadius: 12, border: "1px solid var(--color-border)", padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-text)" }}>{item.title}</div>
                    <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.6, color: "var(--color-muted)" }}>{item.summary}</div>
                  </div>
                  <Tag variant={item.variant}>{item.metric}</Tag>
                </div>
                <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.6, color: "var(--color-text)" }}>{item.action}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <Link href={buildAiHref("ltci-settlement-audit", "logs")} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
          </div>
        </DataCard>
      </div>

      <div className="page-grid-2" style={{ alignItems: "start" }}>
        <DataCard
          icon={<FileSpreadsheet size={16} />}
          title="结算单列表"
          subtitle="按结算状态和资料完整性排序，优先处理存在风险标记的评定案件。"
        >
          {settlementCases.length === 0 ? (
            <div style={{ padding: 16, borderRadius: 12, background: "var(--color-bg)", fontSize: 13, color: "var(--color-muted)" }}>
              当前还没有进入结算阶段的评定案件。请先在评估认定页确认认定等级并出具结论。
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {settlementCases.map(item => {
                const isActive = item.id === selectedSettlement?.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="btn-reset"
                    onClick={() => setSelectedId(item.id)}
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
                        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--color-text)" }}>{item.elderlyName}</div>
                        <div style={{ marginTop: 4, fontSize: 12.5, color: "var(--color-muted)" }}>{item.assessmentId} · {assessmentProfiles[item.assessmentId]?.scene ?? '首次认定'} · {item.careLevel}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <Tag variant={getSettlementStatusVariant(item.status)}>{item.status}</Tag>
                        <Tag variant={getEvidenceStatusVariant(item.evidenceStatus)}>{item.evidenceStatus}</Tag>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10, fontSize: 12.5, color: "var(--color-text)" }}>
                      <span>应收 {formatCurrency(item.totalAmount)}</span>
                      <span>已确认 {formatCurrency(item.fundAmount)}</span>
                      <span>暂缓 {formatCurrency(item.copayAmount)}</span>
                      <span>认定状态 {getAssessmentStatusLabel(item.sourceStatus)}</span>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.6, color: "var(--color-muted)" }}>{item.nextAction}</div>
                  </button>
                )
              })}
            </div>
          )}
        </DataCard>

        <DataCard
          icon={<Wallet size={16} />}
          title={selectedSettlement ? `${selectedSettlement.elderlyName} 结算明细` : "结算明细"}
          subtitle={selectedSettlement ? `${selectedSettlement.periodLabel} · ${selectedSettlement.institutionName} · ${assessmentProfiles[selectedSettlement.assessmentId]?.template?.name ?? '待匹配模板'}` : "请选择左侧结算单"}
          badge={selectedSettlement ? <Tag variant={getSettlementStatusVariant(selectedSettlement.status)}>{selectedSettlement.status}</Tag> : undefined}
        >
          {!selectedSettlement ? (
            <div style={{ padding: 16, borderRadius: 12, background: "var(--color-bg)", fontSize: 13, color: "var(--color-muted)" }}>
              暂无可展示的结算明细。
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 14 }}>
                <div style={{ borderRadius: 12, background: "var(--color-bg)", padding: 12 }}>
                  <div style={{ fontSize: 12, color: "var(--color-muted)" }}>应收总额</div>
                  <div style={{ marginTop: 6, fontSize: 18, fontWeight: 800, color: "var(--color-text)" }}>{formatCurrency(selectedSettlement.totalAmount)}</div>
                </div>
                <div style={{ borderRadius: 12, background: "var(--color-bg)", padding: 12 }}>
                  <div style={{ fontSize: 12, color: "var(--color-muted)" }}>已确认结算额</div>
                  <div style={{ marginTop: 6, fontSize: 18, fontWeight: 800, color: "var(--color-success)" }}>{formatCurrency(selectedSettlement.fundAmount)}</div>
                </div>
                <div style={{ borderRadius: 12, background: "var(--color-bg)", padding: 12 }}>
                  <div style={{ fontSize: 12, color: "var(--color-muted)" }}>暂缓结算额</div>
                  <div style={{ marginTop: 6, fontSize: 18, fontWeight: 800, color: "var(--color-info)" }}>{formatCurrency(selectedSettlement.copayAmount)}</div>
                </div>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {selectedSettlement.lineItems.map(item => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--color-bg)" }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-text)" }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: "var(--color-muted)" }}>{item.quantity}{item.unit} × {formatCurrency(item.unitPrice)}</div>
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-text)" }}>{formatCurrency(item.amount)}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 14, display: "grid", gap: 8, fontSize: 12.5, color: "var(--color-text)" }}>
                <div>提交时间：{selectedSettlement.submittedAt}</div>
                <div>复核时间：{selectedSettlement.reviewedAt ?? "待复核"}</div>
                <div>拨付时间：{selectedSettlement.paidAt ?? "待拨付"}</div>
                  <div>适用规则：{assessmentProfiles[selectedSettlement.assessmentId]?.ruleSet?.name ?? '待匹配规则集'}</div>
                <div>下一动作：{selectedSettlement.nextAction}</div>
                <div>备注：{selectedSettlement.settlementNote}</div>
              </div>

              <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Tag variant={getEvidenceStatusVariant(selectedSettlement.evidenceStatus)}>{selectedSettlement.evidenceStatus}</Tag>
                {selectedSettlement.confirmedBy ? <Tag variant="neutral">认定人 {selectedSettlement.confirmedBy}</Tag> : null}
                {selectedSettlement.riskFlags.length === 0 ? <Tag variant="success">无额外风险提示</Tag> : null}
                {selectedSettlement.riskFlags.map(flag => <Tag key={flag} variant="warning">{flag}</Tag>)}
              </div>
            </>
          )}
        </DataCard>
      </div>

      <div className="page-grid-2" style={{ alignItems: "start" }}>
        <DataCard
          icon={<Waypoints size={16} />}
          title="费用结构"
          subtitle="当前仅按已进入评估闭环的 demo 结算单统计。"
        >
          <div style={{ padding: "0 4px" }}>
            <StructureRow label="已确认结算额" amount={totals.fundAmount} ratio={getRatio(totals.fundAmount, totals.totalAmount)} color="var(--color-success)" />
            <StructureRow label="暂缓结算额" amount={totals.copayAmount} ratio={getRatio(totals.copayAmount, totals.totalAmount)} color="var(--color-info)" />
          </div>
        </DataCard>

        <DataCard
          icon={<FileSpreadsheet size={16} />}
          title="案件类型分布"
          subtitle="用于判断本期评估费集中在哪类认定场景。"
        >
          <div style={{ padding: "0 4px" }}>
            {totals.sceneSummary.map((item, index) => (
              <StructureRow
                key={item.label}
                label={item.label}
                amount={item.amount}
                ratio={getRatio(item.amount, totals.totalAmount)}
                color={index === 0 ? "var(--color-primary)" : index === 1 ? "var(--color-warning)" : "var(--color-info)"}
              />
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <Link href={buildAiHref("ltci-settlement-summary", "inference")} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
          </div>
        </DataCard>
      </div>
    </div>
  )
}
