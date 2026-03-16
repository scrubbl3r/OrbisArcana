import { reportCheckPass } from "./check-pass-v2.mjs";
import {
  RULE_ENGINE_MASTER_CONTROL_TOKEN_V2,
  RULE_ENGINE_POLICY_CONTROL_TOKEN_V2,
} from "./policy-terms-v2.mjs";
import { POLICY_RUNTIME_IMPORT_TARGETS_V2 } from "./policy-targets-v2.mjs";
import {
  requireTextExcludesTokensV2,
  requireTextIncludesTokensV2,
} from "./check-token-assertions-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";

const CHECK_TAG = "runtime-policy-import-contract:v2";
const targets = POLICY_RUNTIME_IMPORT_TARGETS_V2;

const forbidden = RULE_ENGINE_MASTER_CONTROL_TOKEN_V2;
const required = RULE_ENGINE_POLICY_CONTROL_TOKEN_V2;

for (const rel of targets) {
  const text = readRelativeText(rel);
  requireTextExcludesTokensV2({
    tag: CHECK_TAG,
    text,
    tokens: [forbidden],
    forbiddenMessage: (token) => `${rel} must not reference ${token}`,
  });
  requireTextIncludesTokensV2({
    tag: CHECK_TAG,
    text,
    tokens: [required],
    missingMessage: (token) => `${rel} must reference ${token}`,
  });
}

reportCheckPass(CHECK_TAG, "runtime imports policy control only");
