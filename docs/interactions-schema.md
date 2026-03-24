# Interactions Schema

Related index:
- `docs/rule-engine-v2-docs-index.md`

## Goal
- One central behavior config for chaining words, gestures, orb states, wake windows, and events.
- One separate word inventory file for availability (`active` true/false).
- Keep syntax minimal and author-friendly.

## File 1: Word Inventory
`wordbook`
Compatibility alias (legacy): `spellbook` (do not use for new authoring)

```js
{
  version: "2",
  words: [
    { id: "orbis", phrase: "orbis", active: true, onnx: "orbis", confidence: 0.62, cooldownMs: 900 },
    { id: "rota",  phrase: "rota",  active: true, onnx: "rota",  confidence: 0.60, cooldownMs: 1100 },
    { id: "domus", phrase: "domus", active: true, onnx: "domus", confidence: 0.60, cooldownMs: 1000 }
  ],
  // compatibility alias:
  // spells: [...]
}
```

### Wordbook Responsibilities
- Define what words exist.
- Define if each word is active.
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
          { type: "word", id: "rota" },
          { type: "gesture", id: "SPIN_Y" },
          { type: "orb_state", id: "charged" }
        ]
      },

      then: [
        { type: "wake_win", words: ["sanctum", "vectus"] }, // canonical authoring
        { type: "event", id: "aoe_electric" },
        { type: "event", id: "grace" },
        { type: "event", id: "orb_state", overrides: { state: "superheated" } }
      ]
    }
  ]
}
```

## Entity Types
- Trigger types (`on`): `word`, `gesture`, `orb_state`
- Action types (`then`): `wake_win`, `event`

### Condition ID Forms
- Condition `id` supports either:
  - bare form: `rota`, `spin_y`, `charged`
  - qualified form: `word.rota`, `gesture.spin_y`, `orb_state.charged`
- Runtime normalization strips matching type prefix automatically (`word.` for word conditions).

### Wake Window Word ID Forms
- `wake_win.words[]` supports either:
  - bare form: `rota`
  - qualified form: `word.rota`
- Canonical authoring is `wake_win.words[]` + `word.*`.
- Compatibility aliases remain accepted for transition:
  - `wake_win.spells[]` (legacy alias of `wake_win.words[]`)
  - `spell.rota` style qualified entries (legacy runtime namespace alias)

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
- One word inventory file (`wordbook`).
- Neutral axis/wake-window taxonomy only.
- All word/gesture/orb interactions are modular and composable.

## Future-Proofing
- Support base config + level/area overlays.
- Support progression-based unlocks without changing schema shape.
- Keep stable IDs so per-area/per-player overrides are easy.
