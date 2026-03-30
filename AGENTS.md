<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Harness Engineering Rules

This repository uses Harness Engineering as the default delivery model for all future implementation work.

### Core Execution Rules

- Design every change as the smallest reviewable delivery unit. State entry points, affected users, rollout stage, validation gate, and rollback path before making substantial edits.
- Prefer root-cause fixes over surface patches, but keep the blast radius narrow. Do not mix unrelated cleanup into a feature or bug fix.
- Treat verification as a release gate, not a formality. Every change must have explicit success signals such as type checks, lint, tests, build output, logs, metrics, or observable UI behavior.
- Distinguish three outcomes in status reporting: implemented, verified, and residual risk. Do not describe unverified behavior as confirmed.

### Release Safety And Rollback

- For user-visible or operationally risky changes, prefer progressive delivery patterns inspired by Harness CD and Feature Flags: staged rollout, scoped exposure, or a reversible switch.
- If the codebase does not support a runtime flag, document the fallback rollback method before proceeding.
- When behavior changes affect production-like flows, define the health signals that indicate safe release. If no signal exists, call out that gap and use the best available proxy.
- Prefer reversible data and config changes. Avoid one-way migrations unless the task explicitly requires them and the rollback impact is documented.

### Verification Standards

- Frontend changes must describe user impact, data source, loading state, empty state, error state, and mobile impact.
- Backend changes must describe service boundary, dependency calls, idempotency expectations, failure modes, logging, and monitoring impact.
- API or schema changes must describe compatibility, affected callers, field evolution strategy, examples, and rollback approach.
- When runtime behavior changes, add or preserve observable signals that support continuous verification, such as structured logs, metrics, alert hooks, or deterministic UI state checks.

### Configuration And Infrastructure Governance

- Treat infrastructure and configuration as declarative assets. Prefer reviewed diffs, plan output, and explicit impact analysis over ad hoc mutation.
- For infrastructure-related work, inspect what changes before applying it. Approval, plan review, drift awareness, and policy constraints are first-class concerns.
- Avoid changing opaque generated state unless there is no better option and the reason is documented.

### Dependency And Supply Chain Rules

- Any new dependency, build script, container artifact, or external tool must be justified with source, purpose, risk, and minimum necessity.
- Prefer no new dependency when the existing platform or standard library is sufficient.
- Favor dependencies with transparent provenance and broad ecosystem trust. If trust or maintenance posture is unclear, note that risk.
- Preserve reproducibility where possible. Do not introduce steps that make builds harder to audit, attest, or reproduce.

### Working Templates

- Frontend template: scope -> user impact -> data/mock source -> UI states -> verification -> rollback.
- Backend template: scope -> contract/dependencies -> failure handling -> observability -> verification -> rollback.
- API template: scope -> compatibility -> caller impact -> schema examples -> verification -> rollback.

### Source Of Truth

- Public reference for this working style is the Harness documentation hub: <https://developer.harness.io/docs>
- The most relevant reference areas for this repository are Continuous Delivery verification, Feature Flags, Infrastructure as Code Management, and Software Supply Chain Security.
