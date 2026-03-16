import { docRelPathsForKeysV2, RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import {
  RULE_ENGINE_MASTER_CONTROL_PROJECTION_TOKEN_V2,
  RULE_ENGINE_MASTER_CONTROL_TOKEN_V2,
  RULE_ENGINE_POLICY_CONTROL_TOKEN_V2,
} from "./policy-terms-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import {
  requireTextExcludesTokensV2,
  requireTextIncludesTokensV2,
} from "./check-token-assertions-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";

const CHECK_TAG = "doc-policy-terminology:v2";
const requiredToken = RULE_ENGINE_POLICY_CONTROL_TOKEN_V2;
const forbiddenProjectionToken = RULE_ENGINE_MASTER_CONTROL_PROJECTION_TOKEN_V2;

const authoringDocs = Object.freeze(
  docRelPathsForKeysV2(["ruleEngineAuthoringDoc", "ruleEngineCompatibilityDoc"])
);

for (const rel of authoringDocs) {
  const text = readRelativeText(rel);
  requireTextIncludesTokensV2({
    tag: CHECK_TAG,
    text,
    tokens: [requiredToken],
    missingMessage: (token) => `${rel} must mention ${token}`,
  });
  requireTextExcludesTokensV2({
    tag: CHECK_TAG,
    text,
    tokens: [forbiddenProjectionToken, RULE_ENGINE_MASTER_CONTROL_TOKEN_V2],
    forbiddenMessage: (token) =>
      token === forbiddenProjectionToken
        ? `${rel} contains deprecated token: ${token}`
        : `${rel} must not reference ${token}`,
  });
}

const schemaDocRel = RULE_ENGINE_V2_DOC_PATHS.masterControlSchemaDoc;
const schemaDocText = readRelativeText(schemaDocRel);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text: schemaDocText,
  tokens: [requiredToken],
  missingMessage: (token) => `${schemaDocRel} must mention ${token}`,
});
requireTextExcludesTokensV2({
  tag: CHECK_TAG,
  text: schemaDocText,
  tokens: [forbiddenProjectionToken],
  forbiddenMessage: (token) => `${schemaDocRel} contains deprecated token: ${token}`,
});
const masterMentions = schemaDocText.match(/RULE_ENGINE_MASTER_CONTROL/g) || [];
if (masterMentions.length !== 1) {
  failCheck(CHECK_TAG, `${schemaDocRel} must contain exactly one RULE_ENGINE_MASTER_CONTROL compatibility mention`);
}
if (!schemaDocText.includes("compatibility alias: `RULE_ENGINE_MASTER_CONTROL`")) {
  failCheck(CHECK_TAG, `${schemaDocRel} compatibility alias line missing`);
}

reportCheckPass(CHECK_TAG, "active docs use policy-first projection flag naming");
