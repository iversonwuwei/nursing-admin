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
- src/app/elderly/[id]/page.tsx
- src/app/elderly/[id]/edit/page.tsx
- src/app/elderly/health/page.tsx
- src/app/elderly/vitals/page.tsx
- src/app/elderly/visits/page.tsx
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
- src/app/equipment/[id]/page.tsx
- src/app/equipment/monitor/page.tsx
- src/app/equipment/stats/page.tsx
- src/app/equipment/status/page.tsx

## Finance, Supplies, Analytics, Data

- src/app/financial/page.tsx
- src/app/supplies/page.tsx
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

- Implemented: repository rules, local delivery template, thin local delivery index, route inventory, route-level delivery docs archived in nursing-documents through batch fifteen, a reviewer-facing route verification checklist, and first-pass smoke automation for critical routes
- Not yet completed: expand automated route verification beyond the current root/login/AI assistant/compatibility/elderly-create/master-data smoke slice
- Default verification gates: `npm run lint`, plus `npm run build` for behavior-changing work
