# Rule Engine V1 Slice 46 Smoke Checklist

## Purpose
- Tighten master-control contract (`id`, `version` required) and add canonical schema doc for authoring.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Contract sanity
- Confirm current master control validates cleanly.

3) Failure probe
- Temporarily blank/remove `id` or `version` in master control.
- Confirm config validation fail-fast.
- Revert and confirm recovery.

4) Documentation sanity
- Review `docs/master-control-schema.md` and confirm it matches current supported syntax.
