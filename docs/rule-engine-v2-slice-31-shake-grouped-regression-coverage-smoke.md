# Rule Engine v2 Slice 31 Smoke

## Goal
extend automated shake regression coverage to include grouped-shake detonation paths in addition to directionless fallback.

## Updated automation
- `check-shake-detonation-regression-v2` now verifies:
  - `pyro + sanctum` + shake group `UD` detonates `sanctum`
  - `pyro + rota` + shake group `FB` detonates `rota`
  - previous directionless fallback checks remain

## Validate
1. Run `npm run ready:v2`.
2. Confirm shake regression check passes.

## Expected
- Any future regression in grouped or fallback shake detonation fails pre-smoke.
