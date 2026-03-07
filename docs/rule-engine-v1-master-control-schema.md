RULE ENGINE V1 MASTER CONTROL SCHEMA

Purpose
- Single authoring SSOT for rule-engine behavior.
- Define trigger chains (`on`) and outcomes (`then`) with optional per-rule/per-action toggles.

Canonical Source
- `src/content/spell-rules/rule-engine-v1-master-control.js`
- symbol: `RULE_ENGINE_V1_MASTER_CONTROL`

Top-Level Shape
```js
{
  id: "rule_engine_v1",
  version: "v1",
  enabled: true, // optional, default true
  execution: { ... }, // optional runtime policy flags
  ruleDefaults: { ... }, // optional global defaults for rules
  rulePriorityOverrides: { ... }, // optional { [ruleId]: number }
  ruleTimingOverrides: { ... }, // optional { [ruleId]: { cooldownMs?, matchWindowMs? } }
  signalEnabledOverrides: { ... }, // optional { [signalId]: boolean }
  ruleEnabledOverrides: { ... }, // optional { [ruleId]: boolean }
  actionEnabledOverrides: { ... }, // optional { [actionKey]: boolean }
  eventEnabledOverrides: { ... }, // optional { [eventId]: boolean }
  eventDefaultOverrides: { ... }, // optional { [eventId]: object }
  windowEnabledOverrides: { ... }, // optional { [windowId]: boolean }
  windowDefaultOverrides: { ... }, // optional { [windowId]: object }
  signals: [ ... ],
  windows: [ ... ],
  events: [ ... ],
  rules: [ ... ],
  eventRuntimeBindings: { ... }
}
```

Rule Shape (authoring)
```js
{
  id: "r_example",
  enabled: true, // optional, default true
  priority: 10, // optional, default 0; higher runs first

  // `on` supports 3 forms:
  // 1) array shorthand => all conditions
  // 2) { all:[...], any:[...] }
  // 3) single object => all:[single]
  on: [
    { type: "spell", id: "rota" },
    { type: "gesture", id: "y_spin" },
    { type: "orb_state", id: "charged" }
  ],

  // `then` supports array or single action object.
  then: [
    {
      type: "wake_win",
      // id optional; defaults to "wake_win"
      spells: ["sanctum", "vectus"],
      ttlMs: 2000,
      enabled: true // optional, default true
    },
    { type: "event", id: "electric_aoe", range: 14 },
    { type: "event", id: "grace", ms: 500 },
    { type: "event", id: "orb_state", state: "superheated" }
  ]
}
```

Authoring Notes
- Condition type normalization:
  - `{ type:"spell", id:"rota" }` resolves to signal `spell.rota`
  - `{ type:"gesture", id:"y_spin" }` resolves to `gesture.y_spin`
  - `{ type:"orb_state", id:"charged" }` resolves to `orb_state.charged`
- Action inline args are generic:
  - Any non-structural key is treated as action args.
  - Structural keys: `type`, `id`, `spells`, `overrides`, `enabled`.
- Default arg controls:
  - `eventEnabledOverrides` can centrally force specific event definitions on/off by event id.
    - disabled events remain defined, but runtime skips dispatching those event actions.
  - `windowEnabledOverrides` can centrally force specific window definitions on/off by window id.
    - disabled windows remain defined, but runtime skips wake-window dispatch for those ids.
  - `eventDefaultOverrides` patches event `defaultArgs` globally by event id.
  - `windowDefaultOverrides` patches window `defaultArgs` globally by window id.
  - Precedence: definition defaults -> master-control default overrides -> per-action inline args.
- Rule default controls:
  - `ruleDefaults.cooldownMs` applies when a rule omits `cooldownMs`.
  - `ruleDefaults.matchWindowMs` applies when a rule omits `matchWindowMs`.
  - Precedence: `ruleDefaults` -> per-rule explicit fields.
- Rule ordering controls:
  - `rulePriorityOverrides` can centrally force per-rule `priority` by rule id.
  - Precedence: `rulePriorityOverrides` -> per-rule explicit/inherited priority.
- Rule timing controls:
  - `ruleTimingOverrides` can centrally force per-rule `cooldownMs` and `matchWindowMs` by rule id.
  - Precedence: `ruleTimingOverrides` -> per-rule explicit/inherited timing.
- Execution controls:
  - `execution.stopOnFirstMatch`:
    - `false` (default): all matched candidate rules can fire.
    - `true`: stop after first matched rule for a signal hit.
  - `execution.maxMatchesPerSignal`:
    - integer `>= 0`; default `0` (unlimited).
    - when `> 0`, caps how many matched rules can fire for one signal hit.
    - applies after candidate ordering (priority/source order).
  - `execution.cooldownScale`:
    - finite number `>= 0`; default `1`.
    - multiplies all effective rule cooldowns at runtime.
    - `0` disables cooldown waiting globally; `2` doubles cooldown durations.
  - `execution.matchWindowScale`:
    - finite number `>= 0`; default `1`.
    - multiplies all effective rule match windows at runtime.
    - lower values tighten multi-signal timing; higher values loosen it.
- `wake_win` guardrail:
  - Use `ttlMs` for wake window timing.
  - `ms` on `wake_win` is rejected by validation.
- Toggles:
  - Top-level `enabled:false` disables the whole rule engine schema.
  - `signalEnabledOverrides` can centrally force specific signals on/off by `id`.
    - disabled signals remain defined but do not emit runtime signal hits.
  - Rule-level `enabled:false` disables whole rule.
  - Action-level `enabled:false` disables only that action.
  - `ruleEnabledOverrides` can centrally force specific rules on/off by `id`.
  - `actionEnabledOverrides` can centrally force specific actions on/off by key.
    - key formats:
      - `${ruleId}.${type}.${actionId}` (preferred)
      - `${ruleId}.${type}.${index}`
      - `${ruleId}.${index}`
- Priority:
  - Higher `priority` rules are evaluated first when multiple rules are candidates.
  - Equal `priority` preserves source order.

Current Example Chain
```js
{
  id: "r_rota_yspin_charged",
  on: [
    { type: "spell", id: "rota" },
    { type: "gesture", id: "y_spin" },
    { type: "orb_state", id: "charged" }
  ],
  then: [
    { type: "wake_win", spells: ["rota","sanctum","vectus"], ttlMs: 2000 },
    { type: "event", id: "electric_aoe", range: 14 },
    { type: "event", id: "grace", ms: 500 },
    { type: "event", id: "orb_state", state: "superheated" }
  ]
}
```
