"use client"

import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard } from "@/components/nh"
import { buildAiAssistantHref } from "@/lib/ai-context"
import { getRoomCareActionInsight, getRoomDetailAiInsight } from "@/lib/mock/admin-ai"
import { activateRoomDraft, findLiveRoomById, getMasterDataSnapshot, subscribeMasterDataWorkflow } from "@/lib/mock/master-data-workflow"
import { ArrowLeft, Bot, DoorOpen, Edit } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useMemo, useSyncExternalStore } from "react"

export default function RoomDetailPage() {
  const params = useParams()
  const id = params.id as string
  const snapshot = useSyncExternalStore(
    subscribeMasterDataWorkflow,
    getMasterDataSnapshot,
    getMasterDataSnapshot,
  )
  const data = useMemo(
    () => findLiveRoomById(id, snapshot) ?? snapshot.rooms[0],
    [id, snapshot],
  )
  const aiInsight = getRoomDetailAiInsight({
    id: data.id,
    type: data.type,
    beds: data.capacity,
    occupied: data.occupied,
    status: data.status,
    cleanStatus: data.cleanStatus,
    lastClean: data.lastClean,
    nextClean: data.nextClean,
    facilities: [...data.facilities],
    bedOccupants: data.bedsInfo.map(item => ({ careLevel: item.elder?.careLevel, elderName: item.elder?.name })),
  })
  const careInsight = getRoomCareActionInsight({
    id: data.id,
    type: data.type,
    beds: data.capacity,
    occupied: data.occupied,
    status: data.status,
    cleanStatus: data.cleanStatus,
    lastClean: data.lastClean,
    nextClean: data.nextClean,
    facilities: [...data.facilities],
    bedOccupants: data.bedsInfo.map(item => ({ careLevel: item.elder?.careLevel, elderName: item.elder?.name })),
  })
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = "inference") => buildAiAssistantHref({
    source: 'room-detail',
    entityId: data.id,
    entityName: data.id,
    focus,
    target,
  })
  const helpHref = '/rooms/help'

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title={data.id}
        subtitle={`${data.floorName} · ${data.facilities.join(" · ")}`}
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/rooms" className="btn btn-secondary btn-sm"><ArrowLeft size={13} />返回房间管理</Link>
            {data.lifecycleStatus === '待启用' ? (
              <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={() => activateRoomDraft(data.id)}>
                <Edit size={14} />启用房间
              </button>
            ) : (
              <button className="btn btn-primary btn-sm flex items-center gap-2">
                <Edit size={14} />编辑房间
              </button>
            )}
          </div>
        }
      />

      <InteractionRailLayout
        main={(
          <>
            <WorkflowOverviewCard
              eyebrow="Room Detail"
              title={`${data.id} 房间对象总览`}
              description="主区只保留对象事实、床位状态和设施信息，AI 排房与照护建议后置展示。"
              badge={<Tag variant={data.status === '已满' ? 'danger' : data.status === '可入住' ? 'success' : 'warning'}>{data.status}</Tag>}
              metrics={[
                { label: '房型', value: data.type, hint: `楼层 ${data.floorName}`, tone: 'info' },
                { label: '床位数', value: `${data.capacity}床`, hint: `已入住 ${data.occupied} 床`, tone: data.occupied === data.capacity ? 'warning' : 'success' },
                { label: '清洁状态', value: data.cleanStatus, hint: `上次清洁 ${data.lastClean}`, tone: data.cleanStatus === '已清洁' ? 'success' : 'warning' },
                { label: '启用状态', value: data.lifecycleStatus, hint: data.activationNote ?? '当前暂无额外说明', tone: data.lifecycleStatus === '待启用' ? 'warning' : 'neutral' },
              ]}
              signals={[
                { label: `设施数：${data.facilities.length} 项`, tone: 'info' },
                { label: data.lifecycleStatus === '待启用' ? '当前房间仍待启用，不能直接进入承接资源池。' : '当前房间已纳入承接资源池，可继续核对床位与清洁状态。', tone: data.lifecycleStatus === '待启用' ? 'warning' : 'success' },
                { label: 'AI 建议只辅助排房与照护判断，不替代人工确认。', tone: 'neutral' },
              ]}
            />

            <div className="kpi-grid">
              <StatCard icon={<DoorOpen size={18} />} label="房间状态" value={data.status} sub={data.type} color={data.status === '已满' ? 'danger' : data.status === '可入住' ? 'success' : 'warning'} />
              <StatCard icon={<DoorOpen size={18} />} label="入住床位" value={`${data.occupied}/${data.capacity}`} sub="当前床位占用" color="info" />
              <StatCard icon={<DoorOpen size={18} />} label="清洁状态" value={data.cleanStatus} sub={`下次清洁 ${data.nextClean}`} color={data.cleanStatus === '已清洁' ? 'success' : 'warning'} />
              <StatCard icon={<DoorOpen size={18} />} label="启用状态" value={data.lifecycleStatus} sub="资源池准入" color={data.lifecycleStatus === '待启用' ? 'warning' : 'primary'} />
            </div>

            <DataCard title="房间状态" subtitle="新建房间先进入待启用，再纳入排房资源池。" badge={<Tag variant={data.lifecycleStatus === '待启用' ? 'warning' : 'success'}>{data.lifecycleStatus}</Tag>}>
              <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                {data.activationNote ?? '当前暂无额外说明。'}
              </div>
            </DataCard>

            <DataCard title="床位概览" subtitle="对象床位事实留在主区，先支撑入住与照护判断。" badge={<Tag variant="primary">Beds</Tag>}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[...Array(data.capacity)].map((_, i) => {
                  const bed = data.bedsInfo[i]
                  const isOccupied = bed?.status === "occupied"
                  return (
                    <div key={i} style={{
                      flex: "1 1 240px",
                      padding: "16px 18px",
                      borderRadius: 12,
                      border: `1.5px solid ${isOccupied ? "var(--color-primary)" : "var(--color-border)"}`,
                      background: isOccupied ? "var(--color-primary-light)" : "var(--color-bg)",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: isOccupied ? "var(--color-primary)" : "var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <DoorOpen size={18} style={{ color: isOccupied ? "white" : "var(--color-muted)" }} />
                      </div>
                      {isOccupied && bed?.elder ? (
                        <div>
                          <div className="font-semibold text-sm">{bed.elder.name}</div>
                          <div className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>{bed.elder.careLevel} · 入住 {bed.elder.checkIn}</div>
                          <Link href={`/elderly/${bed.elder.id}`} className="btn btn-ghost btn-sm mt-2" style={{ fontSize: 11, height: 24, padding: "0 6px" }}>查看详情</Link>
                        </div>
                      ) : (
                        <div>
                          <div className="font-semibold text-sm" style={{ color: "var(--color-muted)" }}>空闲</div>
                          <div className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>可安排入住</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </DataCard>

            <DataCard icon={<DoorOpen size={15} />} title="房间信息" subtitle="对象事实保留在主区，避免被说明型内容打断。">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                {[
                  { label: "房间编号", value: data.id },
                  { label: "楼层", value: data.floorName },
                  { label: "房间类型", value: data.type },
                  { label: "床位数", value: `${data.capacity}床` },
                  { label: "清洁状态", value: data.cleanStatus },
                  { label: "上次清洁", value: data.lastClean },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-xs font-semibold" style={{ color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                    <div className="text-sm font-semibold">{value}</div>
                  </div>
                ))}
              </div>
            </DataCard>

            <DataCard icon={<DoorOpen size={15} />} title="房间设施" subtitle="设施列表保留在主区，便于对象级核对。">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {data.facilities.map((f: string) => (
                  <span key={f} className="text-sm px-3 py-2 rounded-lg border" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)", background: "var(--color-bg)" }}>
                    ✓ {f}
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
                <div className="page-help-card-item">房型：{data.type} · 房间状态：{data.status}</div>
                <div className="page-help-card-item">清洁节奏：{data.cleanStatus} · 下次清洁 {data.nextClean}</div>
                <div className="page-help-card-item">排房与照护建议只作辅助，最终仍需人工确认床位安排和巡检动作。</div>
              </div>
            </DataCard>

            <DataCard
              icon={<Bot size={16} />}
              title={aiInsight.title}
              subtitle="将房间状态、清洁节奏和入住对象转成可执行建议。"
              badge={<Tag variant="primary">Room AI</Tag>}
            >
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ borderRadius: 12, background: "var(--color-bg)", padding: 14, fontSize: 12.5, lineHeight: 1.7, color: "var(--color-text)" }}>
                  {aiInsight.summary}
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {aiInsight.actions.map(action => (
                    <div key={action} className="page-help-card-item">{action}</div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 12, color: "var(--color-primary)", fontWeight: 600 }}>置信度 {aiInsight.confidence}%</div>
                  <Link href={buildAiHref('room-overview', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
                </div>
              </div>
            </DataCard>

            <DataCard
              icon={<Bot size={16} />}
              title={careInsight.title}
              subtitle="把床位照护、设施巡检和清洁节奏压成当班动作。"
              badge={<Tag variant="warning">Care Follow-up</Tag>}
            >
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ borderRadius: 12, background: "var(--color-bg)", padding: 14, fontSize: 12.5, lineHeight: 1.7, color: "var(--color-text)" }}>
                  {careInsight.summary}
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {careInsight.actions.map(action => (
                    <div key={action} className="page-help-card-item">{action}</div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 12, color: "var(--color-primary)", fontWeight: 600 }}>置信度 {careInsight.confidence}%</div>
                  <Link href={buildAiHref('room-care', 'logs')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
                </div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整房间边界迁移到显式帮助页"
              summary="房间详情页现在只保留对象事实、床位状态和设施信息，完整排房边界与 AI 解释统一后置。"
              items={[
                '先核对房间状态、床位占用和清洁节奏。',
                '再阅读 AI 排房与照护建议，决定是否需要进一步干预。',
                '若需要完整房间管理边界与操作顺序，进入帮助页查看。',
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
