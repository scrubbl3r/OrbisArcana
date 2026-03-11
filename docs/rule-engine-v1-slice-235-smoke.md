# Rule Engine V1 Slice 235 Smoke

## Goal
- Remove legacy `voice.school_selected` compatibility path.
- Keep only canonical `voice.axis_selected` for axis selection signals.

## Checks
- Trigger axis-select flow during flat-spin.
- Confirm axis-select UI behavior still updates (chips/readout).
- Optional log inspection: no producer/listener dependency on `voice.school_selected` remains.

## Cleanup
- None.
