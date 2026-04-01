'use client'

import { DataCard } from '@/components/nh'
import {
    addIncidentDraft,
    EMPTY_INCIDENT_FORM,
    validateIncidentForm,
    type IncidentCreateFormState,
} from '@/lib/mock/operations-workflow'
import { AlertCircle, ArrowLeft, ClipboardCheck, Save, ShieldAlert, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const inputClass = 'input'
const textareaStyle = { width: '100%', height: 'auto', padding: '10px 12px', resize: 'vertical' } as const

export default function NewIncidentPage() {
  const router = useRouter()
  const [form, setForm] = useState<IncidentCreateFormState>(EMPTY_INCIDENT_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function updateForm<K extends keyof IncidentCreateFormState>(key: K, value: IncidentCreateFormState[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateIncidentForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')
    const draft = addIncidentDraft(form)
    router.push(`/incidents?selected=${draft.id}&entry=incidents-new`)
  }

  return (
    <div className="page-root animate-fade-up" style={{ maxWidth: 920, margin: '0 auto' }}>
      <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
        <Link href="/incidents" className="btn btn-ghost btn-icon-sm btn-icon">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold" style={{ letterSpacing: '-0.02em' }}>新增事件报告</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>录入事故初报后，先进入待分派闭环，再由值班主管推进处置。</p>
        </div>
      </div>

      <DataCard title="事件新建闭环" subtitle="首批流程为事故初报 -> 待分派 -> 处置结案，避免报告停留在说明层。">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { title: '1. 事故初报', description: '记录事件标题、地点、报告人、时间和初始描述。', icon: <ShieldAlert size={16} /> },
            { title: '2. 待分派', description: '提交后先进入待分派，由值班主管确认责任人。', icon: <ClipboardCheck size={16} /> },
            { title: '3. 处置结案', description: '处置与复盘完成后，再进入已结案状态。', icon: <ShieldCheck size={16} /> },
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
          <DataCard icon={<ShieldAlert size={18} />} title="事故初报" bodyClassName="form-section">
            <div className="form-grid">
              <div>
                <label className="form-label">事件标题</label>
                <input className={inputClass} value={form.title} onChange={event => updateForm('title', event.target.value)} placeholder="如 老人摔倒" />
              </div>
              <div>
                <label className="form-label">事件级别</label>
                <select className={inputClass} value={form.level} onChange={event => updateForm('level', event.target.value as IncidentCreateFormState['level'])}>
                  <option value="严重">严重</option>
                  <option value="一般">一般</option>
                  <option value="轻微">轻微</option>
                </select>
              </div>
              <div>
                <label className="form-label">涉及老人</label>
                <input className={inputClass} value={form.elder} onChange={event => updateForm('elder', event.target.value)} placeholder="无可留空" />
              </div>
              <div>
                <label className="form-label">发生地点</label>
                <input className={inputClass} value={form.room} onChange={event => updateForm('room', event.target.value)} placeholder="如 201-1" />
              </div>
              <div>
                <label className="form-label">报告人</label>
                <input className={inputClass} value={form.reporter} onChange={event => updateForm('reporter', event.target.value)} placeholder="请输入报告人姓名" />
              </div>
              <div>
                <label className="form-label">报告人角色</label>
                <input className={inputClass} value={form.reporterRole} onChange={event => updateForm('reporterRole', event.target.value)} placeholder="如 值班护士" />
              </div>
              <div className="form-grid-full">
                <label className="form-label">发生时间</label>
                <input className={inputClass} type="datetime-local" value={form.time} onChange={event => updateForm('time', event.target.value)} />
              </div>
              <div className="form-grid-full">
                <label className="form-label">事件描述</label>
                <textarea className={inputClass} rows={4} style={textareaStyle} value={form.desc} onChange={event => updateForm('desc', event.target.value)} placeholder="描述发生经过、已知影响和当前风险" />
              </div>
              <div>
                <label className="form-label">附件清单</label>
                <textarea className={inputClass} rows={3} style={textareaStyle} value={form.attachments} onChange={event => updateForm('attachments', event.target.value)} placeholder="如 现场照片.jpg、值班记录.pdf" />
              </div>
              <div>
                <label className="form-label">下一步动作</label>
                <textarea className={inputClass} rows={3} style={textareaStyle} value={form.nextStep} onChange={event => updateForm('nextStep', event.target.value)} placeholder="如 联系家属、安排复诊、补充维修复核" />
              </div>
            </div>
          </DataCard>
        </div>

        <div className="flex items-center justify-end gap-3" style={{ marginTop: 16 }}>
          <Link href="/incidents" className="btn btn-ghost btn-md">取消</Link>
          <button type="submit" className="btn btn-primary btn-md" disabled={loading}>
            {loading ? <span className="login-spinner animate-spin" /> : <><Save size={15} />提交并进入待分派</>}
          </button>
        </div>
      </form>
    </div>
  )
}