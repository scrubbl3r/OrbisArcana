# Rule Engine v2 Slice 47 Smoke

Date: 2026-03-12
Scope: clarify boundary between active runbooks and archived slice logs.

## Changes in this slice

- Updated docs index and smoke guide to mark slice logs as archive-only records:
  - `docs/rule-engine-v2-docs-index.md`
  - `docs/rule-engine-smoke.md`
- Added explicit "not active runbook" guidance where historical logs are referenced.

## Why this is safe

- Documentation-only changes.
- Reduces risk of following retired or historical instructions during active operations.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- No regressions in docs/contract checks.
