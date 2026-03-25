# Interactions Schema

Related index:
- `docs/rule-engine-v2-docs-index.md`

## Goal

- Keep one behavior authoring source.
- Keep one separate word inventory source.
- Treat words as components, not hardcoded behaviors.

The canonical authoring model is now:
- `word`
- `spin`
- `shake`
- `open`
- `requires`
- `consume`
- `bind`
- `trigger`

## File 1: Word Inventory

Canonical inventory file: `src/content/interactions-v2/wordbook-v2.js`

Use the `wordbook` as the inventory SSOT. Do not treat the legacy `spellbook` label as behavior authoring; it only survives as a compatibility alias in older tooling.

Responsibilities:
- define which words exist
- define phrase / ONNX / confidence / cooldown metadata
- no behavior semantics

Example:

```js
{
  version: "2",
  words: [
    { id: "orbis", phrase: "orbis", active: true, onnx: "orbis" },
    { id: "domus", phrase: "domus", active: true, onnx: "domus" },
    { id: "pyro", phrase: "pyro", active: true, onnx: "pyro" },
    { id: "electrum", phrase: "electrum", active: true, onnx: "electrum" },
    { id: "rota", phrase: "rota", active: true, onnx: "rota" },
  ],
}
```

## Behavior Authoring

`src/content/interactions-v2/dream-config-v2.js`

Example:

```js
{
  version: "2",
  enabled: true,
  rules: [
    {
      id: "wake_main",
      on: { word: "orbis" },
      open: { id: "wake.main", words: ["domus", "electrum", "pyro"], ttlMs: 2000 },
    },
    {
      id: "tele_home",
      on: { word: "domus" },
      requires: "wake.main",
      trigger: { spell: "teleport_home" },
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
  ],
}
```

Compatibility note:
- `wake_win.words[]` is canonical.
- `wake_win.spells[]` is a compatibility alias only.

## Selector Types

- `word`
- `spin`
- `shake`
- `orb_state`

Examples:

```js
on: { word: "rota" }
on: { all: [{ type: "word", id: "word.rota" }] }
on: { spin: "y", orb_state: "charged" }
on: { shake: "FB" }
```

## Authoring Principles

- words do not carry built-in gameplay meaning
- spins do not imply legacy axis semantics beyond their concrete id
- shakes select slots only
- sequencing is authored explicitly through windows
- outcomes are authored explicitly through `bind` and `trigger`

## Legacy Note

Older adapter/runtime surfaces may still use runtime namespaces like `spell.rota` internally. That is runtime plumbing, not canonical authoring language.
