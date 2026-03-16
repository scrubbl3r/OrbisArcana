import { reportCheckPass } from "./check-pass-v2.mjs";
import {
  RULE_ENGINE_MASTER_CONTROL_TOKEN_V2,
  RULE_ENGINE_POLICY_CONTROL_TOKEN_V2,
} from "./policy-terms-v2.mjs";
import { POLICY_VALIDATOR_TARGET_V2 } from "./policy-targets-v2.mjs";
import { assertPolicyTokenContractV2 } from "./check-policy-token-contract-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";

const CHECK_TAG = "validator-policy-terminology:v2";
const rel = POLICY_VALIDATOR_TARGET_V2;
const text = readRelativeText(rel);
assertPolicyTokenContractV2({
  tag: CHECK_TAG,
  rel,
  text,
  requiredTokens: [RULE_ENGINE_POLICY_CONTROL_TOKEN_V2],
  forbiddenTokens: [RULE_ENGINE_MASTER_CONTROL_TOKEN_V2],
  missingMessage: (token) => `${rel} must reference ${token} in diagnostics`,
});

reportCheckPass(CHECK_TAG, "validator diagnostics use policy control naming");
