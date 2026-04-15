// Runtime routing metadata intentionally separated from recognition wordbook.
// This file owns behavior-oriented word metadata during refactor slices.
import {
  COMPILED_INTERACTION_GRAPH_V2,
} from "../interactions-v2/compiled-interaction-graph-v2.js?v=20260415c";
import { COMPILED_INTERACTION_GRAPH_V2_WAKE_WORD_IDS } from "../interactions-v2/compiled-interaction-graph-v2-wake-profile.js?v=20260415c";
import { WORDBOOK_V2_ACTIVE_WORDS_BY_ID } from "../interactions-v2/wordbook-v2.js?v=20260415c";

const PREFERRED_KWS_TOKEN_ORDER = Object.freeze([
  "orbis",
  "are_kay_nah",
  "echovar",
  "varavectus",
  "domus",
  "electrum",
  "fridgis",
  "pyro",
  "rota",
  "sanctum",
  "vectus",
]);

const CANONICAL_STANDALONE_WORD_IDS = Object.freeze(["arcana", "are_kay_nah"]);
const CANONICAL_ROW_TOP_EXTRAS = Object.freeze([]);

function asSelectorList(raw) {
  if (Array.isArray(raw)) return raw.slice();
  const text = String(raw || "").trim();
  if (!text) return [];
  if (text.includes(",")) {
    return text.split(",").map((token) => String(token || "").trim()).filter(Boolean);
  }
  return [text];
}

function asWordId(raw) {
  const id = String(raw || "").trim().toLowerCase().replace(/^word\./, "").replace(/^spell\./, "");
  return id;
}

function asSlot(value) {
  const token = String(value || "").trim().toUpperCase();
  return ["UD", "LR", "FB"].includes(token) ? token : "";
}

function uniqueWordIds(ids = []) {
  return Array.from(new Set(
    (Array.isArray(ids) ? ids : [])
      .map((id) => asWordId(id))
      .filter((id) => id && Object.hasOwn(WORDBOOK_V2_ACTIVE_WORDS_BY_ID, id))
  ));
}

function orderWordIdsByPreferred(ids = []) {
  const set = new Set(uniqueWordIds(ids));
  const out = [];
  for (const preferredId of PREFERRED_KWS_TOKEN_ORDER) {
    if (!set.has(preferredId)) continue;
    out.push(preferredId);
    set.delete(preferredId);
  }
  for (const id of set) out.push(id);
  return out;
}

function resolveDisplayTextByWordId(id) {
  const word = WORDBOOK_V2_ACTIVE_WORDS_BY_ID[asWordId(id)];
  if (!word) return "";
  const label = String(word.label || "").trim();
  if (label) return label;
  const phrase = String(word.phrase || "").trim();
  if (phrase) return phrase;
  return String(word.id || "").trim();
}

function compareWordDisplay(a, b) {
  return String(a || "").localeCompare(String(b || ""), undefined, { sensitivity: "base" });
}

function buildWordFlashboardTierMap() {
  const rules = Array.isArray(COMPILED_INTERACTION_GRAPH_V2 && COMPILED_INTERACTION_GRAPH_V2.rules) ? COMPILED_INTERACTION_GRAPH_V2.rules : [];
  const wakeRoots = uniqueWordIds(COMPILED_INTERACTION_GRAPH_V2_WAKE_WORD_IDS);
  const groups = (COMPILED_INTERACTION_GRAPH_V2 && typeof COMPILED_INTERACTION_GRAPH_V2.groups === "object" && COMPILED_INTERACTION_GRAPH_V2.groups)
    ? COMPILED_INTERACTION_GRAPH_V2.groups
    : Object.create(null);
  const openedByWordId = new Map();
  const tierByWordId = new Map();
  const queue = [];

  for (const rootId of wakeRoots) {
    tierByWordId.set(rootId, 1);
    queue.push(rootId);
  }

  for (const rule of rules) {
    const triggerWordIds = collectRuleOnWordIds(rule);
    if (!triggerWordIds.length) continue;
    const open = (rule && typeof rule.open === "object" && !Array.isArray(rule.open)) ? rule.open : null;
    if (!open) continue;
    const openedWordIds = uniqueWordIds(resolveWordRefs(
      Object.hasOwn(open, "words") ? open.words : open.spells,
      groups
    ));
    if (!openedWordIds.length) continue;
    for (const triggerWordId of triggerWordIds) {
      const existing = openedByWordId.get(triggerWordId) || [];
      openedByWordId.set(triggerWordId, existing.concat(openedWordIds));
    }
  }

  while (queue.length) {
    const wordId = queue.shift();
    const currentTier = Number(tierByWordId.get(wordId) || 0);
    if (!currentTier) continue;
    const openedWordIds = uniqueWordIds(openedByWordId.get(wordId) || []);
    for (const openedWordId of openedWordIds) {
      const nextTier = currentTier + 1;
      const existingTier = Number(tierByWordId.get(openedWordId) || 0);
      if (existingTier && existingTier <= nextTier) continue;
      tierByWordId.set(openedWordId, nextTier);
      queue.push(openedWordId);
    }
  }

  return tierByWordId;
}

