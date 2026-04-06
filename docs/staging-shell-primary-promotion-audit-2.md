# Staging Shell Primary Promotion Audit 2

Date: 2026-04-06
Branch: `ssot-runtime-shell-cleanup`

## Goal

Reassess whether `staging-shell` is now ready to become the default primary harness after the latest parity work.

Relevant files:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/staging-shell.html`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/staging-shell.js`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/create-staging-shell-runtime.js`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/game-receiver.html`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/game-receiver.js`

## Current Read

`staging-shell` is now very close to full operational parity with the old root receiver harness.

The major shell blockers that were still open in the previous audit cycle have now been cleared:

- shell boot succeeds
- pairing / calibration works
- KWS works
- meters work
- lamps work
- spin mechanics work
- spin colors work
- electric AOE parity is restored
- globe consumption / storage / orbit visuals work
- orb crack / death / revive flow works
- shell logging now has a `GENERAL` channel

This is no longer a “can it boot?” or “is the architecture plausible?” question.
It is now mainly a rollout / confidence question.

## Confirmed Good Enough For Primary Use

### 1. Core motion/gameplay path is live

The shell now supports the active motion/gameplay loop:

- live receiver input
- orb physics
- shake
- spin x / y / z
- spell wake / cast flow
- globe ingest and bind visuals
- orb damage / death / revive flow

That means the shell is not just structurally complete.
It is behaviorally real.

### 2. Dev-surface support is sufficient

The shell dev surface now has:

- meters
- lamp visibility
- `WORDS`
- `LOG`
- `GENERAL` log channel

That is enough for normal smoke/debug work without depending on the root page as the default operator surface.

### 3. Shell host shape is now honest

The shell still contains shell-local bridge logic, but the broad mixed bootstrap tangles have already been split out:

- receiver host bootstrap
- receiver impulse adapter
- pairing bootstrap
- KWS bootstrap

So the remaining shell file is much more of a host composer than a migration blob.

## Residual Risks

### 1. Short proving window still makes sense

Even though the major blockers are cleared, this is still the first moment where the shell looks promotion-ready after the full parity run.

So the best rollout is:

- make shell the primary harness
- keep root receiver available as fallback during a short proving window

This is caution, not indecision.

### 2. Performance polish may still exist

Meters were previously reported as choppy and then improved by batching HUD updates through `requestAnimationFrame`.
That issue does not currently look like a promotion blocker, but it remains the most plausible area for future polish if users still notice roughness.

### 3. Root receiver should be demoted, not deleted immediately

The right move now is not instant removal.
It is:

- stop treating root receiver as the default harness
- keep it available temporarily as a fallback comparator
- then delete or archive it once shell proves stable over a short run

## Recommendation

Yes: `staging-shell` is now ready to become the primary harness.

Recommended rollout:

1. Make `staging-shell.html` the default smoke target.
2. Use root receiver only as fallback validation during a short proving window.
3. If shell remains clean across that window, demote root receiver from active harness status.
4. After that, do a final root-receiver retirement audit instead of continuing to split attention between two hosts.

## Recommendation To User

The best next move is:

- promote `staging-shell` now
- keep root receiver as temporary fallback only
- spend the next slices on shell-first work rather than continuing to optimize the old root harness

That is the most logical transition point we have reached so far.
