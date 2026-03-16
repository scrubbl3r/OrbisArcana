import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import {
  docsIndexLinkTokenForRelPathV2,
  docsIndexOwnershipTokenForRelPathV2,
} from "./docs-index-tokens-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readDocsIndexV2 } from "./read-docs-index-v2.mjs";

const CHECK_TAG = "docs-index-orchestrator-links:v2";
const { rel: docsIndexRel, text } = readDocsIndexV2();
const projectionRel = RULE_ENGINE_V2_DOC_PATHS.orchestratorProjectionJson;

const requiredTokens = Object.freeze([
  "[Orchestrator Projection]",
  "Effective Interactions Snapshot` and `Orchestrator Projection`",
  docsIndexLinkTokenForRelPathV2(projectionRel),
  docsIndexOwnershipTokenForRelPathV2(projectionRel),
]);

for (const token of requiredTokens) {
  if (!text.includes(token)) {
    failCheck(CHECK_TAG, `${docsIndexRel} missing required token: ${token}`);
  }
}

reportCheckPass(CHECK_TAG, "docs index includes orchestrator projection links");
