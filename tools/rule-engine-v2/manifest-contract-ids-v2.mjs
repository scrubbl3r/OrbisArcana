export const REQUIRED_READY_PHASE_IDS_V2 = Object.freeze([
  "doctor",
  "regression_manifest",
  "contract_manifest",
  "master_control_authoring",
]);

export const REQUIRED_REGRESSION_CHECK_IDS_V2 = Object.freeze([
  "shake_regression",
  "wake_load_regression",
  "immediate_ownership",
  "flat_spin_gating",
  "wake_window_axis_prereq",
]);

export const REQUIRED_CONTRACT_CHECK_IDS_V2 = Object.freeze([
  "rule_source",
  "policy_alias",
  "runtime_import",
  "orchestrator_v1_compiler",
  "doc_policy",
  "validator_policy",
  "compat_surface",
  "import_boundary",
  "health_contract",
  "cross_manifest_integrity",
  "script_registry",
]);
