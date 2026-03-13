# Rule Engine v2 Slice 78 Smoke

Date: 2026-03-12
Scope: tighten FAQ command-reference guidance in v2 docs index.

## Changes in this slice

- Updated `docs/rule-engine-v2-docs-index.md` FAQ:
  - `Why did my runtime/generated docs change after checks?` now points only to
    **Command Quick Reference** (removed redundant **Smoke Packs** mention)

## Why this is safe

- Documentation-only update.
- Improves precision by pointing to the canonical command-definition section.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- Doc policy checks remain green.
