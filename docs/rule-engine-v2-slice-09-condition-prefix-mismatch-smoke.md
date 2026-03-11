# Rule Engine v2 Slice 09 Smoke

## Goal
validate clear error reporting when condition `type` and qualified `id` prefix disagree.

## Setup

1. Open `/src/content/interactions-v2/interactions-v2.js`.
2. In one rule condition, set a deliberate mismatch, for example:

```js
{ type: "spell", id: "gesture.y_spin" }
```

## Expected

1. `npm run ready:v2` fails with:
   - `condition type/id prefix mismatch`
2. Revert to either:
   - `{ type: "spell", id: "spell.rota" }`
   - or `{ type: "spell", id: "rota" }`
3. `npm run ready:v2` passes again.
