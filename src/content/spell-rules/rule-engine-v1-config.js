import { EVENT_DEFINITIONS_V1 } from "./event-definitions-v1.js";
import { EVENT_RUNTIME_BINDINGS_V1_BY_ID } from "./event-runtime-bindings-v1.js";
import { SIGNAL_DEFINITIONS_V1 } from "./signal-definitions-v1.js";
import { SPELL_RULES_V1 } from "./spell-rules-v1.js";
import { WINDOW_DEFINITIONS_V1 } from "./window-definitions-v1.js";

export const RULE_ENGINE_V1_CONFIG = Object.freeze({
  version: "v1",
  signals: Array.isArray(SIGNAL_DEFINITIONS_V1) ? SIGNAL_DEFINITIONS_V1.slice() : [],
  windows: Array.isArray(WINDOW_DEFINITIONS_V1) ? WINDOW_DEFINITIONS_V1.slice() : [],
  events: Array.isArray(EVENT_DEFINITIONS_V1) ? EVENT_DEFINITIONS_V1.slice() : [],
  rules: Array.isArray(SPELL_RULES_V1) ? SPELL_RULES_V1.slice() : [],
  eventRuntimeBindings: (EVENT_RUNTIME_BINDINGS_V1_BY_ID && typeof EVENT_RUNTIME_BINDINGS_V1_BY_ID === "object")
    ? { ...EVENT_RUNTIME_BINDINGS_V1_BY_ID }
    : Object.create(null),
});
