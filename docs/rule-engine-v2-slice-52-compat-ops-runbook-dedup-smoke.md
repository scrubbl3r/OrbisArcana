# Rule Engine v2 Slice 52 Smoke

Date: 2026-03-12
Scope: consolidate compatibility doc operational guidance to the primary smoke runbook.

## Changes in this slice

- Updated `docs/rule-engine-compatibility.md`:
  - Replaced duplicated command list with:
    - primary runbook pointer to `docs/rule-engine-smoke.md`
    - minimal supplemental diagnostics (`report-drift:v2`, `doctor:v2`)

## Why this is safe

- Documentation-only update.
- Reduces duplicated operational instructions across active docs.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- Doc policy checks remain green.
