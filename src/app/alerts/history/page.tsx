import { StandardModulePage } from '@/components/nh'
import { ModuleEntitlementGate } from '@/components/platform/ModuleEntitlementGate'
import { alertsHistoryPage } from '@/lib/data/standard-pages'

export default function AlertsHistoryPage() {
  return (
    <ModuleEntitlementGate
      module="alert-service"
      pageTitle="报警历史"
      moduleLabel="报警服务"
      disabledSummary="当前租户未开通报警服务，报警历史页保留为只读禁用态。"
    >
      <StandardModulePage config={alertsHistoryPage} routePath="/alerts/history" />
    </ModuleEntitlementGate>
  )
}