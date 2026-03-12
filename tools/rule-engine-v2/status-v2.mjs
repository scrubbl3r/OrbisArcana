import { READY_PHASES_V2 } from "./ready-phases-v2.mjs";
import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";
import {
  MANIFEST_VALIDATORS_V2,
  MANIFEST_VALIDATOR_NAMES_V2,
} from "./manifest-validators-v2.mjs";
import { resolveRuleEngineDocPath } from "./docs-paths-v2.mjs";
import { runCheckScript } from "./run-check-v2.mjs";
import { readJsonSafe } from "./read-json-safe-v2.mjs";
import { isTrue } from "./bool-utils-v2.mjs";
import { toNumberOr, toTrimmedText } from "./value-utils-v2.mjs";
import {
  buildCheckResultsByKey,
  buildStatusSectionV2,
  buildOrderedBooleanArtifacts,
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
const manifestValidatorOrder = MANIFEST_VALIDATOR_NAMES_V2;
const manifestChecks = buildCheckResultsByKey(MANIFEST_VALIDATORS_V2, runCheck, "name").byKey;
const manifestArtifacts = buildOrderedBooleanArtifacts(
  manifestValidatorOrder,
  manifestChecks,
  yn
);
const readyPhaseSection = buildStatusSectionV2(READY_PHASES_V2, runCheck, yn);
const contractSection = buildStatusSectionV2(CONTRACT_CHECKS_V2, runCheck, yn);
const regressionSection = buildStatusSectionV2(REGRESSION_CHECKS_V2, runCheck, yn);

const lines = [
  "---",
  `spellbook ok: ${yn(isTrue(health.spellbookOk))}`,
  `interactions ok: ${yn(isTrue(health.interactionsOk))}`,
  `bootstrap uses v2: ${yn(isTrue(health.bootstrapUsesV2Adapter))}`,
  `rules projection only: ${yn(isTrue(health.projectionRulesOnly))}`,
  `rules (interactions/projection): ${toNumberOr(health.interactionsRuleCount)}/${toNumberOr(health.projectedRuleCount)}`,
  `drift ids: ${Array.isArray(health.driftRuleIds) ? health.driftRuleIds.length : 0}`,
  `manifests (ready/contract/regression): ${manifestArtifacts.summary}`,
  `ready phases ok: ${yn(readyPhaseSection.results.ok)}`,
  `ready phases: ${readyPhaseSection.statusList}`,
  `regressions ok: ${yn(regressionSection.results.ok)}`,
  `regressions: ${regressionSection.statusList}`,
  `contracts ok: ${yn(contractSection.results.ok)}`,
  `contracts: ${contractSection.statusList}`,
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
  readyPhases: readyPhaseSection.booleans,
  regressions: regressionSection.booleans,
  contracts: contractSection.booleans,
  summary: {
    readyPhasesOk: readyPhaseSection.results.ok,
    regressionsOk: regressionSection.results.ok,
    contractsOk: contractSection.results.ok,
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
