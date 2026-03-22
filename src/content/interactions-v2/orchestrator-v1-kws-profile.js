import { ORCHESTRATOR_V1 } from "./orchestrator-v1.js";
import { WORDBOOK_V2_ACTIVE_WORDS_BY_ID } from "./wordbook-v2.js";

const DEFAULT_PROFILE = Object.freeze({
  wakeWords: Object.freeze(["orbis"]),
  wakeRequiredWords: Object.freeze(["domus"]),
  axisWordsByAxis: Object.freeze({
    x: "fridgis",
    y: "pyro",
    z: "electrum",
  }),
  wakeWindowWords: Object.freeze(["rota", "sanctum", "vectus"]),
  rowTopWords: Object.freeze(["orbis", "domus", "fridgis", "pyro", "electrum"]),
  rowBottomWords: Object.freeze(["rota", "sanctum", "vectus"]),
  simWords: Object.freeze(["pyro", "rota", "electrum", "sanctum", "domus"]),
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

function resolveAxisWordsByAxis(rawAxisMap, fallbackAxisMap) {
  const out = Object.create(null);
  for (const axis of ["x", "y", "z"]) {
    const preferredId = normalizeWordId(rawAxisMap && rawAxisMap[axis]);
    const fallbackId = normalizeWordId(fallbackAxisMap && fallbackAxisMap[axis]);
    if (preferredId && Object.hasOwn(WORDBOOK_V2_ACTIVE_WORDS_BY_ID, preferredId)) {
      out[axis] = preferredId;
      continue;
    }
    if (fallbackId && Object.hasOwn(WORDBOOK_V2_ACTIVE_WORDS_BY_ID, fallbackId)) {
      out[axis] = fallbackId;
    }
  }
  return Object.freeze(out);
}

function resolveKwsProfile(source = ORCHESTRATOR_V1) {
  const orchestratorKws = (source && source.kws && typeof source.kws === "object")
    ? source.kws
    : Object.create(null);
  const wakeWords = unique(
    asWordIds(orchestratorKws.wakeWords).concat(asWordIds(DEFAULT_PROFILE.wakeWords))
  );
  const wakeRequiredWords = unique(
    asWordIds(orchestratorKws.wakeRequiredWords).concat(asWordIds(DEFAULT_PROFILE.wakeRequiredWords))
  );
  const axisWordsByAxis = resolveAxisWordsByAxis(
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

export const ORCHESTRATOR_V1_KWS_PROFILE = resolveKwsProfile(ORCHESTRATOR_V1);
export const KWS_WAKE_WORD_IDS = ORCHESTRATOR_V1_KWS_PROFILE.wakeWords;
export const KWS_WAKE_REQUIRED_WORD_IDS = ORCHESTRATOR_V1_KWS_PROFILE.wakeRequiredWords;
export const KWS_AXIS_WORD_BY_AXIS = ORCHESTRATOR_V1_KWS_PROFILE.axisWordsByAxis;
export const KWS_AXIS_WORD_IDS = ORCHESTRATOR_V1_KWS_PROFILE.axisWords;
export const KWS_WAKE_WINDOW_WORD_IDS = ORCHESTRATOR_V1_KWS_PROFILE.wakeWindowWords;
export const KWS_ROW_TOP_WORD_IDS = ORCHESTRATOR_V1_KWS_PROFILE.rowTopWords;
export const KWS_ROW_BOTTOM_WORD_IDS = ORCHESTRATOR_V1_KWS_PROFILE.rowBottomWords;
export const KWS_FLASH_TOKEN_WORD_IDS = ORCHESTRATOR_V1_KWS_PROFILE.flashTokenWords;
export const KWS_SIM_WORD_IDS = ORCHESTRATOR_V1_KWS_PROFILE.simWords;
export const KWS_INFER_DEFAULT_WORD_ID = ORCHESTRATOR_V1_KWS_PROFILE.inferDefaultWord;

