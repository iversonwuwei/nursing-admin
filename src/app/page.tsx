'use client'

import { DataCard, PageHeader, StatCard, Tag, WorkflowOverviewCard, type TagVariant } from '@/components/nh'
import { elderlyList, equipmentAlarms, organizations } from '@/lib/data'
import { getAiDashboardActions, getAiDashboardInsights } from '@/lib/mock/admin-ai'
import { getAdmissionApplicationsSnapshot, subscribeAdmissionWorkflow } from '@/lib/mock/admission-workflow'
import {
  Activity,
  AlertTriangle, Bell,
  Bot,
  CalendarHeart,
  ChevronRight,
  ClipboardList,
  DollarSign,
  DoorOpen,
  Download,
  Droplets,
  Heart,
  Home,
  Stethoscope,
  Thermometer,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSyncExternalStore } from 'react'

// ─── Mock Data ───────────────────────────────────────────────────────────────

const todayTasks = [
  { id: 'T001', elderly: '张秀英', room: '101', type: '用药提醒', time: '08:00', status: '已完成', nurse: '李护士' },
  { id: 'T002', elderly: '王建国', room: '203', type: '血压测量', time: '08:30', status: '进行中', nurse: '王护士' },
  { id: 'T003', elderly: '李淑芳', room: '301', type: '翻身护理', time: '09:00', status: '待执行', nurse: '张护士' },
  { id: 'T004', elderly: '赵德明', room: '405', type: '康复训练', time: '10:00', status: '待执行', nurse: '李护士' },
  { id: 'T005', elderly: '张秀英', room: '101', type: '午餐协助', time: '11:30', status: '待执行', nurse: '王护士' },
  { id: 'T006', elderly: '王建国', room: '203', type: '下午茶', time: '15:00', status: '待执行', nurse: '张护士' },
]

const TASK_STATUS_TAG: Record<string, TagVariant> = {
  '已完成': 'success', '进行中': 'warning', '待执行': 'neutral',
}

const TASK_STATUS_WEIGHT: Record<string, number> = {
  '待执行': 3,
  '进行中': 2,
  '已完成': 1,
}

const weeklyServiceData = [
  { day: '周一', count: 42 },
  { day: '周二', count: 58 },
  { day: '周三', count: 51 },
  { day: '周四', count: 63 },
  { day: '周五', count: 55 },
  { day: '周六', count: 38 },
  { day: '周日', count: 29 },
]

const healthBrief = [
  { id: 'E001', name: '张秀英', room: '101', temp: 36.5, bp: '145/88', hr: 72, trend: 'up' as const },
  { id: 'E002', name: '王建国', room: '203', temp: 36.6, bp: '130/82', hr: 68, trend: 'stable' as const },
  { id: 'E003', name: '李淑芳', room: '301', temp: 36.8, bp: '155/92', hr: 78, trend: 'up' as const },
]

const quickLinks = [
  { icon: <CalendarHeart size={18} />, label: '活动管理', href: '/activities' },
  { icon: <DoorOpen size={18} />, label: '房间管理', href: '/rooms' },
  { icon: <Users size={18} />, label: '员工列表', href: '/staff' },
  { icon: <AlertTriangle size={18} />, label: '事故报告', href: '/incidents' },
  { icon: <DollarSign size={18} />, label: '财务收支', href: '/financial' },
  { icon: <Stethoscope size={18} />, label: '医疗设备', href: '/devices' },
]

// ─── Derived Stats ───────────────────────────────────────────────────────────

const totalBeds = organizations.reduce((s, o) => s + o.totalBeds, 0)
const occupiedBeds = organizations.reduce((s, o) => s + o.occupiedBeds, 0)
const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
const inHospital = elderlyList.filter(e => e.status === '入住').length
const pendingAlarms = equipmentAlarms.filter(a => a.status === '待处理').length
const pendingTasks = todayTasks.filter(t => t.status !== '已完成').length

