# Rule Engine v2 Slice 80 Smoke

Date: 2026-03-12
Scope: deduplicate KWS link location in before-push guidance.

## Changes in this slice

- Updated `docs/rule-engine-v2-docs-index.md`:
  - in **Before Push Checklist**, replaced direct KWS checklist link
    with pointer to **Troubleshooting Quick Map** KWS entry.

## Why this is safe

- Documentation-only update.
- Keeps KWS troubleshooting links centralized in one location.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- Doc policy checks remain green.
