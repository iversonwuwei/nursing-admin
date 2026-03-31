# Admin Route Verification Checklist

This file defines the minimum manual regression checklist for governed admin routes. It is the smallest practical verification layer before dedicated automated route coverage exists.

## Scope

- Audience: admin frontend maintainers and reviewers
- Coverage target: root and high-frequency governed routes that carry cross-module navigation or AI context
- Default gate: npm run lint
- Stronger gate for behavior-changing work: npm run lint and npm run build
- Rollback path: revert the route behavior change together with any checklist update that depends on it

## Critical Routes

### Root And Auth

- [ ] Root route `/` opens the admin home and renders KPI, AI summary, and task overview together.
- [ ] Login route `/login` accepts the demo credentials flow, successful login returns to `/`, and invalid credentials show an error message.

### AI Entry And Context

- [ ] AI root route `/ai-assistant` opens the AI hub and shows the summary cards and child-page navigation.
- [ ] Entering `/ai-assistant` with tracking query params keeps source, entity, focus, and target context visible.
- [ ] Continuing from AI root to `/ai-assistant/inference`, `/ai-assistant/rules`, or `/ai-assistant/logs` preserves the same tracking context.

### Equipment And Devices

- [ ] `/equipment` and `/devices` still present the same overview semantics in the current compatibility model.
- [ ] `/equipment/status` and `/devices/status` still present the same status-board semantics in the current compatibility model.
- [ ] `/equipment/monitor` shows totals, realtime cards, and alert history with matching counts.
- [ ] `/equipment/[id]` keeps device detail, history, maintenance summary, and AI entry aligned to the same device.

### Elderly Workflow

- [ ] `/elderly/new` can submit required fields and return to the elderly list.
- [ ] `/elderly/[id]/edit` shows prefilled data and returns to the detail route after submit.
- [ ] `/elderly/checkin` keeps the admission loop consistent after create, confirm, and admit actions.
- [ ] `/elderly/health`, `/elderly/vitals`, and `/elderly/visits` keep their summary cards, filters, and table counts aligned.

### Health And Analytics

- [ ] `/health` and `/health-monitoring` still resolve to the same health overview semantics.
- [ ] A valid `/health/[metric]` route renders the configured standard module page, and an invalid metric returns notFound.
- [ ] `/analytics` and `/data-dashboard` still resolve to the same analytics dashboard semantics.
- [ ] `/analytics/report` can switch weekly and monthly summary views without losing report structure.

## Release Notes

- Use this checklist only for routes already covered by delivery notes.
- When a route stops being a compatibility alias and becomes an independent view, update both the delivery note and the checklist in the same change.
- When automated tests are introduced later, keep this checklist as the reviewer-facing smoke path instead of deleting it outright.