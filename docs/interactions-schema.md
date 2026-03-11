# Interactions Schema

Related index:
- `docs/rule-engine-v2-docs-index.md`

## Goal
- One central behavior config for chaining spells, gestures, orb states, wake windows, and events.
- One separate spell inventory file for wake-word availability (`active` true/false).
- Keep syntax minimal and author-friendly.

## File 1: Spell Inventory (Wake Words Only)
`spellbook`

```js
{
  version: "2",
  spells: [
    { id: "orbis", phrase: "orbis", active: true, onnx: "orbis", confidence: 0.62, cooldownMs: 900 },
    { id: "rota",  phrase: "rota",  active: true, onnx: "rota",  confidence: 0.60, cooldownMs: 1100 },
    { id: "domus", phrase: "domus", active: true, onnx: "domus", confidence: 0.60, cooldownMs: 1000 }
  ]
}
```

### Spellbook Responsibilities
- Define what spells exist.
- Define if each spell is active.
- Define phrase/model/confidence/cooldown metadata only.
- No behavior routing or interaction chaining.

## File 2: Master Interaction SSOT Source
`interactions`

```js
{
  version: "2",
  enabled: true,

  defaults: {
    wakeWin: { ttlMs: 2000 },
    event: {
      grace: { ms: 500 }
    }
  },

  rules: [
    {
      id: "r_rota_yspin_charged",
      enabled: true,
      priority: 50,

      on: {
        all: [
          { type: "spell", id: "rota" },
          { type: "gesture", id: "Y_SPIN" },
          { type: "orb_state", id: "charged" }
        ]
      },

      then: [
        { type: "wake_win", spells: ["sanctum", "vectus"] },
        { type: "event", id: "electric_aoe" },
        { type: "event", id: "grace" },
        { type: "event", id: "orb_state", overrides: { state: "superheated" } }
      ]
    }
  ]
}
```

## Entity Types
- Trigger types (`on`): `spell`, `gesture`, `orb_state`
- Action types (`then`): `wake_win`, `event`

### Condition ID Forms
- Condition `id` supports either:
  - bare form: `rota`, `y_spin`, `charged`
  - qualified form: `spell.rota`, `gesture.y_spin`, `orb_state.charged`
- Runtime normalization strips matching type prefix automatically.

### Wake Window Spell ID Forms
- `wake_win.spells[]` supports either:
  - bare form: `rota`
  - qualified form: `spell.rota`
- Runtime normalization strips `spell.` prefix automatically.

## Override Rules
- If `overrides` exists on an action, those values win.
- If no `overrides`, use `defaults`.
- If neither provides a value, runtime definition fallback applies.

Example:

```js
{ type: "event", id: "grace", overrides: { ms: 900 } }
```

## Authoring Principles
- One behavior authoring file (`interactions`).
- One spell inventory file (`spellbook`).
- No school/class taxonomy split.
- All spell/gesture/orb interactions are modular and composable.

## Future-Proofing
- Support base config + level/area overlays.
- Support progression-based unlocks without changing schema shape.
- Keep stable IDs so per-area/per-player overrides are easy.
