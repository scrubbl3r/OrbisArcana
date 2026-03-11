# RULE ENGINE V1 - SLICE 33 SMOKE CHECKLIST

## Purpose
- Validate rule schema from the single master config object (`RULE_ENGINE_V1_CONFIG`) instead of validating split arrays only.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Config validation sanity
- Confirm startup uses config-level validation path (no schema errors).

3) Failure probe (config-level)
- Temporarily remove one event runtime binding id referenced in `events`.
- Restart and confirm fail-fast error:
  `Rule Engine v1 config validation failed`.
- Revert and confirm recovery.

4) Behavior sanity
- Trigger a known rule and confirm match/action behavior unchanged.
