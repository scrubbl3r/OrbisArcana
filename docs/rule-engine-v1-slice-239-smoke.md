# Rule Engine V1 Slice 239 Smoke (Macro Intent/Schema Cutover)

Goal
- Remove legacy intent aliases (`spell.school_select`, `spell.class_select`).
- Remove legacy `school/classKey` fields from runtime routing/spell content and dispatch payload plumbing.
- Keep neutral contract only: `axisSpell`, `wakeWindowSpell`, `spell.axis_select`, `spell.wake_window_select`.

Checks
- Axis token in flat-spin:
  - Confirm dispatch treats only `spell.axis_select` as axis-select intent.
- Wake-window token after axis token:
  - Confirm dispatch treats only `spell.wake_window_select` as wake-window-select intent.
- Load/cast payload inspection:
  - Confirm `voice.spell_loaded` and `voice.spell_cast` include `axisSpell` and `wakeWindowSpell`.
  - Confirm no `school`/`classKey` fields are emitted from dispatch payloads.
- Reject path:
  - Trigger wake-window before axis token and confirm reject still occurs with neutral fields (`wakeWindowSpell`, `axisSpell`).

Cleanup
- None.
