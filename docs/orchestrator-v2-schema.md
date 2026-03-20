# Orchestrator v2 Schema (Draft)

Purpose: define a compact, declarative SSOT for voice/gesture/orb sequencing with explicit window gating and consumable wake semantics.

This draft intentionally uses `word` terminology:
- `word` = recognized utterance token (inventory is managed by `wordbook`)
- `spell` = composed behavior/effects produced by orchestration rules

## Design Goals

- Keep syntax minimal and regular.
- Make wake chaining explicit in config (no hidden parser-only behavior).
- Keep runtime deterministic and validation-friendly.
- Preserve existing JSON/JS object authoring style.

## Canonical Shape

```js
export const ORCHESTRATOR_V2 = Object.freeze({
  version: "2",
  enabled: true,

  defaults: Object.freeze({
    open: Object.freeze({
      ttlMs: 1500,
    }),
    rule: Object.freeze({
      cooldownMs: 0,
      matchWindowMs: 2000,
      priority: 10,
    }),
    trigger: Object.freeze({
      // Event defaults by event id.
      grace: Object.freeze({ ttlMs: 500 }),
    }),
  }),

  groups: Object.freeze({
    wake_main_words: Object.freeze(["domus", "pyro", "fridgis", "electrum", "rota"]),
  }),

  rules: Object.freeze([
    {
      id: "master_wake_01",
      on: { word: "orbis" },
      open: { id: "wake.main", words: "@wake_main_words", ttlMs: 1500 },
    },
    {
      id: "tele_home_01",
      on: { word: "domus" },
      requires: ["wake.main"],
      consume: ["wake.main"],
      trigger: { teleport_home: true },
    },
    {
      id: "pyro_school_01",
      on: { word: "pyro" },
      requires: ["wake.main"],
      open: { id: "pyro.school", words: ["rota"], ttlMs: 1200 },
      trigger: { aoe_flame: { range: 14, ttlMs: 5000, power: 95 } },
    },
  ]),
});
```

## Root Fields

- `version`: must be `"2"`.
- `enabled`: boolean global switch.
- `defaults`: optional global defaults.
- `groups`: optional reusable `word` sets.
- `rules`: ordered rule list.

## Rule Fields

- `id`: unique stable rule id.
- `on`: selector object for match inputs.
- `requires`: optional window id or list of window ids that must be open.
- `open`: optional window-open action to publish on successful rule match.
- `consume`: optional window id or list of window ids to consume/close on successful rule match.
- `trigger`: optional event map describing emitted actions/effects and args.
- `cooldownMs`: optional per-rule cooldown override.
- `matchWindowMs`: optional per-rule temporal match window override.
- `priority`: optional deterministic ordering override.
- `enabled`: optional boolean override per rule.

At least one action section is required per rule:
- `open`
- and/or `trigger`

## `on` Selectors

Supported selector keys:
- `word`: string or array of canonical word ids.
- `gesture`: string or array of gesture ids.
- `orb_state`: string or array of orb state ids.

Notes:
- Selectors are additive (logical AND across selector types, OR within each selector list).
- `on` can support shorthand in compiler later, but this schema defines canonical form only.

## `open` Action

Canonical shape:

```js
open: {
  id: "wake.main",
  words: ["domus", "pyro"],
  ttlMs: 1500,
  enabled: true,
}
```

Fields:
- `id`: required window id.
- `words`: required word allowlist for the window; supports group refs with `@group_name`.
- `ttlMs`: optional, falls back to `defaults.open.ttlMs`.
- `enabled`: optional boolean.

## `requires` + `consume`

`requires`:
- Gate that requires windows to already be open.
- Supports string or array of window ids.

`consume`:
- Consumes/closes window tokens after successful rule execution.
- Supports string or array of window ids.

Semantics:
- `requires` ensures explicit wake pairing.
- `consume` enables one-shot wake chains and nested control patterns.

## `trigger` Action Map

Canonical shape:

```js
trigger: {
  teleport_home: true,
  aoe_electric: { range: 14, ttlMs: 5000, power: 95 },
  grace: true,
}
```

Map value forms:
- `true`: trigger event with defaults only.
- object: trigger event with per-instance args merged over defaults.

Timing key convention:
- Use `ttlMs` as the preferred lifetime key.

## Groups

Groups are reusable `word` sets:

```js
groups: {
  wake_main_words: ["domus", "pyro", "fridgis"],
}
```

Reference form inside `open.words`:
- `"@wake_main_words"`

## Deterministic Evaluation

Recommended deterministic rule ordering for ties:
1. `priority` descending
2. selector specificity descending
3. declaration order

## Compatibility + Migration Notes

- Existing runtime currently uses `spell` terminology in many codepaths.
- Orchestrator v2 should treat `word` as canonical and optionally accept `spell` as a temporary alias during migration.
- `spell-runtime-routing` wake semantics should migrate into orchestrator windows (`on` + `open` + `requires` + `consume`) so behavior is authored in SSOT.
