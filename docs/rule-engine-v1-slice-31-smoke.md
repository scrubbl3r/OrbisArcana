# Rule Engine V1 Slice 31 Smoke Checklist

## Purpose
- Support `on` shorthand in rules:
  - `on: [ ...conditions ]` (treated as `all`)
  - `on: { type, id }` (single-condition shorthand)
  - Existing `on: { all, any }` remains supported.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Shorthand rule sanity
- Use `on` as an array of conditions and confirm validation passes.
- Trigger conditions and confirm rule matches/actions execute.

3) Backward compatibility sanity
- Existing rules using `on: { all, any }` should still validate and run.
