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
- `wake_win` guardrail:
  - Use `ttlMs` for wake window timing.
  - `ms` on `wake_win` is rejected by validation.
- Toggles:
  - Rule-level `enabled:false` disables whole rule.
  - Action-level `enabled:false` disables only that action.
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
