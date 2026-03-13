# Rule Engine v2 Slice 50 Smoke

Date: 2026-03-12
Scope: align archive-note wording in active runbooks to one source of truth.

## Changes in this slice

- Updated archive notes in:
  - `docs/rule-engine-authoring.md`
  - `docs/rule-engine-compatibility.md`
  - `docs/rule-engine-smoke.md`
- All now point to `docs/rule-engine-v2-docs-index.md` -> **Historical Slice Logs**.

## Why this is safe

- Documentation-only updates.
- Reduces wording drift across active runbooks.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- Doc terminology checks remain green.