const maxService = Math.max(...weeklyServiceData.map(d => d.count))

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const applications = useSyncExternalStore(
    subscribeAdmissionWorkflow,
    getAdmissionApplicationsSnapshot,
    getAdmissionApplicationsSnapshot,
  )
  const today = new Date()
  const dateStr = today.toLocaleDateString('zh-CN', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
  const aiInsights = getAiDashboardInsights(applications)
  const aiActions = getAiDashboardActions(applications)
  const pendingConfirmations = applications.filter(item => item.status === '待人工确认').length
  const prioritizedTasks = [...todayTasks].sort((left, right) => TASK_STATUS_WEIGHT[right.status] - TASK_STATUS_WEIGHT[left.status])

  return (
    <div className="animate-fade-up">

      {/* Page Header */}
      <PageHeader
        title="欢迎回来"
        subtitle={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className="status-dot success" />
            {dateStr} · 所有系统运行正常
          </span>
        }
        actions={
          <button className="btn btn-secondary btn-sm">
            <Download size={13} />导出报告
          </button>
        }
      />

      <WorkflowOverviewCard
        eyebrow="Operations Overview"
        title="今日院务优先级总览"
        description="首页不再只是静态看板，而是把入住经营、评估认定、设备告警和护理执行这四条运营主线先压成一个管理摘要，帮助院长和值班管理者先看重点再下钻。"
        badge={<Tag variant="success">All Systems Visible</Tag>}
        metrics={[
          { label: '今日待处理事项', value: pendingTasks + pendingAlarms, hint: `护理任务 ${pendingTasks} 项 · 设备告警 ${pendingAlarms} 条`, tone: pendingTasks + pendingAlarms > 0 ? 'warning' : 'success' },
          { label: '待认定确认', value: pendingConfirmations, hint: '需继续人工复核的评估申请', tone: pendingConfirmations > 0 ? 'warning' : 'success' },
          { label: '在院经营占用', value: `${occupancyRate}%`, hint: `${occupiedBeds}/${totalBeds} 床位已使用`, tone: occupancyRate >= 90 ? 'danger' : occupancyRate >= 75 ? 'warning' : 'success' },
          { label: '本周服务峰值', value: `${maxService} 人次`, hint: '用于评估排班与服务承接能力', tone: 'info' },
        ]}
        signals={[
          { label: pendingAlarms > 0 ? `设备待处理告警 ${pendingAlarms} 条` : '当前无待处理设备告警', tone: pendingAlarms > 0 ? 'danger' : 'success' },
          { label: pendingTasks > 0 ? `今日仍有 ${pendingTasks} 项护理任务待闭环` : '今日护理任务已全部闭环', tone: pendingTasks > 0 ? 'warning' : 'success' },
          { label: pendingConfirmations > 0 ? `评估认定待确认 ${pendingConfirmations} 条` : '认定工作台当前无待确认积压', tone: pendingConfirmations > 0 ? 'info' : 'neutral' },
        ]}
        actions={
          <>
            <Link href="/operations/daily" className="btn btn-primary btn-sm">进入日班工作台</Link>
            <Link href="/elderly/checkin" className="btn btn-secondary btn-sm">进入评估认定</Link>
            <Link href="/alerts" className="btn btn-secondary btn-sm">查看实时告警</Link>
            <Link href="/devices/realtime" className="btn btn-secondary btn-sm">查看设备监控</Link>
          </>
        }
      />

      {/* ── KPI Row ── */}
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard
          icon={<Home size={20} />}
          label="入住率"
          value={`${occupancyRate}%`}
          sub={`${occupiedBeds}/${totalBeds} 床`}
          trend={{ value: '+1.2%', direction: 'up' }}
          color="primary"
        />
        <StatCard
          icon={<Users size={20} />}
          label="在院人数"
          value={inHospital}
          sub="今日在册"
          trend={{ value: '+2', direction: 'up' }}
          color="success"
        />
        <StatCard
          icon={<ClipboardList size={20} />}
          label="今日护理任务"
          value={todayTasks.length}
          sub={`待执行 ${pendingTasks} 项`}
          color="info"
        />
        <StatCard
          icon={<AlertTriangle size={20} />}
          label="设备告警"
          value={pendingAlarms}
          sub="共 4 条记录"
          color="warning"
        />
        <StatCard
          icon={<Bell size={20} />}
          label="待处理事项"
          value={pendingTasks + pendingAlarms}
          sub="需及时处理"
          color="danger"
        />
        <StatCard
          icon={<DollarSign size={20} />}
          label="本月收入"
          value="28.6万"
          sub="较上月 +5.3%"
          trend={{ value: '+5.3%', direction: 'up' }}
          color="purple"
        />
      </div>

      <DataCard
        icon={<AlertTriangle size={16} />}
        title="今日优先动作"
        subtitle="先处理会影响院务稳定性的事项，再进入列表型页面做细查。"
        badge={<Tag variant="warning">Manager First</Tag>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {[
            {
              title: '日班运营收口',
              description: '把告警、事故、活动、评定任务和资源补位拉到同一入口，先确定当班优先顺序再下钻处理。',
              href: '/operations/daily',
              cta: '进入工作台',
              tone: 'var(--color-primary)',
            },
            {
              title: '设备告警闭环',
              description: pendingAlarms > 0 ? `当前还有 ${pendingAlarms} 条设备告警待处理，优先避免影响老人监测与呼叫链路。` : '当前没有待处理设备告警，可把注意力转到排班和认定。',
              href: '/alerts',
              cta: '查看告警',
              tone: pendingAlarms > 0 ? 'var(--color-danger)' : 'var(--color-success)',
            },
            {
              title: '评估认定复核',
              description: pendingConfirmations > 0 ? `${pendingConfirmations} 条评估申请仍待人工确认，建议在结算或任务派生前先完成认定。` : '当前没有待人工确认的评估申请。',
              href: '/elderly/checkin',
              cta: '进入认定',
              tone: pendingConfirmations > 0 ? 'var(--color-warning)' : 'var(--color-success)',
            },
            {
              title: '护理执行闭环',
              description: pendingTasks > 0 ? `今日护理任务还有 ${pendingTasks} 项未闭环，建议优先清掉待执行与进行中任务。` : '今日护理任务已全部闭环，可转入经营与复盘。',
              href: '/activities',
              cta: '查看任务',
              tone: pendingTasks > 0 ? 'var(--color-primary)' : 'var(--color-success)',
            },
          ].map(item => (
            <div key={item.title} style={{ borderRadius: 16, border: '1px solid var(--color-border)', padding: 16, background: 'var(--color-card)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.tone, marginBottom: 10 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
              <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{item.description}</div>
              <div style={{ marginTop: 12 }}>
                <Link href={item.href} className="btn btn-secondary btn-sm">{item.cta}</Link>
              </div>
            </div>
          ))}
        </div>
      </DataCard>

      <div className="dashboard-grid-2" style={{ marginBottom: 16 }}>
        <DataCard
          icon={<Bot size={16} />}
          title="AI 风险摘要"
          subtitle="结合入住评估、健康异常与未闭环报警给出当前最需要被看见的信号。"
          badge={<Tag variant="primary">Admin + AI</Tag>}
        >
          <div style={{ display: 'grid', gap: 10 }}>
            {aiInsights.map(item => (
              <Link key={item.id} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</span>
                    <Tag variant={item.variant}>{item.value}</Tag>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.summary}</div>
                </div>
              </Link>
            ))}
          </div>
        </DataCard>

        <DataCard
          icon={<ClipboardList size={16} />}
          title="AI 运营建议"
          subtitle="当前仓库仍以结果型数据为主，建议只做建议展示，不自动执行。"
        >
          <div style={{ display: 'grid', gap: 10 }}>
            {aiActions.map(item => (
              <div key={item} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
                {item}
              </div>
            ))}
          </div>
        </DataCard>
      </div>

      {/* ── Main Grid: Tasks | Service Chart ── */}
      <div className="dashboard-grid-2" style={{ marginBottom: 16 }}>

        {/* Left: Today's Care Tasks */}
        <DataCard
          icon={<ClipboardList size={16} />}
          title="今日护理任务"
          subtitle={`${todayTasks.length} 项任务 · 待执行 ${pendingTasks} 项`}
          action={
            <Link href="/activities" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>
              查看全部 <ChevronRight size={12} />
            </Link>
          }
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['时间', '老人', '房间', '任务类型', '执行人', '状态'].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prioritizedTasks.map(task => (
                  <tr
                    key={task.id}
                    className="table-hover-row"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                    onClick={() => router.push(`/elderly/${task.id.replace('T', 'E')}`)}
                  >
                    <td style={{ padding: '9px 10px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{task.time}</td>
                    <td style={{ padding: '9px 10px' }}>
                      <div className="table-cell-avatar">
                        <div className="avatar avatar-sm" style={{ background: 'rgba(13,148,136,0.1)', color: 'var(--color-primary)' }}>
                          {task.elderly.slice(0, 1)}
                        </div>
                        <span className="font-semibold text-sm">{task.elderly}</span>
                      </div>
                    </td>
                    <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--color-muted)' }}>{task.room}</td>
                    <td style={{ padding: '9px 10px', fontSize: 12 }}>{task.type}</td>
                    <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--color-muted)' }}>{task.nurse}</td>
                    <td style={{ padding: '9px 10px' }}>
                      <Tag variant={TASK_STATUS_TAG[task.status]}>{task.status}</Tag>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataCard>

        {/* Right: Weekly Service Volume (CSS Bar Chart) */}
        <DataCard
          icon={<Activity size={16} />}
          title="本周服务量趋势"
          subtitle="每日护理服务完成人次"
          action={
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
              峰值 {maxService} 人次
            </span>
          }
        >
          <div className="service-chart-wrap">
            {weeklyServiceData.map((d, i) => {
              const pct = (d.count / maxService) * 100
              const isPeak = i === 4
              return (
                <div key={i} className="service-bar-item">
                  <span className="service-bar-count">{d.count}</span>
                  <div
                    className={`service-bar ${isPeak ? 'current' : 'history'}`}
                    style={{ height: `${pct}%` }}
                  >
                    {isPeak && (
                      <span className="service-bar-peak-label">峰值</span>
                    )}
                  </div>
                  <span className="service-bar-day">{d.day}</span>
                </div>
              )
            })}
          </div>
          {/* Legend */}
          <div className="chart-legend">
            <div className="chart-legend-item">
              <div className="chart-legend-dot" style={{ background: 'var(--color-primary)' }} />
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>本周</span>
            </div>
            <div className="chart-legend-item">
              <div className="chart-legend-dot" style={{ background: 'rgba(13,148,136,0.15)' }} />
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>历史均值</span>
            </div>
          </div>
        </DataCard>
      </div>

      {/* ── Health Monitoring ── */}
      <div className="dashboard-grid-2" style={{ marginBottom: 16 }}>

        {/* Vital Signs Cards */}
        <DataCard
          icon={<Heart size={16} />}
          title="健康监测简要"
          subtitle="重点老人体征数据"
          action={
            <Link href="/elderly" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>
              全部老人 <ChevronRight size={12} />
            </Link>
          }
        >
          <div className="flex-col" style={{ gap: 10 }}>
            {healthBrief.map(h => (
              <div
                key={h.id}
                className="list-item-card"
                onClick={() => router.push(`/elderly/${h.id}`)}
              >
                <div className="vital-row">
                  <div className="avatar avatar-sm font-bold vital-avatar">
                    {h.name.slice(0, 1)}
                  </div>
                  <div className="vital-info">
                    <div className="flex-center" style={{ gap: 6 }}>
                      <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{h.name}</span>
                      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{h.room}</span>
                    </div>
                    {/* Vital signs row */}
                    <div className="vital-signs">
                      <div className="vital-sign">
                        <Thermometer size={11} className="vital-sign-icon" />
                        <span className="vital-sign-val">{h.temp}°C</span>
                      </div>
                      <div className="vital-sign">
                        <Activity size={11} className="vital-sign-icon" />
                        <span className="vital-sign-val">{h.bp}</span>
                      </div>
                      <div className="vital-sign">
                        <Heart size={11} className="vital-sign-icon" />
                        <span className="vital-sign-val">{h.hr} bpm</span>
                      </div>
                    </div>
                  </div>
                  {/* Trend indicator */}
                  <div className={`trend-dot ${h.trend}`}>
                    <span style={{ fontSize: 10 }}>{h.trend === 'up' ? '↑' : '→'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DataCard>

        {/* Mini Trend Chart (CSS sparkline) */}
        <DataCard
          icon={<Droplets size={16} />}
          title="本周血压走势"
          subtitle="重点关注老人 · 张秀英"
          action={
            <Tag variant="warning">重点关注</Tag>
          }
        >
          <div>
            {/* Simulated 7-day trend */}
            <div className="bp-chart">
              {[
                { day: '一', high: 148, low: 90 },
                { day: '二', high: 145, low: 88 },
                { day: '三', high: 150, low: 92 },
                { day: '四', high: 155, low: 95 },
                { day: '五', high: 152, low: 91 },
                { day: '六', high: 147, low: 89 },
                { day: '日', high: 145, low: 88 },
              ].map((d, i) => {
                const highPct = ((d.high - 120) / 40) * 100
                const lowPct = ((d.low - 60) / 40) * 100
                return (
                  <div key={i} className="bp-bar-col">
                    <div className="bp-bar-high" style={{ height: `${highPct}%`, minHeight: 4, background: 'rgba(239,68,68,0.3)' }} />
                    <div className="bp-bar-low"  style={{ height: `${lowPct}%`,  minHeight: 4, background: 'rgba(59,130,246,0.3)' }} />
                    <span className="bp-bar-day">{d.day}</span>
                  </div>
                )
              })}
            </div>
            {/* Legend */}
            <div className="chart-legend">
              <div className="chart-legend-item">
                <div className="chart-legend-dot" style={{ background: 'rgba(239,68,68,0.3)' }} />
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>收缩压</span>
              </div>
              <div className="chart-legend-item">
                <div className="chart-legend-dot" style={{ background: 'rgba(59,130,246,0.3)' }} />
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>舒张压</span>
              </div>
            </div>
          </div>
        </DataCard>
      </div>

      {/* ── Quick Access ── */}
      <div className="quick-links-grid" style={{ marginBottom: 16 }}>
        {quickLinks.map(item => (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
            <div className="quick-link-item">
              <div className="quick-link-icon">
                {item.icon}
              </div>
              <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                {item.label}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="dashboard-footer">
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          最后更新: {today.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          &nbsp;· 数据来源: 养老院管理系统 v2.0
        </p>
      </div>

    </div>
  )
}
