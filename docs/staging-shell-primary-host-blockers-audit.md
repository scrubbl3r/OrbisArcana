# Staging Shell Primary Host Blockers Audit

Date: 2026-04-06
Branch: `ssot-runtime-shell-cleanup`

## Goal

Identify what still blocks `staging-shell` from becoming the primary host in place of the root receiver harness.

This audit assumes the desired end state is:

- `staging-shell` / `dev-staging` becomes the real receiver host
- root receiver becomes migration scaffolding only
- root fallback dev-surface selection is eventually deleted

## Current Reality

`createStagingShellRuntime(...)` in:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/create-staging-shell-runtime.js`

already does a lot of real host work:

- mounts `dev-staging`
- mounts `game-staging`
- loads shared staging modules
- boots KWS runtime
- boots a local shell stage runtime
- boots a receiver host runtime
- boots LAN pairing / mobile impulse intake
- exposes a shell context on `window`

So the problem is **not** that `staging-shell` is missing a host.

The problem is that it is still carrying too many different host/runtime responsibilities in one place, with some duplicated policy/config that should not remain shell-local forever.

## Main Blockers

### 1. `staging-shell` still mixes host bootstrap with local runtime assembly

This file currently owns all of these at once:

- host boot banner/status updates
- stage runtime construction
- stage rendering loop
- shell-local VFX runtime boot
- KWS runtime boot
- receiver host runtime boot
- pairing/mobile impulse boot

That means there is no clean separation yet between:

- "the page host is booting"
- "the receiver runtime is being assembled"
- "the local stage/game visuals are being assembled"

This is the biggest architectural blocker.

### 2. Receiver-host runtime assembly is still shell-local

`initShellReceiverHostRuntime(...)` is doing substantial receiver/runtime assembly inside `staging-shell`:

- loads receiver init modules
- creates runtime configs
- bootstraps staging runtime context
- binds staging runtime events
- bootstraps MVP
- processes incoming impulses
- renders HUD through the dev surface

That is very close to "primary host authority", but the assembly is still embedded in the shell file instead of living in a dedicated shared bootstrap/helper.

### 3. Shell-local config duplicates receiver policy

`createShellReceiverConfigs()` still defines shell-local policy/config:

- `INPUT_GESTURE_CFG`
- `INPUT_DYNAMICS_CFG`
- old energy-related config names

Even where some of those values are still currently correct, this is duplicated authority.

If `staging-shell` becomes primary, these config definitions should not remain ad hoc shell-local policy.

### 4. KWS bootstrap is entangled with shell-specific panel/runtime wiring

`initShellKwsRuntime(...)` is large and currently combines:

- KWS provider/bootstrap
- KWS panel controller boot
- KWS runtime controller boot
- listen policy boot
- wake-window bridge
- rule/action trace binding
- spell action handler boot
- shell VFX / shell gameplay action bindings

Some of that belongs to KWS bootstrap.
Some belongs to shell/game host runtime.
Some belongs to `dev-staging`.

Until those responsibilities are better separated, `staging-shell` is primary in practice but not cleanly primary in architecture.

### 5. Pairing/bootstrap is still shell-local rather than shared host bootstrap

`initShellPairingRuntime(...)` currently owns:

- overlay system boot
- mobile impulse runtime boot
- LAN session boot
- QR launch choreography
- calibration trigger choreography

This is valid host work, but right now it is embedded directly in `staging-shell`.

If root receiver is to be retired cleanly, this should eventually become a shared receiver host bootstrap seam rather than a shell-local implementation detail.

## What Is Not A Real Blocker

### `dev-staging` itself

`dev-staging` is no longer the main blocker.

Its internal breakup is now much better:

- template
- refs
- API
- HUD
- panel
- surface-state

That surface is now in decent enough shape to be the primary dev surface.

### Root receiver dev-surface glue

The root receiver still has migration-harness fallback glue, but that is not the main blocker to `staging-shell` becoming primary.

The bigger blocker is that `staging-shell` still contains too much mixed bootstrap/runtime authority in a single file.

## Classification: What Should Stay vs Move

### Keep in `staging-shell`

These are good shell-owned concerns:

- mount `dev-staging`
- mount `game-staging`
- shell boot banner/status updates
- shell context assembly
- stage backdrop/stars/terrain rendering
- local shell stage controls and shell-only readouts

### Move to shared bootstrap/helper

These should become shared host-bootstrap concerns:

- receiver host runtime boot
- pairing/mobile impulse boot
- calibration boot choreography
- module capability wiring for receiver host startup

Most likely future home:

- a dedicated receiver host bootstrap helper under `src/runtime-shell/`
- or a dedicated `staging-shell` bootstrap helper that root receiver could also call during migration

### Duplicate / delete later

These look like temporary shell-local residue:

- `createShellReceiverConfigs()`
- shell-local receiver policy constants
- shell-local fallback visual glue around runtime hooks
- ad hoc shell-specific wrappers around already modular KWS/runtime pieces

## Recommendation

Make `staging-shell` the target primary host.

That is still the best design choice.

But do **not** switch by trying to delete root receiver first.

Instead:

1. create one dedicated shared host bootstrap helper
2. move receiver host boot + pairing boot into that helper
3. let `staging-shell` call it first
4. smoke `staging-shell` as the primary host
5. then remove root fallback/bootstrap scaffolding

## Best Next Slice

The cleanest next implementation seam is:

- extract `initShellPairingRuntime(...)` and `initShellReceiverHostRuntime(...)` planning into a shared receiver-host bootstrap design

Not necessarily all at once, but the next move should be aimed there.

If we want one audit before code:

- do a focused classification of `initShellReceiverHostRuntime(...)`
- split its responsibilities into:
  - receiver runtime boot
  - event/runtime binding
  - shell-only view/update glue

That would give us the exact cut line for the first real host-bootstrap helper.
