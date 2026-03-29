'use client'

import { useState } from 'react'
import Link from 'next/link'
import { StatCard, Tag, PageHeader, DataCard } from '@/components/nh'
import { Building2, MapPin, Phone, Bed, Users, Edit, ChevronRight, ArrowLeft, Star } from 'lucide-react'

const orgData = {
  id: '1', name: '静安分院', address: '上海市静安区静安寺路100号',
  phone: '021-62880001', beds: 80, occupied: 76, staff: 28,
  manager: '张主任', established: '2018-06-01', area: '3000㎡',
}
const staffData = [
  { id: '1', name: '张主任', role: '院长', gender: '女', age: 45, phone: '13800001001', status: '在职' },
  { id: '2', name: '李医生', role: '主治医师', gender: '男', age: 38, phone: '13800001002', status: '在职' },
  { id: '3', name: '王护士', role: '护士长', gender: '女', age: 32, phone: '13800001003', status: '在职' },
  { id: '4', name: '赵护理', role: '护理员', gender: '女', age: 28, phone: '13800001004', status: '在职' },
  { id: '5', name: '钱后勤', role: '后勤主管', gender: '男', age: 42, phone: '13800001005', status: '在职' },
]
const bedData = Array.from({ length: 12 }, (_, i) => ({
  id: `${i + 1}`,
  room: `${Math.floor(i / 4) + 1}号楼-${String((i % 4) + 1).padStart(3, '0')}`,
  status: i < 9 ? 'occupied' : i < 10 ? 'reserved' : 'available',
}))

const TABS = [
  { id: 'overview', label: '机构概览' },
  { id: 'beds', label: '床位管理' },
  { id: 'staff', label: '员工管理' },
]

export default function OrgDetailPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const occupancy = Math.round((orgData.occupied / orgData.beds) * 100)

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
            <button className="btn btn-primary btn-sm">
              <Edit size={13} />编辑
            </button>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        <StatCard icon={<Bed size={18} />} label="床位总数" value={orgData.beds} sub="总床位数" color="info" />
        <StatCard icon={<Users size={18} />} label="入住人数" value={orgData.occupied} sub="当前入住" color="success" />
        <StatCard icon={<Users size={18} />} label="入住率" value={`${occupancy}%`} sub={`空床 ${orgData.beds - orgData.occupied} 个`} color={occupancy >= 90 ? 'danger' : occupancy >= 70 ? 'warning' : 'success'} />
        <StatCard icon={<Building2 size={18} />} label="员工数" value={orgData.staff} sub="在职员工" color="primary" />
      </div>

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
                { label: '占地面积', value: orgData.area },
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
      )}

      {/* Staff */}
      {activeTab === 'staff' && (
        <DataCard icon={<Users size={16} />} title="员工管理">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>姓名</th><th>职位</th><th>性别</th><th>年龄</th><th>联系电话</th><th>状态</th></tr>
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
                    <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{s.gender}</span></td>
                    <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{s.age}岁</span></td>
                    <td><span className="text-sm" style={{ fontFamily: 'monospace', fontSize: 12 }}>{s.phone}</span></td>
                    <td><Tag variant="success">{s.status}</Tag></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataCard>
      )}

    </div>
  )
}
