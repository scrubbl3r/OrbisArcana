# Rule Engine v2 Slice 61 Smoke

Date: 2026-03-12
Scope: deduplicate smoke command guidance in the v2 docs index.

## Changes in this slice

- Updated `docs/rule-engine-v2-docs-index.md`:
  - `Common Edit Recipes` now points to **Smoke Packs** instead of repeating command lines.

## Why this is safe

- Documentation-only update.
- Keeps one authoritative smoke command section in the index.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- Doc policy checks remain green.
