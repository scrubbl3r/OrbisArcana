# Rule Engine V1 Slice 27 Smoke Checklist

## Purpose
- Introduce neutral spell payload fields (`axisSpell`, `wakeWindowSpell`) in load/cast paths while keeping legacy aliases (`school`, `classKey`).

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Wake-window load/cast flow
- Open flat-spin, speak an axis spell token, then a wake-window spell token.
- Detonate loaded slot and confirm cast behavior unchanged.

3) Payload shape sanity
- Inspect `voice.spell_loaded` and `voice.spell_cast` payloads.
- Confirm `axisSpell` + `wakeWindowSpell` are present.
- Confirm legacy `school` + `classKey` are still present for compatibility.

4) AOE handler sanity
- Trigger route that uses `play_school_aoe`.
- Confirm behavior still follows selected axis spell (flame/frost/electric) as before.
