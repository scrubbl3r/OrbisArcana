import { ORCHESTRATOR_V1 } from "./orchestrator-v1.js";
import { WORDBOOK_V2_ACTIVE_WORDS_BY_ID } from "./wordbook-v2.js";

const DEFAULT_PROFILE = Object.freeze({
  wakeWords: Object.freeze(["orbis"]),
  standaloneWords: Object.freeze(["arcana", "are_kay_nah"]),
  wakeRequiredWords: Object.freeze(["domus"]),
  axisWordsByAxis: Object.freeze({
    x: "fridgis",
    y: "pyro",
    z: "electrum",
  }),
  wakeWindowWords: Object.freeze(["rota", "sanctum", "vectus"]),
  rowTopWords: Object.freeze(["orbis", "arcana", "are_kay_nah", "domus", "fridgis", "pyro", "electrum"]),
  rowBottomWords: Object.freeze(["rota", "sanctum", "vectus"]),
  simWords: Object.freeze(["arcana", "are_kay_nah", "pyro", "rota", "electrum", "sanctum", "domus"]),
  inferDefaultWord: "pyro",
});

function normalizeWordId(value) {
  return String(value || "").trim().toLowerCase();
}

function asWordIds(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => normalizeWordId(entry))
    .filter(Boolean)
    .filter((id) => Object.hasOwn(WORDBOOK_V2_ACTIVE_WORDS_BY_ID, id));
}

function unique(values) {
  return Array.from(new Set(values));
}

function resolveAxisWordsByAxisFromRouting(source = ORCHESTRATOR_V1) {
  const routingSection = (source && source.routing && typeof source.routing === "object")
    ? source.routing
    : Object.create(null);
  const routingWords = Array.isArray(routingSection.words) ? routingSection.words : [];
  const out = Object.create(null);
  for (const rawEntry of routingWords) {
    const entry = (rawEntry && typeof rawEntry === "object") ? rawEntry : Object.create(null);
    const intent = normalizeWordId(entry.intent);
    if (!intent || !intent.includes("axis_select")) continue;
    const allowedAxes = Array.isArray(entry.allowedAxes)
      ? unique(entry.allowedAxes.map((axis) => normalizeWordId(axis)).filter((axis) => ["x", "y", "z"].includes(axis)))
      : [];
    if (allowedAxes.length !== 1) continue;
    const axis = allowedAxes[0];
    const axisWordId = normalizeWordId(entry.axisWord || entry.axisSpell || entry.id);
    if (!axisWordId || !Object.hasOwn(WORDBOOK_V2_ACTIVE_WORDS_BY_ID, axisWordId)) continue;
    if (!Object.hasOwn(out, axis)) out[axis] = axisWordId;
  }
  return Object.freeze(out);
}

function resolveAxisWordsByAxis(...axisMaps) {
  const out = Object.create(null);
  for (const axis of ["x", "y", "z"]) {
    for (const axisMap of axisMaps) {
      const candidateId = normalizeWordId(axisMap && axisMap[axis]);
      if (candidateId && Object.hasOwn(WORDBOOK_V2_ACTIVE_WORDS_BY_ID, candidateId)) {
        out[axis] = candidateId;
        break;
      }
    }
  }
  return Object.freeze(out);
}

