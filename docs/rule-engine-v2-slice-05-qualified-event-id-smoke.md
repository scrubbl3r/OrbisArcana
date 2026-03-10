# Rule Engine V2 Slice 05 Smoke

Goal: verify `event` IDs accept optional qualified form (`event.<id>`) in `INTERACTIONS_V2` while projecting to canonical V1 event IDs.

## Setup

1. Open `/src/content/interactions-v2/interactions-v2.js`.
2. In one rule `then` action, set event id to qualified form.

Example:

```js
{ type: "event", id: "event.grace", ms: 500 }
```

## Expected

1. `npm run pre-smoke:v2` passes.
2. `npm run ready:v2` passes.
3. Runtime behavior is unchanged from the equivalent unqualified id (`"grace"`).
4. Effective snapshot still projects event action as canonical id (`"grace"`).

## Notes

- Qualified event IDs are optional convenience syntax.
- Defaults and action ids normalize to the same canonical event id during validation/projection.
