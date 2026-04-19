# Admin Route Inventory

This file inventories the current admin app routes so delivery planning can be done in route-sized units instead of ad hoc file edits.

## Root And Core Routes

- src/app/page.tsx
- src/app/dashboard/page.tsx
- src/app/login/page.tsx
- src/app/notifications/page.tsx
- src/app/settings/page.tsx
- src/app/settings/roles/page.tsx

## Elderly And Health

- src/app/elderly/page.tsx
- src/app/elderly/new/page.tsx
- src/app/elderly/import/page.tsx
- src/app/elderly/[id]/page.tsx
- src/app/elderly/[id]/edit/page.tsx
- src/app/elderly/health/page.tsx
- src/app/elderly/health/new/page.tsx
- src/app/elderly/vitals/page.tsx
- src/app/elderly/vitals/new/page.tsx
- src/app/elderly/visits/page.tsx
- src/app/elderly/visits/new/page.tsx
- src/app/elderly/checkin/page.tsx
- src/app/health/page.tsx
- src/app/health/[metric]/page.tsx
- src/app/health-monitoring/page.tsx

## Alerts, Incidents, And Activities

- src/app/alerts/page.tsx
- src/app/alerts/history/page.tsx
- src/app/incidents/page.tsx
- src/app/incidents/new/page.tsx
- src/app/incidents/[id]/page.tsx
- src/app/activities/page.tsx
- src/app/activities/new/page.tsx
- src/app/activities/[id]/page.tsx

## Staff, Organizations, Rooms

- src/app/staff/page.tsx
- src/app/staff/new/page.tsx
- src/app/staff/[id]/page.tsx
- src/app/staff/tasks/page.tsx
- src/app/staff/schedule/page.tsx
- src/app/organizations/page.tsx
- src/app/organizations/new/page.tsx
- src/app/organizations/[id]/page.tsx
- src/app/rooms/page.tsx
- src/app/rooms/new/page.tsx
- src/app/rooms/[id]/page.tsx
- src/app/branch/page.tsx

## Devices And Equipment

- src/app/devices/page.tsx
- src/app/devices/[id]/page.tsx
- src/app/devices/assets/page.tsx
- src/app/devices/realtime/page.tsx
- src/app/devices/stats/page.tsx
- src/app/devices/status/page.tsx
- src/app/equipment/page.tsx
- src/app/equipment/new/page.tsx
- src/app/equipment/[id]/page.tsx
- src/app/equipment/monitor/page.tsx
- src/app/equipment/stats/page.tsx
- src/app/equipment/status/page.tsx

## Finance, Supplies, Analytics, Data

- src/app/financial/page.tsx
- src/app/supplies/page.tsx
- src/app/supplies/new/page.tsx
- src/app/supplies/[id]/page.tsx
- src/app/analytics/page.tsx
- src/app/analytics/report/page.tsx
- src/app/data-dashboard/page.tsx

## AI Assistant

- src/app/ai-assistant/page.tsx
- src/app/ai-assistant/logs/page.tsx
- src/app/ai-assistant/rules/page.tsx
- src/app/ai-assistant/inference/page.tsx
- src/app/ai-assistant/family-app/page.tsx
- src/app/ai-assistant/staff-app/page.tsx

## Current Status

- Implemented: repository rules, local delivery template, thin local delivery index, route inventory, route-level delivery docs archived in nursing-documents through batch seventeen, a reviewer-facing route verification checklist, and first-pass smoke automation for critical routes including elderly create or import, staff, and visits create loops plus master-data stability
- Not yet completed: expand automated route verification beyond the current root/login/AI assistant/compatibility/elderly-create-or-import/staff-create/visits-create/master-data smoke slice
- Default verification gates: `npm run lint`, plus `npm run build` for behavior-changing work

## Current Data Source Audit

This section is the current route-facing integration audit for admin. It does not claim that every route in the repo has been fully re-audited. It records the routes that were checked directly in code and separates truly backend-backed pages from pages that still keep frontend mock state or demo fallback behavior.

### Backend-Backed Routes

