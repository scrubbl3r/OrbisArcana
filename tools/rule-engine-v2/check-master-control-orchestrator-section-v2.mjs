import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { readJsonOrFail } from "./check-json-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import {
  INTERACTIONS_V2,
  projectOrchestratorV1FromInteractionsV2,
} from "../../src/content/interactions-v2/index.js";
import { getInteractionsRules } from "./interactions-v2-utils.mjs";

const CHECK_TAG = "master-control-orchestrator-section:v2";

const doc = readJsonOrFail(CHECK_TAG, RULE_ENGINE_V2_DOC_PATHS.masterControlJson);
if (!doc || typeof doc !== "object") {
  failCheck(CHECK_TAG, "master-control json root missing");
}

const section = doc.orchestratorProjection;
if (!section || typeof section !== "object") {
  failCheck(CHECK_TAG, "master-control json missing orchestratorProjection section");
}

const expectedProjection = projectOrchestratorV1FromInteractionsV2(INTERACTIONS_V2);
const expectedRules = Array.isArray(expectedProjection?.rules) ? expectedProjection.rules : [];
const expectedInteractionsRules = getInteractionsRules(INTERACTIONS_V2);
const sectionVersion = typeof section.version === "string" ? section.version : "";
const expectedVersion = typeof expectedProjection?.version === "string" ? expectedProjection.version : "";

if (sectionVersion !== expectedVersion) {
  failCheck(CHECK_TAG, `orchestratorProjection.version mismatch: ${section.version}`);
}
if (section.enabled !== (expectedProjection?.enabled !== false)) {
  failCheck(CHECK_TAG, `orchestratorProjection.enabled mismatch: ${section.enabled}`);
}
const sectionRuleCount = Number(section.ruleCount);
if (sectionRuleCount !== expectedRules.length) {
  failCheck(CHECK_TAG, `orchestratorProjection.ruleCount mismatch: ${section.ruleCount}`);
}
const expectedParity = expectedRules.length === expectedInteractionsRules.length;
if (section.parityWithInteractionsRuleCount !== expectedParity) {
  failCheck(
    CHECK_TAG,
    `orchestratorProjection.parityWithInteractionsRuleCount mismatch: ${section.parityWithInteractionsRuleCount}`
  );
}

reportCheckPass(CHECK_TAG, "master-control orchestrator projection section is present and valid");
