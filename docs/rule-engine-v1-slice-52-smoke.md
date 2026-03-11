# RULE ENGINE V1 - SLICE 52 SMOKE CHECKLIST

## Purpose
- Add top-level global rule defaults via `ruleDefaults`:
  - `cooldownMs`
  - `matchWindowMs`

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Rule default apply sanity
- In master control, set for test:
  `ruleDefaults: { cooldownMs: 250, matchWindowMs: 3000 }`
- Use a rule that omits those fields.
- Confirm runtime uses these defaults.

3) Rule precedence sanity
- Add explicit `cooldownMs` or `matchWindowMs` to a rule.
- Confirm explicit per-rule values override `ruleDefaults`.

4) Validation sanity
- Set invalid values (e.g. `cooldownMs: -1`, `matchWindowMs: 50`) and confirm config fail-fast.
