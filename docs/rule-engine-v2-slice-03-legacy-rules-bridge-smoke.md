# Rule Engine V2 Slice 03 Smoke (Legacy Rules Bridge)

## Scope
- `spell-rules-v1` can optionally project rules from `interactions-v2`.
- Projection is gated by `SPELL_RULES_V1_LEGACY_BRIDGE.useInteractionsV2Rules`.
- Default remains static V1 sample rules.

## Preconditions
- Deploy includes:
  - `src/content/spell-rules/spell-rules-v1.js`
  - `src/content/interactions-v2/build-rule-engine-v1-from-interactions-v2.js`

## Test A: Bridge OFF (default)
1. In `src/content/spell-rules/spell-rules-v1.js`, keep:
   - `useInteractionsV2Rules: false`
2. Reload receiver.
3. Expected:
   - No behavior change from current baseline.

## Test B: Bridge ON
1. Set:
   - `useInteractionsV2Rules: true`
2. Reload receiver.
3. Expected:
   - V1 rule sample list is sourced from `interactions-v2` projection.
   - No startup validation failures.

## Test C: Projection fallback safety
1. Keep bridge ON.
2. Temporarily make `interactions-v2` invalid (for example, remove a required `rule.id`).
3. Reload receiver.
4. Expected:
   - Console warning indicates bridge fallback.
   - Static V1 sample rules are used as fallback.
5. Revert invalid edit and confirm clean startup.
