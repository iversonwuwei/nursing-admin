'use client'

import { DataCard, PageHeader, StatCard, Tag } from '@/components/nh'
import { buildAiAssistantHref } from '@/lib/ai-context'
import { getOrganizationBedAiInsight, getOrganizationDetailAiInsight, getOrganizationStaffAiInsight } from '@/lib/mock/admin-ai'
import {
  activateOrganizationDraft,
  findLiveOrganizationById,
  getMasterDataSnapshot,
  getOrganizationStaffRecords,
  subscribeMasterDataWorkflow,
} from '@/lib/mock/master-data-workflow'
import { ArrowLeft, Bed, Bot, Building2, Edit, Star, Users } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo, useState, useSyncExternalStore } from 'react'

const TABS = [
  { id: 'overview', label: '机构概览' },
  { id: 'beds', label: '床位管理' },
  { id: 'staff', label: '员工管理' },
]

export default function OrgDetailPage() {
  const params = useParams()
  const id = params.id as string
  const snapshot = useSyncExternalStore(
    subscribeMasterDataWorkflow,
    getMasterDataSnapshot,
    getMasterDataSnapshot,
  )
  const [activeTab, setActiveTab] = useState('overview')
  const orgRecord = useMemo(
    () => findLiveOrganizationById(id, snapshot) ?? snapshot.organizations[0],
    [id, snapshot],
  )
  const staffData = useMemo(() => getOrganizationStaffRecords(orgRecord.id), [orgRecord.id])
  const bedData = useMemo(() => {
    const rooms = snapshot.rooms.filter(room => room.organizationId === orgRecord.id)
    return rooms.flatMap(room => room.bedsInfo.map((bed, index) => ({
      id: `${room.id}-${index + 1}`,
      room: `${room.id}-${index + 1}`,
      status: bed.status === 'occupied' ? 'occupied' : bed.status === 'maintenance' ? 'reserved' : 'available',
    })))
  }, [orgRecord.id, snapshot.rooms])
  const occupancy = orgRecord.totalBeds > 0 ? Math.round((orgRecord.occupiedBeds / orgRecord.totalBeds) * 100) : 0
  const orgData = {
    id: orgRecord.id,
    name: orgRecord.name,
    address: orgRecord.address,
    phone: orgRecord.phone,
    beds: orgRecord.totalBeds,
    occupied: orgRecord.occupiedBeds,
    staff: orgRecord.staffCount,
    manager: orgRecord.manager,
    established: orgRecord.establishedDate,
    area: orgRecord.description,
  }
  const aiInsight = getOrganizationDetailAiInsight(orgData)
  const reservedBeds = bedData.filter(item => item.status === 'reserved').length
  const availableBeds = bedData.filter(item => item.status === 'available').length
  const occupiedBeds = bedData.filter(item => item.status === 'occupied').length
  const bedAiInsight = getOrganizationBedAiInsight({
    name: orgData.name,
    occupied: occupiedBeds,
    reserved: reservedBeds,
    available: availableBeds,
  })
  const staffAiInsight = getOrganizationStaffAiInsight(staffData.map(item => ({ name: item.name, role: item.role, status: item.status })))
  const buildAiHref = (focus: string, target: 'inference' | 'rules' | 'logs' = 'inference') => buildAiAssistantHref({
    source: focus === 'staff-roster' ? 'organization-staff' : 'organization-detail',
    entityId: orgData.id,
    entityName: orgData.name,
    focus,
    target,
  })

  return (
    <div className="animate-fade-up">

      <PageHeader
        title={orgData.name}
        subtitle={`机构编号: ${orgData.id}`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/organizations" className="btn btn-secondary btn-sm">
              <ArrowLeft size={13} />返回
            </Link>
            {orgRecord.lifecycleStatus === '待启用' ? (
              <button className="btn btn-primary btn-sm" onClick={() => activateOrganizationDraft(orgRecord.id)}>
                <Edit size={13} />启用机构
              </button>
            ) : (
                <button className="btn btn-primary btn-sm">
                  <Edit size={13} />编辑
                </button>
            )}
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        <StatCard icon={<Bed size={18} />} label="床位总数" value={orgData.beds} sub="总床位数" color="info" />
        <StatCard icon={<Users size={18} />} label="入住人数" value={orgData.occupied} sub="当前入住" color="success" />
        <StatCard icon={<Users size={18} />} label="入住率" value={`${occupancy}%`} sub={`空床 ${Math.max(0, orgData.beds - orgData.occupied)} 个`} color={occupancy >= 90 ? 'danger' : occupancy >= 70 ? 'warning' : 'success'} />
        <StatCard icon={<Building2 size={18} />} label="员工数" value={orgData.staff} sub={orgRecord.lifecycleStatus === '待启用' ? '启用后补录' : '在职员工'} color="primary" />
      </div>

      <div style={{ marginTop: 16 }}>
        <DataCard title="机构状态" subtitle="新建机构先进入待启用，再计入经营口径。" badge={<Tag variant={orgRecord.lifecycleStatus === '待启用' ? 'warning' : 'success'}>{orgRecord.lifecycleStatus}</Tag>}>
          <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
            当前状态为 {orgRecord.status}。{orgRecord.activationNote ? `最近说明：${orgRecord.activationNote}` : '尚未记录额外说明。'}
          </div>
        </DataCard>
      </div>

      <DataCard
        icon={<Bot size={16} />}
        title={aiInsight.title}
        subtitle="把机构负荷、人员配置和空床承接转成管理动作。"
        badge={<Tag variant="primary">Org AI</Tag>}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
            {aiInsight.summary}
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {aiInsight.actions.map(action => (
              <div key={action} style={{ borderRadius: 10, border: '1px solid var(--color-border)', padding: '10px 12px', fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>
                {action}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>置信度 {aiInsight.confidence}%</div>
            <Link href={buildAiHref('overview-risk', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
          </div>
        </div>
      </DataCard>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--color-border)' }}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              padding: '10px 16px', fontSize: 13, fontWeight: activeTab === id ? 600 : 450,
              color: activeTab === id ? 'var(--color-primary)' : 'var(--color-muted)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              borderBottom: activeTab === id ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: -1, transition: 'all 150ms ease',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'start' }}>
          <DataCard
            icon={<Building2 size={16} />}
            title="基本信息"
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: '机构名称', value: orgData.name },
                { label: '机构编号', value: orgData.id },
                { label: '地址', value: orgData.address },
                { label: '联系电话', value: orgData.phone },
                { label: '成立日期', value: orgData.established },
                { label: '机构说明', value: orgData.area },
                { label: '负责人', value: orgData.manager },
              ].map(item => (
                <div key={item.label}>
                  <div className="text-xs" style={{ color: 'var(--color-muted)', marginBottom: 2 }}>{item.label}</div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </DataCard>

          <DataCard
            icon={<Star size={16} />}
            title="运营数据"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: '床位总数', value: `${orgData.beds} 床`, color: 'info' },
                { label: '入住人数', value: `${orgData.occupied} 人`, color: 'success' },
                { label: '员工数量', value: `${orgData.staff} 人`, color: 'primary' },
                { label: '入住率', value: `${occupancy}%`, color: occupancy >= 90 ? 'danger' : occupancy >= 70 ? 'warning' : 'success' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="text-sm" style={{ color: 'var(--color-muted)' }}>{s.label}</span>
                  <span className="font-bold" style={{ color: `var(--color-${s.color === 'info' ? 'info' : s.color === 'success' ? 'success' : s.color === 'primary' ? 'primary' : s.color})` }}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </DataCard>
        </div>
      )}

      {/* Beds */}
      {activeTab === 'beds' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <DataCard icon={<Bot size={16} />} title={bedAiInsight.title} subtitle="把床位状态从表格转换成可执行的承接与周转动作。" badge={<Tag variant="warning">床位主管确认</Tag>}>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
                {bedAiInsight.summary}
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {bedAiInsight.actions.map(action => (
                  <div key={action} style={{ borderRadius: 10, border: '1px solid var(--color-border)', padding: '10px 12px', fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>
                    {action}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>置信度 {bedAiInsight.confidence}%</div>
                <Link href={buildAiHref('bed-turnover', 'inference')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
              </div>
            </div>
          </DataCard>

          <DataCard icon={<Bed size={16} />} title="床位管理">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>房间号</th><th>状态</th></tr>
                </thead>
                <tbody>
                  {bedData.map(bed => (
                    <tr key={bed.id}>
                      <td><span className="font-semibold text-sm" style={{ fontFamily: 'monospace' }}>{bed.room}</span></td>
                      <td>
                        <Tag variant={bed.status === 'occupied' ? 'success' : bed.status === 'reserved' ? 'warning' : 'neutral'}>
                          {bed.status === 'occupied' ? '已入住' : bed.status === 'reserved' ? '预留' : '可用'}
                        </Tag>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DataCard>
        </div>
      )}

      {/* Staff */}
      {activeTab === 'staff' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <DataCard icon={<Bot size={16} />} title={staffAiInsight.title} subtitle="把员工名册转换成可跟进的组织动作，而不是停留在列表展示。" badge={<Tag variant="warning">人员配置追踪</Tag>}>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
                {staffAiInsight.summary}
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {staffAiInsight.actions.map(action => (
                  <div key={action} style={{ borderRadius: 10, border: '1px solid var(--color-border)', padding: '10px 12px', fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>
                    {action}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>置信度 {staffAiInsight.confidence}%</div>
                <Link href={buildAiHref('staff-roster', 'logs')} className="btn btn-secondary btn-sm">进入 AI 运营中心</Link>
              </div>
            </div>
          </DataCard>

          <DataCard icon={<Users size={16} />} title="员工管理">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>姓名</th><th>职位</th><th>部门</th><th>联系电话</th><th>状态</th></tr>
                </thead>
                <tbody>
                  {staffData.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar avatar-sm" style={{ background: 'rgba(13,148,136,0.1)', color: 'var(--color-primary)' }}>
                            {s.name.slice(0, 1)}
                          </div>
                          <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{s.name}</span>
                        </div>
                      </td>
                      <td><span className="text-sm">{s.role}</span></td>
                      <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{s.department}</span></td>
                      <td><span className="text-sm" style={{ fontFamily: 'monospace', fontSize: 12 }}>{s.phone}</span></td>
                      <td><Tag variant="success">{s.status}</Tag></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DataCard>
        </div>
      )}

    </div>
  )
}
