export function asObj(v) {
  return (v && typeof v === "object" && !Array.isArray(v)) ? v : {};
}

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function mapDefined(values, mapFn) {
  return asArray(values).map(mapFn).filter(Boolean);
}

export function hasNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

export function requireNonEmptyArray(errors, value, errorMessage) {
  if (hasNonEmptyArray(value)) return true;
  errors.push(errorMessage);
  return false;
}

export function pushBooleanEnabledErrorWhenPresent(
  errors,
  context,
  source,
  label = "enabled"
) {
  const safeSource = asObj(source);
  if (Object.hasOwn(safeSource, "enabled") && typeof safeSource.enabled !== "boolean") {
    errors.push(`${context} ${label} must be boolean when present`);
  }
}

export function validateOptionalObjectSection(source, key, validateSectionFn) {
  const safeSource = asObj(source);
  if (!Object.hasOwn(safeSource, key)) return;
  validateSectionFn(asObj(safeSource[key]));
}

export function asKeySet(values) {
  return values instanceof Set ? values : new Set(values);
}

export function pushUnsupportedKeys(errors, context, obj, allowedKeys) {
  const allowed = asKeySet(allowedKeys);
  for (const key of Object.keys(asObj(obj))) {
    if (!allowed.has(key)) errors.push(`${context} contains unsupported key: ${key}`);
  }
}

export function setEnabledIfBoolean(out, source) {
  const safeSource = asObj(source);
  if (Object.hasOwn(safeSource, "enabled") && typeof safeSource.enabled === "boolean") {
    out.enabled = safeSource.enabled;
  }
}

export function copyOwnKeys(out, source, keys) {
  const safeSource = asObj(source);
  for (const key of keys) {
    if (Object.hasOwn(safeSource, key)) out[key] = safeSource[key];
  }
}

export function asText(v) {
  if (typeof v === "string") return v.trim();
  if (v == null) return "";
  return `${v}`.trim();
}

export function asId(v) {
  return asText(v).toLowerCase();
}

function splitCommaTokens(value) {
  if (typeof value !== "string") return [];
  const text = value.trim();
  if (!text) return [];
  if (!text.includes(",")) return [text];
  return text.split(",").map((part) => part.trim()).filter(Boolean);
}

function expandTokenizedEntries(raw) {
  if (Array.isArray(raw)) {
    const out = [];
    for (const entry of raw) {
      if (typeof entry !== "string") {
        out.push(entry);
        continue;
      }
      out.push(...splitCommaTokens(entry));
    }
    return out;
  }
  if (typeof raw === "string") return splitCommaTokens(raw);
  return null;
}

export function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOwnAny(source, keys) {
  return keys.some((key) => Object.hasOwn(source, key));
}

function normalizePrefixedId(rawValue, prefix) {
  const id = asId(rawValue);
  if (!id) return "";
  return id.startsWith(prefix) ? id.slice(prefix.length) : id;
}

export function normalizeSpellId(spellIdRaw) {
  return normalizePrefixedId(spellIdRaw, "spell.");
}

export function normalizeEventId(eventIdRaw) {
  return normalizePrefixedId(eventIdRaw, "event.");
}

const GESTURE_ID_ALIASES = Object.freeze({
  x_spin: "spin_x",
  y_spin: "spin_y",
  z_spin: "spin_z",
});

export function normalizeGestureId(gestureIdRaw) {
  const trimmed = normalizePrefixedId(gestureIdRaw, "gesture.");
  if (!trimmed) return "";
  return GESTURE_ID_ALIASES[trimmed] || trimmed;
}

export function normalizeOrbStateId(orbStateIdRaw) {
  return normalizePrefixedId(orbStateIdRaw, "orb_state.");
}

export const ON_SELECTOR_SOURCES = Object.freeze([
  Object.freeze({ key: "spell", type: "spell", normalize: normalizeSpellId }),
  Object.freeze({ key: "spells", type: "spell", normalize: normalizeSpellId }),
  Object.freeze({ key: "gesture", type: "gesture", normalize: normalizeGestureId }),
  Object.freeze({ key: "gestures", type: "gesture", normalize: normalizeGestureId }),
  Object.freeze({ key: "orb_state", type: "orb_state", normalize: normalizeOrbStateId }),
  Object.freeze({ key: "orbState", type: "orb_state", normalize: normalizeOrbStateId }),
  Object.freeze({ key: "orbStates", type: "orb_state", normalize: normalizeOrbStateId }),
]);
export const ON_SELECTOR_ALLOWED_KEYS = Object.freeze(
  ON_SELECTOR_SOURCES.map((source) => source.key)
);
export const ORCHESTRATOR_MIN_MATCH_WINDOW_MS = 100;
export const RULE_PRIORITY_KEY = "priority";
export const RULE_PRIORITY_KEYS = Object.freeze([RULE_PRIORITY_KEY]);
export const TRIGGER_SOURCE_KEYS = Object.freeze(["trigger", "triggers"]);
export const OPEN_TTL_KEYS = Object.freeze(["ttlMs", "ttl"]);
export const RULE_COOLDOWN_KEYS = Object.freeze(["cooldownMs", "cooldown"]);
export const RULE_MATCH_WINDOW_KEYS = Object.freeze(["matchWindowMs", "matchWindow"]);

