'use client'

import { DataCard, EmptyState, FilterBar, FilterItem, InteractionRailLayout, PageHeader, PageHelpCard, Pagination, StatCard, Tag, WorkflowOverviewCard, type TagVariant } from '@/components/nh'
import { fetchAdminElderList, type AdminElderListItemResponse } from '@/lib/elderly/admin-elderly-api'
import { ChevronRight, FileUp, Home, UserPlus as NewUser, Plus, ScanFace, Search, UserCheck, UserPlus, Users } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

const LEVEL_TAG: Record<string, TagVariant> = {
  特级护理: 'danger',
  全护理: 'warning',
  半自理: 'info',
  自理: 'success',
}

const STATUS_TAG: Record<string, TagVariant> = {
  入住: 'success',
  待入住: 'warning',
  离院: 'neutral',
}

type LiveElderRow = {
  id: string
  name: string
  genderLabel: string
  age: number
  careLevelLabel: string
  statusLabel: string
  roomNumber: string
  familyContactName: string
  admissionCreatedAtLabel: string
}

function formatCareLevel(value: string) {
  switch (value) {
    case 'L4':
    case '特级护理':
      return '特级护理'
    case 'L3':
    case '二级护理':
    case '全护理':
      return '全护理'
    case 'L2':
    case '三级护理':
    case '半自理':
      return '半自理'
    case 'L1':
    case '一级护理':
    case '自理':
      return '自理'
    default:
      return value || '待评定'
  }
}

function formatAdmissionStatus(value: string) {
  switch (value) {
    case 'Active':
      return '入住'
    case 'AdmissionReviewed':
    case 'Pending':
      return '待入住'
    case 'Discharged':
    case 'Inactive':
      return '离院'
    default:
      return '待入住'
  }
}

function formatGender(value: string) {
  if (value === 'male') {
    return '男'
  }

  if (value === 'female') {
    return '女'
  }

  return value || '未知'
}