function resolveWordRefs(raw, groups = {}) {
  const out = [];
  for (const token of asSelectorList(raw)) {
    const text = String(token || "").trim();
    if (!text) continue;
    if (text.startsWith("@")) {
      const groupName = text.slice(1).trim();
      const groupWords = Array.isArray(groups && groups[groupName]) ? groups[groupName] : [];
      for (const groupWord of groupWords) out.push(groupWord);
      continue;
    }
    out.push(text);
  }
  return out;
}

function collectRuleOnWordIds(rule) {
  const on = (rule && typeof rule.on === "object" && !Array.isArray(rule.on)) ? rule.on : null;
  if (!on) return [];
  const raw = Object.hasOwn(on, "word") ? on.word : on.spell;
  return uniqueWordIds(asSelectorList(raw));
}

function collectRuleOpenWordIds(rule) {
  const open = (rule && typeof rule.open === "object" && !Array.isArray(rule.open)) ? rule.open : null;
  if (!open) return [];
  const raw = Object.hasOwn(open, "words") ? open.words : open.spells;
  const groups = (COMPILED_INTERACTION_GRAPH_V2 && typeof COMPILED_INTERACTION_GRAPH_V2.groups === "object" && COMPILED_INTERACTION_GRAPH_V2.groups)
    ? COMPILED_INTERACTION_GRAPH_V2.groups
    : Object.create(null);
  return uniqueWordIds(resolveWordRefs(raw, groups));
}

function collectRulesByPredicate(predicate) {
  const rules = Array.isArray(COMPILED_INTERACTION_GRAPH_V2 && COMPILED_INTERACTION_GRAPH_V2.rules) ? COMPILED_INTERACTION_GRAPH_V2.rules : [];
  return rules.filter((rule) => {
    try {
      return !!predicate(rule || {});
    } catch (_) {
      return false;
    }
  });
}

