'use client'

import { DataCard, InteractionRailLayout, PageHelpCard, Tag } from '@/components/nh'
import { getMasterDataSnapshot, subscribeMasterDataWorkflow } from '@/lib/mock/master-data-workflow'
import { addStaffDraft, EMPTY_STAFF_FORM, validateStaffForm, type StaffCreateFormState } from '@/lib/mock/resource-workflow'
import { AlertCircle, ArrowLeft, ClipboardCheck, Save, ShieldCheck, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState, useSyncExternalStore } from 'react'

const inputClass = 'input'

export default function StaffNewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const scene = searchParams.get('scene')
  const [form, setForm] = useState<StaffCreateFormState>(() => ({
    ...EMPTY_STAFF_FORM,
    employmentSource: scene === 'home' ? '第三方合作' : EMPTY_STAFF_FORM.employmentSource,
  }))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const masterSnapshot = useSyncExternalStore(
    subscribeMasterDataWorkflow,
    getMasterDataSnapshot,
    getMasterDataSnapshot,
  )
  const activePartners = useMemo(
    () => masterSnapshot.partners.filter(item => item.lifecycleStatus === '已启用' && item.institutionType === '护理服务机构'),
    [masterSnapshot.partners],
  )

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
    const nextQuery = scene === 'home' ? '&scene=home' : ''
    router.push(`/staff?selected=${draft.id}&entry=staff-new${nextQuery}`)
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
                            partnerAgencyId: nextSource === '第三方合作' ? current.partnerAgencyId : '',
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
                    {form.employmentSource === '第三方合作' ? (
                      <>
                        <div>
                          <label className="form-label">护理服务机构</label>
                          <select className={inputClass} value={form.partnerAgencyId} onChange={event => updateForm('partnerAgencyId', event.target.value)}>
                            <option value="">请选择已启用护理服务机构</option>
                            {activePartners.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                          </select>
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
                  {form.employmentSource === '第三方合作' && activePartners.length === 0 ? (
                    <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--color-warning)' }}>
                      当前还没有已启用护理服务机构。请先前往 <Link href="/organizations/partners/new" className="btn-link">新增定点机构</Link> 并选择“护理服务机构”完成启用。
                    </div>
                  ) : null}
                  {form.employmentSource === '第三方合作' && activePartners.length > 0 ? (
                    <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--color-muted)' }}>
                      第三方人员仅允许绑定护理服务机构；评估机构不会出现在该选择器中。
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
                <div className="page-help-card-item">{form.employmentSource === '第三方合作' ? `已启用护理服务机构 ${activePartners.length} 家，仅允许绑定护理服务机构。` : '自营人员不要求合作机构绑定。'}</div>
                <div className="page-help-card-item">完整协同口径与帮助说明统一迁移到帮助页。</div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整员工管理说明迁移到显式帮助页"
              summary="员工新建页现在只保留录入闭环和表单字段，来源边界与协同说明统一后置。"
              items={[
                '先完成基础录入，再决定是否绑定护理服务机构。',
                '第三方合作人员仅允许进入护理服务机构口径。',
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