'use client'

import { DataCard, EmptyState, FilterBar, FilterItem, InteractionRailLayout, PageHeader, PageHelpCard, Pagination, StatCard, Tag, WorkflowOverviewCard, type TagVariant } from '@/components/nh'
import { getAdmissionApplicationsSnapshot, subscribeAdmissionWorkflow } from '@/lib/mock/admission-workflow'
import { buildLiveElderlyList } from '@/lib/mock/elderly-registry'
import { findFaceEnrollmentRecordByElderlyId, getFaceEnrollmentSnapshot, subscribeFaceEnrollmentWorkflow, type FaceEnrollmentStatus } from '@/lib/mock/face-enrollment-workflow'
import { ChevronRight, FileUp, Home, UserPlus as NewUser, Plus, ScanFace, Search, UserCheck, UserPlus, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState, useSyncExternalStore } from 'react'

const LEVEL_TAG: Record<string, TagVariant> = {
  '特级护理': 'danger', '全护理': 'warning', '半自理': 'info', '自理': 'success',
}
const STATUS_TAG: Record<string, TagVariant> = {
  入住: 'success', 待入住: 'warning', 离院: 'neutral',
}
const FACE_STATUS_TAG: Record<FaceEnrollmentStatus, TagVariant> = {
  待录入: 'neutral',
  采集中: 'warning',
  待确认: 'info',
  已生效: 'success',
  需重录: 'danger',
}

