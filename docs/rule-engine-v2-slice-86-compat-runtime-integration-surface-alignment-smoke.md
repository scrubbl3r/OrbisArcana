# Rule Engine v2 Slice 86 Smoke

Date: 2026-03-12
Scope: align compatibility runbook runtime integration surface listing with active v2 docs index coverage.

## Changes in this slice

- Updated `docs/rule-engine-compatibility.md`:
  - in **Runtime Integration Files (Do Not Edit Daily)**, added:
    - `src/content/spell-rules/rule-engine-master-control.js`
    - `src/content/spell-rules/validate-rule-engine-config.js`

## Why this is safe

- Documentation-only update.
- Removes cross-doc surface mismatch and improves consolidated guidance for v2 runtime integration boundaries.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- Doc policy checks remain green.
