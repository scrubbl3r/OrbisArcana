# Rule Engine v2 Slice 64 Smoke

Date: 2026-03-12
Scope: keep schema reference section limited to schema docs only.

## Changes in this slice

- Updated `docs/rule-engine-v2-docs-index.md`:
  - removed generated master-control artifact links from **Schema References**
  - retained schema-only links (`interactions-schema`, `master-control-schema`)

## Why this is safe

- Documentation-only update.
- Reduces cross-section duplication with generated artifact listings.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- Doc policy checks remain green.
