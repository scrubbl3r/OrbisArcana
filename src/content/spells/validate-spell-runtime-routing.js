import { WORDS_BY_ID } from "../../voice/wordbook.js";
import {
  AXIS_WORD_IDS,
  KWS_FLASH_TOKEN_WORD_IDS,
  KWS_INFER_DEFAULT_WORD_ID,
  KWS_ROW_BOTTOM_WORD_IDS,
  KWS_ROW_TOP_WORD_IDS,
  KWS_SIM_WORD_IDS,
  RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS,
  WORD_RUNTIME_ROUTING,
  WAKE_WINDOW_WORD_IDS,
  WAKE_REQUIRED_WORD_IDS,
  WAKE_WORD_IDS,
} from "./spell-runtime-routing.js";
import { COMPILED_INTERACTION_GRAPH_V2 } from "../interactions-v2/compiled-interaction-graph-v2.js";

const AXES = new Set(["x", "y", "z"]);
const SLOTS = new Set(["UD", "LR", "FB"]);

function asId(v) {
  return String(v || "").trim().toLowerCase();
}

function checkSpellIdList(errors, label, ids) {
  for (const raw of Array.isArray(ids) ? ids : []) {
    const id = asId(raw);
    if (!id) {
      errors.push(`${label} contains empty spell id`);
      continue;
    }
    if (!WORDS_BY_ID[id]) {
      errors.push(`${label} references unknown spell id: ${id}`);
    }
  }
}

function isAxis(v) {
  return AXES.has(String(v || "").trim().toLowerCase());
}

function isSlot(v) {
  return SLOTS.has(String(v || "").trim().toUpperCase());
}

function collectImmediateWordIdsFromConfig(cfg) {
  const out = new Set();
  const rules = Array.isArray(cfg && cfg.rules) ? cfg.rules : [];
  for (const rule of rules) {
    const on = (rule && typeof rule.on === "object" && rule.on) ? rule.on : null;
    const conditions = Array.isArray(on && on.all) ? on.all : [];
    const actions = Array.isArray(rule && rule.then)
      ? rule.then
      : [];
    if (conditions.length !== 1) continue;
    const condition = conditions[0];
    const conditionType = String(condition && condition.type || "").trim().toLowerCase();
    if (conditionType !== "word" && conditionType !== "spell") continue;
    const wordId = asId(condition && condition.id).replace(/^(word|spell)\./, "");
    if (!wordId) continue;
    let hasImmediateEvent = false;
    for (const action of actions) {
      const actionType = String(action && action.type || "").trim().toLowerCase();
      if (actionType === "wake_win") {
        hasImmediateEvent = false;
        break;
      }
      if (actionType !== "event") continue;
      hasImmediateEvent = true;
    }
    if (!hasImmediateEvent) continue;
    out.add(wordId);
  }
  return out;
}

function collectWakeWinWordIdsFromConfig(cfg) {
  const out = new Set();
  const rules = Array.isArray(cfg && cfg.rules) ? cfg.rules : [];
  for (const rule of rules) {
    const actions = Array.isArray(rule && rule.then) ? rule.then : [];
    for (const action of actions) {
      const actionType = String(action && action.type || "").trim().toLowerCase();
      if (actionType !== "wake_win") continue;
      const windowId = asId(action && action.windowId);
      if (windowId === "wake.main") continue;
      const wordRefs = Array.isArray(action && action.words)
        ? action.words
        : (Array.isArray(action && action.spells) ? action.spells : []);
      for (const rawWordId of wordRefs) {
        const wordId = asId(rawWordId).replace(/^(word|spell)\./, "");
        if (!wordId) continue;
        out.add(wordId);
      }
    }
  }
  return out;
}

function isRuleLikeConfig(input) {
  return !!(input && typeof input === "object" && Array.isArray(input.rules));
}

function asSelectorList(raw) {
  if (Array.isArray(raw)) return raw.slice();
  const text = String(raw || "").trim();
  if (!text) return [];
  if (text.includes(",")) {
    return text.split(",").map((token) => String(token || "").trim()).filter(Boolean);
  }
  return [text];
}

function collectOnWordIdsFromOrchestratorRule(rule) {
  const on = (rule && typeof rule.on === "object" && !Array.isArray(rule.on)) ? rule.on : null;
  if (!on) return [];
  const raw = Object.hasOwn(on, "word") ? on.word : on.spell;
  return asSelectorList(raw)
    .map((value) => asId(value).replace(/^(word|spell)\./, ""))
    .filter(Boolean);
}

