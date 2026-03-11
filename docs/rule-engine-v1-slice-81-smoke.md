# RULE ENGINE V1 - SLICE 81 SMOKE CHECKLIST

## Purpose
- Expand signal `where` comparator support to `gt`, `gte`, `lt`, `lte` (plus existing `eq`).

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Comparator sanity
- Use `signalWhereOverrides` to set a numeric threshold with `gt` or `lte`.
- Restart and confirm signal matching follows the new operator semantics.

3) Eq exclusivity sanity
- Set an override combining `eq` with `gte`.
- Confirm config validation fail-fast.

4) Numeric comparator validation sanity
- Set non-numeric `gt/gte/lt/lte` values and confirm fail-fast.
