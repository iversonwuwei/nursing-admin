'use client'

import { DataCard, EmptyState, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard } from '@/components/nh'
import { ModuleEntitlementGate } from '@/components/platform/ModuleEntitlementGate'
import { ALERT_LEVEL_LABELS, ALERT_STATUS_LABELS, ALERT_TYPE_LABELS, type AlertLevel, type AlertStatus, type AlertType } from '@/lib/data/alerts-data'
import { fetchAdminAlertHistory, type AdminAlertQueueItemResponse } from '@/lib/services/admin-module-services'
import { Bell, FileText, PieChart, ShieldAlert, ShieldCheck, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type HistoryFilter = 'resolved' | 'processing' | 'all'

const FILTER_OPTIONS: Array<{ value: HistoryFilter; label: string; description: string }> = [
  { value: 'resolved', label: '已处置', description: '默认查看已结案的历史告警，用于复盘与审计。' },
  { value: 'processing', label: '处置中', description: '仍在处理中的告警，用于跟进闭环。' },
  { value: 'all', label: '全部', description: '合并展示所有状态的告警历史记录。' },
]

function normalizeLevel(value: string | null | undefined): AlertLevel {
  if (value === 'critical' || value === 'warning' || value === 'info') {
    return value
  }
  return 'info'
}

function normalizeStatus(value: string | null | undefined): AlertStatus {
  if (value === 'pending' || value === 'processing' || value === 'resolved') {
    return value
  }
  return 'pending'
}

function normalizeType(value: string | null | undefined): AlertType | null {
  if (value && Object.prototype.hasOwnProperty.call(ALERT_TYPE_LABELS, value)) {
    return value as AlertType
  }
  return null
}

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function AlertsHistoryContent() {
  const [filter, setFilter] = useState<HistoryFilter>('resolved')
  const [records, setRecords] = useState<AdminAlertQueueItemResponse[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const loading = records === null && error === null

  useEffect(() => {
    let cancelled = false

    const filters = filter === 'all' ? {} : { status: filter }
    fetchAdminAlertHistory(filters)
      .then(items => {
        if (cancelled) return
        setRecords(items)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : '报警历史查询失败。'
        setError(message)
      })

    return () => {
      cancelled = true
    }
  }, [filter, reloadToken])

  const handleFilter = (next: HistoryFilter) => {
    setRecords(null)
    setError(null)
    setFilter(next)
  }

  const handleReload = () => {
    setRecords(null)
    setError(null)
    setReloadToken(token => token + 1)
  }

  const stats = useMemo(() => {
    const list = records ?? []
    return {
      total: list.length,
      resolved: list.filter(item => normalizeStatus(item.status) === 'resolved').length,
      processing: list.filter(item => normalizeStatus(item.status) === 'processing').length,
      pending: list.filter(item => normalizeStatus(item.status) === 'pending').length,
    }
  }, [records])

  const activeFilter = FILTER_OPTIONS.find(option => option.value === filter) ?? FILTER_OPTIONS[0]

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="报警历史"
        subtitle="按类型、级别和处理状态回看历史报警，支撑复盘与响应时效分析。"
        actions={(
          <>
            <Link href="/alerts" className="btn btn-secondary btn-sm">返回报警中心</Link>
            <Link href="/analytics/report" className="btn btn-sm">查看报表中心</Link>
          </>
        )}
      />

      <InteractionRailLayout
        main={(
          <>
            <WorkflowOverviewCard
              eyebrow="Alerts History"
              title="历史告警复盘总览"
              description="历史列表现在直接读取 Operations Service 真实告警；默认呈现已处置记录，用于复盘、时效分析与审计。"
              badge={<Tag variant={loading ? 'neutral' : error ? 'danger' : 'primary'}>{loading ? 'Loading' : error ? 'Live Unavailable' : 'Live Snapshot'}</Tag>}
              metrics={[
                { label: '当前过滤', value: activeFilter.label, hint: activeFilter.description, tone: 'info' },
                { label: '历史记录', value: stats.total, hint: loading ? '加载中…' : '当前过滤下的真实告警总数', tone: 'primary' },
                { label: '已处置', value: stats.resolved, hint: '可复盘样本', tone: 'success' },
                { label: '处置中', value: stats.processing, hint: '仍需跟进', tone: 'warning' },
              ]}
              signals={[
                { label: '列表来自 /api/admin/alerts（Operations 真实告警），静态 alertRecords 已完全移除', tone: 'info' },
                error
                  ? { label: error, tone: 'danger' }
                  : { label: '切换状态过滤后会重新拉取后端结果', tone: 'info' },
              ]}
            />

            <DataCard
              title="状态过滤"
              subtitle="默认查看已处置历史，支持切换到处置中或全部。"
              badge={<Tag variant="info">Filter</Tag>}
            >
              <div className="filter-chip-row">
                {FILTER_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleFilter(option.value)}
                    className={`btn btn-sm ${filter === option.value ? '' : 'btn-ghost'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </DataCard>

            {error && (
              <DataCard title="Live Unavailable" subtitle="暂时无法从 Operations Service 读取历史告警。" badge={<Tag variant="danger">Error</Tag>}>
                <div className="home-context-stack">
                  <div className="home-context-item">
                    <div className="home-context-description">{error}</div>
                  </div>
                  <div className="home-context-item">
                    <button type="button" className="btn btn-sm" onClick={handleReload}>重试</button>
                  </div>
                </div>
              </DataCard>
            )}

            <div className="kpi-grid">
              <StatCard icon={<ShieldAlert size={18} />} label="历史记录" value={stats.total} color="primary" />
              <StatCard icon={<Bell size={18} />} label="待处理" value={stats.pending} sub="仍需跟进" color="danger" />
              <StatCard icon={<UserCheck size={18} />} label="处置中" value={stats.processing} sub="责任人已接单" color="warning" />
              <StatCard icon={<ShieldCheck size={18} />} label="已处置" value={stats.resolved} sub="可复盘样本" color="success" />
            </div>

            <DataCard
              title="历史记录"
              subtitle={`当前过滤：${activeFilter.label}`}
              badge={<Tag variant="primary">Records</Tag>}
            >
              {loading ? (
                <div className="home-context-description">加载中…</div>
              ) : records && records.length > 0 ? (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>类型</th>
                        <th>老人 / 房间</th>
                        <th>发生时间</th>
                        <th>级别</th>
                        <th>处理状态</th>
                        <th>处置说明</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map(record => {
                        const level = normalizeLevel(record.level)
                        const status = normalizeStatus(record.status)
                        const type = normalizeType(record.type)
                        return (
                          <tr key={record.alertId}>
                            <td>{type ? ALERT_TYPE_LABELS[type] : record.type || record.module}</td>
                            <td>{record.elderlyName || record.elderId || '--'}{record.roomNumber ? ` · ${record.roomNumber}` : ''}</td>
                            <td>{formatDateTime(record.occurredAt)}</td>
                            <td>
                              <Tag variant={level === 'critical' ? 'danger' : level === 'warning' ? 'warning' : 'info'}>{ALERT_LEVEL_LABELS[level]}</Tag>
                            </td>
                            <td>
                              <Tag variant={status === 'resolved' ? 'success' : status === 'processing' ? 'warning' : 'danger'}>{ALERT_STATUS_LABELS[status]}</Tag>
                            </td>
                            <td>{record.resolution || (record.handledBy ? `责任人：${record.handledBy}` : '--')}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="当前过滤下暂无历史告警"
                  description="切换到其他状态或返回报警中心继续处理。"
                  action={<Link href="/alerts" className="btn btn-sm">前往报警中心</Link>}
                />
              )}
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="上下文说明" subtitle="后置区只保留回看复盘所需的最小背景。" badge={<Tag variant="info">History Context</Tag>}>
              <div className="home-context-stack">
                <div className="home-context-item">
                  <div className="home-context-title">当前边界</div>
                  <div className="home-context-description">历史页已切到 Operations Service 真实数据（`/api/admin/alerts`），不再使用静态 alertRecords；处置动作仍在 /alerts 主页发起。</div>
                </div>
                <div className="home-context-item">
                  <div className="home-context-title">建议顺序</div>
                  <div className="home-context-description">先按默认已处置过滤查看复盘样本，再切换到处置中确认待闭环告警，最后进入报表中心做时效分析。</div>
                </div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整说明后置到帮助页"
              summary="报警历史页已从静态模块配置切到真实告警记录，只保留复盘所需的最小背景。"
              items={[
                '默认已处置过滤，用于复盘与审计。',
                '切换到处置中可跟进未闭环告警。',
                '错误或为空时按提示回到 /alerts 处置或重试。',
              ]}
              href="/help/alerts-history"
              actionLabel="查看页面帮助"
            />

            <DataCard title="关联入口" subtitle="历史告警相关的常用入口。" badge={<Tag variant="neutral">Links</Tag>}>
              <div className="home-context-stack">
                <div className="home-context-item">
                  <Link href="/alerts" className="btn btn-sm btn-ghost"><ShieldAlert size={14} /> 报警中心</Link>
                </div>
                <div className="home-context-item">
                  <Link href="/analytics/report" className="btn btn-sm btn-ghost"><PieChart size={14} /> 报表中心</Link>
                </div>
                <div className="home-context-item">
                  <Link href="/settings/audit-logs" className="btn btn-sm btn-ghost"><FileText size={14} /> 审计日志</Link>
                </div>
              </div>
            </DataCard>
          </>
        )}
      />
    </div>
  )
}

export default function AlertsHistoryPage() {
  return (
    <ModuleEntitlementGate
      module="alert-service"
      pageTitle="报警历史"
      moduleLabel="报警服务"
      disabledSummary="当前租户未开通报警服务，报警历史页保留为只读禁用态。"
    >
      <AlertsHistoryContent />
    </ModuleEntitlementGate>
  )
}
