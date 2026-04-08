# Transmitter Post-LAN Extraction Audit

Date: 2026-04-08

## Main conclusion

After extracting the LAN/session runtime, the root-level transmitter wrapper is
now substantially thinner and more honest.

The remaining `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/mobile-transmitter.js`
is no longer carrying:

- the live motion derivation core
- the packet publisher/runtime cadence lane
- the LAN join/session runtime

That means the wrapper has crossed another important threshold.

## What now clearly lives in transmitter-domain modules

The following transmitter concerns now live under:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/transmitter/`

including:

- entry bootstrap
- page shell
- UI boot
- viewport boot
- lifecycle
- session/bootstrap
- LAN join/session runtime
- motion input shell
- packet publisher
- audio runtime
- runtime reset
- motion core
- gesture-lab state
- gesture-lab UI
- gesture-lab logic
- calibration logic

## What still remains in the root wrapper

The wrapper now mainly contains four categories.

### 1. Transitional composition glue

The wrapper still wires domain modules together via the `window.__orbis...`
bridge:

- page shell references
- lifecycle wiring
- session bootstrap wiring
- LAN session creation
- motion-core construction
- packet publisher construction
- runtime reset construction

This is still legitimate wrapper responsibility.

### 2. Gesture-lab runtime orchestration

The wrapper still owns the live orchestration around the extracted gesture-lab
pieces:

- motion-history buffering
- gravity-lock progress behavior
- recording lifecycle
- live test-mode recognition updates
- save/reset UI reactions

This remains one of the largest coherent families in the wrapper.

### 3. Calibration runtime orchestration

The wrapper still owns:

- calibration start/finish timing
- calibration pending behavior
- directional-impulse classification handoff
- live impulse history buffering

This is related to gesture-lab/runtime behavior more than to motion-core truth.

### 4. Top-level start/stop composition

The wrapper still owns:

- `start()`
- `stop()`
- permission request handoff
- listener attach/detach handoff
- audio resume/silence handoff
- reset handoff
- start-state coordination across relay/LAN paths

This is still a normal wrapper role while the root file exists.

## What is no longer the next best extraction

The next best move is not more motion-core splitting.

That lane is already out, and continuing to split around it now would be
negative-value churn unless we have a specific motion-engine reason.

It is also probably not worth doing more bootstrap nibbling, because most of the
meaningful host/session seams are already domain-owned.

## Best recommendation

The best recommendation now is:

1. accept this as a sane stopping boundary again
2. treat the remaining wrapper as a temporary phone composer
3. only keep extracting if we specifically want to eliminate the root wrapper
   entirely

## If we keep going later

The most logical next extraction seam would be:

- gesture-lab/runtime orchestration

Specifically:

- motion history buffering
- recording lifecycle
- gravity-lock flow
- calibration orchestration

That would be the next real family large enough to justify its own module.

## Bottom line

The wrapper is no longer a hidden runtime home.

It is now mostly:

- composition
- gesture/calibration orchestration
- start/stop coordination

That is a sane architectural checkpoint, and it is reasonable to stop here
again unless we explicitly want to finish deleting the root wrapper altogether.
