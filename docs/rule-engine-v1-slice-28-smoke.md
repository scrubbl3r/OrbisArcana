RULE ENGINE V1 - SLICE 28 SMOKE CHECKLIST

Purpose
- Promote neutral routing fields (`axisSpell`, `wakeWindowSpell`) to primary metadata in routing/dispatch while keeping legacy aliases (`school`, `classKey`) for compatibility.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Axis + wake-window flow
- Open flat-spin and speak an axis spell token.
- Speak wake-window token and confirm load behavior is unchanged.

3) Cast flow sanity
- Detonate loaded slot and confirm cast behavior is unchanged.

4) Payload/routing sanity
- Inspect routing entries and spell load/cast payloads.
- Confirm `axisSpell` + `wakeWindowSpell` are present and used.
- Confirm `school` + `classKey` remain present as compatibility aliases.
