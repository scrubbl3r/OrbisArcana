export const CONTRACT_CHECKS_V2 = Object.freeze([
  Object.freeze({
    id: "rule_source",
    script: "tools/rule-engine-v2/check-rule-source-contract-v2.mjs",
  }),
  Object.freeze({
    id: "policy_alias",
    script: "tools/rule-engine-v2/check-policy-control-contract-v2.mjs",
  }),
  Object.freeze({
    id: "runtime_import",
    script: "tools/rule-engine-v2/check-runtime-policy-import-contract-v2.mjs",
  }),
  Object.freeze({
    id: "doc_policy",
    script: "tools/rule-engine-v2/check-doc-policy-terminology-v2.mjs",
  }),
  Object.freeze({
    id: "validator_policy",
    script: "tools/rule-engine-v2/check-validator-policy-terminology-v2.mjs",
  }),
  Object.freeze({
    id: "compat_surface",
    script: "tools/rule-engine-v2/check-master-control-compat-surface-v2.mjs",
  }),
  Object.freeze({
    id: "import_boundary",
    script: "tools/rule-engine-v2/check-master-control-import-boundary-v2.mjs",
  }),
  Object.freeze({
    id: "health_contract",
    script: "tools/rule-engine-v2/check-health-contract-v2.mjs",
  }),
  Object.freeze({
    id: "cross_manifest_integrity",
    script: "tools/rule-engine-v2/check-cross-manifest-integrity-v2.mjs",
  }),
]);