- `/`, `/dashboard`: both routes render the same live homepage aggregate from `src/app/page.tsx`, which reads `/api/dashboard/overview` and keeps service errors explicit instead of switching back to local homepage KPIs.
- `/analytics`, `/data-dashboard`: both routes render the same Admin BFF aggregate page through `src/lib/dashboard/admin-dashboard-api.ts` and `/api/dashboard/overview`.
- `/analytics/report`: the page reads live dashboard aggregate data plus backend AI report requests through `src/lib/ai/admin-ai-api.ts`; on failure it keeps a `Live Unavailable` error state and does not fall back to local report drafts.
- `/alerts`: the page now reads only real alert queue data through `src/lib/services/admin-module-services.ts` and real AI alert suggestions through `src/lib/ai/admin-ai-api.ts`; on failure it stays in explicit live error state and no longer falls back to `alertRecords` or mock AI helpers.
- `/activities`, `/activities/new`, `/activities/[id]`: route family now reads and writes through `src/lib/services/admin-operations-services.ts`, the shared Next proxy under `src/app/api/admin-operations/[...segments]/route.ts`, and Admin BFF operations endpoints; page-level AI sidebars remain local helper output, but records and publish actions are live-only with explicit loading, error, and not-found handling.
- `/financial`: the page now reads only Billing summary and invoices through `src/lib/services/admin-module-services.ts`; on failure it stays in an explicit live error state and no longer falls back to assessment-derived local settlement views.
- `/incidents`, `/incidents/new`, `/incidents/[id]`: route family now reads and writes through `src/lib/services/admin-operations-services.ts`, the shared Next proxy, and Admin BFF operations endpoints; incident records no longer come from `operations-workflow`, while page-level AI summaries still use local helper generation.
- `/organizations`, `/organizations/[id]`: page data comes from `src/lib/organizations/admin-organization-api.ts`, which reads real admin organization list and detail payloads.
- `/equipment`, `/equipment/new`, `/equipment/[id]`, `/equipment/monitor`, `/equipment/stats`, `/equipment/status`: route family now reads and writes through `src/lib/services/admin-operations-services.ts`; monitor, status, and stats views are derived from the live equipment list via `src/lib/equipment/equipment-live-derivations.ts`, while page-level AI narratives remain local helper output.
- `/devices`, `/devices/[id]`, `/devices/realtime`, `/devices/stats`, `/devices/status`: these routes alias the corresponding `/equipment/**` pages, so they now inherit the same live equipment-backed behavior instead of the old static shell behavior.
- `/rooms`, `/rooms/new`, `/rooms/[id]`: page data comes from `src/lib/rooms/admin-room-api.ts`, and `/rooms/new` also reads enabled organizations from the live organization API.
- `/staff`, `/staff/new`, `/staff/[id]`: page data comes from `src/lib/staff/admin-staff-api.ts`, and the create page reads enabled organizations from the live organization API.
- `/staff/schedule`: the page now reads only `/api/nursing/workflow/board` through `src/lib/nursing-workflow/admin-workflow-board-api.ts`; on failure it keeps a live error state and no longer subscribes to `nursing-service-workflow` demo fallback or local AI schedule helpers.
- `/supplies`, `/supplies/new`, `/supplies/[id]`: route family now reads and writes through `src/lib/services/admin-operations-services.ts` and the shared operations proxy; stock activation, intake, and detail views are live-only with explicit loading and error states, while page-level AI procurement narratives remain local helper output.
- `/elderly`, `/elderly/[id]`, `/elderly/health`, `/elderly/health/new`: current route set reads and writes through `src/lib/elderly/admin-elderly-api.ts` and the matching Next proxy routes.
- `/settings/static-texts`, `/settings/option-groups`, `/settings/audit-logs`: pages import `src/lib/mock/content-management-workflow.ts`, but when `NEXT_PUBLIC_CONTENT_MANAGEMENT_MODE=bff` that module switches to `/api/content/*` and becomes Config Service-backed instead of local demo-backed.
- `/notifications`: page data comes from `src/lib/services/admin-module-services.ts`; on successful reads the page stays on the real notification summary and queue and does not fall back to local demo notifications.

### Frontend Mock Routes

- `/branch`: page state is still a local array in `src/app/branch/page.tsx`, and the UI explicitly marks the route as local overview data pending future organization-service aggregation.
- `/settings`, `/settings/roles`: both routes render `StandardModulePage` static config from `src/lib/data/standard-pages.tsx`, not real configuration APIs.
- `/alerts/history`: the route renders `StandardModulePage` static config from `src/lib/data/standard-pages.tsx` using local `alertRecords`, not persisted alert-history queries.
- `/devices/assets`: the route renders `StandardModulePage` static config from `src/lib/data/standard-pages.tsx`, not a real device asset API.
- `/staff/tasks`: page state still depends on `src/lib/mock/assessment-workflow.ts` and `src/lib/mock/nursing-service-workflow.ts`, including local task actions and workflow subscriptions.
- `/elderly/import`: import flow is still a frontend simulation path; the page explicitly documents current OCR and file-ingest behavior as demo.
- `/elderly/entrustment`: current source of truth still comes from assessment or admission workflow-derived frontend state rather than a dedicated live backend route.
- `/elderly/face`: current face enrollment flow still runs from `src/lib/mock/face-enrollment-workflow.ts`.

### Fallback Or Mixed Routes

- `/elderly/checkin`: assessment case list is live, but rules, templates, and partner-collaboration blocks are intentionally rendered as `Pending Integration`.
- `/nursing/[module]`: nursing service pages are not a single-source route family yet; current behavior still depends on `src/lib/mock/nursing-service-workflow.ts`, mode flags, and live-vs-demo workflow switching.
- `/operations/daily`: page now reads live dashboard aggregate data, but still exposes `Pending Integration` for unsupported modules instead of being fully backend-complete across every block.
- `/ai-assistant`, `/ai-assistant/qa`: request paths are backend-backed, but tenant or auth context can still arrive through demo fallback in `src/lib/server/platform-auth.ts` when platform auth is unavailable.
- `/ai-assistant/family-app`, `/ai-assistant/staff-app`: these pages support BFF mode, but they still branch on `isAdminAiDemoMode()` and keep explicit demo preview mode.

### Not Fully Re-Audited Yet

- `/health`
- `/health/[metric]`
- `/health-monitoring`
- `/elderly/vitals`, `/elderly/vitals/new`, `/elderly/visits`, `/elderly/visits/new`, `/elderly/[id]/edit`, `/elderly/new`

Routes in this last group should not be described as fully backend-integrated until they are checked individually against their current page-level data source and runtime behavior.
