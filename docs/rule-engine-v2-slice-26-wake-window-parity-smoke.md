# Rule Engine V2 Slice 26 Smoke

## Goal
enforce parity between `interactions-v2` `wake_win` spell lists and `WAKE_WINDOW_SPELL_IDS`.

## Validate
1. Run `npm run ready:v2`.
2. Confirm no wake-window parity errors.

## What this guard catches
- Missing spell IDs in `WAKE_WINDOW_SPELL_IDS` that are used by `wake_win` actions.
- Extra spell IDs in `WAKE_WINDOW_SPELL_IDS` not used by any `wake_win` action.

## Expected
- Current setup stays green.
- Future wake-window refactors fail fast on drift.
