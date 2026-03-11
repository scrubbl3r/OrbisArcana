# Rule Engine V2 Slice 18 Smoke

## Goal
prevent duplicate spell signal ids by construction across signal families.

## What changed
- `rule-engine-owned immediate` spell signals now exclude ids already present in:
  - wake window spell ids
  - wake spell ids
  - wake-required spell ids

## Validate
1. Run `npm run ready:v2`.
2. Confirm validator remains green.

## Human smoke
1. Start receiver + phone.
2. Confirm startup is normal (no init failure, KWS online).
3. Trigger core checks:
   - `orbis + domus`
   - `pyro`
   - `rota` chain path

## Expected
- No `duplicate signal id` startup failures.
- Behavior unchanged from last known-good smoke.
