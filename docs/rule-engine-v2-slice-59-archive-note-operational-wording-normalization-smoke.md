# Rule Engine v2 Slice 59 Smoke

Date: 2026-03-12
Scope: normalize archive-note wording in v2 docs index.

## Changes in this slice

- Updated `docs/rule-engine-v2-docs-index.md`:
  - `current operational runbooks` -> `active operational runbooks`

## Why this is safe

- Documentation-only update.
- Removes remaining time-bound wording from active docs index.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- Doc policy checks remain green.
