'use client'

import { DataCard, InteractionRailLayout, PageHelpCard, Tag } from '@/components/nh'
import { fetchAdminOrganizationList, type AdminOrganizationSummary } from '@/lib/organizations/admin-organization-api'
import { createAdminRoom, type AdminRoomCreateRequest } from '@/lib/rooms/admin-room-api'
import { AlertCircle, ArrowLeft, ClipboardCheck, DoorOpen, Save, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const inputClass = 'input'

type RoomCreateFormState = {
    roomId: string
    name: string
    organizationId: string
    organizationName: string
    floor: string
    type: AdminRoomCreateRequest['type']
    capacity: string
    facilities: string
}

const EMPTY_ROOM_FORM: RoomCreateFormState = {
    roomId: '',
    name: '',
    organizationId: '',
    organizationName: '',
    floor: '',
    type: '双人间',
    capacity: '',
    facilities: '',
}

function validateRoomForm(form: RoomCreateFormState) {
    if (!form.roomId.trim() || !form.name.trim() || !form.organizationId.trim() || !form.organizationName.trim() || !form.floor.trim() || !form.capacity.trim()) {
        return '请先补齐房间编号、房间名称、所属机构、楼层和床位数。'
    }

    const floor = Number(form.floor)
    const capacity = Number(form.capacity)
    if (Number.isNaN(floor) || floor < 1 || floor > 20) {
        return '楼层需填写为 1 到 20 之间的有效数字。'
    }

    if (Number.isNaN(capacity) || capacity < 1 || capacity > 8) {
        return '床位数需填写为 1 到 8 之间的有效数字。'
    }

    return ''
}

function splitFacilities(value: string) {
    return value
        .split(/[、,，]/)
        .map(item => item.trim())
        .filter(Boolean)
}

export default function NewRoomPage() {
    const router = useRouter()
  const [form, setForm] = useState<RoomCreateFormState>(EMPTY_ROOM_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
    const [organizations, setOrganizations] = useState<AdminOrganizationSummary[]>([])
    const [organizationsLoading, setOrganizationsLoading] = useState(true)

    useEffect(() => {
        let active = true

        async function loadOrganizations() {
            setOrganizationsLoading(true)

            try {
                const response = await fetchAdminOrganizationList({ lifecycleStatus: '已启用', page: 1, pageSize: 100 })
                if (!active) {
                    return
                }

                setOrganizations(response.items)
            } catch (loadError) {
                if (!active) {
                    return
                }

                setError(loadError instanceof Error ? loadError.message : '机构列表查询失败。')
            } finally {
                if (active) {
                    setOrganizationsLoading(false)
                }
            }
        }

        void loadOrganizations()
        return () => {
            active = false
        }
    }, [])

  function updateForm<K extends keyof RoomCreateFormState>(key: K, value: RoomCreateFormState[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

    function handleOrganizationChange(organizationId: string) {
        const selected = organizations.find(item => item.id === organizationId)
        setForm(current => ({
            ...current,
            organizationId,
            organizationName: selected?.name ?? '',
        }))
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateRoomForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')

      try {
          const room = await createAdminRoom({
              roomId: form.roomId.trim(),
              name: form.name.trim(),
              organizationId: form.organizationId.trim() || null,
              organizationName: form.organizationName.trim(),
              floor: Number(form.floor),
              type: form.type,
              capacity: Number(form.capacity),
              facilities: splitFacilities(form.facilities),
          })
          router.push(`/rooms?selected=${room.id}&entry=rooms-new`)
      } catch (submitError) {
          setError(submitError instanceof Error ? submitError.message : '房间建档失败。')
          setLoading(false)
      }
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

      <InteractionRailLayout
        main={(
          <>
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
                                          <input className={inputClass} value={form.roomId} onChange={event => updateForm('roomId', event.target.value)} placeholder="如 R501" />
                    </div>
                    <div>
                      <label className="form-label">房间名称</label>
                      <input className={inputClass} value={form.name} onChange={event => updateForm('name', event.target.value)} placeholder="如 康复双人间" />
                    </div>
                    <div>
                      <label className="form-label">所属机构</label>
                                          <select className={inputClass} value={form.organizationId} onChange={event => handleOrganizationChange(event.target.value)} disabled={organizationsLoading || organizations.length === 0}>
                                              <option value="">{organizationsLoading ? '正在加载机构...' : organizations.length === 0 ? '请先新增并启用机构' : '请选择机构'}</option>
                                              {organizations.map(org => (
                                                  <option key={org.id} value={org.id}>{org.name}</option>
                                              ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">楼层</label>
                      <input className={inputClass} value={form.floor} onChange={event => updateForm('floor', event.target.value)} placeholder="如 5" type="number" />
                    </div>
                    <div>
                      <label className="form-label">房型</label>
                                          <select className={inputClass} value={form.type} onChange={event => updateForm('type', event.target.value as RoomCreateFormState['type'])}>
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
          </>
        )}
        rail={(
          <>
            <DataCard title="创建边界" subtitle="主区只保留录入和提交动作，房间启用口径后置到这里。" badge={<Tag variant="info">Room Intake</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                        <div className="page-help-card-item">机构归属改为读取真实已启用机构列表，不再通过文本字段直录。</div>
                        <div className="page-help-card-item">提交后统一先进入待启用，不直接参与可入住统计。</div>
                        <div className="page-help-card-item">启用动作只改变房间资源可见性，不自动分配入住对象。</div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整房间管理说明迁移到显式帮助页"
              summary="新增房间页现在只保留新建闭环和表单字段，机构覆盖与启用边界统一后置。"
              items={[
                '先录入房间主数据，再提交进入待启用。',
                '待启用房间不直接进入排房资源池。',
                '如需完整承接说明，进入房间帮助页。',
              ]}
                    href="/rooms/help"
              actionLabel="查看房间帮助"
            />
          </>
        )}
      />
    </div>
  )
}