# Rule Engine v2 Slice 73 Smoke

Date: 2026-03-12
Scope: remove circular smoke guidance pointer from common edit recipes.

## Changes in this slice

- Updated `docs/rule-engine-v2-docs-index.md`:
  - removed `Common Edit Recipes` bullet that only redirected to **Smoke Packs**

## Why this is safe

- Documentation-only update.
- Reduces circular guidance and keeps smoke commands centralized in **Smoke Packs**.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- Doc policy checks remain green.
