# Rule Engine V1 Slice 47 Smoke Checklist

## Purpose
- Add per-rule `priority` support to control evaluation order when multiple rules match.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Priority ordering sanity
- Create 2+ rules that can match the same trigger set with different `priority` values.
- Confirm higher `priority` rules are evaluated first.

3) Stable-order sanity
- Give two rules the same `priority`.
- Confirm source order is preserved.

4) Validation sanity
- Set `priority` to non-numeric and confirm schema fail-fast.
