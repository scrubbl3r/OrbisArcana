import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";

const CHECK_TAG = "docs-index-orchestrator-links:v2";
const docsIndexRel = RULE_ENGINE_V2_DOC_PATHS.docsIndex;
const text = readRelativeText(docsIndexRel);

const requiredTokens = Object.freeze([
  "[Orchestrator Projection](./orchestrator-v1.projection.json)",
  "Effective Interactions Snapshot` and `Orchestrator Projection`",
  "`docs/orchestrator-v1.projection.json`",
]);

for (const token of requiredTokens) {
  if (!text.includes(token)) {
    failCheck(CHECK_TAG, `${docsIndexRel} missing required token: ${token}`);
  }
}

reportCheckPass(CHECK_TAG, "docs index includes orchestrator projection links");
