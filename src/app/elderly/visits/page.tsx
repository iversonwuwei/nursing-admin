'use client'
import { DataCard, EmptyState, InteractionRailLayout, PageHelpCard, Tag } from '@/components/nh'
import { fetchAdminVisits, type AdminVisitAppointment } from '@/lib/services/admin-visit-services'
import { Clock, Plus, Search, UserCheck, Video } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

function formatDateTime(iso: string): { date: string; time: string } {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return { date: iso, time: '' }
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    return { date, time }
  } catch {
    return { date: iso, time: '' }
  }
}

function statusVariant(status: string): 'primary' | 'success' | 'warning' | 'danger' | 'neutral' {
  const normalized = status.toLowerCase()
  if (normalized === 'approved' || normalized === 'completed') return 'success'
  if (normalized === 'requested' || normalized === 'pending') return 'warning'
  if (normalized === 'rejected' || normalized === 'cancelled') return 'danger'
  return 'neutral'
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    Requested: '待审核',
    Approved: '已审核',
    Rejected: '已驳回',
    Completed: '已完成',
    Cancelled: '已取消',
  }
  return map[status] ?? status
}

export default function VisitsPage() {
  const [visits, setVisits] = useState<AdminVisitAppointment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [search, setSearch] = useState('')
  const loading = visits === null && error === null

  useEffect(() => {
    let cancelled = false
    fetchAdminVisits()
      .then(items => {
        if (cancelled) return
        setVisits(items)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : '探视记录加载失败。')
      })
    return () => { cancelled = true }
  }, [reloadToken])

  const handleReload = () => {
    setVisits(null)
    setError(null)
    setReloadToken(t => t + 1)
  }

  const filtered = useMemo(() => {
    const list = visits ?? []
    if (!search) return list
    const kw = search.trim().toLowerCase()
    if (!kw) return list
    return list.filter(v => v.visitorName.toLowerCase().includes(kw) || v.elderId.toLowerCase().includes(kw) || v.relation.toLowerCase().includes(kw))
  }, [search, visits])

  const stats = useMemo(() => {
    const list = visits ?? []
    const today = new Date()
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    return {
      total: list.length,
      today: list.filter(v => formatDateTime(v.plannedAtUtc).date === todayKey).length,
      pending: list.filter(v => v.status === 'Requested').length,
      done: list.filter(v => v.status === 'Completed').length,
    }
  }, [visits])

  return (
    <div className="page-root animate-fade-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ letterSpacing: '-0.03em' }}>探视记录</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            共 {stats.total} 条真实预约，今日 {stats.today} 次，待审核 {stats.pending}。
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleReload}>刷新</button>
          <Link href="/elderly/visits/new" className="btn btn-primary btn-sm flex items-center gap-2">
            <Plus size={14} />预约探视
          </Link>
        </div>
      </div>

      <InteractionRailLayout
        main={(
          <>
            <div className="kpi-grid">
              <div className="stat-card"><div className="stat-card__label"><UserCheck size={16} /> 总预约</div><div className="stat-card__value">{stats.total}</div></div>
              <div className="stat-card"><div className="stat-card__label"><Clock size={16} /> 今日</div><div className="stat-card__value">{stats.today}</div></div>
              <div className="stat-card"><div className="stat-card__label"><Video size={16} /> 待审核</div><div className="stat-card__value">{stats.pending}</div></div>
              <div className="stat-card"><div className="stat-card__label"><UserCheck size={16} /> 已完成</div><div className="stat-card__value">{stats.done}</div></div>
            </div>

            {error && (
              <DataCard title="Visit Service 暂不可用" subtitle="探视预约暂无法从真实服务读取。" badge={<Tag variant="danger">Error</Tag>}>
                <div className="home-context-description">{error}</div>
                <button type="button" className="btn btn-sm" style={{ marginTop: 8 }} onClick={handleReload}>重试</button>
              </DataCard>
            )}

            <DataCard
              title="预约列表"
              subtitle="来源：Admin BFF /api/admin/visits → Visit Service"
              badge={<Tag variant={loading ? 'neutral' : error ? 'danger' : 'primary'}>{loading ? 'Loading' : error ? 'Unavailable' : 'Live'}</Tag>}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Search size={14} />
                <input className="input" placeholder="按访客、关系或 ElderId 搜索" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {loading ? (
                <div className="home-context-description">加载中…</div>
              ) : filtered.length > 0 ? (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>老人</th>
                        <th>访客</th>
                        <th>关系</th>
                        <th>计划时间</th>
                        <th>方式</th>
                        <th>状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(v => {
                        const { date, time } = formatDateTime(v.plannedAtUtc)
                        return (
                          <tr key={v.visitId}>
                            <td>{v.elderId}</td>
                            <td>{v.visitorName}{v.phone ? <div className="home-context-description">{v.phone}</div> : null}</td>
                            <td>{v.relation}</td>
                            <td>{date} {time}</td>
                            <td>{v.visitType}</td>
                            <td><Tag variant={statusVariant(v.status)}>{statusLabel(v.status)}</Tag></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title={search ? '未找到匹配预约' : '暂无预约记录'}
                  description={search ? '请调整搜索关键字，或清空搜索查看全部预约。' : '可点击右上角“预约探视”新增一条真实预约。'}
                />
              )}
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="审批边界" subtitle="当前页面仅为只读实况。" badge={<Tag variant="warning">Read Only</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">Visit Service 尚未开放 approve / reject API，审批在后端补齐后再开放。</div>
                <div className="page-help-card-item">本页显示当前租户最近 100 条真实预约，不再回落 mock。</div>
                <div className="page-help-card-item">新增预约请进入 /elderly/visits/new。</div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="探视记录说明"
              summary="探视记录现已对接真实 Visit Service，列表为只读实况。"
              items={[
                '字段来自 Visit Service 持久化数据。',
                '筛选支持访客、关系、ElderId 关键字。',
                '审批写入能力等待后端补齐。',
              ]}
              href="/help/elderly-visits"
              actionLabel="查看页面帮助"
            />
          </>
        )}
      />
    </div>
  )
}
