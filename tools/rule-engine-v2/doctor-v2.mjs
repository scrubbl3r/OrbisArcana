import { resolveRuleEngineDocPath } from "./docs-paths-v2.mjs";
import { readJsonSafe } from "./read-json-safe-v2.mjs";
import { runCheckScriptOrFailStatus } from "./run-check-fail-status-v2.mjs";
import { RULE_ENGINE_V2_SCRIPT_PATHS } from "./script-paths-v2.mjs";
import { writeJsonFile } from "./write-json-v2.mjs";
import { nowIso } from "./now-iso-v2.mjs";
import { isTrue } from "./bool-utils-v2.mjs";
import { RULE_ENGINE_V2_SCHEMA_IDS } from "./schema-ids-v2.mjs";
import {
  INTERACTIONS_V2,
} from "../../src/content/interactions-v2/index.js";
import { computeProjectionDrift } from "./rules-projection-drift-v2.mjs";
import { createTaggedLogger } from "./log-tag-v2.mjs";

const CHECK_TAG = "doctor:v2";
const logDoctor = createTaggedLogger(CHECK_TAG);

runCheckScriptOrFailStatus({
  tag: CHECK_TAG,
  message: "pre-smoke failed",
  script: RULE_ENGINE_V2_SCRIPT_PATHS.preSmokeCheck,
});

const drift = computeProjectionDrift(INTERACTIONS_V2);
const driftIds = Array.isArray(drift?.driftIds) ? drift.driftIds : [];
const snapshot = readJsonSafe(resolveRuleEngineDocPath("effectiveSnapshot"));
const projectedRuleCount = Number(snapshot?.counts?.projectedRuleEngineRules ?? 0);
const spellbookOk = isTrue(snapshot?.validation?.spellbookV2?.ok);
const interactionsOk = isTrue(snapshot?.validation?.interactionsV2?.ok);
const bootstrapUsesV2Adapter = isTrue(snapshot?.flags?.interactionsV2Bootstrap?.useInReceiverBootstrap);
const health = {
  schema: RULE_ENGINE_V2_SCHEMA_IDS.health,
  generatedAt: nowIso(),
  spellbookOk,
  interactionsOk,
  bootstrapUsesV2Adapter,
  projectionRulesOnly: true,
  interactionsRuleCount: Number(snapshot?.counts?.interactionsV2Rules || 0),
  projectedRuleCount,
  driftRuleIds: driftIds,
};
const healthPath = resolveRuleEngineDocPath("health");
writeJsonFile(healthPath, health);

logDoctor("----");
logDoctor(`spellbook ok: ${spellbookOk}`);
logDoctor(`interactions ok: ${interactionsOk}`);
logDoctor(`bootstrap uses v2 adapter: ${bootstrapUsesV2Adapter}`);
logDoctor("rules mode: projection_only");
logDoctor(`rules count (interactions/projection): ${snapshot?.counts?.interactionsV2Rules || 0}/${projectedRuleCount}`);
logDoctor(`runtime-projection drift ids: ${driftIds.length}`);
if (driftIds.length) logDoctor(`drift: ${driftIds.join(", ")}`);
logDoctor(`wrote health: ${healthPath}`);
logDoctor("----");
