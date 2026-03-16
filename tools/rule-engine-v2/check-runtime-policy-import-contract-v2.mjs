import { reportCheckPass } from "./check-pass-v2.mjs";
import {
  RULE_ENGINE_MASTER_CONTROL_TOKEN_V2,
  RULE_ENGINE_POLICY_CONTROL_TOKEN_V2,
} from "./policy-terms-v2.mjs";
import { POLICY_RUNTIME_IMPORT_TARGETS_V2 } from "./policy-targets-v2.mjs";
import { assertPolicyTokenContractV2 } from "./check-policy-token-contract-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";

const CHECK_TAG = "runtime-policy-import-contract:v2";
const targets = POLICY_RUNTIME_IMPORT_TARGETS_V2;

const forbidden = RULE_ENGINE_MASTER_CONTROL_TOKEN_V2;
const required = RULE_ENGINE_POLICY_CONTROL_TOKEN_V2;

for (const rel of targets) {
  const text = readRelativeText(rel);
  assertPolicyTokenContractV2({
    tag: CHECK_TAG,
    rel,
    text,
    requiredTokens: [required],
    forbiddenTokens: [forbidden],
  });
}

reportCheckPass(CHECK_TAG, "runtime imports policy control only");
