// Builds/writes consolidated rule-engine-v2 status artifacts and console summary lines.
import { READY_PHASES_V2 } from "./ready-phases-v2.mjs";
import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";
import { MANIFEST_VALIDATORS_V2 } from "./manifest-validators-v2.mjs";
import { resolveRuleEngineDocPath } from "./docs-paths-v2.mjs";
import { runCheckScriptOk } from "./run-check-v2.mjs";
import { readJsonSafe } from "./read-json-safe-v2.mjs";
import { isTrue } from "./bool-utils-v2.mjs";
import { toNumberOr, toTrimmedText } from "./value-utils-v2.mjs";
import { writeJsonFile } from "./write-json-v2.mjs";
import { nowIso } from "./now-iso-v2.mjs";
import { RULE_ENGINE_V2_SCHEMA_IDS } from "./schema-ids-v2.mjs";
import { createTaggedLogger } from "./log-tag-v2.mjs";
import { buildRuleEngineFromCompiledInteractionGraphV2 } from "../../src/content/interactions-v2/index.js";

const CHECK_TAG = "status:v2";
const logStatus = createTaggedLogger(CHECK_TAG);
const STATUS_DOC_PATHS = Object.freeze({
  health: resolveRuleEngineDocPath("health"),
  trend: resolveRuleEngineDocPath("milestoneTrend"),
  status: resolveRuleEngineDocPath("status"),
});
const STATUS_LINE_LABELS = Object.freeze({
  wordbookOk: "wordbook ok",
  interactionGraphOk: "interaction graph ok",
  compiledInteractionGraphOk: "compiled interaction graph ok",
  compiledInteractionGraphBootstrapEnabled: "compiled interaction graph bootstrap enabled",
  rulesProjectionOnly: "rules projection only",
  rulesCount: "rules (compiled graph/rule engine)",
  compiledInteractionGraphProjectedRuleCount: "compiled interaction graph projected rules",
  compiledInteractionGraphProjectionParity: "compiled interaction graph projection parity",
  driftIds: "drift ids",
  manifestsSummary: "manifests (ready/contract/regression)",
  milestoneRuns: "milestone runs",
  passRate: "pass rate all/recent",
  latestMilestone: "latest milestone",
});
const STATUS_SECTION_KEYS = Object.freeze({
  readyPhases: "readyPhases",
  regressions: "regressions",
  contracts: "contracts",
});
const STATUS_SECTION_LABELS = Object.freeze({
  readyPhases: "ready phases",
  regressions: "regressions",
  contracts: "contracts",
});

function yn(v) {
  return v ? "yes" : "no";
}

function asList(entries) {
  return Array.isArray(entries) ? entries : [];
}

function formatCheckStatusList(entries, checksById, yesNo) {
  return asList(entries)
    .map((entry) => `${entry.id}:${yesNo(checksById[entry.id] === true)}`)
    .join(" ");
}

function buildCheckResultsByKey(entries, runCheck, keyField = "id") {
  const items = asList(entries);
  const keyName = typeof keyField === "string" ? keyField.trim() : "";
  if (!keyName) {
    throw new Error("buildCheckResultsByKey requires non-empty keyField");
  }
  const byKey = Object.freeze(Object.fromEntries(
    items.map((entry) => [entry?.[keyName], runCheck(entry?.script)])
  ));
  const ok = items.every((entry) => byKey[entry?.[keyName]] === true);
  return Object.freeze({ byKey, ok });
}

function buildCheckBooleanMap(entries, checksById) {
  return Object.fromEntries(
    asList(entries).map((entry) => [entry.id, checksById[entry.id] === true])
  );
}

function buildCheckResultsWithStatusList(entries, runCheck, yesNo) {
  const { byKey, ok } = buildCheckResultsByKey(entries, runCheck, "id");
  const results = Object.freeze({ byId: byKey, ok });
  const statusList = formatCheckStatusList(entries, results.byId, yesNo);
  return Object.freeze({ results, statusList });
}

function buildStatusSection(entries, runCheck, yesNo) {
  const check = buildCheckResultsWithStatusList(entries, runCheck, yesNo);
  const booleans = buildCheckBooleanMap(entries, check.results.byId);
  return Object.freeze({
    results: check.results,
    statusList: check.statusList,
    booleans,
  });
}

function buildStatusSections(defs, runCheck, yesNo) {
  const seenKeys = new Set();
  return Object.freeze(
    Object.fromEntries(
      asList(defs).map((def, index) => {
        if (!def || typeof def !== "object") {
          throw new Error(`status section def[${index}] must be an object`);
        }
        const key = typeof def?.key === "string" ? def.key.trim() : "";
        if (!key) {
          throw new Error(`status section def[${index}] requires non-empty key`);
        }
        if (seenKeys.has(key)) {
          throw new Error(`duplicate status section key: ${key}`);
        }
        seenKeys.add(key);
        const entries = Array.isArray(def?.entries) ? def.entries : [];
        return [key, buildStatusSection(entries, runCheck, yesNo)];
      })
    )
  );
}

