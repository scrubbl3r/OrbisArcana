import { SPELLS_BY_ID } from "../../voice/spellbook.js";
import { CAST_ACTION_REGISTRY_BY_ID } from "./cast-action-registry.js";
import { RULE_ENGINE_V1_MASTER_CONTROL } from "../spell-rules/rule-engine-v1-master-control.js";
import {
  AXIS_SPELL_IDS,
  CLASS_SPELL_IDS,
  SPELL_RUNTIME_ROUTING_BY_ID,
  WAKE_WINDOW_SPELL_IDS,
  WAKE_REQUIRED_SPELL_IDS,
  WAKE_SPELL_IDS,
} from "./spell-runtime-routing-v1.js";

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

export function validateSpellSchemaIntegrityV1(options = {}) {
  const master = (RULE_ENGINE_V1_MASTER_CONTROL && typeof RULE_ENGINE_V1_MASTER_CONTROL === "object")
    ? RULE_ENGINE_V1_MASTER_CONTROL
    : Object.create(null);
  const rules = Array.isArray(options && options.rules)
    ? options.rules
    : (Array.isArray(master.rules) ? master.rules : []);
  const eventDefinitionsById = (options && options.eventById && typeof options.eventById === "object")
    ? options.eventById
    : (
      Array.isArray(options && options.events)
        ? indexDefsById(options.events)
        : indexDefsById(Array.isArray(master.events) ? master.events : [])
    );
  const eventRuntimeBindingsById = (options && options.eventRuntimeBindingsById && typeof options.eventRuntimeBindingsById === "object")
    ? options.eventRuntimeBindingsById
    : (
      options && options.eventRuntimeBindings && typeof options.eventRuntimeBindings === "object"
        ? options.eventRuntimeBindings
        : (master.eventRuntimeBindings && typeof master.eventRuntimeBindings === "object"
          ? master.eventRuntimeBindings
          : Object.create(null))
    );
  const errors = [];

  // Every spellbook spell should have routing metadata during refactor.
  for (const spellId of Object.keys(SPELLS_BY_ID || {})) {
    if (!SPELL_RUNTIME_ROUTING_BY_ID[spellId]) {
      errors.push(`missing routing entry for spellbook spell: ${spellId}`);
    }
  }

  // Wake/class list entries should exist in spellbook.
  for (const idRaw of Array.isArray(WAKE_SPELL_IDS) ? WAKE_SPELL_IDS : []) {
    const id = asId(idRaw);
    if (!SPELLS_BY_ID[id]) errors.push(`WAKE_SPELL_IDS references unknown spell id: ${id}`);
  }
  for (const idRaw of Array.isArray(WAKE_REQUIRED_SPELL_IDS) ? WAKE_REQUIRED_SPELL_IDS : []) {
    const id = asId(idRaw);
    if (!SPELLS_BY_ID[id]) errors.push(`WAKE_REQUIRED_SPELL_IDS references unknown spell id: ${id}`);
  }
  for (const idRaw of Array.isArray(AXIS_SPELL_IDS) ? AXIS_SPELL_IDS : []) {
    const id = asId(idRaw);
    if (!SPELLS_BY_ID[id]) errors.push(`AXIS_SPELL_IDS references unknown spell id: ${id}`);
  }
  for (const idRaw of Array.isArray(WAKE_WINDOW_SPELL_IDS) ? WAKE_WINDOW_SPELL_IDS : []) {
    const id = asId(idRaw);
    if (!SPELLS_BY_ID[id]) errors.push(`WAKE_WINDOW_SPELL_IDS references unknown spell id: ${id}`);
  }
  // Legacy alias check during migration.
  for (const idRaw of Array.isArray(CLASS_SPELL_IDS) ? CLASS_SPELL_IDS : []) {
    const id = asId(idRaw);
    if (!SPELLS_BY_ID[id]) errors.push(`CLASS_SPELL_IDS references unknown spell id: ${id}`);
  }

  // Every rule event action should have both definition and runtime binding.
  for (const rule of Array.isArray(rules) ? rules : []) {
    const ruleId = asId(rule && rule.id) || "(unnamed)";
    const actions = Array.isArray(rule && rule.then) ? rule.then : [];
    for (const action of actions) {
      const type = asId(action && action.type);
      const id = asId(action && action.id);
      if (type === "wake_win") {
        const spells = Array.isArray(action && action.spells) ? action.spells : [];
        for (const spellIdRaw of spells) {
          const spellId = asId(spellIdRaw);
          if (!SPELLS_BY_ID[spellId]) {
            errors.push(`rule ${ruleId} wake_win references unknown spell id: ${spellId}`);
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
