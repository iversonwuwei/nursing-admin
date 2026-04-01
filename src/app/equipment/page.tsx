'use client'

import { DataCard, EmptyState, FilterBar, FilterItem, PageHeader, Pagination, StatCard, Tag, type TagVariant } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { equipmentAlarms } from '@/lib/data'
import { getEquipmentListAiInsights, getEquipmentListAiNarratives } from '@/lib/mock/admin-ai'
import { confirmEquipmentAcceptance, getResourceSnapshot, subscribeResourceWorkflow } from '@/lib/mock/resource-workflow'
import { AlertTriangle, Bot, CheckCircle2, Plus, Search, Wifi } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState, useSyncExternalStore } from 'react'

const CATEGORY_TAG: Record<string, TagVariant> = {
  '医疗设备': 'info', '康复设备': 'warning', '生活设备': 'primary', '智能设备': 'purple',
}
const STATUS_TAG: Record<string, TagVariant> = {
  '正常': 'success', '维修中': 'warning', '已报废': 'danger', '待维修': 'warning',
}

export default function EquipmentPage() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('selected')
  const fromNew = searchParams.get('entry') === 'equipment-new'
  const snapshot = useSyncExternalStore(
    subscribeResourceWorkflow,
    getResourceSnapshot,
    getResourceSnapshot,
  )
  const equipment = snapshot.equipment
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const selectedEquipment = useMemo(
    () => equipment.find(item => item.id === preselectedId) ?? null,
    [equipment, preselectedId],
  )

  const filtered = equipment.filter(e => {
    if (search && !e.name.includes(search) && !e.id.includes(search)) return false
    if (catFilter && e.category !== catFilter) return false
    return true
  })
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  const stats = {
    total: equipment.length,
    normal: equipment.filter(e => e.status === '正常').length,
    alarm: equipmentAlarms.filter(a => a.status === '待处理').length,
    repair: equipment.filter(e => e.status === '维修中' || e.status === '待维修').length,
  }

  const categories = [...new Set(equipment.map(e => e.category))]
  const aiInsights = getEquipmentListAiInsights(equipment, equipmentAlarms)
  const aiNarratives = getEquipmentListAiNarratives(equipment, equipmentAlarms)
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'equipment-list',
    entityId: 'equipment-board',
    entityName: '设备列表',
    focus,
    target,
  })

  return (
    <div className="animate-fade-up">

      <PageHeader
        title="设备列表"
        subtitle={`共 ${equipment.length} 台设备${selectedEquipment && fromNew ? ' · 包含最新待验收设备' : ''}`}
        actions={
          <Link href="/equipment/new" className="btn btn-primary btn-sm">
            <Plus size={13} />添加设备
          </Link>
        }
      />

      {selectedEquipment && fromNew ? (
        <DataCard
          title="来自新增设备页"
          subtitle={`${selectedEquipment.name} 已进入待验收闭环。确认后再纳入设备台账。`}
          badge={<Tag variant={selectedEquipment.lifecycleStatus === '待验收' ? 'warning' : 'success'}>{selectedEquipment.lifecycleStatus}</Tag>}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
              当前分类 {selectedEquipment.category}，位置 {selectedEquipment.location}，序列号 {selectedEquipment.serialNumber}。
            </div>
            {selectedEquipment.lifecycleStatus === '待验收' ? (
              <button className="btn btn-primary btn-sm" onClick={() => confirmEquipmentAcceptance(selectedEquipment.id)}>
                完成验收
              </button>
            ) : (
              <Link href={`/equipment/${selectedEquipment.id}`} className="btn btn-secondary btn-sm">查看详情</Link>
            )}
          </div>
        </DataCard>
      ) : null}

      <div className="kpi-grid">
        <StatCard icon={<Wifi size={18} />} label="设备总数" value={stats.total} color="primary" />
        <StatCard icon={<CheckCircle2 size={18} />} label="正常运行" value={stats.normal} color="success" />
        <StatCard icon={<AlertTriangle size={18} />} label="待处理告警" value={stats.alarm} sub="需立即处理" color="danger" />
        <StatCard icon={<Wifi size={18} />} label="维修中" value={stats.repair} sub="设备维护" color="warning" />
      </div>

      <div className="dashboard-grid-2" style={{ marginBottom: 16 }}>
        <DataCard
          icon={<Bot size={16} />}
          title="AI 巡检摘要"
          subtitle="优先解释哪些设备需要先巡检或准备备用方案。"
          badge={<Tag variant="info">Patrol Assist</Tag>}
        >
          <div style={{ display: 'grid', gap: 10 }}>
            {aiInsights.map(item => (
              <div key={item.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                  <Tag variant={item.variant}>{item.title}</Tag>
                </div>
                <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.summary}</div>
                <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.6, color: 'var(--color-text)' }}>{item.action}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <Link href={buildAiHref('equipment-patrol', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
          </div>
        </DataCard>

        <DataCard
          icon={<Wifi size={16} />}
          title="AI 维保建议"
          subtitle="把设备列表翻译成巡检顺序、备用路径和维保节奏。"
        >
          <div style={{ display: 'grid', gap: 10 }}>
            {aiNarratives.map(item => (
              <div key={item} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
                {item}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <Link href={buildAiHref('equipment-maintenance', 'logs')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
          </div>
        </DataCard>
      </div>

      <FilterBar>
        <FilterItem label="">
          <div className="input-wrap" style={{ minWidth: 180 }}>
            <span className="input-icon"><Search size={14} /></span>
            <input
              className="input"
              placeholder="搜索设备名称..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              style={{ paddingLeft: 34 }}
            />
          </div>
        </FilterItem>
        <FilterItem label="">
          <select
            className="select"
            value={catFilter}
            onChange={e => { setCatFilter(e.target.value); setPage(1) }}
            style={{ minWidth: 130 }}
          >
            <option value="">全部分类</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </FilterItem>
      </FilterBar>

      <div style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>设备名称</th>
                <th>分类</th>
                <th>型号</th>
                <th>位置</th>
                <th>状态</th>
                <th>采购日期</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(e => (
                <tr key={e.id} className="table-hover-row">
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                        background: STATUS_TAG[e.status] === 'success'
                          ? 'rgba(34,197,94,0.1)' : STATUS_TAG[e.status] === 'warning'
                          ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                        color: STATUS_TAG[e.status] === 'success'
                          ? 'var(--color-success)' : STATUS_TAG[e.status] === 'warning'
                          ? 'var(--color-warning)' : 'var(--color-danger)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Wifi size={16} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{e.name}</div>
                        <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{e.id}</div>
                      </div>
                    </div>
                  </td>
                  <td><Tag variant={CATEGORY_TAG[e.category]}>{e.category}</Tag></td>
                  <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{e.model}</span></td>
                  <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{e.location}</span></td>
                  <td><Tag variant={STATUS_TAG[e.status]}>{e.status}</Tag></td>
                  <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{e.purchaseDate}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <Link href={`/equipment/${e.id}`} className="btn btn-ghost btn-sm">详情</Link>
                      <Link href="/devices/realtime" className="btn btn-ghost btn-sm">监控</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {paged.length === 0 && <EmptyState variant="search" title="暂无数据" description="调整筛选条件试试" />}
        <Pagination current={page} total={filtered.length} pageSize={pageSize} onChange={setPage} />
      </div>

    </div>
  )
}
