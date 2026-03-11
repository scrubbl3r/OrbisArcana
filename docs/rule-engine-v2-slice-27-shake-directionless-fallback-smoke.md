# Rule Engine V2 Slice 27 Smoke

## Goal
prevent dropped shake detonations when shake direction group is missing.

## Change
- If `input.shake_triggered` arrives without `group` (`UD/LR/FB`), dispatch now detonates the most recently loaded spell slot as a fallback.

## Human smoke
1. Load a spell in flat-spin window (for example `pyro + sanctum` or `pyro + rota`).
2. Trigger shake and confirm cast fires.
3. Verify standard grouped shakes still work as normal.

## Expected
- No more silent no-op shakes when group is absent.
- Existing grouped behavior unchanged.
