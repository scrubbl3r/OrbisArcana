# Orchestrator v2 Schema

Purpose: define the authored behavior SSOT.

The current model is:
- inputs: `word`, `spin`, `shake`
- sequencing: `open`, `requires`, `consume`
- outcomes: `bind`, `trigger`
- slots: `UD`, `LR`, `FB`

Legacy concepts like axis words, wake-window words, and flat spin are not part of the schema.

## Canonical Shape

```js
export const COMPILED_INTERACTION_GRAPH_V2 = Object.freeze({
  version: "2",
  enabled: true,

  defaults: Object.freeze({
    open: Object.freeze({ ttlMs: 2000 }),
    rule: Object.freeze({ cooldownMs: 0, matchWindowMs: 2000, priority: 10 }),
  }),

  wake: Object.freeze({
    roots: Object.freeze([
      { id: "root.orbis", words: ["orbis"], ttlMs: 2000 },
    ]),
  }),

  groups: Object.freeze({
    wake_main_words: Object.freeze(["domus", "electrum", "pyro"]),
    school_words: Object.freeze(["rota"]),
  }),

  rules: Object.freeze([
    {
      id: "wake_main",
      on: { word: "orbis" },
      open: { id: "wake.main", words: "@wake_main_words", ttlMs: 2000 },
    },
    {
      id: "tele_home",
      on: { word: "domus" },
      requires: "wake.main",
      trigger: { spell: "teleport_home" },
    },
    {
      id: "electric_aoe",
      on: { word: "electrum" },
      requires: "wake.main",
      open: { id: "school.electrum", words: ["rota"], ttlMs: 2000 },
    },
    {
      id: "electric_aoe_cast",
      on: { word: "rota" },
      requires: "school.electrum",
      trigger: { spell: "aoe_electric" },
    },
    {
      id: "spin_y_opens_pyro",
      on: { spin: "y" },
      open: { id: "school.pyro_spin_seed", words: ["pyro"], ttlMs: 2000 },
    },
    {
      id: "spin_y_pyro_opens_rota",
      on: { word: "pyro" },
      requires: "school.pyro_spin_seed",
      open: { id: "school.pyro_spin", words: ["rota"], ttlMs: 2000 },
    },
    {
      id: "spin_y_pyro_rota_bind_fb",
      on: { word: "rota" },
      requires: "school.pyro_spin",
      bind: { spell: "aoe_flame", slot: "FB" },
    },
    {
      id: "shake_fb_cast",
      on: { shake: "FB" },
      trigger: { spell: "cast_loaded_fb" },
    },
  ]),
});
```

## Root Fields

- `version`: must be `"2"`
- `enabled`: optional global boolean
- `defaults`: optional defaults for `open` and `rule`
- `wake`: optional wake root declarations
- `groups`: optional reusable word lists
- `rules`: authored rule list

## Rule Fields

- `id`: required unique rule id
- `on`: selector object
- `requires`: optional string or list of required window ids
- `open`: optional window-open action
- `consume`: optional string or list of window ids to consume
- `trigger`: optional triggered outcome
- `bind`: optional slot-load outcome
- `cooldownMs`: optional per-rule cooldown
- `matchWindowMs`: optional per-rule match window
- `priority`: optional per-rule ordering
- `enabled`: optional per-rule boolean

Each rule must do at least one of:
- `open`
- `bind`
- `trigger`

## `on` Selectors

Canonical selector keys:
- `word`
- `spin`
- `shake`
- `orb_state`

Selector semantics:
- different selector keys are ANDed together
- multiple values within one selector list are ORed

Examples:

```js
on: { word: "domus" }
on: { spin: "y" }
on: { shake: "FB" }
```

## `open`

```js
open: {
  id: "wake.main",
  words: ["domus", "electrum", "pyro"],
  ttlMs: 2000,
}
```

- `id`: required window id
- `words`: required allowed follow-up words
- `ttlMs`: optional TTL, defaulting from `defaults.open.ttlMs`

## `requires` and `consume`

- `requires` gates a rule on currently open windows
- `consume` closes windows after a successful match

These are the only sequencing primitives. Runtime should not infer extra word roles outside authored windows.

## `bind`

```js
bind: {
  spell: "aoe_flame",
  slot: "FB",
}
```

`bind` is direct. It means load `spell` into slot `UD`, `LR`, or `FB`. It is not lowered to legacy `spell_load_*` semantics in authoring.

## `trigger`

```js
trigger: { spell: "teleport_home" }
```

`trigger` is used for immediate outcomes such as casts or other runtime events.

## Notes

- Word inventory belongs in `src/content/interactions-v2/wordbook-v2.js`.
- A word being present in the wordbook does not give it built-in behavior.
- Behavior only exists where the word is used in authored rules.
