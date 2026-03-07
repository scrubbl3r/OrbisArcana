RULE ENGINE V1 - SLICE 40 SMOKE CHECKLIST

Purpose
- Promote `RULE_ENGINE_V1_MASTER_CONTROL` naming as the active runtime contract in bootstrap and integrity validation defaults.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Contract naming sanity
- Confirm bootstrap consumes `RULE_ENGINE_V1_MASTER_CONTROL` path.

3) Integrity sanity
- Confirm spell schema integrity validation still passes and behavior is unchanged.

4) Rule behavior sanity
- Trigger known rule path and confirm matching/actions unchanged.
