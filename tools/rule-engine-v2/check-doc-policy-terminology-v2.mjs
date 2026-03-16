import { failCheck } from "./check-fail-v2.mjs";
import { assertSingletonRegistryV2 } from "./assert-singleton-registry-v2.mjs";
import {
  POLICY_AUTHORING_DOC_RELS_V2,
  POLICY_SCHEMA_DOC_RELS_V2,
} from "./policy-targets-v2.mjs";
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

const CHECK_TAG = "doc-policy-terminology:v2";
const LABELS = Object.freeze({
  authoringDoc: "policy authoring doc",
  schemaDocRelRegistry: "policy schema doc rel registry",
});

assertPolicyTokenContractAcrossTargetsV2({
  tag: CHECK_TAG,
  targets: POLICY_AUTHORING_DOC_RELS_V2,
  label: LABELS.authoringDoc,
  requiredTokens: [RULE_ENGINE_POLICY_CONTROL_TOKEN_V2],
  forbiddenTokens: [
    RULE_ENGINE_MASTER_CONTROL_PROJECTION_TOKEN_V2,
    RULE_ENGINE_MASTER_CONTROL_TOKEN_V2,
  ],
  missingMessage: (token, rel) => `${rel} must mention ${token}`,
  forbiddenMessage: (token, rel) =>
    token === RULE_ENGINE_MASTER_CONTROL_PROJECTION_TOKEN_V2
      ? `${rel} contains deprecated token: ${token}`
      : `${rel} must not reference ${token}`,
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
  missingMessage: (token) => `${schemaDocRel} must mention ${token}`,
  forbiddenMessage: (token) => `${schemaDocRel} contains deprecated token: ${token}`,
});
const masterMentions = schemaDocText.match(new RegExp(RULE_ENGINE_MASTER_CONTROL_TOKEN_V2, "g")) ?? [];
if (masterMentions.length !== 1) {
  failCheck(
    CHECK_TAG,
    `${schemaDocRel} must contain exactly one ${RULE_ENGINE_MASTER_CONTROL_TOKEN_V2} compatibility mention`
  );
}
if (!schemaDocText.includes(RULE_ENGINE_MASTER_CONTROL_COMPAT_ALIAS_LINE_V2)) {
  failCheck(CHECK_TAG, `${schemaDocRel} compatibility alias line missing`);
}

reportCheckPass(CHECK_TAG, "active docs use policy-first projection flag naming");
