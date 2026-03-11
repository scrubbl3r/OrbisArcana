# Rule Engine V1 Slice 118 Smoke Checklist

## Purpose
- Add global action-telemetry type gates via `execution.actionExecutedEventTypeEnabled`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Wake-window telemetry off sanity
- Set:
  `execution.executeActions: true`
  `execution.emitActionExecutedEvents: true`
  `execution.actionExecutedEventTypeEnabled: { wake_win: false, event: true }`
- Restart and trigger rules that execute both `wake_win` and `event` actions.
- Confirm both actions still execute, but only `event` telemetry emits.

3) Event telemetry off sanity
- Set:
  `execution.actionExecutedEventTypeEnabled: { wake_win: true, event: false }`
- Confirm only `wake_win` telemetry emits.

4) Validation sanity
- Set unsupported keys in `actionExecutedEventTypeEnabled`; confirm fail-fast.
- Set non-boolean values; confirm fail-fast.
