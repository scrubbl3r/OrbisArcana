# Rule Engine V2 Slice 30 Smoke

## Goal
reduce duplicated KWS token list maintenance by deriving top/flash/bottom lists from canonical spell groups.

## Change
- `KWS_ROW_TOP_SPELL_IDS` and `KWS_FLASH_TOKEN_SPELL_IDS` now derive from:
  - `WAKE_SPELL_IDS`
  - `WAKE_REQUIRED_SPELL_IDS`
  - `AXIS_SPELL_IDS`
- `KWS_ROW_BOTTOM_SPELL_IDS` now aliases `WAKE_WINDOW_SPELL_IDS`.

## Validate
1. Run `npm run ready:v2`.
2. Run `npm run smoke:milestone:v2`.

## Human smoke
1. Startup/KWS panel token rows look unchanged.
2. Core spell interactions remain unchanged.
