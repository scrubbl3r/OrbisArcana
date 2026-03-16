import { RULE_ENGINE_SOURCES } from "../../src/runtime/receiver-bootstrap.js";
import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";

const CHECK_TAG = "compatibility-doc-source-ids:v2";
const docRel = RULE_ENGINE_V2_DOC_PATHS.ruleEngineCompatibilityDoc;
const text = readRelativeText(docRel);

if (!text.includes("Projection-only rule execution: enabled")) {
  failCheck(CHECK_TAG, `${docRel} must describe projection-only execution`);
}

for (const sourceId of Object.values(RULE_ENGINE_SOURCES)) {
  if (!text.includes(`\`${sourceId}\``)) {
    failCheck(CHECK_TAG, `${docRel} missing runtime source id: ${sourceId}`);
  }
}

reportCheckPass(CHECK_TAG, "compatibility doc lists all canonical runtime source ids");
