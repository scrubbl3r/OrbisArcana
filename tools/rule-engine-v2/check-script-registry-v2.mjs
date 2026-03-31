import { failCheck } from "./check-fail-v2.mjs";
import { readJsonOrFail } from "./check-json-v2.mjs";
import { flattenManifestChecksV2 } from "./manifest-check-entries-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

// Verifies package.json scripts cover all manifest-declared check scripts.
const CHECK_TAG = "script-registry:v2";
const PACKAGE_JSON_PATH = "package.json";
const PACKAGE_SCRIPTS_LABEL = "scripts";
const CHECK_SCRIPT_PREFIX = "check:";
const CHECK_SCRIPT_SUFFIX = ":v2";
const NODE_CMD_PREFIX = "node";
const MISSING_SCRIPTS_LABEL = "missing package scripts";
const MISMATCHED_SCRIPTS_LABEL = "mismatched package scripts";
const PASS_MESSAGE = "package scripts cover manifest-referenced checks";

function text(v) {
  return typeof v === "string" ? v.trim() : "";
}

function isRecord(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function resolveScriptNameForCheck(id, overrides) {
  const key = text(id);
  if (Object.prototype.hasOwnProperty.call(overrides, key)) {
    return text(overrides[key]);
  }
  return `${CHECK_SCRIPT_PREFIX}${key.replace(/_/g, "-")}${CHECK_SCRIPT_SUFFIX}`;
}

const pkg = readJsonOrFail(CHECK_TAG, PACKAGE_JSON_PATH);
const scripts = isRecord(pkg?.scripts)
  ? pkg.scripts
  : null;
if (!scripts) failCheck(CHECK_TAG, `${PACKAGE_JSON_PATH} ${PACKAGE_SCRIPTS_LABEL} object missing`);

const explicitScriptNames = Object.freeze({
  doctor: "doctor:v2",
  rule_source_contract: "check:rule-source-contract:v2",
  policy_control_contract: "check:policy-control-contract:v2",
  runtime_policy_import_contract: "check:runtime-policy-import-contract:v2",
  orchestrator_v2_compiler: "check:compiled-interaction-graph-v2-compiler:v2",
  orchestrator_v2_builder_validation_contract: "check:compiled-interaction-graph-v2-builder-validation-contract:v2",
  orchestrator_v2_bootstrap_precedence: "check:compiled-interaction-graph-v2-bootstrap-precedence:v2",
  orchestrator_v2_window_semantics: "check:compiled-interaction-graph-v2-window-semantics:v2",
  orchestrator_v2_window_semantics_event_surface:
    "check:compiled-interaction-graph-v2-window-semantics-event-surface:v2",
  orchestrator_v2_window_refs_compiler_parser_surface:
    "check:compiled-interaction-graph-v2-window-refs-compiler-parser-surface:v2",
  orchestrator_v2_window_refs_source_surface:
    "check:compiled-interaction-graph-v2-window-refs-source-surface:v2",
  orchestrator_v2_window_refs_shape_validator_source_surface:
    "check:compiled-interaction-graph-v2-window-refs-shape-validator-source-surface:v2",
  orchestrator_v2_window_refs_entry_type_validator_source_surface:
    "check:compiled-interaction-graph-v2-window-refs-entry-type-validator-source-surface:v2",
  orchestrator_v2_window_refs_whitespace_validator_source_surface:
    "check:compiled-interaction-graph-v2-window-refs-whitespace-validator-source-surface:v2",
  orchestrator_v2_window_refs_string_whitespace_validator_source_surface:
    "check:compiled-interaction-graph-v2-window-refs-string-whitespace-validator-source-surface:v2",
  orchestrator_v2_window_refs_duplicate_source_surface:
    "check:compiled-interaction-graph-v2-window-refs-duplicate-source-surface:v2",
  orchestrator_v2_defaults_trigger_enabled_validator_source_surface:
    "check:compiled-interaction-graph-v2-defaults-trigger-enabled-validator-source-surface:v2",
  orchestrator_v2_defaults_section_shape_validator_source_surface:
    "check:compiled-interaction-graph-v2-defaults-section-shape-validator-source-surface:v2",
  orchestrator_v2_defaults_trigger_object_shape_source_surface:
    "check:compiled-interaction-graph-v2-defaults-trigger-object-shape-source-surface:v2",
  orchestrator_v2_defaults_trigger_unknown_event_source_surface:
    "check:compiled-interaction-graph-v2-defaults-trigger-unknown-event-source-surface:v2",
  orchestrator_v2_defaults_numeric_validator_source_surface:
    "check:compiled-interaction-graph-v2-defaults-numeric-validator-source-surface:v2",
  orchestrator_v2_defaults_unsupported_keys_validator_source_surface:
    "check:compiled-interaction-graph-v2-defaults-unsupported-keys-validator-source-surface:v2",
  orchestrator_v2_defaults_rule_numeric_validator_source_surface:
    "check:compiled-interaction-graph-v2-defaults-rule-numeric-validator-source-surface:v2",
  orchestrator_v2_top_level_enabled_compiler_source_surface:
    "check:compiled-interaction-graph-v2-top-level-enabled-compiler-source-surface:v2",
  orchestrator_v2_top_level_enabled_validator_source_surface:
    "check:compiled-interaction-graph-v2-top-level-enabled-validator-source-surface:v2",
  orchestrator_v2_top_level_version_validator_source_surface:
    "check:compiled-interaction-graph-v2-top-level-version-validator-source-surface:v2",
  orchestrator_v2_top_level_rules_array_validator_source_surface:
    "check:compiled-interaction-graph-v2-top-level-rules-array-validator-source-surface:v2",
  orchestrator_v2_top_level_unsupported_keys_validator_source_surface:
    "check:compiled-interaction-graph-v2-top-level-unsupported-keys-validator-source-surface:v2",
  orchestrator_v2_top_level_optional_object_validator_source_surface:
    "check:compiled-interaction-graph-v2-top-level-optional-object-validator-source-surface:v2",
  orchestrator_v2_open_words_precedence_source_surface:
    "check:compiled-interaction-graph-v2-open-words-precedence-source-surface:v2",
  orchestrator_v2_open_words_shape_validator_source_surface:
    "check:compiled-interaction-graph-v2-open-words-shape-validator-source-surface:v2",
  orchestrator_v2_open_group_ref_whitespace_validator_source_surface:
    "check:compiled-interaction-graph-v2-open-group-ref-whitespace-validator-source-surface:v2",
  orchestrator_v2_open_group_ref_shape_validator_source_surface:
    "check:compiled-interaction-graph-v2-open-group-ref-shape-validator-source-surface:v2",
  orchestrator_v2_open_group_ref_empty_validator_source_surface:
    "check:compiled-interaction-graph-v2-open-group-ref-empty-validator-source-surface:v2",
  orchestrator_v2_open_entry_type_validator_source_surface:
    "check:compiled-interaction-graph-v2-open-entry-type-validator-source-surface:v2",
  orchestrator_v2_open_spells_compat_warning_source_surface:
    "check:compiled-interaction-graph-v2-open-spells-compat-warning-source-surface:v2",
  orchestrator_v2_open_spells_compat_entry_validator_source_surface:
    "check:compiled-interaction-graph-v2-open-spells-compat-entry-validator-source-surface:v2",
  orchestrator_v2_open_spells_compat_whitespace_validator_source_surface:
    "check:compiled-interaction-graph-v2-open-spells-compat-whitespace-validator-source-surface:v2",
  orchestrator_v2_open_selector_whitespace_validator_source_surface:
    "check:compiled-interaction-graph-v2-open-selector-whitespace-validator-source-surface:v2",
  orchestrator_v2_open_spells_fallback_compiler_source_surface:
    "check:compiled-interaction-graph-v2-open-spells-fallback-compiler-source-surface:v2",
  orchestrator_v2_on_spell_compat_compiler_source_surface:
    "check:compiled-interaction-graph-v2-on-spell-compat-compiler-source-surface:v2",
  orchestrator_v2_on_spell_compat_warning_source_surface:
    "check:compiled-interaction-graph-v2-on-spell-compat-warning-source-surface:v2",
  orchestrator_v2_on_spell_compat_entry_validator_source_surface:
    "check:compiled-interaction-graph-v2-on-spell-compat-entry-validator-source-surface:v2",
  orchestrator_v2_on_spell_compat_whitespace_validator_source_surface:
    "check:compiled-interaction-graph-v2-on-spell-compat-whitespace-validator-source-surface:v2",
  orchestrator_v2_on_selector_whitespace_validator_source_surface:
    "check:compiled-interaction-graph-v2-on-selector-whitespace-validator-source-surface:v2",
  orchestrator_v2_on_shape_validator_source_surface:
    "check:compiled-interaction-graph-v2-on-shape-validator-source-surface:v2",
  orchestrator_v2_on_entry_type_validator_source_surface:
    "check:compiled-interaction-graph-v2-on-entry-type-validator-source-surface:v2",
  orchestrator_v2_on_duplicate_normalized_source_surface:
    "check:compiled-interaction-graph-v2-on-duplicate-normalized-source-surface:v2",
  orchestrator_v2_id_shape_source_surface:
    "check:compiled-interaction-graph-v2-id-shape-source-surface:v2",
  orchestrator_v2_id_type_validator_source_surface:
    "check:compiled-interaction-graph-v2-id-type-validator-source-surface:v2",
  orchestrator_v2_id_whitespace_validator_source_surface:
    "check:compiled-interaction-graph-v2-id-whitespace-validator-source-surface:v2",
  orchestrator_v2_groups_normalization_source_surface:
    "check:compiled-interaction-graph-v2-groups-normalization-source-surface:v2",
  orchestrator_v2_groups_shape_validator_source_surface:
    "check:compiled-interaction-graph-v2-groups-shape-validator-source-surface:v2",
  orchestrator_v2_groups_key_shape_validator_source_surface:
    "check:compiled-interaction-graph-v2-groups-key-shape-validator-source-surface:v2",
  orchestrator_v2_groups_unknown_word_validator_source_surface:
    "check:compiled-interaction-graph-v2-groups-unknown-word-validator-source-surface:v2",
  orchestrator_v2_groups_entry_type_validator_source_surface:
    "check:compiled-interaction-graph-v2-groups-entry-type-validator-source-surface:v2",
  orchestrator_v2_groups_word_whitespace_validator_source_surface:
    "check:compiled-interaction-graph-v2-groups-word-whitespace-validator-source-surface:v2",
  orchestrator_v2_groups_normalization_compiler_source_surface:
    "check:compiled-interaction-graph-v2-groups-normalization-compiler-source-surface:v2",
  orchestrator_v2_groups_duplicate_normalized_source_surface:
    "check:compiled-interaction-graph-v2-groups-duplicate-normalized-source-surface:v2",
  orchestrator_v2_open_duplicate_normalized_source_surface:
    "check:compiled-interaction-graph-v2-open-duplicate-normalized-source-surface:v2",
  orchestrator_v2_open_tokenization_source_surface:
    "check:compiled-interaction-graph-v2-open-tokenization-source-surface:v2",
  doc_policy: "check:doc-policy-terminology:v2",
  validator_policy: "check:validator-policy-terminology:v2",
  compat_surface: "check:master-control-compat-surface:v2",
  import_boundary: "check:master-control-import-boundary:v2",
});

const missing = [];
const mismatched = [];
for (const check of flattenManifestChecksV2()) {
  const id = text(check?.id);
  const scriptPath = text(check?.script);
  const scriptName = resolveScriptNameForCheck(id, explicitScriptNames);
  const expected = `${NODE_CMD_PREFIX} ${scriptPath}`;
  const actual = text(scripts[scriptName]);
  if (!actual) {
    missing.push(scriptName);
    continue;
  }
  if (actual !== expected) {
    mismatched.push(`${scriptName} (expected '${expected}', got '${actual}')`);
  }
}

if (missing.length) failCheck(CHECK_TAG, `${MISSING_SCRIPTS_LABEL}: ${missing.join(", ")}`);
if (mismatched.length) failCheck(CHECK_TAG, `${MISMATCHED_SCRIPTS_LABEL}: ${mismatched.join("; ")}`);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
