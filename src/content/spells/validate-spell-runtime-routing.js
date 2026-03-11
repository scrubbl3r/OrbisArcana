import { SPELLS_BY_ID } from "../../voice/spellbook.js";
import {
  collectImmediateEventSpellIdsFromInteractionsV2,
  INTERACTIONS_V2,
} from "../interactions-v2/interactions-v2.js";
import {
  AXIS_WORD_IDS,
  KWS_FLASH_TOKEN_WORD_IDS,
  KWS_INFER_DEFAULT_WORD_ID,
  KWS_ROW_BOTTOM_WORD_IDS,
  KWS_ROW_TOP_WORD_IDS,
  KWS_SIM_WORD_IDS,
  RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS,
  SPELL_RUNTIME_ROUTING,
  WAKE_WINDOW_RUNTIME_KEY_BY_WORD,
  WAKE_WINDOW_WORD_IDS,
  WAKE_REQUIRED_WORD_IDS,
  WAKE_WORD_IDS,
} from "./spell-runtime-routing.js";

const AXES = new Set(["x", "y", "z"]);
const SLOTS = new Set(["UD", "LR", "FB"]);

function asId(v) {
  return String(v || "").trim().toLowerCase();
}

function checkSpellIdList(errors, label, ids) {
  for (const raw of Array.isArray(ids) ? ids : []) {
    const id = asId(raw);
    if (!id) {
      errors.push(`${label} contains empty spell id`);
      continue;
    }
    if (!SPELLS_BY_ID[id]) {
      errors.push(`${label} references unknown spell id: ${id}`);
    }
  }
}

function isAxis(v) {
  return AXES.has(String(v || "").trim().toLowerCase());
}

function isSlot(v) {
  return SLOTS.has(String(v || "").trim().toUpperCase());
}

function collectWakeWinSpellIdsFromInteractionsV2(cfg = INTERACTIONS_V2) {
  const out = new Set();
  const rules = Array.isArray(cfg && cfg.rules) ? cfg.rules : [];
  for (const rule of rules) {
    const actions = Array.isArray(rule && rule.then) ? rule.then : [];
    for (const action of actions) {
      const actionType = String(action && action.type || "").trim().toLowerCase();
      if (actionType !== "wake_win") continue;
      const spells = Array.isArray(action && action.spells) ? action.spells : [];
      for (const rawSpellId of spells) {
        const spellId = asId(rawSpellId).replace(/^spell\./, "");
        if (!spellId) continue;
        out.add(spellId);
      }
    }
  }
  return out;
}

