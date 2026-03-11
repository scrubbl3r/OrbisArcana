# Rule Engine v2 Slice 34 Smoke

## Goal
automate flat-spin token gating regression coverage.

## Added check
- `tools/rule-engine-v2/check-flat-spin-gating-regression-v2.mjs`
- Verifies:
  - outside flat-spin window:
    - `pyro` axis token is rejected by immediate ownership (`rule_engine_owned_immediate_spell`)
  - inside flat-spin window (`y`):
    - `pyro` axis token is accepted and emits `voice.axis_selected`

## Wiring
- `ready:v2` now runs this check automatically.
- script alias: `npm run check:flat-spin-gating:v2`

## Expected
- Flat-spin gating contract regressions fail pre-smoke.
