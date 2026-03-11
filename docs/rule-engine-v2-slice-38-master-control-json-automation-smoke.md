# Rule Engine v2 Slice 38 Smoke

## Goal
generate a machine-readable master control artifact alongside the markdown doc.

## Added
- `docs/master-control-v2.json` generated from SSOT

## Source
- `tools/rule-engine-v2/write-master-control-doc-v2.mjs` now writes:
  - `docs/master-control-v2.md`
  - `docs/master-control-v2.json`

## Validate
1. Run `npm run ready:v2`.
2. Confirm both files are regenerated.

## Expected
- One human doc + one JSON artifact, both always current with `spellbook-v2` + `interactions-v2`.
