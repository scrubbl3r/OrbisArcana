# Transmitter Retirement Audit

Date: 2026-04-07
Branch: `ssot-runtime-shell-cleanup`

## Goal

Assess the current `mobile-transmitter` path now that the root receiver has been
phased out as an entry host.

This audit asks:

- what parts of the current phone/transmitter path are still truly
  authoritative?
- what already has a better domain home elsewhere in the repo?
- what is still old root-era baggage?
- what should the retirement/migration order be?

Relevant files:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/mobile-transmitter.html`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/mobile-transmitter.js`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/transmitter/README.md`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/session/lan-session.js`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/session/pairing-service.js`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/session/fast-path-transport.js`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/transmitter/transmitter-relay.js`

## Current Read

Unlike the old root receiver, the current mobile transmitter path is **not**
ready to be archived yet.

It is still the live authoritative phone runtime used by the shell pairing
flow.

That means transmitter retirement is a migration problem, not a demotion
problem.

The right question is not:

- “can we archive this now?”

It is:

- “how do we move its active responsibilities into explicit transmitter-domain
  homes without breaking the live phone path?”

## What Is Still Truly Authoritative

### 1. The current phone entry page

Files:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/mobile-transmitter.html`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/mobile-transmitter.js`

Current reality:

- `staging-shell` still launches `mobile-transmitter.html`
- the active live motion derivation and publish loop still live here
- the active LAN join path still lives here

So this page is still production-authoritative in practice, even if its current
location and organization are transitional.

### 2. Live motion derivation and outbound publish

In `mobile-transmitter.js`, the phone still owns:

- device motion/orientation intake
- calibrated motion shaping
- canonical outgoing meter fields
- outgoing semantic fields such as spin direction / spin vector
- LAN-vs-relay gameplay publish decision

This is not dead legacy code.
It is still the actual runtime.

### 3. Active LAN/DataChannel gameplay path

The current transmitter still owns the live join-side fast path:

- LAN join token flow
- Ably signaling for the offer/answer lane
- WebRTC/DataChannel gameplay transport
- gameplay enable gating after LAN safety check

Important note:

- this is partly shared in concept with `src/runtime-shell/session/`
- but the phone-side join/runtime behavior is still actively implemented inside
  `mobile-transmitter.js`

## What Already Has Better Domain Homes

### 1. Session and pairing primitives

These already exist as clearer shared homes:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/session/pairing-service.js`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/session/fast-path-transport.js`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/session/lan-session.js`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/transmitter/transmitter-relay.js`

This means some of the transmitter’s session logic is already partially
modularized at the repo level.

What is still missing is a clean phone-side transmitter bootstrap that composes
those pieces instead of owning so much inline glue.

### 2. Transmitter domain home exists in the repo

Directory:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/transmitter/`

Current state:

- the directory exists
- its README already says this is where outbound/mobile transmitter runtime
  concerns belong

So we do **not** have a missing destination problem.
We have a migration/extraction problem.

## What Still Looks Like Transitional Baggage

### 1. Giant monolithic phone runtime file

`mobile-transmitter.js` still mixes:

- page UI/start state
- theme boot
- background color effects
- gesture lab / training logic
- LAN join/signaling runtime
- relay runtime
- live motion derivation
- publish throttling/signature gating

That is too many roles in one page file.

### 2. Page shell still lives at repo root

The current entry page is still:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/mobile-transmitter.html`

That mirrors the old root-era structure.

Long-term, the phone entry should live in an explicit transmitter-domain home,
not at repo root beside the archived receiver page.

### 3. Mixed production/runtime and lab/training concerns

`mobile-transmitter.js` still includes gesture-lab/training code alongside the
live gameplay transmitter runtime.

That does not necessarily mean the lab must disappear, but it does mean the
boundaries are still muddled.

## Classification

### Keep for now

- `mobile-transmitter.html`
- `mobile-transmitter.js`
- live transmitter motion derivation
- live join/DataChannel gameplay path

Reason:

- shell still depends on them directly

### Move first

- phone bootstrap/page-shell ownership into `src/runtime-shell/transmitter/`
- phone-side session/join bootstrap into clearer transmitter/session modules
- nonessential lab/debug concerns out of the main production transmitter path

### Delete later

- root-style page placement for the transmitter entry
- duplicate or inline session glue once explicit transmitter bootstrap exists
- any dead relay/debug/lab branches found during that migration

## Recommended Retirement Order

### Phase 1. Make the transmitter path explicit, not root-like

First goal:

- create a real transmitter-domain entry and bootstrap path under
  `src/runtime-shell/transmitter/`

This does **not** require changing motion semantics yet.

### Phase 2. Move page-shell/bootstrap ownership

Next:

- move phone entry ownership away from the repo root page
- keep the live phone runtime working
- make shell point at the new explicit transmitter entry

### Phase 3. Split production transmitter from training/lab concerns

After the entry path is stable:

- classify which `mobile-transmitter.js` concerns are:
  - production runtime
  - shell/page UI
  - gesture lab / training
  - dead baggage

### Phase 4. Retire the old root transmitter entry

Only after the shell points at the new transmitter-domain entry:

- archive or remove the old root-level `mobile-transmitter.html`
- then continue deleting the old monolithic glue

## Recommendation

Do **not** try to archive the current transmitter the way we archived
`game-receiver.html`.

That would be premature.

Instead:

1. treat transmitter as the next active migration domain
2. create a real transmitter-domain entry/bootstrap home
3. switch shell to that new home
4. then retire the old root-level transmitter page

## Bottom Line

Receiver cutover is now far enough along that the phone/transmitter path is the
main remaining old-root-shaped domain.

But unlike the old receiver, it is still actively authoritative.

So the next correct move is not archival.
It is transmitter migration.
