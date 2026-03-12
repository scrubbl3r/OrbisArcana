import {
  getCheckManifestEntriesV2,
  getCheckManifestValidatorsByOrderV2,
} from "./check-manifests-v2.mjs";
import { resolveRuleEngineDocPath } from "./docs-paths-v2.mjs";
import { runCheckScript } from "./run-check-v2.mjs";
import { readJsonSafe } from "./read-json-safe-v2.mjs";
import { isTrue } from "./bool-utils-v2.mjs";
import { toNumberOr, toTrimmedText } from "./value-utils-v2.mjs";
import { formatCheckStatusList } from "./status-format-v2.mjs";
import {
  buildCheckBooleanMap,
  buildCheckResults,
  buildBooleanMapFromOrder,
  formatOrderedBooleanSummary,
} from "./status-checks-v2.mjs";
import { writeJsonFile } from "./write-json-v2.mjs";
import { nowIso } from "./now-iso-v2.mjs";
import { RULE_ENGINE_V2_SCHEMA_IDS } from "./schema-ids-v2.mjs";
import { createTaggedLogger } from "./log-tag-v2.mjs";

const CHECK_TAG = "status:v2";
const logStatus = createTaggedLogger(CHECK_TAG);

function yn(v) {
  return v ? "yes" : "no";
}

function runCheck(scriptPath) {
  return runCheckScript(scriptPath, { stdio: "ignore" }).ok;
}

const health = readJsonSafe(resolveRuleEngineDocPath("health")) || {};
const trend = readJsonSafe(resolveRuleEngineDocPath("milestoneTrend")) || {};
const READY_PHASES_V2 = getCheckManifestEntriesV2("ready");
const REGRESSION_CHECKS_V2 = getCheckManifestEntriesV2("regression");
const CONTRACT_CHECKS_V2 = getCheckManifestEntriesV2("contract");
const manifestValidators = getCheckManifestValidatorsByOrderV2();
const manifestValidatorOrder = manifestValidators.map((v) => v.name);
const manifestChecks = Object.freeze(
  Object.fromEntries(
    manifestValidators.map((v) => [v.name, runCheck(v.script)])
  )
);
const manifestBooleans = buildBooleanMapFromOrder(
  manifestValidatorOrder,
  manifestChecks
);
const manifestStatusSummary = formatOrderedBooleanSummary(
  manifestValidatorOrder,
  manifestChecks,
  yn
);
const readyPhaseResults = buildCheckResults(READY_PHASES_V2, runCheck);
const readyPhaseStatusList = formatCheckStatusList(READY_PHASES_V2, readyPhaseResults.byId, yn);
const contractResults = buildCheckResults(CONTRACT_CHECKS_V2, runCheck);
const contractStatusList = formatCheckStatusList(CONTRACT_CHECKS_V2, contractResults.byId, yn);
const regressionResults = buildCheckResults(REGRESSION_CHECKS_V2, runCheck);
const regressionStatusList = formatCheckStatusList(REGRESSION_CHECKS_V2, regressionResults.byId, yn);

const lines = [
  "---",
  `spellbook ok: ${yn(isTrue(health.spellbookOk))}`,
  `interactions ok: ${yn(isTrue(health.interactionsOk))}`,
  `bootstrap uses v2: ${yn(isTrue(health.bootstrapUsesV2Adapter))}`,
  `rules projection only: ${yn(isTrue(health.projectionRulesOnly))}`,
  `rules (interactions/projection): ${toNumberOr(health.interactionsRuleCount)}/${toNumberOr(health.projectedRuleCount)}`,
  `drift ids: ${Array.isArray(health.driftRuleIds) ? health.driftRuleIds.length : 0}`,
  `manifests (ready/contract/regression): ${manifestStatusSummary}`,
  `ready phases ok: ${yn(readyPhaseResults.ok)}`,
  `ready phases: ${readyPhaseStatusList}`,
  `regressions ok: ${yn(regressionResults.ok)}`,
  `regressions: ${regressionStatusList}`,
  `contracts ok: ${yn(contractResults.ok)}`,
  `contracts: ${contractStatusList}`,
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
  manifests: manifestBooleans,
  readyPhases: buildCheckBooleanMap(READY_PHASES_V2, readyPhaseResults.byId),
  regressions: buildCheckBooleanMap(REGRESSION_CHECKS_V2, regressionResults.byId),
  contracts: buildCheckBooleanMap(CONTRACT_CHECKS_V2, contractResults.byId),
  summary: {
    readyPhasesOk: readyPhaseResults.ok,
    regressionsOk: regressionResults.ok,
    contractsOk: contractResults.ok,
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
