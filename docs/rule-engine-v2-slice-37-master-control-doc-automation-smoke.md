# Rule Engine V2 Slice 37 Smoke

Goal: auto-generate a single human-readable "master control" document from SSOT.

## Added
- `tools/rule-engine-v2/write-master-control-doc-v2.mjs`
- output: `docs/master-control-v2.md`

## Wiring
- `pre-smoke:v2` now regenerates the master control doc every run.
- npm alias: `npm run write:master-control-doc:v2`

## Validate
1. Run `npm run ready:v2`.
2. Confirm `docs/master-control-v2.md` updates.

## Expected
- One copy/paste-friendly master config doc is always current with SSOT.
