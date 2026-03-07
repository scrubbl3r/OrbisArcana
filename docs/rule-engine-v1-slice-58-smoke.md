RULE ENGINE V1 - SLICE 58 SMOKE CHECKLIST

Purpose
- Add centralized event toggles via `eventEnabledOverrides` in master control.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Event disable sanity
- In `rule-engine-v1-master-control.js`, set:
  `eventEnabledOverrides: { grace: false }`
- Restart and trigger a rule that emits `grace`; confirm grace no longer executes.

3) Event re-enable sanity
- Set same override back to `true` (or remove it).
- Restart and confirm grace executes again.

4) Validation sanity
- Set non-boolean override value and confirm config fail-fast.
- Set unknown event id in `eventEnabledOverrides` and confirm config fail-fast.
