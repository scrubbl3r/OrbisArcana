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
  ruleActionLimitOverrides: { ... }, // optional { [ruleId]: integer>=0 }
  ruleCooldownScaleOverrides: { ... }, // optional { [ruleId]: number>=0 }
  ruleMatchWindowScaleOverrides: { ... }, // optional { [ruleId]: number>=0 }
  ruleEmitPreviewMatchedOverrides: { ... }, // optional { [ruleId]: boolean }
  ruleExecuteActionsOverrides: { ... }, // optional { [ruleId]: boolean }
  ruleActionTypeEnabledOverrides: { ... }, // optional { [ruleId]: { wake_win?, event? } }
  signalEnabledOverrides: { ... }, // optional { [signalId]: boolean }
  signalDebounceOverrides: { ... }, // optional { [signalId]: number(ms) }
  signalMaxMatchesOverrides: { ... }, // optional { [signalId]: integer>=0 }
  signalEmitPreviewMatchedOverrides: { ... }, // optional { [signalId]: boolean }
  signalStopOnFirstMatchOverrides: { ... }, // optional { [signalId]: boolean }
  signalPriorityOverrides: { ... }, // optional { [signalId]: number }
  signalSourceEventOverrides: { ... }, // optional { [signalId]: sourceEvent }
  signalWhereOverrides: { ... }, // optional { [signalId]: partial where object }
  sourceEventEnabledOverrides: { ... }, // optional { [sourceEvent]: boolean }
  sourceEventDebounceOverrides: { ... }, // optional { [sourceEvent]: number(ms) }
  sourceEventMaxSignalsOverrides: { ... }, // optional { [sourceEvent]: integer>=0 }
  sourceEventStopOnFirstSignalMatchOverrides: { ... }, // optional { [sourceEvent]: boolean }
  sourceEventEmitPreviewMatchedOverrides: { ... }, // optional { [sourceEvent]: boolean }
  sourceEventActionTypeEnabledOverrides: { ... }, // optional { [sourceEvent]: { wake_win?, event? } }
  sourceEventExecuteActionsOverrides: { ... }, // optional { [sourceEvent]: boolean }
  sourceEventCooldownScaleOverrides: { ... }, // optional { [sourceEvent]: number>=0 }
  sourceEventMatchWindowScaleOverrides: { ... }, // optional { [sourceEvent]: number>=0 }
  sourceEventMaxActionsPerRuleMatchOverrides: { ... }, // optional { [sourceEvent]: integer>=0 }
  sourceEventStopOnFirstMatchOverrides: { ... }, // optional { [sourceEvent]: boolean }
  sourceEventMaxMatchesPerSignalOverrides: { ... }, // optional { [sourceEvent]: integer>=0 }
  ruleEnabledOverrides: { ... }, // optional { [ruleId]: boolean }
  actionEnabledOverrides: { ... }, // optional { [actionKey]: boolean }
  actionArgOverrides: { ... }, // optional { [actionKey]: object }
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
  - `actionArgOverrides` can centrally patch action args by key at runtime.
    - key formats:
      - `${ruleId}.${type}.${actionId}` (preferred)
      - `${ruleId}.${type}.${index}`
      - `${ruleId}.${index}`
    - precedence: action inline/default args -> `actionArgOverrides`.
  - Override-key validation:
    - `actionEnabledOverrides` and `actionArgOverrides` keys fail fast if they do not target an existing action on the referenced rule.
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
  - `ruleDefaults.priority` applies when a rule omits `priority`.
  - Precedence: `ruleDefaults` -> per-rule explicit fields -> `rulePriorityOverrides`.
- Rule ordering controls:
  - `rulePriorityOverrides` can centrally force per-rule `priority` by rule id.
  - Precedence: `rulePriorityOverrides` -> per-rule explicit/inherited priority.
  - Unknown rule ids in `rulePriorityOverrides` fail fast in validation.
- Rule timing controls:
  - `ruleTimingOverrides` can centrally force per-rule `cooldownMs` and `matchWindowMs` by rule id.
  - Precedence: `ruleTimingOverrides` -> per-rule explicit/inherited timing.
- Rule action fanout controls:
  - `ruleActionLimitOverrides` can centrally cap max executed actions for specific rules.
  - Precedence: `ruleActionLimitOverrides` -> `execution.maxActionsPerRuleMatch`.
