'use client'

import { DataCard, InteractionRailLayout, PageHelpCard, Tag } from '@/components/nh'
import { elderlyList } from '@/lib/data'
import {
    addHealthArchiveDraft,
    EMPTY_HEALTH_ARCHIVE_FORM,
    type HealthArchiveCreateFormState,
    validateHealthArchiveForm,
} from '@/lib/mock/care-service-workflow'
import { AlertCircle, ArrowLeft, ClipboardCheck, FileHeart, Save, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'

const inputClass = 'input'

export default function HealthArchiveNewPage() {
  const router = useRouter()
  const [form, setForm] = useState<HealthArchiveCreateFormState>(EMPTY_HEALTH_ARCHIVE_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const helpHref = '/elderly/help'

  function updateForm<K extends keyof HealthArchiveCreateFormState>(key: K, value: HealthArchiveCreateFormState[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateHealthArchiveForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')
    const record = addHealthArchiveDraft(form)
    router.push(`/elderly/health?selected=${record.id}&entry=elderly-health-new`)
  }

  return (
    <div className="page-root animate-fade-up" style={{ maxWidth: 920, margin: '0 auto' }}>
      <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
        <Link href="/elderly/health" className="btn btn-ghost btn-icon-sm btn-icon"><ArrowLeft size={16} /></Link>
        <div>
          <h1 className="text-xl font-extrabold" style={{ letterSpacing: '-0.02em' }}>新建健康档案</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>录入基础健康指标后，先进入待建档闭环，再纳入巡诊口径。</p>
        </div>
      </div>

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="健康建档闭环" subtitle="首批流程为录入 -> 护士长确认 -> 纳入健康档案。">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                {[
                  { title: '1. 选择老人', description: '基于现有老人台账建立健康档案。', icon: <FileHeart size={16} /> },
                  { title: '2. 待建档', description: '提交后先进入待建档，不立即进入稳定统计。', icon: <ClipboardCheck size={16} /> },
                  { title: '3. 完成建档', description: '护士长确认后纳入巡诊与异常提醒口径。', icon: <ShieldCheck size={16} /> },
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
                <DataCard icon={<FileHeart size={18} />} title="建档信息" bodyClassName="form-section">
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
              <div><label className="form-label">血糖</label><input className={inputClass} value={form.bloodSugar} onChange={event => updateForm('bloodSugar', event.target.value)} placeholder="如 5.8" /></div>
              <div><label className="form-label">血氧</label><input className={inputClass} value={form.o2} onChange={event => updateForm('o2', event.target.value)} placeholder="如 97" /></div>
              <div className="form-grid-full"><label className="form-label">提醒备注</label><input className={inputClass} value={form.alert} onChange={event => updateForm('alert', event.target.value)} placeholder="如 血压偏高，可留空" /></div>
                  </div>
                </DataCard>
              </div>
              <div className="flex items-center justify-end gap-3" style={{ marginTop: 16 }}>
                <Link href="/elderly/health" className="btn btn-ghost btn-md">取消</Link>
                <button type="submit" className="btn btn-primary btn-md" disabled={loading}>{loading ? <span className="login-spinner animate-spin" /> : <><Save size={15} />提交并进入待建档</>}</button>
              </div>
            </form>
          </>
        )}
        rail={(
          <>
            <DataCard title="新建边界" subtitle="主区只保留建档表单与提交动作。" badge={<Tag variant="warning">Boundary</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">提交后先进入待建档，不直接进入稳定健康统计。</div>
                <div className="page-help-card-item">健康指标录入错误以当前表单校验为准。</div>
                <div className="page-help-card-item">完整页面定位和建档边界迁移到帮助页。</div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整健康建档说明迁移到显式帮助页"
              summary="健康建档页现在只保留建档闭环和表单字段，页面解释与使用顺序统一后置。"
              items={[
                '先选择老人并录入基础健康指标。',
                '提交后进入待建档，再由护士长确认。',
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