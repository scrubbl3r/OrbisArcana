# Rule Engine V1 Slice 237 Smoke

## Goal
- Remove legacy `school` payload fallback in spell action handlers.
- Drive school AOE action selection from neutral `axisSpell` only.

## Checks
- Trigger a cast/action path that reaches `play_school_aoe`.
- Confirm effect routing still matches `axisSpell` (`electrum` -> electric, `fridgis` -> frost fallback behavior).
- Confirm no dependency on `payload.school` for this path.

## Cleanup
- None.
