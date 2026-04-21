'use client'

import { DataCard, EmptyState, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard } from '@/components/nh'
import { fetchAdminEquipment, type AdminEquipmentRecord } from '@/lib/services/admin-operations-services'
import { Boxes, ChevronRight, ClipboardList, PackageCheck, Wrench } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

const CATEGORY_ICONS: Record<string, string> = {
  医疗设备: '医',
  康复设备: '康',
  生活设备: '生',
  智能设备: '智',
}

function groupByCategory(list: AdminEquipmentRecord[]) {
  const groups = new Map<string, AdminEquipmentRecord[]>()
  for (const item of list) {
    const key = item.category || '未分类'
    const bucket = groups.get(key) ?? []
    bucket.push(item)
    groups.set(key, bucket)
  }
  return Array.from(groups.entries()).map(([category, items]) => ({
    category,
    items,
    total: items.length,
    inUse: items.filter(i => i.status === '正常').length,
    maintenance: items.filter(i => i.status === '维修中' || i.status === '待维修').length,
    retired: items.filter(i => i.status === '已报废').length,
  }))
}

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case '正常':
      return 'success'
    case '维修中':
    case '待维修':
      return 'warning'
    case '已报废':
      return 'danger'
    default:
      return 'info'
  }
}

function formatDate(iso: string) {
  if (!iso) return '--'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export default function DeviceAssetsPage() {
  const [records, setRecords] = useState<AdminEquipmentRecord[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const loading = records === null && error === null

  useEffect(() => {
    let cancelled = false

    fetchAdminEquipment({ pageSize: 500 })
      .then(payload => {
        if (cancelled) return
        setRecords(payload.items)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : '资产台账加载失败。'
        setError(message)
      })

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const handleReload = () => {
    setRecords(null)
    setError(null)
    setReloadToken(token => token + 1)
  }

  const stats = useMemo(() => {
    const list = records ?? []
    return {
      total: list.length,
      inUse: list.filter(item => item.status === '正常').length,
      maintenance: list.filter(item => item.status === '维修中' || item.status === '待维修').length,
      retired: list.filter(item => item.status === '已报废').length,
      pendingAcceptance: list.filter(item => item.lifecycleStatus === '待验收').length,
    }
  }, [records])

  const categories = useMemo(() => groupByCategory(records ?? []), [records])
  const recentRecords = useMemo(() => (records ?? []).slice(0, 30), [records])

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="设备资产"
        subtitle="从 Operations Service 台账聚合在用 / 维保 / 退役 / 待验收资产口径，支撑资产盘点与调拨评估。"
        actions={(
          <>
            <Link href="/equipment" className="btn btn-secondary btn-sm">返回设备台账</Link>
            <Link href="/equipment/new" className="btn btn-sm">新增设备</Link>
          </>
        )}
      />

      <InteractionRailLayout
        main={(
          <>
            <WorkflowOverviewCard
              eyebrow="Devices Assets"
              title="设备资产聚合总览"
              description="资产视图直接读取 Operations Service 真实设备台账，按类别与状态聚合，不再使用 StandardModulePage 静态演示数据。"
              badge={<Tag variant={loading ? 'neutral' : error ? 'danger' : 'primary'}>{loading ? 'Loading' : error ? 'Live Unavailable' : 'Live Snapshot'}</Tag>}
              metrics={[
                { label: '资产总数', value: stats.total, hint: loading ? '加载中…' : '当前可见台账', tone: 'primary' },
                { label: '在用', value: stats.inUse, hint: '状态=正常', tone: 'success' },
                { label: '维保中', value: stats.maintenance, hint: '维修 / 待维修', tone: 'warning' },
                { label: '待验收', value: stats.pendingAcceptance, hint: '生命周期=待验收', tone: 'info' },
              ]}
              signals={[
                { label: '列表来自 /api/admin/equipment（Operations 真实台账），静态 devicesAssetsPage 已完全移除', tone: 'info' },
                error
                  ? { label: error, tone: 'danger' }
                  : { label: '每次进入或点击重试会重新聚合后端结果', tone: 'info' },
              ]}
            />

            {error && (
              <DataCard title="Live Unavailable" subtitle="暂时无法从 Operations Service 读取设备台账。" badge={<Tag variant="danger">Error</Tag>}>
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
              <StatCard icon={<Boxes size={18} />} label="资产总数" value={stats.total} color="primary" />
              <StatCard icon={<PackageCheck size={18} />} label="在用" value={stats.inUse} sub="状态=正常" color="success" />
              <StatCard icon={<Wrench size={18} />} label="维保中" value={stats.maintenance} sub="维修/待维修" color="warning" />
              <StatCard icon={<ClipboardList size={18} />} label="待验收" value={stats.pendingAcceptance} sub="生命周期=待验收" color="info" />
            </div>

            <DataCard
              title="按类别分布"
              subtitle="根据 Operations 台账 category 字段聚合。"
              badge={<Tag variant="primary">Categories</Tag>}
            >
              {loading ? (
                <div className="home-context-description">加载中…</div>
              ) : categories.length === 0 ? (
                <EmptyState
                  title="暂无资产台账"
                  description="请在设备台账页新增设备，待验收后会自动进入资产聚合视图。"
                  action={<Link href="/equipment/new" className="btn btn-sm">前往新增</Link>}
                />
              ) : (
                <div className="category-grid">
                  {categories.map(group => (
                    <div key={group.category} className="category-card">
                      <div className="category-card__head">
                        <span className="category-card__icon">{CATEGORY_ICONS[group.category] ?? group.category.slice(0, 1)}</span>
                        <div>
                          <div className="category-card__title">{group.category}</div>
                          <div className="category-card__desc">共 {group.total} 台</div>
                        </div>
                      </div>
                      <div className="category-card__body">
                        <span><Tag variant="success">在用 {group.inUse}</Tag></span>
                        <span><Tag variant="warning">维保 {group.maintenance}</Tag></span>
                        <span><Tag variant="danger">报废 {group.retired}</Tag></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DataCard>

            <DataCard
              title="最近台账"
              subtitle="展示最新 30 条真实资产，点击进入设备详情。"
              badge={<Tag variant="info">Records</Tag>}
            >
              {loading ? (
                <div className="home-context-description">加载中…</div>
              ) : recentRecords.length === 0 ? (
                <EmptyState title="暂无记录" description="等待设备台账写入后会自动呈现。" />
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>设备</th>
                        <th>类别</th>
                        <th>位置</th>
                        <th>状态</th>
                        <th>下次维保</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRecords.map(item => (
                        <tr key={item.id}>
                          <td>
                            <div>{item.name}</div>
                            <div className="home-context-description">{item.model} · {item.serialNumber}</div>
                          </td>
                          <td>{item.category}</td>
                          <td>{item.location || '--'}</td>
                          <td><Tag variant={statusTone(item.status)}>{item.status}</Tag></td>
                          <td>{formatDate(item.maintenanceDate)}</td>
                          <td>
                            <Link href={`/equipment/${item.id}`} className="btn btn-sm btn-ghost">
                              详情 <ChevronRight size={14} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="上下文说明" subtitle="资产视图的边界与关联动作。" badge={<Tag variant="info">Assets Context</Tag>}>
              <div className="home-context-stack">
                <div className="home-context-item">
                  <div className="home-context-title">当前边界</div>
                  <div className="home-context-description">该页只做只读聚合；新增、验收、报废等写操作请在 `/equipment` 主台账完成。</div>
                </div>
                <div className="home-context-item">
                  <div className="home-context-title">建议顺序</div>
                  <div className="home-context-description">先按类别核对资产分布，再打开最近台账查重点设备，最后回到 `/equipment` 跟进维保或报废。</div>
                </div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整说明后置到帮助页"
              summary="资产聚合页已接入真实台账，以只读方式展示类别与状态分布。"
              items={[
                '类别卡片按 Operations 返回的 category 聚合。',
                '最近台账限制为最新 30 条，点击进入详情。',
                '错误态请按重试按钮，不回退到演示数据。',
              ]}
              href="/help/devices-assets"
              actionLabel="查看页面帮助"
            />

            <DataCard title="关联入口" subtitle="设备资产相关的常用入口。" badge={<Tag variant="neutral">Links</Tag>}>
              <div className="home-context-stack">
                <div className="home-context-item">
                  <Link href="/equipment" className="btn btn-sm btn-ghost"><Boxes size={14} /> 设备台账</Link>
                </div>
                <div className="home-context-item">
                  <Link href="/equipment/monitor" className="btn btn-sm btn-ghost"><Wrench size={14} /> 设备监控</Link>
                </div>
                <div className="home-context-item">
                  <Link href="/devices/status" className="btn btn-sm btn-ghost"><ClipboardList size={14} /> 设备状态</Link>
                </div>
              </div>
            </DataCard>
          </>
        )}
      />
    </div>
  )
}
