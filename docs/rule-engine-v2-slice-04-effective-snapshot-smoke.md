# Rule Engine V2 Slice 04 Smoke (Effective Snapshot)

## Scope
- Generate one canonical snapshot of effective V2 config/projection.
- Diff snapshots before/after edits to verify intended changes only.

## Generator
- Script:
  - `tools/rule-engine-v2/write-effective-snapshot.mjs`
- Output:
  - `docs/effective-interactions-v2.snapshot.json`

## Test A: Generate baseline
1. Run:
   - `node tools/rule-engine-v2/write-effective-snapshot.mjs`
2. Expected:
   - Output file is written.
   - `validation.spellbookV2.ok` is `true`.
   - `validation.interactionsV2.ok` is `true`.

## Test B: Intentional change + diff
1. Change one value in:
   - `src/content/interactions-v2/interactions-v2.js`
2. Re-run generator.
3. Diff:
   - `git diff -- docs/effective-interactions-v2.snapshot.json`
4. Expected:
   - Diff reflects only intended config/projection changes.

## Test C: Validation failure visibility
1. Introduce invalid V2 data temporarily.
2. Re-run generator.
3. Expected:
   - Snapshot shows validation `ok: false` with detailed errors.
4. Revert invalid edit and regenerate.
