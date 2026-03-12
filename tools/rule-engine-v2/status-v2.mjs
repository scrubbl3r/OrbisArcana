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

const STATUS_SECTION_DEFS = Object.freeze([
  Object.freeze({ key: "readyPhases", entries: READY_PHASES_V2 }),
  Object.freeze({ key: "regressions", entries: REGRESSION_CHECKS_V2 }),
  Object.freeze({ key: "contracts", entries: CONTRACT_CHECKS_V2 }),
]);

const health = readJsonSafe(resolveRuleEngineDocPath("health")) || {};
const trend = readJsonSafe(resolveRuleEngineDocPath("milestoneTrend")) || {};
const manifestArtifacts = buildNamedManifestArtifacts(
  MANIFEST_VALIDATORS_V2,
  runCheckScriptOk,
  yn
);
const statusSections = buildStatusSections(STATUS_SECTION_DEFS, runCheckScriptOk, yn);

const lines = [
  "---",
  `spellbook ok: ${yn(isTrue(health.spellbookOk))}`,
  `interactions ok: ${yn(isTrue(health.interactionsOk))}`,
  `bootstrap uses v2: ${yn(isTrue(health.bootstrapUsesV2Adapter))}`,
  `rules projection only: ${yn(isTrue(health.projectionRulesOnly))}`,
  `rules (interactions/projection): ${toNumberOr(health.interactionsRuleCount)}/${toNumberOr(health.projectedRuleCount)}`,
  `drift ids: ${Array.isArray(health.driftRuleIds) ? health.driftRuleIds.length : 0}`,
  `manifests (ready/contract/regression): ${manifestArtifacts.summary}`,
  `ready phases ok: ${yn(statusSections.readyPhases.results.ok)}`,
  `ready phases: ${statusSections.readyPhases.statusList}`,
  `regressions ok: ${yn(statusSections.regressions.results.ok)}`,
  `regressions: ${statusSections.regressions.statusList}`,
  `contracts ok: ${yn(statusSections.contracts.results.ok)}`,
  `contracts: ${statusSections.contracts.statusList}`,
  `milestone runs: ${toNumberOr(trend.totalRuns)}`,
  `pass rate all/recent: ${toNumberOr(trend.passRateAllPct)}% / ${toNumberOr(trend.passRateRecentPct)}%`,
  `latest milestone: ${isTrue(trend.latestPass) ? "PASS" : "FAIL"} ${toTrimmedText(trend.latestGitRef)}`,
  "---",
];

for (const line of lines) logStatus(line);

const statusArtifact = {
  schema: RULE_ENGINE_V2_SCHEMA_IDS.status,
  generatedAt: nowIso(),
  health: {
    spellbookOk: isTrue(health.spellbookOk),
    interactionsOk: isTrue(health.interactionsOk),
    bootstrapUsesV2Adapter: isTrue(health.bootstrapUsesV2Adapter),
    projectionRulesOnly: isTrue(health.projectionRulesOnly),
    interactionsRuleCount: toNumberOr(health.interactionsRuleCount),
    projectedRuleCount: toNumberOr(health.projectedRuleCount),
    driftRuleIds: Array.isArray(health.driftRuleIds) ? health.driftRuleIds.slice() : [],
  },
  manifests: manifestArtifacts.booleans,
  readyPhases: statusSections.readyPhases.booleans,
  regressions: statusSections.regressions.booleans,
  contracts: statusSections.contracts.booleans,
  summary: {
    readyPhasesOk: statusSections.readyPhases.results.ok,
    regressionsOk: statusSections.regressions.results.ok,
    contractsOk: statusSections.contracts.results.ok,
  },
  trend: {
    totalRuns: toNumberOr(trend.totalRuns),
    passRateAllPct: toNumberOr(trend.passRateAllPct),
    passRateRecentPct: toNumberOr(trend.passRateRecentPct),
    latestPass: isTrue(trend.latestPass),
    latestGitRef: toTrimmedText(trend.latestGitRef),
  },
};

const statusPath = resolveRuleEngineDocPath("status");
writeJsonFile(statusPath, statusArtifact);
logStatus(`wrote status: ${statusPath}`);
