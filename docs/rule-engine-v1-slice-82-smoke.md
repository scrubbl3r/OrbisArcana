# RULE ENGINE V1 - SLICE 82 SMOKE CHECKLIST

## Purpose
- Add per-rule cooldown scaling via `ruleCooldownScaleOverrides`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Override sanity
- Set:
  `execution.cooldownScale: 1`
  `ruleCooldownScaleOverrides: { r_rota_yspin_charged: 0.5 }`
- Restart and confirm that rule cools down faster than baseline.

3) Precedence sanity
- Set `execution.cooldownScale: 2` with the same rule override at `0.5`.
- Confirm rule uses its override (faster) rather than global scale.

4) Validation sanity
- Set negative/non-numeric scale and confirm fail-fast.
- Set unknown rule id and confirm fail-fast.
