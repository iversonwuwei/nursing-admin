'use client'

import { DataCard, InteractionRailLayout, PageHelpCard, Tag } from '@/components/nh'
import { elderlyList } from '@/lib/data'
import { addVitalsEntry, EMPTY_VITALS_FORM, validateVitalsForm, type VitalsCreateFormState } from '@/lib/mock/care-service-workflow'
import { Activity, AlertCircle, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'

const inputClass = 'input'

export default function VitalsNewPage() {
  const router = useRouter()
  const [form, setForm] = useState<VitalsCreateFormState>(EMPTY_VITALS_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const helpHref = '/elderly/help'

  function updateForm<K extends keyof VitalsCreateFormState>(key: K, value: VitalsCreateFormState[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateVitalsForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')
    const record = addVitalsEntry(form)
    router.push(`/elderly/vitals?selected=${record.id}&entry=elderly-vitals-new`)
  }

  return (
    <div className="page-root animate-fade-up" style={{ maxWidth: 920, margin: '0 auto' }}>
      <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
        <Link href="/elderly/vitals" className="btn btn-ghost btn-icon-sm btn-icon"><ArrowLeft size={16} /></Link>
        <div>
          <h1 className="text-xl font-extrabold" style={{ letterSpacing: '-0.02em' }}>生命体征录入</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>把当班生命体征录入回流到体征列表，形成可追踪记录。</p>
        </div>
      </div>

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="体征录入闭环" subtitle="首批流程为录入 -> 回流列表 -> 纳入当班体征记录。">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                {[
                  { title: '1. 选择老人', description: '基于现有老人台账录入当班生命体征。', icon: <Activity size={16} /> },
                  { title: '2. 当班录入', description: '提交后立即回流列表，形成可追踪记录。', icon: <Save size={16} /> },
                  { title: '3. 持续跟踪', description: '后续由体征列表继续查看趋势与异常信号。', icon: <AlertCircle size={16} /> },
                ].map(item => (
                  <div key={item.title} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 14, background: 'var(--color-card)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{item.icon}{item.title}</div>
                    <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{item.description}</div>
                  </div>
                ))}
              </div>
            </DataCard>

            <form onSubmit={handleSubmit}>
              {error ? <div className="form-error" style={{ marginTop: 16 }}><AlertCircle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} /><span className="form-error-text">{error}</span></div> : null}
              <div style={{ marginTop: 16 }}>
                <DataCard icon={<Activity size={18} />} title="生命体征输入" bodyClassName="form-section">
                  <div className="form-grid">
              <div className="form-grid-full">
                <label className="form-label">老人</label>
                <select className={inputClass} value={form.elderlyId} onChange={event => updateForm('elderlyId', event.target.value)}>
                  <option value="">请选择</option>
                  {elderlyList.map(item => <option key={item.id} value={item.id}>{item.name} ({item.roomNumber}-{item.bedNumber})</option>)}
                </select>
              </div>
              <div><label className="form-label">血压</label><input className={inputClass} value={form.bp} onChange={event => updateForm('bp', event.target.value)} placeholder="如 135/85" /></div>
              <div><label className="form-label">心率</label><input className={inputClass} value={form.hr} onChange={event => updateForm('hr', event.target.value)} placeholder="如 72" /></div>
              <div><label className="form-label">体温</label><input className={inputClass} value={form.temp} onChange={event => updateForm('temp', event.target.value)} placeholder="如 36.5" /></div>
              <div><label className="form-label">血氧</label><input className={inputClass} value={form.spo2} onChange={event => updateForm('spo2', event.target.value)} placeholder="如 97" /></div>
              <div><label className="form-label">血糖</label><input className={inputClass} value={form.bloodSugar} onChange={event => updateForm('bloodSugar', event.target.value)} placeholder="如 5.8" /></div>
              <div><label className="form-label">记录人</label><input className={inputClass} value={form.recordedBy} onChange={event => updateForm('recordedBy', event.target.value)} placeholder="如 陈美华" /></div>
              <div><label className="form-label">记录时间</label><input className={inputClass} type="time" value={form.time} onChange={event => updateForm('time', event.target.value)} /></div>
                  </div>
                </DataCard>
              </div>
              <div className="flex items-center justify-end gap-3" style={{ marginTop: 16 }}>
                <Link href="/elderly/vitals" className="btn btn-ghost btn-md">取消</Link>
                <button type="submit" className="btn btn-primary btn-md" disabled={loading}>{loading ? <span className="login-spinner animate-spin" /> : <><Save size={15} />提交并回流列表</>}</button>
              </div>
            </form>
          </>
        )}
        rail={(
          <>
            <DataCard title="录入边界" subtitle="主区只保留体征输入和提交流程。" badge={<Tag variant="warning">Boundary</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">体征录入提交后直接回流列表，不在新建页承载趋势说明。</div>
                <div className="page-help-card-item">异常判断以后续体征列表和健康监测视图为准。</div>
                <div className="page-help-card-item">完整页面定位和使用顺序迁移到帮助页。</div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整体征录入说明迁移到显式帮助页"
              summary="生命体征录入页现在只保留录入闭环和表单字段，页面解释与判断边界统一后置。"
              items={[
                '先选择老人并录入当班生命体征。',
                '提交后直接回流体征列表继续跟踪。',
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