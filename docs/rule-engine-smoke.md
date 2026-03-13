# Rule Engine Smoke

Related index:
- `docs/rule-engine-v2-docs-index.md`

Use this to reduce per-slice manual config edits.

Archive note: historical slice logs are documented in `docs/rule-engine-v2-docs-index.md` under **Historical Slice Logs**; they are not active smoke runbooks.

## Primary Command

```bash
npm run smoke:batch:v2
```

## Milestone Run (Recommended Every ~5 Slices)

```bash
npm run smoke:milestone:v2
```

This runs:

1. `ready:v2` (runtime health + guard checks)
2. `smoke:batch:v2` (multi-case validator + projection suite)

It also writes report artifacts:

- milestone report: `/docs/rule-engine-v2.milestone-smoke.json`
- run history append-only log: `/docs/rule-engine-v2.milestone-history.jsonl`
- trend summary: `/docs/rule-engine-v2.milestone-trend.json`

## What It Covers

- baseline validate/build pass
- unsupported top-level key fail-fast
- condition type/id prefix mismatch
- wake_win spell namespace mismatch
- event id namespace mismatch
- incomplete qualified IDs
- defaults.event key namespace mismatch
- defaults.event incomplete key
- qualified ID normalization + defaults merge in projection

## Recommended Cadence

- Every slice: `npm run ready:v2`
- Every 5 slices (or before push): `npm run smoke:milestone:v2`
- Optional trend-only refresh: `npm run trend:milestone:v2`
- Quick summary view: `npm run status:v2`
