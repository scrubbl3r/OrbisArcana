# Rule Engine v2 Slice 60 Smoke

Date: 2026-03-12
Scope: deduplicate generated-artifact editing guidance in the v2 docs index.

## Changes in this slice

- Updated `docs/rule-engine-v2-docs-index.md` FAQ:
  - replaced repeated generated-artifact list with a pointer to
    **File Ownership Map** -> **Generated artifacts (do not hand-edit)**

## Why this is safe

- Documentation-only update.
- Reduces repeated guidance and keeps one authoritative artifact list.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- Doc policy checks remain green.
