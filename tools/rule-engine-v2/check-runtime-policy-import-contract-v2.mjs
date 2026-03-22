import { assertSingletonRegistryV2 } from "./assert-singleton-registry-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { RULE_ENGINE_MASTER_CONTROL_TOKEN_V2, RULE_ENGINE_POLICY_CONTROL_TOKEN_V2 } from "./policy-terms-v2.mjs";
import { POLICY_RUNTIME_IMPORT_TARGETS_V2 } from "./policy-targets-v2.mjs";
import { assertPolicyTokenContractAcrossTargetsV2 } from "./check-policy-targets-token-contract-v2.mjs";

// Confirms runtime targets import policy control token and avoid legacy master-control token.
const CHECK_TAG = "runtime-policy-import-contract:v2";
const PASS_MESSAGE = "runtime imports policy control only";
const LABELS = Object.freeze({
  targetRegistry: "policy runtime import target registry",
  target: "policy runtime import target",
});

assertSingletonRegistryV2({
  tag: CHECK_TAG,
  values: POLICY_RUNTIME_IMPORT_TARGETS_V2,
  label: LABELS.targetRegistry,
});

assertPolicyTokenContractAcrossTargetsV2({
  tag: CHECK_TAG,
  targets: POLICY_RUNTIME_IMPORT_TARGETS_V2,
  label: LABELS.target,
  requiredTokens: [RULE_ENGINE_POLICY_CONTROL_TOKEN_V2],
  forbiddenTokens: [RULE_ENGINE_MASTER_CONTROL_TOKEN_V2],
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
