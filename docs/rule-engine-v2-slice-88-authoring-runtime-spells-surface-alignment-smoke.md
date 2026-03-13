# Rule Engine v2 Slice 88 Smoke

Date: 2026-03-12
Scope: align authoring runbook runtime integration surface listing with active v2 compatibility/index docs.

## Changes in this slice

- Updated `docs/rule-engine-authoring.md`:
  - in **Runtime Integration Files (Do Not Edit Daily)**, added
    `src/content/spells/runtime-spells.js`

## Why this is safe

- Documentation-only update.
- Keeps runtime integration surface inventory consistent across active v2 docs.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- Doc policy checks remain green.
