# Staging Shell KWS Bridge Residue Audit

Date: 2026-05-07
Branch: `05/06/26-Orbis-Arcana-3D`

## Goal

Reassess what remains in the shell-local KWS/gameplay bridge after extracting the reusable KWS bootstrap lane and the first shell bridge helpers into:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/kws-runtime-bootstrap.js`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/kws-wake-window-bridge.js`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/shell-rule-action-runtime.js`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/shell-voice-spell-runtime.js`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/shell-spell-action-runtime.js`

## Main Conclusion

What remains in `create-staging-shell-runtime.js` is no longer generic KWS bootstrap, and it is no longer carrying the first wave of KWS/spell bridge internals directly.

It is now mostly a **shell KWS/gameplay composition point**.

That is a much healthier architectural position than before: the composer still wires the shell-specific pieces together, but several behavior-focused subdomains now have named modules.

## What Still Remains In The Shell KWS Bridge

### 1. Shell wake-window mapping and visual bridge

Extracted to:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/kws-wake-window-bridge.js`

What they do:

- translate voice token/word events into wake-window openings
- maintain shell-local wake-window token visuals
- update word flashboard / debug trace visuals

This is KWS-adjacent, but it is clearly shell/dev-surface integration, not provider/runtime bootstrap.

### 2. Shell rule/action execution bridge

Extracted to:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/shell-rule-action-runtime.js`

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

Partially extracted.

Extracted:

- voice spell cast handling:
  - `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/shell-voice-spell-runtime.js`
- spell action handler / cast executor assembly:
  - `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/shell-spell-action-runtime.js`

Still composed from `initShellKwsRuntime(...)`:

- VFX default hydration
- shell VFX runtime initialization
- shell gameplay action callbacks supplied into the spell action runtime:
  - teleport
  - bubble shield
  - float grace
  - colorize
  - shockwave/electric/flame

This is clearly shell/gameplay ownership. The improvement is that handler/executor assembly is now named and isolated, while the shell composer still owns the concrete stage/VFX callbacks.

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
- after the first extraction, what remained was mostly the shell bridge layer itself
- now, the obvious KWS/spell bridge subdomains have named modules, and `initShellKwsRuntime(...)` is closer to a shell composition function

That means the file is no longer lying to us about responsibility, though it is still large because the shell itself owns a lot of stage/VFX/gameplay wiring.

## What This Means For Next Steps

There are now two realistic options.

### Option 1: Keep this shell KWS bridge in `create-staging-shell-runtime.js` for now

Pros:

- the remaining code is now mostly truly shell-specific composition
- avoids over-abstracting behavior-sensitive shell stage/VFX callbacks
- may be “good enough” if the main goal is making `staging-shell` the primary host soon

Cons:

- `create-staging-shell-runtime.js` remains fairly large

### Option 2: Extract a dedicated shell KWS composition helper

Possible future helper would own:

- shell trace subscriptions
- the call into KWS event binding
- the call into wake-window, spell action, voice spell, and rule-action helper modules
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
- it is shell composition code, not generic bootstrap residue
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
2. if you still want one more cleanup slice first, extract a dedicated shell KWS composition helper

My recommendation is **1**.
