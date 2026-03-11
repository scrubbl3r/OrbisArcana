# Rule Engine v2 Slice 22 Smoke

## Goal
keep runtime startup resilient if rule schema validation fails, by falling back to a safe disabled rule schema instead of freezing receiver boot.

## Validate
1. Run `npm run ready:v2`.
2. Run `npm run smoke:milestone:v2`.

## Human smoke
1. Normal startup + baseline interactions still work.
2. Optional failure simulation:
   - introduce a temporary invalid rule config,
   - verify receiver still boots (rules disabled fallback) instead of freezing.

## Expected
- Normal path unchanged.
- Invalid rule schema no longer hard-stops full receiver initialization.
