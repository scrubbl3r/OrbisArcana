RULE ENGINE V1 MASTER CONTROL SCHEMA

Purpose
- Single authoring SSOT for rule-engine behavior.
- Define trigger chains (`on`) and outcomes (`then`) with optional per-rule/per-action toggles.

Canonical Source
- `src/content/spell-rules/rule-engine-master-control.js`
- symbol: `RULE_ENGINE_MASTER_CONTROL`

Current Neutral Contract (Implemented)
- Intent names:
  - axis select: `spell.axis_select`
  - wake-window select: `spell.wake_window_select`
- Action/event payload fields:
  - use `axisSpell` and `wakeWindowSpell`
  - legacy aliases are removed from runtime payloads (`school`, `classKey`)
- KWS runtime config:
  - uses `axisSpellByAxis` map for expected axis token routing
- Dispatch reject reasons (current):
  - `spell_window_required`
  - `flat_spin_requires_wake_window_token`
  - `no_axis_selected`
  - `axis_wake_window_resolution_failed`
  - `spell_axis_not_allowed`
  - `duplicate_spell_token`
  - `no_stored_globes`
  - `cooldown`
  - `spell_inactive`
  - `invalid_spell`

Top-Level Shape
```js
{
  id: "rule_engine_v2",
  version: "v2",
  enabled: true, // optional, default true
  execution: { ... }, // optional runtime policy flags
  ruleDefaults: { ... }, // optional global defaults for rules
  rulePriorityOverrides: { ... }, // optional { [ruleId]: number }
  ruleTimingOverrides: { ... }, // optional { [ruleId]: { cooldownMs?, matchWindowMs? } }
  ruleActionLimitOverrides: { ... }, // optional { [ruleId]: integer>=0 }
  ruleCooldownScaleOverrides: { ... }, // optional { [ruleId]: number>=0 }
  ruleMatchWindowScaleOverrides: { ... }, // optional { [ruleId]: number>=0 }
  ruleEmitPreviewMatchedOverrides: { ... }, // optional { [ruleId]: boolean }
  ruleEmitActionExecutedOverrides: { ... }, // optional { [ruleId]: boolean }
  ruleEmitSourceEventSummaryOverrides: { ... }, // optional { [ruleId]: boolean }
  ruleSummaryIncludeSignalAndRuleIdsOverrides: { ... }, // optional { [ruleId]: boolean }
  ruleSummaryIncludeBudgetCapsOverrides: { ... }, // optional { [ruleId]: boolean }
  ruleActionExecutedEventTypeEnabledOverrides: { ... }, // optional { [ruleId]: { wake_win?, event? } }
  ruleExecuteActionsOverrides: { ... }, // optional { [ruleId]: boolean }
  ruleActionTypeEnabledOverrides: { ... }, // optional { [ruleId]: { wake_win?, event? } }
  signalEnabledOverrides: { ... }, // optional { [signalId]: boolean }
  signalDebounceOverrides: { ... }, // optional { [signalId]: number(ms) }
  signalMaxMatchesOverrides: { ... }, // optional { [signalId]: integer>=0 }
  signalEmitPreviewMatchedOverrides: { ... }, // optional { [signalId]: boolean }
  signalExecuteActionsOverrides: { ... }, // optional { [signalId]: boolean }
  signalActionTypeEnabledOverrides: { ... }, // optional { [signalId]: { wake_win?, event? } }
  signalMatchWindowScaleOverrides: { ... }, // optional { [signalId]: number>=0 }
  signalCooldownScaleOverrides: { ... }, // optional { [signalId]: number>=0 }
  signalMaxActionsPerRuleMatchOverrides: { ... }, // optional { [signalId]: integer>=0 }
  signalMaxRulesEvaluatedOverrides: { ... }, // optional { [signalId]: integer>=0 }
  signalMaxActionsPerEventOverrides: { ... }, // optional { [signalId]: integer>=0 }
  signalMaxActionsPerSignalOverrides: { ... }, // optional { [signalId]: integer>=0 }
  signalEmitActionExecutedOverrides: { ... }, // optional { [signalId]: boolean }
  signalEmitSourceEventSummaryOverrides: { ... }, // optional { [signalId]: boolean }
  signalSummaryIncludeSignalAndRuleIdsOverrides: { ... }, // optional { [signalId]: boolean }
  signalSummaryIncludeBudgetCapsOverrides: { ... }, // optional { [signalId]: boolean }
  signalActionExecutedEventTypeEnabledOverrides: { ... }, // optional { [signalId]: { wake_win?, event? } }
  signalMaxMatchesPerEventOverrides: { ... }, // optional { [signalId]: integer>=0 }
  signalMaxSignalsPerEventOverrides: { ... }, // optional { [signalId]: integer>=0 }
  signalMaxSignalsEvaluatedPerEventOverrides: { ... }, // optional { [signalId]: integer>=0 }
  signalMaxRulesEvaluatedPerEventOverrides: { ... }, // optional { [signalId]: integer>=0 }
  signalStopOnFirstSignalMatchPerEventOverrides: { ... }, // optional { [signalId]: boolean }
  signalStopOnFirstMatchOverrides: { ... }, // optional { [signalId]: boolean }
  signalPriorityOverrides: { ... }, // optional { [signalId]: number }
  signalSourceEventOverrides: { ... }, // optional { [signalId]: sourceEvent }
  signalWhereOverrides: { ... }, // optional { [signalId]: partial where object }
  sourceEventEnabledOverrides: { ... }, // optional { [sourceEvent]: boolean }
  sourceEventDebounceOverrides: { ... }, // optional { [sourceEvent]: number(ms) }
  sourceEventMaxSignalsOverrides: { ... }, // optional { [sourceEvent]: integer>=0 }
  sourceEventMaxSignalsEvaluatedPerEventOverrides: { ... }, // optional { [sourceEvent]: integer>=0 }
  sourceEventMaxActionsPerSignalOverrides: { ... }, // optional { [sourceEvent]: integer>=0 }
  sourceEventMaxRulesEvaluatedOverrides: { ... }, // optional { [sourceEvent]: integer>=0 }
  sourceEventMaxRulesEvaluatedPerEventOverrides: { ... }, // optional { [sourceEvent]: integer>=0 }
  sourceEventMaxMatchesPerEventOverrides: { ... }, // optional { [sourceEvent]: integer>=0 }
  sourceEventMaxActionsPerEventOverrides: { ... }, // optional { [sourceEvent]: integer>=0 }
  sourceEventStopOnFirstSignalMatchOverrides: { ... }, // optional { [sourceEvent]: boolean }
  sourceEventEmitPreviewMatchedOverrides: { ... }, // optional { [sourceEvent]: boolean }
  sourceEventEmitActionExecutedOverrides: { ... }, // optional { [sourceEvent]: boolean }
  sourceEventEmitSourceEventSummaryOverrides: { ... }, // optional { [sourceEvent]: boolean }
  sourceEventSummaryIncludeSignalAndRuleIdsOverrides: { ... }, // optional { [sourceEvent]: boolean }
  sourceEventSummaryIncludeBudgetCapsOverrides: { ... }, // optional { [sourceEvent]: boolean }
  sourceEventActionTypeEnabledOverrides: { ... }, // optional { [sourceEvent]: { wake_win?, event? } }
  sourceEventActionExecutedEventTypeEnabledOverrides: { ... }, // optional { [sourceEvent]: { wake_win?, event? } }
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
  eventRuntimeBindings: { ... } // required bindings by event id
}
```

