// Runtime routing metadata intentionally separated from recognition spellbook.
// This file owns behavior-oriented spell metadata during refactor slices.
import {
  KWS_AXIS_WORD_IDS,
  KWS_FLASH_TOKEN_WORD_IDS as ORCHESTRATOR_KWS_FLASH_TOKEN_WORD_IDS,
  KWS_INFER_DEFAULT_WORD_ID as ORCHESTRATOR_KWS_INFER_DEFAULT_WORD_ID,
  KWS_ROW_BOTTOM_WORD_IDS as ORCHESTRATOR_KWS_ROW_BOTTOM_WORD_IDS,
  KWS_ROW_TOP_WORD_IDS as ORCHESTRATOR_KWS_ROW_TOP_WORD_IDS,
  KWS_SIM_WORD_IDS as ORCHESTRATOR_KWS_SIM_WORD_IDS,
  KWS_STANDALONE_WORD_IDS,
  KWS_WAKE_REQUIRED_WORD_IDS,
  KWS_WAKE_WINDOW_WORD_IDS,
  KWS_WAKE_WORD_IDS,
  ORCHESTRATOR_V1_IMMEDIATE_TRIGGER_WORD_IDS,
} from "../interactions-v2/orchestrator-v1-kws-profile.js";
import { ORCHESTRATOR_V1_WORD_RUNTIME_ROUTING } from "../interactions-v2/orchestrator-v1-routing-profile.js";

export const WAKE_WORD_IDS = Object.freeze(
  (Array.isArray(KWS_WAKE_WORD_IDS) ? KWS_WAKE_WORD_IDS : []).slice()
);

export const STANDALONE_WORD_IDS = Object.freeze(
  (Array.isArray(KWS_STANDALONE_WORD_IDS) ? KWS_STANDALONE_WORD_IDS : []).slice()
);

export const WAKE_REQUIRED_WORD_IDS = Object.freeze(
  (Array.isArray(KWS_WAKE_REQUIRED_WORD_IDS) ? KWS_WAKE_REQUIRED_WORD_IDS : []).slice()
);

export const AXIS_WORD_IDS = Object.freeze(
  (Array.isArray(KWS_AXIS_WORD_IDS) ? KWS_AXIS_WORD_IDS : []).slice()
);

export const WAKE_WINDOW_WORD_IDS = Object.freeze(
  (Array.isArray(KWS_WAKE_WINDOW_WORD_IDS) ? KWS_WAKE_WINDOW_WORD_IDS : []).slice()
);

export const WORD_WINDOW_BYPASS_WORD_IDS = Object.freeze([
  ...new Set([...AXIS_WORD_IDS, ...WAKE_WINDOW_WORD_IDS]),
]);
export const SPELL_WINDOW_BYPASS_WORD_IDS = WORD_WINDOW_BYPASS_WORD_IDS;

// Immediate voice words that are owned by the rule engine path.
// Spell dispatch should not emit duplicate EVT_VOICE_SPELL_CAST for these when rule engine is active.
export const RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS = Object.freeze(
  (Array.isArray(ORCHESTRATOR_V1_IMMEDIATE_TRIGGER_WORD_IDS) ? ORCHESTRATOR_V1_IMMEDIATE_TRIGGER_WORD_IDS : []).slice()
);

export const WAKE_WINDOW_RUNTIME_KEY_BY_WORD = Object.freeze({
  ...WAKE_WINDOW_WORD_IDS.reduce((acc, id) => {
    const token = String(id || "").trim().toLowerCase();
    if (!token) return acc;
    acc[token] = token;
    return acc;
  }, {}),
});

const LEGACY_KWS_TOP_WORD_IDS = Object.freeze([
  ...new Set([
    ...WAKE_WORD_IDS,
    ...WAKE_REQUIRED_WORD_IDS,
    ...AXIS_WORD_IDS,
    ...STANDALONE_WORD_IDS,
  ]
    .map((id) => String(id || "").trim().toLowerCase())
    .filter(Boolean)),
]);

export const KWS_FLASH_TOKEN_WORD_IDS = Object.freeze(
  (Array.isArray(ORCHESTRATOR_KWS_FLASH_TOKEN_WORD_IDS)
    ? ORCHESTRATOR_KWS_FLASH_TOKEN_WORD_IDS
    : LEGACY_KWS_TOP_WORD_IDS).slice()
);

export const KWS_ROW_TOP_WORD_IDS = Object.freeze(
  (Array.isArray(ORCHESTRATOR_KWS_ROW_TOP_WORD_IDS) ? ORCHESTRATOR_KWS_ROW_TOP_WORD_IDS : LEGACY_KWS_TOP_WORD_IDS).slice()
);

export const KWS_ROW_BOTTOM_WORD_IDS = Object.freeze(
  (Array.isArray(ORCHESTRATOR_KWS_ROW_BOTTOM_WORD_IDS) ? ORCHESTRATOR_KWS_ROW_BOTTOM_WORD_IDS : WAKE_WINDOW_WORD_IDS).slice()
);

export const KWS_SIM_WORD_IDS = Object.freeze(
  (Array.isArray(ORCHESTRATOR_KWS_SIM_WORD_IDS)
    ? ORCHESTRATOR_KWS_SIM_WORD_IDS
    : []).slice()
);

export const KWS_INFER_DEFAULT_WORD_ID = ORCHESTRATOR_KWS_INFER_DEFAULT_WORD_ID || "";

export const WORD_RUNTIME_ROUTING = Object.freeze(
  (Array.isArray(ORCHESTRATOR_V1_WORD_RUNTIME_ROUTING)
    ? ORCHESTRATOR_V1_WORD_RUNTIME_ROUTING
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
