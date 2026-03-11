# Rule Engine V1 Slice 213 Smoke

## Goal
- Fail fast when `signalSourceEventOverrides[*]` is not a string.

## Checks
- Add a temporary invalid override:
  - `signalSourceEventOverrides: { "<signal_id>": 123 }`
- Run config validation/startup path.
- Confirm validation includes:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalSourceEventOverrides[<signal_id>] must be a string`

## Cleanup
- Restore the override value to a non-empty string and confirm clean validation/startup.
