'use client'

import { DataCard, EmptyState, FilterBar, FilterItem, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag } from '@/components/nh'
import { fetchAdminVitals, type AdminVitalsEntry } from '@/lib/services/admin-vital-services'
import { Activity, AlertCircle, Minus, Plus, Search, TrendingDown, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

const TREND = (v: number, n: number) => v > n ? { icon: TrendingUp, color: 'var(--color-danger)', label: '偏高' } : v < n ? { icon: TrendingDown, color: 'var(--color-info)', label: '偏低' } : { icon: Minus, color: 'var(--color-success)', label: '正常' }

function formatTime(iso: string): string {
    try {
        const d = new Date(iso)
        if (Number.isNaN(d.getTime())) return iso
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    } catch {
        return iso
    }
}

export default function VitalsPage() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('selected')
  const fromNew = searchParams.get('entry') === 'elderly-vitals-new'

    const [records, setRecords] = useState<AdminVitalsEntry[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [reloadToken, setReloadToken] = useState(0)
    const [search, setSearch] = useState('')
    const loading = records === null && error === null
    const helpHref = '/elderly/help'

    useEffect(() => {
        let cancelled = false
        fetchAdminVitals({ take: 200 })
            .then(items => {
                if (cancelled) return
                setRecords(items)
            })
            .catch((err: unknown) => {
                if (cancelled) return
                setError(err instanceof Error ? err.message : '体征记录加载失败。')
            })
        return () => { cancelled = true }
    }, [reloadToken])

    const handleReload = () => {
        setRecords(null)
        setError(null)
        setReloadToken(t => t + 1)
    }

    const list = useMemo(() => records ?? [], [records])
    const selectedRecord = useMemo(
        () => list.find(item => item.observationId === preselectedId) ?? null,
        [preselectedId, list],
  )

    const filtered = useMemo(() => {
        if (!search.trim()) return list
        const kw = search.trim().toLowerCase()
        return list.filter(r =>
            r.elderName.toLowerCase().includes(kw)
            || r.roomNumber.toLowerCase().includes(kw)
            || r.elderId.toLowerCase().includes(kw),
        )
  }, [list, search])

    const latest = list[0] ?? null
    const latestBpSystolic = latest ? Number(latest.bloodPressure.split('/')[0]) || 0 : 0

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title="指标更新"
              subtitle={loading
                  ? '正在加载体征记录…'
                  : error
                      ? '体征记录加载失败。'
                      : `共 ${list.length} 条体征记录${latest ? `，最近一次来自 ${latest.elderName}（${formatTime(latest.recordedAtUtc)}）` : ''}`}
              actions={(
                  <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={handleReload}>刷新</button>
                      <Link href="/elderly/vitals/new" className="btn btn-primary btn-sm flex items-center gap-2">
                    <Plus size={14} />录入体征
                </Link>
            </div>
        )}
      />

          {error ? (
              <DataCard>
                  <div className="form-error" style={{ marginBottom: 0 }}>
                      <AlertCircle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
                      <span className="form-error-text">体征记录加载失败：{error}</span>
                  </div>
              </DataCard>
          ) : null}

      {selectedRecord && fromNew ? (
              <DataCard title="来自体征录入页" subtitle={`${selectedRecord.elderName} 的生命体征已写入 Health Service 并回流列表。`}>
          <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                      记录人 {selectedRecord.recordedBy}，记录时间 {formatTime(selectedRecord.recordedAtUtc)}，房间 {selectedRecord.roomNumber}。
          </div>
        </DataCard>
      ) : null}

      <InteractionRailLayout
        main={(
          <>
            <div className="kpi-grid" style={{ marginBottom: 16 }}>
                          {[
                              { label: '血压', value: latest ? latest.bloodPressure : '—', icon: Activity, color: 'var(--color-danger)', norm: '90-140/60-90' },
                              { label: '心率', value: latest ? `${latest.heartRate}bpm` : '—', icon: Activity, color: 'var(--color-primary)', norm: '60-100bpm' },
                              { label: '体温', value: latest ? `${latest.temperature}℃` : '—', icon: Activity, color: 'var(--color-warning)', norm: '36-37.3℃' },
                              { label: '血氧', value: latest ? `${latest.oxygen}%` : '—', icon: Activity, color: 'var(--color-info)', norm: '95-100%' },
                              { label: '血糖', value: latest ? String(latest.bloodSugar) : '—', icon: Activity, color: 'var(--color-purple)', norm: '3.9-7.0' },
                          ].map(({ label, value, icon: Icon, norm }) => (
                  <StatCard key={label} icon={<Icon size={18} />} label={label} value={value} sub={`正常: ${norm}`} color={label === '血压' ? 'danger' : label === '心率' ? 'primary' : label === '体温' ? 'warning' : label === '血氧' ? 'info' : 'purple'} />
              ))}
            </div>

            <FilterBar>
              <FilterItem label="搜索">
                <div className="input-wrap" style={{ minWidth: 240 }}>
                  <span className="input-icon"><Search size={14} /></span>
                                  <input className="input" placeholder="搜索老人姓名 / 房间 / 老人编号…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
                </div>
              </FilterItem>
            </FilterBar>

            <DataCard>
                          {loading ? (
                              <EmptyState title="加载中…" description={`正在请求 Admin BFF /api/admin/vitals。最近一次血压阈值参考 ${latestBpSystolic || 130}。`} />
                          ) : filtered.length > 0 ? (
                              <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                                          <thead>
                                              <tr>
                                                  <th>老人</th>
                                                  <th>血压<br /><span style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 400 }}>mmHg</span></th>
                                                  <th>心率<br /><span style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 400 }}>bpm</span></th>
                                                  <th>体温<br /><span style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 400 }}>℃</span></th>
                                                  <th>血氧<br /><span style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 400 }}>%</span></th>
                                                  <th>血糖<br /><span style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 400 }}>mmol/L</span></th>
                                                  <th>记录人</th>
                                                  <th>时间</th>
                                                  <th></th>
                                              </tr>
                                          </thead>
                                          <tbody>
                                              {filtered.map(r => {
                          const bpTrend = TREND(Number(r.bloodPressure.split('/')[0]) || 0, 130)
                          const hrTrend = TREND(r.heartRate, 75)
                          const tempTrend = TREND(Number(r.temperature), 37)
                          const o2Trend = r.oxygen < 95 ? { icon: TrendingDown, color: 'var(--color-danger)', label: '偏低' } : { icon: Minus, color: 'var(--color-success)', label: '正常' }
                          const bsTrend = TREND(Number(r.bloodSugar), 7.0)
                          const highlighted = r.observationId === preselectedId
                          return (
                            <tr key={r.observationId} style={highlighted ? { background: 'var(--color-primary-light)' } : undefined}>
                                <td>
                                    <div className="font-semibold text-sm">{r.elderName}</div>
                                    <div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{r.roomNumber}</div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{r.bloodPressure}</span>
                                        <bpTrend.icon size={13} style={{ color: bpTrend.color }} />
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{r.heartRate}</span>
                                        <hrTrend.icon size={13} style={{ color: hrTrend.color }} />
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{r.temperature}</span>
                                        <tempTrend.icon size={13} style={{ color: tempTrend.color }} />
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{r.oxygen}</span>
                                        <o2Trend.icon size={13} style={{ color: o2Trend.color }} />
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{r.bloodSugar}</span>
                                        <bsTrend.icon size={13} style={{ color: bsTrend.color }} />
                                    </div>
                                </td>
                                  <td><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{r.recordedBy}</span></td>
                                  <td><span className="text-xs" style={{ color: 'var(--color-muted)' }}>{formatTime(r.recordedAtUtc)}</span></td>
                                  <td><Link href={`/elderly/${encodeURIComponent(r.elderId)}`} className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>详情</Link></td>
                              </tr>
                          )
                      })}
                                          </tbody>
                  </table>
                </div>
              ) : (
                                      <EmptyState variant={search ? 'search' : 'default'} title={search ? '暂无匹配体征记录' : '暂无体征记录'} description={search ? '调整搜索词后重试。' : '点击右上角“录入体征”开始第一条记录。'} />
              )}
            </DataCard>
          </>
        )}
        rail={(
          <>
            {selectedRecord ? (
              <DataCard title="当前回流记录" subtitle="对象事实后置展示，避免打散主区表格核对。" badge={<Tag variant="info">Selected</Tag>}>
                <div style={{ display: 'grid', gap: 10 }}>
                            <div className="page-help-card-item">对象：{selectedRecord.elderName} · {selectedRecord.roomNumber}</div>
                            <div className="page-help-card-item">记录人：{selectedRecord.recordedBy} · 时间：{formatTime(selectedRecord.recordedAtUtc)}</div>
                            <div className="page-help-card-item">已写入 Health Service，可进入老人详情继续核对上下文。</div>
                </div>
              </DataCard>
            ) : null}

            <DataCard title="体征判读边界" subtitle="主区只保留 KPI、筛选和体征表格。" badge={<Tag variant="warning">Boundary</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">趋势图标只做快速判读，不替代详细病情判断。</div>
                <div className="page-help-card-item">异常对象的连续变化应回到健康监测或老人详情继续核对。</div>
                        <div className="page-help-card-item">数据来自 Admin BFF /api/admin/vitals → Health Service /api/health/vitals。</div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整体征记录说明迁移到显式帮助页"
                    summary="体征记录页现在只保留 KPI、筛选和表格明细，数据由 Health Service 实时提供。"
              items={[
                '先筛选目标老人，再核对当班体征记录。',
                '趋势图标只做快速提示，不替代详细判断。',
                '若需要完整说明，进入老人帮助页查看。',
              ]}
              href={helpHref}
              actionLabel="查看老人帮助"
            />
          </>
        )}
      />
    </div>
  )
}
