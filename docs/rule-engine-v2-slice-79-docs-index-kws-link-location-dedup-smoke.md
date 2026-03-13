# Rule Engine v2 Slice 79 Smoke

Date: 2026-03-12
Scope: deduplicate KWS checklist link location in v2 docs index.

## Changes in this slice

- Updated `docs/rule-engine-v2-docs-index.md`:
  - in **Smoke Packs** -> **Human gameplay pack**, replaced direct KWS checklist link
    with a pointer to **Troubleshooting Quick Map** KWS entry.

## Why this is safe

- Documentation-only update.
- Keeps one canonical location for KWS troubleshooting links.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- Doc policy checks remain green.
