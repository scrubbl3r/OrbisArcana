# Rule Engine v2 Slice 08 Smoke

## Goal
make fallback state visible in receiver rule source readout.

## Expected Source Labels

- Normal V2 path: `V2 adapter`
- V2 fails and falls back to V1: `V2 adapter (fallback)`
- V2 disabled: `V1 master`

## Quick Smoke

1. Run normal config and confirm `Rules:` shows `V2 adapter`.
2. Introduce a temporary V2 validation break (for example unsupported key), reload receiver, confirm:
   - app still boots
   - `Rules:` shows `V2 adapter (fallback)`
3. Remove temporary break and confirm label returns to `V2 adapter`.
