"use client"
import { DataCard, EmptyState, InteractionRailLayout, PageHelpCard, Tag, type TagVariant } from "@/components/nh"
import { buildAiAssistantHref } from "@/lib/ai-context"
import { buildEquipmentStatusRows } from "@/lib/equipment/equipment-live-derivations"
import { getEquipmentStatusAiInsights, getEquipmentStatusNarratives } from "@/lib/mock/admin-ai"
import { fetchAdminEquipment } from "@/lib/services/admin-operations-services"
import { AlertTriangle, Battery, Bot, CheckCircle2, Monitor, Search, Wifi, XCircle } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

const STATUS_TAG: Record<string, TagVariant> = { online: "success", offline: "danger", warning: "warning" }
const STATUS_LABEL: Record<string, string> = { online: "正常", offline: "离线", warning: "异常" }

export default function EquipmentStatusPage() {
  const [devices, setDevices] = useState<ReturnType<typeof buildEquipmentStatusRows>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("全部")

  useEffect(() => {
    let active = true

    fetchAdminEquipment({ page: 1, pageSize: 200 })
      .then(response => {
        if (active) {
          setDevices(buildEquipmentStatusRows(response.items))
          setError('')
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : '设备状态查询失败。')
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const aiInsights = getEquipmentStatusAiInsights(devices)
  const aiNarratives = getEquipmentStatusNarratives(devices)
  const filtered = useMemo(() => devices.filter(d => (d.name.includes(search) || d.room.includes(search)) && (statusFilter === "全部" || d.status === statusFilter)), [devices, search, statusFilter])
  const stats = { total: devices.length, online: devices.filter(d => d.status === "online").length, offline: devices.filter(d => d.status === "offline").length, warning: devices.filter(d => d.status === "warning").length }
  const helpHref = '/equipment/help'
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'equipment-status',
    entityId: 'equipment-status-board',
    entityName: '设备状态',
    focus,
    target,
  })

  const signalBar = (s: number) => (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <div style={{ width: 48, height: 6, background: "var(--color-bg)", borderRadius: 999 }}>
        <div style={{ height: "100%", width: `${s}%`, background: s > 60 ? "var(--color-success)" : s > 30 ? "var(--color-warning)" : "var(--color-danger)", borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: s > 60 ? "var(--color-success)" : s > 30 ? "var(--color-warning)" : "var(--color-danger)" }}>{s}%</span>
    </div>
  )

  const batteryBar = (b: number) => (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <Battery size={13} style={{ color: b > 50 ? "var(--color-success)" : b > 20 ? "var(--color-warning)" : "var(--color-danger)" }} />
      <div style={{ width: 40, height: 5, background: "var(--color-bg)", borderRadius: 999 }}>
        <div style={{ height: "100%", width: `${b}%`, background: b > 50 ? "var(--color-success)" : b > 20 ? "var(--color-warning)" : "var(--color-danger)", borderRadius: 999 }} />
      </div>
    </div>
  )

  return (
    <div className="page-root animate-fade-up">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ letterSpacing: "-0.03em" }}>设备状态</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>实时设备状态监控 · {stats.online} 正常 / {stats.warning} 异常 / {stats.offline} 离线</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "设备总数", value: stats.total, icon: Monitor, color: "var(--color-primary)", bg: "var(--color-primary-light)" },
          { label: "正常运行", value: stats.online, icon: CheckCircle2, color: "var(--color-success)", bg: "rgba(34,197,94,0.1)" },
          { label: "设备异常", value: stats.warning, icon: AlertTriangle, color: "var(--color-warning)", bg: "rgba(245,158,11,0.1)" },
          { label: "设备离线", value: stats.offline, icon: XCircle, color: "var(--color-danger)", bg: "rgba(239,68,68,0.1)" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="data-card" style={{ padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--color-muted)" }}>{label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.02em", marginTop: 4 }}>{value}</div>
              </div>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={18} style={{ color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <InteractionRailLayout
        main={(
          <>
            {error ? (
              <DataCard title="Live Unavailable" subtitle="设备状态链路当前不可用。" badge={<Tag variant="danger">Operations API</Tag>}>
                <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{error}</div>
              </DataCard>
            ) : null}
            <div className="filter-bar">
              <div className="input-wrap-icon" style={{ flex: 1, minWidth: 200 }}>
                <span className="input-icon"><Search size={16} /></span>
                <input className="input" placeholder="搜索设备名称或位置..." value={search} onChange={e => setSearch(e.target.value)} style={{ height: 38, paddingLeft: 38 }} />
              </div>
              {["全部", "online", "warning", "offline"].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-ghost"}`}>{s === "全部" ? "全部" : STATUS_LABEL[s]}</button>
              ))}
            </div>

            <DataCard>
              {loading && devices.length === 0 ? (
                <div style={{ padding: 16, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>正在从真实设备台账派生状态总览。</div>
              ) : null}
              {!loading && filtered.length === 0 ? <EmptyState variant="search" title="暂无设备状态数据" description="调整筛选条件试试。" /> : null}
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr><th>设备</th><th>类型</th><th>位置</th><th>状态</th><th>信号强度</th><th>电量</th><th>运行时长</th><th>备注</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map(d => (
                      <tr key={d.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: d.status === "offline" ? "rgba(239,68,68,0.1)" : d.status === "warning" ? "rgba(245,158,11,0.1)" : "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Wifi size={16} style={{ color: d.status === "offline" ? "var(--color-danger)" : d.status === "warning" ? "var(--color-warning)" : "var(--color-primary)" }} />
                            </div>
                            <div>
                              <div className="font-semibold text-sm">{d.name}</div>
                              <div className="text-[10px]" style={{ color: "var(--color-muted)" }}>{d.id}</div>
                            </div>
                          </div>
                        </td>
                        <td><Tag variant="neutral">{d.type}</Tag></td>
                        <td><span className="text-sm" style={{ color: "var(--color-muted)" }}>{d.room}</span></td>
                        <td><Tag variant={STATUS_TAG[d.status]}>{STATUS_LABEL[d.status]}</Tag></td>
                        <td>{signalBar(d.signal)}</td>
                        <td>{batteryBar(d.battery)}</td>
                        <td>
                          <span className="text-sm" style={{ color: "var(--color-muted)" }}>
                            {d.uptime > 0 ? `${Math.floor(d.uptime / 60)}h${d.uptime % 60}m` : "——"}
                          </span>
                        </td>
                        <td>
                          {d.lastAlert
                            ? <Tag variant={d.status === "offline" ? "danger" : "warning"}>{d.lastAlert}</Tag>
                            : <span style={{ fontSize: 12, color: "var(--color-muted)" }}>无</span>
                          }
                        </td>
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
            <DataCard
              icon={<Bot size={16} />}
              title="AI 状态解释"
              subtitle="把离线、弱信号和低电量翻译成班次可执行动作。"
              badge={<Tag variant="warning">需人工排查</Tag>}
            >
              <div style={{ display: "grid", gap: 10 }}>
                {aiInsights.map(item => (
                  <div key={item.id} style={{ borderRadius: 12, border: "1px solid var(--color-border)", padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-text)" }}>{item.title}</span>
                      <Tag variant={item.variant}>{item.variant === "danger" ? "高风险" : "需处理"}</Tag>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: "var(--color-text)" }}>{item.summary}</div>
                    <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.6, color: "var(--color-muted)" }}>{item.action}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <Link href={buildAiHref('equipment-risk', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
              </div>
            </DataCard>

            <DataCard icon={<AlertTriangle size={16} />} title="AI 巡检动作" subtitle="强调处理顺序和班次影响，不只看设备参数。">
              <div style={{ display: "grid", gap: 10 }}>
                {aiNarratives.map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <Link href={buildAiHref('equipment-patrol', 'logs')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整设备状态说明迁移到显式帮助页"
              summary="设备状态页现在优先展示筛选后的状态表格，AI 解释和巡检建议统一后置。"
              items={[
                '先按状态筛选，再看信号、电量和备注。',
                'AI 建议只辅助排查顺序，不替代现场检查。',
                '若需要完整说明，进入设备帮助页查看。',
              ]}
              href={helpHref}
              actionLabel="查看设备帮助"
            />
          </>
        )}
      />
    </div>
  )
}
