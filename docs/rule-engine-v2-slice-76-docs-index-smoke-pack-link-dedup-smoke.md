# Rule Engine v2 Slice 76 Smoke

Date: 2026-03-12
Scope: deduplicate repeated rule-engine smoke link in docs index smoke packs.

## Changes in this slice

- Updated `docs/rule-engine-v2-docs-index.md`:
  - removed duplicate `Rule Engine Smoke` link from **Smoke Packs** -> **Human gameplay pack**
  - retained canonical `Rule Engine Smoke` link in **Troubleshooting Quick Map**

## Why this is safe

- Documentation-only update.
- Reduces repeated links while preserving all entry points.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- Doc policy checks remain green.
