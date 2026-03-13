# Rule Engine v2 Slice 43 Smoke

Date: 2026-03-12
Scope: retire legacy v1/v2 drift report shim path and keep only canonical v2 drift report entrypoint.

## Changes in this slice

- Removed unused compatibility shim:
  - `tools/rule-engine-v2/report-v1-v2-rule-drift.mjs`
- Canonical drift report remains:
  - `tools/rule-engine-v2/report-rules-v2-drift.mjs`
  - `npm run report-drift:v2`

## Why this is safe

- No package script references the removed shim path.
- No docs or checks invoke the removed shim directly.
- Runtime behavior is unaffected; this is toolchain cleanup only.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes and writes `docs/rule-engine-v2.status.json`.
- `ready:v2` passes all manifest/check phases.
- Drift report remains available through `npm run report-drift:v2`.
