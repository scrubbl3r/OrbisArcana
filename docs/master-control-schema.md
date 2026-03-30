# Rule Engine Master Control Schema

Related index:
- `docs/rule-engine-v2-docs-index.md`

## Purpose

`rule-engine-master-control` is runtime wiring and policy control. It is not the behavior authoring SSOT.

Canonical policy surface: `RULE_ENGINE_POLICY_CONTROL`
compatibility alias: `RULE_ENGINE_MASTER_CONTROL`

Behavior SSOT lives in:
- `src/content/interactions-v2/interaction-graph-v2.js`
- `src/content/interactions-v2/wordbook-v2.js`

Generated projections and docs then flow from that authored source.

## What Master Control Owns

- runtime execution policy
- signal/window/event definitions
- runtime bindings for emitted actions
- telemetry and budget overrides

## What It Does Not Own

- axis-word behavior
- wake-window-word taxonomy
- flat-spin semantics as a gameplay primitive
- built-in meaning for specific words

Those concepts are legacy and should not be reintroduced here.

## Current Input Model

- `word`
- `spin`
- `shake`

## Current Sequencing Model

- `open`
- `requires`
- `consume`

## Current Outcome Model

- `bind`
- `trigger`

## Wake Window Canonical Shape

Use `wake_win.words[]` as the canonical authored/runtime-facing word list.
`wake_win.spells[]` exists only as a compatibility alias and should mirror `wake_win.words[]`, not replace it.

## Runtime Namespaces

Some runtime internals still use compatibility-style ids such as:
- `spell.rota`
- `spin.y`
- `shake.fb`
- `orb_state.charged`

Those are runtime signal ids, not an invitation to recreate old authoring taxonomy.

## Practical Guidance

- edit `interaction-graph-v2.js` when changing behavior
- edit `wordbook-v2.js` when changing the word inventory
- edit master control only when changing runtime policy or bindings
- do not hand-author gameplay meaning into runtime word tables

## Generated Artifacts

For the current projected state, use:
- `docs/rule-engine-v2.effective-snapshot.json`
- `docs/master-control-v2.md`
- `docs/master-control-v2.json`
- `docs/master-control-v2.authoring.json`

These generated artifacts are the best source for current projected runtime shape.
