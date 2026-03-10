# Rule Engine V2 Slice 15 Smoke

Goal: migrate `domus` immediate behavior into `INTERACTIONS_V2.rules` and avoid duplicate cast execution.

## What changed

1. Added V2 rule:
   - `r_domus_immediate`
   - `on: spell.domus`
   - `then: event.domus_teleport`
2. Added event definition/runtime binding:
   - `domus_teleport` -> `cast_action: domus_teleport`
3. Added dispatch duplication guard:
   - when rule engine is enabled, immediate `domus` cast path in spell-dispatch is bypassed.

## Human smoke

1. Start receiver normally (`Rules: V2 adapter`).
2. Speak wake + `domus` path you normally use.
3. Expected:
   - teleport behavior still works
   - no double-trigger behavior
   - no error logs for missing signal/event ids.

## Regression check

1. Trigger `rota + y_spin + charged` chain.
2. Confirm existing wake window + events still function unchanged.
