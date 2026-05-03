'use client'

import { DataCard, EmptyState, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag, WorkflowOverviewCard } from '@/components/nh'
import { fetchAdminRoles, type AdminRoleDescriptor } from '@/lib/services/admin-identity-services'
import { Bell, FileText, ShieldAlert, ShieldCheck, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

export default function SettingsRolesPage() {
  const [roles, setRoles] = useState<AdminRoleDescriptor[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const loading = roles === null && error === null

  useEffect(() => {
    let cancelled = false

    fetchAdminRoles()
      .then(items => {
        if (cancelled) return
        setRoles(items)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : '角色列表加载失败。'
        setError(message)
      })

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const handleReload = () => {
    setRoles(null)
    setError(null)
    setReloadToken(token => token + 1)
  }

  const stats = useMemo(() => {
    const list = roles ?? []
    return {
      total: list.length,
      highRisk: list.filter(role => role.isHighRisk).length,
      standard: list.filter(role => !role.isHighRisk).length,
      abilityCount: list.reduce((sum, role) => sum + role.abilities.length, 0),
    }
  }, [roles])

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="角色权限"
        subtitle="从 Identity Service 读取系统预设角色，呈现数据范围、核心能力与高危标识。"
        actions={(
          <>
            <Link href="/settings" className="btn btn-secondary btn-sm">返回系统配置</Link>
            <Link href="/staff" className="btn btn-sm">查看员工列表</Link>
          </>
        )}
      />

      <InteractionRailLayout
        main={(
          <>
            <WorkflowOverviewCard
              eyebrow="Settings · Roles"
              title="角色权限总览"
              description="角色列表直接读取 Identity Service 的 /api/identity/roles，不再使用 StandardModulePage 静态演示数据。"
              badge={<Tag variant={loading ? 'neutral' : error ? 'danger' : 'primary'}>{loading ? 'Loading' : error ? 'Live Unavailable' : 'Live Snapshot'}</Tag>}
              metrics={[
                { label: '系统角色', value: stats.total, hint: loading ? '加载中…' : 'Identity 返回的预设角色数', tone: 'primary' },
                { label: '高危角色', value: stats.highRisk, hint: '涉及写/治理权限', tone: 'danger' },
                { label: '标准角色', value: stats.standard, hint: '执行 / 业务协作', tone: 'success' },
                { label: '核心能力', value: stats.abilityCount, hint: '各角色能力项总和', tone: 'info' },
              ]}
              signals={[
                { label: '当前仅支持只读；临时授权、权限分配仍需在 Identity 侧补齐后再开放。', tone: 'info' },
                error ? { label: error, tone: 'danger' } : { label: '列表口径与 /settings 首页 KPI 保持一致', tone: 'info' },
              ]}
            />

            {error && (
              <DataCard title="Live Unavailable" subtitle="暂时无法从 Identity Service 读取角色列表。" badge={<Tag variant="danger">Error</Tag>}>
                <div className="home-context-stack">
                  <div className="home-context-item">
                    <div className="home-context-description">{error}</div>
                  </div>
                  <div className="home-context-item">
                    <button type="button" className="btn btn-sm" onClick={handleReload}>重试</button>
                  </div>
                </div>
              </DataCard>
            )}

            <div className="kpi-grid">
              <StatCard icon={<UserCheck size={18} />} label="系统角色" value={stats.total} color="primary" />
              <StatCard icon={<ShieldAlert size={18} />} label="高危角色" value={stats.highRisk} sub="需二次确认 / 审计" color="danger" />
              <StatCard icon={<ShieldCheck size={18} />} label="标准角色" value={stats.standard} sub="业务执行与协作" color="success" />
              <StatCard icon={<Bell size={18} />} label="能力项" value={stats.abilityCount} sub="角色能力累计" color="info" />
            </div>

            <DataCard
              title="角色列表"
              subtitle="来源：Identity Service /api/identity/roles"
              badge={<Tag variant="primary">Roles</Tag>}
            >
              {loading ? (
                <div className="home-context-description">加载中…</div>
              ) : roles && roles.length > 0 ? (
                <div className="table-wrap">
                  <table className="table table-compact">
                    <thead>
                      <tr>
                        <th>角色</th>
                        <th>数据范围</th>
                        <th>核心能力</th>
                        <th>风险</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map(role => (
                        <tr key={role.id}>
                          <td>
                            <div>{role.name}</div>
                            <div className="home-context-description">{role.description}</div>
                          </td>
                          <td>{role.scope}</td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                              {role.abilities.slice(0, 4).map((a, i) => (
                                <Tag key={i} variant="neutral">{a}</Tag>
                              ))}
                              {role.abilities.length > 4 && (
                                <Tag variant="neutral">+{role.abilities.length - 4}</Tag>
                              )}
                            </div>
                          </td>
                          <td>
                            {role.isHighRisk ? (
                              <Tag variant="danger">高危权限</Tag>
                            ) : (
                              <Tag variant="success">标准权限</Tag>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="暂无角色配置"
                  description="Identity Service 当前返回空列表，请确认服务已上线。"
                  action={<button type="button" className="btn btn-sm" onClick={handleReload}>重试</button>}
                />
              )}
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard title="上下文说明" subtitle="角色数据的边界与后续能力。" badge={<Tag variant="info">Roles Context</Tag>}>
              <div className="home-context-stack">
                <div className="home-context-item">
                  <div className="home-context-title">当前边界</div>
                  <div className="home-context-description">只读展示 Identity 预设角色；权限分配、临时授权等写操作 API 尚未开放。</div>
                </div>
                <div className="home-context-item">
                  <div className="home-context-title">后续计划</div>
                  <div className="home-context-description">待 Identity 暴露权限项与授权 API 后，本页会补充分配与审计视图。</div>
                </div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整说明后置到帮助页"
              summary="角色列表已接入真实 Identity 数据，用于对照现有角色范围与核心能力。"
              items={[
                '高危角色会被标记，为后续二次确认、审计留入口。',
                '错误态请按重试按钮；不回退到静态模板。',
                '授权变更仍需后端补齐写 API，当前为只读。',
              ]}
              href="/help/settings-roles"
              actionLabel="查看页面帮助"
            />

            <DataCard title="关联入口" subtitle="角色与权限治理常用入口。" badge={<Tag variant="neutral">Links</Tag>}>
              <div className="home-context-stack">
                <div className="home-context-item">
                  <Link href="/settings" className="btn btn-sm btn-ghost"><UserCheck size={14} /> 系统配置</Link>
                </div>
                <div className="home-context-item">
                  <Link href="/settings/audit-logs" className="btn btn-sm btn-ghost"><FileText size={14} /> 审计日志</Link>
                </div>
                <div className="home-context-item">
                  <Link href="/staff" className="btn btn-sm btn-ghost"><ShieldCheck size={14} /> 员工列表</Link>
                </div>
              </div>
            </DataCard>
          </>
        )}
      />
    </div>
  )
}
