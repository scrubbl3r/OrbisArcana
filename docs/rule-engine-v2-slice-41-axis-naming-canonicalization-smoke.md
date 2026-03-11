# Rule Engine v2 Slice 41 Smoke

## Goal
canonicalize remaining legacy `school` cast-action naming to neutral `axis`.

## Changes
- Canonical cast action id: `aoe_axis` (replaces `aoe_school` in active config paths)
- Canonical handler key: `play_axis_aoe` (replaces `play_school_aoe` in active config paths)
- Compatibility retained:
  - `aoe_school` still exists as alias to `play_axis_aoe`
  - `play_school_aoe` forwards to `play_axis_aoe`

## Validate
1. Run `npm run ready:v2`.
2. Run `npm run smoke:milestone:v2`.

## Human smoke
1. Trigger rota cast path.
2. Confirm behavior unchanged.
