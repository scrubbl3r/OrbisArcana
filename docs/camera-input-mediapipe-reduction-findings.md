# Camera Input MediaPipe Reduction Findings

Date: 2026-05-01

This note captures the current camera-control findings before we hunt for the older MediaPipe SHA that felt especially good. The goal is to preserve what we learned so the next slice can compare that older build against the current worker-based MediaPipe path without relying on memory.

## Current Direction

We are not replacing MediaPipe with the custom blob detector path.

The lite blob detector proved that a narrow X-only detector can be extremely fast, but it was not accurate or predictable enough. The core weakness was semantic recognition: the blob path could not reliably separate the intended hand control point from arm/body/background, and weighted/edge/component heuristics produced bias, mush, and inconsistent reversals.

The stronger path is reductive MediaPipe:

- Keep MediaPipe's trained hand recognition as the source of truth.
- Move it off the main thread.
- Remove game-unneeded outputs from our use of it: handedness UX, gestures, Y control, bones rendering, detailed landmark dependence where possible.
- Preserve a clean X control signal.
- Apply smoothing/hold as a final polish layer, not as a way to hide raw tracking flaws.

## Current Build State

Active backend: `orb-control-worker`

Important files:

- `src/runtime-shell/camera-input/orb-control-worker-tracker.js`
- `src/runtime-shell/camera-input/orb-control-detector-worker.js`
- `src/runtime-shell/camera-input/orb-control-tracker.js`
- `src/runtime-shell/camera-input/camera-input-steering.js`
- `src/game-runtime/input/camera-steering-system.js`
- `src/runtime-shell/staging/staging-shell/create-staging-shell-runtime.js`

The worker backend currently runs MediaPipe in a module worker and keeps RAF/game rendering clean. A direct `orb-control` MediaPipe backend still exists as fallback/reference. The custom `orb-control-lite` blob backend still exists as an experiment, but it is not the strategic path.

## Telemetry Pattern That Matters

The most useful debug pattern has been:

- press reset
- smoke test
- press capture
- inspect the structured telemetry object

This should remain the preferred debug workflow. It avoids extra windows and noisy logs while still preserving enough numeric detail to reason from.

Useful fields:

- `camera.detectorBackend`
- `camera.detectorLoop`
- `camera.fps`
- `camera.detectMs`
- `camera.inputFrameMs`
- `camera.inputAgeMs`
- `camera.trackingState`
- `camera.handPresent`
- `camera.missingFrames`
- `camera.rawX01`
- `camera.filteredX01`
- `camera.centeredX01`
- `camera.holdAgeMs`
- `camera.holdMissingMs`
- `camera.steeringActive`
- `camera.steeringReason`
- `camera.steeringTargetVX`
- `events` marks: `camera.hand_reacquired`, `camera.hand_lost`, `longtask`, `raf-gap`

## Known Good Findings

### Worker MediaPipe Helps Main-Thread Feel

When MediaPipe runs in the worker, RAF and the game loop are clean:

- `frame.rafDelta` stays near `16.67ms`
- `frame.total` and `orb.pipeline` are tiny
- browser long tasks mostly disappear from the game loop

This means workerization is worth keeping even if MediaPipe detection itself is still expensive.

### The Hold Layer Is Useful But Should Be Late-Stage

Commit `c712cf84` added a short hold-through-missing window:

- brief `missing` observations hold the last good hand X for `220ms`
- trace exposes `trackingState: "tracking_hold"`
- trace exposes `holdAgeMs` and `holdMissingMs`

This was a big subjective improvement because it prevented one-frame MediaPipe misses from instantly zeroing steering.

But it also masks raw tracker quality. It should be treated as a final stability pass, not as the next diagnostic baseline. For raw tracker diagnosis, use a mode/config with `holdMissingMs: 0` or otherwise disable hold.

### Latest Post-Hold Smoke

The latest smoke after `c712cf84` showed:

- only one `camera.hand_reacquired`
- only one `camera.hand_lost`
- RAF clean: `16.67ms avg`
- game loop clean
- worker MediaPipe active: `detectorBackend: "orb-control-worker"`
- `detectorTargetFps: 30`
- `detectMs avg` around `17.82ms`, with last around `32.6ms`

The final frame had:

- `trackingState: "no_hand"`
- `holdAgeMs: 218`
- `holdMissingMs: 220`
- `steeringActive: false`

That means the hold layer bridged short misses and then released at the configured edge. This is correct behavior for polish, but the underlying detector still lost the hand for longer than the hold window.

## Blob Detector Lessons

The lite detector gave excellent performance:

- detection often around `2ms` to `5ms`
- clean 30fps camera input
- no main-thread pressure

But the feel was not acceptable:

- right bias appeared repeatedly
- reversals were mushy
- center felt sticky
- weighted blob center did not map to user intent
- component selection was unstable
- hand/arm/body/background separation was not reliable enough

Key conclusion: speed alone is not the win. We need MediaPipe's semantic hand recognition, then reduce what we consume from it.

## Control Math Baseline

Desired game control model:

- Full camera FOV is 640px wide.
- Middle dead zone should be tiny, just a few pixels.
- Control should ramp linearly from dead zone edge to max speed.
- 75% of camera FOV is the active ramp span.
- Outer 12.5% caps on each side should hold max speed.
- Max speed should remain `700px/sec`.
- Blob/hand left means orb left. Blob/hand right means orb right.
- Prefer elapsed-time movement over per-frame movement so feel stays stable across frame rates.

Current telemetry confirms:

- `steeringMaxSpeedPxPerSec: 700`
- `steeringCenterEpsilon01: 0.002`
- `steeringRampWindow01: 0.75`

Those values match the intended shape. When the user reports slowness or bias under MediaPipe, suspect source X quality, stale/no-hand gating, smoothing, or detector output mapping before changing the intended speed curve.

## Next Recommended Slice

1. Add a diagnostic switch for the hold layer.

   We need to smoke raw MediaPipe without losing the ability to re-enable the hold pass. The simplest switch is a config path that sets `holdMissingMs: 0`.

2. Hunt the older "good MediaPipe before lite" SHA.

   Search commits around the time before the `orb-control-lite` work. Look for commits touching:

   - `orb-control-tracker.js`
   - `camera-input-steering.js`
   - `camera-steering-system.js`
   - `create-staging-shell-runtime.js`
   - `create-staging-shell-runtime` camera input config

3. Compare old-good MediaPipe against current worker MediaPipe.

   Focus comparison on:

   - active backend
   - target detection fps
   - handedness filtering
   - missing/no-hand gating
   - X source from landmarks
   - smoothing alpha
   - steering active conditions
   - speed curve config
   - camera constraints

4. Restore the best raw MediaPipe feel first.

   Do not use hold/smoothing to conceal raw loss, bias, or bad source X.

5. Reapply the hold layer after raw tracking feels right.

   The hold layer is likely still valuable, but as final cleanup.

## Terms For Future Notes

- "Raw tracker" means MediaPipe X signal without hold-through-missing.
- "Hold layer" means the `tracking_hold` behavior from `camera-input-steering.js`.
- "Lite detector" means `orb-control-lite`, the custom blob path.
- "Worker MediaPipe" means `orb-control-worker`, the current reductive MediaPipe path.