const BARE_GESTURE_IDS = new Set([
  "spin_x",
  "spin_y",
  "spin_z",
  "x_spin",
  "y_spin",
  "z_spin",
  "shake_fb",
  "shake_lr",
  "shake_ud",
]);

const BARE_ORB_STATE_IDS = new Set([
  "charged",
  "superheated",
]);

const SELECTOR_ID_NORMALIZERS = Object.freeze({
  spell: normalizeSpellId,
  gesture: normalizeGestureId,
  orb_state: normalizeOrbStateId,
});
const EMPTY_SELECTOR = Object.freeze({ type: "", id: "" });

function asInvalidSelector(invalidAsEmptyObject) {
  return invalidAsEmptyObject ? EMPTY_SELECTOR : null;
}

function buildStructuredTriggerArgs(spec) {
  const argsValue = asObj(spec.args);
  const mergedArgs = Object.keys(argsValue).length
    ? { ...argsValue }
    : {};
  for (const [k, v] of Object.entries(spec)) {
    if (k === "enabled" || k === "args") continue;
    mergedArgs[k] = v;
  }
  return mergedArgs;
}

function buildBooleanTriggerEntry(eventId, isEnabled) {
  return isEnabled
    ? Object.freeze({ event: eventId })
    : Object.freeze({ event: eventId, enabled: false });
}

function buildObjectTriggerEntry(eventId, spec) {
  const hasStructuredKeys = hasOwnAny(spec, ["enabled", "args"]);
  if (!hasStructuredKeys) return Object.freeze({ event: eventId, args: spec });
  const out = { event: eventId };
  if (Object.hasOwn(spec, "enabled")) out.enabled = spec.enabled;
  const argsFromField = buildStructuredTriggerArgs(spec);
  if (Object.keys(argsFromField).length) out.args = argsFromField;
  return Object.freeze(out);
}

function buildTriggerEntry(eventId, spec) {
  if (typeof spec === "boolean") {
    return buildBooleanTriggerEntry(eventId, spec);
  }
  if (isPlainObject(spec)) {
    return buildObjectTriggerEntry(eventId, spec);
  }
  return Object.freeze({ event: eventId });
}

export function parseOnSelector(raw, { invalidAsEmptyObject = false } = {}) {
  const text = asText(raw);
  if (!text) return asInvalidSelector(invalidAsEmptyObject);

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
  } else {
    const bareId = asId(text);
    if (BARE_GESTURE_IDS.has(bareId)) {
      type = "gesture";
      idText = bareId;
    } else if (BARE_ORB_STATE_IDS.has(bareId)) {
      type = "orb_state";
      idText = bareId;
    }
  }

  if (type === "orbstate" || type === "orb-state") {
    type = "orb_state";
  }

  const normalizeSelectorId = SELECTOR_ID_NORMALIZERS[type];
  if (normalizeSelectorId) return Object.freeze({ type, id: normalizeSelectorId(idText) });
  return asInvalidSelector(invalidAsEmptyObject);
}

export function asSelectorList(raw) {
  return expandTokenizedEntries(raw) || [];
}

export function normalizeIds(values, normalize) {
  return asSelectorList(values).map(normalize).filter(Boolean);
}

export function isStringOrArray(value) {
  return typeof value === "string" || Array.isArray(value);
}

export function asTriggerObject(rawTrigger) {
  return typeof rawTrigger === "string" ? { event: rawTrigger } : asObj(rawTrigger);
}

export function asOpenObject(rawOpen) {
  return isStringOrArray(rawOpen) ? { spells: rawOpen } : asObj(rawOpen);
}

export function normalizeTriggerEntries(rawTrigger) {
  const tokenizedEntries = expandTokenizedEntries(rawTrigger);
  if (tokenizedEntries) return tokenizedEntries;
  const triggerMap = asObj(rawTrigger);
  if (Object.keys(triggerMap).length) {
    return Object.entries(triggerMap).map(([eventId, spec]) =>
      buildTriggerEntry(eventId, spec)
    );
  }
  return [];
}

export function collectRuleTriggerEntries(rule, triggerSourceKeys = TRIGGER_SOURCE_KEYS) {
  return triggerSourceKeys.flatMap((triggerKey) =>
    normalizeTriggerEntries(asObj(rule)[triggerKey])
  );
}

export function getMergedDefaultTriggerEntries(defaults) {
  const source = asObj(defaults);
  return Object.entries({
    ...asObj(source.triggers),
    ...asObj(source.trigger),
  });
}

export function collectOnEntriesFromObjectSelectors(onRaw, { includeRaw = false } = {}) {
  const on = asObj(onRaw);
  const onEntries = [];
  for (const source of ON_SELECTOR_SOURCES) {
    if (!Object.hasOwn(on, source.key)) continue;
    for (const value of asSelectorList(on[source.key])) {
      for (const id of normalizeIds(value, source.normalize)) {
        const entry = { type: source.type, id };
        if (includeRaw) entry.raw = value;
        onEntries.push(entry);
      }
    }
  }
  return onEntries;
}

export function parseOnSelectorList(raw, { invalidAsEmptyObject = false } = {}) {
  return asSelectorList(raw).map((entry) =>
    parseOnSelector(entry, { invalidAsEmptyObject })
  );
}
