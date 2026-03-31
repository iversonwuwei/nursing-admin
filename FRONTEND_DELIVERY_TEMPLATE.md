# Admin Frontend Delivery Template

Use this template before changing user-facing admin routes, dashboards, filters, forms, cards, or server-side data loading.

## Scope

- Change name:
- Entry route or page:
- Affected users:
- Rollout stage:

## User Impact

- What changes for users:
- What must remain unchanged:
- Fallback or hide path:

## Data Source

- Server component, client component, or route handler boundary:
- Upstream API, proxy, or mock source:
- Config, auth, or permission dependencies:

## UI States

- Loading state:
- Empty state:
- Error state:
- Mobile impact:

## Observability And Health Signals

- Healthy signal:
- Failure signal:
- Stable selectors, logs, or reproducible UI states:

## Verification Gate

- Minimum gate: `npm run lint`
- Stronger gate when behavior changes: `npm run lint` and `npm run build`
- Manual verification path:

## Rollback

- Rollback trigger:
- Rollback method:
- User-visible state after rollback:

## Dependencies And Risks

- New dependency or script:
- Known risks:
- Unverified items: