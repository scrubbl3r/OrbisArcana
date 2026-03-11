# Rule Engine V2 Slice 36 Smoke

## Goal
remove duplicated routing lists by deriving from canonical spell groups.

## Change
- `SPELL_WINDOW_BYPASS_SPELL_IDS` now derives from:
  - `AXIS_SPELL_IDS`
  - `WAKE_WINDOW_SPELL_IDS`
- `WAKE_WINDOW_RUNTIME_KEY_BY_TOKEN` now auto-builds identity mapping from `WAKE_WINDOW_SPELL_IDS`.

## Validate
1. Run `npm run ready:v2`.
2. Run `npm run smoke:milestone:v2`.

## Human smoke
1. Startup/KWS normal.
2. Flat-spin + axis + wake-window load path still works.
3. Shake detonation still works.
