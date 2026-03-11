# RULE ENGINE V1 - SLICE 114 SMOKE CHECKLIST

## Purpose
- Add action telemetry emission toggle via `execution.emitActionExecutedEvents`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Action telemetry off sanity
- Set:
  `execution.executeActions: true`
  `execution.emitActionExecutedEvents: false`
- Restart and trigger rules that execute actions.
- Confirm actions still occur, but no `rule_engine.v1.action_executed` telemetry emits.

3) Action telemetry on sanity
- Set:
  `execution.emitActionExecutedEvents: true`
- Confirm action telemetry resumes.

4) Validation sanity
- Set non-boolean value for `execution.emitActionExecutedEvents`; confirm fail-fast.