function collectWakeWinWordIdsFromOrchestratorV2(orchestratorV2) {
  const rules = Array.isArray(orchestratorV2 && orchestratorV2.rules) ? orchestratorV2.rules : [];
  const groups = (orchestratorV2 && typeof orchestratorV2.groups === "object" && orchestratorV2.groups)
    ? orchestratorV2.groups
    : Object.create(null);
  const out = new Set();
  for (const rule of rules) {
    const open = (rule && typeof rule.open === "object" && !Array.isArray(rule.open)) ? rule.open : null;
    const openId = asId(open && open.id);
    if (!openId || openId === "wake.main") continue;
    const rawWords = open && (Object.hasOwn(open, "words") ? open.words : open.spells);
    const resolvedWords = [];
    for (const token of asSelectorList(rawWords)) {
      const text = String(token || "").trim();
      if (!text) continue;
      if (text.startsWith("@")) {
        const groupName = text.slice(1).trim();
        const groupWords = Array.isArray(groups[groupName]) ? groups[groupName] : [];
        for (const groupWord of groupWords) resolvedWords.push(groupWord);
        continue;
      }
      resolvedWords.push(text);
    }
    for (const rawWordId of resolvedWords) {
      const wordId = asId(rawWordId).replace(/^(word|spell)\./, "");
      if (!wordId) continue;
      out.add(wordId);
    }
  }
  return out;
}

function collectImmediateWordIdsFromOrchestratorV2(orchestratorV2) {
  const rules = Array.isArray(orchestratorV2 && orchestratorV2.rules) ? orchestratorV2.rules : [];
  const wakeWordIds = new Set(
    asSelectorList(orchestratorV2 && orchestratorV2.wake && orchestratorV2.wake.words)
      .map((id) => asId(id).replace(/^(word|spell)\./, ""))
      .filter(Boolean)
  );
  const wakeWindowWordIds = collectWakeWinWordIdsFromOrchestratorV2(orchestratorV2);
  const out = new Set();
  for (const rule of rules) {
    const hasOpen = !!(rule && typeof rule.open === "object" && !Array.isArray(rule.open));
    const hasRequires = asSelectorList(rule && rule.requires).length > 0;
    const hasTrigger = !!rule && Object.hasOwn(rule, "trigger");
    if (hasOpen || hasRequires || !hasTrigger) continue;
    for (const wordId of collectOnWordIdsFromOrchestratorRule(rule)) {
      if (wakeWordIds.has(wordId)) continue;
      if (wakeWindowWordIds.has(wordId)) continue;
      out.add(wordId);
    }
  }
  return out;
}

