# Rule Engine v2 Slice 12 Smoke

## Goal
ensure `defaults.event` keys enforce event namespace clearly.

## Setup A (wrong prefix)

1. In `interactions-v2.js`, set:

```js
defaults: {
  event: {
    "spell.grace": { ms: 500 }
  }
}
```

2. Run `npm run ready:v2`.

Expected:

- Fails with `defaults.event key prefix mismatch`.

## Setup B (incomplete key)

1. Set:

```js
defaults: {
  event: {
    "event.": { ms: 500 }
  }
}
```

2. Run `npm run ready:v2`.

Expected:

- Fails with `defaults.event key is incomplete`.

## Restore

Use `grace` or `event.grace`, then confirm `npm run ready:v2` passes.
