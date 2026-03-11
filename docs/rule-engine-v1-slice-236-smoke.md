# Rule Engine V1 Slice 236 Smoke

## Goal
- Remove legacy `school` payload fallback from KWS axis-select handling.
- Consume only neutral `axisSpell` for axis-selected updates.

## Checks
- Trigger axis-select flow during flat-spin.
- Confirm KWS readout/chips still reflect selected axis spell.
- Confirm electrum flash still occurs when `axisSpell` is `electrum`.

## Cleanup
- None.
