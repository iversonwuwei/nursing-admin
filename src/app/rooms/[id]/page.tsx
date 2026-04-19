'use client'

import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { activateAdminRoom, fetchAdminRoomDetail, type AdminRoomRecord } from '@/lib/rooms/admin-room-api'
import { ArrowLeft, Bot, DoorOpen } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type DetailInsight = {
    title: string
    summary: string
    actions: string[]
    confidence: number
}

function buildRoomDetailInsight(room: AdminRoomRecord): DetailInsight {
    const availableBeds = Math.max(room.capacity - room.occupied, 0)

    return {
        title: '房间状态摘要',
        summary: `${room.id} 当前为${room.status}，清洁状态 ${room.cleanStatus}，已占用 ${room.occupied}/${room.capacity} 床。`,
        actions: [
            room.lifecycleStatus === '待启用' ? '先完成房间启用复核。' : '继续确认房间资源池状态。',
            room.cleanStatus !== '已清洁' ? '优先处理清洁闭环，避免误排房。' : '保持当前清洁节奏。',
            availableBeds > 0 ? `当前仍有 ${availableBeds} 张空床，可承接后续入住。` : '当前没有空床，需要等待释放或重新分配。',
        ],
        confidence: room.lifecycleStatus === '待启用' || room.cleanStatus !== '已清洁' ? 91 : 86,
    }
}

function buildRoomCareInsight(room: AdminRoomRecord): DetailInsight {
    const occupiedBeds = room.bedsInfo.filter(item => item.status === 'occupied')

    return {
        title: '照护与巡检建议',
        summary: occupiedBeds.length > 0 ? `当前有 ${occupiedBeds.length} 个床位已入住，应继续结合住户护理等级与房型评估。` : '当前房间暂无已入住床位，可优先用于新入住承接。',
        actions: [
            occupiedBeds.length > 0 ? '核对当前住户护理等级与房型是否匹配。' : '当前房间暂无住户，可优先用于新的承接分配。',
            room.status === '维护中' ? '维护完成前不要继续安排入住。' : '维护状态正常，可继续结合床位释放安排。',
            room.facilities.length > 0 ? `设施清单已登记 ${room.facilities.length} 项，变更时同步更新房间主档。` : '补齐房间设施清单，避免承接信息不完整。',
        ],
        confidence: occupiedBeds.length > 0 ? 84 : 80,
    }
}

