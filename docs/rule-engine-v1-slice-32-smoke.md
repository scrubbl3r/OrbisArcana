# RULE ENGINE V1 - SLICE 32 SMOKE CHECKLIST

## Purpose
- Introduce a single master rule-engine config object (`RULE_ENGINE_V1_CONFIG`) and hydrate receiver bootstrap from it.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Schema hydration sanity
- Confirm rule schema is loaded into runtime normally (signals/windows/events/rules/bindings all present).

3) Behavior sanity
- Trigger a known rule and confirm preview/match/action behavior is unchanged.

4) Compatibility sanity
- Confirm no regressions from prior split exports (fallback remains in bootstrap if needed).