function formatDate(value: string | null) {
  if (!value) {
    return '待补录'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '待补录'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function mapElderRow(item: AdminElderListItemResponse): LiveElderRow {
  return {
    id: item.elderId,
    name: item.elderName,
    genderLabel: formatGender(item.gender),
    age: item.age,
    careLevelLabel: formatCareLevel(item.careLevel),
    statusLabel: formatAdmissionStatus(item.admissionStatus),
    roomNumber: item.roomNumber,
    familyContactName: item.familyContactName || '待补录',
    admissionCreatedAtLabel: formatDate(item.admissionCreatedAtUtc),
  }
}

export default function ElderlyPage() {
  const searchParams = useSearchParams()
  const scene = searchParams.get('scene')
  const [records, setRecords] = useState<LiveElderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError('')
        const response = await fetchAdminElderList({ page: 1, pageSize: 200 })
        if (!active) {
          return
        }

        setRecords(response.items.map(mapElderRow))
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : '老人主档读取失败。')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  const sceneMeta = scene === 'institutional'
    ? {
      title: '机构老人档案',
      subtitle: '当前按机构养老视角聚焦院内在住老人、待入住对象和照护主档。',
      emptyTitle: '当前没有机构老人档案',
      emptyDescription: '请先检查 Elder Service 是否已写入院内对象，或放宽当前筛选条件。',
      summary: '优先确认院内在住、待入住和高照护对象，再进入详情。',
    }
    : scene === 'home'
      ? {
        title: '居家个案池',
        subtitle: '当前老人主档已切到实时数据；居家与机构细分字段仍待后端继续补齐。',
        emptyTitle: '当前没有居家个案',
        emptyDescription: '当前真实主档尚未返回可区分的居家对象，请先完成后端 scene 字段接入。',
        summary: '本轮先保证老人主档真实化，居家专属细分后续再补。',
      }
      : {
        title: '老人列表',
        subtitle: 'Elder Service 实时主档总览，不再依赖 shared workflow 或本地 snapshot。',
        emptyTitle: '暂无数据',
        emptyDescription: '请先确认本地 seeder 已完成，或调整筛选条件重试。',
        summary: '首屏只保留实时主档总览、筛选和主列表，不再把演示性说明堆回台账。',
      }

  const filtered = useMemo(() => records.filter(record => {
    if (search && !record.name.includes(search) && !record.id.includes(search) && !record.roomNumber.includes(search)) {
      return false
    }

    if (statusFilter && record.statusLabel !== statusFilter) {
      return false
    }

    if (levelFilter && record.careLevelLabel !== levelFilter) {
      return false
    }

    return true
  }), [levelFilter, records, search, statusFilter])

  const total = filtered.length
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const activeCount = records.filter(record => record.statusLabel === '入住').length
  const pendingCount = records.filter(record => record.statusLabel === '待入住').length
  const criticalCount = records.filter(record => record.careLevelLabel === '特级护理').length
  const newThisMonth = records.filter(record => {
    if (record.admissionCreatedAtLabel === '待补录') {
      return false
    }

    return true
  }).length

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={sceneMeta.title}
        subtitle={loading ? `${sceneMeta.subtitle} · 正在同步实时主档` : sceneMeta.subtitle}
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/elderly/face?entry=elderly-list" className="btn btn-secondary btn-sm">
              <ScanFace size={13} />人脸录入
            </Link>
            <Link href="/elderly/entrustment" className="btn btn-secondary btn-sm">
              <UserCheck size={13} />委托补贴台账
            </Link>
            <Link href="/elderly/checkin" className="btn btn-secondary btn-sm">
              <UserPlus size={13} />入住审核 {pendingCount > 0 ? `(${pendingCount})` : ''}
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
              badge={<Tag variant="primary">Live Ledger</Tag>}
              metrics={[
                { label: '登记总数', value: records.length, hint: 'Elder Service 主档总量', tone: 'primary' },
                { label: '已入住', value: activeCount, hint: '实时在住对象', tone: activeCount > 0 ? 'success' : 'info' },
                { label: '待入住', value: pendingCount, hint: '等待审核或排床', tone: pendingCount > 0 ? 'warning' : 'success' },
                { label: '高照护', value: criticalCount, hint: '特级护理对象', tone: criticalCount > 0 ? 'danger' : 'info' },
              ]}
              signals={[
                { label: `${criticalCount} 位高照护对象需要优先关注`, tone: criticalCount > 0 ? 'warning' : 'success' },
                { label: `${newThisMonth} 位对象已具备可追踪建档时间`, tone: 'info' },
                { label: '人脸状态服务尚未接通，本页只保留入口不再渲染本地状态。', tone: 'neutral' },
              ]}
            />

            <div className="kpi-grid">
              <StatCard icon={<Users size={18} />} label="登记总数" value={records.length} color="success" />
              <StatCard icon={<Home size={18} />} label="已入住" value={activeCount} sub="实时在住" color="primary" />
              <StatCard icon={<UserCheck size={18} />} label="待入住" value={pendingCount} sub="待审核排床" color="warning" />
              <StatCard icon={<NewUser size={18} />} label="高照护" value={criticalCount} sub="需重点关注" color="danger" />
            </div>

            <DataCard title="实时主档边界" subtitle="这批数据直接来自 Elder Service，不再混入 shared workflow 快照。" badge={<Tag variant="info">Service Boundary</Tag>}>
              <div className="ledger-metric-grid">
                {[
                  { title: 'Elder Service', value: records.length, description: '老人主档、房间与护理等级来自真实数据库' },
                  { title: '筛选条件', value: `${statusFilter || '全部'} / ${levelFilter || '全部'}`, description: '状态与护理等级在实时主档上筛选' },
                  { title: '详情跳转', value: total, description: '当前筛选结果仍可进入长者详情页继续核对' },
                  { title: '人脸状态', value: '待接通', description: '不再从本地 workflow 读人脸状态，避免假数据回流' },
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

            <DataCard title="老人台账列表" subtitle="筛选、分页、详情跳转和人脸快捷入口统一留在主列表区。">
              <div style={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}>
                {error ? (
                  <div style={{ padding: 16, borderBottom: '1px solid var(--color-border)', color: 'var(--color-danger)', fontSize: 13 }}>
                    实时主档读取失败：{error}
                  </div>
                ) : null}
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
                        <th>联系人</th>
                        <th>建档时间</th>
                        <th style={{ textAlign: 'right' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.length === 0 ? null : paged.map(e => (
                        <tr key={e.id} className="table-hover-row">
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
                          <td><span className="text-sm">{e.genderLabel}</span></td>
                          <td><span className="text-sm">{e.age}岁</span></td>
                          <td><Tag variant={LEVEL_TAG[e.careLevelLabel] ?? 'neutral'}>{e.careLevelLabel}</Tag></td>
                          <td><Tag variant={STATUS_TAG[e.statusLabel] ?? 'neutral'}>{e.statusLabel}</Tag></td>
                          <td><Tag variant="neutral">待接通</Tag></td>
                          <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{e.roomNumber}</span></td>
                          <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{e.familyContactName}</span></td>
                          <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{e.admissionCreatedAtLabel}</span></td>
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
                {paged.length === 0 && !loading && (
                  <EmptyState variant="search" title={sceneMeta.emptyTitle} description={sceneMeta.emptyDescription} />
                )}
                {loading && records.length === 0 ? (
                  <div style={{ padding: 24, fontSize: 13, color: 'var(--color-muted)' }}>正在同步 Elder Service 实时主档...</div>
                ) : null}
                <Pagination current={page} total={total} pageSize={pageSize} onChange={setPage} />
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="台账上下文" subtitle="后置区只保留治理边界与未接通说明。" badge={<Tag variant="info">Ledger Context</Tag>}>
              <div className="home-context-stack">
                <div className="home-context-item">
                  <div className="home-context-title">当前视角</div>
                  <div className="home-context-description">{scene === 'home' ? '当前是 live 主档视角，居家专属细分字段仍待后端继续补齐。' : scene === 'institutional' ? '当前优先看院内在住、待入住与高照护对象。' : '当前是通用老人台账视角，优先看实时主档与详情入口。'}</div>
                </div>
                <div className="home-context-item">
                  <div className="home-context-title">人脸闭环</div>
                  <div className="home-context-description">人脸服务尚未完成真实接口接入，本页仅保留跳转入口，避免继续展示本地 mock 状态。</div>
                </div>
                <div className="home-context-item">
                  <div className="home-context-title">验证信号</div>
                  <div className="home-context-description">健康信号以列表总数、筛选结果、详情跳转和建档时间一致性为准，不再看 shared workflow 是否同步。</div>
                </div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整说明后置到帮助页"
              summary="老人列表首屏现在只保留台账总览、治理闭环和主列表；说明性上下文统一放到后置区和帮助页。"
              items={[
                '先看实时主档总量、待入住和高照护人数。',
                '再用筛选和分页进入主列表处理。',
                '人脸状态尚未接通时，不再从本地 store 读取假数据。',
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
