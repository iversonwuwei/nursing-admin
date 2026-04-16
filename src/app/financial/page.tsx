"use client"

import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard, type TagVariant } from "@/components/nh"
import { ModuleEntitlementGate } from '@/components/platform/ModuleEntitlementGate'
import { buildAiAssistantHref } from "@/lib/ai-context"
import { getCareScene, matchesAdmissionScene } from "@/lib/care-scenes"
import { getAssessmentConfigForCase, getAssessmentConfigSnapshot, subscribeAssessmentConfigWorkflow } from "@/lib/mock/assessment-config-workflow"
import {
  getAssessmentCasesSnapshot,
  getAssessmentStatusLabel,
  getEvidenceStatusVariant,
  getSettlementCases,
  getSettlementStatusVariant,
  subscribeAssessmentWorkflow,
} from "@/lib/mock/assessment-workflow"
import {
  createFinanceInvoice,
  fetchFinanceCenterSnapshot,
  type AdminFinanceSummaryResponse,
  type BillingInvoiceResponse,
} from "@/lib/services/admin-module-services"
import { CircleAlert, FileSpreadsheet, ShieldCheck, Wallet, Waypoints } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState, useSyncExternalStore } from "react"

const FINANCE_WORKFLOW_STAGES = [
  { id: 'calc', title: '费用计算', detail: '按服务包、耗材、附加项和人工调整归集费用。', tag: '核算', variant: 'primary' as TagVariant },
  { id: 'issue', title: '账单生成', detail: '确认出账批次并形成家属或机构应收账单。', tag: '出账', variant: 'primary' as TagVariant },
  { id: 'notify', title: '通知触达', detail: '把账单、催缴和补充说明推送到通知服务。', tag: '通知', variant: 'info' as TagVariant },
  { id: 'overdue', title: '欠费预警', detail: '对即将逾期与已逾期账单形成升级催缴动作。', tag: '预警', variant: 'warning' as TagVariant },
  { id: 'receipt', title: '票据归档', detail: '完成收据、发票、补偿与对账说明留档。', tag: '归档', variant: 'success' as TagVariant },
] as const

function formatCurrency(amount: number) {
  return `¥${amount.toLocaleString()}`
}

function getRatio(value: number, total: number) {
  if (total <= 0) {
    return 0
  }

  return Math.round((value / total) * 100)
}

