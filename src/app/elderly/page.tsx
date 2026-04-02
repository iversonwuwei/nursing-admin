'use client'

import { DataCard, EmptyState, FilterBar, FilterItem, PageHeader, Pagination, StatCard, Tag, type TagVariant } from '@/components/nh'
import { getAdmissionApplicationsSnapshot, subscribeAdmissionWorkflow } from '@/lib/mock/admission-workflow'
import { buildLiveElderlyList } from '@/lib/mock/elderly-registry'
import { findFaceEnrollmentRecordByElderlyId, getFaceEnrollmentSnapshot, subscribeFaceEnrollmentWorkflow, type FaceEnrollmentStatus } from '@/lib/mock/face-enrollment-workflow'
import { ChevronRight, FileUp, Home, UserPlus as NewUser, Plus, ScanFace, Search, UserCheck, UserPlus, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useSyncExternalStore } from 'react'

const LEVEL_TAG: Record<string, TagVariant> = {
  '特级护理': 'danger', '全护理': 'warning', '半自理': 'info', '自理': 'success',
}
const STATUS_TAG: Record<string, TagVariant> = {
  '入住': 'success', '待入住': 'warning', '离院': 'neutral',
}
const FACE_STATUS_TAG: Record<FaceEnrollmentStatus, TagVariant> = {
  '待录入': 'neutral',
  '采集中': 'warning',
  '待确认': 'info',
  '已生效': 'success',
  '需重录': 'danger',
}

export default function ElderlyPage() {
  const router = useRouter()
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
    if (search && !e.name.includes(search) && !e.id.includes(search)) return false
    if (statusFilter && e.status !== statusFilter) return false
    if (levelFilter && e.careLevel !== levelFilter) return false
    return true
  })

  const total = filtered.length
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  // Top stats
  const totalBeds = 360
  const occupiedBeds = liveElderlyList.filter(e => e.status === '入住').length
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
  const critical = liveElderlyList.filter(e => e.careLevel === '特级护理').length
  const newThisMonth = applications.filter(item => item.createdAt.startsWith(currentMonth)).length

  return (
    <div className="animate-fade-up">

      <PageHeader
        title="老人列表"
        subtitle={`共 ${liveElderlyList.length} 位老人登记在册 · ${pendingConfirmation + planGenerated} 位处于新建闭环中`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/elderly/face?entry=elderly-list" className="btn btn-secondary btn-sm">
              <ScanFace size={13} />人脸录入
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

      {/* Top Stats Row */}
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard
          icon={<Home size={18} />}
          label="入住率"
          value={`${occupancyRate}%`}
          sub={`${occupiedBeds}/${totalBeds} 床`}
          color="primary"
        />
        <StatCard
          icon={<Users size={18} />}
          label="登记总数"
          value={liveElderlyList.length}
          color="success"
        />
        <StatCard
          icon={<UserCheck size={18} />}
          label="特护人数"
          value={critical}
          sub="需重点关注"
          color="danger"
        />
        <StatCard
          icon={<NewUser size={18} />}
          label="本月新入住"
          value={newThisMonth}
          sub="本月新增"
          trend={{ value: '+1', direction: 'up' }}
          color="info"
        />
      </div>

      <DataCard
        title="新建数据闭环"
        subtitle="老人创建与资料导入共用同一条治理链路：先形成结构化草稿，再进入审核、计划和在住管理。"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { title: '新建录入', value: applications.length, description: '录入后写入共享 workflow store' },
            { title: '资料导入', value: applications.filter(item => item.sourceType === 'document-import').length, description: '来自证件/病历资料识别' },
            { title: '待人工确认', value: pendingConfirmation, description: '等待护理主管确认最终级别' },
            { title: '计划已生成', value: planGenerated, description: '已同步任务页与提醒中心' },
          ].map(item => (
            <div key={item.title} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 14, background: 'var(--color-card)' }}>
              <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{item.title}</div>
              <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: 'var(--color-text)' }}>{item.value}</div>
              <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.description}</div>
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
                      <div className="avatar avatar-sm" style={{ background: 'rgba(13,148,136,0.1)', color: 'var(--color-primary)' }}>
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
          <EmptyState variant="search" title="暂无数据" description="调整筛选条件试试" />
        )}
        <Pagination current={page} total={total} pageSize={pageSize} onChange={setPage} />
      </div>

    </div>
  )
}
