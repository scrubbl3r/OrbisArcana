import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { docsIndexLinkTokensForRelPathsV2, docsIndexOwnershipTokensForRelPathsV2 } from "./docs-index-tokens-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readDocsIndexV2 } from "./read-docs-index-v2.mjs";
import { requireSingleTokenV2 } from "./check-token-list-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

// Verifies docs index includes orchestrator schema/recipes/projection references.
const CHECK_TAG = "docs-index-orchestrator-links:v2";
const { rel: docsIndexRel, text } = readDocsIndexV2();
const projectionRel = RULE_ENGINE_V2_DOC_PATHS.orchestratorProjectionJson;
const PROJECTION_LINK_TOKEN_ERROR = "projection link token generation failed";
const PROJECTION_OWNERSHIP_TOKEN_ERROR = "projection ownership token generation failed";
const ORCH_SCHEMA_TOKEN = "[Orchestrator v1 DSL Schema]";
const ORCH_RECIPES_TOKEN = "[Orchestrator v1 DSL Recipes]";
const ORCH_PROJECTION_TOKEN = "[Orchestrator Projection]";
const SNAPSHOT_PROJECTION_TOKEN = "Effective Interactions Snapshot` and `Orchestrator Projection`";
const PASS_MESSAGE = "docs index includes orchestrator projection and schema links";
const projectionLinkToken = requireSingleTokenV2({
  tag: CHECK_TAG,
  tokens: docsIndexLinkTokensForRelPathsV2([projectionRel]),
  emptyMessage: PROJECTION_LINK_TOKEN_ERROR,
  invalidMessage: PROJECTION_LINK_TOKEN_ERROR,
});
const projectionOwnershipToken = requireSingleTokenV2({
  tag: CHECK_TAG,
  tokens: docsIndexOwnershipTokensForRelPathsV2([projectionRel]),
  emptyMessage: PROJECTION_OWNERSHIP_TOKEN_ERROR,
  invalidMessage: PROJECTION_OWNERSHIP_TOKEN_ERROR,
});

const requiredTokens = Object.freeze([
  ORCH_SCHEMA_TOKEN,
  ORCH_RECIPES_TOKEN,
  ORCH_PROJECTION_TOKEN,
  SNAPSHOT_PROJECTION_TOKEN,
  projectionLinkToken,
  projectionOwnershipToken,
]);

requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: requiredTokens,
  missingMessage: (token) => `${docsIndexRel} missing required token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
