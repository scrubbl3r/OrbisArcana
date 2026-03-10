# Rule Engine V2 Batch Smoke

Use this to avoid manual per-slice config edits.

## Command

```bash
npm run smoke:batch:v2
```

## Milestone Command (Recommended Every ~5 Slices)

```bash
npm run smoke:milestone:v2
```

This runs:

1. `ready:v2` (cutover health + guards)
2. `smoke:batch:v2` (multi-case validator/projection suite)

It also writes a checkpoint report:

- `/docs/rule-engine-v2.milestone-smoke.json`
- and appends run history:
- `/docs/rule-engine-v2.milestone-history.jsonl`
- plus trend summary:
- `/docs/rule-engine-v2.milestone-trend.json`

## What it covers

- baseline validate/build pass
- unsupported top-level key fail-fast
- condition type/id prefix mismatch
- wake_win spell namespace mismatch
- event id namespace mismatch
- incomplete qualified IDs
- defaults.event key namespace mismatch
- defaults.event incomplete key
- qualified ID normalization + defaults merge in projection

## Recommended cadence

- Every slice: `npm run ready:v2`
- Every 5 slices (or before push): `npm run smoke:milestone:v2`
- Optional trend-only refresh: `npm run trend:milestone:v2`
