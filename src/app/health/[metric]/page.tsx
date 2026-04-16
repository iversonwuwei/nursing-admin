import { StandardModulePage } from '@/components/nh'
import { healthMetricPages } from '@/lib/data/standard-pages'
import { notFound } from 'next/navigation'

export default async function HealthMetricPage({
  params,
}: {
  params: Promise<{ metric: string }>
}) {
  const { metric } = await params
  const config = healthMetricPages[metric]

  if (!config) {
    notFound()
  }

  return <StandardModulePage config={config} routePath={`/health/${metric}`} />
}