# Rule Engine v2 Slice 68 Smoke

Date: 2026-03-12
Scope: deduplicate push-time smoke guidance in v2 docs index.

## Changes in this slice

- Updated `docs/rule-engine-v2-docs-index.md`:
  - `Quick Start` step 4 now points to **Before Push Checklist**
  - removed duplicated explicit push-time smoke command from Quick Start

## Why this is safe

- Documentation-only update.
- Keeps push requirements in one authoritative checklist section.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- Doc policy checks remain green.
