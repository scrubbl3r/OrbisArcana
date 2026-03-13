# Rule Engine v2 Slice 72 Smoke

Date: 2026-03-12
Scope: deduplicate default-behavior guidance between FAQ and common edit recipes.

## Changes in this slice

- Updated `docs/rule-engine-v2-docs-index.md`:
  - added `Common Edit Recipes` entry for default event/window behavior changes
  - changed corresponding FAQ answer to point to that recipe

## Why this is safe

- Documentation-only update.
- Keeps edit guidance centralized in one actionable section.

## Smoke checklist

1. Run `npm run status:v2`.
2. Run `npm run ready:v2`.
3. Optional pre-push: run `npm run smoke:milestone:v2`.

## Expected results

- `status:v2` passes.
- `ready:v2` passes.
- Doc policy checks remain green.
