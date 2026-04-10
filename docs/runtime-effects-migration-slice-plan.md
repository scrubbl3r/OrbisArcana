## Runtime Effects Migration Slice Plan

### Current Shape

The runtime effect implementations currently live in one flat directory:

- `src/vfx/effects/bubble-shield-runtime.js`
- `src/vfx/effects/electric-aoe-runtime.js`
- `src/vfx/effects/flame-aoe-runtime.js`
- `src/vfx/effects/orb-shatter-runtime.js`
- `src/vfx/effects/shockwave-runtime.js`
- `src/vfx/effects/vfx-runtimes-bundle.js`

This is still workable, but it no longer matches the binding/taxonomy model we have now established in VFX Studio:

- spell runtime targets
- orb-state runtime targets

### Clean Target Taxonomy

The cleaner long-term filesystem shape is:

- `src/vfx/effects/spells/`
  - `bubble-shield-runtime.js`
  - `electric-aoe-runtime.js`
  - `flame-aoe-runtime.js`
  - `shockwave-runtime.js`
- `src/vfx/effects/orb-states/`
  - `orb-shatter-runtime.js`

This mirrors the runtime-target vocabulary now used in the lab:

- `spell.*`
- `orb-state.*`

### Important Constraint

Do not churn import sites all at once.

The safest migration seam is:

1. move the runtime implementation files into the new subdirectories
2. keep `src/vfx/effects/vfx-runtimes-bundle.js` as the compatibility import surface
3. update only the bundle's internal imports first
4. smoke
5. only later decide whether to update broader import sites

### Why This Is Safe

`vfx-runtimes-bundle.js` is already the clean runtime composition seam.

That means the first physical directory migration does **not** need to ripple through the codebase if we preserve:

- `createBubbleShieldRuntime`
- `createShockwaveRuntime`
- `createOrbShatterRuntime`
- `createFlameAoeRuntime`
- `createElectricAoeRuntime`

behind the same bundle interface.

### Recommended Slice Order

#### Slice 1

Create the new directories and move only the files:

- `bubble-shield-runtime.js` -> `effects/spells/`
- `electric-aoe-runtime.js` -> `effects/spells/`
- `flame-aoe-runtime.js` -> `effects/spells/`
- `shockwave-runtime.js` -> `effects/spells/`
- `orb-shatter-runtime.js` -> `effects/orb-states/`

Then update:

- `src/vfx/effects/vfx-runtimes-bundle.js`

only.

#### Slice 2

Smoke:

- staging shell spell visuals
- orb shatter
- VFX Studio previews

#### Slice 3

After stability is confirmed, optionally add per-domain index files:

- `src/vfx/effects/spells/index.js`
- `src/vfx/effects/orb-states/index.js`

This is optional and should only happen if it clearly improves legibility.

### Recommendation

The next best move is the physical directory migration in one small, compatibility-preserving slice.

That keeps the filesystem aligned with:

- runtime target taxonomy
- VFX Studio binding vocabulary
- future orb-state binding work

without destabilizing working runtime paths.
