# RULE ENGINE V1 - SLICE 44 SMOKE CHECKLIST

## Purpose
- Add per-rule toggle support with `enabled: true|false` in master control rules.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Disable rule sanity
- Set a known rule to `enabled: false`.
- Trigger its conditions and confirm it does not match/fire.

3) Re-enable sanity
- Set the same rule back to `enabled: true` (or remove `enabled`).
- Trigger conditions and confirm it matches/fires again.

4) Validation sanity
- Set `enabled` to a non-boolean value and confirm schema validation fail-fast.
