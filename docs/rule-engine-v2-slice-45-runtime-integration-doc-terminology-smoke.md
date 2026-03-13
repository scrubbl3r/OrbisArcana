# Rule Engine v2 Slice 45 Smoke

Date: 2026-03-12
Scope: consolidate active v2 docs terminology from "bridge files" to "runtime integration files".

## Changes in this slice

- Updated active docs section labels/phrasing:
  - `docs/rule-engine-compatibility.md`
  - `docs/rule-engine-authoring.md`
  - `docs/rule-engine-v2-docs-index.md`
- No behavioral changes; terminology-only cleanup.

## Why this is safe

- Documentation-only updates.
- Aligns wording with current policy/adapter runtime model.
- No script paths, checks, or runtime contracts changed.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- Doc terminology checks remain green.