Definition Arrays
- `signals`, `windows`, and `events` entries must have non-empty ids.
- ids must be unique within each array.

Event Runtime Bindings
- `eventRuntimeBindings` must be an object when present.
- `eventRuntimeBindings` keys must be non-empty event ids and match declared `events`.
- each binding must be an object with `runtime` object.
- binding object supports keys: `id`, `runtime` (unknown keys fail fast).
- each binding `id` must be non-empty and match its map key.
- binding `id` must be a string when present.
- `runtime.kind` must be `orb_event` or `cast_action`.
- `runtime` supports keys: `kind`, `event`, `castActionId` (unknown keys fail fast).
- `runtime.kind` is required and must be a non-empty string.
- `runtime.event` / `runtime.castActionId` must be strings when present.
- if `runtime.kind` is `orb_event`, `runtime.event` must be non-empty.
- if `runtime.kind` is `orb_event`, `runtime.castActionId` must be omitted.
- if `runtime.kind` is `cast_action`, `runtime.castActionId` must be non-empty.
- if `runtime.kind` is `cast_action`, `runtime.event` must be omitted.

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
  - unknown keys in `ruleDefaults` fail fast in validation.
  - Precedence: `ruleDefaults` -> per-rule explicit fields -> `rulePriorityOverrides`.
