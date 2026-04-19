"use client"
import { DataCard, EmptyState, InteractionRailLayout, PageHelpCard, Tag, type TagVariant } from "@/components/nh"
import { buildAiAssistantHref } from "@/lib/ai-context"
import { getEquipmentDetailAiInsight, getEquipmentMaintenanceNarratives } from "@/lib/mock/admin-ai"
import { activateAdminEquipment, fetchAdminEquipmentDetail, type AdminEquipmentRecord } from '@/lib/services/admin-operations-services'
import { ArrowLeft, Bot, Edit, Monitor } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from 'react'

const STATUS_TAG: Record<string, TagVariant> = { '正常': 'success', '待维修': 'warning', '维修中': 'warning', '已报废': 'danger' }

export default function EquipmentDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [data, setData] = useState<AdminEquipmentRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true

    fetchAdminEquipmentDetail(id)
      .then(response => {
        if (active) {
          setData(response)
          setError('')
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : '设备详情查询失败。')
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
  }, [id])

  if (loading) {
    return (
      <div className="page-root animate-fade-up">
        <DataCard title="设备详情加载中" subtitle="正在从 Operations Service 拉取设备对象。">
          <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>详情页已切换到真实后端读取，不再回退默认设备样例。</div>
        </DataCard>
      </div>
    )
  }

  if (!data && error.includes('不存在')) {
    return (
      <div className="page-root animate-fade-up">
        <EmptyState
          variant="search"
          title="设备不存在"
          description={`未找到编号 ${id} 对应的设备对象。`}
          action={<Link href="/equipment" className="btn btn-primary btn-sm">返回设备列表</Link>}
        />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="page-root animate-fade-up">
        <DataCard title="Live Unavailable" subtitle="设备详情实时链路当前不可用。" badge={<Tag variant="danger">Operations API</Tag>}>
          <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{error || '设备详情查询失败。'}</div>
        </DataCard>
      </div>
    )
  }

  const equipment = data
  const maintenance = {
    last: equipment.activatedAt?.slice(0, 10) ?? equipment.purchaseDate,
    next: equipment.maintenanceDate,
    cycle: `${equipment.maintenanceCycle}个月`,
  }
  const aiInsight = getEquipmentDetailAiInsight({
    id: equipment.id,
    name: equipment.name,
    room: equipment.room,
    type: equipment.type,
    status: equipment.status,
    signal: equipment.signal,
    battery: equipment.battery,
    uptime: equipment.uptime,
    maintenance,
    history: equipment.history.map(item => ({ ...item })),
  })
  const maintenanceNarratives = getEquipmentMaintenanceNarratives({
    id: equipment.id,
    name: equipment.name,
    room: equipment.room,
    type: equipment.type,
    status: equipment.status,
    signal: equipment.signal,
    battery: equipment.battery,
    uptime: equipment.uptime,
    maintenance,
    history: equipment.history.map(item => ({ ...item })),
  })
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = "inference") => buildAiAssistantHref({
    source: 'equipment-detail',
    entityId: equipment.id,
    entityName: equipment.name,
    focus,
    target,
  })
  const helpHref = '/equipment/help'

  async function handleActivate() {
    setSubmitting(true)
    try {
      setData(await activateAdminEquipment(equipment.id))
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '设备验收失败。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-root animate-fade-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/equipment" className="btn btn-ghost btn-icon btn-icon-sm btn-icon">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold" style={{ letterSpacing: "-0.02em" }}>{data.name}</h1>
              <Tag variant="neutral">{data.type}</Tag>
              <Tag variant={STATUS_TAG[data.status]}>{data.status}</Tag>
            </div>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              编号: {data.id} · {data.room}
            </p>
          </div>
        </div>
        {data.lifecycleStatus === '待验收' ? (
          <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={handleActivate} disabled={submitting}>
            <Edit size={14} />{submitting ? '验收中...' : '完成验收'}
          </button>
        ) : (
            <button className="btn btn-primary btn-sm flex items-center gap-2">
              <Edit size={14} />编辑
            </button>
        )}
      </div>

      {error ? (
        <DataCard title="Live Unavailable" subtitle="设备动作已切换到真实后端，失败时不会回退本地状态。" badge={<Tag variant="danger">Operations API</Tag>}>
          <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{error}</div>
        </DataCard>
      ) : null}

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="设备状态" subtitle="详情页主区只保留对象状态、实时指标和设备事实。" badge={<Tag variant={STATUS_TAG[data.status]}>{data.status}</Tag>}>
              <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                当前设备位于 {data.room}，类型 {data.type}，最近维护 {maintenance.last}，下次维护 {maintenance.next}。
              </div>
            </DataCard>

            <div className="data-card">
              <div className="data-card-header">
                <div className="data-card-title">
                  <div className="data-card-icon-wrap"><Monitor size={15} /></div>
                  <div className="text-sm font-bold">实时指标</div>
                  <span className="ml-auto text-xs font-semibold" style={{ color: "var(--color-success)" }}>
                    ● LIVE
                  </span>
                </div>
              </div>
              <div className="data-card-body">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  {[
                    { label: "心率", value: `${data.metrics.hr}`, unit: "bpm" },
                    { label: "血压", value: data.metrics.bp, unit: "mmHg" },
                    { label: "体温", value: `${data.metrics.temp}`, unit: "℃" },
                    { label: "血氧", value: `${data.metrics.spo2}`, unit: "%" },
                  ].map(({ label, value, unit }) => (
                    <div key={label} style={{ padding: "12px 14px", background: "var(--color-bg)", borderRadius: 10, textAlign: "center" }}>
                      <div className="text-xs font-semibold mb-2" style={{ color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                      <div className="text-2xl font-extrabold" style={{ color: "var(--color-primary)" }}>{value}</div>
                      <div className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>{unit}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="data-card">
              <div className="data-card-header">
                <div className="data-card-title">
                  <div className="data-card-icon-wrap"><Monitor size={15} /></div>
                  <div className="text-sm font-bold">历史数据</div>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead><tr><th>时间</th><th>心率(bpm)</th><th>血氧(%)</th><th>备注</th></tr></thead>
                  <tbody>
                    {data.history.map((h, i) => (
                      <tr key={i}>
                        <td><span className="text-sm" style={{ color: "var(--color-muted)" }}>{h.time}</span></td>
                        <td><span className="font-semibold text-sm">{h.hr}</span></td>
                        <td><span className="font-semibold text-sm">{h.spo2}</span></td>
                        <td><span className="text-sm" style={{ color: "var(--color-muted)" }}>{h.note}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="data-card">
              <div className="data-card-header">
                <div className="data-card-title">
                  <div className="data-card-icon-wrap"><Monitor size={15} /></div>
                  <div className="text-sm font-bold">设备信息</div>
                </div>
              </div>
              <div className="data-card-body">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                  {[
                    { label: "设备型号", value: data.model },
                    { label: "序列号", value: data.serialNumber },
                    { label: "安装位置", value: data.room },
                    { label: "最近维护", value: maintenance.last },
                    { label: "下次维护", value: maintenance.next },
                    { label: "维护周期", value: maintenance.cycle },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="text-xs font-semibold" style={{ color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                      <div className="text-sm font-semibold">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
        rail={(
          <>
            <DataCard title="对象上下文" subtitle="后置展示设备身份、维护窗口和处理焦点。" badge={<Tag variant="info">Context</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">当前设备：{data.name} · {data.type}。</div>
                <div className="page-help-card-item">安装位置：{data.room}，状态 {data.status}。</div>
                <div className="page-help-card-item">当前焦点：{data.status === '正常' ? '核对指标与维护计划' : '优先处理异常状态和维护动作'}。</div>
              </div>
            </DataCard>

            <DataCard
              icon={<Bot size={16} />}
              title={aiInsight.title}
              subtitle="把实时状态、历史波动和维护节奏转成设备跟进建议。"
              badge={<Tag variant="warning">Device AI</Tag>}
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
                  <Link href={buildAiHref('device-status', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
                </div>
              </div>
            </DataCard>

            <DataCard
              icon={<Monitor size={16} />}
              title="AI 维保摘要"
              subtitle="把维保时间窗和异常波动压缩成设备部可执行的跟进项。"
              badge={<Tag variant="info">Maintenance</Tag>}
            >
              <div style={{ display: "grid", gap: 10 }}>
                {maintenanceNarratives.map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
                <div>
                  <Link href={buildAiHref('maintenance-follow-up', 'logs')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
                </div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整设备详情说明迁移到显式帮助页"
              summary="设备详情页现在只保留对象状态、实时指标、历史数据和设备事实，AI 解释与维保说明统一后置。"
              items={[
                '先核对当前状态，再看实时指标和历史数据。',
                'AI 解释只用于辅助跟进，不替代人工维保判断。',
                '若需要完整页面定位和使用顺序，进入设备帮助页查看。',
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
