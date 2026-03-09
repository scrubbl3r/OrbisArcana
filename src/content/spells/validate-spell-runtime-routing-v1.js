import { SPELLS_BY_ID } from "../../voice/spellbook.js";
import {
  AXIS_SPELL_IDS,
  KWS_FLASH_TOKEN_SPELL_IDS,
  KWS_INFER_DEFAULT_SPELL_ID,
  KWS_ROW_BOTTOM_SPELL_IDS,
  KWS_ROW_TOP_SPELL_IDS,
  KWS_SIM_SPELL_IDS,
  SPELL_RUNTIME_ROUTING,
  WAKE_WINDOW_RUNTIME_KEY_BY_TOKEN,
  WAKE_WINDOW_SPELL_IDS,
  WAKE_REQUIRED_SPELL_IDS,
  WAKE_SPELL_IDS,
} from "./spell-runtime-routing-v1.js";

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

export function validateSpellRuntimeRoutingV1() {
  const errors = [];

  checkSpellIdList(errors, "WAKE_SPELL_IDS", WAKE_SPELL_IDS);
  checkSpellIdList(errors, "WAKE_REQUIRED_SPELL_IDS", WAKE_REQUIRED_SPELL_IDS);
  checkSpellIdList(errors, "AXIS_SPELL_IDS", AXIS_SPELL_IDS);
  checkSpellIdList(errors, "WAKE_WINDOW_SPELL_IDS", WAKE_WINDOW_SPELL_IDS);
  checkSpellIdList(errors, "KWS_FLASH_TOKEN_SPELL_IDS", KWS_FLASH_TOKEN_SPELL_IDS);
  checkSpellIdList(errors, "KWS_ROW_TOP_SPELL_IDS", KWS_ROW_TOP_SPELL_IDS);
  checkSpellIdList(errors, "KWS_ROW_BOTTOM_SPELL_IDS", KWS_ROW_BOTTOM_SPELL_IDS);
  checkSpellIdList(errors, "KWS_SIM_SPELL_IDS", KWS_SIM_SPELL_IDS);

  const inferId = asId(KWS_INFER_DEFAULT_SPELL_ID);
  if (!inferId) errors.push("KWS_INFER_DEFAULT_SPELL_ID is empty");
  else if (!SPELLS_BY_ID[inferId]) errors.push(`KWS_INFER_DEFAULT_SPELL_ID references unknown spell id: ${inferId}`);

  for (const [token, runtimeIdRaw] of Object.entries(WAKE_WINDOW_RUNTIME_KEY_BY_TOKEN || {})) {
    const runtimeId = asId(runtimeIdRaw);
    if (!runtimeId) {
      errors.push(`WAKE_WINDOW_RUNTIME_KEY_BY_TOKEN[${token}] has empty runtime id`);
      continue;
    }
    if (!SPELLS_BY_ID[runtimeId]) {
      errors.push(`WAKE_WINDOW_RUNTIME_KEY_BY_TOKEN[${token}] references unknown spell id: ${runtimeId}`);
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
