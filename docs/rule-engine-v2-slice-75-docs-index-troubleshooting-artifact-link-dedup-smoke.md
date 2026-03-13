# Rule Engine v2 Slice 75 Smoke

Date: 2026-03-12
Scope: deduplicate troubleshooting artifact linking in v2 docs index.

## Changes in this slice

- Updated `docs/rule-engine-v2-docs-index.md`:
  - replaced direct `Effective Interactions Snapshot` link under
    **Troubleshooting Quick Map** with pointer to
    **Generated Artifacts Quick Links**

## Why this is safe

- Documentation-only update.
- Keeps artifact links centralized in one section.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- Doc policy checks remain green.
