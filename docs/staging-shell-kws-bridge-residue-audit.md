# Staging Shell KWS Bridge Residue Audit

Date: 2026-04-06
Branch: `ssot-runtime-shell-cleanup`

## Goal

Reassess what remains in the shell-local KWS/gameplay bridge after extracting the reusable KWS bootstrap lane into:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/kws-runtime-bootstrap.js`

## Main Conclusion

What remains in `create-staging-shell-runtime.js` is no longer generic KWS bootstrap.

It is now mostly a **shell KWS/gameplay bridge**.

That is a much healthier architectural position than before.

## What Still Remains In The Shell KWS Bridge

### 1. Shell wake-window mapping and visual bridge

These functions are still shell-local:

- `buildShellRootWakeWindowMap(...)`
- `bindShellRootWakeWindows(...)`
- `bindShellWakeWindowVisuals(...)`

What they do:

- translate voice token/word events into wake-window openings
- maintain shell-local wake-window token visuals
- update word flashboard / debug trace visuals

This is KWS-adjacent, but it is clearly shell/dev-surface integration, not provider/runtime bootstrap.

### 2. Shell rule/action execution bridge

Still shell-local:

- `bindShellRuleActionRuntime(...)`

What it does:

- listens for rule-engine event actions
- converts them into cast-action execution
- logs the result to the shell KWS bridge

This is a bridge between:

- rule-engine runtime
- shell spell execution
- shell log/readout behavior

This is not generic KWS boot.

### 3. Shell spell/VFX integration

Still shell-local inside `initShellKwsRuntime(...)`:

- VFX default hydration
- shell VFX runtime initialization
- shell spell action handler creation
- shell spell cast executor creation
- shell gameplay action bindings:
  - teleport
  - bubble shield
  - float grace
  - colorize
  - shockwave/electric/flame

This is clearly shell/gameplay ownership.

### 4. Shell trace/log subscriptions

Still shell-local:

- `kwsListenPolicySyncOff`
- `kwsRuleTraceOff`
- `kwsActionTraceOff`

These are operational trace/UI hooks attached to shell debugging and shell KWS surface behavior.

### 5. Final `runtime.kws` assembly

Still in `create-staging-shell-runtime.js`:

- the final merged `runtime.kws` object that includes:
  - base KWS runtime parts
  - shell-specific bridge disposers
  - shell spell runtime pieces
  - schema/runtime indexes

This final assembly now reads as a shell composition step, which is appropriate.

## Architectural Read

This is the key insight:

- before, `initShellKwsRuntime(...)` was both generic KWS bootstrap and shell bridge spaghetti
- now, after the extraction, what remains is mostly the shell bridge layer itself

That means the file is no longer lying to us about responsibility.

## What This Means For Next Steps

There are now two realistic options.

### Option 1: Keep this shell KWS bridge in `create-staging-shell-runtime.js` for now

Pros:

- the remaining code is now mostly truly shell-specific
- avoids over-abstracting behavior-sensitive shell spell/VFX and wake-window logic
- may be “good enough” if the main goal is making `staging-shell` the primary host soon

Cons:

- `create-staging-shell-runtime.js` remains fairly large

### Option 2: Extract a dedicated shell KWS bridge helper

Possible future helper would own:

- wake-window bridge/visuals
- shell trace subscriptions
- shell spell action handler / cast executor creation
- shell rule-action bridge
- final shell KWS object assembly

Pros:

- thinner host composer
- clearer shell KWS boundary

Cons:

- more behavior-sensitive than the earlier extractions
- easier to over-split too early

## Recommendation

I recommend **not forcing this extraction immediately** unless we decide we want a thinner shell composer before promoting `staging-shell` to primary.

Why:

- the remaining code is now much more honest in responsibility
- it is shell bridge code, not generic bootstrap residue
- extracting it further is more about cleanliness than unblockers

## Best Decision From Here

The next real question is no longer:

- "can we extract more KWS boot?"

It is:

- "is `staging-shell` now ready enough to become the primary smoke target?"

My read:

- we are getting close to that decision point
- the main blockers are no longer broad runtime/bootstrap tangles
- they are now mostly shell-owned composition choices

## Recommendation To User

I would recommend one of these two paths next:

1. do a readiness audit for promoting `staging-shell` to the primary smoke target
2. if you still want one more cleanup slice first, extract a dedicated shell KWS bridge helper

My recommendation is **1**.
