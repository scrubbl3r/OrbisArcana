import { RULE_ENGINE_SOURCES } from "../../src/runtime/receiver-bootstrap.js";
import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";

const CHECK_TAG = "compatibility-doc-source-ids:v2";
const docRel = RULE_ENGINE_V2_DOC_PATHS.ruleEngineCompatibilityDoc;
const text = readRelativeText(docRel);
const requiredTokens = Object.freeze([
  "Projection-only rule execution: enabled",
  ...Object.values(RULE_ENGINE_SOURCES).map((sourceId) => `\`${sourceId}\``),
]);

requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: requiredTokens,
  missingMessage: (token) => `${docRel} missing required compatibility token: ${token}`,
});

reportCheckPass(CHECK_TAG, "compatibility doc lists all canonical runtime source ids");
