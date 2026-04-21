'use client'

import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, Tag } from '@/components/nh'
import { fetchAdminElderList, type AdminElderListItemResponse } from '@/lib/elderly/admin-elderly-api'
import { createAdminVitals } from '@/lib/services/admin-vital-services'
import { Activity, AlertCircle, ArrowLeft, Save, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'

const inputClass = 'input'

interface VitalsFormState {
  elderId: string
  bloodPressure: string
  heartRate: string
  temperature: string
  bloodSugar: string
  oxygen: string
  recordedBy: string
}

const EMPTY_FORM: VitalsFormState = {
  elderId: '',
  bloodPressure: '',
  heartRate: '',
  temperature: '',
  bloodSugar: '',
  oxygen: '',
  recordedBy: '',
}

function validate(form: VitalsFormState): string {
  if (!form.elderId) return '请选择要录入体征的老人。'
  if (!/^\d{2,3}\/\d{2,3}$/.test(form.bloodPressure.trim())) return '请输入正确的血压格式，例如 135/85。'
  if (Number.isNaN(Number(form.heartRate)) || Number(form.heartRate) <= 0) return '请输入正确的心率。'
  if (Number.isNaN(Number(form.temperature)) || Number(form.temperature) <= 0) return '请输入正确的体温。'
  if (Number.isNaN(Number(form.bloodSugar)) || Number(form.bloodSugar) <= 0) return '请输入正确的血糖。'
  if (Number.isNaN(Number(form.oxygen)) || Number(form.oxygen) <= 0) return '请输入正确的血氧。'
  if (!form.recordedBy.trim()) return '请填写记录人。'
  return ''
}

export default function VitalsNewPage() {
  const router = useRouter()
  const [form, setForm] = useState<VitalsFormState>(EMPTY_FORM)
  const [elders, setElders] = useState<AdminElderListItemResponse[] | null>(null)
  const [eldersError, setEldersError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchAdminElderList({ page: 1, pageSize: 500 })
      .then(result => {
        if (cancelled) return
        setElders(result.items)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setEldersError(err instanceof Error ? err.message : '老人列表加载失败。')
      })
    return () => { cancelled = true }
  }, [])

  function updateForm<K extends keyof VitalsFormState>(key: K, value: VitalsFormState[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const msg = validate(form)
    if (msg) {
      setError(msg)
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const record = await createAdminVitals({
        elderId: form.elderId,
        bloodPressure: form.bloodPressure.trim(),
        heartRate: Number(form.heartRate),
        temperature: Number(form.temperature),
        bloodSugar: Number(form.bloodSugar),
        oxygen: Number(form.oxygen),
        recordedBy: form.recordedBy.trim(),
      })
      router.push(`/elderly/vitals?selected=${encodeURIComponent(record.observationId)}&entry=elderly-vitals-new`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '提交失败，请稍后重试。')
      setSubmitting(false)
    }
  }

  return (
    <div className="page-root animate-fade-up" style={{ maxWidth: 920, margin: '0 auto' }}>
      <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
        <Link href="/elderly/vitals" className="btn btn-ghost btn-icon-sm btn-icon"><ArrowLeft size={16} /></Link>
        <div>
          <h1 className="text-xl font-extrabold" style={{ letterSpacing: '-0.02em' }}>录入体征</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>提交后写入 Health Service，列表页会回流展示最新记录。</p>
        </div>
      </div>

      <PageHeader
        title="体征记录"
        subtitle="先选择老人，再录入关键体征值与记录人。"
      />

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="录入闭环" subtitle="录入 → 写入 Health Service → 列表页回流。">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                {[
                  { title: '1. 选择老人', description: '老人列表来自 /api/admin/elders 真实接口。', icon: <UserCheck size={16} /> },
                  { title: '2. 录入体征', description: '血压 / 心率 / 体温 / 血糖 / 血氧为必填。', icon: <Activity size={16} /> },
                  { title: '3. 列表回流', description: '提交成功后跳转到 /elderly/vitals 并选中新纪录。', icon: <UserCheck size={16} /> },
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
              {eldersError ? <div className="form-error" style={{ marginTop: 16 }}><AlertCircle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} /><span className="form-error-text">老人列表加载失败：{eldersError}</span></div> : null}

              <div style={{ marginTop: 16 }}>
                <DataCard icon={<Activity size={18} />} title="体征信息" bodyClassName="form-section">
                  <div className="form-grid">
                    <div className="form-grid-full">
                      <label className="form-label">老人</label>
                      <select className={inputClass} value={form.elderId} onChange={event => updateForm('elderId', event.target.value)} disabled={elders === null}>
                        <option value="">{elders === null ? '加载中…' : '请选择'}</option>
                        {(elders ?? []).map(item => (
                          <option key={item.elderId} value={item.elderId}>{item.elderName}（{item.roomNumber}）</option>
                        ))}
                      </select>
                    </div>
                    <div><label className="form-label">血压（mmHg）</label><input className={inputClass} value={form.bloodPressure} onChange={event => updateForm('bloodPressure', event.target.value)} placeholder="如 135/85" /></div>
                    <div><label className="form-label">心率（bpm）</label><input className={inputClass} type="number" value={form.heartRate} onChange={event => updateForm('heartRate', event.target.value)} placeholder="60-100" /></div>
                    <div><label className="form-label">体温（℃）</label><input className={inputClass} type="number" step="0.1" value={form.temperature} onChange={event => updateForm('temperature', event.target.value)} placeholder="36-37.3" /></div>
                    <div><label className="form-label">血糖（mmol/L）</label><input className={inputClass} type="number" step="0.1" value={form.bloodSugar} onChange={event => updateForm('bloodSugar', event.target.value)} placeholder="3.9-7.0" /></div>
                    <div><label className="form-label">血氧（%）</label><input className={inputClass} type="number" value={form.oxygen} onChange={event => updateForm('oxygen', event.target.value)} placeholder="95-100" /></div>
                    <div className="form-grid-full"><label className="form-label">记录人</label><input className={inputClass} value={form.recordedBy} onChange={event => updateForm('recordedBy', event.target.value)} placeholder="填写实际录入人姓名" /></div>
                  </div>
                </DataCard>
              </div>

              <div className="flex items-center justify-end gap-3" style={{ marginTop: 16 }}>
                <Link href="/elderly/vitals" className="btn btn-ghost btn-md">取消</Link>
                <button type="submit" className="btn btn-primary btn-md" disabled={submitting}>
                  {submitting ? <span className="login-spinner animate-spin" /> : <><Save size={15} />保存体征</>}
                </button>
              </div>
            </form>
          </>
        )}
        rail={(
          <>
            <DataCard title="录入边界" subtitle="主区只保留表单录入与提交。" badge={<Tag variant="warning">Boundary</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">提交成功后回流 /elderly/vitals 并高亮新纪录。</div>
                <div className="page-help-card-item">失败保留表单内容，可调整后重试。</div>
                <div className="page-help-card-item">老人列表来自 /api/admin/elders 真实接口。</div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整体征录入说明迁移到显式帮助页"
              summary="体征录入已对接 Admin BFF /api/admin/vitals → Health Service /api/health/vitals。"
              items={[
                '字段要求：血压格式 xxx/xx，其他为正数。',
                '记录人请填写实际录入人，便于审计对应。',
                '若需要完整说明，进入老人帮助页查看。',
              ]}
              href="/elderly/help"
              actionLabel="查看老人帮助"
            />
          </>
        )}
      />
    </div>
  )
}
