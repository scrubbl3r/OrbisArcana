# Rule Engine v2 Slice 87 Smoke

Date: 2026-03-12
Scope: align docs-index runtime integration surface coverage with compatibility runbook entries.

## Changes in this slice

- Updated `docs/rule-engine-v2-docs-index.md`:
  - in **Runtime integration/config surfaces**, added
    `src/content/spells/runtime-spells.js`

## Why this is safe

- Documentation-only update.
- Keeps runtime integration surface inventory consistent across active v2 runbooks.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- Doc policy checks remain green.
