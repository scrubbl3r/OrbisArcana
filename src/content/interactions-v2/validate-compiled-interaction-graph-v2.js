import { WORDBOOK_V2_ACTIVE_WORDS_BY_ID } from "./wordbook-v2.js?v=20260328b";
import { EVENT_DEFINITIONS_BY_ID } from "../spell-rules/event-definitions.js";
import { SIGNAL_DEFINITIONS_BY_ID } from "../spell-rules/signal-definitions.js";
import {
  asObj,
  asSelectorList,
  asText,
  isPlainObject,
  normalizeEventId,
  normalizeShakeId,
  normalizeSpinId,
  normalizeSpellId,
  pushBooleanEnabledErrorWhenPresent,
  pushUnsupportedKeys,
  requireNonEmptyArray,
  isStringOrArray,
  validateOptionalObjectSection,
} from "./interactions-v2-normalizers.js";

const ROOT_CONTEXT = "COMPILED_INTERACTION_GRAPH_V2";
const DEFAULTS_CONTEXT = `${ROOT_CONTEXT}.defaults`;
const GROUPS_CONTEXT = `${ROOT_CONTEXT}.groups`;
const WAKE_CONTEXT = `${ROOT_CONTEXT}.wake`;

const MIN_MATCH_WINDOW_MS = 100;
const ID_RE = /^[A-Za-z0-9_.@-]+$/;

const SIGNAL_DEFS = ((typeof SIGNAL_DEFINITIONS_BY_ID === "object" && SIGNAL_DEFINITIONS_BY_ID)
  ? SIGNAL_DEFINITIONS_BY_ID
  : {});

const KNOWN_SPIN_IDS = new Set(
  Object.keys(SIGNAL_DEFS)
    .filter((id) => typeof id === "string" && id.startsWith("spin."))
    .map((id) => id.slice("spin.".length))
    .filter(Boolean)
);

const KNOWN_SHAKE_IDS = new Set(
  Object.keys(SIGNAL_DEFS)
    .filter((id) => typeof id === "string" && id.startsWith("shake."))
    .map((id) => id.slice("shake.".length))
    .filter(Boolean)
);

const KNOWN_ORB_STATE_IDS = new Set(
  Object.keys(SIGNAL_DEFS)
    .filter((id) => typeof id === "string" && id.startsWith("orb_state."))
    .map((id) => id.slice("orb_state.".length))
    .filter(Boolean)
);

function asArray(v) {
  return Array.isArray(v) ? v : [];
}

