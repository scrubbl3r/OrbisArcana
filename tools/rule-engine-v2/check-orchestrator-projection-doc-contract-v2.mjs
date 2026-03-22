import { resolveRuleEngineDocPath } from "./docs-paths-v2.mjs";
import { readJsonCore } from "./read-json-core-v2.mjs";
import { failCheck, failCheckWithDetails } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { RULE_ENGINE_V2_SCHEMA_IDS } from "./schema-ids-v2.mjs";
import {
  INTERACTIONS_V2,
  INTERACTIONS_V2_BOOTSTRAP,
  projectOrchestratorV1FromInteractionsV2,
  validateOrchestratorV1,
} from "../../src/content/interactions-v2/index.js";

// Validates projection artifact schema/source and parity against live interactions projection.
const CHECK_TAG = "orchestrator-projection-doc-contract:v2";
const PASS_MESSAGE = "orchestrator projection doc is current and valid";
const LEGACY_OPTIONAL_PASS_MESSAGE = "orchestrator projection doc is legacy-optional when interactions bootstrap is disabled";

const interactionsBootstrapEnabled = !!(
  INTERACTIONS_V2_BOOTSTRAP &&
  INTERACTIONS_V2_BOOTSTRAP.useInReceiverBootstrap === true
);
if (!interactionsBootstrapEnabled) {
  reportCheckPass(CHECK_TAG, LEGACY_OPTIONAL_PASS_MESSAGE);
  process.exit(0);
}

const docPath = resolveRuleEngineDocPath("orchestratorProjectionJson");
const loaded = readJsonCore(docPath);
if (!loaded.ok) {
  const msg = loaded.error instanceof Error && typeof loaded.error.message === "string" && loaded.error.message
    ? loaded.error.message
    : "unknown error";
  failCheck(CHECK_TAG, `unable to read projection doc (${msg})`);
}

const doc = (loaded.value && typeof loaded.value === "object" && !Array.isArray(loaded.value))
  ? loaded.value
  : {};
const schema = typeof doc.schema === "string" ? doc.schema : "";
if (schema !== RULE_ENGINE_V2_SCHEMA_IDS.orchestratorProjection) {
  failCheck(CHECK_TAG, `unexpected schema: ${schema}`);
}
const source = typeof doc.source === "string" ? doc.source : "";
if (source !== "projected_from_interactions_v2") {
  failCheck(CHECK_TAG, `unexpected source: ${source}`);
}

const projection = doc.projection;
if (!projection || typeof projection !== "object") {
  failCheck(CHECK_TAG, "projection payload missing");
}

const validationErrors = validateOrchestratorV1(projection);
if (validationErrors.length) {
  failCheckWithDetails(CHECK_TAG, "projection payload invalid", validationErrors);
}

const expected = projectOrchestratorV1FromInteractionsV2(INTERACTIONS_V2);
const lhs = JSON.stringify(projection);
const rhs = JSON.stringify(expected);
if (lhs !== rhs) {
  failCheckWithDetails(CHECK_TAG, "projection doc drift from interactions projection", [
    `doc: ${lhs}`,
    `expected: ${rhs}`,
  ]);
}

const ruleCount = Array.isArray(projection.rules) ? projection.rules.length : 0;
const docRuleCount = Number(doc?.counts?.rules);
if (docRuleCount !== ruleCount) {
  failCheck(CHECK_TAG, `counts.rules mismatch: doc=${doc?.counts?.rules} actual=${ruleCount}`);
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