export function validateSpellRuntimeRouting(sourceConfig = null) {
  const errors = [];
  const routingEntries = Array.isArray(WORD_RUNTIME_ROUTING)
    ? WORD_RUNTIME_ROUTING
    : [];
  const ROUTING_LABEL = "WORD_RUNTIME_ROUTING";
  if (!routingEntries.length) {
    errors.push(`${ROUTING_LABEL} is empty (orchestrator.routing.words[] must define runtime routing entries)`);
  }

  checkSpellIdList(errors, "WAKE_WORD_IDS", WAKE_WORD_IDS);
  checkSpellIdList(errors, "WAKE_REQUIRED_WORD_IDS", WAKE_REQUIRED_WORD_IDS);
  checkSpellIdList(errors, "AXIS_WORD_IDS", AXIS_WORD_IDS);
  checkSpellIdList(errors, "WAKE_WINDOW_WORD_IDS", WAKE_WINDOW_WORD_IDS);
  checkSpellIdList(errors, "KWS_FLASH_TOKEN_WORD_IDS", KWS_FLASH_TOKEN_WORD_IDS);
  checkSpellIdList(errors, "KWS_ROW_TOP_WORD_IDS", KWS_ROW_TOP_WORD_IDS);
  checkSpellIdList(errors, "KWS_ROW_BOTTOM_WORD_IDS", KWS_ROW_BOTTOM_WORD_IDS);
  checkSpellIdList(errors, "KWS_SIM_WORD_IDS", KWS_SIM_WORD_IDS);

  const inferId = asId(KWS_INFER_DEFAULT_WORD_ID);
  if (!inferId) errors.push("KWS_INFER_DEFAULT_WORD_ID is empty");
  else if (!WORDS_BY_ID[inferId]) errors.push(`KWS_INFER_DEFAULT_WORD_ID references unknown spell id: ${inferId}`);

  const legacySourceMode = isRuleLikeConfig(sourceConfig);
  const expectedOwnedImmediate = legacySourceMode
    ? collectImmediateWordIdsFromConfig(sourceConfig)
    : collectImmediateWordIdsFromOrchestratorV2(COMPILED_INTERACTION_GRAPH_V2);
  const declaredOwnedImmediate = new Set(
    (Array.isArray(RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS) ? RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS : [])
      .map((id) => asId(id))
      .filter(Boolean)
  );
  const missingOwnedImmediate = Array.from(expectedOwnedImmediate).filter((id) => !declaredOwnedImmediate.has(id)).sort();
  const extraOwnedImmediate = Array.from(declaredOwnedImmediate).filter((id) => !expectedOwnedImmediate.has(id)).sort();
  if (missingOwnedImmediate.length) {
    errors.push(
      legacySourceMode
        ? `RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS missing interactions-v2 immediate word ids: ${missingOwnedImmediate.join(", ")}`
        : `RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS missing orchestrator immediate word ids: ${missingOwnedImmediate.join(", ")}`
    );
  }
  if (extraOwnedImmediate.length) {
    errors.push(
      legacySourceMode
        ? `RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS has ids not present as interactions-v2 immediate word rules: ${extraOwnedImmediate.join(", ")}`
        : `RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS has ids not present as orchestrator immediate word rules: ${extraOwnedImmediate.join(", ")}`
    );
  }

  const expectedWakeWindowSpellIds = legacySourceMode
    ? collectWakeWinWordIdsFromConfig(sourceConfig)
    : collectWakeWinWordIdsFromOrchestratorV2(COMPILED_INTERACTION_GRAPH_V2);
  const declaredWakeWindowSpellIds = new Set(
    (Array.isArray(WAKE_WINDOW_WORD_IDS) ? WAKE_WINDOW_WORD_IDS : [])
      .map((id) => asId(id))
      .filter(Boolean)
  );
  const missingWakeWindowSpellIds = Array.from(expectedWakeWindowSpellIds).filter((id) => !declaredWakeWindowSpellIds.has(id)).sort();
  const extraWakeWindowSpellIds = Array.from(declaredWakeWindowSpellIds).filter((id) => !expectedWakeWindowSpellIds.has(id)).sort();
  if (missingWakeWindowSpellIds.length) {
    errors.push(
      legacySourceMode
        ? `WAKE_WINDOW_WORD_IDS missing interactions-v2 wake_win word ids: ${missingWakeWindowSpellIds.join(", ")}`
        : `WAKE_WINDOW_WORD_IDS missing orchestrator wake window word ids: ${missingWakeWindowSpellIds.join(", ")}`
    );
  }
  if (extraWakeWindowSpellIds.length) {
    errors.push(
      legacySourceMode
        ? `WAKE_WINDOW_WORD_IDS has ids not present in interactions-v2 wake_win actions: ${extraWakeWindowSpellIds.join(", ")}`
        : `WAKE_WINDOW_WORD_IDS has ids not present in orchestrator wake window words: ${extraWakeWindowSpellIds.join(", ")}`
    );
  }

  const seenRoutingIds = new Set();
  for (const item of routingEntries) {
    const id = asId(item && item.id);
    if (!id) {
      errors.push(`${ROUTING_LABEL} contains entry with empty id`);
      continue;
    }
    if (seenRoutingIds.has(id)) errors.push(`${ROUTING_LABEL} duplicate id: ${id}`);
    seenRoutingIds.add(id);

    if (!WORDS_BY_ID[id]) errors.push(`${ROUTING_LABEL} entry references unknown spell id: ${id}`);

    const intent = asId(item && item.intent);
    if (intent === "spell.school_select" || intent === "spell.class_select") {
      errors.push(`${ROUTING_LABEL}[${id}] uses retired intent: ${intent}`);
    }
    if (intent === "spell.wake_window_select") {
      errors.push(`${ROUTING_LABEL}[${id}] uses retired intent: ${intent}`);
    }

    if (item && Object.prototype.hasOwnProperty.call(item, "school")) {
      errors.push(`${ROUTING_LABEL}[${id}] contains retired key: school`);
    }
    if (item && Object.prototype.hasOwnProperty.call(item, "classKey")) {
      errors.push(`${ROUTING_LABEL}[${id}] contains retired key: classKey`);
    }

    if (item && Object.prototype.hasOwnProperty.call(item, "fixedSlot")) {
      if (!isSlot(item.fixedSlot)) errors.push(`${ROUTING_LABEL}[${id}] has invalid fixedSlot: ${item.fixedSlot}`);
    }
  }

  return errors;
}
