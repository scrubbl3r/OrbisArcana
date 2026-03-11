# Rule Engine V2 Slice 24 Smoke

## Goal
enforce that every `event` action used by `interactions-v2` rules has a runtime binding.

## Validate
1. Run `npm run ready:v2`.
2. Confirm no `event without runtime binding` errors.

## What this guard catches
- A rule event id exists in event definitions but is missing from `event-runtime-bindings-v1`.

## Expected
- Current config stays green.
- Future event authoring fails fast if runtime binding wiring is forgotten.
