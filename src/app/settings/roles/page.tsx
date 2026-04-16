import { StandardModulePage } from '@/components/nh'
import { settingsRolesPage } from '@/lib/data/standard-pages'

export default function SettingsRolesPage() {
  return <StandardModulePage config={settingsRolesPage} routePath="/settings/roles" />
}