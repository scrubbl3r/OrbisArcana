// Pre-smoke gate + runtime/projection health-artifact writer used by ready/status flows.
import { resolveRuleEngineDocPath } from "./docs-paths-v2.mjs";
import { readJsonSafe } from "./read-json-safe-v2.mjs";
import { runCheckScriptOrFailStatus } from "./run-check-fail-status-v2.mjs";
import { RULE_ENGINE_V2_SCRIPT_PATHS } from "./script-paths-v2.mjs";
import { writeJsonFile } from "./write-json-v2.mjs";
import { nowIso } from "./now-iso-v2.mjs";
import { isTrue } from "./bool-utils-v2.mjs";
import { RULE_ENGINE_V2_SCHEMA_IDS } from "./schema-ids-v2.mjs";
import {
  COMPILED_INTERACTION_GRAPH_V2_BOOTSTRAP,
  buildRuleEngineFromCompiledInteractionGraphV2,
} from "../../src/content/interactions-v2/index.js";
import { createTaggedLogger } from "./log-tag-v2.mjs";
// Doctor writes one consolidated health artifact consumed by status/ready checks.
const CHECK_TAG = "doctor:v2";
const logDoctor = createTaggedLogger(CHECK_TAG);

runCheckScriptOrFailStatus({
  tag: CHECK_TAG,
  message: "pre-smoke failed",
  script: RULE_ENGINE_V2_SCRIPT_PATHS.preSmokeCheck,
});

const snapshot = readJsonSafe(resolveRuleEngineDocPath("effectiveSnapshot"));
const authoredRuleCount = Number(snapshot?.counts?.orchestratorV2Rules ?? 0);
const compiledRuleCount = Number(snapshot?.counts?.compiledRuleEngineRules ?? 0);
const wordbookOk = isTrue(snapshot?.validation?.wordbookV2?.ok);
const dreamConfigOk = isTrue(snapshot?.validation?.dreamConfigV2?.ok);
const orchestratorOk = isTrue(snapshot?.validation?.orchestratorV2?.ok);
const orchestratorV2BootstrapEnabled = isTrue(COMPILED_INTERACTION_GRAPH_V2_BOOTSTRAP?.useInReceiverBootstrap);
let orchestratorProjectedRuleCount = 0;
let orchestratorProjectionParityOk = false;
try {
  const compiled = buildRuleEngineFromCompiledInteractionGraphV2();
  const compiledRules = Array.isArray(compiled?.rules) ? compiled.rules : [];
  orchestratorProjectedRuleCount = compiledRules.length;
  orchestratorProjectionParityOk = (
    compiledRules.length === authoredRuleCount &&
    compiledRules.length === compiledRuleCount
  );
} catch (_) {
  orchestratorProjectedRuleCount = 0;
  orchestratorProjectionParityOk = false;
}
const health = {
  schema: RULE_ENGINE_V2_SCHEMA_IDS.health,
  generatedAt: nowIso(),
  wordbookOk,
  dreamConfigOk,
  orchestratorOk,
  orchestratorV2BootstrapEnabled,
  projectionRulesOnly: true,
  authoredRuleCount,
  compiledRuleCount,
  orchestratorProjectedRuleCount,
  orchestratorProjectionParityOk,
  driftRuleIds: [],
};
const healthPath = resolveRuleEngineDocPath("health");
writeJsonFile(healthPath, health);

logDoctor("----");
logDoctor(`wordbook ok: ${wordbookOk}`);
logDoctor(`dream config ok: ${dreamConfigOk}`);
logDoctor(`orchestrator ok: ${orchestratorOk}`);
logDoctor(`orchestrator bootstrap enabled: ${orchestratorV2BootstrapEnabled}`);
logDoctor("rules mode: projection_only");
logDoctor(`rules count (authored/compiled): ${authoredRuleCount}/${compiledRuleCount}`);
logDoctor(`orchestrator projected rules: ${orchestratorProjectedRuleCount}`);
logDoctor(`orchestrator projection parity: ${orchestratorProjectionParityOk}`);
logDoctor("runtime-projection drift ids: 0");
logDoctor(`wrote health: ${healthPath}`);
logDoctor("----");
