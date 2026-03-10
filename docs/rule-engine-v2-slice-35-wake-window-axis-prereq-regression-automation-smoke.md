# Rule Engine V2 Slice 35 Smoke

Goal: automate wake-window axis prerequisite regression coverage.

## Added check
- `tools/rule-engine-v2/check-wake-window-axis-prereq-regression-v2.mjs`
- Verifies:
  - inside flat-spin window, speaking wake token (`sanctum`) before axis token is rejected with `no_axis_selected`
  - after speaking axis token (`pyro`), speaking wake token loads normally

## Wiring
- `ready:v2` now runs this check automatically.
- script alias: `npm run check:wake-window-axis-prereq:v2`

## Expected
- Axis prerequisite regressions fail pre-smoke.
