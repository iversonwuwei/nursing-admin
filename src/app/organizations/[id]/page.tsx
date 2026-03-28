'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Users,
  Bed,
  Edit,
  User,
  Star,
} from 'lucide-react';

const orgData = {
  id: '1',
  name: '静安分院',
  address: '上海市静安区静安寺路100号',
  phone: '021-62880001',
  beds: 80,
  occupied: 76,
  staff: 28,
  manager: '张主任',
  established: '2018-06-01',
  area: '3000㎡',
};

const staffData = [
  { id: '1', name: '张主任', role: '院长', gender: '女', age: 45, phone: '13800001001', status: '在职' },
  { id: '2', name: '李医生', role: '主治医师', gender: '男', age: 38, phone: '13800001002', status: '在职' },
  { id: '3', name: '王护士', role: '护士长', gender: '女', age: 32, phone: '13800001003', status: '在职' },
  { id: '4', name: '赵护理', role: '护理员', gender: '女', age: 28, phone: '13800001004', status: '在职' },
  { id: '5', name: '钱后勤', role: '后勤主管', gender: '男', age: 42, phone: '13800001005', status: '在职' },
];

const bedData = Array.from({ length: 12 }, (_, i) => ({
  id: `${i + 1}`,
  room: `${Math.floor(i / 4) + 1}号楼-${String(i % 4 + 1).padStart(3, '0')}`,
  status: i < 9 ? 'occupied' : i < 10 ? 'reserved' : 'available',
}));

const tabs = [
  { id: 'overview', label: '机构概览' },
  { id: 'beds', label: '床位管理' },
  { id: 'staff', label: '员工管理' },
];

export default function OrgDetailPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const occupancy = Math.round((orgData.occupied / orgData.beds) * 100);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/organizations"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border text-muted-foreground
                       hover:bg-accent transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{orgData.name}</h1>
              <p className="text-sm text-muted-foreground">机构编号: {orgData.id}</p>
            </div>
          </div>
        </div>
        <button className="inline-flex items-center gap-1.5 h-8 px-3 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors cursor-pointer">
          <Edit className="w-3.5 h-3.5" />
          编辑
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer
                         ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-3 gap-5">
          {/* Info Card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3 col-span-2">
            <h3 className="text-sm font-semibold text-foreground">基本信息</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">地址</p>
                  <p className="text-foreground">{orgData.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">联系电话</p>
                  <p className="text-foreground">{orgData.phone}</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">成立日期</p>
                <p className="text-foreground">{orgData.established}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">占地面积</p>
                <p className="text-foreground">{orgData.area}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">负责人</p>
                <p className="text-foreground">{orgData.manager}</p>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">运营数据</h3>
            <div className="space-y-3">
              {[
                { label: '床位总数', value: orgData.beds, icon: <Bed className="w-4 h-4" />, colorClass: 'bg-purple-500 text-white' },
                { label: '入住人数', value: orgData.occupied, icon: <Users className="w-4 h-4" />, colorClass: 'bg-emerald-500 text-white' },
                { label: '员工数量', value: orgData.staff, icon: <User className="w-4 h-4" />, colorClass: 'bg-gray-100 text-gray-500' },
                { label: '入住率', value: `${occupancy}%`, icon: <Star className="w-4 h-4" />, colorClass: 'bg-amber-500 text-white' },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center ${s.colorClass}`}>
                      {s.icon}
                    </div>
                    <span className="text-sm text-muted-foreground">{s.label}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Beds Tab */}
      {activeTab === 'beds' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">房间号</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">状态</th>
              </tr>
            </thead>
            <tbody>
              {bedData.map((bed) => (
                <tr key={bed.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-foreground">{bed.room}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${
                      bed.status === 'occupied' ? 'bg-emerald-50 text-emerald-600' :
                      bed.status === 'reserved' ? 'bg-amber-50 text-amber-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {bed.status === 'occupied' ? '已入住' : bed.status === 'reserved' ? '预留' : '可用'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Staff Tab */}
      {activeTab === 'staff' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">姓名</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">职位</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">性别</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">年龄</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">联系电话</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">状态</th>
              </tr>
            </thead>
            <tbody>
              {staffData.map((s) => (
                <tr key={s.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.role}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.gender}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.age}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{s.phone}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-600">
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
