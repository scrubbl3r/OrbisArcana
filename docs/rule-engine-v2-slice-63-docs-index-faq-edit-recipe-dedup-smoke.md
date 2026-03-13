# Rule Engine v2 Slice 63 Smoke

Date: 2026-03-12
Scope: deduplicate FAQ and edit-recipe guidance in the v2 docs index.

## Changes in this slice

- Updated `docs/rule-engine-v2-docs-index.md` FAQ:
  - replaced duplicated spell toggle/interaction-chain answers with pointers to
    **Common Edit Recipes**

## Why this is safe

- Documentation-only update.
- Keeps one authoritative location for common edit workflows.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- Doc policy checks remain green.
