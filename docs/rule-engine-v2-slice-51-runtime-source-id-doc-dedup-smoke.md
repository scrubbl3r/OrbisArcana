# Rule Engine v2 Slice 51 Smoke

Date: 2026-03-12
Scope: deduplicate runtime source ID documentation across active runbooks.

## Changes in this slice

- Updated `docs/rule-engine-authoring.md`:
  - Replaced inline runtime source ID enumeration with a pointer to
    `docs/rule-engine-compatibility.md` as the canonical source.

## Why this is safe

- Documentation-only change.
- Reduces duplication and future drift risk in active docs.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- Doc policy checks remain green.