export function validateSpellRuntimeRouting() {
  const errors = [];

  checkSpellIdList(errors, "WAKE_WORD_IDS", WAKE_WORD_IDS);
  checkSpellIdList(errors, "WAKE_REQUIRED_WORD_IDS", WAKE_REQUIRED_WORD_IDS);
  checkSpellIdList(errors, "AXIS_WORD_IDS", AXIS_WORD_IDS);
  checkSpellIdList(errors, "WAKE_WINDOW_WORD_IDS", WAKE_WINDOW_WORD_IDS);
  checkSpellIdList(errors, "KWS_FLASH_TOKEN_WORD_IDS", KWS_FLASH_TOKEN_WORD_IDS);
  checkSpellIdList(errors, "KWS_ROW_TOP_WORD_IDS", KWS_ROW_TOP_WORD_IDS);
  checkSpellIdList(errors, "KWS_ROW_BOTTOM_WORD_IDS", KWS_ROW_BOTTOM_WORD_IDS);
  checkSpellIdList(errors, "KWS_SIM_WORD_IDS", KWS_SIM_WORD_IDS);

  const inferId = asId(KWS_INFER_DEFAULT_WORD_ID);
  if (!inferId) errors.push("KWS_INFER_DEFAULT_WORD_ID is empty");
  else if (!SPELLS_BY_ID[inferId]) errors.push(`KWS_INFER_DEFAULT_WORD_ID references unknown spell id: ${inferId}`);

  const expectedOwnedImmediate = new Set(collectImmediateEventSpellIdsFromInteractionsV2(INTERACTIONS_V2));
  const declaredOwnedImmediate = new Set(
    (Array.isArray(RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS) ? RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS : [])
      .map((id) => asId(id))
      .filter(Boolean)
  );
  const missingOwnedImmediate = Array.from(expectedOwnedImmediate).filter((id) => !declaredOwnedImmediate.has(id)).sort();
  const extraOwnedImmediate = Array.from(declaredOwnedImmediate).filter((id) => !expectedOwnedImmediate.has(id)).sort();
  if (missingOwnedImmediate.length) {
    errors.push(`RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS missing interactions-v2 immediate spell ids: ${missingOwnedImmediate.join(", ")}`);
  }
  if (extraOwnedImmediate.length) {
    errors.push(`RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS has ids not present as interactions-v2 immediate spell rules: ${extraOwnedImmediate.join(", ")}`);
  }

  const expectedWakeWindowSpellIds = collectWakeWinSpellIdsFromInteractionsV2(INTERACTIONS_V2);
  const declaredWakeWindowSpellIds = new Set(
    (Array.isArray(WAKE_WINDOW_WORD_IDS) ? WAKE_WINDOW_WORD_IDS : [])
      .map((id) => asId(id))
      .filter(Boolean)
  );
  const missingWakeWindowSpellIds = Array.from(expectedWakeWindowSpellIds).filter((id) => !declaredWakeWindowSpellIds.has(id)).sort();
  const extraWakeWindowSpellIds = Array.from(declaredWakeWindowSpellIds).filter((id) => !expectedWakeWindowSpellIds.has(id)).sort();
  if (missingWakeWindowSpellIds.length) {
    errors.push(`WAKE_WINDOW_WORD_IDS missing interactions-v2 wake_win spell ids: ${missingWakeWindowSpellIds.join(", ")}`);
  }
  if (extraWakeWindowSpellIds.length) {
    errors.push(`WAKE_WINDOW_WORD_IDS has ids not present in interactions-v2 wake_win actions: ${extraWakeWindowSpellIds.join(", ")}`);
  }

  const runtimeKeyTokens = new Set(
    Object.keys(WAKE_WINDOW_RUNTIME_KEY_BY_WORD || {})
      .map((token) => asId(token))
      .filter(Boolean)
  );
  const missingRuntimeKeyTokens = Array.from(declaredWakeWindowSpellIds).filter((id) => !runtimeKeyTokens.has(id)).sort();
  const extraRuntimeKeyTokens = Array.from(runtimeKeyTokens).filter((id) => !declaredWakeWindowSpellIds.has(id)).sort();
  if (missingRuntimeKeyTokens.length) {
    errors.push(`WAKE_WINDOW_RUNTIME_KEY_BY_WORD missing token keys for wake window spells: ${missingRuntimeKeyTokens.join(", ")}`);
  }
  if (extraRuntimeKeyTokens.length) {
    errors.push(`WAKE_WINDOW_RUNTIME_KEY_BY_WORD has token keys not present in WAKE_WINDOW_WORD_IDS: ${extraRuntimeKeyTokens.join(", ")}`);
  }

  for (const [token, runtimeIdRaw] of Object.entries(WAKE_WINDOW_RUNTIME_KEY_BY_WORD || {})) {
    const runtimeId = asId(runtimeIdRaw);
    if (!runtimeId) {
      errors.push(`WAKE_WINDOW_RUNTIME_KEY_BY_WORD[${token}] has empty runtime id`);
      continue;
    }
    if (!SPELLS_BY_ID[runtimeId]) {
      errors.push(`WAKE_WINDOW_RUNTIME_KEY_BY_WORD[${token}] references unknown spell id: ${runtimeId}`);
    }
  }

  const seenRoutingIds = new Set();
  for (const item of Array.isArray(SPELL_RUNTIME_ROUTING) ? SPELL_RUNTIME_ROUTING : []) {
    const id = asId(item && item.id);
    if (!id) {
      errors.push("SPELL_RUNTIME_ROUTING contains entry with empty id");
      continue;
    }
    if (seenRoutingIds.has(id)) errors.push(`SPELL_RUNTIME_ROUTING duplicate id: ${id}`);
    seenRoutingIds.add(id);

    if (!SPELLS_BY_ID[id]) errors.push(`SPELL_RUNTIME_ROUTING entry references unknown spell id: ${id}`);

    const intent = asId(item && item.intent);
    if (intent === "spell.school_select" || intent === "spell.class_select") {
      errors.push(`SPELL_RUNTIME_ROUTING[${id}] uses legacy intent: ${intent}`);
    }

    if (item && Object.prototype.hasOwnProperty.call(item, "school")) {
      errors.push(`SPELL_RUNTIME_ROUTING[${id}] contains legacy key: school`);
    }
    if (item && Object.prototype.hasOwnProperty.call(item, "classKey")) {
      errors.push(`SPELL_RUNTIME_ROUTING[${id}] contains legacy key: classKey`);
    }

    const allowedAxes = Array.isArray(item && item.allowedAxes) ? item.allowedAxes : [];
    for (const axis of allowedAxes) {
      if (!isAxis(axis)) errors.push(`SPELL_RUNTIME_ROUTING[${id}] has invalid allowed axis: ${axis}`);
    }

    if (item && Object.prototype.hasOwnProperty.call(item, "fixedSlot")) {
      if (!isSlot(item.fixedSlot)) errors.push(`SPELL_RUNTIME_ROUTING[${id}] has invalid fixedSlot: ${item.fixedSlot}`);
    }

    const slotByAxis = (item && typeof item.slotByAxis === "object" && item.slotByAxis) ? item.slotByAxis : null;
    if (slotByAxis) {
      for (const [axis, slot] of Object.entries(slotByAxis)) {
        if (!isAxis(axis)) errors.push(`SPELL_RUNTIME_ROUTING[${id}].slotByAxis has invalid axis key: ${axis}`);
        if (!isSlot(slot)) errors.push(`SPELL_RUNTIME_ROUTING[${id}].slotByAxis[${axis}] has invalid slot: ${slot}`);
      }
    }

    const clearSlotsOnAxis = (item && typeof item.clearSlotsOnAxis === "object" && item.clearSlotsOnAxis)
      ? item.clearSlotsOnAxis
      : null;
    if (clearSlotsOnAxis) {
      for (const [axis, slotsRaw] of Object.entries(clearSlotsOnAxis)) {
        if (!isAxis(axis)) errors.push(`SPELL_RUNTIME_ROUTING[${id}].clearSlotsOnAxis has invalid axis key: ${axis}`);
        const slots = Array.isArray(slotsRaw) ? slotsRaw : [];
        for (const slot of slots) {
          if (!isSlot(slot)) errors.push(`SPELL_RUNTIME_ROUTING[${id}].clearSlotsOnAxis[${axis}] has invalid slot: ${slot}`);
        }
      }
    }
  }

  return errors;
}

export const validateSpellRuntimeRoutingV1 = validateSpellRuntimeRouting;
