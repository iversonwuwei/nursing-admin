'use client'

import { DataCard, PageHeader, Tag } from '@/components/nh'
import {
    addAdmissionApplication,
    validateAdmissionForm,
    type AdmissionFormState,
} from '@/lib/mock/assessment-workflow'
import {
    getImportTemplateOptions,
    mapFilesToUploadMeta,
    simulateDocumentAiExtraction,
    type DocumentAiExtractionResult,
    type DocumentImportFormState,
    type UploadedDocumentMeta,
} from '@/lib/mock/elderly-document-intake'
import {
    AlertCircle,
    ArrowLeft,
    Bot,
    FileStack,
    Save,
    ScanSearch,
    ShieldCheck,
    Upload,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const TEMPLATE_OPTIONS = getImportTemplateOptions()
const inputClass = 'input'
const textareaStyle = { width: '100%', height: 'auto', padding: '10px 12px', resize: 'vertical' } as const

export default function ElderlyImportPage() {
  const router = useRouter()
  const [templateId, setTemplateId] = useState('')
  const [rawText, setRawText] = useState('')
  const [operatorNotes, setOperatorNotes] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedDocumentMeta[]>([])
  const [draftForm, setDraftForm] = useState<DocumentImportFormState | null>(null)
  const [extraction, setExtraction] = useState<DocumentAiExtractionResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function updateDraft<K extends keyof DocumentImportFormState>(key: K, value: DocumentImportFormState[K]) {
    setDraftForm(current => current ? { ...current, [key]: value } : current)
  }

  function handleRecognize() {
    if (!templateId && !rawText.trim() && uploadedFiles.length === 0) {
      setError('请至少选择一个资料包模板、上传一份文件或粘贴 OCR/病历摘要后再开始识别。')
      return
    }

    const result = simulateDocumentAiExtraction({
      templateId: templateId || undefined,
      rawText,
      operatorNotes,
      uploadedFiles,
    })
    setExtraction(result)
    setDraftForm(result.form)
    setError('')
  }

  function handleSubmit() {
    if (!draftForm || !extraction) {
      setError('请先完成一次 AI 识别，并确认识别结果。')
      return
    }

    const validationError = validateAdmissionForm(draftForm as AdmissionFormState)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    const application = addAdmissionApplication(draftForm, {
      sourceType: 'document-import',
      sourceLabel: '资料导入',
      sourceDocumentNames: extraction.documentNames,
      sourceSummary: extraction.archiveSummary,
    })
    router.push(`/elderly/checkin?selected=${application.id}&entry=elderly-import`)
  }

  return (
    <div className="page-root animate-fade-up" style={{ maxWidth: 1160, margin: '0 auto' }}>
      <PageHeader
        title="资料导入"
        subtitle="上传身份资料与健康资料后，先由 AI 生成结构化草稿，再进入个案评定闭环。"
        actions={<Tag variant="primary">AI 识别后仍需人工复核</Tag>}
      />

      <DataCard icon={<ShieldCheck size={18} />} title="本次交付边界" subtitle="先落地单人资料包导入，不直接写正式后端服务。">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { title: '1. 上传资料', description: '支持上传扫描件/病历文件，并保留文件名作为来源审计。', icon: <Upload size={16} /> },
            { title: '2. AI 抽取', description: '从模板、OCR 摘要和文件线索提取身份字段、病史和照护风险。', icon: <ScanSearch size={16} /> },
            { title: '3. 人工复核', description: '护理主管补齐缺失字段，避免把低置信度内容直接入档。', icon: <ShieldCheck size={16} /> },
            { title: '4. 写入闭环', description: '确认后进入个案评定页，继续人工认定与结论生成。', icon: <Bot size={16} /> },
          ].map(item => (
            <div key={item.title} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 14, background: 'var(--color-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                {item.icon}
                {item.title}
              </div>
              <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{item.description}</div>
            </div>
          ))}
        </div>
      </DataCard>

      <div className="dashboard-grid-2" style={{ marginTop: 16, alignItems: 'start' }}>
        <DataCard icon={<FileStack size={18} />} title="资料输入" subtitle="选择资料包模板，或直接上传文件并粘贴 OCR/病历摘要。">
          <div className="form-section">
            <div className="form-grid">
              <div className="form-grid-full">
                <label className="form-label">资料包模板</label>
                <div className="select-wrap" style={{ width: '100%' }}>
                  <select className="select" style={{ width: '100%' }} value={templateId} onChange={event => setTemplateId(event.target.value)} aria-label="资料包模板">
                    <option value="">不使用模板，直接识别上传资料</option>
                    {TEMPLATE_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                  </select>
                  <span className="select-arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg></span>
                </div>
                {templateId ? (
                  <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                    {TEMPLATE_OPTIONS.find(option => option.id === templateId)?.description}
                  </div>
                ) : null}
              </div>

              <div className="form-grid-full">
                <label className="form-label">上传资料</label>
                <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.txt" onChange={event => setUploadedFiles(mapFilesToUploadMeta(event.target.files))} />
                <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                  当前 demo 使用文件名、模板和 OCR 摘要模拟识别来源；后续接真实 OCR/对象存储时保持同一路径。
                </div>
              </div>

              <div className="form-grid-full">
                <label className="form-label">OCR / 病历摘要</label>
                <textarea
                  className={inputClass}
                  rows={8}
                  style={textareaStyle}
                  placeholder="可粘贴 OCR、病历摘要、身份证识别文本，例如：姓名：张秀英；年龄：82；ADL：52；慢病：高血压、糖尿病。"
                  value={rawText}
                  onChange={event => setRawText(event.target.value)}
                />
              </div>

              <div className="form-grid-full">
                <label className="form-label">人工补充备注</label>
                <textarea
                  className={inputClass}
                  rows={4}
                  style={textareaStyle}
                  placeholder="可补充缺页、模糊字段、家属电话变更、房间预分配等人工线索。"
                  value={operatorNotes}
                  onChange={event => setOperatorNotes(event.target.value)}
                />
              </div>
            </div>

            {uploadedFiles.length > 0 ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {uploadedFiles.map(file => (
                  <div key={file.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', background: 'var(--color-bg)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{file.name}</div>
                      <div style={{ marginTop: 4, fontSize: 12, color: 'var(--color-muted)' }}>{file.typeLabel}</div>
                    </div>
                    <Tag variant="neutral">{file.sizeLabel}</Tag>
                  </div>
                ))}
              </div>
            ) : null}

            {error ? (
              <div className="form-error">
                <AlertCircle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
                <span className="form-error-text">{error}</span>
              </div>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <Link href="/elderly" className="btn btn-ghost btn-md">
                <ArrowLeft size={14} />返回列表
              </Link>
              <button className="btn btn-primary btn-md" onClick={handleRecognize}>
                <ScanSearch size={15} />开始AI识别
              </button>
            </div>
          </div>
        </DataCard>

        <DataCard icon={<Bot size={18} />} title="AI 识别结果" subtitle="低置信度和缺失字段不会自动写入，必须先人工确认。" badge={<Tag variant={extraction ? 'success' : 'neutral'}>{extraction ? '已识别' : '待识别'}</Tag>}>
          {extraction && draftForm ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ border: '1px solid rgba(13,148,136,0.18)', borderRadius: 'var(--radius-md)', background: 'rgba(13,148,136,0.06)', padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 6 }}>识别置信度</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-primary)' }}>{extraction.confidence}%</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 6 }}>字段覆盖率</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)' }}>{extraction.coverage}%</div>
                  </div>
                </div>
                <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.7, color: 'var(--color-text)' }}>{extraction.archiveSummary}</div>
                <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Tag variant="warning">建议等级 {extraction.recommendedLevel}</Tag>
                  {extraction.focusTags.map(tag => <Tag key={tag} variant="info">{tag}</Tag>)}
                </div>
              </div>

              <div style={{ display: 'grid', gap: 8 }}>
                {extraction.reasons.map(reason => (
                  <div key={reason} style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)', fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>{reason}</div>
                ))}
              </div>

              <div style={{ display: 'grid', gap: 8 }}>
                {extraction.healthInsights.map(item => (
                  <div key={item} className="info-row"><span className="info-label">结构化摘要</span><span className="info-value">{item}</span></div>
                ))}
              </div>

              {extraction.missingFields.length > 0 ? (
                <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-danger)' }}>
                  待人工补齐：{extraction.missingFields.join('、')}
                </div>
              ) : null}
            </div>
          ) : (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13, lineHeight: 1.8, color: 'var(--color-muted)' }}>
              先上传资料或粘贴 OCR 摘要，再触发一次 AI 识别。
            </div>
          )}
        </DataCard>
      </div>

      {draftForm ? (
        <div style={{ marginTop: 16 }}>
          <DataCard icon={<ShieldCheck size={18} />} title="人工复核后写入个案评定" subtitle="这里是可编辑草稿，确认后写入共享 workflow store，并跳转到评定受理页。">
            <div className="form-section">
              <div className="form-grid">
                <div>
                  <label className="form-label">姓名</label>
                  <input className={inputClass} value={draftForm.name} onChange={event => updateDraft('name', event.target.value)} />
                </div>
                <div>
                  <label className="form-label">身份证号</label>
                  <input className={inputClass} value={draftForm.identityCard} onChange={event => updateDraft('identityCard', event.target.value)} />
                </div>
                <div>
                  <label className="form-label">出生日期</label>
                  <input type="date" className={inputClass} value={draftForm.birthDate} onChange={event => updateDraft('birthDate', event.target.value)} />
                </div>
                <div>
                  <label className="form-label">年龄</label>
                  <input type="number" className={inputClass} value={draftForm.age} onChange={event => updateDraft('age', event.target.value)} />
                </div>
                <div>
                  <label className="form-label">性别</label>
                  <div className="select-wrap" style={{ width: '100%' }}>
                    <select className="select" style={{ width: '100%' }} value={draftForm.gender} onChange={event => updateDraft('gender', event.target.value as DocumentImportFormState['gender'])}>
                      <option value="">请选择</option>
                      <option value="男">男</option>
                      <option value="女">女</option>
                    </select>
                    <span className="select-arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg></span>
                  </div>
                </div>
                <div>
                  <label className="form-label">联系电话</label>
                  <input className={inputClass} value={draftForm.phone} onChange={event => updateDraft('phone', event.target.value)} />
                </div>
                <div>
                  <label className="form-label">紧急联系人</label>
                  <input className={inputClass} value={draftForm.emergency} onChange={event => updateDraft('emergency', event.target.value)} />
                </div>
                <div>
                  <label className="form-label">入住房间</label>
                  <input className={inputClass} value={draftForm.room} onChange={event => updateDraft('room', event.target.value)} />
                </div>
                <div>
                  <label className="form-label">申请护理等级</label>
                  <input className={inputClass} value={draftForm.requestedLevel} onChange={event => updateDraft('requestedLevel', event.target.value as DocumentImportFormState['requestedLevel'])} />
                </div>
                <div>
                  <label className="form-label">ADL 评分</label>
                  <input type="number" className={inputClass} value={draftForm.adlScore} onChange={event => updateDraft('adlScore', event.target.value)} />
                </div>
                <div>
                  <label className="form-label">认知状态</label>
                  <div className="select-wrap" style={{ width: '100%' }}>
                    <select className="select" style={{ width: '100%' }} value={draftForm.cognitiveLevel} onChange={event => updateDraft('cognitiveLevel', event.target.value as DocumentImportFormState['cognitiveLevel'])}>
                      <option value="">请选择</option>
                      <option value="清晰">清晰</option>
                      <option value="轻度受损">轻度受损</option>
                      <option value="中度受损">中度受损</option>
                      <option value="重度受损">重度受损</option>
                    </select>
                    <span className="select-arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg></span>
                  </div>
                </div>
                <div className="form-grid-full">
                  <label className="form-label">慢病与既往病史</label>
                  <textarea className={inputClass} rows={3} style={textareaStyle} value={draftForm.chronicConditions} onChange={event => updateDraft('chronicConditions', event.target.value)} />
                </div>
                <div>
                  <label className="form-label">长期用药</label>
                  <textarea className={inputClass} rows={3} style={textareaStyle} value={draftForm.medicationSummary} onChange={event => updateDraft('medicationSummary', event.target.value)} />
                </div>
                <div>
                  <label className="form-label">过敏史</label>
                  <textarea className={inputClass} rows={3} style={textareaStyle} value={draftForm.allergySummary} onChange={event => updateDraft('allergySummary', event.target.value)} />
                </div>
                <div className="form-grid-full">
                  <label className="form-label">风险备注</label>
                  <textarea className={inputClass} rows={3} style={textareaStyle} value={draftForm.riskNotes} onChange={event => updateDraft('riskNotes', event.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                  导入后会进入个案评定页继续人工认定与结论生成；如需回退，可直接删除该次导入记录并继续走人工建档。
                </div>
                <button className="btn btn-primary btn-md" onClick={handleSubmit} disabled={loading}>
                  {loading ? <span className="login-spinner animate-spin" /> : <><Save size={15} />写入个案评定</>}
                </button>
              </div>
            </div>
          </DataCard>
        </div>
      ) : null}
    </div>
  )
}