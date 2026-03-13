# Rule Engine v2 Slice 71 Smoke

Date: 2026-03-12
Scope: deduplicate KWS link references in v2 docs index.

## Changes in this slice

- Updated `docs/rule-engine-v2-docs-index.md`:
  - removed redundant **KWS References** section
  - retained KWS links in **Troubleshooting Quick Map**

## Why this is safe

- Documentation-only update.
- Reduces repeated link blocks in the primary index.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- Doc policy checks remain green.
