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
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Landmark,
  Plus,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  Waypoints,
  type LucideIcon,
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

interface CareScenarioModuleLink {
  title: string
  description: string
  href: string
  badge: string
  badgeVariant?: TagVariant
}

interface CareScenarioModuleGroup {
  id: string
  title: string
  subtitle: string
  tag: string
  tagVariant?: TagVariant
  icon: LucideIcon
  modules: CareScenarioModuleLink[]
}

interface NavOwnershipEntry {
  label: string
  href: string
}

interface NavOwnershipGroup {
  id: string
  title: string
  subtitle: string
  tag: string
  tagVariant?: TagVariant
  icon: LucideIcon
  entries: NavOwnershipEntry[]
  boundaryNote: string
}

const CARE_SCENARIO_MODULE_GROUPS: CareScenarioModuleGroup[] = [
  {
    id: 'institutional-care',
    title: '机构养老模块',
    subtitle: '聚焦院内入住、床位、班次、健康监测和现场执行闭环。',
    tag: '院内主线',
    tagVariant: 'primary',
    icon: Landmark,
    modules: [
      {
        title: '入住建档',
        description: '承接院内新入住长者的基础信息采集、建档和分配前置。',
        href: '/elderly/new',
        badge: '入住准备',
        badgeVariant: 'primary',
      },
      {
        title: '老人档案',
        description: '承接入住建档、在住名单、健康档案和资料补齐。',
        href: '/elderly?scene=institutional',
        badge: '入住入口',
        badgeVariant: 'primary',
      },
      {
        title: '委托补贴工作台',
        description: '统一查看机构入住老人对应的委托来源、月补贴、固定服务项和认定流转。',
        href: '/elderly/entrustment',
        badge: '机构台账',
        badgeVariant: 'warning',
      },
      {
        title: '房间管理',
        description: '围绕楼栋、房间、床位和护理区域管理院内承载能力。',
        href: '/rooms',
        badge: '床位资源',
        badgeVariant: 'info',
      },
      {
        title: '健康总览',
        description: '统一查看机构内长者的体征、趋势和重点关注对象。',
        href: '/health',
        badge: '实时监测',
        badgeVariant: 'success',
      },
      {
        title: '实时报警',
        description: '承接跌倒、离床、健康异常和设备联动告警。',
        href: '/alerts',
        badge: '异常闭环',
        badgeVariant: 'danger',
      },
      {
        title: '现场任务',
        description: '用于院内评定、护理执行和重点事项跟办。',
        href: '/staff/tasks?scene=institutional',
        badge: '当班执行',
        badgeVariant: 'warning',
      },
      {
        title: '服务打卡',
        description: '沉淀到场、执行、异常说明与主管确认记录。',
        href: '/nursing/checkin?scene=institutional',
        badge: '执行留痕',
        badgeVariant: 'success',
      },
      {
        title: '探视记录',
        description: '记录家属探视、到访反馈和院内服务跟进事项。',
        href: '/elderly/visits',
        badge: '家属协同',
        badgeVariant: 'info',
      },
      {
        title: '指标更新',
        description: '快速维护院内长者的生命体征、风险指标和观察结论。',
        href: '/elderly/vitals',
        badge: '持续观察',
        badgeVariant: 'warning',
      },
    ],
  },
  {
    id: 'home-care',
    title: '居家养老模块',
    subtitle: '聚焦受理、派案、上门评定、服务机构协同与结算稽核。',
    tag: '上门主线',
    tagVariant: 'warning',
    icon: Users,
    modules: [
      {
        title: '资料导入',
        description: '承接居家长护险申请资料导入、补录和批量受理。',
        href: '/elderly/import',
        badge: '受理入口',
        badgeVariant: 'primary',
      },
      {
        title: '居家个案池',
        description: '沉淀待受理、待评定和已认定的居家服务对象。',
        href: '/elderly?scene=home',
        badge: '案主池',
        badgeVariant: 'info',
      },
      {
        title: '定点机构',
        description: '管理评估机构与护理服务机构的协同范围和状态。',
        href: '/organizations/partners?scene=home',
        badge: '机构协同',
        badgeVariant: 'info',
      },
      {
        title: '个案评定中心',
        description: '统一承接居家长者的首评、复评、抽检与认定结论。',
        href: '/elderly/checkin?scene=home',
        badge: '认定中枢',
        badgeVariant: 'warning',
      },
      {
        title: '派案排期',
        description: '为评估员和上门服务人员分配日程、区域和时段窗口。',
        href: '/staff/schedule?scene=home',
        badge: '上门排期',
        badgeVariant: 'primary',
      },
      {
        title: '上门回执任务',
        description: '追踪上门评定后的回执补录、证据回传和异常跟办。',
        href: '/staff/tasks?scene=home',
        badge: '回执闭环',
        badgeVariant: 'warning',
      },
      {
        title: '服务留痕',
        description: '沉淀上门服务到场、回执说明和主管复核记录。',
        href: '/nursing/checkin?scene=home',
        badge: '回执留痕',
        badgeVariant: 'success',
      },
      {
        title: '评定结算与质控',
        description: '承接评定费用、服务结算、资料门禁和整改闭环。',
        href: '/financial?scene=home',
        badge: '费用与质控',
        badgeVariant: 'danger',
      },
      {
        title: '稽核报表',
        description: '输出居家场景的抽检、时效、结算和整改跟踪报表。',
        href: '/analytics/report?scene=home',
        badge: '监管视图',
        badgeVariant: 'success',
      },
    ],
  },
  {
    id: 'ltci-business',
    title: '长护险业务模块',
    subtitle: '把认定、协同、结算和规则治理统一收口，作为机构养老与居家养老的融合业务域。',
    tag: '认定与监管中枢',
    tagVariant: 'success',
    icon: ShieldCheck,
    modules: [
      {
        title: '长护险业务总览',
        description: '统一查看机构养老与居家养老两条链路的认定、执行和治理总览。',
        href: '/nursing/services',
        badge: '统一总览',
        badgeVariant: 'primary',
      },
      {
        title: '个案评定中心',
        description: '统一承接首评、复评、抽检和认定结论，是长护险业务中枢。',
        href: '/elderly/checkin',
        badge: '认定中枢',
        badgeVariant: 'warning',
      },
      {
        title: '定点机构协同',
        description: '管理评估机构与护理服务机构的协同边界、启停和履约关系。',
        href: '/organizations/partners',
        badge: '协同网络',
        badgeVariant: 'info',
      },
      {
        title: '评定结算与质控',
        description: '统一归集费用、结算、整改和质控结果，沉淀监管口径。',
        href: '/financial',
        badge: '结算质控',
        badgeVariant: 'danger',
      },
      {
        title: '稽核报表',
        description: '面向主管和监管输出时效、抽检、整改和结算报表。',
        href: '/analytics/report',
        badge: '监管报表',
        badgeVariant: 'success',
      },
      {
        title: '评定标准配置',
        description: '统一维护护理项库、评分规则和生效版本。',
        href: '/nursing/packages',
        badge: '规则底座',
        badgeVariant: 'success',
      },
      {
        title: '认定方案模板',
        description: '管理首评、复评和抽检模板，避免场景口径漂移。',
        href: '/nursing/plans',
        badge: '模板底座',
        badgeVariant: 'info',
      },
      {
        title: 'AI 助手',
        description: '为长护险认定、监管和场景协同输出摘要、建议和解释。',
        href: '/ai-assistant',
        badge: '跨场景辅助',
        badgeVariant: 'info',
      },
    ],
  },
]