- Rule cooldown scaling controls:
  - `ruleCooldownScaleOverrides` can centrally scale cooldown pacing for specific rules.
  - Precedence: `ruleCooldownScaleOverrides` -> `execution.cooldownScale`.
- Rule match-window scaling controls:
  - `ruleMatchWindowScaleOverrides` can centrally scale match-window strictness for specific rules.
  - Precedence: `ruleMatchWindowScaleOverrides` -> `execution.matchWindowScale`.
- Rule telemetry controls:
  - `ruleEmitPreviewMatchedOverrides` can centrally force preview telemetry on/off per rule.
  - Precedence: `ruleEmitPreviewMatchedOverrides` -> `sourceEventEmitPreviewMatchedOverrides` -> `execution.emitPreviewMatchedEvents`.
- Rule action execution controls:
  - `ruleExecuteActionsOverrides` can centrally force action execution on/off per rule.
  - Precedence: `ruleExecuteActionsOverrides` -> `execution.executeActions`.
  - `ruleActionTypeEnabledOverrides` can centrally gate action types per rule.
  - Precedence: `ruleActionTypeEnabledOverrides` -> `sourceEventActionTypeEnabledOverrides` -> `execution.actionTypeEnabled`.
- Execution controls:
  - `execution.stopOnFirstMatch`:
    - `false` (default): all matched candidate rules can fire.
    - `true`: stop after first matched rule for a signal hit.
  - `execution.maxMatchesPerSignal`:
    - integer `>= 0`; default `0` (unlimited).
    - when `> 0`, caps how many matched rules can fire for one signal hit.
    - applies after candidate ordering (priority/source order).
  - `execution.maxSignalsPerEvent`:
    - integer `>= 0`; default `0` (unlimited).
    - when `> 0`, caps how many matching signals are processed per source-event payload.
  - `execution.maxActionsPerRuleMatch`:
    - integer `>= 0`; default `0` (unlimited).
    - when `> 0`, caps how many actions execute from a matched rule.
  - `execution.sourceEventDebounceMs`:
    - finite number `>= 0`; default `0` (disabled).
    - ignores repeated payloads from the same source event within the debounce interval.
  - `execution.emitPreviewMatchedEvents`:
    - boolean; default `true`.
    - controls emission of `rule_engine.v1.preview_matched` telemetry events only.
    - does not affect action execution (`rule_engine.v1.action_executed`).
  - `execution.executeActions`:
    - boolean; default `true`.
    - when `false`, matched rules do not execute actions (`wake_win`/`event`) in preview runtime.
  - `execution.actionTypeEnabled`:
    - optional action-type gate map, keys: `wake_win`, `event`.
    - when a key is set to `false`, that action type is skipped globally at runtime.
  - `execution.cooldownScale`:
    - finite number `>= 0`; default `1`.
    - multiplies all effective rule cooldowns at runtime.
    - `0` disables cooldown waiting globally; `2` doubles cooldown durations.
  - `execution.matchWindowScale`:
    - finite number `>= 0`; default `1`.
    - multiplies all effective rule match windows at runtime.
    - lower values tighten multi-signal timing; higher values loosen it.
  - `execution.signalDebounceMs`:
    - finite number `>= 0`; default `0` (disabled).
    - ignores repeated hits of the same signal id within the debounce interval.
  - `execution.stopOnFirstSignalMatchPerEvent`:
    - boolean; default `false`.
    - when `true`, for a single `sourceEvent` payload only the first matching signal is processed
      (based on source-event signal ordering/priority).
  - `signalDebounceOverrides`:
    - per-signal debounce ms map (`{ [signalId]: number >= 0 }`).
    - precedence: per-signal override -> `execution.signalDebounceMs`.
  - `signalMaxMatchesOverrides`:
    - per-signal matched-rule cap map (`{ [signalId]: integer >= 0 }`).
    - precedence: per-signal override -> `execution.maxMatchesPerSignal`.
  - `signalStopOnFirstMatchOverrides`:
    - per-signal matched-rule short-circuit map (`{ [signalId]: boolean }`).
    - precedence: per-signal override -> `sourceEventStopOnFirstMatchOverrides` -> `execution.stopOnFirstMatch`.
  - `signalEmitPreviewMatchedOverrides`:
    - per-signal preview telemetry map (`{ [signalId]: boolean }`).
    - precedence: `ruleEmitPreviewMatchedOverrides` -> `signalEmitPreviewMatchedOverrides` -> `sourceEventEmitPreviewMatchedOverrides` -> `execution.emitPreviewMatchedEvents`.
  - `signalPriorityOverrides`:
    - per-signal numeric priority map (`{ [signalId]: number }`).
    - higher priority signals are evaluated first within the same `sourceEvent`.
    - ties fall back to original source definition order.
  - `signalSourceEventOverrides`:
    - per-signal source-event remap (`{ [signalId]: string }`).
    - allows re-wiring signal source event streams centrally.
  - `signalWhereOverrides`:
    - per-signal patch map for `where` clauses (`{ [signalId]: object }`).
    - merges into the signal's existing `where` at config build time.
    - supported comparators: `eq`, `gt`, `gte`, `lt`, `lte`.
    - `eq` is exclusive (cannot be combined with numeric comparators).
  - `sourceEventEnabledOverrides`:
    - centrally enable/disable processing per signal source event (`{ [sourceEvent]: boolean }`).
    - when `false`, that source event is not subscribed by rule-engine preview runtime.
  - `sourceEventDebounceOverrides`:
    - per-source-event debounce ms map (`{ [sourceEvent]: number >= 0 }`).
    - precedence: per-source-event override -> `execution.sourceEventDebounceMs`.
  - `sourceEventMaxSignalsOverrides`:
    - per-source-event matched-signal cap map (`{ [sourceEvent]: integer >= 0 }`).
    - precedence: per-source-event override -> `execution.maxSignalsPerEvent`.
  - `sourceEventStopOnFirstSignalMatchOverrides`:
    - per-source-event first-match short-circuit map (`{ [sourceEvent]: boolean }`).
    - precedence: per-source-event override -> `execution.stopOnFirstSignalMatchPerEvent`.
  - `sourceEventEmitPreviewMatchedOverrides`:
    - per-source-event preview telemetry map (`{ [sourceEvent]: boolean }`).
    - precedence: per-source-event override -> `execution.emitPreviewMatchedEvents`.
  - `sourceEventActionTypeEnabledOverrides`:
    - per-source-event action-type gates (`{ [sourceEvent]: { wake_win?:boolean, event?:boolean } }`).
    - precedence: per-source-event override -> `execution.actionTypeEnabled`.
  - `sourceEventExecuteActionsOverrides`:
    - per-source-event action execution gate (`{ [sourceEvent]: boolean }`).
    - precedence: `execution.executeActions` must be true; then this per-source-event gate can disable execution.
  - `sourceEventCooldownScaleOverrides`:
    - per-source-event cooldown scale map (`{ [sourceEvent]: number >= 0 }`).
    - precedence: `ruleCooldownScaleOverrides` -> `sourceEventCooldownScaleOverrides` -> `execution.cooldownScale`.
  - `sourceEventMatchWindowScaleOverrides`:
    - per-source-event match-window scale map (`{ [sourceEvent]: number >= 0 }`).
    - precedence: `ruleMatchWindowScaleOverrides` -> `sourceEventMatchWindowScaleOverrides` -> `execution.matchWindowScale`.
  - `sourceEventMaxActionsPerRuleMatchOverrides`:
    - per-source-event action fanout cap (`{ [sourceEvent]: integer >= 0 }`).
    - precedence: `ruleActionLimitOverrides` -> `sourceEventMaxActionsPerRuleMatchOverrides` -> `execution.maxActionsPerRuleMatch`.
  - `sourceEventStopOnFirstMatchOverrides`:
    - per-source-event rule short-circuit toggle (`{ [sourceEvent]: boolean }`).
    - precedence: per-source-event override -> `execution.stopOnFirstMatch`.
  - `sourceEventMaxMatchesPerSignalOverrides`:
    - per-source-event rule-match cap (`{ [sourceEvent]: integer >= 0 }`).
    - precedence: `signalMaxMatchesOverrides` -> `sourceEventMaxMatchesPerSignalOverrides` -> `execution.maxMatchesPerSignal`.
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
    - unknown rule ids fail fast in validation.
  - `actionEnabledOverrides` can centrally force specific actions on/off by key.
    - key formats:
      - `${ruleId}.${type}.${actionId}` (preferred)
      - `${ruleId}.${type}.${index}`
      - `${ruleId}.${index}`
    - unknown rule ids fail fast in validation.
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
