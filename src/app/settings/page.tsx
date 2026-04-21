'use client'

import { DataCard, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard } from '@/components/nh'
import { fetchAuditLogs, fetchOptionGroups, fetchStaticTexts } from '@/lib/mock/content-management-workflow'
import { fetchAdminRoles } from '@/lib/services/admin-identity-services'
import { Bell, ChevronRight, FileText, Monitor, Settings, ShieldAlert, ShieldCheck, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface DomainState {
  label: string
  href: string
  icon: typeof Settings
  description: string
  total: number | null
  error: string | null
  unit: string
}

const INITIAL_DOMAINS: DomainState[] = [
  { label: '静态文本', href: '/settings/static-texts', icon: FileText, description: '多语言与站内文案，按命名空间维护。', total: null, error: null, unit: '条' },
  { label: '下拉选项', href: '/settings/option-groups', icon: Monitor, description: '业务枚举与分组项，跨模块共享。', total: null, error: null, unit: '组' },
  { label: '操作日志', href: '/settings/audit-logs', icon: ShieldAlert, description: '配置变更、权限操作等审计留痕。', total: null, error: null, unit: '条' },
  { label: '角色权限', href: '/settings/roles', icon: UserCheck, description: 'Identity 预设系统角色、数据范围与能力项。', total: null, error: null, unit: '个' },
]

export default function SettingsPage() {
  const [domains, setDomains] = useState<DomainState[]>(INITIAL_DOMAINS)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false

    const loaders = [
      fetchStaticTexts({ page: 1, pageSize: 1 }).then(result => result.total).catch((err: unknown) => err instanceof Error ? err : new Error('静态文本查询失败')),
      fetchOptionGroups().then(result => result.length).catch((err: unknown) => err instanceof Error ? err : new Error('下拉选项查询失败')),
      fetchAuditLogs({ page: 1, pageSize: 1 }).then(result => result.total).catch((err: unknown) => err instanceof Error ? err : new Error('操作日志查询失败')),
      fetchAdminRoles().then(list => list.length).catch((err: unknown) => err instanceof Error ? err : new Error('角色列表查询失败')),
    ]

    Promise.all(loaders).then(results => {
      if (cancelled) return
      setDomains(prev => prev.map((domain, idx) => {
        const value = results[idx]
        if (value instanceof Error) {
          return { ...domain, total: null, error: value.message }
        }
        return { ...domain, total: value, error: null }
      }))
    })

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const handleReload = () => {
    setDomains(INITIAL_DOMAINS)
    setReloadToken(token => token + 1)
  }

  const loading = domains.every(domain => domain.total === null && domain.error === null)
  const hasError = domains.some(domain => domain.error)
  const totalDomains = domains.length
  const pendingChanges = domains.find(d => d.label === '操作日志')?.total ?? null

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="系统配置"
        subtitle="集中查看各配置域的真实总量与入口，不再使用 StandardModulePage 静态演示。"
        actions={(
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleReload}>刷新</button>
            <Link href="/settings/roles" className="btn btn-sm">角色权限设置</Link>
          </>
        )}
      />

      <InteractionRailLayout
        main={(
          <>
            <WorkflowOverviewCard
              eyebrow="Settings"
              title="系统配置总览"
              description="各配置域计数来自真实接口（BFF 模式下直通 Config / Identity 服务），便于快速识别入口健康度。"
              badge={<Tag variant={loading ? 'neutral' : hasError ? 'danger' : 'primary'}>{loading ? 'Loading' : hasError ? 'Partially Unavailable' : 'Live Snapshot'}</Tag>}
              metrics={[
                { label: '配置域', value: totalDomains, hint: '静态文本 / 选项 / 日志 / 角色', tone: 'primary' },
                { label: '操作日志', value: pendingChanges ?? 0, hint: loading ? '加载中…' : '累计审计记录', tone: 'info' },
                { label: '角色数量', value: domains[3]?.total ?? 0, hint: 'Identity 预设角色', tone: 'success' },
                { label: '选项分组', value: domains[1]?.total ?? 0, hint: '业务枚举分组', tone: 'warning' },
              ]}
              signals={[
                { label: '入口卡片展示真实总量；若某一入口不可达，仅该卡片显示错误态。', tone: 'info' },
                hasError
                  ? { label: '至少有一个配置域当前不可用，详见下方入口卡片。', tone: 'danger' }
                  : { label: '已对齐 /settings 子页的真实口径，避免总览与子页口径冲突。', tone: 'info' },
              ]}
            />

            <div className="kpi-grid">
              {domains.map(domain => (
                <StatCard
                  key={domain.label}
                  icon={<domain.icon size={18} />}
                  label={domain.label}
                  value={domain.total ?? 0}
                  sub={domain.error ? '不可用' : `${domain.unit}`}
                  color={domain.error ? 'danger' : 'primary'}
                />
              ))}
            </div>

            <DataCard
              title="配置域入口"
              subtitle="点击卡片进入对应子页查看详情。"
              badge={<Tag variant="primary">Domains</Tag>}
            >
              <div className="category-grid">
                {domains.map(domain => (
                  <Link key={domain.label} href={domain.href} className="category-card category-card--link">
                    <div className="category-card__head">
                      <span className="category-card__icon"><domain.icon size={18} /></span>
                      <div>
                        <div className="category-card__title">{domain.label}</div>
                        <div className="category-card__desc">{domain.description}</div>
                      </div>
                    </div>
                    <div className="category-card__body">
                      {domain.error ? (
                        <Tag variant="danger">不可用：{domain.error}</Tag>
                      ) : (
                        <Tag variant="info">{domain.total === null ? '加载中…' : `共 ${domain.total} ${domain.unit}`}</Tag>
                      )}
                      <span className="home-context-description"><ChevronRight size={14} /></span>
                    </div>
                  </Link>
                ))}
              </div>
            </DataCard>

            <DataCard
              title="治理说明"
              subtitle="变更审批、影响评估与审计留痕的建议口径。"
              badge={<Tag variant="info">Governance</Tag>}
            >
              <div className="home-context-stack">
                <div className="home-context-item">
                  <div className="home-context-title">变更审批</div>
                  <div className="home-context-description">高风险配置域（角色权限、阈值规则）应先审批再落地，留痕到操作日志。</div>
                </div>
                <div className="home-context-item">
                  <div className="home-context-title">影响评估</div>
                  <div className="home-context-description">通知规则、字段枚举变更建议联合产品与运营评估跨模块影响。</div>
                </div>
                <div className="home-context-item">
                  <div className="home-context-title">回滚路径</div>
                  <div className="home-context-description">借助操作日志按旧值回滚；Identity 角色变化走 Identity 后端补齐写 API 后再开放。</div>
                </div>
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="上下文说明" subtitle="当前页承担的职责与边界。" badge={<Tag variant="info">Settings Context</Tag>}>
              <div className="home-context-stack">
                <div className="home-context-item">
                  <div className="home-context-title">真实计数来源</div>
                  <div className="home-context-description">静态文本 / 下拉选项 / 操作日志走 `/api/content/*`（BFF 模式）；角色走 `/api/admin-identity/roles`。</div>
                </div>
                <div className="home-context-item">
                  <div className="home-context-title">非本页职责</div>
                  <div className="home-context-description">具体增删改操作请进入对应子页完成，本页仅做总览与入口导航。</div>
                </div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整说明后置到帮助页"
              summary="系统配置总览按真实接口聚合各配置域总量。"
              items={[
                'KPI 与子页口径一致，避免静态示例漂移。',
                '任一配置域失败只影响该卡片，不阻塞其他入口。',
                '高危变更建议联合审计日志与治理流程。',
              ]}
              href="/help/settings"
              actionLabel="查看页面帮助"
            />

            <DataCard title="关联入口" subtitle="系统配置常用入口。" badge={<Tag variant="neutral">Links</Tag>}>
              <div className="home-context-stack">
                <div className="home-context-item">
                  <Link href="/settings/static-texts" className="btn btn-sm btn-ghost"><FileText size={14} /> 静态文本</Link>
                </div>
                <div className="home-context-item">
                  <Link href="/settings/option-groups" className="btn btn-sm btn-ghost"><Monitor size={14} /> 下拉选项</Link>
                </div>
                <div className="home-context-item">
                  <Link href="/settings/audit-logs" className="btn btn-sm btn-ghost"><ShieldAlert size={14} /> 操作日志</Link>
                </div>
                <div className="home-context-item">
                  <Link href="/settings/roles" className="btn btn-sm btn-ghost"><ShieldCheck size={14} /> 角色权限</Link>
                </div>
                <div className="home-context-item">
                  <Link href="/notifications" className="btn btn-sm btn-ghost"><Bell size={14} /> 通知中心</Link>
                </div>
              </div>
            </DataCard>
          </>
        )}
      />
    </div>
  )
}
