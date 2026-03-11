# Rule Engine V1 Slice 36 Smoke Checklist

## Purpose
- Establish explicit single-file master config entrypoint (`RULE_ENGINE_V1_MASTER_CONFIG`) and route bootstrap to prefer it.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Master config sanity
- Confirm rule schema still hydrates correctly from the master entrypoint.

3) Behavior sanity
- Trigger known rule and confirm preview/match/action behavior unchanged.

4) Alias compatibility sanity
- Confirm legacy `RULE_ENGINE_V1_CONFIG` alias still works (no regressions during migration).
