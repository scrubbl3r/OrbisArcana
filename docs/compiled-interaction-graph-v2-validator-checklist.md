# Compiled Interaction Graph v2 Validator Checklist (Draft)

Companion to [Compiled Interaction Graph v2 Schema](./compiled-interaction-graph-v2-schema.md).

Use this checklist to define `validateCompiledInteractionGraphV2` contract behavior.

## Root Validation

- `COMPILED_INTERACTION_GRAPH_V2` must be an object.
- `version` must equal `"2"`.
- `enabled` must be boolean.
- `rules` must be an array.
- `defaults` when present must be an object.
- `groups` when present must be an object map.
- Reject unsupported top-level keys.

## Defaults Validation

- `defaults.open` when present must be an object.
- `defaults.open.ttlMs` when present must be a finite number `>= 0`.
- `defaults.rule` when present must be an object.
- `defaults.rule.cooldownMs` when present must be finite `>= 0`.
- `defaults.rule.matchWindowMs` when present must be finite `>= 100`.
- `defaults.rule.priority` when present must be finite.
- `defaults.trigger` when present must be an object map by event id.
- each `defaults.trigger[eventId]` must be an object.

## Groups Validation

- each group key must be non-empty and trimmed.
- each group value must be a non-empty array of canonical word ids.
- group entries must be non-empty strings.
- unknown word ids in group lists should fail.

## Rule List Validation

- every rule must be an object.
- `rule.id` is required, trimmed, and unique.
- `rule.enabled` when present must be boolean.
- `rule.cooldownMs` when present must be finite `>= 0`.
- `rule.matchWindowMs` when present must be finite `>= 100`.
- `rule.priority` when present must be finite.
- reject unsupported rule keys.

## `on` Validation

- `rule.on` is required and must be an object.
- allowed keys: `word`, `gesture`, `orb_state`.
- each selector key supports string or array of strings.
- empty selector values are invalid.
- resolved selector ids must exist in known registries.
  - `word` -> active word inventory
  - `gesture` -> known gesture signals
  - `orb_state` -> known orb-state signals
- duplicate selectors in the same rule should fail.

## `open` Validation

- when present, `open` must be an object.
- required fields: `id`, `words`.
- `open.id` must be non-empty, trimmed.
- `open.words` must be string or array of strings.
- `open.words` supports:
  - canonical word id
  - group reference `@group_name`
- each group reference must exist in `groups`.
- resolved word ids must exist and be active.
- `open.ttlMs` when present must be finite `>= 0`.
- `open.enabled` when present must be boolean.
- duplicate words after group expansion should fail or be normalized deterministically (pick one behavior and document it).

## `requires` Validation

- when present, `requires` must be string or array of strings.
- all required window ids must be non-empty and trimmed.
- duplicates should fail.

## `consume` Validation

- when present, `consume` must be string or array of strings.
- all consume window ids must be non-empty and trimmed.
- duplicates should fail.

## `trigger` Validation

- when present, `trigger` must be:
  - string/array shorthand (optional if compiler supports), or
  - canonical object map by event id.
- canonical map keys must be known event ids.
- canonical map values must be:
  - boolean, or
  - object args payload.
- args payload must be plain object when present.
- recommended key convention: `ttlMs` for lifetime args.

## Rule Action Requirement

Each rule must define at least one action:
- `open`
- and/or `trigger`

If neither is present, fail.

## Cross-Rule / Runtime Contract Checks

- `requires`/`consume` window ids should map to known window ids.
  - minimum policy: must appear in at least one `open.id` in the ruleset, unless explicitly whitelisted runtime windows.
- no circular dependency rules should be required for validity, but warn if window graph is unreachable.
- deterministic ordering contract should be enforced/documented for runtime tie-breaks.

## Suggested Error Message Style

Prefer precise context labels:
- `COMPILED_INTERACTION_GRAPH_V2.rules[2].on.word references unknown id: pyrox`
- `rule pyro_school_01 requires unknown window id: wake.main2`
- `rule master_wake_01 open.words references unknown group: @wake_words_beta`

## Migration Compatibility (Temporary)

During migration only:
- allow `on.spell` as alias of `on.word`.
- allow `open.spells` as alias of `open.words`.
- normalize aliases to canonical output.
- emit warnings for alias usage; remove aliases after parity rollout.
