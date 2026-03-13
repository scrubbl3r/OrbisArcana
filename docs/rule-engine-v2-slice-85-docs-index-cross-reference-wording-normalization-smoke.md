# Rule Engine v2 Slice 85 Smoke

Date: 2026-03-12
Scope: normalize docs-index cross-reference wording for section pointers.

## Changes in this slice

- Updated `docs/rule-engine-v2-docs-index.md`:
  - replaced remaining `->` reference phrasing with consistent comma-separated section pointers in:
    - **Smoke Packs** (human gameplay pack)
    - **Before Push Checklist** items 4 and 5

## Why this is safe

- Documentation-only wording cleanup.
- Keeps cross-reference style consistent across the active v2 index.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- Doc policy checks remain green.
