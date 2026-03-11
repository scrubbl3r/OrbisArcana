# Rule Engine V2 Slice 06 Smoke

## Goal
verify `defaults.event` supports qualified keys (`event.<id>`) and applies those defaults at runtime/projection.

## Setup

1. Open `/src/content/interactions-v2/interactions-v2.js`.
2. In `defaults.event`, set one key to qualified form.

Example:

```js
defaults: {
  event: {
    "event.grace": { ms: 500 }
  }
}
```

3. Ensure a rule uses:

```js
{ type: "event", id: "grace" }
```

with no `ms` override in the action.

## Expected

1. `npm run ready:v2` passes.
2. Effective projection/action uses canonical event id (`grace`).
3. Event receives default args from the qualified defaults key (same behavior as using key `grace`).
