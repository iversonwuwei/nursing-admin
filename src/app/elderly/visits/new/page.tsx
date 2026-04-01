'use client'

import { DataCard } from '@/components/nh'
import { elderlyList } from '@/lib/data'
import { addVisitAppointment, EMPTY_VISIT_FORM, validateVisitForm, type VisitCreateFormState } from '@/lib/mock/care-service-workflow'
import { AlertCircle, ArrowLeft, Save, UserCheck, Video } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'

const inputClass = 'input'

export default function VisitsNewPage() {
  const router = useRouter()
  const [form, setForm] = useState<VisitCreateFormState>(EMPTY_VISIT_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function updateForm<K extends keyof VisitCreateFormState>(key: K, value: VisitCreateFormState[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateVisitForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')
    const record = addVisitAppointment(form)
    router.push(`/elderly/visits?selected=${record.id}&entry=elderly-visits-new`)
  }

  return (
    <div className="page-root animate-fade-up" style={{ maxWidth: 920, margin: '0 auto' }}>
      <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
        <Link href="/elderly/visits" className="btn btn-ghost btn-icon-sm btn-icon"><ArrowLeft size={16} /></Link>
        <div>
          <h1 className="text-xl font-extrabold" style={{ letterSpacing: '-0.02em' }}>预约探视</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>新预约先进入待审核，再由前台或护理主管确认放行。</p>
        </div>
      </div>

      <DataCard title="探视预约闭环" subtitle="首批流程为预约 -> 待审核 -> 已登记，避免未审核预约直接进入来访口径。">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { title: '1. 预约登记', description: '采集老人、访客、关系和探视时间。', icon: <UserCheck size={16} /> },
            { title: '2. 待审核', description: '提交后先等待前台或护理主管审核。', icon: <Video size={16} /> },
            { title: '3. 通过预约', description: '审核通过后再进入已登记探视列表。', icon: <UserCheck size={16} /> },
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
          <DataCard icon={<UserCheck size={18} />} title="预约信息" bodyClassName="form-section">
            <div className="form-grid">
              <div className="form-grid-full">
                <label className="form-label">老人</label>
                <select className={inputClass} value={form.elderlyId} onChange={event => updateForm('elderlyId', event.target.value)}>
                  <option value="">请选择</option>
                  {elderlyList.map(item => <option key={item.id} value={item.id}>{item.name} ({item.roomNumber}-{item.bedNumber})</option>)}
                </select>
              </div>
              <div><label className="form-label">访客</label><input className={inputClass} value={form.visitor} onChange={event => updateForm('visitor', event.target.value)} placeholder="请输入访客姓名" /></div>
              <div><label className="form-label">关系</label><input className={inputClass} value={form.relation} onChange={event => updateForm('relation', event.target.value)} placeholder="如 女儿" /></div>
              <div><label className="form-label">联系电话</label><input className={inputClass} value={form.phone} onChange={event => updateForm('phone', event.target.value)} placeholder="请输入手机号" /></div>
              <div><label className="form-label">探视日期</label><input className={inputClass} type="date" value={form.date} onChange={event => updateForm('date', event.target.value)} /></div>
              <div><label className="form-label">探视时间</label><input className={inputClass} type="time" value={form.time} onChange={event => updateForm('time', event.target.value)} /></div>
              <div><label className="form-label">探视方式</label><select className={inputClass} value={form.type} onChange={event => updateForm('type', event.target.value as VisitCreateFormState['type'])}><option value="现场">现场</option><option value="视频">视频</option></select></div>
            </div>
          </DataCard>
        </div>
        <div className="flex items-center justify-end gap-3" style={{ marginTop: 16 }}>
          <Link href="/elderly/visits" className="btn btn-ghost btn-md">取消</Link>
          <button type="submit" className="btn btn-primary btn-md" disabled={loading}>{loading ? <span className="login-spinner animate-spin" /> : <><Save size={15} />提交并进入待审核</>}</button>
        </div>
      </form>
    </div>
  )
}