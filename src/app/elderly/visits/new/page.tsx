'use client'

import { DataCard, InteractionRailLayout, PageHelpCard, Tag } from '@/components/nh'
import { fetchAdminElderList, type AdminElderListItemResponse } from '@/lib/elderly/admin-elderly-api'
import { createAdminVisit } from '@/lib/services/admin-visit-services'
import { AlertCircle, ArrowLeft, Save, UserCheck, Video } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useEffect, useState } from 'react'

const inputClass = 'input'

interface VisitFormState {
  elderId: string
  visitorName: string
  relation: string
  phone: string
  date: string
  time: string
  visitType: '现场' | '视频'
  notes: string
}

const EMPTY_FORM: VisitFormState = {
  elderId: '',
  visitorName: '',
  relation: '',
  phone: '',
  date: '',
  time: '',
  visitType: '现场',
  notes: '',
}

function validateForm(form: VisitFormState): string | null {
  if (!form.elderId) return '请选择老人。'
  if (!form.visitorName.trim()) return '请填写访客姓名。'
  if (!form.relation.trim()) return '请填写与老人的关系。'
  if (!form.phone.trim()) return '请填写联系电话。'
  if (!form.date) return '请选择探视日期。'
  if (!form.time) return '请选择探视时间。'
  if (!form.visitType) return '请选择探视方式。'
  return null
}

function toIsoUtc(date: string, time: string): string {
  const local = new Date(`${date}T${time}:00`)
  return local.toISOString()
}

export default function VisitsNewPage() {
  const router = useRouter()
  const [form, setForm] = useState<VisitFormState>(EMPTY_FORM)
  const [elders, setElders] = useState<AdminElderListItemResponse[] | null>(null)
  const [eldersError, setEldersError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
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

  function updateForm<K extends keyof VisitFormState>(key: K, value: VisitFormState[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await createAdminVisit({
        elderId: form.elderId,
        visitorName: form.visitorName.trim(),
        relation: form.relation.trim(),
        phone: form.phone.trim(),
        plannedAtUtc: toIsoUtc(form.date, form.time),
        visitType: form.visitType,
        notes: form.notes.trim(),
      })
      router.push(`/elderly/visits?selected=${encodeURIComponent(result.visitId)}&entry=elderly-visits-new`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '提交失败，请稍后重试。')
      setLoading(false)
    }
  }

  return (
    <div className="page-root animate-fade-up" style={{ maxWidth: 920, margin: '0 auto' }}>
      <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
        <Link href="/elderly/visits" className="btn btn-ghost btn-icon-sm btn-icon"><ArrowLeft size={16} /></Link>
        <div>
          <h1 className="text-xl font-extrabold" style={{ letterSpacing: '-0.02em' }}>预约探视</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>提交后写入 Visit Service，初始状态为待审核。</p>
        </div>
      </div>

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="探视预约闭环" subtitle="首批流程为预约 -> 待审核 -> 已登记。">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                {[
                  { title: '1. 预约登记', description: '采集老人、访客、关系和探视时间。', icon: <UserCheck size={16} /> },
                  { title: '2. 待审核', description: '提交后进入 Visit Service，状态为 Requested。', icon: <Video size={16} /> },
                  { title: '3. 通过预约', description: '审批能力待 Visit Service 补齐后开放。', icon: <UserCheck size={16} /> },
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
                <DataCard icon={<UserCheck size={18} />} title="预约信息" bodyClassName="form-section">
                  <div className="form-grid">
                    <div className="form-grid-full">
                      <label className="form-label">老人</label>
                      <select className={inputClass} value={form.elderId} onChange={event => updateForm('elderId', event.target.value)} disabled={elders === null}>
                        <option value="">{elders === null ? '加载中…' : '请选择'}</option>
                        {(elders ?? []).map(item => <option key={item.elderId} value={item.elderId}>{item.elderName}（{item.roomNumber}）</option>)}
                      </select>
                    </div>
                    <div><label className="form-label">访客</label><input className={inputClass} value={form.visitorName} onChange={event => updateForm('visitorName', event.target.value)} placeholder="请输入访客姓名" /></div>
                    <div><label className="form-label">关系</label><input className={inputClass} value={form.relation} onChange={event => updateForm('relation', event.target.value)} placeholder="如 女儿" /></div>
                    <div><label className="form-label">联系电话</label><input className={inputClass} value={form.phone} onChange={event => updateForm('phone', event.target.value)} placeholder="请输入手机号" /></div>
                    <div><label className="form-label">探视日期</label><input className={inputClass} type="date" value={form.date} onChange={event => updateForm('date', event.target.value)} /></div>
                    <div><label className="form-label">探视时间</label><input className={inputClass} type="time" value={form.time} onChange={event => updateForm('time', event.target.value)} /></div>
                    <div>
                      <label className="form-label">探视方式</label>
                      <select className={inputClass} value={form.visitType} onChange={event => updateForm('visitType', event.target.value as VisitFormState['visitType'])}>
                        <option value="现场">现场</option>
                        <option value="视频">视频</option>
                      </select>
                    </div>
                    <div className="form-grid-full"><label className="form-label">备注</label><textarea className={inputClass} value={form.notes} onChange={event => updateForm('notes', event.target.value)} placeholder="可选的探视备注" rows={3} /></div>
                  </div>
                </DataCard>
              </div>
              <div className="flex items-center justify-end gap-3" style={{ marginTop: 16 }}>
                <Link href="/elderly/visits" className="btn btn-ghost btn-md">取消</Link>
                <button type="submit" className="btn btn-primary btn-md" disabled={loading}>{loading ? <span className="login-spinner animate-spin" /> : <><Save size={15} />提交并进入待审核</>}</button>
              </div>
            </form>
          </>
        )}
        rail={(
          <>
            <DataCard title="预约边界" subtitle="主区只保留预约录入和提交动作。" badge={<Tag variant="warning">Boundary</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">提交成功后会跳转到 /elderly/visits 并选中新预约。</div>
                <div className="page-help-card-item">失败会保留表单内容并显示错误提示。</div>
                <div className="page-help-card-item">老人列表来自 /api/admin/elders 实时接口。</div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整探视预约说明迁移到显式帮助页"
              summary="预约提交已对接 Admin BFF /api/admin/visits → Visit Service /api/visits/appointments。"
              items={[
                '先选择老人，再填写访客与联系信息。',
                '日期、时间、探视方式为必填。',
                '提交后状态为 Requested，待审核能力接入中。',
              ]}
              href="/help/elderly-visits"
              actionLabel="查看页面帮助"
            />
          </>
        )}
      />
    </div>
  )
}