function buildDerivedRuntimeProfileV2() {
  const wakeWordIds = uniqueWordIds(COMPILED_INTERACTION_GRAPH_V2_WAKE_WORD_IDS);
  const wakeMainOpenRules = collectRulesByPredicate((rule) => {
    const open = (rule && typeof rule.open === "object" && !Array.isArray(rule.open)) ? rule.open : null;
    const openId = String(open && open.id || "").trim().toLowerCase();
    return openId === "wake.main";
  });
  const wakeRequiredWordIds = uniqueWordIds(
    wakeMainOpenRules.flatMap((rule) => collectRuleOpenWordIds(rule))
  );
  const wakeWindowOpenRules = collectRulesByPredicate((rule) => {
    const open = (rule && typeof rule.open === "object" && !Array.isArray(rule.open)) ? rule.open : null;
    const openId = String(open && open.id || "").trim().toLowerCase();
    return !!openId && openId !== "wake.main";
  });
  const wakeWindowWordIds = uniqueWordIds(
    wakeWindowOpenRules.flatMap((rule) => collectRuleOpenWordIds(rule))
  );
  const allOnWordIds = uniqueWordIds(
    collectRulesByPredicate(() => true).flatMap((rule) => collectRuleOnWordIds(rule))
  );
  const authoredWordIds = uniqueWordIds([
    ...wakeWordIds,
    ...allOnWordIds,
    ...wakeRequiredWordIds,
    ...wakeWindowWordIds,
  ]);
  const standaloneWordIds = uniqueWordIds(
    allOnWordIds.filter((id) =>
      !wakeWordIds.includes(id) &&
      !wakeRequiredWordIds.includes(id) &&
      !wakeWindowWordIds.includes(id)
    )
  );
  const rowTopWordIds = orderWordIdsByPreferred([
    ...wakeWordIds,
    ...standaloneWordIds,
    ...CANONICAL_ROW_TOP_EXTRAS,
    ...wakeRequiredWordIds,
    ...wakeWindowWordIds,
  ]);
  // Keep wake-window tokens for gating logic, but avoid duplicate flasher rows in UI.
  const rowBottomWordIds = [];
  const flashTokenWordIds = rowTopWordIds.slice();
  const inferDefaultWordId = rowTopWordIds[0] || "pyro";
  const simWordIds = uniqueWordIds([
    ...wakeRequiredWordIds,
    ...wakeWindowWordIds,
  ]);

  const immediateTriggerCandidates = uniqueWordIds(
    collectRulesByPredicate((rule) => {
      const hasOpen = !!(rule && typeof rule.open === "object" && !Array.isArray(rule.open));
      const hasRequires = asSelectorList(rule && rule.requires).length > 0;
      const hasTrigger = !!rule && (Object.hasOwn(rule, "trigger") || Object.hasOwn(rule, "bind"));
      return !hasOpen && !hasRequires && hasTrigger;
    }).flatMap((rule) => collectRuleOnWordIds(rule))
  );
  const immediateTriggerWordIds = uniqueWordIds(
    immediateTriggerCandidates.filter((id) =>
      !wakeWordIds.includes(id) &&
      !wakeWindowWordIds.includes(id)
    )
  );

  return Object.freeze({
    authoredWordIds: Object.freeze(authoredWordIds),
    wakeWordIds: Object.freeze(wakeWordIds),
    standaloneWordIds: Object.freeze(standaloneWordIds),
    wakeRequiredWordIds: Object.freeze(wakeRequiredWordIds),
    wakeWindowWordIds: Object.freeze(wakeWindowWordIds),
    rowTopWordIds: Object.freeze(rowTopWordIds),
    rowBottomWordIds: Object.freeze(rowBottomWordIds),
    flashTokenWordIds: Object.freeze(flashTokenWordIds),
    simWordIds: Object.freeze(simWordIds),
    inferDefaultWordId,
    immediateTriggerWordIds: Object.freeze(immediateTriggerWordIds),
  });
}

const COMPILED_INTERACTION_GRAPH_V2_RUNTIME_PROFILE = buildDerivedRuntimeProfileV2();

function buildWordRuntimeRoutingV2(profile = COMPILED_INTERACTION_GRAPH_V2_RUNTIME_PROFILE) {
  const out = [];
  const seen = new Set();
  function add(entry) {
    const id = asWordId(entry && entry.id);
    if (!id || seen.has(id)) return;
    if (!Object.hasOwn(WORDBOOK_V2_ACTIVE_WORDS_BY_ID, id)) return;
    seen.add(id);
    out.push(Object.freeze({ ...entry, id }));
  }

  for (const id of (Array.isArray(profile.wakeWordIds) ? profile.wakeWordIds : [])) {
    add({ id, intent: "spell.wake" });
  }
  const standaloneIds = uniqueWordIds([
    ...(Array.isArray(profile.standaloneWordIds) ? profile.standaloneWordIds : []),
    ...CANONICAL_STANDALONE_WORD_IDS,
  ]);
  for (const id of standaloneIds) {
    if (id === "arcana") {
      add({ id, intent: "spell.arcana_test" });
      continue;
    }
    if (id === "are_kay_nah") {
      add({ id, intent: "spell.are_kay_nah_test" });
      continue;
    }
    add({ id, intent: `spell.${id}` });
  }
  if (Object.hasOwn(WORDBOOK_V2_ACTIVE_WORDS_BY_ID, "domus")) {
    add({
      id: "domus",
      intent: "spell.domus",
      fixedSlot: "UD",
    });
  }
  for (const id of (Array.isArray(profile.wakeWindowWordIds) ? profile.wakeWindowWordIds : [])) {
    add({
      id,
      intent: `spell.${id}`,
    });
  }
  for (const id of (Array.isArray(profile.wakeRequiredWordIds) ? profile.wakeRequiredWordIds : [])) {
    add({
      id,
      intent: `spell.${id}`,
    });
  }
  for (const id of Object.keys(WORDBOOK_V2_ACTIVE_WORDS_BY_ID || {})) {
    add({
      id,
      intent: `spell.${id}`,
    });
  }
  return Object.freeze(out);
}

