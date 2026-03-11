# Rule Engine v2 Slice 14 Smoke

## Goal
enforce KWS manifest as a derived artifact of `spellbook-v2` (single-source consistency).

## New workflow

1. Update active spell rows in `spellbook-v2.js`.
2. Run:

```bash
npm run sync:kws-manifest:v2
```

3. Run:

```bash
npm run ready:v2
```

## Guardrail Behavior

- If manifest is edited manually or drifts from spellbook, pre-smoke fails with:
  - `kws manifest drift: regenerate from spellbook-v2`
  - and tells you to run `npm run sync:kws-manifest:v2`.
