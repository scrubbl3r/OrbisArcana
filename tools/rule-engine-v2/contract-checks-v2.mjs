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
    id: "orchestrator_v1_validator",
    script: "tools/rule-engine-v2/check-orchestrator-v1-validator-contract-v2.mjs",
  },
  {
    id: "orchestrator_v1_parity",
    script: "tools/rule-engine-v2/check-orchestrator-v1-projection-parity-v2.mjs",
  },
  {
    id: "orchestrator_v1_projection_validity",
    script: "tools/rule-engine-v2/check-orchestrator-v1-projection-validity-contract-v2.mjs",
  },
  {
    id: "orchestrator_v1_bootstrap_projection",
    script: "tools/rule-engine-v2/check-orchestrator-v1-bootstrap-projection-contract-v2.mjs",
  },
  {
    id: "orchestrator_v1_bootstrap_defaults",
    script: "tools/rule-engine-v2/check-orchestrator-v1-bootstrap-defaults-contract-v2.mjs",
  },
  {
    id: "orchestrator_v1_bootstrap_parity",
    script: "tools/rule-engine-v2/check-orchestrator-v1-bootstrap-parity-contract-v2.mjs",
  },
  {
    id: "orchestrator_v1_bootstrap_projection_toggle",
    script: "tools/rule-engine-v2/check-orchestrator-v1-bootstrap-projection-toggle-contract-v2.mjs",
  },
  {
    id: "orchestrator_projection_doc",
    script: "tools/rule-engine-v2/check-orchestrator-projection-doc-contract-v2.mjs",
  },
  {
    id: "master_control_orchestrator_section",
    script: "tools/rule-engine-v2/check-master-control-orchestrator-section-v2.mjs",
  },
  {
    id: "docs_index_orchestrator_links",
    script: "tools/rule-engine-v2/check-docs-index-orchestrator-links-v2.mjs",
  },
  {
    id: "docs_index_generated_artifacts",
    script: "tools/rule-engine-v2/check-docs-index-generated-artifacts-v2.mjs",
  },
  {
    id: "docs_index_canonical_signals",
    script: "tools/rule-engine-v2/check-docs-index-canonical-signals-v2.mjs",
  },
  {
    id: "docs_legacy_handle_drift",
    script: "tools/rule-engine-v2/check-docs-legacy-handle-drift-v2.mjs",
  },
  {
    id: "core_doc_registry",
    script: "tools/rule-engine-v2/check-core-doc-registry-v2.mjs",
  },
  {
    id: "compatibility_doc_source_ids",
    script: "tools/rule-engine-v2/check-compatibility-doc-source-ids-v2.mjs",
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
