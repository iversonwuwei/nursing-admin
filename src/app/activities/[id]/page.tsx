"use client"

import { DataCard, EmptyState, InteractionRailLayout, PageHelpCard, StatCard, Tag, type TagVariant } from '@/components/nh'
import { fetchAdminActivityDetail, publishAdminActivity, type AdminActivityRecord } from '@/lib/services/admin-operations-services'
import { ArrowLeft, Edit } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const STATUS_TAG: Record<string, TagVariant> = {
  '待发布': 'warning',
  '报名中': 'info',
  '进行中': 'success',
  '已完成': 'neutral',
}

export default function ActivityDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [data, setData] = useState<AdminActivityRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const helpHref = '/activities/help'

  useEffect(() => {
    let active = true

    fetchAdminActivityDetail(id)
      .then(response => {
        if (!active) {
          return
        }

        setData(response)
        setError('')
      })
      .catch((reason: unknown) => {
        if (!active) {
          return
        }

        setError(reason instanceof Error ? reason.message : '活动详情查询失败。')
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [id])

  const notFound = !loading && !data && error.includes('不存在')

  async function handlePublish() {
    if (!data) {
      return
    }

    setSubmitting(true)
    try {
      const updated = await publishAdminActivity(data.id)
      setData(updated)
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '活动发布失败。')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="page-root animate-fade-up">
        <DataCard title="活动详情加载中" subtitle="正在从 Operations Service 拉取对象事实。">
          <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>详情页已切换到真实后端读取，不再回退首条本地活动。</div>
        </DataCard>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="page-root animate-fade-up">
        <EmptyState
          variant="search"
          title="活动不存在"
          description={`未找到编号 ${id} 对应的活动对象。`}
          action={<Link href="/activities" className="btn btn-primary btn-sm">返回活动管理</Link>}
        />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="page-root animate-fade-up">
        <DataCard title="Live Unavailable" subtitle="活动详情实时链路当前不可用。" badge={<Tag variant="danger">Operations API</Tag>}>
          <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{error || '活动详情查询失败。'}</div>
        </DataCard>
      </div>
    )
  }

  return (
    <div className="page-root animate-fade-up">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/activities" className="btn btn-ghost btn-icon btn-sm" style={{ display: "inline-flex" }}>
            <ArrowLeft size={15} />
          </Link>
          <div>
            <div className="page-title">{data.name}</div>
            <div className="page-subtitle">{data.date} {data.time} · {data.location}</div>
          </div>
        </div>
        {data.lifecycleStatus === '待发布' ? (
          <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={handlePublish} disabled={submitting}>
            <Edit size={13} />{submitting ? '发布中...' : '发布活动'}
          </button>
        ) : (
            <button className="btn btn-primary btn-sm flex items-center gap-2">
              <Edit size={13} />编辑活动
            </button>
        )}
      </div>

      <InteractionRailLayout
        main={(
          <>
            <div className="kpi-grid">
              <StatCard label="参与人数" value={`${data.participants}/${data.capacity}`} sub="报名/容量" color="primary" />
              <StatCard label="活动时长" value={`${data.duration}分钟`} color="info" />
              <StatCard label="负责老师" value={data.teacher} color="purple" />
              <StatCard label="状态" value={data.status} color={data.status === '进行中' ? 'success' : data.status === '报名中' ? 'warning' : data.status === '待发布' ? 'info' : 'purple'} />
            </div>

            <DataCard title="活动状态" subtitle="新增活动先进入待发布，再开放报名和执行。" badge={<Tag variant={data.lifecycleStatus === '待发布' ? 'warning' : 'success'}>{data.lifecycleStatus}</Tag>}>
              <div className="text-sm text-muted" style={{ lineHeight: 1.7 }}>
                {data.publishNote ?? '当前暂无额外说明。'}
              </div>
            </DataCard>

            <div className="card">
              <div className="card-header">
                <div className="card-title">活动详情</div>
              </div>
              <div className="card-body">
                <p className="text-sm text-muted" style={{ lineHeight: 1.7 }}>{data.desc}</p>
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Tag variant={STATUS_TAG[data.status]}>{data.status}</Tag>
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>创建于 {data.createdAt}</span>
                  {data.publishedAt ? <span className="text-xs" style={{ color: 'var(--color-muted)' }}>发布于 {data.publishedAt}</span> : null}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginTop: 16 }}>
                  {[
                    { label: "活动类型", value: data.category },
                    { label: "活动地点", value: data.location },
                    { label: "开始时间", value: `${data.date} ${data.time}` },
                    { label: "持续时长", value: `${data.duration}分钟` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="text-xs text-muted mb-1" style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{label}</div>
                      <div className="text-sm font-semibold">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
        rail={(
          <>
            <DataCard title="对象上下文" subtitle="后置展示当前活动摘要和处理焦点。" badge={<Tag variant="info">Context</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">当前活动：{data.name} · {data.category}。</div>
                <div className="page-help-card-item">执行窗口：{data.date} {data.time}，地点 {data.location}。</div>
                <div className="page-help-card-item">当前焦点：{data.lifecycleStatus === '待发布' ? '先确认并发布活动' : '核对执行与报名状态'}。</div>
              </div>
            </DataCard>

            <DataCard title="详情边界" subtitle="页面说明后置，避免和对象核对主区混排。" badge={<Tag variant="warning">Boundary</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">主区只保留状态、KPI 和对象事实，便于快速核对当前活动。</div>
                <div className="page-help-card-item">发布、编辑和返回列表属于主动作，继续保留在页头。</div>
                <div className="page-help-card-item">完整操作顺序和页面定位迁移到帮助页，不再塞入详情正文。</div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整活动详情说明迁移到显式帮助页"
              summary="活动详情页现在只保留对象状态、统计卡和详情字段，页面说明与使用顺序统一后置。"
              items={[
                '先核对待发布状态，再决定是否发布活动。',
                '对象事实以当前详情字段为准，不再混排长说明卡。',
                '若需要完整使用说明，进入活动帮助页查看。',
              ]}
              href={helpHref}
              actionLabel="查看活动帮助"
            />
          </>
        )}
      />
    </div>
  )
}
