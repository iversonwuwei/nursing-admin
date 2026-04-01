# Admin Delivery Index

This file is the thin local delivery entry for nursing-admin-v2. Canonical route delivery notes are archived in nursing-documents, while this repository keeps the execution-facing template, route inventory, checklist, and verification gates.

## Local Template

- [Frontend delivery template](./FRONTEND_DELIVERY_TEMPLATE.md)
- [Admin route verification checklist](./ROUTE_VERIFICATION_CHECKLIST.md)

## Canonical Archive

- [Admin route delivery archive](../nursing-documents/docs/ui/admin-delivery/index.md)
- [Workspace document index](../nursing-documents/docs/doc-index.md)

## Current Status

- Repository-level Harness Engineering rules live in [AGENTS.md](./AGENTS.md)
- Cross-project templates still live in nursing-documents/templates/
- Route-level delivery note正文已迁移到 nursing-documents/docs/ui/admin-delivery/
- This repo can use the local frontend template before changing dashboards, filters, lists, forms, route handlers, or server-side data loading
- Route-level smoke automation is now available via `npm run test:smoke`, and the stronger end-to-end gate is available via `npm run verify:smoke`, for root, login, equipment and devices status compatibility, AI assistant context flow, health compatibility plus metric routing, analytics alias plus report switching, the elderly create loop, the elderly import loop, the staff create loop, the visits create loop, and master-data route stability across rooms and organizations
- The canonical archive now also includes a cross-cutting create-flow solution and route notes for the remaining add/create modules in batch sixteen.
- Full route-level history and batch grouping are now maintained in the canonical archive instead of this repo root.

## Suggested Next Delivery Units

- Expand smoke automation from the current governed slice into equipment, supplies, health archive, or vitals create-loop routes
- If route-level create flows change again, keep one resource-domain and one health-service create-loop path under smoke by default
- If admin behavior work starts, add npm run build as the default stronger gate for newly governed routes
- If test infrastructure is introduced later, map checklist items to automated route coverage instead of replacing delivery notes

## Expected Verification Gates

- `npm run lint`
- `npm run build` for behavior-changing or route-affecting work
- `npm run test:smoke` for the first automated browser smoke path
- `npm run verify:smoke` for the combined lint, build, and smoke route gate
