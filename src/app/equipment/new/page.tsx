'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useSyncExternalStore } from 'react'
import { DataCard } from '@/components/nh'
import { addEquipmentDraft, EMPTY_EQUIPMENT_FORM, validateEquipmentForm, type EquipmentCreateFormState } from '@/lib/mock/resource-workflow'
import { getMasterDataSnapshot, subscribeMasterDataWorkflow } from '@/lib/mock/master-data-workflow'
import { AlertCircle, ArrowLeft, ClipboardCheck, Monitor, Save, ShieldCheck } from 'lucide-react'

const inputClass = 'input'

export default function EquipmentNewPage() {
  const router = useRouter()
  const masterData = useSyncExternalStore(
    subscribeMasterDataWorkflow,
    getMasterDataSnapshot,
    getMasterDataSnapshot,
  )
  const [form, setForm] = useState<EquipmentCreateFormState>(EMPTY_EQUIPMENT_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function updateForm<K extends keyof EquipmentCreateFormState>(key: K, value: EquipmentCreateFormState[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateEquipmentForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')
    const draft = addEquipmentDraft(form)
    router.push(`/equipment?selected=${draft.id}&entry=equipment-new`)
  }

  return (
    <div className="page-root animate-fade-up" style={{ maxWidth: 920, margin: '0 auto' }}>
      <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
        <Link href="/equipment" className="btn btn-ghost btn-icon-sm btn-icon">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold" style={{ letterSpacing: '-0.02em' }}>添加设备</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>录入设备资产信息后，先进入待验收闭环，再纳入设备台账。</p>
        </div>
      </div>

      <DataCard title="设备新建闭环" subtitle="首批流程为录入 -> 资产验收 -> 纳入设备台账，避免未验收设备直接出现在巡检口径。">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { title: '1. 资产录入', description: '记录设备名称、分类、序列号和安装位置。', icon: <Monitor size={16} /> },
            { title: '2. 待验收', description: '提交后先进入待验收，不立即混入在册设备。', icon: <ClipboardCheck size={16} /> },
            { title: '3. 完成验收', description: '资产管理员确认后再纳入巡检和监控口径。', icon: <ShieldCheck size={16} /> },
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
          <DataCard icon={<Monitor size={18} />} title="设备主数据" bodyClassName="form-section">
            <div className="form-grid">
              <div>
                <label className="form-label">设备名称</label>
                <input className={inputClass} value={form.name} onChange={event => updateForm('name', event.target.value)} placeholder="请输入设备名称" />
              </div>
              <div>
                <label className="form-label">设备分类</label>
                <select className={inputClass} value={form.category} onChange={event => updateForm('category', event.target.value as EquipmentCreateFormState['category'])}>
                  <option value="医疗设备">医疗设备</option>
                  <option value="康复设备">康复设备</option>
                  <option value="生活设备">生活设备</option>
                  <option value="智能设备">智能设备</option>
                </select>
              </div>
              <div>
                <label className="form-label">型号</label>
                <input className={inputClass} value={form.model} onChange={event => updateForm('model', event.target.value)} placeholder="请输入型号" />
              </div>
              <div>
                <label className="form-label">序列号</label>
                <input className={inputClass} value={form.serialNumber} onChange={event => updateForm('serialNumber', event.target.value)} placeholder="请输入序列号" />
              </div>
              <div>
                <label className="form-label">安装位置</label>
                <input className={inputClass} value={form.location} onChange={event => updateForm('location', event.target.value)} placeholder="如 浦东店-101-1" />
              </div>
              <div>
                <label className="form-label">所属机构</label>
                <select className={inputClass} value={form.organizationId} onChange={event => updateForm('organizationId', event.target.value)}>
                  <option value="">请选择</option>
                  {masterData.organizations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">采购日期</label>
                <input className={inputClass} type="date" value={form.purchaseDate} onChange={event => updateForm('purchaseDate', event.target.value)} />
              </div>
              <div>
                <label className="form-label">维保周期（月）</label>
                <input className={inputClass} type="number" value={form.maintenanceCycle} onChange={event => updateForm('maintenanceCycle', event.target.value)} placeholder="如 12" />
              </div>
              <div className="form-grid-full">
                <label className="form-label">设备备注</label>
                <input className={inputClass} value={form.remarks} onChange={event => updateForm('remarks', event.target.value)} placeholder="可补充放置说明、使用对象或验收备注" />
              </div>
            </div>
          </DataCard>
        </div>

        <div className="flex items-center justify-end gap-3" style={{ marginTop: 16 }}>
          <Link href="/equipment" className="btn btn-ghost btn-md">取消</Link>
          <button type="submit" className="btn btn-primary btn-md" disabled={loading}>
            {loading ? <span className="login-spinner animate-spin" /> : <><Save size={15} />提交并进入待验收</>}
          </button>
        </div>
      </form>
    </div>
  )
}