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

const FIELD_ENABLED = "enabled";
const FIELD_ARGS = "args";
const FIELD_EVENT = "event";
const FIELD_SPELLS = "spells";
const FIELD_TTL_MS = "ttlMs";
const FIELD_PRIORITY = "priority";
const FIELD_TYPE = "type";
const FIELD_ID = "id";
const KEY_TRIGGER = "trigger";
const KEY_TRIGGERS = "triggers";
const KEY_GESTURES = "gestures";
const KEY_ORB_STATE = "orbState";
const KEY_ORB_STATES = "orbStates";
const KEY_TTL = "ttl";
const KEY_COOLDOWN_MS = "cooldownMs";
const KEY_COOLDOWN = "cooldown";
const KEY_MATCH_WINDOW_MS = "matchWindowMs";
const KEY_MATCH_WINDOW = "matchWindow";
const TYPE_ORBSTATE_ALIAS = "orbstate";
const TYPE_ORB_STATE_ALIAS = "orb-state";
const EMPTY_ARRAY = Object.freeze([]);

export function pushBooleanEnabledErrorWhenPresent(
  errors,
  context,
  source,
  label = FIELD_ENABLED
) {
  const safeSource = asObj(source);
  if (Object.hasOwn(safeSource, FIELD_ENABLED) && typeof safeSource[FIELD_ENABLED] !== "boolean") {
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
  if (Object.hasOwn(safeSource, FIELD_ENABLED) && typeof safeSource[FIELD_ENABLED] === "boolean") {
    out[FIELD_ENABLED] = safeSource[FIELD_ENABLED];
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

export function finiteOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function finiteAtLeastOrNull(value, min) {
  const n = finiteOrNull(value);
  return n == null ? null : Math.max(min, n);
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

const PREFIX_SPELL = "spell.";
const PREFIX_EVENT = "event.";
const PREFIX_GESTURE = "gesture.";
const PREFIX_ORB_STATE = "orb_state.";
const TYPE_SPELL = "spell";
const TYPE_GESTURE = "gesture";
const TYPE_ORB_STATE = "orb_state";

export function normalizeSpellId(spellIdRaw) {
  return normalizePrefixedId(spellIdRaw, PREFIX_SPELL);
}

export function normalizeEventId(eventIdRaw) {
  return normalizePrefixedId(eventIdRaw, PREFIX_EVENT);
}

const GESTURE_ID_ALIASES = Object.freeze({
  x_spin: "spin_x",
  y_spin: "spin_y",
  z_spin: "spin_z",
});

export function normalizeGestureId(gestureIdRaw) {
  const trimmed = normalizePrefixedId(gestureIdRaw, PREFIX_GESTURE);
  if (!trimmed) return "";
  return GESTURE_ID_ALIASES[trimmed] || trimmed;
}

export function normalizeOrbStateId(orbStateIdRaw) {
  return normalizePrefixedId(orbStateIdRaw, PREFIX_ORB_STATE);
}

export const ON_SELECTOR_SOURCES = Object.freeze([
  Object.freeze({ key: TYPE_SPELL, [FIELD_TYPE]: TYPE_SPELL, normalize: normalizeSpellId }),
  Object.freeze({ key: FIELD_SPELLS, [FIELD_TYPE]: TYPE_SPELL, normalize: normalizeSpellId }),
  Object.freeze({ key: TYPE_GESTURE, [FIELD_TYPE]: TYPE_GESTURE, normalize: normalizeGestureId }),
  Object.freeze({ key: KEY_GESTURES, [FIELD_TYPE]: TYPE_GESTURE, normalize: normalizeGestureId }),
  Object.freeze({ key: TYPE_ORB_STATE, [FIELD_TYPE]: TYPE_ORB_STATE, normalize: normalizeOrbStateId }),
  Object.freeze({ key: KEY_ORB_STATE, [FIELD_TYPE]: TYPE_ORB_STATE, normalize: normalizeOrbStateId }),
  Object.freeze({ key: KEY_ORB_STATES, [FIELD_TYPE]: TYPE_ORB_STATE, normalize: normalizeOrbStateId }),
]);
export const ON_SELECTOR_ALLOWED_KEYS = Object.freeze(
  ON_SELECTOR_SOURCES.map((source) => source.key)
);
export const ORCHESTRATOR_MIN_MATCH_WINDOW_MS = 100;
export const RULE_PRIORITY_KEY = FIELD_PRIORITY;
export const RULE_PRIORITY_KEYS = Object.freeze([RULE_PRIORITY_KEY]);
export const TRIGGER_SOURCE_KEYS = Object.freeze([KEY_TRIGGER, KEY_TRIGGERS]);
export const OPEN_TTL_KEYS = Object.freeze([FIELD_TTL_MS, KEY_TTL]);
export const RULE_COOLDOWN_KEYS = Object.freeze([KEY_COOLDOWN_MS, KEY_COOLDOWN]);
export const RULE_MATCH_WINDOW_KEYS = Object.freeze([KEY_MATCH_WINDOW_MS, KEY_MATCH_WINDOW]);

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
  [TYPE_SPELL]: normalizeSpellId,
  [TYPE_GESTURE]: normalizeGestureId,
  [TYPE_ORB_STATE]: normalizeOrbStateId,
});
const EMPTY_SELECTOR = Object.freeze({ [FIELD_TYPE]: "", [FIELD_ID]: "" });

function makeFrozenSelector(type, id) {
  return Object.freeze({ [FIELD_TYPE]: type, [FIELD_ID]: id });
}

function buildStructuredTriggerArgs(spec) {
  const argsValue = asObj(spec[FIELD_ARGS]);
  const mergedArgs = Object.keys(argsValue).length ? { ...argsValue } : {};
  for (const [k, v] of Object.entries(spec)) {
    if (k === FIELD_ENABLED || k === FIELD_ARGS) continue;
    mergedArgs[k] = v;
  }
  return mergedArgs;
}

function makeEventTrigger(eventId, { enabled, args } = {}) {
  const out = { [FIELD_EVENT]: eventId };
  if (typeof enabled === "boolean") out[FIELD_ENABLED] = enabled;
  if (isPlainObject(args) && Object.keys(args).length) out[FIELD_ARGS] = args;
  return Object.freeze(out);
}

function buildTriggerEntry(eventId, spec) {
  if (typeof spec === "boolean") {
    return spec
      ? makeEventTrigger(eventId)
      : makeEventTrigger(eventId, { enabled: false });
  }
  if (isPlainObject(spec)) {
    const hasStructuredKeys = hasOwnAny(spec, [FIELD_ENABLED, FIELD_ARGS]);
    if (!hasStructuredKeys) return makeEventTrigger(eventId, { args: spec });
    const out = { [FIELD_EVENT]: eventId };
    if (Object.hasOwn(spec, FIELD_ENABLED)) out[FIELD_ENABLED] = spec[FIELD_ENABLED];
    const argsFromField = buildStructuredTriggerArgs(spec);
    if (Object.keys(argsFromField).length) out[FIELD_ARGS] = argsFromField;
    return Object.freeze(out);
  }
  return makeEventTrigger(eventId);
}

function normalizeSelectorType(typeRaw) {
  if (typeRaw === TYPE_ORBSTATE_ALIAS || typeRaw === TYPE_ORB_STATE_ALIAS) {
    return TYPE_ORB_STATE;
  }
  return typeRaw;
}

function resolveBareSelectorTypeAndId(text) {
  const bareId = asId(text);
  if (BARE_GESTURE_IDS.has(bareId)) {
    return makeFrozenSelector(TYPE_GESTURE, bareId);
  }
  if (BARE_ORB_STATE_IDS.has(bareId)) {
    return makeFrozenSelector(TYPE_ORB_STATE, bareId);
  }
  return makeFrozenSelector(TYPE_SPELL, text);
}

export function parseOnSelector(raw, { invalidAsEmptyObject = false } = {}) {
  const text = asText(raw);
  if (!text) return invalidAsEmptyObject ? EMPTY_SELECTOR : null;

  let { [FIELD_TYPE]: type, [FIELD_ID]: idText } = resolveBareSelectorTypeAndId(text);

  const colon = text.indexOf(":");
  const dot = text.indexOf(".");
  if (colon > 0) {
    type = asText(text.slice(0, colon)).toLowerCase();
    idText = asText(text.slice(colon + 1));
  } else if (dot > 0) {
    type = asText(text.slice(0, dot)).toLowerCase();
    idText = text;
  }

  type = normalizeSelectorType(type);

  const normalizeSelectorId = SELECTOR_ID_NORMALIZERS[type];
  if (normalizeSelectorId) {
    return makeFrozenSelector(type, normalizeSelectorId(idText));
  }
  return invalidAsEmptyObject ? EMPTY_SELECTOR : null;
}

export function asSelectorList(raw) {
  return expandTokenizedEntries(raw) || EMPTY_ARRAY;
}

export function normalizeIds(values, normalize) {
  return asSelectorList(values).map(normalize).filter(Boolean);
}

export function isStringOrArray(value) {
  return typeof value === "string" || Array.isArray(value);
}

export function asTriggerObject(rawTrigger) {
  return typeof rawTrigger === "string" ? { [FIELD_EVENT]: rawTrigger } : asObj(rawTrigger);
}

export function asOpenObject(rawOpen) {
  return isStringOrArray(rawOpen) ? { [FIELD_SPELLS]: rawOpen } : asObj(rawOpen);
}

function hasObjectKeys(value) {
  return Object.keys(asObj(value)).length > 0;
}

function buildTriggerEntriesFromMap(triggerMap) {
  return Object.entries(asObj(triggerMap)).map(([eventId, spec]) =>
    buildTriggerEntry(eventId, spec)
  );
}

function getMergedTriggerMap(source) {
  const safeSource = asObj(source);
  return {
    ...asObj(safeSource[KEY_TRIGGERS]),
    ...asObj(safeSource[KEY_TRIGGER]),
  };
}

export function normalizeTriggerEntries(rawTrigger) {
  const tokenizedEntries = expandTokenizedEntries(rawTrigger);
  if (tokenizedEntries) return tokenizedEntries;
  const triggerMap = asObj(rawTrigger);
  if (hasObjectKeys(triggerMap)) {
    return buildTriggerEntriesFromMap(triggerMap);
  }
  return EMPTY_ARRAY;
}

export function collectRuleTriggerEntries(rule, triggerSourceKeys = TRIGGER_SOURCE_KEYS) {
  const safeRule = asObj(rule);
  return triggerSourceKeys.flatMap((triggerKey) =>
    normalizeTriggerEntries(safeRule[triggerKey])
  );
}

export function getMergedDefaultTriggerEntries(defaults) {
  return Object.entries(getMergedTriggerMap(defaults));
}

export function collectOnEntriesFromObjectSelectors(onRaw, { includeRaw = false } = {}) {
  const on = asObj(onRaw);
  const onEntries = [];
  for (const source of ON_SELECTOR_SOURCES) {
    if (!Object.hasOwn(on, source.key)) continue;
    for (const value of asSelectorList(on[source.key])) {
      const id = source.normalize(value);
      if (!id) continue;
      const entry = { [FIELD_TYPE]: source[FIELD_TYPE], [FIELD_ID]: id };
      if (includeRaw) entry.raw = value;
      onEntries.push(entry);
    }
  }
  return onEntries;
}

export function parseOnSelectorList(raw, { invalidAsEmptyObject = false } = {}) {
  return asSelectorList(raw).map((entry) =>
    parseOnSelector(entry, { invalidAsEmptyObject })
  );
}
