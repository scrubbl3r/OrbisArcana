## Energy Domain Audit

This note captures what `energy` is still doing after the classic motion-core cutover.

### Short answer

`energy` is not purely cosmetic, but it is also not a clean single-purpose gameplay signal.

Right now it spans three different roles:

- phone-origin input signal: `energy01`
- receiver-side accumulated resource bank: `energyBank`
- legacy presentation/audio scalar: HUD meter, background tint, browser tone, orb runtime `energy01`

That means the domain is mixed and should be separated deliberately before we preserve more of it by accident.

### What is definitely still live

#### 1. Shake spending gate

This is the most important non-cosmetic role.

- `src/game-runtime/resources/resources-system.js`
  - accumulates `energyBankPts`
  - exposes `canSpendShake()`
  - exposes `spendShake()`
- `game-receiver.js`
  - wires those into `gestureHooks`
- `src/runtime-shell/staging/staging-shell/create-staging-shell-runtime.js`
  - wires the same hooks for staging runtime

Meaning:

- energy bank is still a real gameplay resource because shake-triggered actions are gated by it

#### 2. HUD / dev display

- `game-receiver.js`
- `src/runtime-shell/receiver/receiver-adapters.js`
- `src/runtime-shell/staging/dev-staging/dev-staging.js`

These use:

- `energyBank.level01`
- `energyBank.points`

for:

- energy meter fill
- numeric readout
- over-cap styling
- background tint

This is presentation, but it is still active and visible.

#### 3. Legacy browser tone

Still active on both receiver and mobile:

- `game-receiver.js:setAudio(eUI, groove, locked)`
- `mobile-transmitter.js:setAudio(eUI, groove, locked)`

Tone behavior still depends on:

- energy level
- groove
- locked state

This appears to be old feedback UX, not core gameplay truth.

#### 4. Orb runtime scalar patch

Energy is still patched into orb runtime state:

- `src/game-runtime/input/input-frame-pipeline.js`
  - `physState.energy01 = energyUI01`
- `game-receiver.js`
  - classic shadow orb patch also sets `energy01`
- `src/runtime-shell/receiver/receiver-adapters.js`
  - physics adapter sets `physState.energy01 = energyBank.level01`

Important nuance:

- `src/game-runtime/orb/orb-runtime-pipeline.js` does not currently use `state.energy01` directly in its lift/physics simulation
- so this orb scalar looks more like legacy state carryover than active motion physics truth

### What energy does not appear to do directly

From the current code, `energy` does not appear to directly drive:

- lift computation
- gravity / thrust integration
- orb collision / bounce
- spin gating
- spell window logic

Those systems depend on other signals.

### Current shape of the domain

#### Phone signal

- transmitter sends `energy01`

#### Receiver resource layer

- `resources-system` integrates `energy01` over time into `energyBankPts`

#### Presentation layer

- HUD meter and background consume `energyBank`
- browser tone consumes `energyUI01`
- orb runtime still receives `energy01`, but current physics pipeline does not obviously depend on it

### Recommendation

Treat the domain as split, not singular.

#### Keep

- `energyBank` as the gameplay resource domain
- `canSpendShake()` / `spendShake()` gating
- bank points / cap / charge-rate logic

#### Demote

- old browser tone as optional legacy feedback
- orb runtime `energy01` scalar unless a real downstream consumer is confirmed

#### Keep as presentation-only

- HUD energy meter
- background tint from energy bank

### Best next cleanup path

1. Confirm whether any real downstream orb/gameplay consumer still needs `physState.energy01`.
2. If not, stop patching orb runtime with energy as though it were motion physics truth.
3. Decide whether the old browser tone should stay or be sunset.
4. Keep `resources-system` as the true energy gameplay domain if shake spending is still part of the design.

### Bottom line

Energy should not be treated as a pure motion-core signal anymore.

The cleanest current interpretation is:

- `energy01` from phone is an input to resource accumulation
- `energyBank` is the real gameplay resource
- meter/tint/tone are consumers
- orb runtime `energy01` is probably legacy residue unless proven otherwise
