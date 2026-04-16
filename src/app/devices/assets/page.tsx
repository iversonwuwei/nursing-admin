import { StandardModulePage } from '@/components/nh'
import { devicesAssetsPage } from '@/lib/data/standard-pages'

export default function DeviceAssetsPage() {
  return <StandardModulePage config={devicesAssetsPage} routePath="/devices/assets" />
}