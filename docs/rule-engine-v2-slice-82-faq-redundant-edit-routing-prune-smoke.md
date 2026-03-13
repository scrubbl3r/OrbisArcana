# Rule Engine v2 Slice 82 Smoke

Date: 2026-03-12
Scope: prune redundant FAQ entries that only redirect to common edit recipes.

## Changes in this slice

- Updated `docs/rule-engine-v2-docs-index.md`:
  - removed three FAQ items that duplicated **Common Edit Recipes** routing
  - kept only unique operational FAQs (artifact regeneration and no-hand-edit guidance)

## Why this is safe

- Documentation-only update.
- Reduces repetition and keeps edit workflows centralized in one section.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- Doc policy checks remain green.
