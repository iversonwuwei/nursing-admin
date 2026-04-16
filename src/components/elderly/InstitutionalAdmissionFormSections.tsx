'use client'

import { DataCard } from '@/components/nh'
import {
    CARE_LEVELS,
    COGNITIVE_LEVELS,
    ENTRUSTMENT_TYPES,
    INSTITUTIONAL_SERVICE_ITEMS,
    type AdmissionFormState,
    type CareLevel,
} from '@/lib/mock/assessment-workflow'
import { HandCoins, ShieldCheck, User } from 'lucide-react'

const inputClass = 'input'
const textareaStyle = { width: '100%', height: 'auto', padding: '10px 12px', resize: 'vertical' } as const

interface InstitutionalAdmissionFormSectionsProps {
  form: AdmissionFormState
  onChange: <K extends keyof AdmissionFormState>(key: K, value: AdmissionFormState[K]) => void
}

export function InstitutionalAdmissionFormSections({ form, onChange }: InstitutionalAdmissionFormSectionsProps) {
  function toggleServiceItem(item: string) {
    const nextItems = form.serviceItems.includes(item)
      ? form.serviceItems.filter(current => current !== item)
      : [...form.serviceItems, item]
    onChange('serviceItems', nextItems)
  }

  return (
    <>
      <DataCard icon={<User size={18} />} title="基础信息" bodyClassName="form-section">
        <div className="form-grid">
          <div>
            <label className="form-label">姓名 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input type="text" className={inputClass} placeholder="请输入姓名" value={form.name} onChange={event => onChange('name', event.target.value)} />
          </div>
          <div>
            <label className="form-label">性别 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <select className={inputClass} value={form.gender} onChange={event => onChange('gender', event.target.value as AdmissionFormState['gender'])}>
              <option value="">请选择</option>
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </div>
          <div>
            <label className="form-label">年龄 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input type="number" className={inputClass} placeholder="请输入年龄" value={form.age} onChange={event => onChange('age', event.target.value)} />
          </div>
          <div>
            <label className="form-label">申请护理等级</label>
            <select className={inputClass} value={form.requestedLevel} onChange={event => onChange('requestedLevel', event.target.value as CareLevel)}>
              {CARE_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">联系电话 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input type="tel" className={inputClass} placeholder="请输入手机号" value={form.phone} onChange={event => onChange('phone', event.target.value)} />
          </div>
          <div>
            <label className="form-label">入住房间 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input type="text" className={inputClass} placeholder="如 201-1" value={form.room} onChange={event => onChange('room', event.target.value)} />
          </div>
          <div>
            <label className="form-label">身份证号</label>
            <input type="text" className={inputClass} placeholder="18 位证件号码" value={form.identityCard} onChange={event => onChange('identityCard', event.target.value)} />
          </div>
          <div>
            <label className="form-label">出生日期</label>
            <input type="date" className={inputClass} value={form.birthDate} onChange={event => onChange('birthDate', event.target.value)} />
          </div>
          <div className="form-grid-full">
            <label className="form-label">紧急联系人 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input type="text" className={inputClass} placeholder="姓名 + 电话，如 张敏 13900001111" value={form.emergency} onChange={event => onChange('emergency', event.target.value)} />
          </div>
        </div>
      </DataCard>

      <div style={{ marginTop: 16 }}>
        <DataCard icon={<HandCoins size={18} />} title="机构委托与服务包" subtitle="机构养老场景下，入住建档、编辑和委托工作台共用同一组委托字段。" bodyClassName="form-section">
          <div className="form-grid">
            <div>
              <label className="form-label">委托类型 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <select className={inputClass} value={form.entrustmentType} onChange={event => onChange('entrustmentType', event.target.value as AdmissionFormState['entrustmentType'])}>
                <option value="">请选择</option>
                {ENTRUSTMENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">委托单位 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input type="text" className={inputClass} placeholder="如 徐汇区民政局 / 申城康养企业项目" value={form.entrustmentOrganization} onChange={event => onChange('entrustmentOrganization', event.target.value)} />
            </div>
            <div>
              <label className="form-label">月度补贴(元) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input type="number" min="0" step="0.01" className={inputClass} placeholder="如 3200" value={form.monthlySubsidy} onChange={event => onChange('monthlySubsidy', event.target.value)} />
            </div>
            <div>
              <label className="form-label">已选服务项</label>
              <div className={inputClass} style={{ display: 'flex', alignItems: 'center', minHeight: 42, color: form.serviceItems.length > 0 ? 'var(--color-text)' : 'var(--color-muted)' }}>
                {form.serviceItems.length > 0 ? `${form.serviceItems.length} 项` : '请选择固定服务项目'}
              </div>
            </div>
            <div className="form-grid-full">
              <label className="form-label">固定服务项目 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                {INSTITUTIONAL_SERVICE_ITEMS.map(item => (
                  <label
                    key={item}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 12px',
                      background: form.serviceItems.includes(item) ? 'rgba(15,23,42,0.04)' : 'var(--color-card)',
                      cursor: 'pointer',
                    }}
                  >
                    <input type="checkbox" checked={form.serviceItems.includes(item)} onChange={() => toggleServiceItem(item)} />
                    <span style={{ fontSize: 13, color: 'var(--color-text)' }}>{item}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-grid-full">
              <label className="form-label">委托补充说明</label>
              <textarea className={inputClass} rows={3} style={textareaStyle} placeholder="例如：政府托底套餐、企业团单 SLA、康复服务频次、补贴口径说明" value={form.serviceNotes} onChange={event => onChange('serviceNotes', event.target.value)} />
            </div>
          </div>
        </DataCard>
      </div>

      <div style={{ marginTop: 16 }}>
        <DataCard icon={<ShieldCheck size={18} />} title="评估输入" bodyClassName="form-section">
          <div className="form-grid">
            <div>
              <label className="form-label">ADL 评分 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input type="number" className={inputClass} placeholder="0 - 100" value={form.adlScore} onChange={event => onChange('adlScore', event.target.value)} />
            </div>
            <div>
              <label className="form-label">认知状态 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <select className={inputClass} value={form.cognitiveLevel} onChange={event => onChange('cognitiveLevel', event.target.value as AdmissionFormState['cognitiveLevel'])}>
                <option value="">请选择</option>
                {COGNITIVE_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
              </select>
            </div>
            <div className="form-grid-full">
              <label className="form-label">慢病与既往病史</label>
              <textarea className={inputClass} rows={3} style={textareaStyle} placeholder="例如：高血压、糖尿病、冠心病" value={form.chronicConditions} onChange={event => onChange('chronicConditions', event.target.value)} />
            </div>
            <div>
              <label className="form-label">长期用药</label>
              <textarea className={inputClass} rows={3} style={textareaStyle} placeholder="例如：缬沙坦、二甲双胍" value={form.medicationSummary} onChange={event => onChange('medicationSummary', event.target.value)} />
            </div>
            <div>
              <label className="form-label">过敏史</label>
              <textarea className={inputClass} rows={3} style={textareaStyle} placeholder="例如：青霉素过敏 / 无" value={form.allergySummary} onChange={event => onChange('allergySummary', event.target.value)} />
            </div>
            <div className="form-grid-full">
              <label className="form-label">风险备注</label>
              <textarea className={inputClass} rows={3} style={textareaStyle} placeholder="例如：近半年有跌倒史、吞咽困难、夜间失眠、压疮风险" value={form.riskNotes} onChange={event => onChange('riskNotes', event.target.value)} />
            </div>
          </div>
        </DataCard>
      </div>
    </>
  )
}