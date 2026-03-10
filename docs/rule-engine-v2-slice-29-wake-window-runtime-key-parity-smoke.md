# Rule Engine V2 Slice 29 Smoke

Goal: enforce parity between `WAKE_WINDOW_SPELL_IDS` and `WAKE_WINDOW_RUNTIME_KEY_BY_TOKEN` token keys.

## Validate
1. Run `npm run ready:v2`.
2. Confirm no runtime-key parity errors.

## What this guard catches
- A wake-window spell id without a corresponding runtime token key.
- A runtime token key that is not part of wake-window spell ids.

## Expected
- Current config remains green.
- Wake-window token mapping drift fails fast.
