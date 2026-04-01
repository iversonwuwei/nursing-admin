'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { DataCard } from '@/components/nh'
import { addStaffDraft, EMPTY_STAFF_FORM, validateStaffForm, type StaffCreateFormState } from '@/lib/mock/resource-workflow'
import { AlertCircle, ArrowLeft, ClipboardCheck, Save, ShieldCheck, UserCheck } from 'lucide-react'

const inputClass = 'input'

export default function StaffNewPage() {
  const router = useRouter()
  const [form, setForm] = useState<StaffCreateFormState>(EMPTY_STAFF_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function updateForm<K extends keyof StaffCreateFormState>(key: K, value: StaffCreateFormState[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateStaffForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')
    const draft = addStaffDraft(form)
    router.push(`/staff?selected=${draft.id}&entry=staff-new`)
  }

  return (
    <div className="page-root animate-fade-up" style={{ maxWidth: 920, margin: '0 auto' }}>
      <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
        <Link href="/staff" className="btn btn-ghost btn-icon-sm btn-icon">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold" style={{ letterSpacing: '-0.02em' }}>添加员工</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>录入基础人事信息后，先进入待入职闭环，再纳入排班与任务口径。</p>
        </div>
      </div>

      <DataCard title="员工新建闭环" subtitle="首批流程为录入 -> 人工确认 -> 纳入排班，避免直接混入在岗统计。">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { title: '1. 基础录入', description: '采集姓名、角色、部门和联系方式。', icon: <UserCheck size={16} /> },
            { title: '2. 待入职', description: '提交后先进入待入职，不立即计入在职统计。', icon: <ClipboardCheck size={16} /> },
            { title: '3. 确认入职', description: '主管复核后再纳入排班与任务台账。', icon: <ShieldCheck size={16} /> },
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
          <DataCard icon={<UserCheck size={18} />} title="员工主数据" bodyClassName="form-section">
            <div className="form-grid">
              <div>
                <label className="form-label">姓名</label>
                <input className={inputClass} value={form.name} onChange={event => updateForm('name', event.target.value)} placeholder="请输入姓名" />
              </div>
              <div>
                <label className="form-label">角色</label>
                <input className={inputClass} value={form.role} onChange={event => updateForm('role', event.target.value)} placeholder="如 护士" />
              </div>
              <div>
                <label className="form-label">部门</label>
                <input className={inputClass} value={form.department} onChange={event => updateForm('department', event.target.value)} placeholder="如 护理部" />
              </div>
              <div>
                <label className="form-label">性别</label>
                <select className={inputClass} value={form.gender} onChange={event => updateForm('gender', event.target.value as StaffCreateFormState['gender'])}>
                  <option value="">请选择</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>
              <div>
                <label className="form-label">联系电话</label>
                <input className={inputClass} value={form.phone} onChange={event => updateForm('phone', event.target.value)} placeholder="请输入手机号" />
              </div>
              <div>
                <label className="form-label">邮箱</label>
                <input className={inputClass} value={form.email} onChange={event => updateForm('email', event.target.value)} placeholder="请输入邮箱" />
              </div>
              <div>
                <label className="form-label">年龄</label>
                <input className={inputClass} type="number" value={form.age} onChange={event => updateForm('age', event.target.value)} placeholder="如 32" />
              </div>
              <div>
                <label className="form-label">入职日期</label>
                <input className={inputClass} type="date" value={form.hireDate} onChange={event => updateForm('hireDate', event.target.value)} />
              </div>
            </div>
          </DataCard>
        </div>

        <div className="flex items-center justify-end gap-3" style={{ marginTop: 16 }}>
          <Link href="/staff" className="btn btn-ghost btn-md">取消</Link>
          <button type="submit" className="btn btn-primary btn-md" disabled={loading}>
            {loading ? <span className="login-spinner animate-spin" /> : <><Save size={15} />提交并进入待入职</>}
          </button>
        </div>
      </form>
    </div>
  )
}