import { defineCheckEntriesV2 } from "./define-check-entries-v2.mjs";

export const CONTRACT_CHECKS_V2 = defineCheckEntriesV2([
  {
    id: "rule_source",
    script: "tools/rule-engine-v2/check-rule-source-contract-v2.mjs",
  },
  {
    id: "policy_alias",
    script: "tools/rule-engine-v2/check-policy-control-contract-v2.mjs",
  },
  {
    id: "runtime_import",
    script: "tools/rule-engine-v2/check-runtime-policy-import-contract-v2.mjs",
  },
  {
    id: "orchestrator_v1_compiler",
    script: "tools/rule-engine-v2/check-orchestrator-v1-compiler-contract-v2.mjs",
  },
  {
    id: "doc_policy",
    script: "tools/rule-engine-v2/check-doc-policy-terminology-v2.mjs",
  },
  {
    id: "validator_policy",
    script: "tools/rule-engine-v2/check-validator-policy-terminology-v2.mjs",
  },
  {
    id: "compat_surface",
    script: "tools/rule-engine-v2/check-master-control-compat-surface-v2.mjs",
  },
  {
    id: "import_boundary",
    script: "tools/rule-engine-v2/check-master-control-import-boundary-v2.mjs",
  },
  {
    id: "health_contract",
    script: "tools/rule-engine-v2/check-health-contract-v2.mjs",
  },
  {
    id: "cross_manifest_integrity",
    script: "tools/rule-engine-v2/check-cross-manifest-integrity-v2.mjs",
  },
  {
    id: "script_registry",
    script: "tools/rule-engine-v2/check-script-registry-v2.mjs",
  },
]);
