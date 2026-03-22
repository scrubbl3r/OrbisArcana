import { ORCHESTRATOR_V1 } from "./orchestrator-v1.js";
import { WORDBOOK_V2_ACTIVE_WORDS_BY_ID } from "./wordbook-v2.js";

function asId(value) {
  return String(value || "").trim().toLowerCase();
}

function asAxis(value) {
  const token = asId(value);
  return ["x", "y", "z"].includes(token) ? token : "";
}

function asSlot(value) {
  const token = String(value || "").trim().toUpperCase();
  return ["UD", "LR", "FB"].includes(token) ? token : "";
}

function asAxes(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map(asAxis).filter(Boolean)));
}

function asWordRef(value) {
  const token = asId(value).replace(/^word\./, "").replace(/^spell\./, "");
  if (!token) return "";
  return Object.hasOwn(WORDBOOK_V2_ACTIVE_WORDS_BY_ID, token) ? token : "";
}

function asSlotByAxis(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out = Object.create(null);
  for (const axis of ["x", "y", "z"]) {
    const slot = asSlot(value[axis]);
    if (slot) out[axis] = slot;
  }
  return Object.keys(out).length ? Object.freeze(out) : null;
}

function asClearSlotsOnAxis(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out = Object.create(null);
  for (const axis of ["x", "y", "z"]) {
    const slots = Array.isArray(value[axis])
      ? Array.from(new Set(value[axis].map(asSlot).filter(Boolean)))
      : [];
    if (slots.length) out[axis] = Object.freeze(slots);
  }
  return Object.keys(out).length ? Object.freeze(out) : null;
}

function normalizeRoutingEntry(rawEntry) {
  const entry = (rawEntry && typeof rawEntry === "object" && !Array.isArray(rawEntry))
    ? rawEntry
    : Object.create(null);
  const id = asWordRef(entry.id);
  if (!id) return null;
  const out = {
    id,
    intent: String(entry.intent || "").trim(),
  };
  const axisWord = asWordRef(entry.axisWord || entry.axisSpell);
  if (axisWord) {
    out.axisWord = axisWord;
    out.axisSpell = axisWord;
  }
  const wakeWindowWord = asWordRef(entry.wakeWindowWord || entry.wakeWindowSpell);
  if (wakeWindowWord) {
    out.wakeWindowWord = wakeWindowWord;
    out.wakeWindowSpell = wakeWindowWord;
  }
  const allowedAxes = asAxes(entry.allowedAxes);
  if (allowedAxes.length) out.allowedAxes = Object.freeze(allowedAxes);
  const fixedSlot = asSlot(entry.fixedSlot);
  if (fixedSlot) out.fixedSlot = fixedSlot;
  const slotByAxis = asSlotByAxis(entry.slotByAxis);
  if (slotByAxis) out.slotByAxis = slotByAxis;
  const clearSlotsOnAxis = asClearSlotsOnAxis(entry.clearSlotsOnAxis);
  if (clearSlotsOnAxis) out.clearSlotsOnAxis = clearSlotsOnAxis;
  return Object.freeze(out);
}

function resolveWordRouting(orchestrator = ORCHESTRATOR_V1) {
  const routingSection = (orchestrator && orchestrator.routing && typeof orchestrator.routing === "object")
    ? orchestrator.routing
    : Object.create(null);
  const source = Array.isArray(routingSection.words) ? routingSection.words : [];
  const out = [];
  const seen = new Set();
  for (const rawEntry of source) {
    const entry = normalizeRoutingEntry(rawEntry);
    if (!entry) continue;
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    out.push(entry);
  }
  return Object.freeze(out);
}

export const ORCHESTRATOR_V1_WORD_RUNTIME_ROUTING = resolveWordRouting(ORCHESTRATOR_V1);
export const ORCHESTRATOR_V1_WORD_RUNTIME_ROUTING_BY_WORD_ID = Object.freeze(
  ORCHESTRATOR_V1_WORD_RUNTIME_ROUTING.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, Object.create(null))
);
