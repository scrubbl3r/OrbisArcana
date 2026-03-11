# Rule Engine v2 Slice 32 Smoke

## Goal
automate wake-window load flow regression checks.

## Added check
- `tools/rule-engine-v2/check-wake-window-load-regression-v2.mjs`
- Verifies:
  - flat spin `y` + `pyro` + `sanctum` loads `sanctum` in `UD`
  - flat spin `y` + `pyro` + `rota` loads `rota` in `FB`

## Wiring
- `ready:v2` now runs this check automatically.
- script alias: `npm run check:wake-load-regression:v2`

## Expected
- Load-path regressions fail before human smoke.