function buildOrderedBooleanArtifacts(order, valuesByName, yesNo) {
  const booleans = Object.fromEntries(
    asList(order).map((name) => [name, valuesByName[name] === true])
  );
  const summary = asList(order).map((name) => yesNo(valuesByName[name] === true)).join("/");
  return Object.freeze({ booleans, summary });
}

function buildNamedManifestArtifacts(entries, runCheck, yesNo) {
  const items = asList(entries);
  const byName = buildCheckResultsByKey(items, runCheck, "name").byKey;
  const names = items.map((entry) => entry?.name);
  return buildOrderedBooleanArtifacts(names, byName, yesNo);
}

function buildSectionStatusLines(label, section, yesNo) {
  return [
    `${label} ok: ${yesNo(section.results.ok)}`,
    `${label}: ${section.statusList}`,
  ];
}

function emitStatusLines(log, lines) {
  for (const line of lines) log(line);
}

function normalizeHealthStatus(health) {
  return {
    wordbookOk: isTrue(health?.wordbookOk),
    interactionGraphOk: isTrue(health?.interactionGraphOk),
    compiledInteractionGraphOk: isTrue(health?.compiledInteractionGraphOk),
    compiledInteractionGraphV2BootstrapEnabled: isTrue(health?.compiledInteractionGraphV2BootstrapEnabled),
    projectionRulesOnly: isTrue(health?.projectionRulesOnly),
    compiledInteractionGraphRuleCount: toNumberOr(health?.compiledInteractionGraphRuleCount),
    compiledRuleCount: toNumberOr(health?.compiledRuleCount),
    compiledInteractionGraphProjectedRuleCount: toNumberOr(health?.compiledInteractionGraphProjectedRuleCount),
    compiledInteractionGraphProjectionParityOk: isTrue(health?.compiledInteractionGraphProjectionParityOk),
    driftRuleIds: Array.isArray(health?.driftRuleIds) ? health.driftRuleIds.slice() : [],
  };
}

function computeCompiledInteractionGraphTelemetryLive(compiledInteractionGraphRuleCount, compiledRuleCount) {
  try {
    const compiled = buildRuleEngineFromCompiledInteractionGraphV2();
    const compiledInteractionGraphRules = Array.isArray(compiled?.rules) ? compiled.rules : [];
    return Object.freeze({
      compiledInteractionGraphProjectedRuleCount: compiledInteractionGraphRules.length,
      compiledInteractionGraphProjectionParityOk:
        compiledInteractionGraphRules.length === compiledInteractionGraphRuleCount &&
        compiledInteractionGraphRules.length === compiledRuleCount,
    });
  } catch (_) {
    return Object.freeze({
      compiledInteractionGraphProjectedRuleCount: 0,
      compiledInteractionGraphProjectionParityOk: false,
    });
  }
}

function normalizeTrendStatus(trend) {
  return {
    totalRuns: toNumberOr(trend?.totalRuns),
    passRateAllPct: toNumberOr(trend?.passRateAllPct),
    passRateRecentPct: toNumberOr(trend?.passRateRecentPct),
    latestPass: isTrue(trend?.latestPass),
    latestGitRef: toTrimmedText(trend?.latestGitRef),
  };
}

const STATUS_SECTION_DEFS = Object.freeze([
  Object.freeze({ key: STATUS_SECTION_KEYS.readyPhases, entries: READY_PHASES_V2 }),
  Object.freeze({ key: STATUS_SECTION_KEYS.regressions, entries: REGRESSION_CHECKS_V2 }),
  Object.freeze({ key: STATUS_SECTION_KEYS.contracts, entries: CONTRACT_CHECKS_V2 }),
]);

const healthStatus = normalizeHealthStatus(readJsonSafe(STATUS_DOC_PATHS.health) ?? {});
const compiledInteractionGraphTelemetryLive = computeCompiledInteractionGraphTelemetryLive(
  healthStatus.compiledInteractionGraphRuleCount,
  healthStatus.compiledRuleCount
);
healthStatus.compiledInteractionGraphProjectedRuleCount =
  compiledInteractionGraphTelemetryLive.compiledInteractionGraphProjectedRuleCount;
healthStatus.compiledInteractionGraphProjectionParityOk =
  compiledInteractionGraphTelemetryLive.compiledInteractionGraphProjectionParityOk;
