'use client'

import { DataCard, EmptyState, PageHeader, StatCard, Tag, type TagVariant } from '@/components/nh'
import {
  EMPTY_NURSING_ITEM_FORM,
  EMPTY_RULE_SET_FORM,
  EMPTY_TEMPLATE_FORM,
  activateAssessmentTemplate,
  activateNursingCatalogItem,
  addAssessmentRuleSet,
  addAssessmentTemplate,
  addNursingCatalogItem,
  archiveAssessmentTemplate,
  deactivateAssessmentRuleSet,
  deactivateNursingCatalogItem,
  getAssessmentConfigSnapshot,
  publishAssessmentRuleSet,
  reviewAssessmentTemplate,
  submitAssessmentRuleSetReview,
  subscribeAssessmentConfigWorkflow,
  validateAssessmentRuleSetForm,
  validateAssessmentTemplateForm,
  validateNursingItemForm,
  type AssessmentRuleSetFormState,
  type AssessmentTemplateFormState,
  type NursingCatalogItem,
  type NursingItemFormState,
} from '@/lib/mock/assessment-config-workflow'
import { getAssessmentCasesSnapshot, subscribeAssessmentWorkflow } from '@/lib/mock/assessment-workflow'
import { getMasterDataSnapshot, subscribeMasterDataWorkflow } from '@/lib/mock/master-data-workflow'
import {
  Activity,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Landmark,
  Plus,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  Waypoints,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState, useSyncExternalStore } from 'react'

const ITEM_STATUS_TAG: Record<NursingCatalogItem['status'], TagVariant> = {
  草稿: 'neutral',
  已启用: 'success',
  已停用: 'danger',
}

function getRuleSetVariant(status: string): TagVariant {
  if (status === '已生效') return 'success'
  if (status === '待复核') return 'warning'
  if (status === '已停用') return 'danger'
  return 'neutral'
}

function getTemplateVariant(status: string): TagVariant {
  if (status === '已启用') return 'success'
  if (status === '待复核') return 'warning'
  if (status === '已归档') return 'neutral'
  return 'info'
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '评定机构配置操作失败。'
}

type ActionRunner = (key: string, action: () => Promise<unknown>, successMessage: string) => Promise<void>

function renderNursingItemActions(item: NursingCatalogItem, busyAction: string, runAction: ActionRunner) {
  const activateKey = `item:${item.id}:activate`
  const deactivateKey = `item:${item.id}:deactivate`

  if (item.status === '已启用') {
    return (
      <button
        className="btn btn-ghost btn-sm"
        disabled={busyAction.length > 0}
        onClick={() => void runAction(deactivateKey, () => deactivateNursingCatalogItem(item.id), '护理项已停用，后续不会继续出现在新规则集中。')}
      >
        {busyAction === deactivateKey ? '处理中...' : '停用'}
      </button>
    )
  }

  return (
    <button
      className="btn btn-secondary btn-sm"
      disabled={busyAction.length > 0}
      onClick={() => void runAction(activateKey, () => activateNursingCatalogItem(item.id), '护理项已启用，可进入规则集和模板配置。')}
    >
      {busyAction === activateKey ? '处理中...' : '启用'}
    </button>
  )
}

function renderRuleSetActions(status: string, id: string, busyAction: string, runAction: ActionRunner) {
  if (status === '草稿') {
    const actionKey = `rule:${id}:submit`
    return (
      <button
        className="btn btn-secondary btn-sm"
        disabled={busyAction.length > 0}
        onClick={() => void runAction(actionKey, () => submitAssessmentRuleSetReview(id), '规则集已提交复核，等待评定主管确认。')}
      >
        {busyAction === actionKey ? '提交中...' : '提交复核'}
      </button>
    )
  }

  if (status === '待复核') {
    const actionKey = `rule:${id}:publish`
    return (
      <button
        className="btn btn-primary btn-sm"
        disabled={busyAction.length > 0}
        onClick={() => void runAction(actionKey, () => publishAssessmentRuleSet(id), '规则集已生效，可被个案评定直接消费。')}
      >
        {busyAction === actionKey ? '生效中...' : '发布生效'}
      </button>
    )
  }

  if (status === '已生效') {
    const actionKey = `rule:${id}:disable`
    return (
      <button
        className="btn btn-ghost btn-sm"
        disabled={busyAction.length > 0}
        onClick={() => void runAction(actionKey, () => deactivateAssessmentRuleSet(id), '规则集已停用，后续个案会切换到其他有效版本。')}
      >
        {busyAction === actionKey ? '处理中...' : '停用'}
      </button>
    )
  }

  return <span className="text-xs" style={{ color: 'var(--color-muted)' }}>仅保留历史</span>
}