function buildInvoiceDueAtUtc() {
  const dueAt = new Date()
  dueAt.setDate(dueAt.getDate() + 7)
  return dueAt.toISOString()
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
  const searchParams = useSearchParams()
  const scene = getCareScene(searchParams.get('scene'))
  const [financeSummary, setFinanceSummary] = useState<AdminFinanceSummaryResponse | null>(null)
  const [financeInvoices, setFinanceInvoices] = useState<BillingInvoiceResponse[]>([])
  const [selectedLiveInvoiceId, setSelectedLiveInvoiceId] = useState('')
  const [financeDataSource, setFinanceDataSource] = useState<'live' | 'demo'>('demo')
  const [financeIntegrationNote, setFinanceIntegrationNote] = useState('正在同步财务服务摘要与账单队列...')
  const [issuingInvoice, setIssuingInvoice] = useState(false)
  const [financeActionNotice, setFinanceActionNotice] = useState<{ variant: TagVariant; message: string } | null>(null)
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
  const assessmentSourceMap = useMemo(
    () => Object.fromEntries(assessmentCases.map(item => [item.id, item.sourceType ?? 'manual-form'])),
    [assessmentCases],
  )
  const sceneScopedSettlements = useMemo(
    () => settlementCases.filter(item => matchesAdmissionScene(assessmentSourceMap[item.assessmentId], scene)),
    [assessmentSourceMap, scene, settlementCases],
  )
  const sceneMeta = scene === 'home'
    ? {
      title: '居家评定结算与质控',
      subtitle: '资料导入个案 -> 上门评定 -> 质控抽检 -> 评估费结算',
    }
    : scene === 'institutional'
      ? {
        title: '机构评定结算与质控',
        subtitle: '院内认定个案 -> 结论复核 -> 质控抽检 -> 评估费结算',
      }
      : {
        title: '评定服务结算与质控',
        subtitle: '个案评定 -> 结论复核 -> 质控抽检 -> 评估费结算',
      }

  const selectedSettlement = useMemo(
    () => sceneScopedSettlements.find(item => item.id === selectedId) ?? sceneScopedSettlements[0],
    [sceneScopedSettlements, selectedId],
  )
  const selectedPackageName = selectedSettlement
    ? (assessmentProfiles[selectedSettlement.assessmentId]?.template?.name ?? '长护险评定服务费')
    : '长护险评定服务费'
  const invoiceDisabledReason = !selectedSettlement
    ? '请选择一张结算单后再发起评估费结算。'
    : selectedSettlement.evidenceStatus === '待补充'
      ? '当前结算单资料待补充，暂不允许发起真实开票。'
      : null

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
        setFinanceDataSource('live')
        setFinanceIntegrationNote(
          snapshot.invoices.length > 0
            ? '当前页面已接入真实财务摘要与账单队列；live 模式下全页只展示 Billing 持久化账单与汇总。'
            : '当前页面已接入真实财务摘要，但当前账单队列为空；页面保持 live 空态，不再混用本地评定结算 workflow。',
        )
      } catch (error) {
        if (disposed) {
          return
        }

        setFinanceSummary(null)
        setFinanceInvoices([])
        setFinanceDataSource('demo')
        setFinanceIntegrationNote(error instanceof Error ? error.message : '财务服务不可用，已回退为评定结算演示视图。')
      }
    }

    void loadFinanceSnapshot()

    return () => {
      disposed = true
    }
  }, [])

  async function handleIssueInvoice() {
    if (!selectedSettlement) {
      setFinanceActionNotice({ variant: 'warning', message: '请先选择一张结算单。' })
      return
    }

    if (selectedSettlement.evidenceStatus === '待补充') {
      setFinanceActionNotice({ variant: 'warning', message: '当前结算单资料待补充，暂不允许发起真实开票。' })
      return
    }

    setIssuingInvoice(true)
    setFinanceActionNotice(null)

    const dueAtUtc = buildInvoiceDueAtUtc()

    try {
      const createdInvoice = await createFinanceInvoice({
        elderId: selectedSettlement.assessmentId,
        elderName: selectedSettlement.elderlyName,
        packageName: selectedPackageName,
        amount: selectedSettlement.totalAmount,
        dueAtUtc,
      })

      setFinanceActionNotice({
        variant: 'success',
        message: `已为 ${selectedSettlement.elderlyName} 创建真实账单 ${createdInvoice.invoiceId}，当前状态 ${createdInvoice.status}。`,
      })
      setFinanceIntegrationNote('财务页已通过真实 Billing 写接口创建账单，并尝试刷新摘要与账单队列。')

      try {
        const snapshot = await fetchFinanceCenterSnapshot()
        setFinanceSummary(snapshot.summary)
        setFinanceInvoices(snapshot.invoices)
        setFinanceDataSource('live')
      } catch (refreshError) {
        setFinanceInvoices(current => [createdInvoice, ...current.filter(item => item.invoiceId !== createdInvoice.invoiceId)])
        setFinanceSummary(current => current ? {
          ...current,
          issued: current.issued + 1,
          generatedAtUtc: new Date().toISOString(),
        } : current)
        setFinanceIntegrationNote(refreshError instanceof Error
          ? `账单已创建，但财务摘要刷新失败：${refreshError.message}`
          : '账单已创建，但财务摘要刷新失败。')
      }
    } catch (error) {
      setFinanceActionNotice({
        variant: 'danger',
        message: error instanceof Error ? error.message : '真实开票失败，请稍后重试。',
      })
    } finally {
      setIssuingInvoice(false)
    }
  }

  const totals = useMemo(() => {
    const totalAmount = sceneScopedSettlements.reduce((sum, item) => sum + item.totalAmount, 0)
    const fundAmount = sceneScopedSettlements.reduce((sum, item) => sum + item.fundAmount, 0)
    const copayAmount = sceneScopedSettlements.reduce((sum, item) => sum + item.copayAmount, 0)
    const riskCases = sceneScopedSettlements.filter(item => item.riskFlags.length > 0 || item.evidenceStatus === "待补充").length
    const settledFundAmount = sceneScopedSettlements
      .filter(item => item.status === "已结算")
      .reduce((sum, item) => sum + item.fundAmount, 0)
    const statusSummary = [
      {
        label: "待初审",
        count: sceneScopedSettlements.filter(item => item.status === "待初审").length,
        amount: sceneScopedSettlements.filter(item => item.status === "待初审").reduce((sum, item) => sum + item.fundAmount, 0),
        color: "var(--color-warning)",
      },
      {
        label: "待复核",
        count: sceneScopedSettlements.filter(item => item.status === "待复核").length,
        amount: sceneScopedSettlements.filter(item => item.status === "待复核").reduce((sum, item) => sum + item.fundAmount, 0),
        color: "var(--color-primary)",
      },
      {
        label: "待拨付",
        count: sceneScopedSettlements.filter(item => item.status === "待拨付").length,
        amount: sceneScopedSettlements.filter(item => item.status === "待拨付").reduce((sum, item) => sum + item.fundAmount, 0),
        color: "var(--color-info)",
      },
      {
        label: "已结算",
        count: sceneScopedSettlements.filter(item => item.status === "已结算").length,
        amount: sceneScopedSettlements.filter(item => item.status === "已结算").reduce((sum, item) => sum + item.fundAmount, 0),
        color: "var(--color-success)",
      },
    ]
    const sceneSummary = ["首次认定", "复评复核", "抽检回访"].map(scene => ({
      label: scene,
      amount: sceneScopedSettlements
        .filter(item => assessmentProfiles[item.assessmentId]?.scene === scene)
        .reduce((sum, item) => sum + item.totalAmount, 0),
    }))
    const confirmedRate = getRatio(fundAmount, totalAmount)
    const settledRate = getRatio(settledFundAmount, fundAmount)

    return {
      totalAmount,
      fundAmount,
      copayAmount,
      riskCases,
      settledFundAmount,
      confirmedRate,
      settledRate,
      statusSummary,
      sceneSummary,
    }
  }, [assessmentProfiles, sceneScopedSettlements])

  const aiInsights = useMemo<Array<{
    id: string
    title: string
    summary: string
    metric: string
    variant: TagVariant
    action: string
  }>>(() => {
    const incompleteEvidence = sceneScopedSettlements.filter(item => item.evidenceStatus === "待补充").length
    const adjustedCases = sceneScopedSettlements.filter(item => item.riskFlags.some(flag => flag.includes("人工调整"))).length
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
  }, [sceneScopedSettlements, totals.fundAmount, totals.settledFundAmount, totals.totalAmount])

  const buildAiHref = (focus: string, target: "inference" | "rules" | "logs" = "inference") => buildAiAssistantHref({
    source: "financial",
    entityId: selectedSettlement?.id ?? "ltci-financial",
    entityName: selectedSettlement ? `${selectedSettlement.elderlyName}结算单` : "长护险结算看板",
    focus,
    target,
    scene: scene ?? undefined,
  })

  const financeServiceModules = useMemo(() => {
    if (financeSummary) {
      return [
        { id: 'calc', label: '费用计算', metric: financeSummary.pendingReview, sub: '待初审 / 待补资料', note: '真实摘要已接入，先清理待初审与资料缺口。', variant: financeSummary.pendingReview > 0 ? 'warning' : 'success' as TagVariant },
        { id: 'billing', label: '账单生成', metric: financeSummary.issued, sub: '已出账批次', note: '账单生成已从 Billing 服务读取当前出账规模。', variant: financeSummary.issued > 0 ? 'primary' : 'success' as TagVariant },
        { id: 'overdue', label: '欠费预警', metric: financeSummary.overdue + financeSummary.actionRequired, sub: '逾期 / 待处理', note: '优先处理逾期账单与失败通知导致的追缴动作。', variant: financeSummary.overdue + financeSummary.actionRequired > 0 ? 'danger' : 'success' as TagVariant },
        { id: 'receipt', label: '票据管理', metric: financeSummary.pendingArchive, sub: '待归档票据', note: '票据归档与通知回执都来自真实账单摘要，便于后续接入归档动作。', variant: financeSummary.pendingArchive > 0 ? 'info' : 'neutral' as TagVariant },
      ]
    }

    const pendingReview = sceneScopedSettlements.filter(item => item.evidenceStatus === '待补充' || item.riskFlags.length > 0).length
    const billingBatches = sceneScopedSettlements.filter(item => item.status === '待初审' || item.status === '待复核').length
    const overdueWarnings = sceneScopedSettlements.filter(item => item.status === '待拨付').length
    const receiptArchives = sceneScopedSettlements.filter(item => item.status === '已结算').length

    return [
      { id: 'calc', label: '费用计算', metric: pendingReview, sub: '服务包 / 耗材 / 加项 / 调整', note: '先确认资料与规则，再确认费用口径。', variant: pendingReview > 0 ? 'warning' : 'success' as TagVariant },
      { id: 'billing', label: '账单生成', metric: billingBatches, sub: '待初审 / 待复核批次', note: '出账前需绑定结算批次与通知动作。', variant: billingBatches > 0 ? 'primary' : 'success' as TagVariant },
      { id: 'overdue', label: '欠费预警', metric: overdueWarnings, sub: '待拨付 / 待催缴', note: '逾期前先触发提醒，逾期后升级催缴。', variant: overdueWarnings > 0 ? 'danger' : 'success' as TagVariant },
      { id: 'receipt', label: '票据管理', metric: receiptArchives, sub: '已结算 / 待归档', note: '回款后需补齐票据与补偿留痕。', variant: receiptArchives > 0 ? 'info' : 'neutral' as TagVariant },
    ]
  }, [financeSummary, sceneScopedSettlements])

  const financeOpsQueue = useMemo(() => {
    if (financeInvoices.length) {
      return financeInvoices.slice(0, 4).map(item => ({
        id: item.invoiceId,
        elderlyName: item.elderName,
        stage: item.status,
        risk: item.notificationStatus === 'failed' ? '账单通知失败，需要人工补发。' : item.status === 'overdue' ? '账单已逾期，需要升级催缴。' : '账单已生成，可推进通知与归档。',
        nextAction: item.status === 'overdue' ? '确认催缴节点与回款计划' : item.notificationStatus === 'pending' ? '触发账单通知并跟踪回执' : '核对票据与到账说明',
        receiptState: item.status === 'paid' ? '待归档票据' : '待补票据',
      }))
    }

    return sceneScopedSettlements.slice(0, 4).map(item => ({
      id: item.id,
      elderlyName: item.elderlyName,
      stage: item.status,
      risk: item.riskFlags[0] ?? (item.evidenceStatus === '待补充' ? '资料待补齐' : '可推进出账'),
      nextAction: item.status === '待拨付' ? '确认回款计划与催缴节点' : item.nextAction,
      receiptState: item.status === '已结算' ? '待归档票据' : '待补票据',
    }))
  }, [financeInvoices, sceneScopedSettlements])

  const selectedLiveInvoice = useMemo(
    () => financeInvoices.find(item => item.invoiceId === selectedLiveInvoiceId) ?? financeInvoices[0] ?? null,
    [financeInvoices, selectedLiveInvoiceId],
  )

  const liveInvoiceTotals = useMemo(() => {
    const totalAmount = financeInvoices.reduce((sum, item) => sum + item.amount, 0)
    const issuedAmount = financeInvoices.filter(item => item.status === 'Issued').reduce((sum, item) => sum + item.amount, 0)
    const actionRequiredAmount = financeInvoices.filter(item => item.status === 'ActionRequired').reduce((sum, item) => sum + item.amount, 0)
    const failedAmount = financeInvoices.filter(item => item.notificationStatus === 'Failed').reduce((sum, item) => sum + item.amount, 0)

    return {
      totalAmount,
      issuedAmount,
      actionRequiredAmount,
      failedAmount,
    }
  }, [financeInvoices])

  const liveStatusSummary = useMemo(() => ([
    {
      label: '已出账',
      count: financeInvoices.filter(item => item.status === 'Issued').length,
      amount: financeInvoices.filter(item => item.status === 'Issued').reduce((sum, item) => sum + item.amount, 0),
      color: 'var(--color-primary)',
    },
    {
      label: '待处理',
      count: financeInvoices.filter(item => item.status === 'ActionRequired').length,
      amount: financeInvoices.filter(item => item.status === 'ActionRequired').reduce((sum, item) => sum + item.amount, 0),
      color: 'var(--color-warning)',
    },
    {
      label: '通知失败',
      count: financeInvoices.filter(item => item.notificationStatus === 'Failed').length,
      amount: financeInvoices.filter(item => item.notificationStatus === 'Failed').reduce((sum, item) => sum + item.amount, 0),
      color: 'var(--color-danger)',
    },
    {
      label: '通知送达',
      count: financeInvoices.filter(item => item.notificationStatus === 'Delivered').length,
      amount: financeInvoices.filter(item => item.notificationStatus === 'Delivered').reduce((sum, item) => sum + item.amount, 0),
      color: 'var(--color-success)',
    },
  ]), [financeInvoices])

  const financeHelpItems = useMemo(() => {
    const firstModule = financeServiceModules[0]
    const secondModule = financeServiceModules[1]
    const fallbackInsight = aiInsights[0]?.action ?? '完整稽核说明与资料补齐口径已迁到帮助页。'

    return [
      firstModule ? `${firstModule.label}：${firstModule.note}` : '先确认当前账单或结算单是否需要推进。',
      secondModule ? `${secondModule.label}：${secondModule.note}` : '失败通知与待处理账单优先进入人工队列。',
      `流程：${FINANCE_WORKFLOW_STAGES.map(step => step.title).join(' -> ')}`,
      financeDataSource === 'live' ? '完整出账、欠费与归档说明已迁到帮助页。' : fallbackInsight,
    ]
  }, [aiInsights, financeDataSource, financeServiceModules])

  return (
    <ModuleEntitlementGate
      module="finance-service"
      pageTitle={sceneMeta.title}
      moduleLabel="财务服务"
      disabledSummary="当前租户未开通财务服务。页面保留为只读禁用态，避免账单、结算和票据流程超出套餐边界。"
      fallbackLinks={[
        { href: '/', label: '返回首页' },
        { href: '/analytics', label: '查看运营分析' },
      ]}
    >
    <div className="page-root animate-fade-up">
      <PageHeader
          title={sceneMeta.title}
          subtitle={financeDataSource === 'live'
            ? '当前页面已切到真实财务链路，所有主视图均来自 Billing 持久化账单与摘要。'
            : `评定闭环：${sceneMeta.subtitle} · 同时补齐费用计算、账单生成、欠费预警、票据管理四类财务模块`}
        actions={(
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <button className="btn btn-secondary btn-sm">导出结算底稿</button>
                {financeDataSource !== 'live' ? (
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={Boolean(invoiceDisabledReason) || issuingInvoice}
                    onClick={() => { void handleIssueInvoice() }}
                    title={invoiceDisabledReason ?? undefined}
                  >
                    {issuingInvoice ? '结算开票中...' : '发起评估费结算'}
                  </button>
                ) : null}
              </div>
              {financeDataSource !== 'live' && invoiceDisabledReason ? (
                <div style={{ maxWidth: 280, fontSize: 12, lineHeight: 1.5, color: 'var(--color-warning)' }}>{invoiceDisabledReason}</div>
              ) : financeActionNotice ? (
                <div style={{ maxWidth: 320, fontSize: 12, lineHeight: 1.5, color: financeActionNotice.variant === 'danger' ? 'var(--color-danger)' : financeActionNotice.variant === 'warning' ? 'var(--color-warning)' : 'var(--color-muted)' }}>
                  {financeActionNotice.message}
                </div>
              ) : null}
            </div>
          )}
        />

        <InteractionRailLayout
          main={financeDataSource === 'live' ? (
            <>
              <WorkflowOverviewCard
                eyebrow="Billing Overview"
                title={selectedLiveInvoice ? `${selectedLiveInvoice.elderName} 账单总览` : '真实账单总览'}
                description={selectedLiveInvoice
                  ? `${selectedLiveInvoice.packageName} · 到期 ${new Date(selectedLiveInvoice.dueAtUtc).toLocaleString('zh-CN')}。当前视图只读取 Billing 持久化账单，不再混用前端本地结算 store。`
                  : '当前页已切到真实 Billing 持久化账单视图，所有总览、列表与详情都来自后端。'}
                badge={selectedLiveInvoice ? <Tag variant={selectedLiveInvoice.notificationStatus === 'Failed' ? 'warning' : 'info'}>{selectedLiveInvoice.status}</Tag> : <Tag variant="success">Live Billing</Tag>}
                metrics={[
                  { label: '真实账单数', value: financeInvoices.length, hint: '当前 Billing 持久化记录', tone: 'primary' },
                  { label: '账单总额', value: formatCurrency(liveInvoiceTotals.totalAmount), hint: `已出账 ${formatCurrency(liveInvoiceTotals.issuedAmount)}`, tone: 'success' },
                  { label: '待处理金额', value: formatCurrency(liveInvoiceTotals.actionRequiredAmount), hint: 'ActionRequired 账单', tone: liveInvoiceTotals.actionRequiredAmount > 0 ? 'warning' : 'success' },
                  { label: '通知失败金额', value: formatCurrency(liveInvoiceTotals.failedAmount), hint: '需要补发或升级', tone: liveInvoiceTotals.failedAmount > 0 ? 'danger' : 'info' },
                ]}
                signals={[
                  { label: selectedLiveInvoice ? `当前选中账单 ${selectedLiveInvoice.invoiceId}` : '请选择左侧账单查看详情', tone: selectedLiveInvoice ? 'info' : 'neutral' },
                  { label: financeSummary?.overdue ? `逾期账单 ${financeSummary.overdue} 单` : '当前无逾期账单', tone: financeSummary?.overdue ? 'warning' : 'success' },
                  { label: financeSummary?.failedNotifications ? `通知失败 ${financeSummary.failedNotifications} 单` : '当前无通知失败', tone: financeSummary?.failedNotifications ? 'danger' : 'success' },
                ]}
                actions={(
                  <>
                    <button className="btn btn-secondary btn-sm">导出账单清单</button>
                    <Link href={buildAiHref('billing-live-audit', 'logs')} className="btn btn-secondary btn-sm">查看 AI 稽核</Link>
                  </>
                )}
              />

              <div className="kpi-grid" style={{ marginBottom: 16 }}>
                <StatCard icon={<FileSpreadsheet size={18} />} label="真实账单" value={financeInvoices.length} sub="来自 Billing 持久化数据" color="primary" />
                <StatCard icon={<Wallet size={18} />} label="账单总额" value={formatCurrency(liveInvoiceTotals.totalAmount)} sub={`已出账 ${formatCurrency(liveInvoiceTotals.issuedAmount)}`} color="success" />
                <StatCard icon={<Waypoints size={18} />} label="待处理账单" value={financeSummary?.actionRequired ?? 0} sub="ActionRequired 状态" color="warning" />
                <StatCard icon={<CircleAlert size={18} />} label="通知失败" value={financeSummary?.failedNotifications ?? 0} sub="需要人工补发或升级" color="danger" />
              </div>

              <div className="page-grid-2" style={{ alignItems: 'start' }}>
                <DataCard icon={<FileSpreadsheet size={16} />} title="真实账单列表" subtitle="当前列表完全来自 Billing 服务，不再展示本地结算单。">
                  {financeInvoices.length === 0 ? (
                    <div style={{ padding: 16, borderRadius: 12, background: 'var(--color-bg)', fontSize: 13, color: 'var(--color-muted)' }}>当前 Billing 数据库还没有账单记录。</div>
                  ) : (
                    <div style={{ display: 'grid', gap: 10 }}>
                      {financeInvoices.map(item => {
                        const isActive = item.invoiceId === selectedLiveInvoice?.invoiceId
                        return (
                          <button
                            key={item.invoiceId}
                            type="button"
                            className="btn-reset"
                            onClick={() => setSelectedLiveInvoiceId(item.invoiceId)}
                            style={{
                              textAlign: 'left',
                              borderRadius: 14,
                              border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                              background: isActive ? 'var(--color-primary-soft)' : 'var(--color-panel)',
                              padding: 14,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)' }}>{item.elderName}</div>
                                <div style={{ marginTop: 4, fontSize: 12.5, color: 'var(--color-muted)' }}>{item.invoiceId} · {item.packageName}</div>
                              </div>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                <Tag variant={item.status === 'ActionRequired' ? 'warning' : 'info'}>{item.status}</Tag>
                                <Tag variant={item.notificationStatus === 'Failed' ? 'danger' : item.notificationStatus === 'Delivered' ? 'success' : 'info'}>{item.notificationStatus}</Tag>
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10, fontSize: 12.5, color: 'var(--color-text)' }}>
                              <span>金额 {formatCurrency(item.amount)}</span>
                              <span>到期 {new Date(item.dueAtUtc).toLocaleDateString('zh-CN')}</span>
                              <span>创建 {new Date(item.createdAtUtc).toLocaleString('zh-CN')}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </DataCard>

                <DataCard
                  icon={<Wallet size={16} />}
                  title={selectedLiveInvoice ? `${selectedLiveInvoice.elderName} 账单详情` : '账单详情'}
                  subtitle={selectedLiveInvoice ? `${selectedLiveInvoice.packageName} · ${selectedLiveInvoice.invoiceId}` : '请选择左侧账单'}
                  badge={selectedLiveInvoice ? <Tag variant={selectedLiveInvoice.notificationStatus === 'Failed' ? 'warning' : 'success'}>{selectedLiveInvoice.notificationStatus}</Tag> : undefined}
                >
                  {!selectedLiveInvoice ? (
                    <div style={{ padding: 16, borderRadius: 12, background: 'var(--color-bg)', fontSize: 13, color: 'var(--color-muted)' }}>暂无可展示的账单详情。</div>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
                        <div style={{ borderRadius: 12, background: 'var(--color-bg)', padding: 12 }}>
                          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>账单金额</div>
                          <div style={{ marginTop: 6, fontSize: 18, fontWeight: 800, color: 'var(--color-text)' }}>{formatCurrency(selectedLiveInvoice.amount)}</div>
                        </div>
                        <div style={{ borderRadius: 12, background: 'var(--color-bg)', padding: 12 }}>
                          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>账单状态</div>
                          <div style={{ marginTop: 6, fontSize: 18, fontWeight: 800, color: 'var(--color-primary)' }}>{selectedLiveInvoice.status}</div>
                        </div>
                        <div style={{ borderRadius: 12, background: 'var(--color-bg)', padding: 12 }}>
                          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>通知状态</div>
                          <div style={{ marginTop: 6, fontSize: 18, fontWeight: 800, color: selectedLiveInvoice.notificationStatus === 'Failed' ? 'var(--color-danger)' : 'var(--color-success)' }}>{selectedLiveInvoice.notificationStatus}</div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gap: 8, fontSize: 12.5, color: 'var(--color-text)' }}>
                        <div>账单号：{selectedLiveInvoice.invoiceId}</div>
                        <div>老人编号：{selectedLiveInvoice.elderId}</div>
                        <div>套餐：{selectedLiveInvoice.packageName}</div>
                        <div>创建时间：{new Date(selectedLiveInvoice.createdAtUtc).toLocaleString('zh-CN')}</div>
                        <div>到期时间：{new Date(selectedLiveInvoice.dueAtUtc).toLocaleString('zh-CN')}</div>
                        <div>最后更新时间：{selectedLiveInvoice.updatedAtUtc ? new Date(selectedLiveInvoice.updatedAtUtc).toLocaleString('zh-CN') : '暂无更新'}</div>
                      </div>
                    </>
                  )}
                </DataCard>
              </div>
            </>
          ) : (
            <>
                <WorkflowOverviewCard
                  eyebrow="Settlement Operations"
                  title={selectedSettlement ? `${selectedSettlement.elderlyName} 结算推进摘要` : '评定服务结算总览'}
                  description={selectedSettlement
                    ? `${selectedSettlement.periodLabel} · ${selectedSettlement.institutionName}。当前视图把结算门禁、资料完整性、规则匹配和风险提示聚合成一条财务可执行路径。`
                    : '当前页按评定闭环后的案件组织结算门禁、风险提示和资金结构，方便财务与质控同步推进。'}
                  badge={selectedSettlement ? <Tag variant={getSettlementStatusVariant(selectedSettlement.status)}>{selectedSettlement.status}</Tag> : <Tag variant="info">LTCI Settlement</Tag>}
                  metrics={[
                    { label: '评定结算单', value: sceneScopedSettlements.length, hint: '已进入结算视图', tone: 'primary' },
                    { label: '已确认结算额', value: formatCurrency(totals.fundAmount), hint: `占应收 ${totals.confirmedRate}%`, tone: 'success' },
                    { label: '待处置风险单', value: totals.riskCases, hint: '资料缺失或需人工复核', tone: totals.riskCases > 0 ? 'warning' : 'success' },
                    { label: '拨付完成率', value: `${totals.settledRate}%`, hint: `已结算 ${formatCurrency(totals.settledFundAmount)}`, tone: totals.settledRate >= 60 ? 'success' : 'info' },
                  ]}
                  signals={[
                    { label: selectedSettlement?.nextAction ?? '请选择左侧结算单查看下一动作', tone: selectedSettlement ? 'info' : 'neutral' },
                    { label: selectedSettlement?.evidenceStatus ?? '待检查资料完整性', tone: selectedSettlement?.evidenceStatus === '待补充' ? 'warning' : 'success' },
                    ...(selectedSettlement?.riskFlags?.length ? selectedSettlement.riskFlags.slice(0, 2).map(flag => ({ label: flag, tone: 'danger' as const })) : [{ label: '当前无额外风险提示', tone: 'success' as const }]),
                  ]}
                  actions={(
                    <>
                      <button className="btn btn-secondary btn-sm">导出结算底稿</button>
                      <Link href={buildAiHref('ltci-settlement-audit', 'logs')} className="btn btn-secondary btn-sm">查看 AI 稽核</Link>
                    </>
                  )}
                />

                <div className="kpi-grid" style={{ marginBottom: 16 }}>
                  <StatCard icon={<FileSpreadsheet size={18} />} label="评定结算单" value={sceneScopedSettlements.length} sub="已进入结算视图" color="primary" />
                  <StatCard icon={<Wallet size={18} />} label="应收评估费" value={formatCurrency(totals.totalAmount)} sub={`已确认 ${formatCurrency(totals.fundAmount)}`} color="success" />
                  <StatCard icon={<Waypoints size={18} />} label="暂缓金额" value={formatCurrency(totals.copayAmount)} sub="待资料补齐或质控复核" color="info" />
                  <StatCard icon={<CircleAlert size={18} />} label="待处置风险单" value={totals.riskCases} sub="资料缺失或需人工复核" color="warning" />
                </div>

                <DataCard
                  icon={<CircleAlert size={16} />}
                  title="财务运营关注项"
                  subtitle="把需要人工推进的账单、欠费和资料风险拉成一个可执行队列。"
                >
                  <div style={{ display: "grid", gap: 10 }}>
                    {financeOpsQueue.map(item => (
                      <div key={item.id} style={{ borderRadius: 12, border: "1px solid var(--color-border)", padding: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-text)" }}>{item.elderlyName}</div>
                        <Tag variant={item.stage === '待拨付' ? 'danger' : item.stage === '已结算' ? 'success' : 'warning'}>{item.stage}</Tag>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: "var(--color-muted)" }}>{item.risk}</div>
                      <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.6, color: "var(--color-text)" }}>{item.nextAction}</div>
                    </div>
                  ))}
                  </div>
                </DataCard>

                <div className="page-grid-2" style={{ alignItems: "start" }}>
                  <DataCard
                    icon={<FileSpreadsheet size={16} />}
                    title="结算单列表"
                    subtitle={scene === 'home' ? '按居家资料导入个案的结算状态和资料完整性排序。' : scene === 'institutional' ? '按院内认定个案的结算状态和资料完整性排序。' : '按结算状态和资料完整性排序，优先处理存在风险标记的评定案件。'}
                  >
                    {sceneScopedSettlements.length === 0 ? (
                      <div style={{ padding: 16, borderRadius: 12, background: "var(--color-bg)", fontSize: 13, color: "var(--color-muted)" }}>
                        当前还没有进入结算阶段的评定案件。请先在评估认定页确认认定等级并出具结论。
                      </div>
                    ) : (
                      <div style={{ display: "grid", gap: 10 }}>
                        {sceneScopedSettlements.map(item => {
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
            </>
          )}
          rail={(
            <>
              <DataCard
                title="API 对接状态"
                subtitle={financeIntegrationNote}
                badge={<Tag variant={financeDataSource === 'live' ? 'success' : 'warning'}>{financeDataSource === 'live' ? 'Live API' : 'Demo Fallback'}</Tag>}
              >
                <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                  {financeDataSource === 'live'
                    ? '当前范围：财务摘要、账单队列、票据与通知风险。live 模式下不再混用本地结算 store；若接口不可用才回退到 demo workflow。'
                    : '当前范围：财务摘要、账单队列、评估费结算开票。保留项：长护险评定结算 workflow 仍走本地 store。回滚方式：移除本页财务 API 读写层即可恢复原视图。'}
                </div>
                {financeActionNotice ? (
                  <div style={{ marginTop: 10 }}>
                    <Tag variant={financeActionNotice.variant}>{financeActionNotice.message}</Tag>
                  </div>
                ) : null}
              </DataCard>

              <DataCard
                icon={<ShieldCheck size={16} />}
                title={financeDataSource === 'live' ? '账单状态速览' : '结算推进态势'}
                subtitle={financeDataSource === 'live' ? '只保留影响当前判断的状态摘要。' : '只保留资料与拨付相关的高价值进度摘要。'}
                badge={<Tag variant={financeDataSource === 'live' ? 'success' : 'info'}>{financeDataSource === 'live' ? 'Live Summary' : 'Settlement Summary'}</Tag>}
              >
                <div style={{ padding: '0 4px' }}>
                  {(financeDataSource === 'live' ? liveStatusSummary : totals.statusSummary).map(item => (
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
