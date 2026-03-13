# Rule Engine v2 Slice 44 Smoke

Date: 2026-03-12
Scope: consolidate active v2 docs away from retired legacy-bridge controls.

## Changes in this slice

- Marked legacy bridge slice doc as historical-only:
  - `docs/rule-engine-v2-slice-03-legacy-rules-bridge-smoke.md`
- Updated effective snapshot smoke expectations to current runtime controls:
  - `INTERACTIONS_V2_BOOTSTRAP.useInReceiverBootstrap === true`
  - `RULE_ENGINE_POLICY_CONTROL.execution.projectionRulesOnly === true`
  - Canonical runtime source/readout expectations only

## Why this is safe

- Documentation-only cleanup; runtime code paths are unchanged.
- Aligns old operational guidance with current enforced contracts and checks.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- No contract/check regressions from documentation terminology changes.