const NAV_OWNERSHIP_GROUPS: NavOwnershipGroup[] = [
  {
    id: 'ltci-domain',
    title: '长护险业务',
    subtitle: '收口认定、协同、结算、监管和规则治理主链路。',
    tag: '完整业务域',
    tagVariant: 'success',
    icon: ShieldCheck,
    entries: [
      { label: '长护险业务总览', href: '/nursing/services' },
      { label: '资料导入受理', href: '/elderly/import' },
      { label: '个案评定中心', href: '/elderly/checkin' },
      { label: '现场评定任务', href: '/staff/tasks' },
      { label: '派案排期', href: '/staff/schedule' },
      { label: '服务打卡管理', href: '/nursing/checkin' },
      { label: '定点机构协同', href: '/organizations/partners' },
      { label: '评定结算与质控', href: '/financial' },
      { label: '稽核报表', href: '/analytics/report' },
      { label: '评定标准配置', href: '/nursing/packages' },
      { label: '认定方案模板', href: '/nursing/plans' },
    ],
    boundaryNote: '这些路由不再重复挂到机构养老、居家养老和机构管理。',
  },
  {
    id: 'institutional-domain',
    title: '机构养老',
    subtitle: '聚焦院内入住、在住照护、床位和院内健康观察。',
    tag: '院内独立模块',
    tagVariant: 'primary',
    icon: Landmark,
    entries: [
      { label: '入住建档', href: '/elderly/new' },
      { label: '老人档案', href: '/elderly?scene=institutional' },
      { label: '房间床位', href: '/rooms' },
      { label: '健康总览', href: '/health' },
      { label: '实时报警', href: '/alerts' },
      { label: '探视记录', href: '/elderly/visits' },
      { label: '指标更新', href: '/elderly/vitals' },
    ],
    boundaryNote: '机构养老不再重复承接长护险评定、派案、结算和机构协同菜单。',
  },
  {
    id: 'home-domain',
    title: '居家养老',
    subtitle: '保留居家档案补充、协同入职和场景侧工作台。',
    tag: '居家独立模块',
    tagVariant: 'warning',
    icon: Users,
    entries: [
      { label: '健康档案', href: '/elderly/health' },
      { label: '人脸录入', href: '/elderly/face' },
      { label: '协同人员池', href: '/staff' },
      { label: '协同人员入职', href: '/staff/new' },
    ],
    boundaryNote: '居家养老不再复制资料导入、个案评定、派案、结算和稽核入口。',
  },
  {
    id: 'shared-ops-domain',
    title: '通用运营域',
    subtitle: '保留未被业务域接管的设备、组织和经营辅助能力。',
    tag: '通用支撑',
    tagVariant: 'info',
    icon: Settings2,
    entries: [
      { label: '设备监控', href: '/devices/realtime' },
      { label: '设备总览', href: '/devices' },
      { label: '机构列表', href: '/organizations' },
      { label: '新增机构', href: '/organizations/new' },
      { label: '数据看板', href: '/analytics' },
      { label: 'AI 助手', href: '/ai-assistant' },
    ],
    boundaryNote: '设备与健康、机构管理、运营分析只保留未被长护险、机构养老、居家养老接管的通用能力。',
  },
]

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
  const scenarioWorkflowLanes = [
    {
      id: 'institutional-lane',
      title: '机构养老 workflow',
      subtitle: '围绕院内入住、院内评定、任务执行和服务留痕组织现有模块。',
      tag: '院内照护链路',
      tagVariant: 'primary' as const,
      icon: Landmark,
      steps: [
        {
          title: '入住建档与床位落位',
          description: '从老人建档、资料补齐到房间床位分配，先完成院内服务对象的基础落位。',
          href: '/elderly/new',
          action: '去新建个案',
          badge: `${assessmentCases.length} 条在管个案`,
        },
        {
          title: '机构内评定与结论确认',
          description: '在院内完成首评、复评和认定确认，形成后续照护或长护险服务依据。',
          href: '/elderly/checkin?scene=institutional',
          action: '去个案评定',
          badge: `${pendingAcceptance} 条待认定`,
        },
        {
          title: '班次任务与护理执行',
          description: '将重点老人、异常观察和院内服务动作分派到当班任务与排班。',
          href: '/staff/tasks?scene=institutional',
          action: '去现场任务',
          badge: `${activeReviews} 条待复核`,
        },
        {
          title: '到场打卡与异常闭环',
          description: '对院内服务动作沉淀打卡、异常说明和主管确认，避免执行链路断点。',
          href: '/nursing/checkin?scene=institutional',
          action: '去服务打卡',
          badge: '执行留痕',
        },
        {
          title: '结算质控与复盘',
          description: '把院内执行、评定结果与质控报表汇总到统一工作台，支撑月度复盘。',
          href: '/financial?scene=institutional',
          action: '去结算质控',
          badge: '统一工作台',
        },
      ],
    },
    {
      id: 'home-lane',
      title: '居家养老 workflow',
      subtitle: '围绕受理、派案、上门评定、服务机构协同和稽核结算组织现有模块。',
      tag: '上门服务链路',
      tagVariant: 'warning' as const,
      icon: Users,
      steps: [
        {
          title: '受理导入与资料补齐',
          description: '从居家申请受理开始，把档案、联系人和佐证材料导入到评定流程。',
          href: '/elderly/import',
          action: '去资料导入',
          badge: `${assessmentCases.length} 条可受理`,
        },
        {
          title: '评估机构派案排期',
          description: '按照街镇、片区和评估员能力排班，形成上门窗口与路线。',
          href: '/staff/schedule?scene=home',
          action: '去派案排期',
          badge: `${assessmentInstitutions.length} 家协同机构`,
        },
        {
          title: '上门评定与回执',
          description: '现场完成评定、证据补录和结论初稿，把执行痕迹沉淀到任务链路。',
          href: '/staff/tasks?scene=home',
          action: '去现场任务',
          badge: `${activeReviews} 条待回执`,
        },
        {
          title: '护理服务机构承接',
          description: '把认定结果、服务建议和承接状态同步给护理服务机构，避免断档。',
          href: '/organizations/partners?scene=home',
          action: '去机构协同',
          badge: '合作机构协同',
        },
        {
          title: '结算稽核与整改追踪',
          description: '对居家场景的评定费用、服务结算、抽检整改和监管口径统一出数。',
          href: '/analytics/report?scene=home',
          action: '去稽核报表',
          badge: '监管报表',
        },
      ],
    },
  ]

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="长护险评定机构总览"
        subtitle="在保留现有模块与路由的前提下，按长护险业务、机构养老、居家养老三条视角重新组织 workflow 和模块分布。"
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
        <DataCard title="场景化 workflow 主线" subtitle="同一套 admin 模块同时支撑长护险业务域与机构养老、居家养老两条场景链路。" icon={<Sparkles size={16} />}>
          <div style={{ display: 'grid', gap: 12 }}>
            {scenarioWorkflowLanes.map(lane => {
              const Icon = lane.icon

              return (
                <div key={lane.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14, display: 'grid', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'grid', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                        <Icon size={16} />
                        {lane.title}
                      </div>
                      <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{lane.subtitle}</div>
                    </div>
                    <Tag variant={lane.tagVariant}>{lane.tag}</Tag>
                  </div>

                  <div style={{ display: 'grid', gap: 10 }}>
                    {lane.steps.map((step, index) => (
                      <div key={step.title} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{index + 1}. {step.title}</div>
                          <Tag variant="info">{step.badge}</Tag>
                        </div>
                        <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>{step.description}</div>
                        <div style={{ marginTop: 10 }}>
                          <Link href={step.href} className="btn btn-secondary btn-sm">{step.action}</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
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
              <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>现有老人档案、人员协同、排班、打卡和报表模块继续复用；这次增加“长护险业务 / 机构养老 / 居家养老”三条视角，用同一路由底座承接融合导航。</div>
            </div>
            <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>当前健康信号</div>
              <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>待认定 {pendingAcceptance} 条，待复核配置 {configSnapshot.observability.pendingReviews} 项，协同评估机构 {assessmentInstitutions.length} 家。待复核越少，规则与个案链路越稳定。</div>
            </div>
          </div>
        </DataCard>
      </div>

      <DataCard title="按机构养老 / 居家养老分配模块" subtitle="保留现有模块不变，只调整模块归属和阅读顺序，便于按场景推进实施。">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {CARE_SCENARIO_MODULE_GROUPS.map(group => {
            const Icon = group.icon

            return (
              <div key={group.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 16, display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)', fontWeight: 700 }}>
                      <Icon size={16} />
                      {group.title}
                    </div>
                    <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{group.subtitle}</div>
                  </div>
                  <Tag variant={group.tagVariant}>{group.tag}</Tag>
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                  {group.modules.map(module => (
                    <Link key={`${group.id}-${module.href}`} href={module.href} className="data-card" style={{ textDecoration: 'none', padding: 14, display: 'grid', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ color: 'var(--color-text)', fontWeight: 700 }}>{module.title}</div>
                        <Tag variant={module.badgeVariant}>{module.badge}</Tag>
                      </div>
                      <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{module.description}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </DataCard>

      <DataCard title="一级导航归属矩阵" subtitle="把文档里的唯一归属规则同步到系统内，后续调整时先看这里而不是继续堆重复导航。" icon={<Waypoints size={16} />}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {NAV_OWNERSHIP_GROUPS.map(group => {
            const Icon = group.icon

            return (
              <div key={group.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 16, display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)', fontWeight: 700 }}>
                      <Icon size={16} />
                      {group.title}
                    </div>
                    <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{group.subtitle}</div>
                  </div>
                  <Tag variant={group.tagVariant}>{group.tag}</Tag>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {group.entries.map(entry => (
                    <Link
                      key={`${group.id}-${entry.href}`}
                      href={entry.href}
                      className="btn btn-secondary btn-sm"
                      style={{ textDecoration: 'none' }}
                    >
                      {entry.label}
                    </Link>
                  ))}
                </div>

                <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 12, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>
                  {group.boundaryNote}
                </div>
              </div>
            )
          })}
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