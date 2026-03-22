import { failCheck } from "./check-fail-v2.mjs";
import { assertSingletonRegistryV2 } from "./assert-singleton-registry-v2.mjs";
import { POLICY_AUTHORING_DOC_RELS_V2, POLICY_SCHEMA_DOC_RELS_V2 } from "./policy-targets-v2.mjs";
import {
  RULE_ENGINE_MASTER_CONTROL_COMPAT_ALIAS_LINE_V2,
  RULE_ENGINE_MASTER_CONTROL_PROJECTION_TOKEN_V2,
  RULE_ENGINE_MASTER_CONTROL_TOKEN_V2,
  RULE_ENGINE_POLICY_CONTROL_TOKEN_V2,
} from "./policy-terms-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { assertPolicyTokenContractAcrossTargetsV2 } from "./check-policy-targets-token-contract-v2.mjs";
import { assertPolicyTokenContractV2 } from "./check-policy-token-contract-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";

// Enforces policy-first terminology across active docs and schema registries.
const CHECK_TAG = "doc-policy-terminology:v2";
const LABELS = Object.freeze({
  authoringDoc: "policy authoring doc",
  schemaDocRelRegistry: "policy schema doc rel registry",
});
const DEPRECATED_TOKEN_LABEL = "contains deprecated token";
const MUST_MENTION_LABEL = "must mention";
const MUST_NOT_REFERENCE_LABEL = "must not reference";
const PASS_MESSAGE = "active docs use policy-first projection flag naming";

function mustMentionMessage(rel, token) {
  return `${rel} ${MUST_MENTION_LABEL} ${token}`;
}

function deprecatedTokenMessage(rel, token) {
  return `${rel} ${DEPRECATED_TOKEN_LABEL}: ${token}`;
}

function countLiteralOccurrences(text, token) {
  if (typeof text !== "string" || typeof token !== "string" || !token) return 0;
  let count = 0;
  let index = 0;
  while (true) {
    const found = text.indexOf(token, index);
    if (found < 0) break;
    count += 1;
    index = found + token.length;
  }
  return count;
}

assertPolicyTokenContractAcrossTargetsV2({
  tag: CHECK_TAG,
  targets: POLICY_AUTHORING_DOC_RELS_V2,
  label: LABELS.authoringDoc,
  requiredTokens: [RULE_ENGINE_POLICY_CONTROL_TOKEN_V2],
  forbiddenTokens: [
    RULE_ENGINE_MASTER_CONTROL_PROJECTION_TOKEN_V2,
    RULE_ENGINE_MASTER_CONTROL_TOKEN_V2,
  ],
  missingMessage: (token, rel) => mustMentionMessage(rel, token),
  forbiddenMessage: (token, rel) =>
    token === RULE_ENGINE_MASTER_CONTROL_PROJECTION_TOKEN_V2
      ? deprecatedTokenMessage(rel, token)
      : `${rel} ${MUST_NOT_REFERENCE_LABEL} ${token}`,
});

assertSingletonRegistryV2({
  tag: CHECK_TAG,
  values: POLICY_SCHEMA_DOC_RELS_V2,
  label: LABELS.schemaDocRelRegistry,
});
const schemaDocRel = POLICY_SCHEMA_DOC_RELS_V2[0];
const schemaDocText = readRelativeText(schemaDocRel);
assertPolicyTokenContractV2({
  tag: CHECK_TAG,
  rel: schemaDocRel,
  text: schemaDocText,
  requiredTokens: [RULE_ENGINE_POLICY_CONTROL_TOKEN_V2],
  forbiddenTokens: [RULE_ENGINE_MASTER_CONTROL_PROJECTION_TOKEN_V2],
  missingMessage: (token) => mustMentionMessage(schemaDocRel, token),
  forbiddenMessage: (token) => deprecatedTokenMessage(schemaDocRel, token),
});
const masterMentions = countLiteralOccurrences(schemaDocText, RULE_ENGINE_MASTER_CONTROL_TOKEN_V2);
if (masterMentions !== 1) {
  failCheck(
    CHECK_TAG,
    `${schemaDocRel} must contain exactly one ${RULE_ENGINE_MASTER_CONTROL_TOKEN_V2} compatibility mention`
  );
}
if (!schemaDocText.includes(RULE_ENGINE_MASTER_CONTROL_COMPAT_ALIAS_LINE_V2)) {
  failCheck(CHECK_TAG, `${schemaDocRel} compatibility alias line missing`);
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
