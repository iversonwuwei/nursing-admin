'use client'

import { DataCard, EmptyState, FilterBar, FilterItem, InteractionRailLayout, PageHeader, PageHelpCard, Pagination, StatCard, Tag, WorkflowOverviewCard, type TagVariant } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { getRoomAiInsights, getRoomAiNarratives } from '@/lib/mock/admin-ai'
import { activateRoomDraft, getMasterDataSnapshot, getRoomStats, subscribeMasterDataWorkflow } from '@/lib/mock/master-data-workflow'
import { sortRoomsByPriority } from '@/lib/resource-operations-priority'
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
  const helpHref = '/rooms/help'
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'rooms-list',
    entityId: 'room-board',
    entityName: '房间管理',
    focus,
    target,
  })
  const filtered = rooms.filter(r => !search || r.name.includes(search) || r.id.includes(search))
  const availableBeds = rooms.reduce((total, room) => total + Math.max(room.capacity - room.occupied, 0), 0)
  const pendingActivationCount = rooms.filter(item => item.lifecycleStatus === '待启用').length
  const cleaningBacklogCount = rooms.filter(item => item.cleanStatus !== '已清洁').length
  const maintenanceCount = rooms.filter(item => item.status === '维护中').length
  const sortedRooms = useMemo(() => sortRoomsByPriority(filtered), [filtered])
  const prioritizedRooms = sortedRooms.slice(0, 4)
  const paged = sortedRooms.slice((page - 1) * pageSize, page * pageSize)

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

      <InteractionRailLayout
        main={(
          <>
            <WorkflowOverviewCard
              eyebrow="Capacity Operations"
              title="床位承接总览"
              description="主区只保留承接总览、回流、优先队列和房间资源表，先处理真正阻断入住分配的资源问题。"
              badge={<Tag variant="info">Capacity View</Tag>}
              metrics={[
                { label: '整体入住率', value: `${stats.occupancy}%`, hint: `${stats.occupied}/${stats.totalBeds} 床位已入住`, tone: stats.occupancy >= 85 ? 'warning' : 'success' },
                { label: '可承接床位', value: availableBeds, hint: `${stats.availableRooms} 间可直接安排`, tone: availableBeds > 0 ? 'success' : 'warning' },
                { label: '待启用房间', value: pendingActivationCount, hint: '启用后才进入排房资源池', tone: pendingActivationCount > 0 ? 'warning' : 'neutral' },
                { label: '清洁与维护待办', value: cleaningBacklogCount + maintenanceCount, hint: `保洁 ${cleaningBacklogCount} · 维护 ${maintenanceCount}`, tone: cleaningBacklogCount + maintenanceCount > 0 ? 'warning' : 'neutral' },
              ]}
              signals={[
                { label: aiInsights[0] ? `${aiInsights[0].title}：${aiInsights[0].action}` : '暂无 AI 排房提醒', tone: aiInsights[0]?.variant === 'warning' ? 'warning' : 'info' },
                { label: pendingActivationCount > 0 ? '存在待启用房间，当前不可直接参与分配' : '当前没有待启用房间阻塞承接', tone: pendingActivationCount > 0 ? 'warning' : 'success' },
                { label: cleaningBacklogCount > 0 ? '有房间待清洁或保洁中，需关注翻房效率' : '房间清洁状态稳定', tone: cleaningBacklogCount > 0 ? 'warning' : 'success' },
              ]}
              actions={
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Link href="/elderly/checkin" className="btn btn-secondary btn-sm">进入入住承接</Link>
                  <Link href="/rooms/new" className="btn btn-secondary btn-sm">新增房间</Link>
                  <Link href={buildAiHref('room-allocation', 'inference')} className="btn btn-primary btn-sm">查看 AI 建议</Link>
                </div>
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

            <DataCard
              icon={<DoorOpen size={16} />}
              title="承接优先队列"
              subtitle="优先显示会影响入住分配、翻房节奏和资源释放的房间。"
              badge={<Tag variant="warning">Priority Queue</Tag>}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                {prioritizedRooms.map(room => {
                  const actionLabel = room.lifecycleStatus === '待启用'
                    ? '先完成启用，才能纳入床位资源池'
                    : room.status === '维护中'
                      ? '优先确认维修完成时间，避免影响承接'
                      : room.cleanStatus !== '已清洁'
                        ? `先处理${room.cleanStatus}状态，缩短翻房等待`
                        : '当前可作为优先承接候选房间'

                  return (
                    <div key={room.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{room.name} · {room.org}</div>
                          <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>
                            {room.floorName} · {room.type} · {room.occupied}/{room.capacity} 床位已占用
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <Tag variant={STATUS_TAG[room.status]}>{room.status}</Tag>
                          <Tag variant={room.cleanStatus === '已清洁' ? 'success' : 'warning'}>{room.cleanStatus}</Tag>
                        </div>
                      </div>
                      <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>{actionLabel}</div>
                    </div>
                  )
                })}
              </div>
            </DataCard>

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

            <DataCard
              icon={<DoorOpen size={16} />}
              title="房间资源表"
              subtitle="主区保留承接资源表，先支撑启用、翻房和入住判断。"
              badge={<Tag variant="primary">Room Table</Tag>}
            >
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
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard
              icon={<DoorOpen size={16} />}
              title="承接上下文"
              subtitle="后置显示当前焦点、待启用阻塞和清洁维护积压。"
              badge={<Tag variant="info">Context</Tag>}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">当前优先：{prioritizedRooms[0] ? `${prioritizedRooms[0].name} · ${prioritizedRooms[0].status}` : '暂无需要优先处理的房间。'}</div>
                <div className="page-help-card-item">待启用阻塞：{pendingActivationCount > 0 ? `${pendingActivationCount} 间房间待启用。` : '当前没有待启用房间。'}</div>
                <div className="page-help-card-item">清洁与维护：保洁 {cleaningBacklogCount} · 维护 {maintenanceCount}。</div>
              </div>
            </DataCard>

            <DataCard
              icon={<ChevronRight size={16} />}
              title="推荐处理路径"
              subtitle="把房间资源变更直接串到入住承接与 AI 排房闭环。"
            >
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  '先启用待启用房间，避免名义床位无法实际承接。',
                  '再处理维护与清洁待办，确保空床能真正进入可分配状态。',
                  '最后进入 AI 运营中心复核机构间承接差异。',
                ].map(item => (
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
            </DataCard>

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
                  <div key={item} className="page-help-card-item">{item}</div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <Link href={buildAiHref('room-capacity', 'logs')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整排房边界迁移到显式帮助页"
              summary="房间管理页现在只保留承接总览、优先队列和资源表，完整排房边界、AI 解释和操作顺序统一后置。"
              items={[
                '先处理待启用、维护和未清洁房间，再决定承接资源。',
                '房间资源表用于核对真实可用容量，不替代入住审批。',
                '若需要完整排房边界与操作顺序，进入帮助页查看。',
              ]}
              href={helpHref}
              actionLabel="查看房间管理帮助"
            />
          </>
        )}
      />

    </div>
  )
}