function buildWordFlashboardWords(profile = COMPILED_INTERACTION_GRAPH_V2_RUNTIME_PROFILE) {
  const ids = Array.isArray(profile?.authoredWordIds) ? profile.authoredWordIds : [];
  const tierByWordId = buildWordFlashboardTierMap();
  return Object.freeze(
    ids
      .map((id) => WORDBOOK_V2_ACTIVE_WORDS_BY_ID[asWordId(id)])
      .filter(Boolean)
      .map((word) => {
        const id = asWordId(word.id);
        const phrase = String(word.phrase || "").trim().toLowerCase();
        const label = String(word.label || "").trim();
        const displayText = resolveDisplayTextByWordId(id);
        const tier = Math.max(1, Number(tierByWordId.get(id) || 1));
        return Object.freeze({
          id,
          phrase,
          label,
          displayText,
          tier,
        });
      })
      .sort((a, b) => {
        const tierDelta = Number(a.tier || 0) - Number(b.tier || 0);
        if (tierDelta !== 0) return tierDelta;
        return compareWordDisplay(a.displayText, b.displayText);
      })
  );
}

const COMPILED_INTERACTION_GRAPH_V2_WORD_RUNTIME_ROUTING = buildWordRuntimeRoutingV2(COMPILED_INTERACTION_GRAPH_V2_RUNTIME_PROFILE);
const COMPILED_INTERACTION_GRAPH_V2_WORDFLASHBOARD_WORDS = buildWordFlashboardWords(COMPILED_INTERACTION_GRAPH_V2_RUNTIME_PROFILE);

export const WAKE_WORD_IDS = Object.freeze(
  (Array.isArray(COMPILED_INTERACTION_GRAPH_V2_RUNTIME_PROFILE.wakeWordIds)
    ? COMPILED_INTERACTION_GRAPH_V2_RUNTIME_PROFILE.wakeWordIds
    : []).slice()
);

export const STANDALONE_WORD_IDS = Object.freeze(
  (Array.isArray(COMPILED_INTERACTION_GRAPH_V2_RUNTIME_PROFILE.standaloneWordIds)
    ? COMPILED_INTERACTION_GRAPH_V2_RUNTIME_PROFILE.standaloneWordIds
    : []).slice()
);

export const WORDFLASHBOARD_WORD_IDS = Object.freeze(
  (Array.isArray(COMPILED_INTERACTION_GRAPH_V2_RUNTIME_PROFILE.authoredWordIds)
    ? COMPILED_INTERACTION_GRAPH_V2_RUNTIME_PROFILE.authoredWordIds
    : []).slice()
);

export const WORDFLASHBOARD_WORDS = Object.freeze(
  (Array.isArray(COMPILED_INTERACTION_GRAPH_V2_WORDFLASHBOARD_WORDS)
    ? COMPILED_INTERACTION_GRAPH_V2_WORDFLASHBOARD_WORDS
    : []).slice()
);

export const WAKE_REQUIRED_WORD_IDS = Object.freeze(
  (Array.isArray(COMPILED_INTERACTION_GRAPH_V2_RUNTIME_PROFILE.wakeRequiredWordIds)
    ? COMPILED_INTERACTION_GRAPH_V2_RUNTIME_PROFILE.wakeRequiredWordIds
    : []).slice()
);

export const AXIS_WORD_IDS = Object.freeze([]);
export const KWS_AXIS_WORD_IDS = AXIS_WORD_IDS;

export const WAKE_WINDOW_WORD_IDS = Object.freeze(
  (Array.isArray(COMPILED_INTERACTION_GRAPH_V2_RUNTIME_PROFILE.wakeWindowWordIds)
    ? COMPILED_INTERACTION_GRAPH_V2_RUNTIME_PROFILE.wakeWindowWordIds
    : []).slice()
);
export const KWS_WAKE_WINDOW_WORD_IDS = WAKE_WINDOW_WORD_IDS;