function asNonNegativeFiniteOrNull(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function asFiniteOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pushDuplicateWhenSeen(errors, seen, key, msg) {
  if (seen.has(key)) {
    errors.push(msg);
    return true;
  }
  seen.add(key);
  return false;
}

function parseStringOrArray(raw) {
  return asSelectorList(raw)
    .map((v) => asText(v))
    .filter(Boolean);
}

function validateNumericWhenPresent(errors, context, obj, key, isValid, suffix) {
  if (!Object.hasOwn(asObj(obj), key)) return;
  const n = Number(obj[key]);
  if (!isValid(n)) errors.push(`${context}.${key} ${suffix}`);
}

function normalizeWordId(raw) {
  return normalizeSpellId(raw);
}

function validateDefaults(defaultsRaw, errors) {
  const defaults = asObj(defaultsRaw);
  pushUnsupportedKeys(errors, DEFAULTS_CONTEXT, defaults, new Set(["open", "rule", "trigger"]));
  if (Object.hasOwn(defaults, "open") && !isPlainObject(defaults.open)) {
    errors.push(`${DEFAULTS_CONTEXT}.open must be an object when present`);
  }
  if (Object.hasOwn(defaults, "rule") && !isPlainObject(defaults.rule)) {
    errors.push(`${DEFAULTS_CONTEXT}.rule must be an object when present`);
  }
  if (Object.hasOwn(defaults, "trigger") && !isPlainObject(defaults.trigger)) {
    errors.push(`${DEFAULTS_CONTEXT}.trigger must be an object when present`);
  }

  validateOptionalObjectSection(defaults, "open", (openDefaults) => {
    const ctx = `${DEFAULTS_CONTEXT}.open`;
    pushUnsupportedKeys(errors, ctx, openDefaults, new Set(["ttlMs"]));
    validateNumericWhenPresent(
      errors,
      ctx,
      openDefaults,
      "ttlMs",
      (n) => Number.isFinite(n) && n >= 0,
      "must be a finite number >= 0 when present"
    );
  });

  validateOptionalObjectSection(defaults, "rule", (ruleDefaults) => {
    const ctx = `${DEFAULTS_CONTEXT}.rule`;
    pushUnsupportedKeys(errors, ctx, ruleDefaults, new Set(["cooldownMs", "matchWindowMs", "priority"]));
    validateNumericWhenPresent(
      errors,
      ctx,
      ruleDefaults,
      "cooldownMs",
      (n) => Number.isFinite(n) && n >= 0,
      "must be a finite number >= 0 when present"
    );
    validateNumericWhenPresent(
      errors,
      ctx,
      ruleDefaults,
      "matchWindowMs",
      (n) => Number.isFinite(n) && n >= MIN_MATCH_WINDOW_MS,
      `must be a finite number >= ${MIN_MATCH_WINDOW_MS} when present`
    );
    validateNumericWhenPresent(
      errors,
      ctx,
      ruleDefaults,
      "priority",
      Number.isFinite,
      "must be a finite number when present"
    );
  });

  validateOptionalObjectSection(defaults, "trigger", (triggerDefaults) => {
    const ctx = `${DEFAULTS_CONTEXT}.trigger`;
    const seenEventIds = new Set();
    for (const [eventIdRaw, argsRaw] of Object.entries(triggerDefaults)) {
      if (typeof eventIdRaw === "string" && eventIdRaw !== eventIdRaw.trim()) {
        errors.push(`${ctx} contains event id key with leading/trailing whitespace: ${eventIdRaw}`);
        continue;
      }
      const eventId = normalizeEventId(eventIdRaw);
      if (!eventId) {
        errors.push(`${ctx} contains invalid event id key: ${eventIdRaw}`);
        continue;
      }
      pushDuplicateWhenSeen(
        errors,
        seenEventIds,
        eventId,
        `${ctx} contains duplicate normalized event id: ${eventId}`
      );
      if (!Object.hasOwn(EVENT_DEFINITIONS_BY_ID, eventId)) {
        errors.push(`${ctx} references unknown event id: ${eventIdRaw}`);
      }
      if (!isPlainObject(argsRaw)) {
        errors.push(`${ctx}[${eventIdRaw}] must be an object`);
        continue;
      }
      if (Object.hasOwn(argsRaw, "enabled") && typeof argsRaw.enabled !== "boolean") {
        errors.push(`${ctx}[${eventIdRaw}].enabled must be boolean when present`);
      }
    }
  });
}

function validateGroups(groupsRaw, errors) {
  const groups = asObj(groupsRaw);
  for (const [groupNameRaw, wordsRaw] of Object.entries(groups)) {
    const groupName = asText(groupNameRaw);
    const ctx = `${GROUPS_CONTEXT}.${groupName || "(empty)"}`;
    if (!groupName) {
      errors.push(`${GROUPS_CONTEXT} contains empty group key`);
      continue;
    }
    if (groupNameRaw !== groupNameRaw.trim()) {
      errors.push(`${GROUPS_CONTEXT} key must not include leading/trailing whitespace: ${groupNameRaw}`);
    }
    if (!ID_RE.test(groupName)) {
      errors.push(`${GROUPS_CONTEXT} key has invalid shape: ${groupName}`);
    }
    if (!Array.isArray(wordsRaw) || !wordsRaw.length) {
      errors.push(`${ctx} must be a non-empty array`);
      continue;
    }
    const seen = new Set();
    for (const wordRaw of wordsRaw) {
      if (typeof wordRaw !== "string") {
        errors.push(`${ctx} contains non-string word id: ${asText(wordRaw) || "(empty)"}`);
        continue;
      }
      if (wordRaw !== wordRaw.trim()) {
        errors.push(`${ctx} contains word id with leading/trailing whitespace: ${wordRaw}`);
      }
      const normalizedWordId = normalizeWordId(wordRaw);
      if (!normalizedWordId) {
        errors.push(`${ctx} contains invalid word id: ${asText(wordRaw) || "(empty)"}`);
        continue;
      }
      if (!ID_RE.test(normalizedWordId)) {
        errors.push(`${ctx} contains invalid word id shape: ${asText(wordRaw) || "(empty)"}`);
        continue;
      }
      pushDuplicateWhenSeen(errors, seen, normalizedWordId, `${ctx} contains duplicate word id: ${normalizedWordId}`);
      if (!Object.hasOwn(WORDBOOK_V2_ACTIVE_WORDS_BY_ID, normalizedWordId)) {
        errors.push(`${ctx} references unknown/inactive word id: ${normalizedWordId}`);
      }
    }
  }
}

function validateWake(wakeRaw, errors, warnings) {
  const wakeShapeOk = (
    wakeRaw == null
    || typeof wakeRaw === "string"
    || Array.isArray(wakeRaw)
    || isPlainObject(wakeRaw)
  );
  if (!wakeShapeOk) {
    errors.push(`${WAKE_CONTEXT} must be a string, array, or object when present`);
    return;
  }
  if (wakeRaw == null) return;

  let wakeWordsRaw = wakeRaw;
  if (isPlainObject(wakeRaw)) {
    const wake = asObj(wakeRaw);
    pushUnsupportedKeys(errors, WAKE_CONTEXT, wake, new Set(["words", "spells", "enabled", "ttlMs"]));
    pushBooleanEnabledErrorWhenPresent(errors, WAKE_CONTEXT, wake);
    if (Object.hasOwn(wake, "words") && !isStringOrArray(wake.words)) {
      errors.push(`${WAKE_CONTEXT}.words must be a string or array when present`);
    }
    if (Object.hasOwn(wake, "spells")) {
      if (!isStringOrArray(wake.spells)) {
        errors.push(`${WAKE_CONTEXT}.spells must be a string or array when present`);
      } else {
        warnings.push(`${WAKE_CONTEXT}.spells alias is deprecated; prefer ${WAKE_CONTEXT}.words`);
      }
    }
    validateNumericWhenPresent(
      errors,
      WAKE_CONTEXT,
      wake,
      "ttlMs",
      (n) => Number.isFinite(n) && n >= 0,
      "must be a finite number >= 0 when present"
    );
    wakeWordsRaw = Object.hasOwn(wake, "words") ? wake.words : wake.spells;
  }

  const rawValues = asSelectorList(wakeWordsRaw);
  if (!rawValues.length) {
    // Keep message text stable for existing validator contract checks.
    errors.push(`${WAKE_CONTEXT} must define at least one wake word`);
    return;
  }

  const seen = new Set();
  for (const rawValue of rawValues) {
    if (typeof rawValue !== "string") {
      errors.push(`${WAKE_CONTEXT} contains non-string word id: ${asText(rawValue) || "(empty)"}`);
      continue;
    }
    if (rawValue !== rawValue.trim()) {
      errors.push(`${WAKE_CONTEXT} contains word id with leading/trailing whitespace: ${rawValue}`);
    }
    const normalizedWordId = normalizeWordId(rawValue);
    if (!normalizedWordId) {
      errors.push(`${WAKE_CONTEXT} contains invalid word id: ${asText(rawValue) || "(empty)"}`);
      continue;
    }
    if (!ID_RE.test(normalizedWordId)) {
      errors.push(`${WAKE_CONTEXT} contains invalid word id shape: ${asText(rawValue) || "(empty)"}`);
      continue;
    }
    pushDuplicateWhenSeen(errors, seen, normalizedWordId, `${WAKE_CONTEXT} contains duplicate word id: ${normalizedWordId}`);
    if (!Object.hasOwn(WORDBOOK_V2_ACTIVE_WORDS_BY_ID, normalizedWordId)) {
      errors.push(`${WAKE_CONTEXT} references unknown/inactive word id: ${normalizedWordId}`);
    }
  }
}

function validateOnSelectors(rule, ruleId, errors, warnings) {
  const on = asObj(rule.on);
  const onContext = `rule ${ruleId} on`;
  pushUnsupportedKeys(errors, onContext, on, new Set(["word", "spell", "spin", "shake", "orb_state"]));

  if (Object.hasOwn(on, "word") && !isStringOrArray(on.word)) {
    errors.push(`${onContext}.word must be a string or array when present`);
  }
  if (Object.hasOwn(on, "spell") && !isStringOrArray(on.spell)) {
    errors.push(`${onContext}.spell must be a string or array when present`);
  }
  if (Object.hasOwn(on, "spin") && !isStringOrArray(on.spin)) {
    errors.push(`${onContext}.spin must be a string or array when present`);
  }
  if (Object.hasOwn(on, "shake") && !isStringOrArray(on.shake)) {
    errors.push(`${onContext}.shake must be a string or array when present`);
  }
  if (Object.hasOwn(on, "orb_state") && !isStringOrArray(on.orb_state)) {
    errors.push(`${onContext}.orb_state must be a string or array when present`);
  }
  for (const key of ["word", "spin", "shake", "orb_state"]) {
    if (typeof on[key] === "string" && on[key] !== on[key].trim()) {
      errors.push(`${onContext}.${key} contains selector id with leading/trailing whitespace: ${on[key]}`);
    }
    if (Array.isArray(on[key])) {
      for (const rawEntry of on[key]) {
        if (typeof rawEntry === "string" && rawEntry !== rawEntry.trim()) {
          errors.push(`${onContext}.${key} contains selector id with leading/trailing whitespace: ${rawEntry}`);
        }
      }
    }
  }
  if (Object.hasOwn(on, "spell")) {
    if (typeof on.spell === "string" && on.spell !== on.spell.trim()) {
      errors.push(`${onContext}.spell contains selector id with leading/trailing whitespace: ${on.spell}`);
    }
    for (const rawValue of asSelectorList(on.spell)) {
      if (typeof rawValue !== "string") {
        errors.push(`${onContext}.spell contains non-string selector id: ${asText(rawValue) || "(empty)"}`);
      }
    }
    if (Array.isArray(on.spell)) {
      for (const rawEntry of on.spell) {
        if (typeof rawEntry === "string" && rawEntry !== rawEntry.trim()) {
          errors.push(`${onContext}.spell contains selector id with leading/trailing whitespace: ${rawEntry}`);
        }
      }
    }
  }

  const selectorEntries = [];
  const parseAndPush = (kind, raw) => {
    for (const rawValue of asSelectorList(raw)) {
      if (typeof rawValue !== "string") {
        errors.push(`${onContext}.${kind} contains non-string selector id: ${asText(rawValue) || "(empty)"}`);
        continue;
      }
      const value = asText(rawValue);
      if (!value) continue;
      selectorEntries.push({ kind, value });
    }
  };

  const hasOnWord = Object.hasOwn(on, "word");
  parseAndPush("word", on.word);
  if (Object.hasOwn(on, "spell")) {
    warnings.push(`rule ${ruleId} uses on.spell alias; prefer on.word`);
    if (!hasOnWord) {
      parseAndPush("word", on.spell);
    }
  }
  parseAndPush("spin", on.spin);
  parseAndPush("shake", on.shake);
  parseAndPush("orb_state", on.orb_state);

  if (!requireNonEmptyArray(errors, selectorEntries, `rule ${ruleId} must define on selectors`)) {
    return;
  }

  const seen = new Set();
  for (const entry of selectorEntries) {
    if (entry.kind === "word") {
      const id = normalizeWordId(entry.value);
      if (!id) {
        errors.push(`rule ${ruleId} has invalid on.word id: ${entry.value || "(empty)"}`);
        continue;
      }
      if (!ID_RE.test(id)) {
        errors.push(`rule ${ruleId} has invalid on.word id shape: ${entry.value}`);
      }
      const dedupeKey = `word:${id}`;
      pushDuplicateWhenSeen(errors, seen, dedupeKey, `rule ${ruleId} contains duplicate on selector: ${dedupeKey}`);
      if (!Object.hasOwn(WORDBOOK_V2_ACTIVE_WORDS_BY_ID, id)) {
        errors.push(`rule ${ruleId} references unknown/inactive word id: ${entry.value}`);
      }
      continue;
    }

    if (entry.kind === "spin") {
      const id = normalizeSpinId(entry.value);
      if (!id) {
        errors.push(`rule ${ruleId} has invalid on.spin id: ${entry.value || "(empty)"}`);
        continue;
      }
      const dedupeKey = `spin:${id}`;
      pushDuplicateWhenSeen(errors, seen, dedupeKey, `rule ${ruleId} contains duplicate on selector: ${dedupeKey}`);
      if (!KNOWN_SPIN_IDS.has(id)) {
        errors.push(`rule ${ruleId} references unknown spin id: ${entry.value}`);
      }
      continue;
    }

    if (entry.kind === "shake") {
      const id = normalizeShakeId(entry.value);
      if (!id) {
        errors.push(`rule ${ruleId} has invalid on.shake id: ${entry.value || "(empty)"}`);
        continue;
      }
      const dedupeKey = `shake:${id}`;
      pushDuplicateWhenSeen(errors, seen, dedupeKey, `rule ${ruleId} contains duplicate on selector: ${dedupeKey}`);
      if (!KNOWN_SHAKE_IDS.has(id)) {
        errors.push(`rule ${ruleId} references unknown shake id: ${entry.value}`);
      }
      continue;
    }

    if (entry.kind === "orb_state") {
      const id = asText(entry.value).toLowerCase();
      if (!id) {
        errors.push(`rule ${ruleId} has invalid on.orb_state id: ${entry.value || "(empty)"}`);
        continue;
      }
      const dedupeKey = `orb_state:${id}`;
      pushDuplicateWhenSeen(errors, seen, dedupeKey, `rule ${ruleId} contains duplicate on selector: ${dedupeKey}`);
      if (!KNOWN_ORB_STATE_IDS.has(id)) {
        errors.push(`rule ${ruleId} references unknown orb_state id: ${entry.value}`);
      }
    }
  }
}

function expandOpenWords(wordsRaw, groups, ruleId, errors) {
  const values = asSelectorList(wordsRaw);
  const out = [];
  for (const rawToken of values) {
    if (typeof rawToken !== "string") {
      errors.push(`rule ${ruleId} open contains non-string word id: ${asText(rawToken) || "(empty)"}`);
      continue;
    }
    const trimmed = asText(rawToken);
    if (!trimmed) continue;
    if (trimmed.startsWith("@")) {
      const groupNameRaw = trimmed.slice(1);
      if (!groupNameRaw) {
        errors.push(`rule ${ruleId} open.words group ref must include a name: ${trimmed}`);
        continue;
      }
      if (groupNameRaw !== groupNameRaw.trim()) {
        errors.push(`rule ${ruleId} open.words group ref must not include leading/trailing whitespace after @: ${trimmed}`);
        continue;
      }
      const groupName = groupNameRaw;
      if (!ID_RE.test(groupName)) {
        errors.push(`rule ${ruleId} open.words group ref has invalid shape: ${trimmed}`);
        continue;
      }
      const groupWords = asArray(groups[groupName]);
      if (!groupWords.length) {
        errors.push(`rule ${ruleId} open.words references unknown or empty group: ${trimmed}`);
        continue;
      }
      for (const groupWord of groupWords) out.push(asText(groupWord));
      continue;
    }
    out.push(trimmed);
  }
  return out;
}

function validateOpen(rule, ruleId, groups, openWindowIds, errors, warnings) {
  if (!Object.hasOwn(rule, "open")) return false;
  const open = asObj(rule.open);
  const ctx = `rule ${ruleId} open`;
  pushUnsupportedKeys(errors, ctx, open, new Set(["id", "words", "spells", "ttlMs", "enabled"]));
  pushBooleanEnabledErrorWhenPresent(errors, ctx, open);

  const openIdRaw = open.id;
  const openId = asText(open.id);
  if (!openId) {
    errors.push(`${ctx} requires id`);
  } else if (typeof openIdRaw !== "string") {
    errors.push(`${ctx}.id must be a string`);
  } else if (typeof openIdRaw === "string" && openIdRaw !== openIdRaw.trim()) {
    errors.push(`${ctx}.id must not include leading/trailing whitespace: ${openIdRaw}`);
  } else if (!ID_RE.test(openId)) {
    errors.push(`${ctx}.id has invalid shape: ${openId}`);
  } else if (openWindowIds.has(openId)) {
    errors.push(`${ctx}.id duplicates previously opened window: ${openId}`);
  } else {
    openWindowIds.add(openId);
  }

  const wordsRaw = Object.hasOwn(open, "words") ? open.words : open.spells;
  if (Object.hasOwn(open, "words") && !isStringOrArray(open.words)) {
    errors.push(`${ctx}.words must be a string or array when present`);
  }
  if (typeof open.words === "string" && open.words !== open.words.trim()) {
    errors.push(`${ctx}.words contains word id with leading/trailing whitespace: ${open.words}`);
  }
  if (Array.isArray(open.words)) {
    for (const rawEntry of open.words) {
      if (typeof rawEntry === "string" && rawEntry !== rawEntry.trim()) {
        errors.push(`${ctx}.words contains word id with leading/trailing whitespace: ${rawEntry}`);
      }
    }
  }
  if (Object.hasOwn(open, "spells")) {
    if (!isStringOrArray(open.spells)) {
      errors.push(`${ctx}.spells must be a string or array when present`);
    } else {
      if (typeof open.spells === "string" && open.spells !== open.spells.trim()) {
        errors.push(`${ctx}.spells contains word id with leading/trailing whitespace: ${open.spells}`);
      }
      if (Array.isArray(open.spells)) {
        for (const rawEntry of open.spells) {
          if (typeof rawEntry === "string" && rawEntry !== rawEntry.trim()) {
            errors.push(`${ctx}.spells contains word id with leading/trailing whitespace: ${rawEntry}`);
          }
        }
      }
    }
    if (Object.hasOwn(open, "words")) {
      for (const rawValue of asSelectorList(open.spells)) {
        if (typeof rawValue !== "string") {
          errors.push(`${ctx}.spells contains non-string word id: ${asText(rawValue) || "(empty)"}`);
        }
      }
    }
  }
  if (Object.hasOwn(open, "spells") && !Object.hasOwn(open, "words")) {
    warnings.push(`rule ${ruleId} uses open.spells alias; prefer open.words`);
  }

  const expanded = expandOpenWords(wordsRaw, groups, ruleId, errors);
  if (!expanded.length) {
    errors.push(`${ctx} requires non-empty words`);
  } else {
    const seen = new Set();
    for (const rawWord of expanded) {
      const normalizedWordId = normalizeWordId(rawWord);
      if (!normalizedWordId) {
        errors.push(`${ctx} contains invalid word id: ${rawWord}`);
        continue;
      }
      if (!ID_RE.test(normalizedWordId)) {
        errors.push(`${ctx} contains invalid word id shape: ${rawWord}`);
        continue;
      }
      pushDuplicateWhenSeen(errors, seen, normalizedWordId, `${ctx} contains duplicate word id: ${normalizedWordId}`);
      if (!Object.hasOwn(WORDBOOK_V2_ACTIVE_WORDS_BY_ID, normalizedWordId)) {
        errors.push(`${ctx} references unknown/inactive word id: ${rawWord}`);
      }
    }
  }

  if (Object.hasOwn(open, "ttlMs") && asNonNegativeFiniteOrNull(open.ttlMs) == null) {
    errors.push(`${ctx}.ttlMs must be a finite number >= 0 when present`);
  }

  return true;
}

function parseWindowRefs(raw) {
  return parseStringOrArray(raw).map((v) => asText(v)).filter(Boolean);
}

function validateWindowRefs(rule, ruleId, key, errors, pendingRefs) {
  if (!Object.hasOwn(rule, key)) return;
  if (!isStringOrArray(rule[key])) {
    errors.push(`rule ${ruleId} ${key} must be a string or array when present`);
    return;
  }
  if (typeof rule[key] === "string" && rule[key] !== rule[key].trim()) {
    errors.push(`rule ${ruleId} ${key} contains window id with leading/trailing whitespace: ${rule[key]}`);
  }
  if (Array.isArray(rule[key])) {
    for (const rawEntry of rule[key]) {
      if (typeof rawEntry === "string" && rawEntry !== rawEntry.trim()) {
        errors.push(`rule ${ruleId} ${key} contains window id with leading/trailing whitespace: ${rawEntry}`);
      }
    }
  }
  const rawValues = asSelectorList(rule[key]);
  if (!rawValues.length) {
    errors.push(`rule ${ruleId} ${key} must be a non-empty string or array`);
    return;
  }
  const seen = new Set();
  for (const rawValue of rawValues) {
    if (typeof rawValue !== "string") {
      errors.push(`rule ${ruleId} ${key} contains non-string window id: ${asText(rawValue) || "(empty)"}`);
      continue;
    }
    if (rawValue !== rawValue.trim()) {
      errors.push(`rule ${ruleId} ${key} contains window id with leading/trailing whitespace: ${rawValue}`);
      continue;
    }
    const id = asText(rawValue);
    if (!id) {
      errors.push(`rule ${ruleId} ${key} contains empty window id`);
      continue;
    }
    if (!ID_RE.test(id)) {
      errors.push(`rule ${ruleId} ${key} has invalid window id shape: ${id}`);
      continue;
    }
    pushDuplicateWhenSeen(errors, seen, id, `rule ${ruleId} ${key} contains duplicate window id: ${id}`);
    pendingRefs.push({ ruleId, key, id });
  }
}

function validateTrigger(rule, ruleId, errors) {
  if (!Object.hasOwn(rule, "trigger")) return false;
  const trigger = rule.trigger;
  const ctx = `rule ${ruleId} trigger`;

  if (typeof trigger === "string" || Array.isArray(trigger)) {
    const eventIds = parseStringOrArray(trigger);
    if (typeof trigger === "string" && trigger !== trigger.trim()) {
      errors.push(`${ctx} shorthand contains event id with leading/trailing whitespace: ${trigger}`);
    }
    for (const rawEventId of asSelectorList(trigger)) {
      if (typeof rawEventId !== "string") {
        errors.push(`${ctx} shorthand contains non-string event id: ${asText(rawEventId) || "(empty)"}`);
      }
    }
    if (Array.isArray(trigger)) {
      for (const rawEntry of trigger) {
        if (typeof rawEntry === "string" && rawEntry !== rawEntry.trim()) {
          errors.push(`${ctx} shorthand contains event id with leading/trailing whitespace: ${rawEntry}`);
        }
      }
    }
    if (!eventIds.length) {
      errors.push(`${ctx} shorthand must contain at least one event id`);
      return true;
    }
    const seenEventIds = new Set();
    for (const eventIdRaw of eventIds) {
      const eventId = normalizeEventId(eventIdRaw);
      if (!eventId) {
        errors.push(`${ctx} contains invalid event id: ${eventIdRaw}`);
        continue;
      }
      pushDuplicateWhenSeen(
        errors,
        seenEventIds,
        eventId,
        `${ctx} shorthand contains duplicate normalized event id: ${eventId}`
      );
      if (!Object.hasOwn(EVENT_DEFINITIONS_BY_ID, eventId)) {
        errors.push(`${ctx} references unknown event id: ${eventIdRaw}`);
      }
    }
    return true;
  }

  if (!isPlainObject(trigger)) {
    errors.push(`${ctx} must be a string, array, or object`);
    return true;
  }

  const triggerMap = asObj(trigger);
  const entries = Object.entries(triggerMap);
  if (!entries.length) {
    errors.push(`${ctx} must not be empty`);
    return true;
  }

  const seenEventIds = new Set();
  for (const [eventIdRaw, eventArgRaw] of entries) {
    if (typeof eventIdRaw === "string" && eventIdRaw !== eventIdRaw.trim()) {
      errors.push(`${ctx} contains event id key with leading/trailing whitespace: ${eventIdRaw}`);
      continue;
    }
    const eventId = normalizeEventId(eventIdRaw);
    if (!eventId) {
      errors.push(`${ctx} contains invalid event id: ${eventIdRaw}`);
      continue;
    }
    pushDuplicateWhenSeen(
      errors,
      seenEventIds,
      eventId,
      `${ctx} contains duplicate normalized event id: ${eventId}`
    );
    if (!Object.hasOwn(EVENT_DEFINITIONS_BY_ID, eventId)) {
      errors.push(`${ctx} references unknown event id: ${eventIdRaw}`);
    }
    if (typeof eventArgRaw === "boolean") continue;
    if (!isPlainObject(eventArgRaw)) {
      errors.push(`${ctx}.${eventIdRaw} must be boolean or object args`);
      continue;
    }
    if (Object.hasOwn(eventArgRaw, "enabled") && typeof eventArgRaw.enabled !== "boolean") {
      errors.push(`${ctx}.${eventIdRaw}.enabled must be boolean when present`);
    }
  }

  return true;
}

function validateBind(rule, ruleId, errors) {
  if (!Object.hasOwn(rule, "bind")) return false;
  const bind = rule.bind;
  const ctx = `rule ${ruleId} bind`;
  if (!isPlainObject(bind)) {
    errors.push(`${ctx} must be an object`);
    return true;
  }
  pushUnsupportedKeys(errors, ctx, bind, new Set(["spell", "slot"]));
  const spellRaw = bind.spell;
  const slotRaw = bind.slot;
  const spellId = asText(spellRaw).toLowerCase();
  const slotId = asText(slotRaw).toUpperCase();
  if (!spellId) {
    errors.push(`${ctx}.spell is required`);
  } else if (typeof spellRaw !== "string") {
    errors.push(`${ctx}.spell must be a string`);
  } else if (spellRaw !== spellRaw.trim()) {
    errors.push(`${ctx}.spell must not include leading/trailing whitespace: ${spellRaw}`);
  } else if (!ID_RE.test(spellId)) {
    errors.push(`${ctx}.spell has invalid shape: ${spellRaw}`);
  }
  if (!slotId) {
    errors.push(`${ctx}.slot is required`);
  } else if (typeof slotRaw !== "string") {
    errors.push(`${ctx}.slot must be a string`);
  } else if (slotRaw !== slotRaw.trim()) {
    errors.push(`${ctx}.slot must not include leading/trailing whitespace: ${slotRaw}`);
  } else if (!["UD", "LR", "FB"].includes(slotId)) {
    errors.push(`${ctx}.slot must be one of UD, LR, FB`);
  }
  return true;
}

function validateGrace(rule, ruleId, errors) {
  if (!Object.hasOwn(rule, "grace")) return false;
  const grace = rule.grace;
  const ctx = `rule ${ruleId} grace`;
  if (!isPlainObject(grace)) {
    errors.push(`${ctx} must be an object`);
    return true;
  }
  pushUnsupportedKeys(errors, ctx, grace, new Set(["ttlMs"]));
  if (Object.hasOwn(grace, "ttlMs")) {
    const n = asNonNegativeFiniteOrNull(grace.ttlMs);
    if (n == null) {
      errors.push(`${ctx}.ttlMs must be a finite number >= 0 when present`);
    }
  }
  return true;
}

function validateRule(ruleRaw, ruleIndex, groups, seenRuleIds, openWindowIds, pendingWindowRefs, errors, warnings) {
  if (!isPlainObject(ruleRaw)) {
    errors.push(`${ROOT_CONTEXT}.rules[${ruleIndex}] must be an object`);
    return;
  }
  const rule = asObj(ruleRaw);
  const ruleIdRaw = rule.id;
  const ruleId = asText(rule.id);
  if (!ruleId) {
    errors.push(`${ROOT_CONTEXT}.rules[] entry is missing id`);
    return;
  }
  if (typeof ruleIdRaw !== "string") {
    errors.push(`${ROOT_CONTEXT}.rules[] id must be a string`);
  }
  if (typeof ruleIdRaw === "string" && ruleIdRaw !== ruleIdRaw.trim()) {
    errors.push(`${ROOT_CONTEXT}.rules[] id must not include leading/trailing whitespace: ${ruleIdRaw}`);
  }
  if (!ID_RE.test(ruleId)) {
    errors.push(`${ROOT_CONTEXT}.rules[] id has invalid shape: ${ruleId}`);
  }

  pushDuplicateWhenSeen(errors, seenRuleIds, ruleId, `${ROOT_CONTEXT}.rules contains duplicate id: ${ruleId}`);

  const ctx = `rule ${ruleId}`;
  pushUnsupportedKeys(
    errors,
    ctx,
    rule,
    new Set(["id", "on", "requires", "open", "consume", "trigger", "grace", "bind", "enabled", "cooldownMs", "matchWindowMs", "priority"])
  );
  pushBooleanEnabledErrorWhenPresent(errors, ctx, rule);

  if (Object.hasOwn(rule, "cooldownMs") && asNonNegativeFiniteOrNull(rule.cooldownMs) == null) {
    errors.push(`${ctx}.cooldownMs must be a finite number >= 0 when present`);
  }
  if (Object.hasOwn(rule, "matchWindowMs")) {
    const n = asFiniteOrNull(rule.matchWindowMs);
    if (n == null || n < MIN_MATCH_WINDOW_MS) {
      errors.push(`${ctx}.matchWindowMs must be a finite number >= ${MIN_MATCH_WINDOW_MS} when present`);
    }
  }
  if (Object.hasOwn(rule, "priority") && asFiniteOrNull(rule.priority) == null) {
    errors.push(`${ctx}.priority must be a finite number when present`);
  }

  const onIsObject = isPlainObject(rule.on);
  if (!onIsObject) {
    errors.push(`${ctx}.on must be an object`);
  } else {
    validateOnSelectors(rule, ruleId, errors, warnings);
  }

  const hasOpenSection = Object.hasOwn(rule, "open");
  const openIsObject = !hasOpenSection || isPlainObject(rule.open);
  if (!openIsObject) {
    errors.push(`${ctx}.open must be an object when present`);
  }
  const hasOpen = (hasOpenSection && openIsObject)
    ? validateOpen(rule, ruleId, groups, openWindowIds, errors, warnings)
    : false;
  validateWindowRefs(rule, ruleId, "requires", errors, pendingWindowRefs);
  validateWindowRefs(rule, ruleId, "consume", errors, pendingWindowRefs);
  validateGrace(rule, ruleId, errors);
  const hasTrigger = validateTrigger(rule, ruleId, errors);
  const hasBind = validateBind(rule, ruleId, errors);
  if (hasTrigger && hasBind) {
    errors.push(`${ctx} must not define both trigger and bind`);
  }

  if (!hasOpenSection && !hasTrigger && !hasBind) {
    errors.push(`${ctx} must define open, trigger, and/or bind`);
  }
}

export function validateCompiledInteractionGraphV2(orchestratorInput = null) {
  const errors = [];
  const warnings = [];
  const cfg = asObj(orchestratorInput);

  pushUnsupportedKeys(errors, ROOT_CONTEXT, cfg, new Set(["version", "enabled", "defaults", "groups", "wake", "rules"]));

  if (typeof cfg.version === "string" && cfg.version !== cfg.version.trim()) {
    errors.push(`${ROOT_CONTEXT}.version must not include leading/trailing whitespace: ${cfg.version}`);
  }
  if (typeof cfg.version !== "string" || cfg.version !== "2") {
    errors.push(`${ROOT_CONTEXT}.version must be "2"`);
  }
  if (typeof cfg.enabled !== "boolean") {
    errors.push(`${ROOT_CONTEXT}.enabled must be boolean`);
  }
  if (!Array.isArray(cfg.rules)) {
    errors.push(`${ROOT_CONTEXT}.rules must be an array`);
    return { ok: false, errors, warnings };
  }
  if (Object.hasOwn(cfg, "defaults") && !isPlainObject(cfg.defaults)) {
    errors.push(`${ROOT_CONTEXT}.defaults must be an object when present`);
  }
  if (Object.hasOwn(cfg, "groups") && !isPlainObject(cfg.groups)) {
    errors.push(`${ROOT_CONTEXT}.groups must be an object when present`);
  }

  validateOptionalObjectSection(cfg, "defaults", (defaults) => validateDefaults(defaults, errors));
  validateOptionalObjectSection(cfg, "groups", (groups) => validateGroups(groups, errors));
  if (Object.hasOwn(cfg, "wake")) validateWake(cfg.wake, errors, warnings);

  const groups = asObj(cfg.groups);
  const seenRuleIds = new Set();
  const openWindowIds = new Set();
  const pendingWindowRefs = [];
  for (let i = 0; i < cfg.rules.length; i += 1) {
    validateRule(cfg.rules[i], i, groups, seenRuleIds, openWindowIds, pendingWindowRefs, errors, warnings);
  }

  for (const ref of pendingWindowRefs) {
    if (!openWindowIds.has(ref.id)) {
      errors.push(`rule ${ref.ruleId} ${ref.key} references unknown window id: ${ref.id}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}
