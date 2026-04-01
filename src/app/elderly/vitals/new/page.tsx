'use client'

import { DataCard } from '@/components/nh'
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
    </div>
  )
}