- Rule ordering controls:
  - `rulePriorityOverrides` can centrally force per-rule `priority` by rule id.
  - map keys must be non-empty rule ids.
  - Precedence: `rulePriorityOverrides` -> per-rule explicit/inherited priority.
  - Unknown rule ids in `rulePriorityOverrides` fail fast in validation.
- Rule timing controls:
  - `ruleTimingOverrides` can centrally force per-rule `cooldownMs` and `matchWindowMs` by rule id.
  - map keys must be non-empty rule ids.
  - unknown keys inside each `ruleTimingOverrides[ruleId]` object fail fast in validation.
  - Precedence: `ruleTimingOverrides` -> per-rule explicit/inherited timing.
- Rule action fanout controls:
  - `ruleActionLimitOverrides` can centrally cap max executed actions for specific rules.
  - map keys must be non-empty rule ids.
  - Precedence: `ruleActionLimitOverrides` -> `execution.maxActionsPerRuleMatch`.
- Rule cooldown scaling controls:
  - `ruleCooldownScaleOverrides` can centrally scale cooldown pacing for specific rules.
  - map keys must be non-empty rule ids.
  - Precedence: `ruleCooldownScaleOverrides` -> `execution.cooldownScale`.
- Rule match-window scaling controls:
  - `ruleMatchWindowScaleOverrides` can centrally scale match-window strictness for specific rules.
  - map keys must be non-empty rule ids.
  - Precedence: `ruleMatchWindowScaleOverrides` -> `execution.matchWindowScale`.
- Rule telemetry controls:
  - telemetry override maps use non-empty rule ids as keys.
  - `ruleEmitPreviewMatchedOverrides` can centrally force preview telemetry on/off per rule.
  - Precedence: `ruleEmitPreviewMatchedOverrides` -> `sourceEventEmitPreviewMatchedOverrides` -> `execution.emitPreviewMatchedEvents`.
  - `ruleEmitActionExecutedOverrides` can centrally force action telemetry on/off per rule.
  - Precedence: `ruleEmitActionExecutedOverrides` -> `signalEmitActionExecutedOverrides` -> `sourceEventEmitActionExecutedOverrides` -> `execution.emitActionExecutedEvents`.
  - `ruleEmitSourceEventSummaryOverrides` can centrally force source-event summary telemetry on/off per rule.
  - Precedence: `ruleEmitSourceEventSummaryOverrides` -> `signalEmitSourceEventSummaryOverrides` -> `sourceEventEmitSourceEventSummaryOverrides` -> `execution.emitSourceEventSummaryEvents`.
  - `ruleSummaryIncludeSignalAndRuleIdsOverrides` can centrally force summary payload detail on/off per rule.
  - Precedence: `ruleSummaryIncludeSignalAndRuleIdsOverrides` -> `signalSummaryIncludeSignalAndRuleIdsOverrides` -> `sourceEventSummaryIncludeSignalAndRuleIdsOverrides` -> `execution.sourceEventSummaryIncludeSignalAndRuleIds`.
  - `ruleSummaryIncludeBudgetCapsOverrides` can centrally force summary budget-cap detail on/off per rule.
  - Precedence: `ruleSummaryIncludeBudgetCapsOverrides` -> `signalSummaryIncludeBudgetCapsOverrides` -> `sourceEventSummaryIncludeBudgetCapsOverrides` -> `execution.sourceEventSummaryIncludeBudgetCaps`.
  - `ruleActionExecutedEventTypeEnabledOverrides` can centrally force action-telemetry type gates per rule.
  - Precedence: `ruleActionExecutedEventTypeEnabledOverrides` -> `signalActionExecutedEventTypeEnabledOverrides` -> `sourceEventActionExecutedEventTypeEnabledOverrides` -> `execution.actionExecutedEventTypeEnabled`.
