import { compileDreamConfigV2ToOrchestratorV2 } from "./compile-dream-config-v2.js";

const ROOT_CONTEXT = "DREAM_CONFIG_V2";
const ALLOWED_ROOT_KEYS = new Set(["version", "enabled", "defaults", "wake", "groups", "rules"]);
const ALLOWED_WAKE_KEYS = new Set(["words", "word", "spells", "ttlMs", "enabled", "roots"]);
const ALLOWED_WAKE_ROOT_KEYS = new Set(["id", "words", "word", "ttlMs", "enabled"]);
const ALLOWED_RULE_KEYS = new Set([
  "id",
  "on",
  "open",
  "trigger",
  "requires",
  "consume",
  "enabled",
  "cooldownMs",
  "matchWindowMs",
  "priority",
]);
const ALLOWED_ON_KEYS = new Set(["word", "spell", "gesture", "orb_state"]);
const ALLOWED_OPEN_KEYS = new Set(["id", "words", "word", "spells", "ttlMs", "enabled"]);

function asArray(v) {
  return Array.isArray(v) ? v : [];
}

function asText(v) {
  return String(v ?? "").trim();
}

function isObject(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function pushAliasError(errors, context, objectValue, aliasKey, canonicalKey) {
  if (!isObject(objectValue)) return;
  if (!Object.hasOwn(objectValue, aliasKey)) return;
  errors.push(`${context}.${aliasKey} is not allowed; use ${context}.${canonicalKey}`);
}

function pushUnknownKeys(errors, context, objectValue, allowedKeys) {
  if (!isObject(objectValue)) return;
  for (const key of Object.keys(objectValue)) {
    if (!allowedKeys.has(key)) {
      errors.push(`${context} contains unsupported key: ${key}`);
    }
  }
}

function asSelectorList(raw) {
  if (Array.isArray(raw)) return raw;
  const value = asText(raw);
  return value ? [value] : [];
}

function hasOn(rule) {
  if (!isObject(rule.on)) return false;
  const on = rule.on;
  return asSelectorList(on.word).length
    || asSelectorList(on.gesture).length
    || asSelectorList(on.orb_state).length;
}

function hasAction(rule) {
  return isObject(rule.open) || isObject(rule.trigger) || typeof rule.trigger === "string" || Array.isArray(rule.trigger);
}

export function validateDreamConfigV2(dreamConfig) {
  const errors = [];
  const warnings = [];

  if (!isObject(dreamConfig)) {
    errors.push(`${ROOT_CONTEXT} must be an object`);
    return { ok: false, errors, warnings };
  }

  pushUnknownKeys(errors, ROOT_CONTEXT, dreamConfig, ALLOWED_ROOT_KEYS);

  if (!isObject(dreamConfig.wake)) {
    errors.push(`${ROOT_CONTEXT}.wake must be an object`);
  } else {
    const wake = dreamConfig.wake;
    const hasWakeWords = Object.hasOwn(wake, "words");
    const hasWakeRoots = Object.hasOwn(wake, "roots");
    if (!hasWakeWords && !hasWakeRoots) {
      errors.push(`${ROOT_CONTEXT}.wake.words or ${ROOT_CONTEXT}.wake.roots is required`);
    }
    if (hasWakeWords && !asSelectorList(wake.words).length) {
      errors.push(`${ROOT_CONTEXT}.wake.words must contain at least one entry`);
    }
    if (hasWakeRoots) {
      if (!Array.isArray(wake.roots) || !wake.roots.length) {
        errors.push(`${ROOT_CONTEXT}.wake.roots must be a non-empty array`);
      } else {
        for (let i = 0; i < wake.roots.length; i += 1) {
          const root = wake.roots[i];
          const rootCtx = `${ROOT_CONTEXT}.wake.roots[${i}]`;
          if (!isObject(root)) {
            errors.push(`${rootCtx} must be an object`);
            continue;
          }
          pushUnknownKeys(errors, rootCtx, root, ALLOWED_WAKE_ROOT_KEYS);
          if (!Object.hasOwn(root, "words")) {
            errors.push(`${rootCtx}.words is required`);
          } else if (!asSelectorList(root.words).length) {
            errors.push(`${rootCtx}.words must contain at least one entry`);
          }
          pushAliasError(errors, rootCtx, root, "word", "words");
        }
      }
    }
  }
  pushUnknownKeys(errors, `${ROOT_CONTEXT}.wake`, dreamConfig.wake, ALLOWED_WAKE_KEYS);

  // Enforce canonical dream-config authoring keys (no legacy aliases).
  pushAliasError(errors, `${ROOT_CONTEXT}.wake`, dreamConfig.wake, "word", "words");
  pushAliasError(errors, `${ROOT_CONTEXT}.wake`, dreamConfig.wake, "spells", "words");
  for (const rule of asArray(dreamConfig.rules)) {
    if (!isObject(rule)) {
      errors.push(`${ROOT_CONTEXT}.rules[] entries must be objects`);
      continue;
    }
    const id = asText(rule?.id) || "(unknown)";
    const ruleContext = `${ROOT_CONTEXT}.rules[${id}]`;
    pushUnknownKeys(errors, ruleContext, rule, ALLOWED_RULE_KEYS);
    if (!asText(rule?.id)) {
      errors.push(`${ruleContext}.id is required`);
    }
    if (typeof rule?.on === "string" || Array.isArray(rule?.on)) {
      errors.push(`${ruleContext}.on shorthand is not allowed; use object form (for example { word: "domus" })`);
    }
    if (Object.hasOwn(rule, "on") && !isObject(rule?.on) && typeof rule?.on !== "string" && !Array.isArray(rule?.on)) {
      errors.push(`${ruleContext}.on must be an object`);
    }
    if (typeof rule?.open === "string" || Array.isArray(rule?.open)) {
      errors.push(`${ruleContext}.open shorthand is not allowed; use object form (for example { words: ["domus"] })`);
    }
    if (Object.hasOwn(rule, "open") && !isObject(rule?.open) && typeof rule?.open !== "string" && !Array.isArray(rule?.open)) {
      errors.push(`${ruleContext}.open must be an object when present`);
    }
    pushUnknownKeys(errors, `${ruleContext}.on`, rule?.on, ALLOWED_ON_KEYS);
    pushUnknownKeys(errors, `${ruleContext}.open`, rule?.open, ALLOWED_OPEN_KEYS);
    if (
      Object.hasOwn(rule, "trigger")
      && !isObject(rule?.trigger)
      && typeof rule?.trigger !== "string"
      && !Array.isArray(rule?.trigger)
    ) {
      errors.push(`${ruleContext}.trigger must be an object, string, or array when present`);
    }
    pushAliasError(errors, `${ruleContext}.on`, rule?.on, "spell", "word");
    pushAliasError(errors, `${ruleContext}.open`, rule?.open, "word", "words");
    pushAliasError(errors, `${ruleContext}.open`, rule?.open, "spells", "words");
  }

  const compiled = compileDreamConfigV2ToOrchestratorV2(dreamConfig);

  if (asText(compiled.version) !== "2") {
    errors.push(`${ROOT_CONTEXT}.version must be "2"`);
  }

  const wake = isObject(compiled.wake) ? compiled.wake : {};
  const wakeWords = asSelectorList(wake.words).map((v) => asText(v)).filter(Boolean);
  if (!wakeWords.length) {
    errors.push(`${ROOT_CONTEXT}.wake must define at least one word`);
  }

  const rules = asArray(compiled.rules);
  if (!rules.length) {
    errors.push(`${ROOT_CONTEXT}.rules must be a non-empty array`);
  }

  const seen = new Set();
  for (const rule of rules) {
    const id = asText(rule?.id);
    if (!id) {
      errors.push(`${ROOT_CONTEXT}.rules[] contains entry with missing id`);
      continue;
    }
    if (seen.has(id)) errors.push(`${ROOT_CONTEXT}.rules[] contains duplicate id: ${id}`);
    seen.add(id);
    if (!hasOn(rule)) errors.push(`${ROOT_CONTEXT}.rules[${id}].on must include at least one selector`);
    if (!hasAction(rule)) errors.push(`${ROOT_CONTEXT}.rules[${id}] must include open or trigger`);
  }

  return { ok: errors.length === 0, errors, warnings };
}
