<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Harness Engineering Rules

This repository uses Harness Engineering as the default delivery model for all future implementation work.

### Operating Model

- Design every change as the smallest reviewable delivery unit.
- Before substantial edits, state the entry points, affected users, rollout stage, validation gate, and rollback path.
- Prefer root-cause fixes over surface patches, but keep the blast radius narrow.
- Do not mix unrelated cleanup into feature, bug-fix, or migration work.
- Distinguish three outcomes in status reporting: implemented, verified, and residual risk.

### Release Safety And Progressive Delivery

- For user-visible, operational, or data-sensitive changes, prefer staged exposure inspired by Harness CD and Feature Flags.
- If a runtime flag or gradual rollout is not available, explicitly document the fallback rollback method before changing behavior.
- Treat deployment and release as separate decisions when practical. Code can land before behavior is broadly exposed.
- Prefer reversible changes to routing, configuration, schema usage, and cached data behavior.
- Avoid one-way migrations unless the task explicitly requires them and the rollback cost is documented.

### Verification As A Gate

- Verification is mandatory, not ceremonial. Each change must have explicit success signals.
- Use the smallest sufficient gate first, then add stronger gates when behavior risk increases.
- Acceptable signals include lint, type checks, tests, build output, logs, metrics, deterministic UI states, and observable user flows.
- If something cannot be verified locally, state the gap and the best available proxy signal.

### Observability And Reliability

- Follow the Harness Continuous Verification mindset: behavior changes should leave behind evidence that the system is healthy or unhealthy.
- Preserve or add observable signals for critical paths, such as structured logs, loading and error state assertions, metrics hooks, audit trails, or stable UI selectors.
- When a change affects an important workflow, define what “healthy” means before implementation.
- Prefer measurable success criteria over subjective confirmation.

### Governance, Config, And IaC

- Treat infrastructure, deployment config, and environment-specific behavior as declarative assets.
- Prefer reviewed diffs, plan output, approval points, and impact analysis over ad hoc mutation.
- For config changes, call out scope, default values, environment variance, and rollback steps.
- Avoid editing opaque generated state unless there is no safer alternative and the reason is documented.
- When introducing automation, keep Git as the review surface and source of truth where possible.

### Dependency And Supply Chain Rules

- Any new dependency, build script, external service, or tool must be justified with source, purpose, risk, and minimum necessity.
- Prefer no new dependency when the standard library or current stack is sufficient.
- Favor dependencies with transparent provenance and broad ecosystem trust.
- Preserve reproducibility. Do not introduce steps that make builds harder to audit, attest, or replay.
- For sensitive integrations, document secrets handling, permission scope, and failure behavior.

### Frontend Rules For This Repository

- This repository is a user-facing Next.js admin frontend. Treat every UI change as release-sensitive.
- For each meaningful UI change, describe user impact, data source, loading state, empty state, error state, and mobile impact.
- Respect server and client component boundaries. Do not add client behavior where a server boundary is sufficient.
- Prefer deterministic rendering and state transitions so that regressions are visible in build output or reproducible browser flows.
- If a change affects dashboards, lists, filters, or forms, define the primary health signal that indicates safe release.

### API And Backend-Like Work In This Repository

- If editing route handlers, proxy logic, or server-side data loading, describe service boundaries, downstream dependencies, failure modes, and caller compatibility.
- Maintain backward compatibility for response shapes unless the task explicitly authorizes a breaking change.
- For schema or contract changes, include example inputs and outputs, affected callers, and rollback strategy.

### Required Delivery Template

- Frontend: scope -> user impact -> data source -> loading, empty, error, mobile states -> verification -> rollback.
- Backend or server-side logic: scope -> contract and dependencies -> failure handling -> observability -> verification -> rollback.
- API or schema: scope -> compatibility -> caller impact -> field evolution strategy -> examples -> verification -> rollback.

### Repository Verification Gates

- Minimum gate for code changes: `npm run lint`.
- Required gate for behavior-changing or route-affecting changes: `npm run lint` and `npm run build`.
- If a change cannot pass `npm run build` because of pre-existing issues, document the exact blocker and the residual risk.

### Source Of Truth

- Primary reference: <https://developer.harness.io/docs>
- GitHub source reference: <https://github.com/harness/developer-hub>
- Most relevant Harness areas for this repository: Continuous Delivery verification, Feature Flags, Infrastructure as Code Management, Software Supply Chain Security, and release-oriented observability.
