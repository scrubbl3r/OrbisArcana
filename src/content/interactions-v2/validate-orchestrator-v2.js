import { WORDBOOK_V2_ACTIVE_WORDS_BY_ID } from "./wordbook-v2.js";
import { EVENT_DEFINITIONS_BY_ID } from "../spell-rules/event-definitions.js";
import { SIGNAL_DEFINITIONS_BY_ID } from "../spell-rules/signal-definitions.js";
import {
  asObj,
  asSelectorList,
  asText,
  isPlainObject,
  normalizeEventId,
  normalizeSpellId,
  pushBooleanEnabledErrorWhenPresent,
  pushUnsupportedKeys,
  requireNonEmptyArray,
  validateOptionalObjectSection,
} from "./orchestrator-v1-normalizers.js";

const ROOT_CONTEXT = "ORCHESTRATOR_V2";
const DEFAULTS_CONTEXT = `${ROOT_CONTEXT}.defaults`;
const GROUPS_CONTEXT = `${ROOT_CONTEXT}.groups`;

const MIN_MATCH_WINDOW_MS = 100;
const ID_RE = /^[A-Za-z0-9_.@-]+$/;

const SIGNAL_DEFS = ((typeof SIGNAL_DEFINITIONS_BY_ID === "object" && SIGNAL_DEFINITIONS_BY_ID)
  ? SIGNAL_DEFINITIONS_BY_ID
  : {});

const KNOWN_GESTURE_IDS = new Set(
  Object.keys(SIGNAL_DEFS)
    .filter((id) => typeof id === "string" && id.startsWith("gesture."))
    .map((id) => id.slice("gesture.".length))
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
    for (const [eventIdRaw, argsRaw] of Object.entries(triggerDefaults)) {
      const eventId = normalizeEventId(eventIdRaw);
      if (!eventId) {
        errors.push(`${ctx} contains invalid event id key: ${eventIdRaw}`);
        continue;
      }
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
    if (!Array.isArray(wordsRaw) || !wordsRaw.length) {
      errors.push(`${ctx} must be a non-empty array`);
      continue;
    }
    const seen = new Set();
    for (const wordRaw of wordsRaw) {
      const normalizedWordId = normalizeWordId(wordRaw);
      if (!normalizedWordId) {
        errors.push(`${ctx} contains invalid word id: ${asText(wordRaw) || "(empty)"}`);
        continue;
      }
      pushDuplicateWhenSeen(errors, seen, normalizedWordId, `${ctx} contains duplicate word id: ${normalizedWordId}`);
      if (!Object.hasOwn(WORDBOOK_V2_ACTIVE_WORDS_BY_ID, normalizedWordId)) {
        errors.push(`${ctx} references unknown/inactive word id: ${normalizedWordId}`);
      }
    }
  }
}

