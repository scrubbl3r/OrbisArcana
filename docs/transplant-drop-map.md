# Transplant Drop Map

This document is the mechanical drop checklist for moving the clean motion core from `PAIR-TRANSMIT-RECEIVE-CLASSIC-V1` into the rewind checkpoint on the modern branch.

Use it as a placement and scope guide.
Do not use it as a prompt to preserve older pseudo-core abstractions.

## Rewind landing zone

Target checkpoint:

- `331ae4afdde8108ab4ff4fa596c0ca4d0e9b9e35`

Why this checkpoint is correct:

- the `src/runtime-shell/` directory scaffold already exists
- `staging-shell` is still a shell/orchestrator
- root receiver/transmitter pages still exist as the stable baseline
- later receiver-clone / pseudo-core sediment has not taken over yet

## Authoritative incoming modules

These files from the classic branch are now the lower-layer source of truth.

### Session

- `src/runtime-shell/session/pairing-service.js`
- `src/runtime-shell/session/fast-path-transport.js`
- `src/runtime-shell/session/relay-transport.js`

### Transmitter

- `src/runtime-shell/transmitter/transmitter-relay.js`

### Receiver

- `src/runtime-shell/receiver/calibration-engine.js`
- `src/runtime-shell/receiver/signal-processor.js`
- `src/runtime-shell/receiver/motion-store.js`
- `src/runtime-shell/receiver/receiver-adapters.js`

## Target drop map

The first transplant should be a straight placement into the same paths on the rewind branch.

### Session drop

- classic `src/runtime-shell/session/pairing-service.js`
  -> modern `src/runtime-shell/session/pairing-service.js`
- classic `src/runtime-shell/session/fast-path-transport.js`
  -> modern `src/runtime-shell/session/fast-path-transport.js`
- classic `src/runtime-shell/session/relay-transport.js`
  -> modern `src/runtime-shell/session/relay-transport.js`

### Transmitter drop

- classic `src/runtime-shell/transmitter/transmitter-relay.js`
  -> modern `src/runtime-shell/transmitter/transmitter-relay.js`

### Receiver drop

- classic `src/runtime-shell/receiver/calibration-engine.js`
  -> modern `src/runtime-shell/receiver/calibration-engine.js`
- classic `src/runtime-shell/receiver/signal-processor.js`
  -> modern `src/runtime-shell/receiver/signal-processor.js`
- classic `src/runtime-shell/receiver/motion-store.js`
  -> modern `src/runtime-shell/receiver/motion-store.js`
- classic `src/runtime-shell/receiver/receiver-adapters.js`
  -> modern `src/runtime-shell/receiver/receiver-adapters.js`

## Temporary harness rule

During the first landing, root legacy pages may remain the active smoke harness.

That means it is acceptable for the modern rewind branch to keep using:

- `game-receiver.html`
- `game-receiver.js`
- `mobile-transmitter.html`
- `mobile-transmitter.js`

while those entrypoints begin loading lower-layer modules from `src/runtime-shell/...`.

This is a feature, not a compromise.
It lets us verify the lower-layer drop before staging-shell cutover.

## What stays harness-only for the first drop

These root files are temporary test hosts, not transplant targets:

- `game-receiver.html`
- `game-receiver.css`
- `game-receiver.js`
- `mobile-transmitter.html`
- `mobile-transmitter.css`
- `mobile-transmitter.js`

They may be used to prove parity and wiring, but they are not the long-term architectural destination.

## What is explicitly not coming along

Do not preserve or re-import later pseudo-core layers just because they look related.

Examples of things to retire, replace, or ignore:

- `receiver-core` style abstractions
- staging-shell receiver clones
- shell-owned transport/bootstrap logic
- duplicate motion derivations outside `signal-processor.js`
- duplicate state containers outside `motion-store.js`
- legacy compatibility layers that exist only to support the failed receiver rewrite

## Ownership rules

The classic branch now defines the lower-layer seams.

### `session`

Owns:

- QR pairing/bootstrap
- Ably signaling bootstrap
- direct fast-path transport
- explicit relay transport

Does not own:

- gameplay logic
- shell staging logic
- motion derivation

### `transmitter`

Owns:

- mobile send lane
- relay publishing
- minimal transmitter-side transport behavior

Does not own:

- receiver signal processing
- shell UI

### `receiver`

Owns:

- calibration preparation
- signal processing
- canonical motion publication
- thin lower-layer adapters only

Does not own:

- staging-shell presentation
- dev/game layout
- upper-layer runtime systems

## First cutover goal

The first modern-branch cutover should prove only this:

- lower-layer modules land cleanly in `src/runtime-shell/...`
- existing baseline entrypoints can load them
- motion still pairs, calibrates, and streams
- the branch remains ready for later staging-shell hello-world wiring

It does not need to solve all shell integration on day one.

## Decision rule

If a modern-branch file competes with one of the clean modules above, prefer the clean module.

If a modern-branch file is merely a host or consumer, adapt it to subscribe upward.

That is how we keep the transplant from turning back into another receiver rewrite.
