import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import {
  docsIndexLinkTokensForRelPathsV2,
  docsIndexOwnershipTokensForRelPathsV2,
} from "./docs-index-tokens-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readDocsIndexV2 } from "./read-docs-index-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "docs-index-orchestrator-links:v2";
const { rel: docsIndexRel, text } = readDocsIndexV2();
const projectionRel = RULE_ENGINE_V2_DOC_PATHS.orchestratorProjectionJson;
const [projectionLinkToken] = docsIndexLinkTokensForRelPathsV2([projectionRel]);
const [projectionOwnershipToken] = docsIndexOwnershipTokensForRelPathsV2([projectionRel]);

const requiredTokens = Object.freeze([
  "[Orchestrator Projection]",
  "Effective Interactions Snapshot` and `Orchestrator Projection`",
  projectionLinkToken,
  projectionOwnershipToken,
]);

requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: requiredTokens,
  missingMessage: (token) => `${docsIndexRel} missing required token: ${token}`,
});

reportCheckPass(CHECK_TAG, "docs index includes orchestrator projection links");