// Keep empty in strict-gated mode: axis + wake-window words are valid only
// inside the active flat-spin dispatch window.
export const WORD_WINDOW_BYPASS_WORD_IDS = Object.freeze([]);
// Compatibility alias; keep until all runtime callers use WORD_WINDOW_BYPASS_WORD_IDS.
export const SPELL_WINDOW_BYPASS_WORD_IDS = WORD_WINDOW_BYPASS_WORD_IDS;

// Immediate voice words that are owned by the rule engine path.
// Runtime dispatch should not emit duplicate EVT_VOICE_SPELL_CAST for these when rule engine is active.
export const RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS = Object.freeze(
  (Array.isArray(COMPILED_INTERACTION_GRAPH_V2_RUNTIME_PROFILE.immediateTriggerWordIds)
    ? COMPILED_INTERACTION_GRAPH_V2_RUNTIME_PROFILE.immediateTriggerWordIds
    : []).slice()
);
export const KWS_WAKE_REQUIRED_WORD_IDS = WAKE_REQUIRED_WORD_IDS;

export const WAKE_WINDOW_RUNTIME_KEY_BY_WORD = Object.freeze({});

const DEFAULT_KWS_TOP_WORD_IDS = Object.freeze([
  ...new Set([
    ...WAKE_WORD_IDS,
    ...WAKE_REQUIRED_WORD_IDS,
    ...STANDALONE_WORD_IDS,
  ]
    .map((id) => String(id || "").trim().toLowerCase())
    .filter(Boolean)),
]);

export const KWS_FLASH_TOKEN_WORD_IDS = Object.freeze(
  (Array.isArray(COMPILED_INTERACTION_GRAPH_V2_RUNTIME_PROFILE.flashTokenWordIds)
    ? COMPILED_INTERACTION_GRAPH_V2_RUNTIME_PROFILE.flashTokenWordIds
    : DEFAULT_KWS_TOP_WORD_IDS).slice()
);

export const KWS_ROW_TOP_WORD_IDS = Object.freeze(
  (Array.isArray(COMPILED_INTERACTION_GRAPH_V2_RUNTIME_PROFILE.rowTopWordIds)
    ? COMPILED_INTERACTION_GRAPH_V2_RUNTIME_PROFILE.rowTopWordIds
    : DEFAULT_KWS_TOP_WORD_IDS).slice()
);

export const KWS_ROW_BOTTOM_WORD_IDS = Object.freeze(
  (Array.isArray(COMPILED_INTERACTION_GRAPH_V2_RUNTIME_PROFILE.rowBottomWordIds)
    ? COMPILED_INTERACTION_GRAPH_V2_RUNTIME_PROFILE.rowBottomWordIds
    : WAKE_WINDOW_WORD_IDS).slice()
);

export const KWS_SIM_WORD_IDS = Object.freeze(
  (Array.isArray(COMPILED_INTERACTION_GRAPH_V2_RUNTIME_PROFILE.simWordIds)
    ? COMPILED_INTERACTION_GRAPH_V2_RUNTIME_PROFILE.simWordIds
    : []).slice()
);

export const KWS_INFER_DEFAULT_WORD_ID = COMPILED_INTERACTION_GRAPH_V2_RUNTIME_PROFILE.inferDefaultWordId || "";

export const WORD_RUNTIME_ROUTING = Object.freeze(
  (Array.isArray(COMPILED_INTERACTION_GRAPH_V2_WORD_RUNTIME_ROUTING)
    ? COMPILED_INTERACTION_GRAPH_V2_WORD_RUNTIME_ROUTING
    : []).slice()
);
export const WORD_RUNTIME_ROUTING_TABLE = WORD_RUNTIME_ROUTING;

export const WORD_RUNTIME_ROUTING_BY_WORD_ID = Object.freeze(
  WORD_RUNTIME_ROUTING.reduce((acc, item) => {
    const id = String(item && item.id || "").trim().toLowerCase();
    if (!id) return acc;
    acc[id] = item;
    return acc;
  }, {})
);
