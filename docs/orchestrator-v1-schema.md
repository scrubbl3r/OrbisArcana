# Orchestrator v1 DSL Schema (v0)

Purpose: define a human-first orchestration language for gameplay using a small core:
- `ON`
- `OPEN`
- `TRIGGER`

This doc adds required modifiers for production behavior:
- `WHEN`
- `COOLDOWN`
- `UNTIL`
- `WHILE`
- `FALLBACK`

## 1) Core Model

- `Compendium` defines canonical nuggets (signals, events, windows, etc).
- `Orchestrator v1 DSL` composes those nuggets into rule behavior.
- Runtime never depends on how a rule was authored, only on compiled artifacts.

## 2) Naming + Case Contract

- Keywords are uppercase: `ON`, `WHEN`, `OPEN`, `TRIGGER`, `UNTIL`, `WHILE`, `FALLBACK`.
- Compendium IDs remain canonical machine IDs (recommended lowercase snake/camel namespaces), for example:
  - `word.orbis`
  - `gesture.shake_ud`
  - `aoe_electric`
- Author-facing aliases may be uppercase, but compiler resolves to canonical IDs.

Rationale: keep authoring readable while preserving stable IDs across runtime/docs/tools.

## 3) Syntax (v0)

```txt
RULE         := ON <signal-list> [WHEN <expr>] [WHILE <expr>] [COOLDOWN(<dur>)] [PRIORITY(<int>)] <action>
action       := OPEN(<dur>) { <rule-block> } | TRIGGER <trigger-target>
trigger-target := <id> | { <id-list> }

optional-tail := [FALLBACK <trigger-target>] [UNTIL <expr-or-time>]
```

`signal-list` supports single or grouped signals:
- `ON spin_y`
- `ON shake_ud, shake_lr, shake_fb`

## 4) Semantics

### `ON`
- Registers listener(s) for one or more signals.

### `OPEN(duration)`
- Opens a scoped window/context for nested rules.
- Nested `ON` rules only evaluate while that window is active.

### `TRIGGER`
- Executes one or more event/action IDs from compendium/runtime bindings.

### `WHEN`
- Precondition guard evaluated at trigger time (unlocks, state, zone, resources).

### `WHILE`
- Continuous/active guard; if false, rule is not eligible.

### `COOLDOWN`
- Per-rule throttle after successful trigger.

### `UNTIL`
- Expiration for temporary overrides/buffs.

### `FALLBACK`
- If chosen rule cannot execute or fails guard at execution time, run fallback target.

## 5) Resolution Algorithm (Deterministic)

For each incoming signal:
1. Collect matching rules.
2. Filter by `WHEN` and `WHILE`.
3. Filter by cooldown.
4. Sort by:
   - higher `PRIORITY` first
   - then higher specificity (more guards/constraints)
   - then declaration order (stable tie-break)
5. Execute selected rule.
6. If execution rejected/blocked and `FALLBACK` exists, execute fallback chain.

Default behavior: single winner per trigger family unless explicitly configured for multi-fire.

## 6) Override Pattern

Use higher-priority conditional rules with fallback to base behavior.

```txt
ON shake_ud, shake_lr, shake_fb
TRIGGER shockwave_basic

ON shake_ud
WHEN unlocked.ud_special AND primed.domus
PRIORITY(100)
TRIGGER shockwave_ud_special
FALLBACK shockwave_basic
COOLDOWN(800ms)
UNTIL buffs.ud_special_expires_at
```

## 7) Example (Your Style)

```txt
ON orbis OPEN(2000ms) { domus, electrum, pyro, fridgis }

ON electrum OPEN(2000ms) {
  ON sanctum TRIGGER { shield_freeze }
  ON rota TRIGGER { aoe_freeze }
  ON vectus TRIGGER { ranged_freeze }
}

ON domus TRIGGER { orb_flash_2, teleport_home }

ON shake_ud, shake_lr, shake_fb TRIGGER { shockwave }

ON spin_y TRIGGER { immune_freeze }
```

## 8) Compiler Expectations

Compiler must:
- resolve aliases -> canonical IDs
- validate all IDs exist in compendium/runtime bindings
- produce deterministic output
- emit precise diagnostics with source rule location

## 9) Adoption Guidance

Current `interactions-v2` is the active orchestration layer.

Adoption path:
1. Keep compendium handles stable.
2. Author pilot rules in Orchestrator v1 DSL syntax.
3. Compile to current runtime schema (`interactions-v2`-compatible projection).
4. Activate once parity + tests are green.

## 10) Authoring Shorthand (Implemented)

Canonical authoring uses `word`/`words`. Legacy `spell`/`spells` inputs remain compatibility-only while migration completes.

The current compiler/validator accepts ergonomic shorthand:

- `on`:
  - string: `"rota, spin_y, charged"`
  - array: `["rota, spin_y", "charged"]`
  - object canonical keys:
    - `word` or `words`
  - legacy compatibility aliases:
    - `spell` or `spells`
    - `gesture` or `gestures`
    - `orb_state`, `orbState`, or `orbStates`
  - selector type aliases:
    - `orbstate:charged`
    - `orb-state:charged`
- `open`:
  - string/array comma shorthand for word lists
  - canonical key: `words`
  - legacy compatibility alias key: `spells`
  - `ttl` alias for `ttlMs` (with `ttlMs` precedence)
- `trigger`:
  - comma shorthand string: `"grace, aoe_electric"`
  - `triggers` alias for `trigger`
  - defaults alias: `defaults.triggers` for `defaults.trigger`
    - collision precedence: `defaults.trigger` over `defaults.triggers`
- rule timing:
  - `cooldown` alias for `cooldownMs`
  - `matchWindow` alias for `matchWindowMs`
  - `*Ms` fields take precedence when both are present
