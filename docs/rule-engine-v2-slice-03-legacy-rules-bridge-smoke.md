# Rule Engine v2 Slice 03 Smoke (Legacy Rules Bridge, Historical)

> Historical reference only.
> The legacy v1/v2 bridge path described in this slice is retired and not part of active v2 operations.

## Archived Context
- This slice originally validated an interim migration bridge from legacy rule definitions to interactions-v2 projection.
- Those controls and fallback paths are now retired from active runbooks.

## Current Controls (Active)
- `INTERACTIONS_V2_BOOTSTRAP.useInReceiverBootstrap === true`
- `RULE_ENGINE_POLICY_CONTROL.execution.projectionRulesOnly === true`

Use current v2 operational docs for active checks:
- `docs/rule-engine-v2-docs-index.md`
- `docs/rule-engine-smoke.md`
