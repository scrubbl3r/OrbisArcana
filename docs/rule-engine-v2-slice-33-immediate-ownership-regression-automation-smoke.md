# Rule Engine V2 Slice 33 Smoke

Goal: automate dispatch ownership regression checks for immediate spells.

## Added check
- `tools/rule-engine-v2/check-immediate-dispatch-ownership-v2.mjs`
- For each `RULE_ENGINE_OWNED_IMMEDIATE_SPELL_IDS` entry:
  - with `ruleEngineEnabled=true`: expects no direct cast + reject reason `rule_engine_owned_immediate_spell`
  - with `ruleEngineEnabled=false`: expects exactly one direct cast

## Wiring
- `ready:v2` now runs this check automatically.
- script alias: `npm run check:immediate-ownership:v2`

## Expected
- Immediate ownership contract failures are caught pre-smoke.
