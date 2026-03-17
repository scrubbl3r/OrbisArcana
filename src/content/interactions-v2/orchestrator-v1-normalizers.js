export function asObj(v) {
  return (v && typeof v === "object" && !Array.isArray(v)) ? v : {};
}

export function asText(v) {
  if (typeof v === "string") return v.trim();
  if (v == null) return "";
  return `${v}`.trim();
}

export function asId(v) {
  return asText(v).toLowerCase();
}

export function normalizeSpellId(spellIdRaw) {
  const id = asId(spellIdRaw);
  if (!id) return "";
  return id.startsWith("spell.") ? id.slice("spell.".length) : id;
}

export function normalizeEventId(eventIdRaw) {
  const id = asId(eventIdRaw);
  if (!id) return "";
  return id.startsWith("event.") ? id.slice("event.".length) : id;
}

export function normalizeGestureId(gestureIdRaw) {
  const id = asId(gestureIdRaw);
  if (!id) return "";
  const trimmed = id.startsWith("gesture.") ? id.slice("gesture.".length) : id;
  if (trimmed === "x_spin") return "spin_x";
  if (trimmed === "y_spin") return "spin_y";
  if (trimmed === "z_spin") return "spin_z";
  return trimmed;
}

export function normalizeOrbStateId(orbStateIdRaw) {
  const id = asId(orbStateIdRaw);
  if (!id) return "";
  return id.startsWith("orb_state.") ? id.slice("orb_state.".length) : id;
}

export function parseOnSelector(raw, { invalidAsEmptyObject = false } = {}) {
  const text = asText(raw);
  if (!text) return invalidAsEmptyObject ? Object.freeze({ type: "", id: "" }) : null;

  let type = "spell";
  let idText = text;

  const colon = text.indexOf(":");
  const dot = text.indexOf(".");
  if (colon > 0) {
    type = asText(text.slice(0, colon)).toLowerCase();
    idText = asText(text.slice(colon + 1));
  } else if (dot > 0) {
    type = asText(text.slice(0, dot)).toLowerCase();
    idText = text;
  }

  if (type === "spell") return Object.freeze({ type, id: normalizeSpellId(idText) });
  if (type === "gesture") return Object.freeze({ type, id: normalizeGestureId(idText) });
  if (type === "orb_state") return Object.freeze({ type, id: normalizeOrbStateId(idText) });
  return invalidAsEmptyObject ? Object.freeze({ type: "", id: "" }) : null;
}

export function asSelectorList(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") return [raw];
  return [];
}

export function normalizeTriggerEntries(rawTrigger) {
  if (Array.isArray(rawTrigger)) return rawTrigger;
  if (typeof rawTrigger === "string") return [rawTrigger];
  const triggerMap = asObj(rawTrigger);
  if (Object.keys(triggerMap).length) {
    return Object.entries(triggerMap).map(([eventId, spec]) => {
      if (typeof spec === "boolean") {
        return spec
          ? Object.freeze({ event: eventId })
          : Object.freeze({ event: eventId, enabled: false });
      }
      if (spec && typeof spec === "object" && !Array.isArray(spec)) {
        const hasStructuredKeys = Object.prototype.hasOwnProperty.call(spec, "enabled") ||
          Object.prototype.hasOwnProperty.call(spec, "args");
        if (!hasStructuredKeys) return Object.freeze({ event: eventId, args: spec });
        const out = { event: eventId };
        if (Object.prototype.hasOwnProperty.call(spec, "enabled")) out.enabled = spec.enabled;
        const argsValue = asObj(spec.args);
        const argsFromField = Object.keys(argsValue).length
          ? { ...argsValue }
          : {};
        for (const [k, v] of Object.entries(spec)) {
          if (k === "enabled" || k === "args") continue;
          argsFromField[k] = v;
        }
        if (Object.keys(argsFromField).length) out.args = argsFromField;
        return Object.freeze(out);
      }
      return Object.freeze({ event: eventId });
    });
  }
  return [];
}