function resolveKwsProfile(source = ORCHESTRATOR_V1) {
  const orchestratorAxis = (source && source.axis && typeof source.axis === "object")
    ? source.axis
    : Object.create(null);
  const orchestratorKws = (source && source.kws && typeof source.kws === "object")
    ? source.kws
    : Object.create(null);
  const wakeWords = unique(
    asWordIds(orchestratorKws.wakeWords).concat(asWordIds(DEFAULT_PROFILE.wakeWords))
  );
  const standaloneWords = unique(
    asWordIds(orchestratorKws.standaloneWords).concat(asWordIds(DEFAULT_PROFILE.standaloneWords))
  );
  const wakeRequiredWords = unique(
    asWordIds(orchestratorKws.wakeRequiredWords).concat(asWordIds(DEFAULT_PROFILE.wakeRequiredWords))
  );
  const axisWordsByAxis = resolveAxisWordsByAxis(
    orchestratorAxis,
    resolveAxisWordsByAxisFromRouting(source),
    orchestratorKws.axisWordsByAxis,
    DEFAULT_PROFILE.axisWordsByAxis
  );
  const axisWords = unique(
    ["x", "y", "z"]
      .map((axis) => normalizeWordId(axisWordsByAxis[axis]))
      .filter(Boolean)
  );
  const wakeWindowWords = unique(
    asWordIds(orchestratorKws.wakeWindowWords).concat(asWordIds(DEFAULT_PROFILE.wakeWindowWords))
  );
  const rowTopWords = unique(
    asWordIds(orchestratorKws.rowTopWords).concat(
      asWordIds(DEFAULT_PROFILE.rowTopWords),
      wakeWords,
      standaloneWords,
      wakeRequiredWords,
      axisWords
    )
  );
  const rowBottomWords = unique(
    asWordIds(orchestratorKws.rowBottomWords).concat(
      asWordIds(DEFAULT_PROFILE.rowBottomWords),
      wakeWindowWords
    )
  );
  const simWords = unique(
    asWordIds(orchestratorKws.simWords).concat(asWordIds(DEFAULT_PROFILE.simWords))
  );
  const inferredDefaultWord = normalizeWordId(orchestratorKws.inferDefaultWord);
  const inferDefaultWord = (
    inferredDefaultWord &&
    Object.hasOwn(WORDBOOK_V2_ACTIVE_WORDS_BY_ID, inferredDefaultWord)
  )
    ? inferredDefaultWord
    : normalizeWordId(DEFAULT_PROFILE.inferDefaultWord);
  return Object.freeze({
    wakeWords: Object.freeze(wakeWords),
    standaloneWords: Object.freeze(standaloneWords),
    wakeRequiredWords: Object.freeze(wakeRequiredWords),
    axisWordsByAxis,
    axisWords: Object.freeze(axisWords),
    wakeWindowWords: Object.freeze(wakeWindowWords),
    rowTopWords: Object.freeze(rowTopWords),
    rowBottomWords: Object.freeze(rowBottomWords),
    flashTokenWords: Object.freeze(rowTopWords.slice()),
    simWords: Object.freeze(simWords),
    inferDefaultWord,
  });
}

function collectImmediateTriggerWordIds(orchestrator = ORCHESTRATOR_V1) {
  const rules = Array.isArray(orchestrator && orchestrator.rules) ? orchestrator.rules : [];
  const out = [];
  const seen = new Set();
  for (const rule of rules) {
    const on = (rule && typeof rule.on === "object" && !Array.isArray(rule.on)) ? rule.on : null;
    const rawWord = on && Object.prototype.hasOwnProperty.call(on, "word")
      ? on.word
      : (on && Object.prototype.hasOwnProperty.call(on, "spell") ? on.spell : "");
    const wordId = normalizeWordId(rawWord).replace(/^word\./, "").replace(/^spell\./, "");
    if (!wordId) continue;
    if (!Object.hasOwn(WORDBOOK_V2_ACTIVE_WORDS_BY_ID, wordId)) continue;
    const hasOpen = Object.prototype.hasOwnProperty.call((rule || {}), "open");
    const hasTrigger = Object.prototype.hasOwnProperty.call((rule || {}), "trigger")
      || Object.prototype.hasOwnProperty.call((rule || {}), "triggers");
    if (hasOpen || !hasTrigger) continue;
    if (seen.has(wordId)) continue;
    seen.add(wordId);
    out.push(wordId);
  }
  return Object.freeze(out);
}

export const ORCHESTRATOR_V1_KWS_PROFILE = resolveKwsProfile(ORCHESTRATOR_V1);
export const ORCHESTRATOR_V1_IMMEDIATE_TRIGGER_WORD_IDS = collectImmediateTriggerWordIds(ORCHESTRATOR_V1);
export const KWS_WAKE_WORD_IDS = ORCHESTRATOR_V1_KWS_PROFILE.wakeWords;
export const KWS_STANDALONE_WORD_IDS = ORCHESTRATOR_V1_KWS_PROFILE.standaloneWords;
export const KWS_WAKE_REQUIRED_WORD_IDS = ORCHESTRATOR_V1_KWS_PROFILE.wakeRequiredWords;
export const KWS_AXIS_WORD_BY_AXIS = ORCHESTRATOR_V1_KWS_PROFILE.axisWordsByAxis;
export const KWS_AXIS_WORD_IDS = ORCHESTRATOR_V1_KWS_PROFILE.axisWords;
export const KWS_WAKE_WINDOW_WORD_IDS = ORCHESTRATOR_V1_KWS_PROFILE.wakeWindowWords;
export const KWS_ROW_TOP_WORD_IDS = ORCHESTRATOR_V1_KWS_PROFILE.rowTopWords;
export const KWS_ROW_BOTTOM_WORD_IDS = ORCHESTRATOR_V1_KWS_PROFILE.rowBottomWords;
export const KWS_FLASH_TOKEN_WORD_IDS = ORCHESTRATOR_V1_KWS_PROFILE.flashTokenWords;
export const KWS_SIM_WORD_IDS = ORCHESTRATOR_V1_KWS_PROFILE.simWords;
export const KWS_INFER_DEFAULT_WORD_ID = ORCHESTRATOR_V1_KWS_PROFILE.inferDefaultWord;
