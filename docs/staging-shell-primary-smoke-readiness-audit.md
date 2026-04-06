# Staging Shell Primary Smoke Readiness Audit

Date: 2026-04-06
Branch: `ssot-runtime-shell-cleanup`

## Goal

Assess whether `staging-shell` is now ready enough to become the **primary smoke target** instead of continuing to rely on the root receiver harness.

Relevant files:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/staging-shell.html`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/staging-shell.js`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/create-staging-shell-runtime.js`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/README.md`

## Current Read

`staging-shell` is much closer now.

The broad bootstrap tangles have been meaningfully reduced:

- receiver host bootstrap extracted
- receiver impulse adapter extracted
- pairing bootstrap extracted
- KWS base bootstrap extracted

That means `create-staging-shell-runtime.js` is now much more of a shell composer plus shell-specific bridge layer, not a giant undifferentiated runtime blob.

## What Looks Ready

### 1. Intended architecture already points here

The shell README already says:

- root receiver is the stability baseline during migration
- `staging-shell.html` is the preferred architecture-forward URL
- cutover should happen once parity is proven

So from a design intent standpoint, promoting `staging-shell` is consistent with the repo direction.

### 2. Shell page structure is present

`staging-shell.html` already has the core host surfaces:

- start screen / QR
- `devStagingMount`
- `gameStagingMount`
- calibration overlay

So this is not a hypothetical host shell.
It is a real host page.

### 3. Host bootstrap shape is now much cleaner

`createStagingShellRuntime(...)` now reads more like a real host boot sequence:

- mount surfaces
- load modules
- create shell context
- boot KWS
- boot stage runtime
- boot receiver host runtime
- boot pairing
- expose shell context

That is a strong sign that the shell is nearing smoke-target readiness.

## Concrete Readiness Gaps

### 1. Boot banner DOM is incomplete

`staging-shell.js` and `create-staging-shell-runtime.js` both attempt to update:

- `shellBootBanner`
- `shellBootPhase`
- `shellBootDetail`

but `staging-shell.html` does not currently include those nodes.

Impact:

- does **not** block runtime boot
- does reduce observability / operator confidence while booting the new shell

This is a real but low-risk gap.

### 2. No parity smoke evidence yet on `staging-shell` itself

We have done a lot of architecture work toward shell readiness, but the active smoke target has still been the root receiver harness.

So the biggest remaining blocker is not code organization anymore.

It is missing parity evidence on the new host page itself.

In other words:

- architecture is getting close
- proof is still missing

### 3. Remaining shell KWS bridge is still shell-local and behavior-sensitive

This is not necessarily a blocker to trying the shell as primary smoke target, but it is the biggest remaining complexity area:

- wake-window visuals
- shell trace subscriptions
- shell spell/VFX bridge
- shell rule-action bridge

That code now looks honest in responsibility, but it is still an area to watch carefully during shell smoke.

## Non-Blockers

These do **not** look like reasons to delay a first primary-shell smoke attempt:

- remaining shell-stage visual/runtime ownership
- remaining shell-local lamp helpers
- remaining shell-local pairing glue

Those now look like valid shell concerns, not hidden migration debt.

## Recommendation

Yes: `staging-shell` looks ready enough for a **first promotion attempt** as the primary smoke target.

Not for deleting the root receiver yet.

But for changing the next smoke campaign to:

- first smoke `staging-shell.html`
- use root receiver only as fallback validation if the shell fails

## Recommended Rollout

### Step 1. Fix the boot banner surface

Add the missing boot banner DOM to `staging-shell.html` so shell boot status is visible and trustworthy.

This is a small improvement with high debugging value.

### Step 2. Make `staging-shell.html` the active smoke page

Run the same real workflow there:

- load shell page
- pair
- calibrate
- confirm dev/game surfaces are alive
- confirm spin x/y/z
- confirm KWS/log/wordboard behavior
- confirm shake/direction lamp behavior

### Step 3. Keep root receiver as fallback only during the proving window

Do not delete root fallback yet.

But stop treating it as the default smoke page if the shell clears.

### Step 4. Only after repeated shell clears

Then decide whether to:

- remove root fallback dev-surface selection logic
- or keep root receiver around as a separate archival/test harness

## Recommendation To User

The best next move is:

1. add the missing shell boot banner DOM
2. then run the first real smoke cycle on `staging-shell.html`

That is the best way to answer the important question now:

- not “can we extract more?”
- but “is the shell ready to take over?”
