'use client'

import { DataCard } from '@/components/nh'
import {
    EMPTY_ROOM_FORM,
    addRoomDraft,
    getMasterDataSnapshot,
    subscribeMasterDataWorkflow,
    validateRoomForm,
    type LiveRoom,
    type RoomCreateFormState,
} from '@/lib/mock/master-data-workflow'
import { AlertCircle, ArrowLeft, ClipboardCheck, DoorOpen, Save, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useSyncExternalStore } from 'react'

const inputClass = 'input'

export default function NewRoomPage() {
  const router = useRouter()
  const snapshot = useSyncExternalStore(
    subscribeMasterDataWorkflow,
    getMasterDataSnapshot,
    getMasterDataSnapshot,
  )
  const [form, setForm] = useState<RoomCreateFormState>(EMPTY_ROOM_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function updateForm<K extends keyof RoomCreateFormState>(key: K, value: RoomCreateFormState[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateRoomForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')
    const draft = addRoomDraft(form)
    router.push(`/rooms?selected=${draft.id}&entry=rooms-new`)
  }

  return (
    <div className="page-root animate-fade-up" style={{ maxWidth: 920, margin: '0 auto' }}>
      <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
        <Link href="/rooms" className="btn btn-ghost btn-icon-sm btn-icon">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold" style={{ letterSpacing: '-0.02em' }}>新增房间</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>录入房间主数据后，进入待启用闭环，再纳入排房资源池。</p>
        </div>
      </div>

      <DataCard title="房间新建闭环" subtitle="首批流程为录入 -> 资源复核 -> 启用可排房，避免未清洁或未核验房间提前暴露。">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { title: '1. 房间录入', description: '录入编号、楼层、机构、床位数和设施。', icon: <DoorOpen size={16} /> },
            { title: '2. 待启用', description: '提交后先进入待启用，不直接参与可入住统计。', icon: <ClipboardCheck size={16} /> },
            { title: '3. 启用入池', description: '复核后进入房间列表与详情页，并可用于后续排房。', icon: <ShieldCheck size={16} /> },
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
          <DataCard icon={<DoorOpen size={18} />} title="房间主数据" bodyClassName="form-section">
            <div className="form-grid">
              <div>
                <label className="form-label">房间编号</label>
                <input className={inputClass} value={form.id} onChange={event => updateForm('id', event.target.value)} placeholder="如 R501" />
              </div>
              <div>
                <label className="form-label">房间名称</label>
                <input className={inputClass} value={form.name} onChange={event => updateForm('name', event.target.value)} placeholder="如 康复双人间" />
              </div>
              <div>
                <label className="form-label">所属机构</label>
                <select className={inputClass} value={form.organizationId} onChange={event => updateForm('organizationId', event.target.value)}>
                  <option value="">请选择</option>
                  {snapshot.organizations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">楼层</label>
                <input className={inputClass} value={form.floor} onChange={event => updateForm('floor', event.target.value)} placeholder="如 5" type="number" />
              </div>
              <div>
                <label className="form-label">房型</label>
                <select className={inputClass} value={form.type} onChange={event => updateForm('type', event.target.value as LiveRoom['type'])}>
                  <option value="单人间">单人间</option>
                  <option value="双人间">双人间</option>
                  <option value="护理间">护理间</option>
                  <option value="套间">套间</option>
                </select>
              </div>
              <div>
                <label className="form-label">床位数</label>
                <input className={inputClass} value={form.capacity} onChange={event => updateForm('capacity', event.target.value)} placeholder="如 2" type="number" />
              </div>
              <div className="form-grid-full">
                <label className="form-label">设施清单</label>
                <input className={inputClass} value={form.facilities} onChange={event => updateForm('facilities', event.target.value)} placeholder="如 空调、独立卫浴、紧急呼叫" />
              </div>
            </div>
          </DataCard>
        </div>

        <div className="flex items-center justify-end gap-3" style={{ marginTop: 16 }}>
          <Link href="/rooms" className="btn btn-ghost btn-md">取消</Link>
          <button type="submit" className="btn btn-primary btn-md" disabled={loading}>
            {loading ? <span className="login-spinner animate-spin" /> : <><Save size={15} />提交并进入待启用</>}
          </button>
        </div>
      </form>
    </div>
  )
}