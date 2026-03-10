# Rule Engine V2 Slice 11 Smoke

Goal: verify clear validation errors for incomplete qualified IDs (`spell.`, `event.`, etc).

## Setup A (condition)

1. In `interactions-v2.js` set:

```js
{ type: "spell", id: "spell." }
```

2. Run `npm run ready:v2`.

Expected:

- Fails with `incomplete on.all id`.

## Setup B (wake_win spell)

1. Set one wake window spell to:

```js
"spell."
```

2. Run `npm run ready:v2`.

Expected:

- Fails with `wake_win spell id is incomplete`.

## Setup C (event action)

1. Set event action id to:

```js
{ type: "event", id: "event." }
```

2. Run `npm run ready:v2`.

Expected:

- Fails with `event action id is incomplete`.

## Restore

Revert temporary edits and confirm `npm run ready:v2` passes.
