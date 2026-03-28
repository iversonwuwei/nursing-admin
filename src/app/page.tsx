"use client";

import { elderlyList } from '@/lib/data/elderly';
import { organizations } from '@/lib/data/organizations';
import { equipmentList, equipmentAlarms } from '@/lib/data/equipment';

const totalBeds = organizations.reduce((s, o) => s + o.totalBeds, 0);
const occupiedBeds = organizations.reduce((s, o) => s + o.occupiedBeds, 0);
const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
const normalDevices = equipmentList.filter(e => e.status === '正常').length;
const pendingAlarms = equipmentAlarms.filter(a => a.status === '待处理').slice(0, 5);

const recentElderly = [...elderlyList]
  .sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime())
  .slice(0, 6);

const NURSING_BADGE: Record<string, { bg: string; text: string }> = {
  '特级护理': { bg: '#FEE2E2', text: '#DC2626' },
  '全护理':   { bg: '#EDE9FE', text: '#7C3AED' },
  '半自理':   { bg: '#FEF3C7', text: '#D97706' },
  '自理':     { bg: '#F3F4F6', text: '#6B7280' },
};

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  '入住':   { bg: '#D1FAE5', text: '#059669' },
  '待入住': { bg: '#FEF3C7', text: '#D97706' },
  '离院':   { bg: '#F3F4F6', text: '#6B7280' },
};

// 护理等级图标
const CARE_ICONS: Record<string, string> = {
  '特级护理': '🆘',
  '全护理':   '💜',
  '半自理':   '💛',
  '自理':     '💚',
};

// 状态图标
const STATUS_ICONS: Record<string, string> = {
  '入住':   '✓',
  '待入住': '⏳',
  '离院':   '○',
};

