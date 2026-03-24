import { reportCheckPass } from "./check-pass-v2.mjs";
import { readDocsIndexV2 } from "./read-docs-index-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

// Verifies docs index includes active orchestrator-v2 schema references.
const CHECK_TAG = "docs-index-orchestrator-links:v2";
const { rel: docsIndexRel, text } = readDocsIndexV2();
const ORCH_V2_SCHEMA_TOKEN = "[Orchestrator v2 Schema (Draft)]";
const ORCH_V2_VALIDATOR_TOKEN = "[Orchestrator v2 Validator Checklist (Draft)]";
const PASS_MESSAGE = "docs index includes orchestrator v2 schema links";

const requiredTokens = Object.freeze([
  ORCH_V2_SCHEMA_TOKEN,
  ORCH_V2_VALIDATOR_TOKEN,
]);

requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: requiredTokens,
  missingMessage: (token) => `${docsIndexRel} missing required token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
