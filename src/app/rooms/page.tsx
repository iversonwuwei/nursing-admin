'use client'

import { DataCard, EmptyState, FilterBar, FilterItem, InteractionRailLayout, PageHeader, PageHelpCard, Pagination, StatCard, Tag, WorkflowOverviewCard, type TagVariant } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { sortRoomsByPriority } from '@/lib/resource-operations-priority'
import { activateAdminRoom, fetchAdminRoomList, type AdminRoomRecord } from '@/lib/rooms/admin-room-api'
import { Bot, ChevronRight, DoorOpen, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

const STATUS_TAG: Record<AdminRoomRecord['status'], TagVariant> = {
    '已满': 'danger',
    '可入住': 'success',
    '维护中': 'warning',
    '待启用': 'warning',
}

const CLEAN_TAG: Record<AdminRoomRecord['cleanStatus'], TagVariant> = {
    '已清洁': 'success',
    '待清洁': 'warning',
    '保洁中': 'info',
}

type RoomInsight = {
    id: string
    title: string
    summary: string
    action: string
    metric: string
    variant: TagVariant
}

function buildRoomInsights(rooms: AdminRoomRecord[]): RoomInsight[] {
    const pendingActivation = rooms.filter(item => item.lifecycleStatus === '待启用')
    const cleaningBacklog = rooms.filter(item => item.cleanStatus !== '已清洁')
    const maintenance = rooms.filter(item => item.status === '维护中')
    const availableBeds = rooms.reduce((total, room) => total + Math.max(room.capacity - room.occupied, 0), 0)

    return [
        {
            id: 'pending-activation',
            title: '待启用闭环',
            summary: pendingActivation.length > 0 ? `当前有 ${pendingActivation.length} 间房间待启用，启用前不应计入可入住资源池。` : '当前没有待启用房间。',
            action: pendingActivation.length > 0 ? '优先完成资料复核与保洁确认。' : '继续保持房间启用口径稳定。',
            metric: `${pendingActivation.length} 待启用`,
            variant: pendingActivation.length > 0 ? 'warning' : 'success',
        },
        {
            id: 'cleaning-backlog',
            title: '翻房清洁',
            summary: cleaningBacklog.length > 0 ? `${cleaningBacklog.length} 间房间仍未完成清洁闭环，可能影响入住承接。` : '当前房间清洁状态稳定。',
            action: cleaningBacklog.length > 0 ? '优先处理待清洁与保洁中房间。' : '继续维持现有翻房节奏。',
            metric: `${cleaningBacklog.length} 待处理`,
            variant: cleaningBacklog.length > 0 ? 'warning' : 'info',
        },
        {
            id: 'maintenance',
            title: '维护阻断',
            summary: maintenance.length > 0 ? `${maintenance.length} 间房间处于维护中，应确认恢复时间避免误排房。` : '当前没有维护中的房间阻断承接。',
            action: maintenance.length > 0 ? '同步维修进度与床位释放时间。' : '暂无额外维护阻断。',
            metric: `${maintenance.length} 维护中`,
            variant: maintenance.length > 0 ? 'warning' : 'success',
        },
        {
            id: 'available-beds',
            title: '可承接床位',
            summary: availableBeds > 0 ? `当前仍有 ${availableBeds} 张可承接床位，可继续承接入住分配。` : '当前没有可承接床位，需要先释放或启用房间。',
            action: availableBeds > 0 ? '结合老人房间号与护理等级继续分配。' : '优先处理房间启用或翻房。',
            metric: `${availableBeds} 张空床`,
            variant: availableBeds > 0 ? 'success' : 'warning',
        },
    ]
}

function buildRoomNarratives(rooms: AdminRoomRecord[]) {
    const organizations = [...new Set(rooms.map(item => item.organizationName))]
    const availableRooms = rooms.filter(item => item.status === '可入住').length
    const occupiedRooms = rooms.filter(item => item.occupied > 0).length
    const pendingCount = rooms.filter(item => item.lifecycleStatus === '待启用').length

    return [
        organizations.length > 0
            ? `当前房间数据覆盖 ${organizations.length} 家机构，机构归属暂时仍是文本直存，不等同于 organizations 主数据绑定。`
            : '当前还没有已建档的房间机构数据。',
        availableRooms > 0
            ? `当前 ${availableRooms} 间房间处于可入住状态，适合继续承接分配。`
            : '当前没有可直接承接的房间，需要先处理启用、清洁或维护。',
        pendingCount > 0
            ? `待启用房间 ${pendingCount} 间，启用后才允许进入房间资源池。`
            : `当前已有 ${occupiedRooms} 间房间存在住户，可继续核对床位与老人房号是否一致。`,
    ]
}

export default function RoomsPage() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('selected')
  const fromNew = searchParams.get('entry') === 'rooms-new'

    const [rooms, setRooms] = useState<AdminRoomRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')
    const [actionError, setActionError] = useState('')
    const [activatingRoomId, setActivatingRoomId] = useState('')
  const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const pageSize = 10
    const organizations = useMemo(() => [...new Set(rooms.map(item => item.organizationName))], [rooms])
    const selectedRoom = useMemo(() => rooms.find(item => item.id === preselectedId) ?? null, [preselectedId, rooms])
    const aiInsights = useMemo(() => buildRoomInsights(rooms), [rooms])
    const aiNarratives = useMemo(() => buildRoomNarratives(rooms), [rooms])

  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'rooms-list',
    entityId: 'room-board',
    entityName: '房间管理',
    focus,
    target,
  })

    useEffect(() => {
        let disposed = false

        async function loadRooms() {
            setLoading(true)
            setLoadError('')

            try {
                const response = await fetchAdminRoomList({ page: 1, pageSize: 200 })
                if (!disposed) {
                    setRooms(response.items)
                }
            } catch (error) {
                if (!disposed) {
                    setLoadError(error instanceof Error ? error.message : '房间列表查询失败。')
                    setRooms([])
                }
            } finally {
                if (!disposed) {
                    setLoading(false)
                }
            }
        }

        void loadRooms()
        return () => {
            disposed = true
        }
    }, [])

    async function handleActivate(roomId: string) {
        setActivatingRoomId(roomId)
        setActionError('')

        try {
            const updated = await activateAdminRoom(roomId)
            setRooms(current => current.map(item => item.id === roomId ? updated : item))
        } catch (error) {
            setActionError(error instanceof Error ? error.message : '房间启用失败。')
        } finally {
            setActivatingRoomId('')
        }
    }

    const filtered = rooms.filter(item => {
        if (search && !item.name.includes(search) && !item.id.includes(search) && !item.organizationName.includes(search)) return false
        if (statusFilter && item.status !== statusFilter) return false
        return true
    })

    const totalBeds = rooms.reduce((sum, item) => sum + item.capacity, 0)
    const occupiedBeds = rooms.reduce((sum, item) => sum + item.occupied, 0)
    const availableBeds = rooms.reduce((sum, item) => sum + Math.max(item.capacity - item.occupied, 0), 0)
  const pendingActivationCount = rooms.filter(item => item.lifecycleStatus === '待启用').length
  const cleaningBacklogCount = rooms.filter(item => item.cleanStatus !== '已清洁').length
  const maintenanceCount = rooms.filter(item => item.status === '维护中').length
    const occupancy = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
  const sortedRooms = useMemo(() => sortRoomsByPriority(filtered), [filtered])
  const prioritizedRooms = sortedRooms.slice(0, 4)
  const paged = sortedRooms.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="房间管理"
              subtitle={`共 ${rooms.length} 间房间 · ${organizations.length} 家机构`}
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
                          description="房间页主区只保留承接总览、优先队列和资源表，先处理真正阻断入住分配的房间问题。"
                          badge={<Tag variant="info">Live Rooms</Tag>}
              metrics={[
                  { label: '整体入住率', value: `${occupancy}%`, hint: `${occupiedBeds}/${totalBeds} 床位已入住`, tone: occupancy >= 85 ? 'warning' : 'success' },
                  { label: '可承接床位', value: availableBeds, hint: `${rooms.filter(item => item.status === '可入住').length} 间可入住`, tone: availableBeds > 0 ? 'success' : 'warning' },
                  { label: '待启用房间', value: pendingActivationCount, hint: '启用后才进入资源池', tone: pendingActivationCount > 0 ? 'warning' : 'neutral' },
                { label: '清洁与维护待办', value: cleaningBacklogCount + maintenanceCount, hint: `保洁 ${cleaningBacklogCount} · 维护 ${maintenanceCount}`, tone: cleaningBacklogCount + maintenanceCount > 0 ? 'warning' : 'neutral' },
              ]}
              signals={[
                  { label: aiInsights[0] ? `${aiInsights[0].title}：${aiInsights[0].action}` : '暂无房间运营提醒', tone: aiInsights[0]?.variant === 'warning' ? 'warning' : 'info' },
                  { label: pendingActivationCount > 0 ? '存在待启用房间，当前不可直接承接入住' : '当前没有待启用房间阻塞承接', tone: pendingActivationCount > 0 ? 'warning' : 'success' },
                  { label: '床位入住对象来自真实老人房间号聚合，不再回退 room workflow occupant。', tone: 'neutral' },
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
                          <StatCard icon={<DoorOpen size={18} />} label="房间总数" value={rooms.length} color="primary" />
                          <StatCard icon={<DoorOpen size={18} />} label="总床位数" value={totalBeds} sub={`已入住 ${occupiedBeds}`} color="info" />
                          <StatCard icon={<DoorOpen size={18} />} label="入住率" value={`${occupancy}%`} sub="整体床位使用" color="success" />
                          <StatCard icon={<DoorOpen size={18} />} label="可入住" value={rooms.filter(item => item.status === '可入住').length} sub={`待启用 ${pendingActivationCount} 间`} color="warning" />
                      </div>

                      {loading ? (
                          <DataCard title="房间列表加载中" subtitle="正在从 rooms live API 加载房间主档与床位摘要。" badge={<Tag variant="info">Live Loading</Tag>}>
                              <div style={{ fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.7 }}>
                                  当前正在同步房间状态、保洁状态与老人房号聚合结果。
                              </div>
                          </DataCard>
                      ) : null}

                      {loadError ? (
                          <DataCard title="房间列表加载失败" subtitle={loadError} badge={<Tag variant="danger">Live Error</Tag>}>
                              <div style={{ fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.7 }}>
                                  页面不会再回退本地 room workflow，请先恢复 Admin BFF、Rooms Service 或 Elder Service。
                              </div>
                          </DataCard>
                      ) : null}

                      {actionError ? (
                          <DataCard title="房间启用失败" subtitle={actionError} badge={<Tag variant="danger">Action Error</Tag>}>
                              <div style={{ fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.7 }}>
                                  请重试当前房间的启用动作，或检查 live rooms API 是否可用。
                              </div>
                          </DataCard>
                      ) : null}

            {selectedRoom && fromNew ? (
              <DataCard
                title="来自新增房间页"
                              subtitle={`${selectedRoom.id} 已进入待启用闭环。启用后才会进入可承接资源池。`}
                badge={<Tag variant={selectedRoom.lifecycleStatus === '待启用' ? 'warning' : 'success'}>{selectedRoom.lifecycleStatus}</Tag>}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                                      当前房型 {selectedRoom.type}，床位 {selectedRoom.capacity}，所属机构 {selectedRoom.organizationName}。
                  </div>
                  {selectedRoom.lifecycleStatus === '待启用' ? (
                                      <button className="btn btn-primary btn-sm" disabled={activatingRoomId === selectedRoom.id} onClick={() => void handleActivate(selectedRoom.id)}>
                                          {activatingRoomId === selectedRoom.id ? '启用中...' : '启用房间'}
                    </button>
                  ) : (
                    <Link href={`/rooms/${selectedRoom.id}`} className="btn btn-secondary btn-sm">查看详情</Link>
                  )}
                </div>
              </DataCard>
            ) : null}

                      <DataCard icon={<DoorOpen size={16} />} title="承接优先队列" subtitle="优先显示影响入住分配、翻房节奏和床位释放的房间。" badge={<Tag variant="warning">Priority Queue</Tag>}>
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
                                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{room.name} · {room.organizationName}</div>
                          <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>
                            {room.floorName} · {room.type} · {room.occupied}/{room.capacity} 床位已占用
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <Tag variant={STATUS_TAG[room.status]}>{room.status}</Tag>
                                  <Tag variant={CLEAN_TAG[room.cleanStatus]}>{room.cleanStatus}</Tag>
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
                              <div className="input-wrap" style={{ minWidth: 220 }}>
                  <span className="input-icon"><Search size={14} /></span>
                  <input
                    className="input"
                                      placeholder="搜索房间编号/名称/机构..."
                    value={search}
                                      onChange={event => { setSearch(event.target.value); setPage(1) }}
                    style={{ paddingLeft: 34 }}
                  />
                </div>
              </FilterItem>
                          <FilterItem label="">
                              <select className="select" value={statusFilter} onChange={event => { setStatusFilter(event.target.value); setPage(1) }} style={{ minWidth: 140 }}>
                                  <option value="">全部状态</option>
                                  <option value="可入住">可入住</option>
                                  <option value="已满">已满</option>
                                  <option value="维护中">维护中</option>
                                  <option value="待启用">待启用</option>
                              </select>
                          </FilterItem>
            </FilterBar>

                      <DataCard icon={<DoorOpen size={16} />} title="房间资源表" subtitle="主区保留承接资源表，先支撑启用、翻房和入住判断。" badge={<Tag variant="primary">Room Table</Tag>}>
                          <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
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
                                          {paged.map(room => (
                                              <tr key={room.id} className="table-hover-row">
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: 'rgba(13,148,136,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                                <DoorOpen size={16} />
                              </div>
                                      <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{room.name}</span>
                            </div>
                          </td>
                              <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{room.organizationName}</span></td>
                              <td><span className="text-sm">{room.floor}F</span></td>
                              <td><span className="text-sm">{room.type}</span></td>
                              <td><span className="text-sm">{room.occupied}/{room.capacity}</span></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, maxWidth: 80 }}>
                                          <div style={{ height: 4, background: 'var(--color-bg)', borderRadius: 999, overflow: 'hidden' }}>
                                              <div style={{ width: `${room.capacity > 0 ? (room.occupied / room.capacity) * 100 : 0}%`, height: '100%', borderRadius: 999, background: room.occupied === room.capacity ? 'var(--color-danger)' : 'var(--color-success)' }} />
                                          </div>
                              </div>
                                      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{room.occupied}/{room.capacity}</span>
                            </div>
                          </td>
                              <td>
                                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                      <Tag variant={STATUS_TAG[room.status]}>{room.status}</Tag>
                                      <Tag variant={CLEAN_TAG[room.cleanStatus]}>{room.cleanStatus}</Tag>
                                  </div>
                              </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                                      {room.lifecycleStatus === '待启用' ? (
                                          <button className="btn btn-primary btn-sm" disabled={activatingRoomId === room.id} onClick={() => void handleActivate(room.id)}>
                                              {activatingRoomId === room.id ? '启用中...' : '启用'}
                                </button>
                              ) : null}
                                      <Link href={`/rooms/${room.id}`} className="btn btn-ghost btn-sm">查看 <ChevronRight size={12} /></Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                              {paged.length === 0 ? <EmptyState variant="search" title="暂无数据" description="调整搜索条件试试" /> : null}
                <Pagination current={page} total={filtered.length} pageSize={pageSize} onChange={setPage} />
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
                <DataCard title="对象上下文" subtitle="房间页右侧只保留资源边界与动作提醒。" badge={<Tag variant="info">Context</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                        <div className="page-help-card-item">当前数据覆盖 {organizations.length} 家机构。</div>
                        <div className="page-help-card-item">可承接床位 {availableBeds} 张，待启用房间 {pendingActivationCount} 间。</div>
                        <div className="page-help-card-item">入住对象来自真实老人房号聚合，机构字段暂时为文本直录。</div>
              </div>
            </DataCard>

                <DataCard icon={<Bot size={16} />} title="AI 房间摘要" subtitle="辅助看资源压力和翻房节奏，不自动替代人工排房。" badge={<Tag variant="info">Capacity View</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                {aiInsights.map(item => (
                  <div key={item.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                                <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.summary}</div>
                      </div>
                      <Tag variant={item.variant}>{item.metric}</Tag>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.6, color: 'var(--color-text)' }}>{item.action}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                        <Link href={buildAiHref('room-capacity', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
              </div>
            </DataCard>

                <DataCard icon={<DoorOpen size={16} />} title="AI 结构建议" subtitle="强调启用、清洁和床位释放顺序，为入住承接提供基础。">
              <div style={{ display: 'grid', gap: 10 }}>
                {aiNarratives.map(item => (
                    <div key={item} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>{item}</div>
                ))}
                    </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
                    subtitle="完整房间治理说明迁到帮助页"
                    summary="房间页首屏只保留总览、优先队列、筛选和资源表；完整治理边界与说明统一迁到帮助页。"
              items={[
                  '先处理待启用、维护中和待清洁房间。',
                  '再核对床位入住对象与老人房号是否一致。',
                  'AI 摘要只做资源建议，不直接替代排房决策。',
              ]}
                    href="/rooms/help"
                    actionLabel="查看房间帮助"
            />
          </>
        )}
          />
    </div>
  )
}