function renderTemplateActions(status: string, id: string, busyAction: string, runAction: ActionRunner) {
  if (status === '草稿') {
    const actionKey = `template:${id}:review`
    return (
      <button
        className="btn btn-secondary btn-sm"
        disabled={busyAction.length > 0}
        onClick={() => void runAction(actionKey, () => reviewAssessmentTemplate(id), '认定模板已提交复核。')}
      >
        {busyAction === actionKey ? '提交中...' : '提交复核'}
      </button>
    )
  }

  if (status === '待复核') {
    const actionKey = `template:${id}:activate`
    return (
      <button
        className="btn btn-primary btn-sm"
        disabled={busyAction.length > 0}
        onClick={() => void runAction(actionKey, () => activateAssessmentTemplate(id), '认定模板已启用，可在个案评定页直接引用。')}
      >
        {busyAction === actionKey ? '启用中...' : '启用模板'}
      </button>
    )
  }

  if (status === '已启用') {
    const actionKey = `template:${id}:archive`
    return (
      <button
        className="btn btn-ghost btn-sm"
        disabled={busyAction.length > 0}
        onClick={() => void runAction(actionKey, () => archiveAssessmentTemplate(id), '认定模板已归档，保留历史结论口径。')}
      >
        {busyAction === actionKey ? '归档中...' : '归档'}
      </button>
    )
  }

  return <span className="text-xs" style={{ color: 'var(--color-muted)' }}>归档完成</span>
}

