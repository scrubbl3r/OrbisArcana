# Rule Engine V1 Slice 234 Smoke

## Goal
- Stop emitting duplicate legacy `voice.school_selected` from spell dispatch.
- Keep neutral `voice.axis_selected` as the canonical event.

## Checks
- Trigger a flat-spin axis-select token (for example your current axis token flow).
- Confirm `voice.axis_selected` still emits and UI behavior remains correct.
- Confirm no dependency on `voice.school_selected` for this path.

## Cleanup
- None.
