'use client'

import { DataCard, InteractionRailLayout, PageHelpCard, Tag } from '@/components/nh'
import {
    addActivityDraft,
    EMPTY_ACTIVITY_FORM,
    validateActivityForm,
    type ActivityCreateFormState,
} from '@/lib/mock/operations-workflow'
import { AlertCircle, ArrowLeft, CalendarHeart, ClipboardCheck, Save, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const inputClass = 'input'
const textareaStyle = { width: '100%', height: 'auto', padding: '10px 12px', resize: 'vertical' } as const

export default function NewActivityPage() {
  const router = useRouter()
  const [form, setForm] = useState<ActivityCreateFormState>(EMPTY_ACTIVITY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const helpHref = '/activities/help'

  function updateForm<K extends keyof ActivityCreateFormState>(key: K, value: ActivityCreateFormState[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateActivityForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')
    const draft = addActivityDraft(form)
    router.push(`/activities?selected=${draft.id}&entry=activities-new`)
  }

  return (
    <div className="page-root animate-fade-up" style={{ maxWidth: 920, margin: '0 auto' }}>
      <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
        <Link href="/activities" className="btn btn-ghost btn-icon-sm btn-icon">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold" style={{ letterSpacing: '-0.02em' }}>新建活动</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>录入活动策划后，先进入待发布闭环，再开放报名与执行。</p>
        </div>
      </div>

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="活动新建闭环" subtitle="首批流程为策划录入 -> 运营复核 -> 发布报名，避免未确认排期直接进入执行。">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                {[
                  { title: '1. 活动策划', description: '录入时间、场地、容量、负责人和活动说明。', icon: <CalendarHeart size={16} /> },
                  { title: '2. 待发布', description: '提交后先进入待发布，不直接暴露给执行看板。', icon: <ClipboardCheck size={16} /> },
                  { title: '3. 发布执行', description: '运营确认后，再进入报名和活动台账。', icon: <ShieldCheck size={16} /> },
                ].map(item => (
                  <div key={item.title} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 14, background: 'var(--color-card)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{item.icon}{item.title}</div>
                    <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{item.description}</div>
                  </div>
                ))}
              </div>
            </DataCard>

            <form onSubmit={handleSubmit}>
              {error ? (
                <div className="form-error" style={{ marginTop: 16 }}>
                  <AlertCircle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
                  <span className="form-error-text">{error}</span>
                </div>
              ) : null}

              <div style={{ marginTop: 16 }}>
                <DataCard icon={<CalendarHeart size={18} />} title="活动主数据" bodyClassName="form-section">
                  <div className="form-grid">
                    <div>
                      <label className="form-label">活动名称</label>
                      <input className={inputClass} value={form.name} onChange={event => updateForm('name', event.target.value)} placeholder="请输入活动名称" />
                    </div>
                    <div>
                      <label className="form-label">活动分类</label>
                      <input className={inputClass} value={form.category} onChange={event => updateForm('category', event.target.value)} placeholder="如 文娱活动" />
                    </div>
                    <div>
                      <label className="form-label">活动日期</label>
                      <input className={inputClass} type="date" value={form.date} onChange={event => updateForm('date', event.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">开始时间</label>
                      <input className={inputClass} type="time" value={form.time} onChange={event => updateForm('time', event.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">活动时长</label>
                      <input className={inputClass} type="number" value={form.duration} onChange={event => updateForm('duration', event.target.value)} placeholder="如 90" />
                    </div>
                    <div>
                      <label className="form-label">人数容量</label>
                      <input className={inputClass} type="number" value={form.capacity} onChange={event => updateForm('capacity', event.target.value)} placeholder="如 30" />
                    </div>
                    <div>
                      <label className="form-label">活动地点</label>
                      <input className={inputClass} value={form.location} onChange={event => updateForm('location', event.target.value)} placeholder="如 三楼活动室" />
                    </div>
                    <div>
                      <label className="form-label">负责人</label>
                      <input className={inputClass} value={form.teacher} onChange={event => updateForm('teacher', event.target.value)} placeholder="如 王老师" />
                    </div>
                    <div className="form-grid-full">
                      <label className="form-label">活动说明</label>
                      <textarea className={inputClass} rows={4} style={textareaStyle} value={form.desc} onChange={event => updateForm('desc', event.target.value)} placeholder="描述活动目标、参与对象、协同部门和现场注意事项" />
                    </div>
                  </div>
                </DataCard>
              </div>

              <div className="flex items-center justify-end gap-3" style={{ marginTop: 16 }}>
                <Link href="/activities" className="btn btn-ghost btn-md">取消</Link>
                <button type="submit" className="btn btn-primary btn-md" disabled={loading}>
                  {loading ? <span className="login-spinner animate-spin" /> : <><Save size={15} />提交并进入待发布</>}
                </button>
              </div>
            </form>
          </>
        )}
        rail={(
          <>
            <DataCard title="新建边界" subtitle="创建页主区只保留表单和提交流程。" badge={<Tag variant="warning">Boundary</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">提交后先进入待发布，不直接进入执行看板。</div>
                <div className="page-help-card-item">表单失败以当前校验提示为准，不在主区混排长说明。</div>
                <div className="page-help-card-item">完整页面定位与使用顺序迁移到帮助页。</div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整活动创建说明迁移到显式帮助页"
              summary="活动新建页现在只保留新建流程和表单字段，页面解释与顺序说明统一后置。"
              items={[
                '先录入主数据，再提交进入待发布。',
                '待发布前不开放报名和执行。',
                '若需要完整说明，进入活动帮助页查看。',
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