export function NursingExecutionOverviewPage() {
  const assessmentCases = useSyncExternalStore(
    subscribeAssessmentWorkflow,
    getAssessmentCasesSnapshot,
    getAssessmentCasesSnapshot,
  )
  const configSnapshot = useSyncExternalStore(
    subscribeAssessmentConfigWorkflow,
    getAssessmentConfigSnapshot,
    getAssessmentConfigSnapshot,
  )
  const masterSnapshot = useSyncExternalStore(
    subscribeMasterDataWorkflow,
    getMasterDataSnapshot,
    getMasterDataSnapshot,
  )

  const assessmentInstitutions = useMemo(
    () => masterSnapshot.partners.filter(item => item.lifecycleStatus === '已启用' && item.institutionType === '评估机构'),
    [masterSnapshot.partners],
  )

  const pendingAcceptance = assessmentCases.filter(item => item.status === '待人工确认').length
  const activeReviews = assessmentCases.filter(item => item.status === '计划已生成').length
  const activeTemplates = configSnapshot.observability.activeTemplates
  const activeRuleSets = configSnapshot.observability.activeRuleSets

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="长护险评定机构总览"
        subtitle="围绕护理项库、评定规则集、认定模板、个案评定、派案排期与评定结算组织现有 admin 模块。"
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/nursing/packages" className="btn btn-secondary btn-sm">进入评定标准配置</Link>
            <Link href="/nursing/plans" className="btn btn-secondary btn-sm">进入认定模板</Link>
            <Link href="/elderly/checkin" className="btn btn-primary btn-sm">进入个案评定中心</Link>
          </div>
        }
      />

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard icon={<Users size={18} />} label="在管评定个案" value={assessmentCases.length} sub="来自老人档案与资料导入" color="primary" />
        <StatCard icon={<ShieldCheck size={18} />} label="生效规则集" value={activeRuleSets} sub="当前可用于认定" color="success" />
        <StatCard icon={<Settings2 size={18} />} label="启用护理项" value={configSnapshot.observability.enabledNursingItems} sub="支撑灵活评分与建议" color="info" />
        <StatCard icon={<ClipboardCheck size={18} />} label="启用模板" value={activeTemplates} sub="可直接落入个案评定" color="warning" />
        <StatCard icon={<Landmark size={18} />} label="协同评估机构" value={assessmentInstitutions.length} sub="支持复评与抽检回访" color="info" />
      </div>

      <div className="dashboard-grid-2" style={{ marginBottom: 16 }}>
        <DataCard title="评定机构主线" subtitle="先配置标准，再执行认定，不再以服务套餐售卖作为起点。" icon={<Sparkles size={16} />}>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              {
                title: '1. 护理项库治理',
                description: '定义灵活护理项、证据要求、适用等级与场景，形成可复用的标准颗粒。',
                href: '/nursing/packages',
                action: '去配置护理项',
                badge: `${configSnapshot.nursingItems.length} 项`,
              },
              {
                title: '2. 评定规则集版本化',
                description: '把长护险评定标准拆成可复核、可生效、可停用的规则版本。',
                href: '/nursing/packages',
                action: '去管理规则集',
                badge: `${activeRuleSets} 个生效`,
              },
              {
                title: '3. 认定模板发布',
                description: '将规则集和护理项组合成首评、复评、抽检三类认定模板。',
                href: '/nursing/plans',
                action: '去管理模板',
                badge: `${activeTemplates} 个启用`,
              },
              {
                title: '4. 个案评定执行',
                description: '个案进入评定中心后，系统自动匹配规则版本、模板和证据要求。',
                href: '/elderly/checkin',
                action: '去个案评定',
                badge: `${pendingAcceptance} 条待认定`,
              },
              {
                title: '5. 派案排期与复核',
                description: '将现场评定、复评复核和抽检回访分配到评估员与协同机构。',
                href: '/staff/schedule',
                action: '去派案排期',
                badge: `${activeReviews} 条待复核`,
              },
              {
                title: '6. 评定结算与质控',
                description: '围绕评定案件、资料完整性、抽检整改和评估费结算建立闭环。',
                href: '/financial',
                action: '去结算质控',
                badge: '统一工作台',
              },
            ].map(item => (
              <div key={item.title} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                  <Tag variant="info">{item.badge}</Tag>
                </div>
                <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{item.description}</div>
                <div style={{ marginTop: 10 }}>
                  <Link href={item.href} className="btn btn-secondary btn-sm">{item.action}</Link>
                </div>
              </div>
            ))}
          </div>
        </DataCard>

        <DataCard title="边界与健康信号" subtitle="明确你们是评定机构，不把护理服务机构流程误当作系统主线。" icon={<CheckCircle2 size={16} />}>
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>机构定位</div>
              <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>系统主用户是评估员、评估主管和规则配置人员，核心输出是认定意见与服务建议，而不是护理执行本身。</div>
            </div>
            <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>标准灵活性</div>
              <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>护理项、规则集和模板拆成三层治理，既能适配长护险规则，也能保留机构级配置弹性。</div>
            </div>
            <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>无冲突接入</div>
              <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>原有老人档案、人员协同、排班和报表模块继续复用；新增配置层只负责认定依据，不强行覆盖院内其他运营流程。</div>
            </div>
            <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>当前健康信号</div>
              <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>待认定 {pendingAcceptance} 条，待复核配置 {configSnapshot.observability.pendingReviews} 项，协同评估机构 {assessmentInstitutions.length} 家。待复核越少，规则与个案链路越稳定。</div>
            </div>
          </div>
        </DataCard>
      </div>

      <DataCard title="现有模块映射" subtitle="保持现有路由不变，只改系统语义和消费方式。">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <Link href="/nursing/packages" className="data-card" style={{ textDecoration: 'none', padding: 16, display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)', fontWeight: 700 }}><Settings2 size={16} />评定标准配置</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>原 packages 路由承接护理项库与规则集配置，不再表达为服务套餐发布。</div>
          </Link>
          <Link href="/nursing/plans" className="data-card" style={{ textDecoration: 'none', padding: 16, display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)', fontWeight: 700 }}><ClipboardCheck size={16} />认定方案模板</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>原 plans 路由承接认定模板，不再要求先创建服务计划。</div>
          </Link>
          <Link href="/elderly/checkin" className="data-card" style={{ textDecoration: 'none', padding: 16, display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)', fontWeight: 700 }}><Users size={16} />个案评定中心</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>个案自动匹配规则版本、认定模板和证据要求，形成结构化认定意见。</div>
          </Link>
          <Link href="/staff/tasks" className="data-card" style={{ textDecoration: 'none', padding: 16, display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)', fontWeight: 700 }}><Activity size={16} />现场评定任务</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>继续复用任务中心，但语义转成首评、复评、抽检和整改任务。</div>
          </Link>
          <Link href="/staff/schedule" className="data-card" style={{ textDecoration: 'none', padding: 16, display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)', fontWeight: 700 }}><Waypoints size={16} />派案排期</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>继续承接评估员排期、协同机构派案和复评窗口期提醒。</div>
          </Link>
          <Link href="/financial" className="data-card" style={{ textDecoration: 'none', padding: 16, display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)', fontWeight: 700 }}><FileText size={16} />评定结算与质控</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>财务页升级为评定服务结算、资料门禁、抽检整改与质控看板。</div>
          </Link>
        </div>
      </DataCard>
    </div>
  )
}

export function ServicePackagesPage() {
  const snapshot = useSyncExternalStore(
    subscribeAssessmentConfigWorkflow,
    getAssessmentConfigSnapshot,
    getAssessmentConfigSnapshot,
  )
  const [itemForm, setItemForm] = useState<NursingItemFormState>(EMPTY_NURSING_ITEM_FORM)
  const [ruleForm, setRuleForm] = useState<AssessmentRuleSetFormState>(EMPTY_RULE_SET_FORM)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyAction, setBusyAction] = useState('')

  const activeRuleSets = snapshot.ruleSets.filter(item => item.status === '已生效').length
  const pendingRuleSets = snapshot.ruleSets.filter(item => item.status === '待复核').length
  const activeItems = snapshot.nursingItems.filter(item => item.status === '已启用').length
  const levelCoverage = snapshot.observability.levelCoverage

  function updateItemForm<K extends keyof NursingItemFormState>(key: K, value: NursingItemFormState[K]) {
    setItemForm(current => ({ ...current, [key]: value }))
  }

  function updateRuleForm<K extends keyof AssessmentRuleSetFormState>(key: K, value: AssessmentRuleSetFormState[K]) {
    setRuleForm(current => ({ ...current, [key]: value }))
  }

  async function runAction(key: string, action: () => Promise<unknown>, successMessage: string) {
    setBusyAction(key)
    setError('')
    try {
      await action()
      setNotice(successMessage)
    } catch (actionError) {
      setError(getErrorMessage(actionError))
    } finally {
      setBusyAction('')
    }
  }

  async function handleCreateItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateNursingItemForm(itemForm)
    if (validationError) {
      setError(validationError)
      return
    }

    setBusyAction('item:create')
    setError('')
    try {
      await addNursingCatalogItem(itemForm)
      setItemForm(EMPTY_NURSING_ITEM_FORM)
      setNotice('护理项草稿已创建，可继续启用并加入规则集。')
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setBusyAction('')
    }
  }

  async function handleCreateRuleSet(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateAssessmentRuleSetForm(ruleForm)
    if (validationError) {
      setError(validationError)
      return
    }

    setBusyAction('rule:create')
    setError('')
    try {
      await addAssessmentRuleSet(ruleForm)
      setRuleForm(EMPTY_RULE_SET_FORM)
      setNotice('规则集草稿已创建，可继续提交复核并发布生效。')
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setBusyAction('')
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="评定标准配置"
        subtitle="统一治理护理项库与长护险评定规则集，形成可复核、可生效、可停用的标准底座。"
        actions={<Link href="/nursing/plans" className="btn btn-secondary btn-sm">查看认定模板</Link>}
      />

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard icon={<Settings2 size={18} />} label="已启用护理项" value={activeItems} sub="可进入个案匹配" color="primary" />
        <StatCard icon={<ShieldCheck size={18} />} label="生效规则集" value={activeRuleSets} sub="按版本治理" color="success" />
        <StatCard icon={<ClipboardCheck size={18} />} label="待复核规则" value={pendingRuleSets} sub="需评定主管确认" color="warning" />
        <StatCard icon={<Waypoints size={18} />} label="覆盖等级" value={levelCoverage} sub="当前已覆盖的等级数" color="info" />
      </div>

      {snapshot.error || error ? (
        <DataCard title="同步异常" subtitle={snapshot.error || error} badge={<Tag variant="danger">Workflow Error</Tag>} />
      ) : null}

      {notice ? (
        <DataCard title="流程提示" subtitle={notice} badge={<Tag variant="info">Config Notice</Tag>}>
          <div style={{ fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.7 }}>
            当前配置只会影响评定依据，不会直接改写原有老人档案、排班或其他院内管理逻辑。
          </div>
        </DataCard>
      ) : null}

      <div className="dashboard-grid-2" style={{ marginTop: 16, marginBottom: 16 }}>
        <DataCard title="新增护理项" subtitle="把护理动作、证据要求和适用等级沉淀为标准颗粒。" icon={<Plus size={16} />}>
          <form onSubmit={handleCreateItem} style={{ display: 'grid', gap: 12 }}>
            <div className="form-grid">
              <div>
                <label className="form-label">护理项名称</label>
                <input className="input" value={itemForm.name} onChange={event => updateItemForm('name', event.target.value)} placeholder="如 居家环境与风险评估" />
              </div>
              <div>
                <label className="form-label">分类</label>
                <select className="input" value={itemForm.category} onChange={event => updateItemForm('category', event.target.value as NursingItemFormState['category'])}>
                  <option value="基础照护">基础照护</option>
                  <option value="专项护理">专项护理</option>
                  <option value="康复支持">康复支持</option>
                  <option value="风险干预">风险干预</option>
                </select>
              </div>
              <div>
                <label className="form-label">标准时长</label>
                <input className="input" value={itemForm.durationLabel} onChange={event => updateItemForm('durationLabel', event.target.value)} placeholder="如 30 分钟/次" />
              </div>
              <div>
                <label className="form-label">适用等级</label>
                <input className="input" value={itemForm.applicableLevels} onChange={event => updateItemForm('applicableLevels', event.target.value)} placeholder="如 一级护理，二级护理" />
              </div>
            </div>
            <div>
              <label className="form-label">适用场景</label>
              <input className="input" value={itemForm.serviceModes} onChange={event => updateItemForm('serviceModes', event.target.value)} placeholder="如 居家护理，机构护理" />
            </div>
            <div>
              <label className="form-label">证据要求</label>
              <textarea className="input" rows={2} value={itemForm.evidenceRequirements} onChange={event => updateItemForm('evidenceRequirements', event.target.value)} placeholder="如 现场照片、签名确认、量表记录" />
            </div>
            <div>
              <label className="form-label">适用说明</label>
              <textarea className="input" rows={3} value={itemForm.description} onChange={event => updateItemForm('description', event.target.value)} placeholder="说明该护理项在认定中的作用和适用边界" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={busyAction.length > 0}>
                {busyAction === 'item:create' ? '提交中...' : '提交护理项'}
              </button>
            </div>
          </form>
        </DataCard>

        <DataCard title="新增规则集" subtitle="将长护险评定标准版本化，作为个案认定的直接依据。" icon={<ShieldCheck size={16} />}>
          <form onSubmit={handleCreateRuleSet} style={{ display: 'grid', gap: 12 }}>
            <div className="form-grid">
              <div>
                <label className="form-label">规则集名称</label>
                <input className="input" value={ruleForm.name} onChange={event => updateRuleForm('name', event.target.value)} placeholder="如 居家失能首评规则集" />
              </div>
              <div>
                <label className="form-label">版本</label>
                <input className="input" value={ruleForm.version} onChange={event => updateRuleForm('version', event.target.value)} placeholder="如 v1.0" />
              </div>
              <div>
                <label className="form-label">适用场景</label>
                <select className="input" value={ruleForm.scene} onChange={event => updateRuleForm('scene', event.target.value as AssessmentRuleSetFormState['scene'])}>
                  <option value="首次认定">首次认定</option>
                  <option value="复评复核">复评复核</option>
                  <option value="抽检回访">抽检回访</option>
                </select>
              </div>
              <div>
                <label className="form-label">适用等级</label>
                <input className="input" value={ruleForm.applicableLevels} onChange={event => updateRuleForm('applicableLevels', event.target.value)} placeholder="如 一级护理，二级护理" />
              </div>
            </div>
            <div>
              <label className="form-label">评分区间</label>
              <input className="input" value={ruleForm.scoreRangeLabel} onChange={event => updateRuleForm('scoreRangeLabel', event.target.value)} placeholder="如 ADL 35-65 + 认知修正项" />
            </div>
            <div>
              <label className="form-label">阈值口径</label>
              <textarea className="input" rows={2} value={ruleForm.thresholdSummary} onChange={event => updateRuleForm('thresholdSummary', event.target.value)} placeholder="说明满足何种条件后进入相应照护建议" />
            </div>
            <div>
              <label className="form-label">证据要求</label>
              <input className="input" value={ruleForm.evidenceRequirements} onChange={event => updateRuleForm('evidenceRequirements', event.target.value)} placeholder="如 ADL 记录、现场照片、签名确认" />
            </div>
            <div>
              <label className="form-label">关联护理项 ID</label>
              <input className="input" value={ruleForm.nursingItemIds} onChange={event => updateRuleForm('nursingItemIds', event.target.value)} placeholder="如 item-adl-observation，item-home-safety" />
            </div>
            <div>
              <label className="form-label">质控门禁</label>
              <textarea className="input" rows={2} value={ruleForm.qualityGate} onChange={event => updateRuleForm('qualityGate', event.target.value)} placeholder="如 双人复核后方可出具认定意见" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={busyAction.length > 0}>
                {busyAction === 'rule:create' ? '提交中...' : '提交规则集'}
              </button>
            </div>
          </form>
        </DataCard>
      </div>

      <div className="dashboard-grid-2" style={{ alignItems: 'start' }}>
        <DataCard title="护理项库" subtitle="灵活护理项先成为标准底座，再进入个案认定。">
          {snapshot.nursingItems.length === 0 ? (
            <EmptyState title="暂无护理项" description="先创建护理项，再配置规则集。" />
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {snapshot.nursingItems.map(item => (
                <div key={item.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.name}</div>
                      <div style={{ marginTop: 4, fontSize: 12, color: 'var(--color-muted)' }}>{item.code} · {item.category} · {item.durationLabel}</div>
                    </div>
                    <Tag variant={ITEM_STATUS_TAG[item.status]}>{item.status}</Tag>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{item.description}</div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {item.applicableLevels.map(level => <Tag key={`${item.id}-${level}`} variant="info">{level}</Tag>)}
                    {item.evidenceRequirements.map(requirement => <Tag key={`${item.id}-${requirement}`} variant="neutral">{requirement}</Tag>)}
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>关联规则集 {item.linkedRuleSets} 个 · 更新于 {item.updatedAt}</span>
                    {renderNursingItemActions(item, busyAction, runAction)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DataCard>

        <DataCard title="规则集版本" subtitle="规则集控制评定口径，必须经过复核后才能生效。">
          {snapshot.ruleSets.length === 0 ? (
            <EmptyState title="暂无规则集" description="先创建规则集草稿，再提交复核。" />
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {snapshot.ruleSets.map(ruleSet => (
                <div key={ruleSet.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{ruleSet.name}</div>
                      <div style={{ marginTop: 4, fontSize: 12, color: 'var(--color-muted)' }}>{ruleSet.version} · {ruleSet.scene} · {ruleSet.scoreRangeLabel}</div>
                    </div>
                    <Tag variant={getRuleSetVariant(ruleSet.status)}>{ruleSet.status}</Tag>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{ruleSet.thresholdSummary}</div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {ruleSet.applicableLevels.map(level => <Tag key={`${ruleSet.id}-${level}`} variant="info">{level}</Tag>)}
                    {ruleSet.evidenceRequirements.map(requirement => <Tag key={`${ruleSet.id}-${requirement}`} variant="neutral">{requirement}</Tag>)}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--color-text)' }}>质控门禁：{ruleSet.qualityGate}</div>
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>责任人 {ruleSet.owner} · 更新于 {ruleSet.updatedAt}</span>
                    {renderRuleSetActions(ruleSet.status, ruleSet.id, busyAction, runAction)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DataCard>
      </div>
    </div>
  )
}

export function ServicePlansPage() {
  const snapshot = useSyncExternalStore(
    subscribeAssessmentConfigWorkflow,
    getAssessmentConfigSnapshot,
    getAssessmentConfigSnapshot,
  )
  const [form, setForm] = useState<AssessmentTemplateFormState>(EMPTY_TEMPLATE_FORM)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyAction, setBusyAction] = useState('')

  const activeTemplates = snapshot.templates.filter(item => item.status === '已启用').length
  const reviewTemplates = snapshot.templates.filter(item => item.status === '待复核').length
  const initialTemplates = snapshot.templates.filter(item => item.scene === '首次认定').length
  const reviewScenes = snapshot.templates.filter(item => item.scene !== '首次认定').length

  function updateForm<K extends keyof AssessmentTemplateFormState>(key: K, value: AssessmentTemplateFormState[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  async function runAction(key: string, action: () => Promise<unknown>, successMessage: string) {
    setBusyAction(key)
    setError('')
    try {
      await action()
      setNotice(successMessage)
    } catch (actionError) {
      setError(getErrorMessage(actionError))
    } finally {
      setBusyAction('')
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateAssessmentTemplateForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setBusyAction('template:create')
    setError('')
    try {
      await addAssessmentTemplate(form)
      setForm(EMPTY_TEMPLATE_FORM)
      setNotice('认定模板草稿已创建，可继续提交复核并启用。')
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setBusyAction('')
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="认定方案模板"
        subtitle="将规则集、护理项和结论输出组合成首评、复评、抽检三类可直接复用的认定模板。"
        actions={<Link href="/elderly/checkin" className="btn btn-secondary btn-sm">查看个案评定</Link>}
      />

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard icon={<ClipboardCheck size={18} />} label="已启用模板" value={activeTemplates} sub="可被个案直接消费" color="success" />
        <StatCard icon={<Bot size={18} />} label="待复核模板" value={reviewTemplates} sub="等待主管确认" color="warning" />
        <StatCard icon={<Users size={18} />} label="首次认定模板" value={initialTemplates} sub="覆盖新受理个案" color="primary" />
        <StatCard icon={<Waypoints size={18} />} label="复评/抽检模板" value={reviewScenes} sub="支撑复核与抽检" color="info" />
      </div>

      {snapshot.error || error ? (
        <DataCard title="同步异常" subtitle={snapshot.error || error} badge={<Tag variant="danger">Workflow Error</Tag>} />
      ) : null}

      {notice ? (
        <DataCard title="流程提示" subtitle={notice} badge={<Tag variant="info">Template Notice</Tag>}>
          <div style={{ fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.7 }}>
            模板启用后，个案评定页会按等级和场景自动匹配，减少人工拼装认定依据。
          </div>
        </DataCard>
      ) : null}

      <div className="dashboard-grid-2" style={{ marginTop: 16, marginBottom: 16 }}>
        <DataCard title="新增认定模板" subtitle="为不同认定场景提供标准化输出与后续动作。" icon={<Plus size={16} />}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
            <div className="form-grid">
              <div>
                <label className="form-label">模板名称</label>
                <input className="input" value={form.name} onChange={event => updateForm('name', event.target.value)} placeholder="如 首评二级照护建议模板" />
              </div>
              <div>
                <label className="form-label">适用场景</label>
                <select className="input" value={form.scene} onChange={event => updateForm('scene', event.target.value as AssessmentTemplateFormState['scene'])}>
                  <option value="首次认定">首次认定</option>
                  <option value="复评复核">复评复核</option>
                  <option value="抽检回访">抽检回访</option>
                </select>
              </div>
              <div>
                <label className="form-label">目标等级</label>
                <input className="input" value={form.targetLevels} onChange={event => updateForm('targetLevels', event.target.value)} placeholder="如 二级护理" />
              </div>
              <div>
                <label className="form-label">关联规则集</label>
                <select className="input" value={form.ruleSetId} onChange={event => updateForm('ruleSetId', event.target.value)}>
                  <option value="">请选择</option>
                  {snapshot.ruleSets.map(ruleSet => <option key={ruleSet.id} value={ruleSet.id}>{ruleSet.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="form-label">关联护理项 ID</label>
              <input className="input" value={form.nursingItemIds} onChange={event => updateForm('nursingItemIds', event.target.value)} placeholder="如 item-adl-observation，item-home-safety" />
            </div>
            <div>
              <label className="form-label">证据要求</label>
              <input className="input" value={form.evidenceRequirements} onChange={event => updateForm('evidenceRequirements', event.target.value)} placeholder="如 量表记录、签名确认、现场照片" />
            </div>
            <div>
              <label className="form-label">结论摘要</label>
              <textarea className="input" rows={3} value={form.conclusionSummary} onChange={event => updateForm('conclusionSummary', event.target.value)} placeholder="描述模板适用范围、输出口径和风险说明" />
            </div>
            <div>
              <label className="form-label">后续动作</label>
              <textarea className="input" rows={2} value={form.followupAction} onChange={event => updateForm('followupAction', event.target.value)} placeholder="如 30 日内回访、7 日内复核资料一致性" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={busyAction.length > 0}>
                {busyAction === 'template:create' ? '提交中...' : '提交模板'}
              </button>
            </div>
          </form>
        </DataCard>

        <DataCard title="模板闭环说明" subtitle="模板不是服务计划，而是评定结论的标准输出骨架。" icon={<Sparkles size={16} />}>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              { title: '1. 选规则集', description: '模板必须绑定一个规则集版本，保证认定口径可追溯。', badge: '规则绑定' },
              { title: '2. 选护理项', description: '模板只引用已标准化护理项，避免每个个案重新拼接证据要求。', badge: '护理项复用' },
              { title: '3. 定义输出', description: '模板要给出结论摘要、证据要求和后续动作，直接进入个案详情。', badge: '结构化输出' },
              { title: '4. 启用生效', description: '启用后的模板才会被个案评定自动匹配，草稿和待复核只作为治理过程。', badge: '启用门禁' },
            ].map(item => (
              <div key={item.title} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                  <Tag variant="info">{item.badge}</Tag>
                </div>
                <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.7 }}>{item.description}</div>
              </div>
            ))}
          </div>
        </DataCard>
      </div>

      <DataCard title="认定模板列表" subtitle="统一管理草稿、待复核、已启用和已归档模板。">
        {snapshot.templates.length === 0 ? (
          <EmptyState title="暂无认定模板" description="先创建模板草稿，再提交复核。" />
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {snapshot.templates.map(template => (
              <div key={template.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{template.name}</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: 'var(--color-muted)' }}>{template.scene} · {template.ruleSetName}</div>
                  </div>
                  <Tag variant={getTemplateVariant(template.status)}>{template.status}</Tag>
                </div>
                <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{template.conclusionSummary}</div>
                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {template.targetLevels.map(level => <Tag key={`${template.id}-${level}`} variant="info">{level}</Tag>)}
                  {template.evidenceRequirements.map(requirement => <Tag key={`${template.id}-${requirement}`} variant="neutral">{requirement}</Tag>)}
                </div>
                <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--color-text)' }}>后续动作：{template.followupAction}</div>
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>责任人 {template.owner} · 更新于 {template.updatedAt} · 护理项 {template.nursingItemNames.join('、')}</span>
                  {renderTemplateActions(template.status, template.id, busyAction, runAction)}
                </div>
              </div>
            ))}
          </div>
        )}
      </DataCard>
    </div>
  )
}