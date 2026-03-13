# Rule Engine v2 Slice 83 Smoke

Date: 2026-03-12
Scope: align docs index runtime integration/config surface coverage with the actual v2 validation entrypoint.

## Changes in this slice

- Updated `docs/rule-engine-v2-docs-index.md`:
  - under **Runtime integration/config surfaces**, added
    `src/content/spell-rules/validate-rule-engine-config.js`

## Why this is safe

- Documentation-only update.
- Improves discoverability of the runtime config-validation surface without changing behavior.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- Doc policy checks remain green.