export default function ElderlyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const scene = searchParams.get('scene')
  const applications = useSyncExternalStore(
    subscribeAdmissionWorkflow,
    getAdmissionApplicationsSnapshot,
    getAdmissionApplicationsSnapshot,
  )
  const faceSnapshot = useSyncExternalStore(
    subscribeFaceEnrollmentWorkflow,
    getFaceEnrollmentSnapshot,
    getFaceEnrollmentSnapshot,
  )
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const homeSceneIds = useMemo(
    () => new Set(applications.filter(item => item.sourceType === 'document-import').map(item => item.id)),
    [applications],
  )

  const sceneMeta = scene === 'institutional'
    ? {
      title: '机构老人档案',
      subtitle: '当前按机构养老视角聚焦院内在住老人、床位承载和照护档案。',
      emptyTitle: '当前没有机构老人档案',
      emptyDescription: '先从入住建档进入院内闭环，或放宽当前筛选条件。',
      summary: '优先确认院内在住、待入住和特护对象，再进入详情或人脸录入。',
    }
    : scene === 'home'
      ? {
        title: '居家个案池',
        subtitle: '当前按居家养老视角聚焦资料导入、待评定和已回传的居家服务对象。',
        emptyTitle: '当前没有居家个案',
        emptyDescription: '先从资料导入受理进入居家链路，或放宽当前筛选条件。',
        summary: '优先确认导入个案、待确认对象和回传状态，再进入认定或详情。',
      }
      : {
        title: '老人列表',
        subtitle: `共 ${applications.length} 条 workflow 记录沉淀到老人台账。`,
        emptyTitle: '暂无数据',
        emptyDescription: '调整筛选条件试试',
        summary: '首页式台账只保留总览、治理闭环和主列表，不再把说明型信息堆在首屏。',
      }

  const liveElderlyList = useMemo(() => buildLiveElderlyList(applications), [applications])
  const faceStatusByElderlyId = useMemo(() => {
    const map = new Map<string, FaceEnrollmentStatus>()
    liveElderlyList.forEach(elder => {
      map.set(elder.id, findFaceEnrollmentRecordByElderlyId(elder.id, faceSnapshot)?.status ?? '待录入')
    })
    return map
  }, [faceSnapshot, liveElderlyList])
  const pendingConfirmation = applications.filter(item => item.status === '待人工确认').length
  const planGenerated = applications.filter(item => item.status === '计划已生成').length
  const currentMonth = new Date().toISOString().slice(0, 7)

  const filtered = liveElderlyList.filter(e => {
    if (scene === 'institutional' && homeSceneIds.has(e.id)) return false
    if (scene === 'home' && !homeSceneIds.has(e.id)) return false
    if (search && !e.name.includes(search) && !e.id.includes(search)) return false
    if (statusFilter && e.status !== statusFilter) return false
    if (levelFilter && e.careLevel !== levelFilter) return false
    return true
  })

  const total = filtered.length
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const totalBeds = 360
  const occupiedBeds = liveElderlyList.filter(e => e.status === '入住').length
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
  const critical = liveElderlyList.filter(e => e.careLevel === '特级护理').length
  const newThisMonth = applications.filter(item => item.createdAt.startsWith(currentMonth)).length
  const homeCases = liveElderlyList.filter(elder => homeSceneIds.has(elder.id)).length
  const facePending = liveElderlyList.filter(elder => {
    const status = faceStatusByElderlyId.get(elder.id) ?? '待录入'
    return status === '待录入' || status === '需重录' || status === '待确认'
  }).length

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={sceneMeta.title}
        subtitle={`${sceneMeta.subtitle} · ${pendingConfirmation + planGenerated} 位处于新建闭环中`}
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/elderly/face?entry=elderly-list" className="btn btn-secondary btn-sm">
              <ScanFace size={13} />人脸录入
            </Link>
            <Link href="/elderly/entrustment" className="btn btn-secondary btn-sm">
              <UserCheck size={13} />委托补贴台账
            </Link>
            <Link href="/elderly/checkin" className="btn btn-secondary btn-sm">
              <UserPlus size={13} />入住审核 {pendingConfirmation + planGenerated > 0 ? `(${pendingConfirmation + planGenerated})` : ''}
            </Link>
            <Link href="/elderly/import" className="btn btn-secondary btn-sm">
              <FileUp size={13} />资料导入
            </Link>
            <Link href="/elderly/new" className="btn btn-primary btn-sm">
              <Plus size={13} />新增老人
            </Link>
          </div>
        }
      />

      <InteractionRailLayout
        main={(
          <>
            <WorkflowOverviewCard
              eyebrow="Ledger Overview"
              title="老人台账总览"
              description={sceneMeta.summary}
              badge={<Tag variant="primary">Ledger First</Tag>}
              metrics={[
                { label: '登记总数', value: liveElderlyList.length, hint: '台账主对象总量', tone: 'primary' },
                { label: '入住率', value: `${occupancyRate}%`, hint: `${occupiedBeds}/${totalBeds} 床`, tone: occupancyRate >= 90 ? 'warning' : 'success' },
                { label: '待人工确认', value: pendingConfirmation, hint: '认定闭环待复核', tone: pendingConfirmation > 0 ? 'warning' : 'success' },
                { label: '人脸待处理', value: facePending, hint: '待录入、待确认或需重录', tone: facePending > 0 ? 'warning' : 'info' },
              ]}
              signals={[
                { label: `${critical} 位特护对象需要优先关注`, tone: critical > 0 ? 'warning' : 'success' },
                { label: `${newThisMonth} 位本月新入住对象已写回台账`, tone: 'info' },
                { label: scene === 'home' ? `当前居家个案 ${homeCases} 位` : '当前页面优先聚焦院内对象与治理闭环', tone: 'neutral' },
              ]}
            />

            <div className="kpi-grid">
              <StatCard icon={<Home size={18} />} label="入住率" value={`${occupancyRate}%`} sub={`${occupiedBeds}/${totalBeds} 床`} color="primary" />
              <StatCard icon={<Users size={18} />} label="登记总数" value={liveElderlyList.length} color="success" />
              <StatCard icon={<UserCheck size={18} />} label="特护人数" value={critical} sub="需重点关注" color="danger" />
              <StatCard icon={<NewUser size={18} />} label="本月新入住" value={newThisMonth} sub="本月新增" color="info" />
            </div>

            <DataCard title="新建数据闭环" subtitle="老人创建与资料导入共用同一条治理链路。" badge={<Tag variant="warning">Workflow Loop</Tag>}>
              <div className="ledger-metric-grid">
                {[
                  { title: '新建录入', value: applications.length, description: '录入后写入共享 workflow store' },
                  { title: '资料导入', value: applications.filter(item => item.sourceType === 'document-import').length, description: '来自证件/病历资料识别' },
                  { title: '待人工确认', value: pendingConfirmation, description: '等待护理主管确认最终级别' },
                  { title: '计划已生成', value: planGenerated, description: '已同步任务页与提醒中心' },
                ].map(item => (
                  <div key={item.title} className="ledger-metric-card">
                    <div className="ledger-metric-label">{item.title}</div>
                    <div className="ledger-metric-value">{item.value}</div>
                    <div className="ledger-metric-description">{item.description}</div>
                  </div>
                ))}
              </div>
            </DataCard>

            <FilterBar>
              <FilterItem label="">
                <div className="input-wrap" style={{ minWidth: 180 }}>
                  <span className="input-icon"><Search size={14} /></span>
                  <input
                    className="input"
                    placeholder="搜索姓名/编号..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1) }}
                    style={{ paddingLeft: 34 }}
                  />
                </div>
              </FilterItem>
              <FilterItem label="">
                <select
                  className="select"
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                  style={{ minWidth: 120 }}
                >
                  <option value="">全部状态</option>
                  <option value="入住">入住</option>
                  <option value="待入住">待入住</option>
                  <option value="离院">离院</option>
                </select>
              </FilterItem>
              <FilterItem label="">
                <select
                  className="select"
                  value={levelFilter}
                  onChange={e => { setLevelFilter(e.target.value); setPage(1) }}
                  style={{ minWidth: 120 }}
                >
                  <option value="">全部护理等级</option>
                  <option value="特级护理">特级护理</option>
                  <option value="全护理">全护理</option>
                  <option value="半自理">半自理</option>
                  <option value="自理">自理</option>
                </select>
              </FilterItem>
            </FilterBar>

            <DataCard title="老人台账列表" subtitle="筛选、分页、详情跳转和人脸快捷动作统一留在主列表区。">
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
                        <th>姓名</th>
                        <th>性别</th>
                        <th>年龄</th>
                        <th>护理等级</th>
                        <th>状态</th>
                        <th>人脸状态</th>
                        <th>房间</th>
                        <th>入住日期</th>
                        <th style={{ textAlign: 'right' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.length === 0 ? null : paged.map(e => (
                        <tr key={e.id} className="table-hover-row" onClick={() => router.push(`/elderly/${e.id}`)}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className="avatar avatar-sm">
                                {e.name.slice(0, 1)}
                              </div>
                              <div>
                                <div className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{e.name}</div>
                                <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{e.id}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="text-sm">{e.gender}</span></td>
                          <td><span className="text-sm">{e.age}岁</span></td>
                          <td><Tag variant={LEVEL_TAG[e.careLevel]}>{e.careLevel}</Tag></td>
                          <td><Tag variant={STATUS_TAG[e.status]}>{e.status}</Tag></td>
                          <td><Tag variant={FACE_STATUS_TAG[faceStatusByElderlyId.get(e.id) ?? '待录入']}>{faceStatusByElderlyId.get(e.id) ?? '待录入'}</Tag></td>
                          <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{e.roomNumber}</span></td>
                          <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{e.checkInDate}</span></td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              <Link
                                href={`/elderly/face?selected=${e.id}&entry=elderly-list`}
                                className="btn btn-secondary btn-sm"
                                onClick={event => event.stopPropagation()}
                              >
                                人脸录入
                              </Link>
                              <Link
                                href={`/elderly/${e.id}`}
                                className="btn btn-ghost btn-sm"
                                onClick={event => event.stopPropagation()}
                              >
                                查看 <ChevronRight size={12} />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {paged.length === 0 && (
                  <EmptyState variant="search" title={sceneMeta.emptyTitle} description={sceneMeta.emptyDescription} />
                )}
                <Pagination current={page} total={total} pageSize={pageSize} onChange={setPage} />
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="台账上下文" subtitle="后置区只保留治理边界与场景判断。" badge={<Tag variant="info">Ledger Context</Tag>}>
              <div className="home-context-stack">
                <div className="home-context-item">
                  <div className="home-context-title">当前视角</div>
                  <div className="home-context-description">{scene === 'home' ? '当前是居家个案视角，优先看导入与待评定对象。' : scene === 'institutional' ? '当前是机构养老视角，优先看院内在住、待入住与特护对象。' : '当前是通用老人台账视角，优先看治理闭环和主列表。'}</div>
                </div>
                <div className="home-context-item">
                  <div className="home-context-title">人脸闭环</div>
                  <div className="home-context-description">当前共有 {facePending} 位对象处于待录入、待确认或需重录状态，建议优先在主列表就地处理。</div>
                </div>
                <div className="home-context-item">
                  <div className="home-context-title">居家导入占比</div>
                  <div className="home-context-description">资料导入形成的居家个案共 {homeCases} 位，用于和院内对象区分治理链路。</div>
                </div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整说明后置到帮助页"
              summary="老人列表首屏现在只保留台账总览、治理闭环和主列表；说明性上下文统一放到后置区和帮助页。"
              items={[
                '先看待人工确认、人脸待处理和特护人数。',
                '再用筛选和分页进入主列表处理。',
                '导入、审核和人脸录入都保持在同一治理链路。',
              ]}
              href="/elderly/help"
              actionLabel="查看页面帮助"
            />
          </>
        )}
      />
    </div>
  )
}
