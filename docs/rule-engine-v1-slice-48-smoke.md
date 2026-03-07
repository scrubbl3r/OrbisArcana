RULE ENGINE V1 - SLICE 48 SMOKE CHECKLIST

Purpose
- Add top-level master-control toggle with `enabled: true|false` to enable/disable the entire rule engine schema at config level.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Global disable sanity
- Set `RULE_ENGINE_V1_MASTER_CONTROL.enabled = false`.
- Restart and confirm no rule matches/actions fire.

3) Re-enable sanity
- Set `enabled = true` (or remove it).
- Restart and confirm rule behavior returns.

4) Validation sanity
- Set top-level `enabled` to non-boolean and confirm config validation fail-fast.
