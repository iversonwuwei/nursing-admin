import { StandardModulePage } from '@/components/nh'
import { NursingCheckinManagementPage } from '@/components/nursing/NursingCheckinManagementPage'
import { NursingExecutionOverviewPage, ServicePackagesPage, ServicePlansPage } from '@/components/nursing/NursingWorkflowPages'
import { ModuleEntitlementGate } from '@/components/platform/ModuleEntitlementGate'
import { nursingPages } from '@/lib/data/standard-pages'
import { notFound, redirect } from 'next/navigation'

export default async function NursingModulePage({
  params,
}: {
  params: Promise<{ module: string }>
}) {
  const { module } = await params
  const config = nursingPages[module]

  if (!config) {
    notFound()
  }

  if (module === 'packages') {
    return (
      <ModuleEntitlementGate module="ltci-service" pageTitle="评定标准配置" moduleLabel="评定与长护险">
        <ServicePackagesPage />
      </ModuleEntitlementGate>
    )
  }

  if (module === 'plans') {
    return (
      <ModuleEntitlementGate module="ltci-service" pageTitle="认定方案模板" moduleLabel="评定与长护险">
        <ServicePlansPage />
      </ModuleEntitlementGate>
    )
  }

  if (module === 'services') {
    return (
      <ModuleEntitlementGate module="ltci-service" pageTitle="长护险业务总览" moduleLabel="评定与长护险">
        <NursingExecutionOverviewPage />
      </ModuleEntitlementGate>
    )
  }

  if (module === 'schedule') {
    redirect('/staff/schedule')
  }

  if (module === 'checkin') {
    return <NursingCheckinManagementPage />
  }

  return <StandardModulePage config={config} routePath={`/nursing/${module}`} />
}