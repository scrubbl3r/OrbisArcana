# Rule Engine v2 Slice 28 Smoke

## Goal
automate detection of the shake-detonation regression that was previously caught only in human smoke.

## Added check
- `tools/rule-engine-v2/check-shake-detonation-regression-v2.mjs`
- Verifies:
  - `pyro + sanctum` loads and directionless shake detonates `sanctum`
  - `pyro + rota` loads and directionless shake detonates `rota`

## Wiring
- `ready:v2` now runs this regression check automatically.
- Extra script alias: `npm run check:shake-regression:v2`

## Expected
- `ready:v2` fails immediately if shake detonation stops firing for these flows.
