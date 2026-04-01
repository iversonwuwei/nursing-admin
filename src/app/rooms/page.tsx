'use client'

import { DataCard, EmptyState, FilterBar, FilterItem, PageHeader, Pagination, StatCard, Tag, type TagVariant } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { getRoomAiInsights, getRoomAiNarratives } from '@/lib/mock/admin-ai'
import { activateRoomDraft, getMasterDataSnapshot, getRoomStats, subscribeMasterDataWorkflow } from '@/lib/mock/master-data-workflow'
import { Bot, ChevronRight, DoorOpen, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState, useSyncExternalStore } from 'react'

const STATUS_TAG: Record<string, TagVariant> = { '已满': 'danger', '可入住': 'success', '维护中': 'warning', '待启用': 'warning' }

export default function RoomsPage() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('selected')
  const fromNew = searchParams.get('entry') === 'rooms-new'
  const snapshot = useSyncExternalStore(
    subscribeMasterDataWorkflow,
    getMasterDataSnapshot,
    getMasterDataSnapshot,
  )
  const rooms = snapshot.rooms
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const selectedRoom = useMemo(
    () => rooms.find(item => item.id === preselectedId) ?? null,
    [preselectedId, rooms],
  )
  const aiInsights = getRoomAiInsights(rooms)
  const aiNarratives = getRoomAiNarratives(rooms)
  const stats = useMemo(() => getRoomStats(rooms), [rooms])
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'rooms-list',
    entityId: 'room-board',
    entityName: '房间管理',
    focus,
    target,
  })
  const filtered = rooms.filter(r => !search || r.name.includes(search) || r.id.includes(search))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="animate-fade-up">

      <PageHeader
        title="房间管理"
        subtitle={`共 ${rooms.length} 间房间 · ${snapshot.organizations.length} 家分院`}
        actions={
          <Link href="/rooms/new" className="btn btn-primary btn-sm">
            <Plus size={13} />新增房间
          </Link>
        }
      />

      <div className="kpi-grid">
        <StatCard icon={<DoorOpen size={18} />} label="房间总数" value={stats.totalRooms} color="primary" />
        <StatCard icon={<DoorOpen size={18} />} label="总床位数" value={stats.totalBeds} sub={`已入住 ${stats.occupied}`} color="info" />
        <StatCard icon={<DoorOpen size={18} />} label="入住率" value={`${stats.occupancy}%`} sub="整体床位使用" color="success" />
        <StatCard icon={<DoorOpen size={18} />} label="可入住" value={stats.availableRooms} sub={`待启用 ${stats.pendingActivation} 间`} color="warning" />
      </div>

      {selectedRoom && fromNew ? (
        <DataCard
          title="来自新增房间页"
          subtitle={`${selectedRoom.id} 已进入待启用闭环。复核后才会进入可排房资源池。`}
          badge={<Tag variant={selectedRoom.lifecycleStatus === '待启用' ? 'warning' : 'success'}>{selectedRoom.lifecycleStatus}</Tag>}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
              当前房型 {selectedRoom.type}，床位 {selectedRoom.capacity}，所属机构 {selectedRoom.org}。
            </div>
            {selectedRoom.lifecycleStatus === '待启用' ? (
              <button className="btn btn-primary btn-sm" onClick={() => activateRoomDraft(selectedRoom.id)}>
                启用房间
              </button>
            ) : (
              <Link href={`/rooms/${selectedRoom.id}`} className="btn btn-secondary btn-sm">查看详情</Link>
            )}
          </div>
        </DataCard>
      ) : null}

      <div className="dashboard-grid-2" style={{ marginBottom: 16 }}>
        <DataCard
          icon={<Bot size={16} />}
          title="AI 排房摘要"
          subtitle="优先解释承接能力和可分配资源，不自动替代排房决策。"
          badge={<Tag variant="info">Allocation Assist</Tag>}
        >
          <div style={{ display: 'grid', gap: 10 }}>
            {aiInsights.map(item => (
              <div key={item.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                    <div style={{ marginTop: 4, fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.6 }}>{item.summary}</div>
                  </div>
                  <Tag variant={item.variant}>{item.metric}</Tag>
                </div>
                <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.6, color: 'var(--color-text)' }}>{item.action}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <Link href={buildAiHref('room-allocation', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
          </div>
        </DataCard>

        <DataCard
          icon={<DoorOpen size={16} />}
          title="AI 分配建议"
          subtitle="把房间列表翻译成入住承接建议和机构级差异。"
        >
          <div style={{ display: 'grid', gap: 10 }}>
            {aiNarratives.map(item => (
              <div key={item} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
                {item}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <Link href={buildAiHref('room-capacity', 'logs')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
          </div>
        </DataCard>
      </div>

      <FilterBar>
        <FilterItem label="">
          <div className="input-wrap" style={{ minWidth: 180 }}>
            <span className="input-icon"><Search size={14} /></span>
            <input
              className="input"
              placeholder="搜索房间名称..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              style={{ paddingLeft: 34 }}
            />
          </div>
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
                <th>房间名称</th>
                <th>所属机构</th>
                <th>楼层</th>
                <th>房型</th>
                <th>床位</th>
                <th>入住情况</th>
                <th>状态</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(r => (
                <tr key={r.id} className="table-hover-row">
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                        background: 'rgba(13,148,136,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-primary)',
                      }}>
                        <DoorOpen size={16} />
                      </div>
                      <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{r.name}</span>
                    </div>
                  </td>
                  <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{r.org}</span></td>
                  <td><span className="text-sm">{r.floor}F</span></td>
                  <td><span className="text-sm">{r.type}</span></td>
                  <td><span className="text-sm">{r.occupied}/{r.capacity}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, maxWidth: 80 }}>
                        <div style={{
                          height: 4, background: 'var(--color-bg)', borderRadius: 999,
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${(r.occupied / r.capacity) * 100}%`,
                            height: '100%', borderRadius: 999,
                            background: r.occupied === r.capacity ? 'var(--color-danger)' : 'var(--color-success)',
                          }} />
                        </div>
                      </div>
                      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        {r.occupied}/{r.capacity}
                      </span>
                    </div>
                  </td>
                  <td><Tag variant={STATUS_TAG[r.status]}>{r.status}</Tag></td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                      {r.lifecycleStatus === '待启用' ? (
                        <button className="btn btn-primary btn-sm" onClick={() => activateRoomDraft(r.id)}>
                          启用
                        </button>
                      ) : null}
                      <Link href={`/rooms/${r.id}`} className="btn btn-ghost btn-sm">
                        查看 <ChevronRight size={12} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {paged.length === 0 && <EmptyState variant="search" title="暂无数据" description="调整搜索条件试试" />}
        <Pagination current={page} total={filtered.length} pageSize={pageSize} onChange={setPage} />
      </div>

    </div>
  )
}
