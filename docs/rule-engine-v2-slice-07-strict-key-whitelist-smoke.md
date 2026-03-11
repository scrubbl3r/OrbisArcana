# Rule Engine V2 Slice 07 Smoke

## Goal
verify `INTERACTIONS_V2` fails fast when unsupported keys are introduced in core authoring objects.

## Setup

1. Open `/src/content/interactions-v2/interactions-v2.js`.
2. Add one temporary unsupported key at top-level, for example:

```js
debug: true,
```

3. Run:

```bash
npm run ready:v2
```

## Expected

1. Validation fails with:
   - `INTERACTIONS_V2 contains unsupported key: debug`
2. Remove the temporary key.
3. `npm run ready:v2` passes again.

## Notes

- This keeps V2 authoring focused and prevents hidden/legacy knobs from creeping back into SSOT.
