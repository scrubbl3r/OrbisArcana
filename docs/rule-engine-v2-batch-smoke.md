# Rule Engine V2 Batch Smoke

Use this to avoid manual per-slice config edits.

## Command

```bash
npm run smoke:batch:v2
```

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
- Every 5 slices (or before push): `npm run smoke:batch:v2`
