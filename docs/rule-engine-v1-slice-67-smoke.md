RULE ENGINE V1 - SLICE 67 SMOKE CHECKLIST

Purpose
- Tighten override safety: validate `actionEnabledOverrides` and `actionArgOverrides` keys against actual rule actions.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Valid key sanity
- Keep a known-good key such as:
  `actionArgOverrides: { "r_rota_yspin_charged.event.grace": { ms: 900 } }`
- Confirm startup remains clean.

3) Unknown action key fail-fast
- Set key that targets a real rule but missing action, for example:
  `actionArgOverrides: { "r_rota_yspin_charged.event.not_real": { ms: 500 } }`
- Confirm config validation fail-fast.

4) Invalid key format fail-fast
- Set malformed key, for example:
  `actionEnabledOverrides: { "r_rota_yspin_charged": false }`
- Confirm config validation fail-fast.
