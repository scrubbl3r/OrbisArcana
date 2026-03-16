import { reportCheckPass } from "./check-pass-v2.mjs";
import {
  RULE_ENGINE_MASTER_CONTROL_TOKEN_V2,
  RULE_ENGINE_POLICY_CONTROL_TOKEN_V2,
} from "./policy-terms-v2.mjs";
import { POLICY_VALIDATOR_TARGET_V2 } from "./policy-targets-v2.mjs";
import {
  requireTextExcludesTokensV2,
  requireTextIncludesTokensV2,
} from "./check-token-assertions-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";

const CHECK_TAG = "validator-policy-terminology:v2";
const rel = POLICY_VALIDATOR_TARGET_V2;
const text = readRelativeText(rel);

requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [RULE_ENGINE_POLICY_CONTROL_TOKEN_V2],
  missingMessage: (token) => `${rel} must reference ${token} in diagnostics`,
});
requireTextExcludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [RULE_ENGINE_MASTER_CONTROL_TOKEN_V2],
  forbiddenMessage: (token) => `${rel} must not reference ${token}`,
});

reportCheckPass(CHECK_TAG, "validator diagnostics use policy control naming");
