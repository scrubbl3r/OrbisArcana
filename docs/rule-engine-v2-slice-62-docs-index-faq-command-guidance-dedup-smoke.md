# Rule Engine v2 Slice 62 Smoke

Date: 2026-03-12
Scope: deduplicate command-behavior guidance in v2 docs index FAQ.

## Changes in this slice

- Updated `docs/rule-engine-v2-docs-index.md` FAQ:
  - replaced duplicated regeneration explanation with a pointer to
    **Command Quick Reference** and **Smoke Packs**

## Why this is safe

- Documentation-only update.
- Keeps one authoritative place for command behavior guidance.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- Doc policy checks remain green.
