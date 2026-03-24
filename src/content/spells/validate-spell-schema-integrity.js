import { WORDS_BY_ID } from "../../voice/wordbook.js";
import { CAST_ACTION_REGISTRY_BY_ID } from "./cast-action-registry.js";
import {
  buildRuleEngineFromOrchestratorV2,
} from "../interactions-v2/index.js";
import { EVENT_DEFINITIONS } from "../spell-rules/event-definitions.js";
import { EVENT_RUNTIME_BINDINGS_BY_ID } from "../spell-rules/event-runtime-bindings.js";
import {
  AXIS_WORD_IDS,
  WORD_RUNTIME_ROUTING_BY_WORD_ID,
  WAKE_WINDOW_WORD_IDS,
  WAKE_REQUIRED_WORD_IDS,
  WAKE_WORD_IDS,
} from "./spell-runtime-routing.js";

function asId(v) {
  return String(v || "").trim().toLowerCase();
}

function indexDefsById(defs = []) {
  return (Array.isArray(defs) ? defs : []).reduce((acc, item) => {
    const id = asId(item && item.id);
    if (!id) return acc;
    acc[id] = item;
    return acc;
  }, Object.create(null));
}

export function validateSpellSchemaIntegrity(options = {}) {
  let projectedRules = [];
  if (!Array.isArray(options && options.rules)) {
    try {
      const engine = buildRuleEngineFromOrchestratorV2();
      projectedRules = Array.isArray(engine && engine.rules) ? engine.rules : [];
    } catch (_) {
      projectedRules = [];
    }
  }
  const rules = Array.isArray(options && options.rules)
    ? options.rules
    : (Array.isArray(projectedRules) ? projectedRules : []);
  const eventDefinitionsById = (options && options.eventById && typeof options.eventById === "object")
    ? options.eventById
    : (
      Array.isArray(options && options.events)
        ? indexDefsById(options.events)
        : indexDefsById(Array.isArray(EVENT_DEFINITIONS) ? EVENT_DEFINITIONS : [])
    );
  const eventRuntimeBindingsById = (options && options.eventRuntimeBindingsById && typeof options.eventRuntimeBindingsById === "object")
    ? options.eventRuntimeBindingsById
    : (
      options && options.eventRuntimeBindings && typeof options.eventRuntimeBindings === "object"
        ? options.eventRuntimeBindings
        : (EVENT_RUNTIME_BINDINGS_BY_ID && typeof EVENT_RUNTIME_BINDINGS_BY_ID === "object"
          ? EVENT_RUNTIME_BINDINGS_BY_ID
          : Object.create(null))
    );
  const errors = [];
  const routingByWordId = (WORD_RUNTIME_ROUTING_BY_WORD_ID && typeof WORD_RUNTIME_ROUTING_BY_WORD_ID === "object")
    ? WORD_RUNTIME_ROUTING_BY_WORD_ID
    : Object.create(null);

  // Every spellbook spell should have routing metadata during refactor.
  for (const spellId of Object.keys(WORDS_BY_ID || {})) {
    if (!routingByWordId[spellId]) {
      errors.push(`missing routing entry for spellbook spell: ${spellId}`);
    }
  }

  // Word lists should exist in spellbook.
  for (const idRaw of Array.isArray(WAKE_WORD_IDS) ? WAKE_WORD_IDS : []) {
    const id = asId(idRaw);
    if (!WORDS_BY_ID[id]) errors.push(`WAKE_WORD_IDS references unknown spell id: ${id}`);
  }
  for (const idRaw of Array.isArray(WAKE_REQUIRED_WORD_IDS) ? WAKE_REQUIRED_WORD_IDS : []) {
    const id = asId(idRaw);
    if (!WORDS_BY_ID[id]) errors.push(`WAKE_REQUIRED_WORD_IDS references unknown spell id: ${id}`);
  }
  for (const idRaw of Array.isArray(AXIS_WORD_IDS) ? AXIS_WORD_IDS : []) {
    const id = asId(idRaw);
    if (!WORDS_BY_ID[id]) errors.push(`AXIS_WORD_IDS references unknown spell id: ${id}`);
  }
  for (const idRaw of Array.isArray(WAKE_WINDOW_WORD_IDS) ? WAKE_WINDOW_WORD_IDS : []) {
    const id = asId(idRaw);
    if (!WORDS_BY_ID[id]) errors.push(`WAKE_WINDOW_WORD_IDS references unknown spell id: ${id}`);
  }
  // Every rule event action should have both definition and runtime binding.
  for (const rule of Array.isArray(rules) ? rules : []) {
    const ruleId = asId(rule && rule.id) || "(unnamed)";
    const actions = Array.isArray(rule && rule.then) ? rule.then : [];
    for (const action of actions) {
      const type = asId(action && action.type);
      const id = asId(action && action.id);
      if (type === "wake_win") {
        const wordRefs = Array.isArray(action && action.words)
          ? action.words
          : (Array.isArray(action && action.spells) ? action.spells : []);
        for (const wordIdRaw of wordRefs) {
          const wordId = asId(wordIdRaw).replace(/^(word|spell)\./, "");
          if (!WORDS_BY_ID[wordId]) {
            errors.push(`rule ${ruleId} wake_win references unknown word id: ${wordId}`);
          }
        }
        continue;
      }
      if (type !== "event") continue;
      if (!eventDefinitionsById[id]) {
        errors.push(`rule ${ruleId} event action missing event definition: ${id}`);
        continue;
      }
      const binding = eventRuntimeBindingsById[id];
      if (!binding || typeof binding !== "object") {
        errors.push(`rule ${ruleId} event action missing runtime binding: ${id}`);
        continue;
      }
      const runtime = (binding.runtime && typeof binding.runtime === "object") ? binding.runtime : null;
      const kind = asId(runtime && runtime.kind);
      if (kind !== "cast_action" && kind !== "orb_event") {
        errors.push(`event runtime binding ${id} has unsupported kind: ${kind || "(empty)"}`);
        continue;
      }
      if (kind === "cast_action") {
        const castActionId = asId(runtime && runtime.castActionId);
        if (!castActionId) {
          errors.push(`event runtime binding ${id} missing castActionId`);
          continue;
        }
        if (!CAST_ACTION_REGISTRY_BY_ID[castActionId]) {
          errors.push(`event runtime binding ${id} references unknown castActionId: ${castActionId}`);
        }
      }
      if (kind === "orb_event") {
        const eventName = String(runtime && runtime.event || "").trim();
        if (!eventName) {
          errors.push(`event runtime binding ${id} missing orb event name`);
        }
      }
    }
  }

  return errors;
}
