"use client"

import { DataCard, StatCard, Tag, type TagVariant } from '@/components/nh'
import { findLiveActivityById, getOperationsSnapshot, publishActivityDraft, subscribeOperationsWorkflow } from '@/lib/mock/operations-workflow'
import { ArrowLeft, Edit } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo, useSyncExternalStore } from 'react'

const STATUS_TAG: Record<string, TagVariant> = {
  '待发布': 'warning',
  '报名中': 'info',
  '进行中': 'success',
  '已完成': 'neutral',
}

export default function ActivityDetailPage() {
  const params = useParams()
  const id = params.id as string
  const activities = useSyncExternalStore(
    subscribeOperationsWorkflow,
    () => getOperationsSnapshot().activities,
    () => getOperationsSnapshot().activities,
  )
  const data = useMemo(
    () => findLiveActivityById(id, getOperationsSnapshot()) ?? activities[0],
    [activities, id],
  )

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
          <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={() => publishActivityDraft(data.id)}>
            <Edit size={13} />发布活动
          </button>
        ) : (
            <button className="btn btn-primary btn-sm flex items-center gap-2">
              <Edit size={13} />编辑活动
            </button>
        )}
      </div>

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
    </div>
  )
}