const trendStatus = normalizeTrendStatus(readJsonSafe(STATUS_DOC_PATHS.trend) ?? {});
const manifestArtifacts = buildNamedManifestArtifacts(
  MANIFEST_VALIDATORS_V2,
  runCheckScriptOk,
  yn
);
const statusSections = buildStatusSections(STATUS_SECTION_DEFS, runCheckScriptOk, yn);
const readyPhases = statusSections[STATUS_SECTION_KEYS.readyPhases];
const regressions = statusSections[STATUS_SECTION_KEYS.regressions];
const contracts = statusSections[STATUS_SECTION_KEYS.contracts];

const lines = [
  "---",
  `${STATUS_LINE_LABELS.wordbookOk}: ${yn(healthStatus.wordbookOk)}`,
  `${STATUS_LINE_LABELS.interactionGraphOk}: ${yn(healthStatus.interactionGraphOk)}`,
  `${STATUS_LINE_LABELS.compiledInteractionGraphOk}: ${yn(healthStatus.compiledInteractionGraphOk)}`,
  `${STATUS_LINE_LABELS.compiledInteractionGraphBootstrapEnabled}: ${yn(healthStatus.compiledInteractionGraphV2BootstrapEnabled)}`,
  `${STATUS_LINE_LABELS.rulesProjectionOnly}: ${yn(healthStatus.projectionRulesOnly)}`,
  `${STATUS_LINE_LABELS.rulesCount}: ${healthStatus.compiledInteractionGraphRuleCount}/${healthStatus.compiledRuleCount}`,
  `${STATUS_LINE_LABELS.compiledInteractionGraphProjectedRuleCount}: ${healthStatus.compiledInteractionGraphProjectedRuleCount}`,
  `${STATUS_LINE_LABELS.compiledInteractionGraphProjectionParity}: ${yn(healthStatus.compiledInteractionGraphProjectionParityOk)}`,
  `${STATUS_LINE_LABELS.driftIds}: (none)`,
  `${STATUS_LINE_LABELS.manifestsSummary}: ${manifestArtifacts.summary}`,
  ...buildSectionStatusLines(STATUS_SECTION_LABELS.readyPhases, readyPhases, yn),
  ...buildSectionStatusLines(STATUS_SECTION_LABELS.regressions, regressions, yn),
  ...buildSectionStatusLines(STATUS_SECTION_LABELS.contracts, contracts, yn),
  `${STATUS_LINE_LABELS.milestoneRuns}: ${trendStatus.totalRuns}`,
  `${STATUS_LINE_LABELS.passRate}: ${trendStatus.passRateAllPct}% / ${trendStatus.passRateRecentPct}%`,
  `${STATUS_LINE_LABELS.latestMilestone}: ${trendStatus.latestPass ? "PASS" : "FAIL"} ${trendStatus.latestGitRef}`,
  "---",
];

emitStatusLines(logStatus, lines);

const status = {
  schema: RULE_ENGINE_V2_SCHEMA_IDS.status,
  generatedAt: nowIso(),
  health: {
    wordbookOk: healthStatus.wordbookOk,
    interactionGraphOk: healthStatus.interactionGraphOk,
    compiledInteractionGraphOk: healthStatus.compiledInteractionGraphOk,
    compiledInteractionGraphBootstrapEnabled: healthStatus.compiledInteractionGraphV2BootstrapEnabled,
    projectionRulesOnly: healthStatus.projectionRulesOnly,
    compiledInteractionGraphRuleCount: healthStatus.compiledInteractionGraphRuleCount,
    compiledRuleCount: healthStatus.compiledRuleCount,
    compiledInteractionGraphProjectedRuleCount: healthStatus.compiledInteractionGraphProjectedRuleCount,
    compiledInteractionGraphProjectionParityOk: healthStatus.compiledInteractionGraphProjectionParityOk,
    driftRuleIds: [],
  },
  wordbookOk: healthStatus.wordbookOk,
  interactionGraphOk: healthStatus.interactionGraphOk,
  compiledInteractionGraphOk: healthStatus.compiledInteractionGraphOk,
  compiledInteractionGraphBootstrapEnabled: healthStatus.compiledInteractionGraphV2BootstrapEnabled,
  projectionRulesOnly: healthStatus.projectionRulesOnly,
  compiledInteractionGraphRuleCount: healthStatus.compiledInteractionGraphRuleCount,
  compiledRuleCount: healthStatus.compiledRuleCount,
  compiledInteractionGraphProjectedRuleCount: healthStatus.compiledInteractionGraphProjectedRuleCount,
  compiledInteractionGraphProjectionParityOk: healthStatus.compiledInteractionGraphProjectionParityOk,
  driftRuleIds: [],
  manifests: manifestArtifacts.booleans,
  readyPhases: readyPhases.booleans,
  regressions: regressions.booleans,
  contracts: contracts.booleans,
  milestone: trendStatus,
};

writeJsonFile(STATUS_DOC_PATHS.status, status);
logStatus(`wrote status: ${STATUS_DOC_PATHS.status}`);
