# Rule Engine V1 Slice 45 Smoke Checklist

## Purpose
- Add per-action toggles with `enabled: true|false` in `then` actions.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Action disable sanity
- In a rule, set one action `enabled: false` and leave others enabled.
- Trigger the rule and confirm only enabled actions execute.

3) Re-enable sanity
- Set action back to `enabled: true` (or remove `enabled`) and confirm it executes again.

4) Validation sanity
- Set action `enabled` to non-boolean and confirm schema fail-fast.

5) Payload hygiene sanity
- Confirm `enabled` does not appear in runtime action override args.
