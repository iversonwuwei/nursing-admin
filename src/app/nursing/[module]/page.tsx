import { NursingExecutionOverviewPage, ServicePackagesPage, ServicePlansPage } from '@/components/nursing/NursingWorkflowPages'
import { StandardModulePage } from '@/components/nh'
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
    return <ServicePackagesPage />
  }

  if (module === 'plans') {
    return <ServicePlansPage />
  }

  if (module === 'services') {
    return <NursingExecutionOverviewPage />
  }

  if (module === 'schedule') {
    redirect('/staff/schedule')
  }

  if (module === 'checkin') {
    redirect('/staff/tasks')
  }

  return <StandardModulePage config={config} />
}