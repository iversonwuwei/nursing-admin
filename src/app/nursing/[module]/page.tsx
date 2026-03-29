import { notFound } from 'next/navigation'
import { StandardModulePage } from '@/components/nh'
import { nursingPages } from '@/lib/data/standard-pages'

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

  return <StandardModulePage config={config} />
}