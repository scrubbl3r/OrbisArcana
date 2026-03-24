const FIELD_VERSION = "version";
const FIELD_ENABLED = "enabled";
const FIELD_DEFAULTS = "defaults";
const FIELD_WAKE = "wake";
const FIELD_GROUPS = "groups";
const FIELD_RULES = "rules";
const FIELD_SPELL = "spell";
const FIELD_TRIGGER = "trigger";

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

export function compileDreamConfigV2ToOrchestratorV2(dreamConfig) {
  const cfg = cloneJson(dreamConfig);
  const rules = Array.isArray(cfg[FIELD_RULES])
    ? cfg[FIELD_RULES].map((rawRule) => {
      if (!rawRule || typeof rawRule !== "object" || Array.isArray(rawRule)) return rawRule;
      const rule = { ...rawRule };
      if (Object.hasOwn(rule, FIELD_TRIGGER)) {
        rule[FIELD_TRIGGER] = normalizeTriggerShorthand(rule[FIELD_TRIGGER]);
      }
      return rule;
    })
    : [];
  const orchestrator = {
    [FIELD_VERSION]: String(cfg[FIELD_VERSION] ?? "2"),
    [FIELD_ENABLED]: cfg[FIELD_ENABLED] !== false,
    [FIELD_DEFAULTS]: cfg[FIELD_DEFAULTS] ?? {},
    [FIELD_WAKE]: cfg[FIELD_WAKE] ?? {},
    [FIELD_GROUPS]: cfg[FIELD_GROUPS] ?? {},
    [FIELD_RULES]: rules,
  };
  return deepFreeze(orchestrator);
}
