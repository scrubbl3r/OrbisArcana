# Rule Engine v2 Slice 46 Smoke

Date: 2026-03-12
Scope: normalize historical legacy-bridge slice content to archive-only guidance.

## Changes in this slice

- Replaced actionable retired bridge test steps in:
  - `docs/rule-engine-v2-slice-03-legacy-rules-bridge-smoke.md`
- Kept historical context while removing obsolete operational instructions.

## Why this is safe

- Documentation-only cleanup.
- Prevents accidental use of retired bridge controls in active workflows.
- Active runtime contracts and checks are unchanged.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- No regressions in doc terminology/contract checks.
