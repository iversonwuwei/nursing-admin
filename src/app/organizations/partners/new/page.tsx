'use client'

import { DataCard, InteractionRailLayout, PageHelpCard, Tag } from '@/components/nh'
import { EMPTY_PARTNER_FORM, addPartnerDraft, validatePartnerForm, type PartnerAgencyCreateFormState } from '@/lib/mock/master-data-workflow'
import { AlertCircle, ArrowLeft, Handshake, Save, ShieldCheck, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function PartnerNewPage() {
  const router = useRouter()
  const [form, setForm] = useState<PartnerAgencyCreateFormState>(EMPTY_PARTNER_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const helpHref = '/organizations/partners/help'

  function updateForm<K extends keyof PartnerAgencyCreateFormState>(key: K, value: PartnerAgencyCreateFormState[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validatePartnerForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')
    const draft = addPartnerDraft(form)
    router.push(`/organizations/partners?selected=${draft.id}&entry=partners-new`)
  }

  return (
    <div className="page-root animate-fade-up" style={{ maxWidth: 960, margin: '0 auto' }}>
      <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
        <Link href="/organizations/partners" className="btn btn-ghost btn-icon-sm btn-icon">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold" style={{ letterSpacing: '-0.02em' }}>新增定点机构</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>录入后先进入待启用，再根据机构类型进入评估认定协同或服务执行绑定。</p>
        </div>
      </div>

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="定点机构 workflow" subtitle="先录入机构类型和合作边界，再启用，再进入对应业务链路。">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                {[
                  { title: '1. 定点机构录入', description: '采集机构类型、服务类型、联系人与合同信息。', icon: <Handshake size={16} /> },
                  { title: '2. 待启用', description: '提交后先进入待启用，不立即开放给评估或执行链路。', icon: <ShieldCheck size={16} /> },
                  { title: '3. 进入链路', description: '评估机构进入认定协同，护理服务机构才能给第三方员工或护工绑定。', icon: <UserCheck size={16} /> },
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
                <DataCard icon={<Handshake size={18} />} title="定点机构主数据" bodyClassName="form-section">
                  <div className="form-grid">
              <div>
                <label className="form-label">机构名称</label>
                <input className="input" value={form.name} onChange={event => updateForm('name', event.target.value)} placeholder="请输入机构名称" />
              </div>
              <div>
                <label className="form-label">机构类型</label>
                <select
                  className="input"
                  value={form.institutionType}
                  onChange={event => {
                    const nextType = event.target.value as PartnerAgencyCreateFormState['institutionType']
                    setForm(current => ({
                      ...current,
                      institutionType: nextType,
                      serviceType: nextType === '评估机构'
                        ? '评估认定'
                        : current.serviceType === '评估认定'
                          ? '护理外包'
                          : current.serviceType,
                    }))
                  }}
                >
                  <option value="护理服务机构">护理服务机构</option>
                  <option value="评估机构">评估机构</option>
                </select>
              </div>
              <div>
                <label className="form-label">服务类型</label>
                <select className="input" value={form.serviceType} onChange={event => updateForm('serviceType', event.target.value as PartnerAgencyCreateFormState['serviceType'])}>
                  <option value="评估认定" disabled={form.institutionType !== '评估机构'}>评估认定</option>
                  <option value="护理外包">护理外包</option>
                  <option value="康复服务">康复服务</option>
                  <option value="陪诊服务">陪诊服务</option>
                  <option value="营养配餐">营养配餐</option>
                </select>
              </div>
              <div>
                <label className="form-label">服务区域</label>
                <input className="input" value={form.serviceArea} onChange={event => updateForm('serviceArea', event.target.value)} placeholder="如 浦东新区、杨浦区" />
              </div>
              <div>
                <label className="form-label">结算方式</label>
                <select className="input" value={form.settlementMode} onChange={event => updateForm('settlementMode', event.target.value as PartnerAgencyCreateFormState['settlementMode'])}>
                  <option value="按月结">按月结</option>
                  <option value="按小时">按小时</option>
                  <option value="按人次">按人次</option>
                </select>
              </div>
              <div>
                <label className="form-label">联系人</label>
                <input className="input" value={form.contactName} onChange={event => updateForm('contactName', event.target.value)} placeholder="请输入联系人姓名" />
              </div>
              <div>
                <label className="form-label">联系电话</label>
                <input className="input" value={form.contactPhone} onChange={event => updateForm('contactPhone', event.target.value)} placeholder="请输入手机号" />
              </div>
              <div>
                <label className="form-label">合同开始</label>
                <input className="input" type="date" value={form.contractStart} onChange={event => updateForm('contractStart', event.target.value)} />
              </div>
              <div>
                <label className="form-label">合同结束</label>
                <input className="input" type="date" value={form.contractEnd} onChange={event => updateForm('contractEnd', event.target.value)} />
              </div>
                  </div>
                  <div style={{ marginTop: 16, padding: '10px 12px', borderRadius: 10, background: 'var(--color-bg)', fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                    {form.institutionType === '评估机构'
                      ? '评估机构只进入长护险评估认定与复评协同，不参与第三方人员绑定。'
                      : '护理服务机构会进入第三方员工/护工绑定、服务执行和结算对账链路。'}
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <label className="form-label">合作说明</label>
                    <textarea className="input" rows={4} value={form.description} onChange={event => updateForm('description', event.target.value)} placeholder="补充服务边界、合作说明或注意事项" />
                  </div>
                </DataCard>
              </div>

              <div className="flex items-center justify-end gap-3" style={{ marginTop: 16 }}>
                <Link href="/organizations/partners" className="btn btn-ghost btn-md">取消</Link>
                <button type="submit" className="btn btn-primary btn-md" disabled={loading}>
                  {loading ? <span className="login-spinner animate-spin" /> : <><Save size={15} />提交并进入待启用</>}
                </button>
              </div>
            </form>
          </>
        )}
        rail={(
          <>
            <DataCard title="新建边界" subtitle="主区只保留定点机构录入闭环和表单。" badge={<Tag variant="warning">Boundary</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">提交后先进入待启用，不直接进入评估或执行链路。</div>
                <div className="page-help-card-item">评估机构与护理服务机构的边界以后置说明为准。</div>
                <div className="page-help-card-item">完整角色边界与协同说明迁移到帮助页。</div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整定点机构创建说明迁移到显式帮助页"
              summary="定点机构新建页现在只保留录入闭环和表单字段，协同边界与使用顺序统一后置。"
              items={[
                '先录入机构类型与合同信息，再提交进入待启用。',
                '评估机构与护理服务机构进入不同后续链路。',
                '若需要完整说明，进入定点机构帮助页查看。',
              ]}
              href={helpHref}
              actionLabel="查看定点机构帮助"
            />
          </>
        )}
      />
    </div>
  )
}