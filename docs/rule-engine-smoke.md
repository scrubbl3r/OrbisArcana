# Rule Engine Smoke

Related index:
- `docs/rule-engine-v2-docs-index.md`

Use this runbook to execute repeatable v2 smoke checks with minimal per-slice setup.

Preflight:
- Run `npm run status:v2` before manual smoke execution to confirm current v2 health and contracts are green.

## Primary Command

```bash
npm run ready:v2
```

## Quick Snapshot Command

```bash
npm run status:v2
```

## Milestone Run (Recommended Every ~5 Slices)

```bash
npm run smoke:milestone:v2
```

This runs:

1. `ready:v2` (runtime health + guard checks)
2. `ready:v2` (validator + health gate)
3. `status:v2` (quick current-state summary + status artifact refresh)

It also writes report artifacts:

- milestone report: `docs/rule-engine-v2.milestone-smoke.json`
- status snapshot: `docs/rule-engine-v2.status.json`
- run history append-only log: `docs/rule-engine-v2.milestone-history.jsonl`
- trend summary: `docs/rule-engine-v2.milestone-trend.json`

## What It Covers

- baseline validate/build pass
- unsupported top-level key fail-fast
- condition type/id prefix mismatch
- wake_win word namespace mismatch (including legacy spell-namespace compatibility aliases)
- event id namespace mismatch
- incomplete qualified IDs
- defaults.event key namespace mismatch
- defaults.event incomplete key
- qualified ID normalization + defaults merge in projection

## Recommended Cadence

- Every slice: `npm run ready:v2`
- Every slice (quick snapshot): `npm run status:v2`
- Every 5 slices (or before push): `npm run smoke:milestone:v2`
- Optional trend-only refresh: `npm run trend:milestone:v2`
