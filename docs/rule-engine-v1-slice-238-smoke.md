# Rule Engine V1 Slice 238 Smoke (Macro)

Goal
- Remove legacy `school/classKey` payload aliases from dispatch cast/load paths.
- Keep neutral payload fields only: `axisSpell`, `wakeWindowSpell`.

Checks
- Flat-spin axis-select then wake-window-select load flow:
  - Confirm load succeeds and emits `voice.spell_loaded` with `axisSpell` + `wakeWindowSpell`.
- Shake cast flow from loaded slot:
  - Confirm cast emits `voice.spell_cast` with `axisSpell` + `wakeWindowSpell`.
- Reject path check:
  - Trigger wake-window token before axis token and confirm reject reason remains (`no_axis_selected`) with neutral fields.

Cleanup
- None.