export default function RoomDetailPage() {
  const params = useParams()
  const id = params.id as string

    const [room, setRoom] = useState<AdminRoomRecord | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [activating, setActivating] = useState(false)

    useEffect(() => {
        let disposed = false

        async function loadDetail() {
            setLoading(true)
            setError('')

            try {
                const response = await fetchAdminRoomDetail(id)
                if (!disposed) {
                    setRoom(response)
                }
            } catch (loadError) {
                if (!disposed) {
                    setError(loadError instanceof Error ? loadError.message : '房间详情查询失败。')
                    setRoom(null)
                }
            } finally {
                if (!disposed) {
                    setLoading(false)
                }
            }
        }

        void loadDetail()
        return () => {
            disposed = true
        }
    }, [id])

    async function handleActivate() {
        if (!room) {
            return
        }

        setActivating(true)
        setError('')

        try {
            const updated = await activateAdminRoom(room.id)
            setRoom(updated)
        } catch (actionError) {
            setError(actionError instanceof Error ? actionError.message : '房间启用失败。')
        } finally {
            setActivating(false)
        }
    }

    const aiInsight = useMemo(() => room ? buildRoomDetailInsight(room) : null, [room])
    const careInsight = useMemo(() => room ? buildRoomCareInsight(room) : null, [room])
    const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: 'room-detail',
      entityId: room?.id ?? id,
      entityName: room?.name ?? id,
    focus,
    target,
  })

    if (loading) {
        return (
            <div className="page-root animate-fade-up">
                <DataCard title="房间详情加载中" subtitle="正在从 rooms live API 加载房间对象。" badge={<Tag variant="info">Live Loading</Tag>}>
                    <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>当前正在同步房间状态、床位占用与入住对象聚合结果。</div>
                </DataCard>
            </div>
        )
    }

    if (!room) {
      return (
          <div className="page-root animate-fade-up">
              <PageHeader
                    title="房间详情"
                    subtitle="当前房间不存在或暂时无法读取。"
                    actions={<Link href="/rooms" className="btn btn-secondary btn-sm"><ArrowLeft size={13} />返回房间管理</Link>}
                />
                <DataCard title="房间详情加载失败" subtitle={error || '未找到当前房间。'} badge={<Tag variant="danger">Live Error</Tag>}>
                    <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>页面不会再回退默认房间对象，请先恢复 Admin BFF、Rooms Service 或 Elder Service。</div>
                </DataCard>
            </div>
        )
    }

    return (
        <div className="page-root animate-fade-up">
            <PageHeader
                title={room.id}
                subtitle={`${room.floorName} · ${room.organizationName}`}
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/rooms" className="btn btn-secondary btn-sm"><ArrowLeft size={13} />返回房间管理</Link>
                {room.lifecycleStatus === '待启用' ? (
                    <button className="btn btn-primary btn-sm" disabled={activating} onClick={() => void handleActivate()}>
                        {activating ? '启用中...' : '启用房间'}
              </button>
                ) : null}
          </div>
        }
      />

      <InteractionRailLayout
        main={(
          <>
            <WorkflowOverviewCard
              eyebrow="Room Detail"
                          title={`${room.name} 房间对象总览`}
                          description="主区只保留房间事实、床位状态和设施信息，AI 排房与照护建议后置展示。"
                          badge={<Tag variant={room.status === '已满' ? 'danger' : room.status === '可入住' ? 'success' : 'warning'}>{room.status}</Tag>}
              metrics={[
                  { label: '房型', value: room.type, hint: `楼层 ${room.floorName}`, tone: 'info' },
                  { label: '床位数', value: `${room.capacity}床`, hint: `已入住 ${room.occupied} 床`, tone: room.occupied === room.capacity ? 'warning' : 'success' },
                  { label: '清洁状态', value: room.cleanStatus, hint: `上次清洁 ${room.lastClean}`, tone: room.cleanStatus === '已清洁' ? 'success' : 'warning' },
                  { label: '启用状态', value: room.lifecycleStatus, hint: room.activationNote ?? '当前暂无额外说明', tone: room.lifecycleStatus === '待启用' ? 'warning' : 'info' },
              ]}
              signals={[
                  { label: `设施数：${room.facilities.length} 项`, tone: 'info' },
                  { label: room.lifecycleStatus === '待启用' ? '当前房间仍待启用，不能直接进入承接资源池。' : '当前房间已纳入承接资源池，可继续核对床位与清洁状态。', tone: room.lifecycleStatus === '待启用' ? 'warning' : 'success' },
                  { label: '入住对象来自真实老人房号聚合，AI 建议只辅助排房与照护判断。', tone: 'neutral' },
              ]}
            />

            <div className="kpi-grid">
                          <StatCard icon={<DoorOpen size={18} />} label="房间状态" value={room.status} sub={room.type} color={room.status === '已满' ? 'danger' : room.status === '可入住' ? 'success' : 'warning'} />
                          <StatCard icon={<DoorOpen size={18} />} label="入住床位" value={`${room.occupied}/${room.capacity}`} sub="当前床位占用" color="info" />
                          <StatCard icon={<DoorOpen size={18} />} label="清洁状态" value={room.cleanStatus} sub={`下次清洁 ${room.nextClean}`} color={room.cleanStatus === '已清洁' ? 'success' : 'warning'} />
                          <StatCard icon={<DoorOpen size={18} />} label="启用状态" value={room.lifecycleStatus} sub="资源池准入" color={room.lifecycleStatus === '待启用' ? 'warning' : 'primary'} />
            </div>

                      {error ? (
                          <DataCard title="动作失败" subtitle={error} badge={<Tag variant="danger">Action Error</Tag>}>
                              <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>请重试房间启用动作，或检查 rooms live API 是否可用。</div>
                          </DataCard>
                      ) : null}

                      <DataCard title="房间状态" subtitle="新建房间先进入待启用，再纳入排房资源池。" badge={<Tag variant={room.lifecycleStatus === '待启用' ? 'warning' : 'success'}>{room.lifecycleStatus}</Tag>}>
                          <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{room.activationNote ?? '当前暂无额外说明。'}</div>
            </DataCard>

            <DataCard title="床位概览" subtitle="对象床位事实留在主区，先支撑入住与照护判断。" badge={<Tag variant="primary">Beds</Tag>}>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                              {room.bedsInfo.map(bed => {
                                  const isOccupied = bed.status === 'occupied' && Boolean(bed.elder)

                  return (
                      <div key={bed.bedId} style={{ flex: '1 1 240px', padding: '16px 18px', borderRadius: 12, border: `1.5px solid ${isOccupied ? 'var(--color-primary)' : 'var(--color-border)'}`, background: isOccupied ? 'var(--color-primary-light)' : 'var(--color-bg)', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: isOccupied ? 'var(--color-primary)' : 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <DoorOpen size={18} style={{ color: isOccupied ? 'white' : 'var(--color-muted)' }} />
                      </div>
                          {isOccupied && bed.elder ? (
                        <div>
                          <div className="font-semibold text-sm">{bed.elder.name}</div>
                                  <div className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{bed.elder.careLevel} · 入住 {bed.elder.checkIn}</div>
                                  <Link href={`/elderly/${bed.elder.elderId}`} className="btn btn-ghost btn-sm mt-2" style={{ fontSize: 11, height: 24, padding: '0 6px' }}>查看详情</Link>
                        </div>
                      ) : (
                        <div>
                                      <div className="font-semibold text-sm" style={{ color: 'var(--color-muted)' }}>空闲</div>
                                      <div className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>可安排入住</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </DataCard>

            <DataCard icon={<DoorOpen size={15} />} title="房间信息" subtitle="对象事实保留在主区，避免被说明型内容打断。">
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {[
                                  { label: '房间编号', value: room.id },
                                  { label: '所属机构', value: room.organizationName },
                                  { label: '楼层', value: room.floorName },
                                  { label: '房间类型', value: room.type },
                                  { label: '床位数', value: `${room.capacity}床` },
                                  { label: '清洁状态', value: room.cleanStatus },
                                  { label: '上次清洁', value: room.lastClean },
                              ].map(item => (
                                  <div key={item.label}>
                                      <div className="text-xs font-semibold" style={{ color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{item.label}</div>
                                      <div className="text-sm font-semibold">{item.value}</div>
                  </div>
                ))}
              </div>
            </DataCard>

            <DataCard icon={<DoorOpen size={15} />} title="房间设施" subtitle="设施列表保留在主区，便于对象级核对。">
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {room.facilities.map(item => (
                                  <span key={item} className="text-sm px-3 py-2 rounded-lg border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)', background: 'var(--color-bg)' }}>
                                      ✓ {item}
                  </span>
                ))}
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="对象上下文" subtitle="当前对象边界与决策责任后置显示。" badge={<Tag variant="info">Context</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                        <div className="page-help-card-item">房型：{room.type} · 房间状态：{room.status}</div>
                        <div className="page-help-card-item">清洁节奏：{room.cleanStatus} · 下次清洁 {room.nextClean}</div>
                <div className="page-help-card-item">排房与照护建议只作辅助，最终仍需人工确认床位安排和巡检动作。</div>
              </div>
            </DataCard>

                {aiInsight ? (
                    <DataCard icon={<Bot size={16} />} title={aiInsight.title} subtitle="将房间状态、清洁节奏和入住对象转成可执行建议。" badge={<Tag variant="primary">Room AI</Tag>}>
                        <div style={{ display: 'grid', gap: 12 }}>
                            <div style={{ borderRadius: 12, background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>{aiInsight.summary}</div>
                            <div style={{ display: 'grid', gap: 8 }}>
                                {aiInsight.actions.map(action => <div key={action} className="page-help-card-item">{action}</div>)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                <div style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>置信度 {aiInsight.confidence}%</div>
                                <Link href={buildAiHref('room-overview', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
                            </div>
                        </div>
                    </DataCard>
                ) : null}

                {careInsight ? (
                    <DataCard icon={<Bot size={16} />} title={careInsight.title} subtitle="把床位照护、设施巡检和清洁节奏压成当班动作。" badge={<Tag variant="warning">Care Follow-up</Tag>}>
                        <div style={{ display: 'grid', gap: 12 }}>
                            <div style={{ borderRadius: 12, background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>{careInsight.summary}</div>
                            <div style={{ display: 'grid', gap: 8 }}>
                                {careInsight.actions.map(action => <div key={action} className="page-help-card-item">{action}</div>)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                <div style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>置信度 {careInsight.confidence}%</div>
                                <Link href={buildAiHref('room-care', 'logs')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
                            </div>
                        </div>
                    </DataCard>
                ) : null}

            <PageHelpCard
              title="页面帮助"
              subtitle="完整房间边界迁移到显式帮助页"
              summary="房间详情页现在只保留对象事实、床位状态和设施信息，完整排房边界与 AI 解释统一后置。"
              items={[
                '先核对房间状态、床位占用和清洁节奏。',
                '再阅读 AI 排房与照护建议，决定是否需要进一步干预。',
                  '如需完整房间管理边界与操作顺序，进入帮助页查看。',
              ]}
                    href="/rooms/help"
              actionLabel="查看房间管理帮助"
            />
          </>
        )}
      />
    </div>
  )
}