function validateOnSelectors(rule, ruleId, errors, warnings) {
  const on = asObj(rule.on);
  const onContext = `rule ${ruleId} on`;
  pushUnsupportedKeys(errors, onContext, on, new Set(["word", "spell", "gesture", "orb_state"]));

  const selectorEntries = [];
  const parseAndPush = (kind, raw) => {
    for (const value of parseStringOrArray(raw)) {
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
  parseAndPush("gesture", on.gesture);
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

    if (entry.kind === "gesture") {
      const id = asText(entry.value).toLowerCase();
      if (!id) {
        errors.push(`rule ${ruleId} has invalid on.gesture id: ${entry.value || "(empty)"}`);
        continue;
      }
      const dedupeKey = `gesture:${id}`;
      pushDuplicateWhenSeen(errors, seen, dedupeKey, `rule ${ruleId} contains duplicate on selector: ${dedupeKey}`);
      if (!KNOWN_GESTURE_IDS.has(id)) {
        errors.push(`rule ${ruleId} references unknown gesture id: ${entry.value}`);
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
  const values = parseStringOrArray(wordsRaw);
  const out = [];
  for (const token of values) {
    const trimmed = asText(token);
    if (!trimmed) continue;
    if (trimmed.startsWith("@")) {
      const groupName = trimmed.slice(1);
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

  const openId = asText(open.id);
  if (!openId) {
    errors.push(`${ctx} requires id`);
  } else if (!ID_RE.test(openId)) {
    errors.push(`${ctx}.id has invalid shape: ${openId}`);
  } else if (openWindowIds.has(openId)) {
    errors.push(`${ctx}.id duplicates previously opened window: ${openId}`);
  } else {
    openWindowIds.add(openId);
  }

  const wordsRaw = Object.hasOwn(open, "words") ? open.words : open.spells;
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
  const values = parseWindowRefs(rule[key]);
  if (!values.length) {
    errors.push(`rule ${ruleId} ${key} must be a non-empty string or array`);
    return;
  }
  const seen = new Set();
  for (const id of values) {
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
    if (!eventIds.length) {
      errors.push(`${ctx} shorthand must contain at least one event id`);
      return true;
    }
    for (const eventIdRaw of eventIds) {
      const eventId = normalizeEventId(eventIdRaw);
      if (!eventId) {
        errors.push(`${ctx} contains invalid event id: ${eventIdRaw}`);
        continue;
      }
      if (!Object.hasOwn(EVENT_DEFINITIONS_BY_ID, eventId)) {
        errors.push(`${ctx} references unknown event id: ${eventIdRaw}`);
      }
    }
    return true;
  }

  const triggerMap = asObj(trigger);
  const entries = Object.entries(triggerMap);
  if (!entries.length) {
    errors.push(`${ctx} must not be empty`);
    return true;
  }

  for (const [eventIdRaw, eventArgRaw] of entries) {
    const eventId = normalizeEventId(eventIdRaw);
    if (!eventId) {
      errors.push(`${ctx} contains invalid event id: ${eventIdRaw}`);
      continue;
    }
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

function validateRule(ruleRaw, groups, seenRuleIds, openWindowIds, pendingWindowRefs, errors, warnings) {
  const rule = asObj(ruleRaw);
  const ruleId = asText(rule.id);
  if (!ruleId) {
    errors.push(`${ROOT_CONTEXT}.rules[] entry is missing id`);
    return;
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
    new Set(["id", "on", "requires", "open", "consume", "trigger", "enabled", "cooldownMs", "matchWindowMs", "priority"])
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

  validateOnSelectors(rule, ruleId, errors, warnings);
  const hasOpen = validateOpen(rule, ruleId, groups, openWindowIds, errors, warnings);
  validateWindowRefs(rule, ruleId, "requires", errors, pendingWindowRefs);
  validateWindowRefs(rule, ruleId, "consume", errors, pendingWindowRefs);
  const hasTrigger = validateTrigger(rule, ruleId, errors);

  if (!hasOpen && !hasTrigger) {
    errors.push(`${ctx} must define open and/or trigger`);
  }
}

export function validateOrchestratorV2(orchestratorInput = null) {
  const errors = [];
  const warnings = [];
  const cfg = asObj(orchestratorInput);

  pushUnsupportedKeys(errors, ROOT_CONTEXT, cfg, new Set(["version", "enabled", "defaults", "groups", "rules"]));

  if (asText(cfg.version) !== "2") {
    errors.push(`${ROOT_CONTEXT}.version must be "2"`);
  }
  if (typeof cfg.enabled !== "boolean") {
    errors.push(`${ROOT_CONTEXT}.enabled must be boolean`);
  }
  if (!Array.isArray(cfg.rules)) {
    errors.push(`${ROOT_CONTEXT}.rules must be an array`);
    return { ok: false, errors, warnings };
  }

  validateOptionalObjectSection(cfg, "defaults", (defaults) => validateDefaults(defaults, errors));
  validateOptionalObjectSection(cfg, "groups", (groups) => validateGroups(groups, errors));

  const groups = asObj(cfg.groups);
  const seenRuleIds = new Set();
  const openWindowIds = new Set();
  const pendingWindowRefs = [];
  for (const ruleEntry of cfg.rules) {
    validateRule(ruleEntry, groups, seenRuleIds, openWindowIds, pendingWindowRefs, errors, warnings);
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
