import { READY_PHASES_V2 } from "./ready-phases-v2.mjs";
import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";
import {
  MANIFEST_VALIDATORS_V2,
} from "./manifest-validators-v2.mjs";
import { resolveRuleEngineDocPath } from "./docs-paths-v2.mjs";
import { runCheckScriptOk } from "./run-check-v2.mjs";
import { readJsonSafe } from "./read-json-safe-v2.mjs";
import { isTrue } from "./bool-utils-v2.mjs";
import { toNumberOr, toTrimmedText } from "./value-utils-v2.mjs";
import { writeJsonFile } from "./write-json-v2.mjs";
import { nowIso } from "./now-iso-v2.mjs";
import { RULE_ENGINE_V2_SCHEMA_IDS } from "./schema-ids-v2.mjs";
import { createTaggedLogger } from "./log-tag-v2.mjs";

const CHECK_TAG = "status:v2";
const logStatus = createTaggedLogger(CHECK_TAG);
const STATUS_DOC_PATHS = Object.freeze({
  health: resolveRuleEngineDocPath("health"),
  trend: resolveRuleEngineDocPath("milestoneTrend"),
  status: resolveRuleEngineDocPath("status"),
});
const STATUS_LINE_LABELS = Object.freeze({
  spellbookOk: "spellbook ok",
  interactionsOk: "interactions ok",
  bootstrapUsesV2: "bootstrap uses v2",
  rulesProjectionOnly: "rules projection only",
  rulesCount: "rules (interactions/projection)",
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

function formatCheckStatusList(entries, checksById, yesNo) {
  const items = Array.isArray(entries) ? entries : [];
  return items
    .map((entry) => `${entry.id}:${yesNo(checksById[entry.id] === true)}`)
    .join(" ");
}

function buildCheckResultsByKey(entries, runCheck, keyField = "id") {
  const items = Array.isArray(entries) ? entries : [];
  const keyName = String(keyField || "").trim() || "id";
  const byKey = Object.freeze(Object.fromEntries(
    items.map((entry) => [entry?.[keyName], runCheck(entry?.script)])
  ));
  const ok = items.every((entry) => byKey[entry?.[keyName]] === true);
  return Object.freeze({ byKey, ok });
}

function buildCheckBooleanMap(entries, checksById) {
  const items = Array.isArray(entries) ? entries : [];
  return Object.fromEntries(
    items.map((entry) => [entry.id, checksById[entry.id] === true])
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
  const list = Array.isArray(defs) ? defs : [];
  return Object.freeze(
    Object.fromEntries(
      list.map((def) => {
        const key = String(def?.key || "").trim();
        return [key, buildStatusSection(def?.entries || [], runCheck, yesNo)];
      })
    )
  );
}

function buildOrderedBooleanArtifacts(order, valuesByName, yesNo) {
  const names = Array.isArray(order) ? order : [];
  const booleans = Object.fromEntries(
    names.map((name) => [name, valuesByName[name] === true])
  );
  const summary = names.map((name) => yesNo(valuesByName[name] === true)).join("/");
  return Object.freeze({ booleans, summary });
}

function buildNamedManifestArtifacts(entries, runCheck, yesNo) {
  const items = Array.isArray(entries) ? entries : [];
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
    spellbookOk: isTrue(health?.spellbookOk),
    interactionsOk: isTrue(health?.interactionsOk),
    bootstrapUsesV2Adapter: isTrue(health?.bootstrapUsesV2Adapter),
    projectionRulesOnly: isTrue(health?.projectionRulesOnly),
    interactionsRuleCount: toNumberOr(health?.interactionsRuleCount),
    projectedRuleCount: toNumberOr(health?.projectedRuleCount),
    driftRuleIds: Array.isArray(health?.driftRuleIds) ? health.driftRuleIds.slice() : [],
  };
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

const health = readJsonSafe(STATUS_DOC_PATHS.health) || {};
const healthStatus = normalizeHealthStatus(health);
const trend = readJsonSafe(STATUS_DOC_PATHS.trend) || {};
const trendStatus = normalizeTrendStatus(trend);
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
  `${STATUS_LINE_LABELS.spellbookOk}: ${yn(healthStatus.spellbookOk)}`,
  `${STATUS_LINE_LABELS.interactionsOk}: ${yn(healthStatus.interactionsOk)}`,
  `${STATUS_LINE_LABELS.bootstrapUsesV2}: ${yn(healthStatus.bootstrapUsesV2Adapter)}`,
  `${STATUS_LINE_LABELS.rulesProjectionOnly}: ${yn(healthStatus.projectionRulesOnly)}`,
  `${STATUS_LINE_LABELS.rulesCount}: ${healthStatus.interactionsRuleCount}/${healthStatus.projectedRuleCount}`,
  `${STATUS_LINE_LABELS.driftIds}: ${healthStatus.driftRuleIds.length}`,
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

const statusArtifact = {
  schema: RULE_ENGINE_V2_SCHEMA_IDS.status,
  generatedAt: nowIso(),
  health: healthStatus,
  manifests: manifestArtifacts.booleans,
  readyPhases: readyPhases.booleans,
  regressions: regressions.booleans,
  contracts: contracts.booleans,
  summary: {
    readyPhasesOk: readyPhases.results.ok,
    regressionsOk: regressions.results.ok,
    contractsOk: contracts.results.ok,
  },
  trend: trendStatus,
};

const statusPath = STATUS_DOC_PATHS.status;
writeJsonFile(statusPath, statusArtifact);
logStatus(`wrote status: ${statusPath}`);
