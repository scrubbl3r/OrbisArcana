# Rule Engine v2 Slice 84 Smoke

Date: 2026-03-12
Scope: tighten historical slice archive glob patterns to match actual smoke-note filenames.

## Changes in this slice

- Updated `docs/rule-engine-v2-docs-index.md`:
  - in **Historical Slice Logs**, changed broad patterns to precise smoke-note patterns:
    - `docs/rule-engine-v2-slice-*.md` -> `docs/rule-engine-v2-slice-*-smoke.md`
    - `docs/rule-engine-v1-slice-*.md` -> `docs/rule-engine-v1-slice-*-smoke.md`

## Why this is safe

- Documentation-only update.
- Improves archive reference precision and reduces ambiguity when locating slice logs.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- Doc policy checks remain green.
