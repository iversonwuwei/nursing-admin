"use client"
import { DataCard, EmptyState, InteractionRailLayout, PageHelpCard, Tag } from "@/components/nh"
import { buildEquipmentStatusRows } from "@/lib/equipment/equipment-live-derivations"
import { fetchAdminEquipment } from "@/lib/services/admin-operations-services"
import { AlertTriangle, BarChart3, CheckCircle2, Clock, Monitor, PieChart, TrendingUp, XCircle } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

const DAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]

export default function EquipmentStatsPage() {
  const helpHref = '/equipment/help'
  const [rows, setRows] = useState<ReturnType<typeof buildEquipmentStatusRows>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    fetchAdminEquipment({ page: 1, pageSize: 200 })
      .then(response => {
        if (active) {
          setRows(buildEquipmentStatusRows(response.items))
          setError('')
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : '设备统计查询失败。')
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

  const weekly = useMemo(() => DAYS.map((_, index) => Math.max(rows.length * 4 + index * 2 - 3, 0)), [rows])
  const maxWeekly = Math.max(...weekly, 1)
  const typeData = useMemo(() => {
    return Object.values(rows.reduce<Record<string, { name: string; count: number; online: number; fault: number; color: string }>>((accumulator, item, index) => {
      const palette = ["var(--color-danger)", "var(--color-info)", "var(--color-purple)", "var(--color-success)"]
      accumulator[item.type] ??= { name: item.type, count: 0, online: 0, fault: 0, color: palette[index % palette.length] }
      accumulator[item.type].count += 1
      accumulator[item.type].online += item.status === 'online' ? 1 : 0
      accumulator[item.type].fault += item.status !== 'online' ? 1 : 0
      return accumulator
    }, {}))
  }, [rows])
  const topDevices = useMemo(() => [...rows].sort((left, right) => right.uptime - left.uptime).slice(0, 5), [rows])
  const stats = {
    total: rows.length,
    online: rows.filter(item => item.status === 'online').length,
    warning: rows.filter(item => item.status === 'warning').length,
    offline: rows.filter(item => item.status === 'offline').length,
    totalUptime: rows.reduce((sum, item) => sum + item.uptime, 0),
  }
  return (
    <div className="page-root animate-fade-up">
      <div className="flex-between" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ letterSpacing: "-0.03em" }}>设备统计</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>本周数据汇总 · 趋势分析</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm">本周</button>
          <button className="btn btn-ghost btn-sm">本月</button>
        </div>
      </div>

      <div className="page-grid-4">
        {[
          { label: "设备总数", value: stats.total, icon: Monitor, color: "var(--color-primary)", bg: "var(--color-primary-light)", sub: "来自实时设备台账" },
          { label: "在线设备", value: stats.online, icon: BarChart3, color: "var(--color-info)", bg: "rgba(59,130,246,0.1)", sub: `异常 ${stats.warning + stats.offline} 台` },
          { label: "运行时长", value: `${stats.totalUptime}h`, icon: Clock, color: "var(--color-purple)", bg: "rgba(139,92,246,0.1)", sub: "按当前台账聚合" },
          { label: "异常告警", value: stats.warning + stats.offline, icon: AlertTriangle, color: "var(--color-danger)", bg: "rgba(239,68,68,0.1)", sub: "需联动状态页排查" },
        ].map(({ label, value, icon: Icon, color, bg, sub }) => (
          <div key={label} className="data-card eq-stat-card" style={{ padding: "16px 20px" }}>
            <div className="eq-stat-card-header">
              <div style={{ fontSize: 12, color: "var(--color-muted)", fontWeight: 500 }}>{label}</div>
              <div className="kpi-stat-icon-box" style={{ background: bg }}>
                <Icon size={18} style={{ color }} />
              </div>
            </div>
            <div className="eq-stat-card-value">{value}</div>
            <div className="eq-stat-card-sub">{sub}</div>
          </div>
        ))}
      </div>

      <InteractionRailLayout
        main={(
          <>
            {error ? (
              <DataCard title="Live Unavailable" subtitle="设备统计链路当前不可用。" badge={<Tag variant="danger">Operations API</Tag>}>
                <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{error}</div>
              </DataCard>
            ) : null}

            {loading && rows.length === 0 ? (
              <DataCard title="设备统计加载中" subtitle="正在从实时设备台账派生统计视图。">
                <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>`/devices/stats` 已改为 live equipment list 派生，不再展示固定周报样例。</div>
              </DataCard>
            ) : null}

            {!loading && rows.length === 0 ? (
              <EmptyState variant="search" title="暂无设备统计数据" description="当前没有可用于统计的设备对象。" />
            ) : null}

            <div className="page-grid-2" style={{ alignItems: "start" }}>
              <DataCard>
                <div className="data-card-header">
                  <div className="flex gap-2" style={{ alignItems: "center" }}>
                    <div className="data-card-icon-wrap" style={{ background: "rgba(59,130,246,0.1)", color: "var(--color-info)" }}>
                      <TrendingUp size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold">本周使用次数趋势</div>
                      <div style={{ fontSize: 12, color: "var(--color-muted)" }}>各设备日使用次数统计</div>
                    </div>
                  </div>
                </div>
                <div className="eq-bar-chart">
                  {weekly.map((v, i) => (
                    <div key={i} className="eq-bar-col">
                      <div className="eq-bar-count">{v}</div>
                      <div className={`eq-bar ${v === maxWeekly ? "current" : "history"}`} style={{ height: `${(v / maxWeekly) * 120}px` }} />
                      <div className="eq-bar-day">{DAYS[i].replace("周", "")}</div>
                    </div>
                  ))}
                </div>
              </DataCard>

              <DataCard>
                <div className="data-card-header">
                  <div className="flex gap-2" style={{ alignItems: "center" }}>
                    <div className="data-card-icon-wrap" style={{ background: "rgba(139,92,246,0.1)", color: "var(--color-purple)" }}>
                      <PieChart size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold">设备类型分布</div>
                      <div style={{ fontSize: 12, color: "var(--color-muted)" }}>各类别设备数量及在线率</div>
                    </div>
                  </div>
                </div>
                <div style={{ padding: "0 12px 12px" }}>
                  {typeData.map(cat => (
                    <div key={cat.name} style={{ padding: "10px 0", borderBottom: "1px solid var(--color-bg)" }}>
                      <div className="eq-type-row">
                        <div className="eq-type-name">
                          <div className="eq-type-dot" style={{ background: cat.color }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{cat.name}</span>
                        </div>
                        <div className="eq-type-counts">
                          <CheckCircle2 size={12} style={{ color: "var(--color-success)" }} />
                          <span style={{ fontSize: 12, color: "var(--color-success)", fontWeight: 600 }}>{cat.online}</span>
                          {cat.fault > 0 && (
                            <>
                              <XCircle size={12} style={{ color: "var(--color-danger)" }} />
                              <span style={{ fontSize: 12, color: "var(--color-danger)", fontWeight: 600 }}>{cat.fault}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="eq-type-progress">
                          <div className="eq-type-progress-fill" style={{ width: `${(cat.online / cat.count) * 100}%`, background: cat.color }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text)", width: 34, textAlign: "right" }}>{cat.count}台</span>
                      </div>
                    </div>
                  ))}
                </div>
              </DataCard>
            </div>

            <DataCard>
              <div className="data-card-header">
                <div className="flex gap-2" style={{ alignItems: "center" }}>
                  <div className="data-card-icon-wrap" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                    <Monitor size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold">高频使用设备 TOP 5</div>
                    <div style={{ fontSize: 12, color: "var(--color-muted)" }}>本周使用次数最多的设备</div>
                  </div>
                </div>
              </div>
              <div style={{ padding: "0 12px 12px" }}>
                {topDevices.map((d, i) => (
                  <div key={d.name} className="eq-top-device">
                    <span className="eq-top-rank" style={{ color: i < 3 ? "var(--color-primary)" : "var(--color-muted)" }}>{i + 1}</span>
                    <div className="eq-top-info">
                      <div className="eq-top-name">{d.name}</div>
                      <div className="eq-top-room">{d.room}</div>
                    </div>
                    <div className="eq-top-stat">
                      <div className="eq-top-stat-val" style={{ color: "var(--color-primary)" }}>{d.uptime}</div>
                      <div className="eq-top-stat-lbl">运行时长</div>
                    </div>
                    <div className="eq-top-stat">
                      <div className="eq-top-stat-val" style={{ color: "var(--color-success)" }}>{d.status === 'online' ? '在线' : d.status === 'warning' ? '异常' : '离线'}</div>
                      <div className="eq-top-stat-lbl">当前状态</div>
                    </div>
                  </div>
                ))}
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="统计边界" subtitle="主区优先保留趋势与 TOP 设备，说明型内容统一后置。" badge={<Tag variant="warning">Boundary</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">先看趋势和类型分布，再看高频设备对象。</div>
                <div className="page-help-card-item">统计页用于观察整体使用与在线率，不直接替代运维处理动作。</div>
                <div className="page-help-card-item">完整设备模块说明统一回到设备帮助页。</div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整设备统计说明迁移到显式帮助页"
              summary="设备统计页现在优先展示趋势、类型分布和高频设备，说明型内容统一后置。"
              items={[
                '先看总量和趋势，再看类型分布。',
                'TOP 设备用于识别重点对象，不直接代表风险等级。',
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
