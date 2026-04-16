import { StandardModulePage } from '@/components/nh'
import { settingsPage } from '@/lib/data/standard-pages'

export default function SettingsPage() {
  return <StandardModulePage config={settingsPage} routePath="/settings" />
}