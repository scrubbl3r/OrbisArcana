const FIELD_VERSION = "version";
const FIELD_ENABLED = "enabled";
const FIELD_DEFAULTS = "defaults";
const FIELD_WAKE = "wake";
const FIELD_GROUPS = "groups";
const FIELD_RULES = "rules";
const FIELD_SPELL = "spell";
const FIELD_TRIGGER = "trigger";
const FIELD_BIND = "bind";
const FIELD_WORDS = "words";
const FIELD_ROOTS = "roots";
const FIELD_TTL_MS = "ttlMs";

function deepFreeze(value) {
  if (!value || typeof value !== "object") return value;
  if (Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const key of Object.keys(value)) deepFreeze(value[key]);
  return value;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function asText(value) {
  return String(value ?? "").trim();
}

function asSelectorList(raw) {
  if (Array.isArray(raw)) return raw;
  const value = asText(raw);
  return value ? [value] : [];
}

function normalizeTriggerShorthand(rawTrigger) {
  if (!rawTrigger || typeof rawTrigger !== "object" || Array.isArray(rawTrigger)) return rawTrigger;
  const trigger = { ...rawTrigger };
  const spellShorthand = trigger[FIELD_SPELL];
  if (spellShorthand == null) return trigger;
  delete trigger[FIELD_SPELL];

  const entries = Array.isArray(spellShorthand) ? spellShorthand : [spellShorthand];
  for (const entry of entries) {
    if (typeof entry === "string") {
      const id = String(entry ?? "").trim();
      if (!id) continue;
      if (trigger[id] == null) trigger[id] = true;
      continue;
    }
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const id = String(entry.id ?? "").trim();
    if (!id) continue;
    const argsRaw = (entry.args && typeof entry.args === "object" && !Array.isArray(entry.args))
      ? { ...entry.args }
      : {};
    if (trigger[id] != null) continue;
    trigger[id] = Object.keys(argsRaw).length ? argsRaw : true;
  }
  return trigger;
}

function compileBindAction(rawBind) {
  if (!rawBind || typeof rawBind !== "object" || Array.isArray(rawBind)) return null;
  const bind = { ...rawBind };
  const spellId = asText(bind.spell).toLowerCase();
  const slotId = asText(bind.slot).toUpperCase();
  if (!spellId || !slotId) return null;
  return { spell: spellId, slot: slotId };
}

function normalizeWakeSection(rawWake) {
  if (!rawWake || typeof rawWake !== "object" || Array.isArray(rawWake)) return rawWake ?? {};
  const wake = { ...rawWake };
  const roots = Array.isArray(wake[FIELD_ROOTS]) ? wake[FIELD_ROOTS] : [];
  if (!roots.length) return wake;

  const baseWords = asSelectorList(wake[FIELD_WORDS]).map(asText).filter(Boolean);
  const rootWords = [];
  let derivedTtlMs = null;
  for (const rootRaw of roots) {
    if (!rootRaw || typeof rootRaw !== "object" || Array.isArray(rootRaw)) continue;
    const wordsRaw = rootRaw[FIELD_WORDS];
    for (const token of asSelectorList(wordsRaw)) {
      const id = asText(token);
      if (id) rootWords.push(id);
    }
    if (derivedTtlMs == null) {
      const ttlMsNum = Number(rootRaw[FIELD_TTL_MS]);
      if (Number.isFinite(ttlMsNum) && ttlMsNum >= 0) derivedTtlMs = ttlMsNum;
    }
  }

  const mergedWords = Array.from(new Set([...baseWords, ...rootWords]));
  const out = { ...wake };
  delete out[FIELD_ROOTS];
  if (mergedWords.length) out[FIELD_WORDS] = mergedWords;
  if (!Object.hasOwn(out, FIELD_TTL_MS) && derivedTtlMs != null) out[FIELD_TTL_MS] = derivedTtlMs;
  return out;
}

export function compileDreamConfigV2ToOrchestratorV2(dreamConfig) {
  const cfg = cloneJson(dreamConfig);
  const wake = normalizeWakeSection(cfg[FIELD_WAKE] ?? {});
  const rules = Array.isArray(cfg[FIELD_RULES])
    ? cfg[FIELD_RULES].map((rawRule) => {
      if (!rawRule || typeof rawRule !== "object" || Array.isArray(rawRule)) return rawRule;
      const rule = { ...rawRule };
      if (Object.hasOwn(rule, FIELD_TRIGGER)) {
        rule[FIELD_TRIGGER] = normalizeTriggerShorthand(rule[FIELD_TRIGGER]);
      }
      if (Object.hasOwn(rule, FIELD_BIND)) {
        const compiledBind = compileBindAction(rule[FIELD_BIND]);
        if (compiledBind) rule[FIELD_BIND] = compiledBind;
        else delete rule[FIELD_BIND];
      }
      return rule;
    })
    : [];
  const orchestrator = {
    [FIELD_VERSION]: String(cfg[FIELD_VERSION] ?? "2"),
    [FIELD_ENABLED]: cfg[FIELD_ENABLED] !== false,
    [FIELD_DEFAULTS]: cfg[FIELD_DEFAULTS] ?? {},
    [FIELD_WAKE]: wake,
    [FIELD_GROUPS]: cfg[FIELD_GROUPS] ?? {},
    [FIELD_RULES]: rules,
  };
  return deepFreeze(orchestrator);
}
