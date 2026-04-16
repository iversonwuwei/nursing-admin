'use client'

import { DataCard, EmptyState, InteractionRailLayout, PageHeader, PageHelpCard, StatCard, Tag } from '@/components/nh'
import { matchesAdmissionScene } from '@/lib/care-scenes'
import { getAdmissionApplicationsSnapshot, getAssessmentStatusLabel, getAssessmentStatusVariant, subscribeAdmissionWorkflow, type AdmissionApplication } from '@/lib/mock/admission-workflow'
import { Building2, ClipboardCheck, HandCoins, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState, useSyncExternalStore } from 'react'

function formatCurrency(amount?: number) {
  if (typeof amount !== 'number') {
    return '待补录'
  }

  return `￥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function getEntrustmentVariant(type?: AdmissionApplication['entrustmentType']) {
  if (type === '政府委托') return 'primary'
  if (type === '企业委托') return 'info'
  return 'neutral'
}

export default function ElderlyEntrustmentPage() {
  const searchParams = useSearchParams()
  const selectedFromQuery = searchParams.get('selected')
  const applications = useSyncExternalStore(
    subscribeAdmissionWorkflow,
    getAdmissionApplicationsSnapshot,
    getAdmissionApplicationsSnapshot,
  )
  const institutionalApplications = useMemo(
    () => applications.filter(application => matchesAdmissionScene(application.sourceType, 'institutional')),
    [applications],
  )
  const [selectedId, setSelectedId] = useState(selectedFromQuery ?? institutionalApplications[0]?.id ?? '')

  const selectedApplication = useMemo(
    () => institutionalApplications.find(application => application.id === selectedId)
      ?? institutionalApplications.find(application => application.id === selectedFromQuery)
      ?? institutionalApplications[0]
      ?? null,
    [institutionalApplications, selectedFromQuery, selectedId],
  )

  const stats = useMemo(() => {
    const government = institutionalApplications.filter(application => application.entrustmentType === '政府委托').length
    const enterprise = institutionalApplications.filter(application => application.entrustmentType === '企业委托').length
    const subsidyTotal = institutionalApplications.reduce((sum, application) => sum + (application.monthlySubsidy ?? 0), 0)
    const serviceBindings = institutionalApplications.reduce((sum, application) => sum + (application.serviceItems?.length ?? 0), 0)

    return {
      total: institutionalApplications.length,
      government,
      enterprise,
      subsidyTotal,
      serviceBindings,
    }
  }, [institutionalApplications])
  const helpHref = '/elderly/help'

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="机构委托与补贴工作台"
        subtitle="统一查看机构入住老人对应的委托来源、月补贴、固定服务项和认定闭环状态。"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/elderly/new" className="btn btn-primary btn-sm">新增机构入住</Link>
            <Link href="/elderly/checkin?scene=institutional" className="btn btn-secondary btn-sm">进入认定中心</Link>
          </div>
        }
      />

      <InteractionRailLayout
        main={(
          <>
            <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard icon={<Building2 size={18} />} label="机构委托个案" value={stats.total} color="primary" />
        <StatCard icon={<ShieldCheck size={18} />} label="政府委托" value={stats.government} sub="托底套餐" color="success" />
        <StatCard icon={<ClipboardCheck size={18} />} label="企业委托" value={stats.enterprise} sub="企业团单" color="info" />
        <StatCard icon={<HandCoins size={18} />} label="月补贴总额" value={formatCurrency(stats.subsidyTotal)} sub={`${stats.serviceBindings} 项服务绑定`} color="warning" />
            </div>

            <DataCard title="委托个案池" subtitle="按机构养老流程沉淀，点击任一老人可查看委托与服务项详情。">
          {institutionalApplications.length > 0 ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>老人</th>
                    <th>委托</th>
                    <th>月补贴</th>
                    <th>服务项</th>
                    <th>状态</th>
                    <th style={{ textAlign: 'right' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {institutionalApplications.map(application => (
                    <tr key={application.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{application.name}</span>
                          <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{application.id} · {application.room}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <Tag variant={getEntrustmentVariant(application.entrustmentType)}>{application.entrustmentType ?? '待补录'}</Tag>
                          <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{application.entrustmentOrganization ?? '待补录'}</span>
                        </div>
                      </td>
                      <td>{formatCurrency(application.monthlySubsidy)}</td>
                      <td>{application.serviceItems?.length ?? 0} 项</td>
                      <td><Tag variant={getAssessmentStatusVariant(application.status)}>{getAssessmentStatusLabel(application.status)}</Tag></td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setSelectedId(application.id)}>查看</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="暂无机构委托个案" description="先通过入住建档补充委托类型、补贴和服务项，再回到此处集中管理。" />
          )}
            </DataCard>
          </>
        )}
        rail={(
          <>
            <DataCard
              title={selectedApplication ? `${selectedApplication.name} 的委托执行面板` : '委托执行面板'}
              subtitle={selectedApplication ? `${selectedApplication.room} · ${selectedApplication.entrustmentOrganization ?? '待补录委托单位'}` : '选择左侧老人后查看详情'}
              badge={selectedApplication ? <Tag variant={getAssessmentStatusVariant(selectedApplication.status)}>{getAssessmentStatusLabel(selectedApplication.status)}</Tag> : undefined}
            >
              {selectedApplication ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                    <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
                      <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>委托类型</div>
                      <div style={{ marginTop: 6, fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>{selectedApplication.entrustmentType ?? '待补录'}</div>
                    </div>
                    <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
                      <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>月度补贴</div>
                      <div style={{ marginTop: 6, fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>{formatCurrency(selectedApplication.monthlySubsidy)}</div>
                    </div>
                    <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
                      <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>固定服务项</div>
                      <div style={{ marginTop: 6, fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>{selectedApplication.serviceItems?.length ?? 0} 项</div>
                    </div>
                  </div>

                  <div>
                    <div className="info-row"><span className="info-label">委托单位</span><span className="info-value">{selectedApplication.entrustmentOrganization ?? '待补录'}</span></div>
                    <div className="info-row"><span className="info-label">当前认定状态</span><span className="info-value">{getAssessmentStatusLabel(selectedApplication.status)}</span></div>
                    <div className="info-row"><span className="info-label">申请护理等级</span><span className="info-value">{selectedApplication.requestedLevel}</span></div>
                    <div className="info-row"><span className="info-label">认知 / ADL</span><span className="info-value">{selectedApplication.cognitiveLevel} / {selectedApplication.adlScore}</span></div>
                  </div>

                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 10 }}>固定服务项</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {(selectedApplication.serviceItems ?? []).map(item => <Tag key={item} variant="info">{item}</Tag>)}
                      {(selectedApplication.serviceItems ?? []).length === 0 ? <Tag variant="warning">待补录服务项</Tag> : null}
                    </div>
                  </div>

                  <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                    {selectedApplication.serviceNotes || '当前未填写委托补充说明，可进入编辑页补充补贴口径、服务频次和托管说明。'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                    <Link href={`/elderly/${selectedApplication.id}/edit?scene=institutional`} className="btn btn-secondary btn-sm">编辑老人信息</Link>
                    <Link href={`/elderly/checkin?scene=institutional&selected=${selectedApplication.id}`} className="btn btn-primary btn-sm">进入认定闭环</Link>
                  </div>
                </div>
              ) : (
                <EmptyState title="请选择机构个案" description="左侧选择一个老人后，这里会展示委托来源、月补贴、服务项和后续流转入口。" />
              )}
            </DataCard>

            <DataCard title="工作台边界" subtitle="主区只保留对象池和查看动作。" badge={<Tag variant="warning">Boundary</Tag>}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="page-help-card-item">主区用于选择委托个案，不在对象池内重复展开长说明。</div>
                <div className="page-help-card-item">委托类型、月补贴和服务项摘要统一后置到执行面板。</div>
                <div className="page-help-card-item">完整委托工作台说明迁移到帮助页。</div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整机构委托说明迁移到显式帮助页"
              summary="机构委托工作台现在只保留对象池和执行摘要，说明型内容与边界统一后置。"
              items={[
                '先在主区选择委托个案，再查看右侧执行摘要。',
                '补贴与服务项缺失时，优先进入编辑页补齐。',
                '若需要完整说明，进入老人帮助页查看。',
              ]}
              href={helpHref}
              actionLabel="查看老人帮助"
            />
          </>
        )}
      />
    </div>
  )
}