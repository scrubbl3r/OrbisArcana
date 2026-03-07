RULE ENGINE V1 - SLICE 83 SMOKE CHECKLIST

Purpose
- Add per-rule match-window scaling via `ruleMatchWindowScaleOverrides`.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Override sanity
- Set:
  `execution.matchWindowScale: 1`
  `ruleMatchWindowScaleOverrides: { r_rota_yspin_charged: 0.5 }`
- Restart and confirm that rule requires tighter timing than baseline.

3) Precedence sanity
- Set `execution.matchWindowScale: 2` with the same rule override at `0.5`.
- Confirm rule still uses its override (tighter timing).

4) Validation sanity
- Set negative/non-numeric scale and confirm fail-fast.
- Set unknown rule id and confirm fail-fast.
