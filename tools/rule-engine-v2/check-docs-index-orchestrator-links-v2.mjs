import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readDocsIndexV2 } from "./read-docs-index-v2.mjs";

const CHECK_TAG = "docs-index-orchestrator-links:v2";
const { rel: docsIndexRel, text } = readDocsIndexV2();

const requiredTokens = Object.freeze([
  "[Orchestrator Projection](./orchestrator-v1.projection.json)",
  "Effective Interactions Snapshot` and `Orchestrator Projection`",
  `\`${RULE_ENGINE_V2_DOC_PATHS.orchestratorProjectionJson}\``,
]);

for (const token of requiredTokens) {
  if (!text.includes(token)) {
    failCheck(CHECK_TAG, `${docsIndexRel} missing required token: ${token}`);
  }
}

reportCheckPass(CHECK_TAG, "docs index includes orchestrator projection links");
