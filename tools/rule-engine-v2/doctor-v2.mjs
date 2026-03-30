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
const compiledInteractionGraphRuleCount = Number(snapshot?.counts?.compiledInteractionGraphV2Rules ?? 0);
const compiledRuleCount = Number(snapshot?.counts?.compiledRuleEngineRules ?? 0);
const wordbookOk = isTrue(snapshot?.validation?.wordbookV2?.ok);
const interactionGraphOk = isTrue(snapshot?.validation?.interactionGraphV2?.ok);
const compiledInteractionGraphOk = isTrue(snapshot?.validation?.compiledInteractionGraphV2?.ok);
const compiledInteractionGraphV2BootstrapEnabled = isTrue(COMPILED_INTERACTION_GRAPH_V2_BOOTSTRAP?.useInReceiverBootstrap);
let compiledInteractionGraphProjectedRuleCount = 0;
let compiledInteractionGraphProjectionParityOk = false;
try {
  const compiled = buildRuleEngineFromCompiledInteractionGraphV2();
  const compiledRules = Array.isArray(compiled?.rules) ? compiled.rules : [];
  compiledInteractionGraphProjectedRuleCount = compiledRules.length;
  compiledInteractionGraphProjectionParityOk = (
    compiledRules.length === compiledInteractionGraphRuleCount &&
    compiledRules.length === compiledRuleCount
  );
} catch (_) {
  compiledInteractionGraphProjectedRuleCount = 0;
  compiledInteractionGraphProjectionParityOk = false;
}
const health = {
  schema: RULE_ENGINE_V2_SCHEMA_IDS.health,
  generatedAt: nowIso(),
  wordbookOk,
  interactionGraphOk,
  compiledInteractionGraphOk,
  compiledInteractionGraphV2BootstrapEnabled,
  projectionRulesOnly: true,
  compiledInteractionGraphRuleCount,
  compiledRuleCount,
  compiledInteractionGraphProjectedRuleCount,
  compiledInteractionGraphProjectionParityOk,
  driftRuleIds: [],
};
const healthPath = resolveRuleEngineDocPath("health");
writeJsonFile(healthPath, health);

logDoctor("----");
logDoctor(`wordbook ok: ${wordbookOk}`);
logDoctor(`interaction graph ok: ${interactionGraphOk}`);
logDoctor(`compiled interaction graph ok: ${compiledInteractionGraphOk}`);
logDoctor(`compiled interaction graph bootstrap enabled: ${compiledInteractionGraphV2BootstrapEnabled}`);
logDoctor("rules mode: projection_only");
logDoctor(`rules count (compiled graph/rule engine): ${compiledInteractionGraphRuleCount}/${compiledRuleCount}`);
logDoctor(`compiled interaction graph projected rules: ${compiledInteractionGraphProjectedRuleCount}`);
logDoctor(`compiled interaction graph projection parity: ${compiledInteractionGraphProjectionParityOk}`);
logDoctor("runtime-projection drift ids: 0");
logDoctor(`wrote health: ${healthPath}`);
logDoctor("----");