function MiniArrow({ up }: { up: boolean }) {
  return up ? (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ) : (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

// 环形进度条组件
function CircularProgress({ value, size = 60, strokeWidth = 6, color = '#7C3AED' }: { 
  value: number; 
  size?: number; 
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          className="text-gray-100"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>{value}%</span>
      </div>
    </div>
  );
}

// 现代统计卡片
function ModernStatCard({ 
  label, 
  value, 
  sub, 
  trend, 
  up, 
  icon,
  gradient,
  accentColor,
}: { 
  label: string; 
  value: string | number; 
  sub: string;
  trend: string;
  up: boolean;
  icon: React.ReactNode;
  gradient: string;
  accentColor: string;
}) {
  return (
    <div className="modern-stat-card group" style={{ '--accent-color': accentColor, '--accent-color-end': accentColor } as React.CSSProperties}>
      <div 
        className="stat-icon"
        style={{ 
          background: `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}08 100%)`,
          color: accentColor,
        }}
      >
        {icon}
      </div>
      <div className="modern-stat-label">{label}</div>
      <div className="modern-stat-value gradient-text-warm">{value}</div>
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: '#9CA3AF' }}>{sub}</span>
        <span className={`modern-stat-trend ${up ? 'trend-up' : trend === '0' ? 'trend-neutral' : 'trend-down'}`}>
          <MiniArrow up={up} /> {trend}
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const statValues = [
    elderlyList.filter(e => e.status === '入住').length,
    `${occupancyRate}%`,
    normalDevices,
    pendingAlarms.length,
  ];

  const today = new Date();

  return (
    <div className="space-y-6 animate-fade-up">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
            数据概览
          </h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
            实时更新 · {today.toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer glass-card hover:shadow-lg border-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          导出报告
        </button>
      </div>

      {/* Stat cards - Modern Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ModernStatCard
          label="在院老人"
          value={statValues[0]}
          sub={`共 ${elderlyList.length} 人登记`}
          trend="+2"
          up={true}
          icon={<span>👴</span>}
          accentColor="#7C3AED"
          gradient="gradient-primary"
        />
        <ModernStatCard
          label="入住率"
          value={statValues[1]}
          sub={`已用 ${occupiedBeds} / ${totalBeds} 床`}
          trend="+3%"
          up={true}
          icon={<span>🏠</span>}
          accentColor="#06B6D4"
          gradient="gradient-secondary"
        />
        <ModernStatCard
          label="设备正常"
          value={statValues[2]}
          sub={`共 ${equipmentList.length} 台设备`}
          trend="0"
          up={true}
          icon={<span>⚡</span>}
          accentColor="#10B77F"
          gradient="gradient-success"
        />
        <ModernStatCard
          label="待处理告警"
          value={statValues[3]}
          sub={`${equipmentList.filter(e => e.status === '维修中').length} 台维护中`}
          trend="-1"
          up={false}
          icon={<span>🚨</span>}
          accentColor="#EF4444"
          gradient="gradient-danger"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: Recent entries - Modern Card List */}
        <div className="lg:col-span-2 modern-card">
          <div className="px-5 pt-5 pb-4 border-b border-gray-100/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7C3AED15 0%, #7C3AED08 100%)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold" style={{ color: 'hsl(var(--foreground))' }}>最近入住</h2>
                <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>共 {elderlyList.length} 位老人登记在册</p>
              </div>
            </div>
            <a href="/elderly" className="text-sm font-medium px-3 py-1.5 rounded-lg transition-all hover:bg-gray-100" style={{ color: '#7C3AED' }}>
              查看全部 →
            </a>
          </div>
          <div className="p-3">
            {recentElderly.map((e, idx) => (
              <div 
                key={e.id} 
                className="modern-list-item"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Avatar */}
                <div 
                  className="w-11 h-11 rounded-xl flex items-center justify-center font-semibold text-sm shadow-sm"
                  style={{ 
                    background: `linear-gradient(135deg, ${NURSING_BADGE[e.careLevel]?.bg || '#F3F4F6'} 0%, ${NURSING_BADGE[e.careLevel]?.text || '#6B7280'}20 100%)`,
                    color: NURSING_BADGE[e.careLevel]?.text || '#6B7280',
                  }}
                >
                  {e.name.slice(0, 1)}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>{e.name}</span>
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{e.roomNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span 
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                      style={{
                        background: NURSING_BADGE[e.careLevel]?.bg ?? '#F3F4F6',
                        color: NURSING_BADGE[e.careLevel]?.text ?? '#6B7280',
                      }}
                    >
                      {CARE_ICONS[e.careLevel]} {e.careLevel}
                    </span>
                    <span 
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                      style={{
                        background: STATUS_BADGE[e.status]?.bg ?? '#F3F4F6',
                        color: STATUS_BADGE[e.status]?.text ?? '#6B7280',
                      }}
                    >
                      {STATUS_ICONS[e.status]} {e.status}
                    </span>
                  </div>
                </div>
                
                {/* Date */}
                <div className="text-right">
                  <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {new Date(e.checkInDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: alarms + orgs */}
        <div className="flex flex-col gap-5">

          {/* Alarms - Modern Alert Card */}
          <div className="modern-card">
            <div className="px-5 pt-5 pb-4 border-b border-gray-100/80">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ 
                    background: pendingAlarms.length > 0 
                      ? 'linear-gradient(135deg, #EF444415 0%, #EF444408 100%)' 
                      : 'linear-gradient(135deg, #10B77F15 0%, #10B77F08 100%)'
                  }}
                >
                  <span style={{ color: pendingAlarms.length > 0 ? '#EF4444' : '#10B77F' }}>
                    <WarnIcon />
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold" style={{ color: 'hsl(var(--foreground))' }}>设备告警</h2>
                    {pendingAlarms.length > 0 && (
                      <span 
                        className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)' }}
                      >
                        {pendingAlarms.length}
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {pendingAlarms.length > 0 ? '需要及时处理' : '所有设备运行正常'}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {pendingAlarms.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10B77F15 0%, #10B77F08 100%)' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B77F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium" style={{ color: '#10B77F' }}>暂无待处理告警</p>
                  <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>所有设备运行正常</p>
                </div>
              ) : pendingAlarms.map(alarm => (
                <div 
                  key={alarm.id} 
                  className="p-3 rounded-xl border transition-all hover:shadow-md cursor-pointer"
                  style={{ 
                    background: 'linear-gradient(135deg, #FEF2F2 0%, #FEF2F280 100%)',
                    borderColor: alarm.type === '故障' || alarm.type === '异常' ? '#FEE2E2' : '#FEF3C7',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>{alarm.equipmentName}</span>
                      </div>
                      <div className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{alarm.message}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span 
                        className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                        style={{ 
                          background: alarm.type === '故障' || alarm.type === '异常' 
                            ? 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)' 
                            : 'linear-gradient(135deg, #F59F0A 0%, #FCD34D 100%)'
                        }}
                      >
                        {alarm.type}
                      </span>
                      <span className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{alarm.createdAt}</span>
                    </div>
                  </div>
                </div>
              ))}
              {pendingAlarms.length > 0 && (
                <a href="/equipment" className="text-center text-sm font-medium py-2 rounded-lg transition-all hover:bg-gray-100" style={{ color: '#7C3AED' }}>
                  查看全部告警 →
                </a>
              )}
            </div>
          </div>

          {/* Orgs - Modern Occupancy Card */}
          <div className="modern-card">
            <div className="px-5 pt-5 pb-4 border-b border-gray-100/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #06B6D415 0%, #06B6D408 100%)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold" style={{ color: 'hsl(var(--foreground))' }}>机构入住率</h2>
                  <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>实时床位使用情况</p>
                </div>
              </div>
            </div>
            <div className="p-4 flex flex-col gap-4">
              {organizations.slice(0, 4).map(org => {
                const rate = org.totalBeds > 0 ? Math.round((org.occupiedBeds / org.totalBeds) * 100) : 0;
                const barColor = rate >= 90 ? '#EF4444' : rate >= 70 ? '#F59F0A' : '#10B77F';
                return (
                  <div key={org.id} className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>{org.name}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${rate}%`, background: `linear-gradient(90deg, ${barColor} 0%, ${barColor}CC 100%)` }} 
                          />
                        </div>
                        <span className="text-xs font-bold w-10 text-right" style={{ color: barColor }}>{rate}%</span>
                      </div>
                      <div className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {org.occupiedBeds}/{org.totalBeds} 床
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center py-4">
        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          最后更新: {today.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} · 数据来源: 养老院管理系统 v2.0
        </p>
      </div>
    </div>
  );
}