- Rule action execution controls:
  - `ruleExecuteActionsOverrides` can centrally force action execution on/off per rule.
  - Precedence: `ruleExecuteActionsOverrides` -> `execution.executeActions`.
  - `ruleActionTypeEnabledOverrides` can centrally gate action types per rule.
  - Precedence: `ruleActionTypeEnabledOverrides` -> `sourceEventActionTypeEnabledOverrides` -> `execution.actionTypeEnabled`.
- Execution controls:
  - Validation hygiene:
    - unknown top-level keys in `RULE_ENGINE_V1_MASTER_CONTROL` fail fast.
    - unknown keys inside `execution` fail fast.
  - `execution.stopOnFirstMatch`:
    - `false` (default): all matched candidate rules can fire.
    - `true`: stop after first matched rule for a signal hit.
  - `execution.maxMatchesPerSignal`:
    - integer `>= 0`; default `0` (unlimited).
    - when `> 0`, caps how many matched rules can fire for one signal hit.
    - applies after candidate ordering (priority/source order).
  - `execution.maxActionsPerSignal`:
    - integer `>= 0`; default `0` (unlimited).
    - when `> 0`, caps how many actions can execute for one signal hit.
  - `execution.maxRulesEvaluatedPerSignal`:
    - integer `>= 0`; default `0` (unlimited).
    - when `> 0`, caps how many candidate rules are evaluated per signal hit.
  - `execution.maxRulesEvaluatedPerEvent`:
    - integer `>= 0`; default `0` (unlimited).
    - when `> 0`, caps total candidate rule evaluations for one source-event payload.
  - `execution.maxMatchesPerEvent`:
    - integer `>= 0`; default `0` (unlimited).
    - when `> 0`, caps total matched rules emitted/executed for one source-event payload.
  - `execution.maxActionsPerEvent`:
    - integer `>= 0`; default `0` (unlimited).
    - when `> 0`, caps total executed actions for one source-event payload.
  - `execution.maxSignalsPerEvent`:
    - integer `>= 0`; default `0` (unlimited).
    - when `> 0`, caps how many matching signals are processed per source-event payload.
  - `execution.maxSignalsEvaluatedPerEvent`:
    - integer `>= 0`; default `0` (unlimited).
    - when `> 0`, caps how many candidate signals are evaluated per source-event payload.
  - `execution.maxActionsPerRuleMatch`:
    - integer `>= 0`; default `0` (unlimited).
    - when `> 0`, caps how many actions execute from a matched rule.
  - `execution.sourceEventDebounceMs`:
    - finite number `>= 0`; default `0` (disabled).
    - ignores repeated payloads from the same source event within the debounce interval.
  - `execution.emitPreviewMatchedEvents`:
    - boolean; default `true`.
    - controls emission of `rule_engine.preview_matched` telemetry events only.
    - does not affect action execution (`rule_engine.action_executed`).
  - `execution.emitActionExecutedEvents`:
    - boolean; default `true`.
    - controls emission of `rule_engine.action_executed` telemetry events only.
    - does not affect whether actions execute.
  - `execution.emitSourceEventSummaryEvents`:
    - boolean; default `false`.
    - controls emission of `rule_engine.source_event_summary` telemetry events (one per source-event payload handled).
  - `execution.sourceEventSummaryIncludeSignalAndRuleIds`:
    - boolean; default `false`.
    - when `true`, source-event summary payload includes `signalId` and `ruleId` (first matched signal/rule for that payload).
  - `execution.sourceEventSummaryIncludeBudgetCaps`:
    - boolean; default `false`.
    - when `true`, source-event summary payload includes effective event-level caps:
      `maxSignalsEvaluatedPerEvent`, `maxSignalsPerEvent`, `maxRulesEvaluatedPerEvent`, `maxMatchesPerEvent`, `maxActionsPerEvent`.
  - `execution.actionExecutedEventTypeEnabled`:
    - optional telemetry action-type gate map, keys: `wake_win`, `event`.
    - when a key is set to `false`, `rule_engine.action_executed` telemetry for that action type is suppressed.
    - does not affect action execution.
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
  - `signalExecuteActionsOverrides`:
    - per-signal action execution map (`{ [signalId]: boolean }`).
    - precedence: `ruleExecuteActionsOverrides` -> `signalExecuteActionsOverrides` -> `sourceEventExecuteActionsOverrides` -> `execution.executeActions`.
  - `signalActionTypeEnabledOverrides`:
    - per-signal action-type gate map (`{ [signalId]: { wake_win?:boolean, event?:boolean } }`).
    - precedence: `ruleActionTypeEnabledOverrides` -> `signalActionTypeEnabledOverrides` -> `sourceEventActionTypeEnabledOverrides` -> `execution.actionTypeEnabled`.
  - `signalMatchWindowScaleOverrides`:
    - per-signal match-window scale map (`{ [signalId]: number >= 0 }`).
    - precedence: `ruleMatchWindowScaleOverrides` -> `signalMatchWindowScaleOverrides` -> `sourceEventMatchWindowScaleOverrides` -> `execution.matchWindowScale`.
  - `signalCooldownScaleOverrides`:
    - per-signal cooldown scale map (`{ [signalId]: number >= 0 }`).
    - precedence: `ruleCooldownScaleOverrides` -> `signalCooldownScaleOverrides` -> `sourceEventCooldownScaleOverrides` -> `execution.cooldownScale`.
  - `signalMaxActionsPerRuleMatchOverrides`:
    - per-signal action fanout cap (`{ [signalId]: integer >= 0 }`).
    - precedence: `ruleActionLimitOverrides` -> `signalMaxActionsPerRuleMatchOverrides` -> `sourceEventMaxActionsPerRuleMatchOverrides` -> `execution.maxActionsPerRuleMatch`.
  - `signalMaxRulesEvaluatedOverrides`:
    - per-signal candidate evaluation cap (`{ [signalId]: integer >= 0 }`).
    - precedence: per-signal override -> `sourceEventMaxRulesEvaluatedOverrides` -> `execution.maxRulesEvaluatedPerSignal`.
  - `signalMaxActionsPerEventOverrides`:
    - per-signal action cap for one source-event payload (`{ [signalId]: integer >= 0 }`).
    - precedence: per-signal override -> `sourceEventMaxActionsPerEventOverrides` -> `execution.maxActionsPerEvent`.
  - `signalMaxActionsPerSignalOverrides`:
    - per-signal action cap for one signal hit (`{ [signalId]: integer >= 0 }`).
    - precedence: per-signal override -> `sourceEventMaxActionsPerSignalOverrides` -> `execution.maxActionsPerSignal`.
  - `signalEmitActionExecutedOverrides`:
    - per-signal action telemetry map (`{ [signalId]: boolean }`).
    - precedence: `ruleEmitActionExecutedOverrides` -> `signalEmitActionExecutedOverrides` -> `sourceEventEmitActionExecutedOverrides` -> `execution.emitActionExecutedEvents`.
  - `signalEmitSourceEventSummaryOverrides`:
    - per-signal source-event summary telemetry map (`{ [signalId]: boolean }`).
    - precedence: `ruleEmitSourceEventSummaryOverrides` -> `signalEmitSourceEventSummaryOverrides` -> `sourceEventEmitSourceEventSummaryOverrides` -> `execution.emitSourceEventSummaryEvents`.
  - `signalSummaryIncludeSignalAndRuleIdsOverrides`:
    - per-signal summary payload detail map (`{ [signalId]: boolean }`).
    - precedence: `ruleSummaryIncludeSignalAndRuleIdsOverrides` -> `signalSummaryIncludeSignalAndRuleIdsOverrides` -> `sourceEventSummaryIncludeSignalAndRuleIdsOverrides` -> `execution.sourceEventSummaryIncludeSignalAndRuleIds`.
  - `signalSummaryIncludeBudgetCapsOverrides`:
    - per-signal summary budget-cap detail map (`{ [signalId]: boolean }`).
    - precedence: per-signal override (unless `ruleSummaryIncludeBudgetCapsOverrides` is present) -> `sourceEventSummaryIncludeBudgetCapsOverrides` -> `execution.sourceEventSummaryIncludeBudgetCaps`.
  - `signalActionExecutedEventTypeEnabledOverrides`:
    - per-signal action-telemetry type gates (`{ [signalId]: { wake_win?:boolean, event?:boolean } }`).
    - precedence: per-signal override -> `sourceEventActionExecutedEventTypeEnabledOverrides` -> `execution.actionExecutedEventTypeEnabled`.
  - `signalMaxMatchesPerEventOverrides`:
    - per-signal matched-rule cap for one source-event payload (`{ [signalId]: integer >= 0 }`).
    - precedence: per-signal override -> `sourceEventMaxMatchesPerEventOverrides` -> `execution.maxMatchesPerEvent`.
  - `signalMaxSignalsPerEventOverrides`:
    - per-signal matched-signal cap for one source-event payload (`{ [signalId]: integer >= 0 }`).
    - precedence: per-signal override -> `sourceEventMaxSignalsOverrides` -> `execution.maxSignalsPerEvent`.
  - `signalMaxSignalsEvaluatedPerEventOverrides`:
    - per-signal candidate-signal evaluation cap for one source-event payload (`{ [signalId]: integer >= 0 }`).
    - precedence: per-signal override -> `sourceEventMaxSignalsEvaluatedPerEventOverrides` -> `execution.maxSignalsEvaluatedPerEvent`.
  - `signalMaxRulesEvaluatedPerEventOverrides`:
    - per-signal candidate evaluation cap for one source-event payload (`{ [signalId]: integer >= 0 }`).
    - precedence: per-signal override -> `sourceEventMaxRulesEvaluatedPerEventOverrides` -> `execution.maxRulesEvaluatedPerEvent`.
  - `signalStopOnFirstSignalMatchPerEventOverrides`:
    - per-signal first-matching-signal short-circuit map for source-event payloads (`{ [signalId]: boolean }`).
    - precedence: per-signal override -> `sourceEventStopOnFirstSignalMatchOverrides` -> `execution.stopOnFirstSignalMatchPerEvent`.
  - `signalPriorityOverrides`:
    - per-signal numeric priority map (`{ [signalId]: number }`).
    - higher priority signals are evaluated first within the same `sourceEvent`.
    - ties fall back to original source definition order.
  - `signalSourceEventOverrides`:
    - per-signal source-event remap (`{ [signalId]: string }`).
    - map keys must be non-empty signal ids.
    - allows re-wiring signal source event streams centrally.
  - `signalWhereOverrides`:
    - per-signal patch map for `where` clauses (`{ [signalId]: object }`).
    - map keys must be non-empty signal ids.
    - merges into the signal's existing `where` at config build time.
    - supported comparators: `eq`, `gt`, `gte`, `lt`, `lte`.
    - supported keys: `path`, `eq`, `gt`, `gte`, `lt`, `lte` (unknown keys fail fast in validation).
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
  - `sourceEventMaxSignalsEvaluatedPerEventOverrides`:
    - per-source-event candidate signal evaluation cap map (`{ [sourceEvent]: integer >= 0 }`).
    - precedence: per-source-event override -> `execution.maxSignalsEvaluatedPerEvent`.
  - `sourceEventMaxActionsPerSignalOverrides`:
    - per-source-event action cap for one signal hit (`{ [sourceEvent]: integer >= 0 }`).
    - precedence: per-source-event override -> `execution.maxActionsPerSignal`.
  - `sourceEventMaxRulesEvaluatedOverrides`:
    - per-source-event candidate evaluation cap map (`{ [sourceEvent]: integer >= 0 }`).
    - precedence: per-source-event override -> `execution.maxRulesEvaluatedPerSignal`.
  - `sourceEventMaxRulesEvaluatedPerEventOverrides`:
    - per-source-event candidate evaluation cap for one payload (`{ [sourceEvent]: integer >= 0 }`).
    - precedence: per-source-event override -> `execution.maxRulesEvaluatedPerEvent`.
  - `sourceEventMaxMatchesPerEventOverrides`:
    - per-source-event rule-match cap map (`{ [sourceEvent]: integer >= 0 }`).
    - precedence: per-source-event override -> `execution.maxMatchesPerEvent`.
  - `sourceEventMaxActionsPerEventOverrides`:
    - per-source-event action cap map (`{ [sourceEvent]: integer >= 0 }`).
    - precedence: per-source-event override -> `execution.maxActionsPerEvent`.
  - `sourceEventStopOnFirstSignalMatchOverrides`:
    - per-source-event first-match short-circuit map (`{ [sourceEvent]: boolean }`).
    - precedence: per-source-event override -> `execution.stopOnFirstSignalMatchPerEvent`.
  - `sourceEventEmitPreviewMatchedOverrides`:
    - per-source-event preview telemetry map (`{ [sourceEvent]: boolean }`).
    - precedence: per-source-event override -> `execution.emitPreviewMatchedEvents`.
  - `sourceEventEmitActionExecutedOverrides`:
    - per-source-event action telemetry map (`{ [sourceEvent]: boolean }`).
    - precedence: per-source-event override -> `execution.emitActionExecutedEvents`.
  - `sourceEventEmitSourceEventSummaryOverrides`:
    - per-source-event summary telemetry map (`{ [sourceEvent]: boolean }`).
    - precedence: per-source-event override -> `execution.emitSourceEventSummaryEvents`.
  - `sourceEventSummaryIncludeSignalAndRuleIdsOverrides`:
    - per-source-event summary payload detail map (`{ [sourceEvent]: boolean }`).
    - precedence: per-source-event override -> `execution.sourceEventSummaryIncludeSignalAndRuleIds`.
  - `sourceEventSummaryIncludeBudgetCapsOverrides`:
    - per-source-event summary budget-cap detail map (`{ [sourceEvent]: boolean }`).
    - precedence: per-source-event override (unless `signalSummaryIncludeBudgetCapsOverrides` or `ruleSummaryIncludeBudgetCapsOverrides` is present) -> `execution.sourceEventSummaryIncludeBudgetCaps`.
  - `sourceEventActionExecutedEventTypeEnabledOverrides`:
    - per-source-event action-telemetry type gates (`{ [sourceEvent]: { wake_win?:boolean, event?:boolean } }`).
    - precedence: per-source-event override -> `execution.actionExecutedEventTypeEnabled`.
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
