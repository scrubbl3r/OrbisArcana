import { assertSingletonRegistryV2 } from "./assert-singleton-registry-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { RULE_ENGINE_MASTER_CONTROL_TOKEN_V2, RULE_ENGINE_POLICY_CONTROL_TOKEN_V2 } from "./policy-terms-v2.mjs";
import { POLICY_VALIDATOR_TARGETS_V2 } from "./policy-targets-v2.mjs";
import { assertPolicyTokenContractAcrossTargetsV2 } from "./check-policy-targets-token-contract-v2.mjs";

const CHECK_TAG = "validator-policy-terminology:v2";
const LABELS = Object.freeze({
  targetRegistry: "policy validator target registry",
  target: "policy validator target",
});
const DIAGNOSTICS_LABEL = "diagnostics";
const MUST_REFERENCE_LABEL = "must reference";
const PASS_MESSAGE = "validator diagnostics use policy control naming";

assertSingletonRegistryV2({
  tag: CHECK_TAG,
  values: POLICY_VALIDATOR_TARGETS_V2,
  label: LABELS.targetRegistry,
});
assertPolicyTokenContractAcrossTargetsV2({
  tag: CHECK_TAG,
  targets: POLICY_VALIDATOR_TARGETS_V2,
  label: LABELS.target,
  requiredTokens: [RULE_ENGINE_POLICY_CONTROL_TOKEN_V2],
  forbiddenTokens: [RULE_ENGINE_MASTER_CONTROL_TOKEN_V2],
  missingMessage: (token, rel) => `${rel} ${MUST_REFERENCE_LABEL} ${token} in ${DIAGNOSTICS_LABEL}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
