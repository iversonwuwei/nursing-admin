'use client'

import { DataCard, InteractionRailLayout, PageHelpCard, Tag } from '@/components/nh'
import {
    EMPTY_ORGANIZATION_FORM,
    addOrganizationDraft,
    validateOrganizationForm,
    type OrganizationCreateFormState,
} from '@/lib/mock/master-data-workflow'
import { AlertCircle, ArrowLeft, Building2, ClipboardCheck, Save, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const inputClass = 'input'
const textareaStyle = { width: '100%', height: 'auto', padding: '10px 12px', resize: 'vertical' } as const

export default function NewOrganizationPage() {
  const router = useRouter()
  const [form, setForm] = useState<OrganizationCreateFormState>(EMPTY_ORGANIZATION_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const helpHref = '/organizations/help'

  function updateForm<K extends keyof OrganizationCreateFormState>(key: K, value: OrganizationCreateFormState[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateOrganizationForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')
    const draft = addOrganizationDraft(form)
    router.push(`/organizations?selected=${draft.id}&entry=organizations-new`)
  }

  return (
    <div className="page-root animate-fade-up" style={{ maxWidth: 920, margin: '0 auto' }}>
      <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
        <Link href="/organizations" className="btn btn-ghost btn-icon-sm btn-icon">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold" style={{ letterSpacing: '-0.02em' }}>新增机构</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>录入机构主数据后，进入待启用闭环，再纳入机构台账。</p>
        </div>
      </div>

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="机构新建闭环" subtitle="首批流程为录入 -> 运营复核 -> 启用入册，避免先建无效机构。">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                {[
                  { title: '1. 主数据录入', description: '机构名称、地址、电话、床位和负责人一次录齐。', icon: <Building2 size={16} /> },
                  { title: '2. 待启用', description: '提交后先进入筹备态，不直接算入经营口径。', icon: <ClipboardCheck size={16} /> },
                  { title: '3. 人工启用', description: '运营确认后，再进入机构列表与详情台账。', icon: <ShieldCheck size={16} /> },
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
                <DataCard icon={<Building2 size={18} />} title="机构主数据" bodyClassName="form-section">
                  <div className="form-grid">
                    <div>
                      <label className="form-label">机构名称</label>
                      <input className={inputClass} value={form.name} onChange={event => updateForm('name', event.target.value)} placeholder="请输入机构名称" />
                    </div>
                    <div>
                      <label className="form-label">联系电话</label>
                      <input className={inputClass} value={form.phone} onChange={event => updateForm('phone', event.target.value)} placeholder="请输入机构电话" />
                    </div>
                    <div>
                      <label className="form-label">总床位数</label>
                      <input className={inputClass} value={form.totalBeds} onChange={event => updateForm('totalBeds', event.target.value)} placeholder="如 120" type="number" />
                    </div>
                    <div>
                      <label className="form-label">负责人</label>
                      <input className={inputClass} value={form.manager} onChange={event => updateForm('manager', event.target.value)} placeholder="请输入负责人姓名" />
                    </div>
                    <div>
                      <label className="form-label">负责人电话</label>
                      <input className={inputClass} value={form.managerPhone} onChange={event => updateForm('managerPhone', event.target.value)} placeholder="请输入负责人手机号" />
                    </div>
                    <div className="form-grid-full">
                      <label className="form-label">机构地址</label>
                      <input className={inputClass} value={form.address} onChange={event => updateForm('address', event.target.value)} placeholder="请输入机构地址" />
                    </div>
                    <div className="form-grid-full">
                      <label className="form-label">机构简介</label>
                      <textarea className={inputClass} rows={4} style={textareaStyle} value={form.description} onChange={event => updateForm('description', event.target.value)} placeholder="描述机构定位、楼层分布、配套能力或服务特色" />
                    </div>
                  </div>
                </DataCard>
              </div>

              <div className="flex items-center justify-end gap-3" style={{ marginTop: 16 }}>
                <Link href="/organizations" className="btn btn-ghost btn-md">取消</Link>
                <button type="submit" className="btn btn-primary btn-md" disabled={loading}>
                  {loading ? <span className="login-spinner animate-spin" /> : <><Save size={15} />提交并进入待启用</>}
                </button>
              </div>
            </form>
          </>
        )}
        rail={(
          <>
            <DataCard title="新建边界" subtitle="主区只保留新建闭环和表单输入。" badge={<Tag variant="warning">Boundary</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">提交后先进入待启用，不直接计入经营口径。</div>
                <div className="page-help-card-item">表单失败以当前校验提示为准，不在主区混排长说明。</div>
                <div className="page-help-card-item">完整页面定位与启用边界迁移到帮助页。</div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整机构创建说明迁移到显式帮助页"
              summary="新增机构页现在只保留新建闭环和表单字段，边界说明与使用顺序统一后置。"
              items={[
                '先录入主数据，再提交进入待启用。',
                '待启用前不进入经营与资源统计。',
                '若需要完整说明，进入机构帮助页查看。',
              ]}
              href={helpHref}
              actionLabel="查看机构帮助"
            />
          </>
        )}
      />
    </div>
  )
}