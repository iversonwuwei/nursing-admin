import { notFound } from 'next/navigation'
import HealthMetricClient from './health-metric-client'

export default async function HealthMetricPage({
  params,
}: {
  params: Promise<{ metric: string }>
}) {
  const { metric } = await params

  if (metric !== 'bp' && metric !== 'hr' && metric !== 'sleep') {
    notFound()
  }

  return <HealthMetricClient metric={metric} />
}