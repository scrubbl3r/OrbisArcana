# Root Receiver Retirement Audit

Date: 2026-04-07
Branch: `ssot-runtime-shell-cleanup`

## Goal

Turn the shell-first decision into a concrete retirement plan for the old root
receiver harness.

This audit is not asking whether `staging-shell` is good enough anymore.
That question is already answered.

The question here is:

- what in the old root receiver is still temporarily needed?
- what should move to `staging-shell` or shared modules first?
- what can be deleted once shell becomes the default harness?
- what is the separate status of the old phone/transmitter page?

Relevant files:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/game-receiver.html`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/game-receiver.js`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/mobile-transmitter.html`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/mobile-transmitter.js`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/staging-shell.html`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/staging-shell.js`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/create-staging-shell-runtime.js`

## Current Read

`staging-shell` is now the behaviorally real host.

The old root receiver is no longer carrying the most trustworthy runtime path.
It is carrying:

- fallback harness behavior
- old page bootstrap
- old pairing/bootstrap UX
- compatibility scaffolding

That means the old root receiver should now be treated as retirement work, not
as the place where ongoing architecture should continue to accumulate.

The phone/transmitter side is different:

- the current shell still ultimately launches the existing phone page
- so the root receiver and the root transmitter are not equally deletable yet

## Classification

### 1. Still needed temporarily

These should survive the first cutover window, but only as temporary support.

#### Root receiver page as fallback comparator

Files:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/game-receiver.html`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/game-receiver.js`

Reason:

- it is still the known-good comparator during the proving window
- it gives us a safety fallback if the shell regresses after promotion

Important nuance:

- this should no longer be treated as the default smoke page
- it should exist only as fallback/comparator status

#### Root phone/transmitter page

Files:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/mobile-transmitter.html`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/mobile-transmitter.js`

Reason:

- the current shell pairing flow still resolves the live phone URL to
  `mobile-transmitter.html`
- the active motion derivation and live LAN gameplay path still run through the
  existing phone page/runtime

Conclusion:

- do not delete the phone page in the first receiver-retirement pass
- receiver retirement and transmitter retirement must be treated as separate
  phases

### 2. Move to shell or shared modules first

These are not good long-term root responsibilities, but they also should not be
deleted blindly before the new ownership is explicit.

#### Pairing/bootstrap URL ownership

Current root seams:

- `mobilePageBaseUrl()`
- `phoneUrlFor(roomChannel)`
- QR/pair URL rendering and start-screen boot choreography

Recommendation:

- shell should become the authoritative owner of the active phone launch URL
- later, this should resolve to a transmitter-domain page, not a root receiver
  page

#### Any remaining host bootstrap helpers that are still root-only by habit

Examples in `game-receiver.js`:

- root-only startup sequence
- old root `connect({ auto:true })` path
- old root LAN / receiver transport initialization order

Recommendation:

- do not port these into the shell one-for-one
- instead, keep the shell host bootstrap authoritative and remove the root copy
  once the proving window is complete

#### Root-only fallback page UX

Examples:

- `createBootFallbackDevStagingRefs()`
- `createInlineBootFallbackDevStagingAdapter(refs)`
- `createBootFallbackDevStagingAdapter()`
- `legacyDevStagingView`
- `currentDevStagingView`
- `setCurrentDevStagingView(...)`
- `refreshLegacyDevStagingView()`
- `maybeMountDevStagingSurface()`

Recommendation:

- these should not move into shell
- they should simply die with the old root receiver

This is an important distinction:

- they are not “shared bootstrap assets”
- they are root-page migration scaffolding

### 3. Delete after shell promotion proves stable

These are the main deletion targets once `staging-shell` is the default harness
and the proving window is complete.

#### Root dev-surface fallback selection

Delete from `game-receiver.js`:

- boot fallback dev-surface selection
- mounted-vs-fallback switching
- legacy dev-surface adapter refresh logic
- root fallback adapter bodies

Why:

- this scaffolding exists only because the root receiver stayed alive during
  migration
- once root is no longer the active harness, this logic has no architectural
  value

#### Root harness startup choreography

Delete from `game-receiver.js` once retired:

- old root init chain
- old root auto-connect startup
- old root start-screen launch path
- old root pair modal / QR boot ownership

Why:

- `staging-shell` now owns the real host path
- preserving a second full host bootstrap would just keep split authority alive

#### Root receiver transport compatibility lane

Delete from `game-receiver.js` once retired:

- `classicReceiverTransport`
- old root Ably/receiver transport connection path
- root-only message subscription fallback behavior

Why:

- this is the old host’s transport lane
- it should not survive once the root host is no longer authoritative

#### Root-only comparator instrumentation and fallback glue

Delete:

- any remaining root-only smoke helpers
- root-only comparator traces
- root-only compatibility branches whose only purpose is “if shell is not ready”

## Recommended Retirement Order

### Phase 1. Promote shell operationally

Do now:

- treat
  `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/staging-shell.html`
  as the default harness
- stop normal smoke on
  `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/game-receiver.html`

Keep root only as fallback comparator during a short proving window.

### Phase 2. Retire root receiver harness

After the proving window:

- remove root dev-surface fallback selection
- remove root-only host bootstrap choreography
- remove root receiver transport lane
- demote or archive `game-receiver.html`

This is the real root-receiver retirement step.

### Phase 3. Separate transmitter retirement work

Only after shell-first hosting is fully settled:

- audit `mobile-transmitter.html` and `mobile-transmitter.js` as their own
  retirement/migration problem
- move the active phone page to an explicit transmitter-domain home
- then remove old root-oriented transmitter glue

This should not be conflated with the first receiver cutover.

## Recommended Immediate Decision

Yes:

- shell should become the default harness now

No:

- do not delete the root transmitter yet

And for the root receiver:

- stop investing in it as an active host
- keep it only as a short-term fallback/comparator
- then remove it as a host, not as a library

## Bottom Line

The old root receiver is now mostly migration scaffolding plus legacy host
ownership.

That means the right next move is not more polishing there.
It is:

1. shell-first by default
2. short proving window
3. retire the root receiver harness
4. tackle transmitter retirement as a separate follow-on phase
