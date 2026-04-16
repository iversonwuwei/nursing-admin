"use client"

import { DataCard, InteractionRailLayout, PageHelpCard, Tag, type TagVariant } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { getIncidentAiInsight, getIncidentFollowupInsight } from '@/lib/mock/admin-ai'
import { closeIncident, findLiveIncidentById, getOperationsSnapshot, startIncidentHandling, subscribeOperationsWorkflow } from '@/lib/mock/operations-workflow'
import { ArrowLeft, Bot, Edit } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo, useState, useSyncExternalStore } from 'react'

const LEVEL_TAG: Record<string, TagVariant> = { '严重': 'danger', '一般': 'warning', '轻微': 'info' }
const STATUS_TAG: Record<string, TagVariant> = { '待分派': 'info', '处理中': 'warning', '已结案': 'success' }

const TABS = [
  { id: "info", label: "事故信息" },
  { id: "process", label: "处理过程" },
  { id: "file", label: "附件材料" },
]

export default function IncidentDetailPage() {
  const params = useParams()
  const id = params.id as string
  const incidents = useSyncExternalStore(
    subscribeOperationsWorkflow,
    () => getOperationsSnapshot().incidents,
    () => getOperationsSnapshot().incidents,
  )
  const data = useMemo(
    () => findLiveIncidentById(id, getOperationsSnapshot()) ?? incidents[0],
    [id, incidents],
  )
  const incidentAiInput = {
    ...data,
    status: data.status === '待分派' ? '处理中' : data.status,
    handling: [...data.handling],
    attachments: [...data.attachments],
  }
  const [activeTab, setActiveTab] = useState("info")
  const aiInsight = getIncidentAiInsight(incidentAiInput)
  const followupInsight = getIncidentFollowupInsight(incidentAiInput)
  const helpHref = '/incidents/help'
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'incident-detail',
    entityId: data.id,
    entityName: data.title,
    focus,
    target,
  })

  return (
    <div className="page-root animate-fade-up">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/incidents" className="btn btn-ghost btn-icon btn-icon-sm btn-icon">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold" style={{ letterSpacing: "-0.02em" }}>{data.title}</h1>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              编号: {data.id} · {data.time}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tag variant={LEVEL_TAG[data.level]}>{data.level}</Tag>
          <Tag variant={STATUS_TAG[data.status]}>{data.status}</Tag>
          {data.status === '待分派' ? (
            <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={() => startIncidentHandling(data.id)}>
              <Edit size={14} />开始处置
            </button>
          ) : data.status === '处理中' ? (
            <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={() => closeIncident(data.id)}>
              <Edit size={14} />申请结案
            </button>
          ) : (
                <button className="btn btn-primary btn-sm flex items-center gap-2">
                  <Edit size={14} />编辑
                </button>
          )}
        </div>
      </div>

      <DataCard title="事件状态" subtitle="新增事件先进入待分派，再由值班主管推进处置与结案。" badge={<Tag variant={STATUS_TAG[data.status]}>{data.status}</Tag>}>
        <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
          {data.statusNote ?? '当前暂无额外说明。'}
        </div>
      </DataCard>

      <InteractionRailLayout
        main={(
          <>
            <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--color-border)", paddingBottom: 0 }}>
              {TABS.map(({ id: tabId, label }) => (
                <button
                  key={tabId}
                  onClick={() => setActiveTab(tabId)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "10px 16px",
                    fontSize: 13, fontWeight: activeTab === tabId ? 600 : 450,
                    color: activeTab === tabId ? "var(--color-primary)" : "var(--color-muted)",
                    background: "transparent", border: "none", cursor: "pointer",
                    borderBottom: activeTab === tabId ? "2px solid var(--color-primary)" : "2px solid transparent",
                    marginBottom: -1, transition: "all 150ms ease", borderRadius: "6px 6px 0 0",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div>
              {activeTab === "info" && (
                <div className="data-card">
                  <div className="data-card-body">
                    <p className="text-sm" style={{ color: "var(--color-muted)", lineHeight: 1.7, marginBottom: 16 }}>
                      {data.desc}
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                      {[
                        { label: "涉及老人", value: data.elder || "无" },
                        { label: "发生地点", value: data.room },
                        { label: "报告人", value: `${data.reporter}（${data.reporterRole}）` },
                        { label: "发生时间", value: data.time },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div className="text-xs font-semibold" style={{ color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                          <div className="text-sm font-semibold">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "process" && (
                <div className="data-card">
                  <div className="data-card-body">
                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      {data.handling.map((step: string, i: number) => (
                        <div key={i} style={{ display: "flex", gap: 12, paddingBottom: i < data.handling.length - 1 ? 12 : 0 }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                            <div className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ background: "var(--color-primary)", color: "white" }}>
                              {i + 1}
                            </div>
                            {i < data.handling.length - 1 && <div style={{ width: 2, flex: 1, background: "var(--color-border)", marginTop: 4 }} />}
                          </div>
                          <div className="text-sm pt-1" style={{ color: "var(--color-muted)" }}>{step}</div>
                        </div>
                      ))}
                    </div>
                    {data.nextStep && (
                      <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                        <div className="text-xs font-bold mb-1" style={{ color: "var(--color-warning)" }}>后续跟进</div>
                        <div className="text-sm" style={{ color: "var(--color-muted)" }}>{data.nextStep}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "file" && (
                <div className="data-card">
                  <div className="data-card-body">
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {data.attachments.map((f: string) => (
                        <div key={f} className="text-sm px-3 py-2 rounded-lg border cursor-pointer" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)", background: "rgba(120,113,108,0.15)" }}>
                          📎 {f}
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                      {data.status === '待分派' ? (
                        <button className="btn btn-primary btn-sm" style={{ width: "fit-content" }} onClick={() => startIncidentHandling(data.id)}>开始处置</button>
                      ) : data.status === '处理中' ? (
                        <button className="btn btn-primary btn-sm" style={{ width: "fit-content" }} onClick={() => closeIncident(data.id)}>申请结案</button>
                      ) : (
                        <button className="btn btn-primary btn-sm" style={{ width: "fit-content" }}>查看结案记录</button>
                      )}
                      <button className="btn btn-secondary btn-sm" style={{ width: "fit-content" }}>通知家属</button>
                      <button className="btn btn-secondary btn-sm" style={{ width: "fit-content" }}>打印事故报告</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        rail={(
          <>
            <DataCard title="对象上下文" subtitle="后置展示当前事故的状态与处理焦点。" badge={<Tag variant="info">Context</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">当前事故：{data.title} · {data.level}。</div>
                <div className="page-help-card-item">处理状态：{data.status}，地点 {data.room}。</div>
                <div className="page-help-card-item">当前焦点：{data.status === '待分派' ? '先指定责任人并开始处置' : data.status === '处理中' ? '继续推进闭环与通知动作' : '回看结案记录与复盘建议'}。</div>
              </div>
            </DataCard>

            <DataCard
              icon={<Bot size={16} />}
              title={aiInsight.title}
              subtitle="补充事故解释、闭环标准和后续动作，最终结论仍以人工复盘为准。"
              badge={<Tag variant="warning">AI 草稿</Tag>}
            >
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ borderRadius: 12, background: "var(--color-bg)", padding: 14, fontSize: 12.5, lineHeight: 1.7, color: "var(--color-text)" }}>
                  {aiInsight.summary}
                </div>
                <div style={{ borderRadius: 12, border: "1px solid var(--color-border)", padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-warning)" }}>闭环风险</div>
                  <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.7, color: "var(--color-text)" }}>{aiInsight.risk}</div>
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {aiInsight.actions.map(action => (
                    <div key={action} style={{ borderRadius: 10, border: "1px solid var(--color-border)", padding: "10px 12px", fontSize: 12.5, lineHeight: 1.6, color: "var(--color-text)" }}>
                      {action}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.7, color: "var(--color-muted)" }}>{aiInsight.closureHint}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 12, color: "var(--color-primary)", fontWeight: 600 }}>置信度 {aiInsight.confidence}%</div>
                  <Link href={buildAiHref('incident-explanation', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
                </div>
              </div>
            </DataCard>

            <DataCard
              icon={<Bot size={16} />}
              title={followupInsight.title}
              subtitle="把事故处理节点压缩成复盘和留痕动作。"
              badge={<Tag variant="info">Closure Follow-up</Tag>}
            >
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ borderRadius: 12, background: "var(--color-bg)", padding: 14, fontSize: 12.5, lineHeight: 1.7, color: "var(--color-text)" }}>
                  {followupInsight.summary}
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {followupInsight.actions.map(action => (
                    <div key={action} style={{ borderRadius: 10, border: "1px solid var(--color-border)", padding: "10px 12px", fontSize: 12.5, lineHeight: 1.6, color: "var(--color-text)" }}>
                      {action}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 12, color: "var(--color-primary)", fontWeight: 600 }}>置信度 {followupInsight.confidence}%</div>
                  <Link href={buildAiHref('incident-followup', 'logs')} className="btn btn-secondary btn-sm">带上下文追踪</Link>
                </div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整事故详情说明迁移到显式帮助页"
              summary="事故详情页现在只保留状态推进、tabs 和对象事实，AI 解释与使用说明统一后置。"
              items={[
                '先核对当前状态，再进入 tabs 查看过程或附件。',
                'AI 解释只用于辅助判断，不替代人工结案。',
                '若需要完整处置边界说明，进入事故帮助页查看。',
              ]}
              href={helpHref}
              actionLabel="查看事故帮助"
            />
          </>
        )}
      />
    </div>
  )
}
