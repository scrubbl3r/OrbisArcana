# Rule Engine V2 Slice 10 Smoke

## Goal
validate clear errors for action id namespace mismatches.

## Setup A (wake_win)

1. In `interactions-v2.js`, set one `wake_win` spell to a wrong namespace:

```js
{ type: "wake_win", spells: ["gesture.y_spin"] }
```

2. Run `npm run ready:v2`.

Expected:

- Fails with `wake_win spell prefix mismatch`.

## Setup B (event)

1. In `interactions-v2.js`, set one event id to a wrong namespace:

```js
{ type: "event", id: "spell.rota" }
```

2. Run `npm run ready:v2`.

Expected:

- Fails with `event id prefix mismatch`.

## Restore

Use canonical/valid forms and rerun `npm run ready:v2`:

- `wake_win` spell ids: `spell.<id>` or `<id>`
- `event` ids: `event.<id>` or `<id>`
