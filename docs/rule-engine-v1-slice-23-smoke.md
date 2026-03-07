RULE ENGINE V1 - SLICE 23 SMOKE CHECKLIST

Purpose
- Introduce neutral spell-group naming (`AXIS_*`, `WAKE_WINDOW_*`) and migrate rule-engine/KWS consumers while keeping legacy aliases.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm normal startup.

2) Token board sanity
- Confirm top/bottom KWS token rows still render expected active spell phrases.
- Confirm wake token detection and wake window behavior still trigger.

3) Alias compatibility check
- Ensure startup validators pass with current config (legacy alias exports still present).
- Optional: inspect runtime config payload and confirm both new keys (`axisTokens`, `wakeWindowTokens`) and legacy keys (`schoolTokens`, `classTokens`) are populated.
