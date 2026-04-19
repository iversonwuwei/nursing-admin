'use client'

import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, Tag } from '@/components/nh'
import { createAdminHealthArchive, fetchAdminElderList, type AdminElderListItemResponse } from '@/lib/elderly/admin-elderly-api'
import { AlertCircle, ArrowLeft, ClipboardCheck, FileHeart, Save, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type FormEvent } from 'react'

const inputClass = 'input'

type HealthArchiveFormState = {
  elderId: string
  bloodPressure: string
  heartRate: string
  temperature: string
  bloodSugar: string
  oxygen: string
  riskSummary: string
}

const EMPTY_FORM: HealthArchiveFormState = {
  elderId: '',
  bloodPressure: '',
  heartRate: '',
  temperature: '',
  bloodSugar: '',
  oxygen: '',
  riskSummary: '',
}

function validateHealthArchiveForm(form: HealthArchiveFormState) {
  if (!form.elderId) {
    return '请选择要建档的老人。'
  }

  if (!/^\d{2,3}\/\d{2,3}$/.test(form.bloodPressure.trim())) {
    return '请输入正确的血压格式，例如 135/85。'
  }

  if (Number.isNaN(Number(form.heartRate)) || Number(form.heartRate) <= 0) {
    return '请输入正确的心率。'
  }

  if (Number.isNaN(Number(form.temperature)) || Number(form.temperature) <= 0) {
    return '请输入正确的体温。'
  }

  if (Number.isNaN(Number(form.bloodSugar)) || Number(form.bloodSugar) <= 0) {
    return '请输入正确的血糖。'
  }

  if (Number.isNaN(Number(form.oxygen)) || Number(form.oxygen) <= 0) {
    return '请输入正确的血氧。'
  }

  return ''
}

export default function HealthArchiveNewPage() {
  const router = useRouter()
  const [form, setForm] = useState<HealthArchiveFormState>(EMPTY_FORM)
  const [elderOptions, setElderOptions] = useState<AdminElderListItemResponse[]>([])
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const helpHref = '/elderly/help'

  useEffect(() => {
    let active = true

    async function loadOptions() {
      try {
        setOptionsLoading(true)
        const response = await fetchAdminElderList({ page: 1, pageSize: 200 })
        if (!active) {
          return
        }

        setElderOptions(response.items)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : '老人列表读取失败。')
      } finally {
        if (active) {
          setOptionsLoading(false)
        }
      }
    }

    void loadOptions()

    return () => {
      active = false
    }
  }, [])

  const selectedElder = useMemo(
    () => elderOptions.find(item => item.elderId === form.elderId) ?? null,
    [elderOptions, form.elderId],
  )

  function updateForm<K extends keyof HealthArchiveFormState>(key: K, value: HealthArchiveFormState[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateHealthArchiveForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')
    try {
      const record = await createAdminHealthArchive({
        elderId: form.elderId,
        bloodPressure: form.bloodPressure.trim(),
        heartRate: Number(form.heartRate),
        temperature: Number(form.temperature),
        bloodSugar: Number(form.bloodSugar),
        oxygen: Number(form.oxygen),
        riskSummary: form.riskSummary.trim() || undefined,
      })

      router.push(`/elderly/health?selected=${record.elderId}&entry=elderly-health-new`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '健康建档失败。')
      setLoading(false)
    }
  }

  return (
    <div className="page-root animate-fade-up" style={{ maxWidth: 920, margin: '0 auto' }}>
      <PageHeader
        title="新建健康档案"
        subtitle="直接写入 Health Service 真实健康档案，不再进入本地待建档 workflow。"
        actions={<Link href="/elderly/health" className="btn btn-ghost btn-sm"><ArrowLeft size={16} />返回档案页</Link>}
      />

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="健康建档闭环" subtitle="首批流程为选择老人 -> 写入 Health Service -> 回流健康档案页。">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                {[
                  { title: '1. 选择老人', description: '基于 Elder Service 实时主档建立健康档案。', icon: <FileHeart size={16} /> },
                  { title: '2. 写入档案', description: '提交后直接写入 Health Service，不再停留在本地待建档状态。', icon: <ClipboardCheck size={16} /> },
                  { title: '3. 回流列表', description: '成功后立即返回健康档案页，验证新对象已从真实接口读出。', icon: <ShieldCheck size={16} /> },
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
                      <select className={inputClass} value={form.elderId} onChange={event => updateForm('elderId', event.target.value)} disabled={optionsLoading || elderOptions.length === 0}>
                  <option value="">请选择</option>
                        {elderOptions.map(item => <option key={item.elderId} value={item.elderId}>{item.elderName} ({item.roomNumber})</option>)}
                </select>
                      {optionsLoading ? <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-muted)' }}>正在同步 Elder Service 主档...</div> : null}
                      {!optionsLoading && elderOptions.length === 0 ? <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-warning)' }}>当前没有可建档的老人主档。</div> : null}
              </div>
                    <div><label className="form-label">血压</label><input className={inputClass} value={form.bloodPressure} onChange={event => updateForm('bloodPressure', event.target.value)} placeholder="如 135/85" /></div>
                    <div><label className="form-label">心率</label><input className={inputClass} value={form.heartRate} onChange={event => updateForm('heartRate', event.target.value)} placeholder="如 72" /></div>
                    <div><label className="form-label">体温</label><input className={inputClass} value={form.temperature} onChange={event => updateForm('temperature', event.target.value)} placeholder="如 36.5" /></div>
              <div><label className="form-label">血糖</label><input className={inputClass} value={form.bloodSugar} onChange={event => updateForm('bloodSugar', event.target.value)} placeholder="如 5.8" /></div>
                    <div><label className="form-label">血氧</label><input className={inputClass} value={form.oxygen} onChange={event => updateForm('oxygen', event.target.value)} placeholder="如 97" /></div>
                    <div className="form-grid-full"><label className="form-label">风险摘要</label><input className={inputClass} value={form.riskSummary} onChange={event => updateForm('riskSummary', event.target.value)} placeholder="如 夜间低氧，需持续观察，可留空" /></div>
                  </div>
                </DataCard>
              </div>
              <div className="flex items-center justify-end gap-3" style={{ marginTop: 16 }}>
                <Link href="/elderly/health" className="btn btn-ghost btn-md">取消</Link>
                <button type="submit" className="btn btn-primary btn-md" disabled={loading || optionsLoading || elderOptions.length === 0}>{loading ? <span className="login-spinner animate-spin" /> : <><Save size={15} />提交并写入健康档案</>}</button>
              </div>
            </form>
          </>
        )}
        rail={(
          <>
            <DataCard title="新建边界" subtitle="主区只保留建档表单与提交动作。" badge={<Tag variant="warning">Boundary</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">提交后直接写入 Health Service，并通过健康档案列表回流验证。</div>
                <div className="page-help-card-item">老人下拉来自 Elder Service 主档，避免继续选择本地静态老人台账。</div>
                <div className="page-help-card-item">{selectedElder ? `当前选择：${selectedElder.elderName} · ${selectedElder.roomNumber}` : '请选择一个实时主档对象后再录入健康指标。'}</div>
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