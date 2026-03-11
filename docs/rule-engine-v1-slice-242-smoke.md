# Rule Engine V1 Slice 242 Smoke (Macro KWS Axis Naming)

## Goal
- Replace remaining KWS axis-token mapping naming from `axisSchoolByAxis` to neutral `axisSpellByAxis`.
- Keep runtime behavior unchanged.

## Checks
- Start receiver and confirm KWS panel still highlights expected axis token on top row during flat-spin.
- Confirm axis-select event path still updates selected axis spell state/readout.
- Confirm wake-window token lighting still depends on active axis spell selection.

## Cleanup
- None.
