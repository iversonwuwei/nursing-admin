'use client'

import { DataCard, InteractionRailLayout, PageHelpCard, Tag } from '@/components/nh'
import { fetchAdminOrganizationList } from '@/lib/organizations/admin-organization-api'
import { createAdminStaff } from '@/lib/staff/admin-staff-api'
import { AlertCircle, ArrowLeft, ClipboardCheck, Save, ShieldCheck, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const inputClass = 'input'

type StaffCreateFormState = {
  name: string
  role: string
  department: string
  organizationId: string
  organizationName: string
  employmentSource: '自营' | '第三方合作'
  partnerAgencyName: string
  partnerAffiliationRole: string
  gender: '男' | '女' | ''
  phone: string
  email: string
  age: string
  hireDate: string
}

const EMPTY_STAFF_FORM: StaffCreateFormState = {
  name: '',
  role: '',
  department: '',
  organizationId: '',
  organizationName: '',
  employmentSource: '自营',
  partnerAgencyName: '',
  partnerAffiliationRole: '',
  gender: '',
  phone: '',
  email: '',
  age: '',
  hireDate: new Date().toISOString().slice(0, 10),
}

type OrganizationOption = {
  id: string
  name: string
}

function validateStaffForm(form: StaffCreateFormState) {
  if (!form.name.trim() || !form.role.trim() || !form.department.trim() || !form.gender || !form.phone.trim() || !form.email.trim() || !form.age.trim() || !form.hireDate.trim()) {
    return '请补齐姓名、角色、部门、性别、联系电话、邮箱、年龄和入职日期。'
  }

  if (form.employmentSource === '第三方合作' && !form.partnerAgencyName.trim()) {
    return '第三方合作人员需填写护理服务机构名称。'
  }

  return ''
}

export default function StaffNewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const scene = searchParams.get('scene')
  const presetOrganizationId = searchParams.get('organizationId') ?? ''
  const presetOrganizationName = searchParams.get('organizationName') ?? ''
  const [form, setForm] = useState<StaffCreateFormState>(() => ({
    ...EMPTY_STAFF_FORM,
    organizationId: presetOrganizationId,
    organizationName: presetOrganizationName,
    employmentSource: scene === 'home' ? '第三方合作' : EMPTY_STAFF_FORM.employmentSource,
  }))
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([])
  const [organizationLoadError, setOrganizationLoadError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const organizationRequired = scene !== 'home'

  useEffect(() => {
    let disposed = false

    async function loadOrganizations() {
      setOrganizationLoadError('')

      try {
        const response = await fetchAdminOrganizationList({ lifecycleStatus: '已启用', page: 1, pageSize: 200 })
        if (disposed) {
          return
        }

        const items = response.items.map(item => ({ id: item.id, name: item.name }))
        setOrganizations(items)

        setForm(current => {
          if (current.organizationId || !organizationRequired || items.length !== 1) {
            return current
          }

          return {
            ...current,
            organizationId: items[0].id,
            organizationName: items[0].name,
          }
        })
      } catch (loadError) {
        if (disposed) {
          return
        }

        setOrganizationLoadError(loadError instanceof Error ? loadError.message : '机构列表加载失败。')
        setOrganizations([])
      }
    }

    void loadOrganizations()
    return () => {
      disposed = true
    }
  }, [organizationRequired])

  function updateForm<K extends keyof StaffCreateFormState>(key: K, value: StaffCreateFormState[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateStaffForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    if (organizationRequired && !form.organizationId) {
      setError('机构养老员工必须绑定真实机构。')
      return
    }

    setLoading(true)
    setError('')

    try {
      const draft = await createAdminStaff({
        name: form.name.trim(),
        role: form.role.trim(),
        department: form.department.trim(),
        organizationId: form.organizationId || null,
        organizationName: form.organizationName || null,
        employmentSource: form.employmentSource,
        partnerAgencyId: null,
        partnerAgencyName: form.employmentSource === '第三方合作' ? form.partnerAgencyName.trim() : null,
        partnerAffiliationRole: form.employmentSource === '第三方合作' && form.partnerAffiliationRole.trim() ? form.partnerAffiliationRole.trim() : null,
        phone: form.phone.trim(),
        gender: form.gender,
        email: form.email.trim(),
        age: Number(form.age),
        hireDate: form.hireDate,
      })
      const nextQuery = scene === 'home' ? '&scene=home' : ''
      router.push(`/staff?selected=${draft.id}&entry=staff-new${nextQuery}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '员工建档失败。')
      setLoading(false)
    }
  }

  const sceneMeta = scene === 'home'
    ? {
      backHref: '/staff?scene=home',
      title: '添加协同人员',
      subtitle: '录入居家养老协同人员后，先进入待入职闭环，再纳入上门排期与服务协同。',
      workflowSubtitle: '首批流程为协同录入 -> 绑定护理服务机构 -> 人工确认 -> 纳入排期。',
    }
    : {
      backHref: '/staff',
      title: '添加员工',
      subtitle: '录入自营或第三方人员信息后，先进入待入职闭环，再纳入排班与任务口径。',
      workflowSubtitle: '首批流程为录入 -> 人工确认 -> 纳入排班，并补齐第三方归属。',
    }
  const helpHref = '/staff/help'

  return (
    <div className="page-root animate-fade-up" style={{ maxWidth: 920, margin: '0 auto' }}>
      <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
        <Link href={sceneMeta.backHref} className="btn btn-ghost btn-icon-sm btn-icon">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold" style={{ letterSpacing: '-0.02em' }}>{sceneMeta.title}</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{sceneMeta.subtitle}</p>
        </div>
      </div>

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="员工新建闭环" subtitle={sceneMeta.workflowSubtitle}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                {[
                  { title: '1. 基础录入', description: '采集姓名、角色、部门和联系方式。', icon: <UserCheck size={16} /> },
                  { title: '2. 归属确认', description: '可选择自营或第三方合作，并绑定已启用护理服务机构。', icon: <ClipboardCheck size={16} /> },
                  { title: '3. 待入职', description: '提交后先进入待入职，不立即计入在职统计。', icon: <ClipboardCheck size={16} /> },
                  { title: '4. 确认入职', description: '主管复核后再纳入排班与任务台账。', icon: <ShieldCheck size={16} /> },
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
                      <label className="form-label" htmlFor="staff-employment-source">人员来源</label>
                      <select
                        id="staff-employment-source"
                        className={inputClass}
                        value={form.employmentSource}
                        onChange={event => {
                          const nextSource = event.target.value as StaffCreateFormState['employmentSource']
                          setForm(current => ({
                            ...current,
                            employmentSource: nextSource,
                            partnerAgencyName: nextSource === '第三方合作' ? current.partnerAgencyName : '',
                            partnerAffiliationRole: nextSource === '第三方合作' ? current.partnerAffiliationRole : '',
                          }))
                        }}
                      >
                        <option value="自营">自营</option>
                        <option value="第三方合作">第三方合作</option>
                      </select>
                    </div>
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
                      <label className="form-label" htmlFor="staff-organization">所属机构{organizationRequired ? '' : '（可选）'}</label>
                      <select
                        id="staff-organization"
                        className={inputClass}
                        value={form.organizationId}
                        onChange={event => {
                          const nextOrganizationId = event.target.value
                          const selectedOrganization = organizations.find(item => item.id === nextOrganizationId)
                          setForm(current => ({
                            ...current,
                            organizationId: nextOrganizationId,
                            organizationName: selectedOrganization?.name ?? '',
                          }))
                        }}
                      >
                        <option value="">{organizationRequired ? '请选择所属机构' : '当前可不绑定机构'}</option>
                        {organizations.map(item => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                    {form.employmentSource === '第三方合作' ? (
                      <>
                        <div>
                          <label className="form-label">护理服务机构</label>
                          <input className={inputClass} value={form.partnerAgencyName} onChange={event => updateForm('partnerAgencyName', event.target.value)} placeholder="请输入护理服务机构名称" />
                        </div>
                        <div>
                          <label className="form-label">合作角色</label>
                          <input className={inputClass} value={form.partnerAffiliationRole} onChange={event => updateForm('partnerAffiliationRole', event.target.value)} placeholder="如 第三方护工" />
                        </div>
                      </>
                    ) : null}
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
                  {organizationLoadError ? (
                    <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--color-danger)' }}>
                      机构列表加载失败：{organizationLoadError}
                    </div>
                  ) : null}
                  {form.employmentSource === '第三方合作' ? (
                    <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--color-muted)' }}>
                      第三方人员会保留护理服务机构名称；若当前服务于机构养老场景，仍应绑定真实所属机构。
                    </div>
                  ) : null}
                  {organizationRequired ? (
                    <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--color-muted)' }}>
                      当前为机构养老建档，提交前必须绑定真实机构，机构详情员工 tab 将按此归属展示。
                    </div>
                  ) : null}
                </DataCard>
              </div>

              <div className="flex items-center justify-end gap-3" style={{ marginTop: 16 }}>
                <Link href={sceneMeta.backHref} className="btn btn-ghost btn-md">取消</Link>
                <button type="submit" className="btn btn-primary btn-md" disabled={loading}>
                  {loading ? <span className="login-spinner animate-spin" /> : <><Save size={15} />提交并进入待入职</>}
                </button>
              </div>
            </form>
          </>
        )}
        rail={(
          <>
            <DataCard title="录入边界" subtitle="主区只保留字段和提交动作，归属说明后置到这里。" badge={<Tag variant={scene === 'home' ? 'primary' : 'info'}>{scene === 'home' ? 'Home Care' : 'In-House'}</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">当前来源：{form.employmentSource}，提交后统一先进入待入职，再纳入排班与任务口径。</div>
                <div className="page-help-card-item">{organizationRequired ? `当前必须绑定真实机构${form.organizationName ? `：${form.organizationName}` : ''}。` : 'home 协同人员当前可暂不绑定机构主档，等待 partners 切片接通。'}</div>
                <div className="page-help-card-item">完整协同口径与帮助说明统一迁移到帮助页。</div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整员工管理说明迁移到显式帮助页"
              summary="员工新建页现在只保留录入闭环和表单字段，来源边界与协同说明统一后置。"
              items={[
                '机构养老员工提交前必须绑定真实机构。',
                '第三方合作人员仍可填写护理服务机构名称作为协同来源。',
                '如需完整协同说明，进入员工帮助页。',
              ]}
              href={helpHref}
              actionLabel="查看员工帮助"
            />
          </>
        )}
      />
    </div>
  )
}