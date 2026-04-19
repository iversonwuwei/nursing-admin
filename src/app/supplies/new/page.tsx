'use client'

import { DataCard, InteractionRailLayout, PageHelpCard, Tag } from '@/components/nh'
import { EMPTY_SUPPLY_INTAKE_FORM, validateSupplyIntakeForm, type SupplyIntakeFormState } from '@/lib/mock/resource-workflow'
import { createAdminSupplyIntake, fetchAdminSupplies, type AdminSupplyRecord } from '@/lib/services/admin-operations-services'
import { AlertCircle, ArrowLeft, ClipboardCheck, Package, Save, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const inputClass = 'input'

export default function SuppliesNewPage() {
  const router = useRouter()
  const [supplies, setSupplies] = useState<AdminSupplyRecord[]>([])
  const [form, setForm] = useState<SupplyIntakeFormState>(EMPTY_SUPPLY_INTAKE_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const helpHref = '/supplies/help'

  useEffect(() => {
    let active = true

    fetchAdminSupplies({ page: 1, pageSize: 200 })
      .then(response => {
        if (active) {
          setSupplies(response.items)
        }
      })
      .catch(() => {
        if (active) {
          setSupplies([])
        }
      })

    return () => {
      active = false
    }
  }, [])

  function updateForm<K extends keyof SupplyIntakeFormState>(key: K, value: SupplyIntakeFormState[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateSupplyIntakeForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')
    try {
      const record = await createAdminSupplyIntake({
        existingId: form.existingId || undefined,
        name: form.name || undefined,
        category: form.category || undefined,
        unit: form.unit || undefined,
        quantity: Number(form.quantity),
        minStock: form.minStock ? Number(form.minStock) : undefined,
        price: form.price || undefined,
        supplier: form.supplier || undefined,
        contact: form.contact || undefined,
      })
      router.push(`/supplies?selected=${record.id}&entry=supplies-new`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '物资入库失败。')
      setLoading(false)
    }
  }

  return (
    <div className="page-root animate-fade-up" style={{ maxWidth: 920, margin: '0 auto' }}>
      <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
        <Link href="/supplies" className="btn btn-ghost btn-icon-sm btn-icon">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold" style={{ letterSpacing: '-0.02em' }}>采购入库</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>支持补货现有物资或录入新物资品类，统一回流库存台账。</p>
        </div>
      </div>

      <InteractionRailLayout
        main={(
          <>
            <DataCard title="物资入库闭环" subtitle="首批流程为入库 -> 待上架 -> 纳入库存，避免刚到货物资直接混入口径。">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                {[
                  { title: '1. 入库登记', description: '支持现有物资补货和新增物资录入。', icon: <Package size={16} /> },
                  { title: '2. 待上架', description: '提交后先进入待上架，避免直接影响稳定库存。', icon: <ClipboardCheck size={16} /> },
                  { title: '3. 确认上架', description: '仓储确认后再纳入库存统计和缺货判断。', icon: <ShieldCheck size={16} /> },
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
                <DataCard icon={<Package size={18} />} title="采购与入库信息" bodyClassName="form-section">
                  <div className="form-grid">
                    <div className="form-grid-full">
                      <label className="form-label">补货现有物资</label>
                      <select className={inputClass} value={form.existingId} onChange={event => updateForm('existingId', event.target.value)}>
                        <option value="">不选择则视为新增物资</option>
                        {supplies.map(item => <option key={item.id} value={item.id}>{item.name} ({item.id})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">物资名称</label>
                      <input className={inputClass} value={form.name} onChange={event => updateForm('name', event.target.value)} placeholder="新增物资时填写" />
                    </div>
                    <div>
                      <label className="form-label">分类</label>
                      <input className={inputClass} value={form.category} onChange={event => updateForm('category', event.target.value)} placeholder="如 护理用品" />
                    </div>
                    <div>
                      <label className="form-label">单位</label>
                      <input className={inputClass} value={form.unit} onChange={event => updateForm('unit', event.target.value)} placeholder="如 包 / 盒" />
                    </div>
                    <div>
                      <label className="form-label">入库数量</label>
                      <input className={inputClass} type="number" value={form.quantity} onChange={event => updateForm('quantity', event.target.value)} placeholder="如 30" />
                    </div>
                    <div>
                      <label className="form-label">最低库存</label>
                      <input className={inputClass} type="number" value={form.minStock} onChange={event => updateForm('minStock', event.target.value)} placeholder="如 50" />
                    </div>
                    <div>
                      <label className="form-label">单价</label>
                      <input className={inputClass} value={form.price} onChange={event => updateForm('price', event.target.value)} placeholder="如 ¥38" />
                    </div>
                    <div>
                      <label className="form-label">供应商</label>
                      <input className={inputClass} value={form.supplier} onChange={event => updateForm('supplier', event.target.value)} placeholder="请输入供应商" />
                    </div>
                    <div className="form-grid-full">
                      <label className="form-label">联系人</label>
                      <input className={inputClass} value={form.contact} onChange={event => updateForm('contact', event.target.value)} placeholder="如 李经理 13800001234" />
                    </div>
                  </div>
                </DataCard>
              </div>

              <div className="flex items-center justify-end gap-3" style={{ marginTop: 16 }}>
                <Link href="/supplies" className="btn btn-ghost btn-md">取消</Link>
                <button type="submit" className="btn btn-primary btn-md" disabled={loading}>
                  {loading ? <span className="login-spinner animate-spin" /> : <><Save size={15} />提交并进入待上架</>}
                </button>
              </div>
            </form>
          </>
        )}
        rail={(
          <>
            <DataCard title="入库边界" subtitle="主区只保留表单与提交动作，补货模式和上架边界后置到这里。" badge={<Tag variant={form.existingId ? 'info' : 'primary'}>{form.existingId ? 'Restock' : 'New Item'}</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">当前模式：{form.existingId ? '补货现有物资' : '新增物资品类'}，库存目录共 {supplies.length} 种物资。</div>
                <div className="page-help-card-item">提交后统一先进入待上架，确认前不直接计入稳定库存口径。</div>
                <div className="page-help-card-item">完整补货与采购边界说明统一迁移到帮助页。</div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整物资管理说明迁移到显式帮助页"
              summary="采购入库页现在只保留入库闭环和表单字段，补货模式与上架边界统一后置。"
              items={[
                '先判断是补货现有物资还是新增物资品类。',
                '提交后先进入待上架，再由列表页确认上架。',
                '如需完整库存治理说明，进入物资帮助页。',
              ]}
              href={helpHref}
              actionLabel="查看物资帮助"
            />
          </>
        )}
      />
    </div>
  )
}