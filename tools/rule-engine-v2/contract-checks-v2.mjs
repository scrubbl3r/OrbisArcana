// Ordered contract check manifest used by ready:v2 contract phase.
import { defineCheckEntriesV2 } from "./define-check-entries-v2.mjs";
// Order is intentional for predictable failure sequencing in CI/local runs.
export const CONTRACT_CHECKS_V2 = defineCheckEntriesV2([
  {
    id: "wordbook_v2_alias",
    script: "tools/rule-engine-v2/check-wordbook-v2-alias-contract-v2.mjs",
  },
  {
    id: "wordbook_runtime_alias",
    script: "tools/rule-engine-v2/check-wordbook-runtime-alias-contract-v2.mjs",
  },
  {
    id: "wordbook_canonical_imports",
    script: "tools/rule-engine-v2/check-wordbook-canonical-imports-v2.mjs",
  },
  {
    id: "wordbook_src_imports",
    script: "tools/rule-engine-v2/check-wordbook-src-imports-v2.mjs",
  },
  {
    id: "wordbook_interactions_imports",
    script: "tools/rule-engine-v2/check-wordbook-interactions-imports-v2.mjs",
  },
  {
    id: "wordbook_src_spellbook_v2_imports",
    script: "tools/rule-engine-v2/check-wordbook-src-spellbook-v2-imports-v2.mjs",
  },
  {
    id: "wordbook_shim_alias",
    script: "tools/rule-engine-v2/check-wordbook-shim-alias-contract-v2.mjs",
  },
  {
    id: "wordbook_validator_alias_surface",
    script: "tools/rule-engine-v2/check-wordbook-validator-alias-surface-v2.mjs",
  },
  {
    id: "wordbook_runtime_bridge_surface",
    script: "tools/rule-engine-v2/check-wordbook-runtime-bridge-surface-v2.mjs",
  },
  {
    id: "wordbook_runtime_bridge_shim",
    script: "tools/rule-engine-v2/check-wordbook-runtime-bridge-shim-contract-v2.mjs",
  },
  {
    id: "wordbook_legacy_symbol_surface",
    script: "tools/rule-engine-v2/check-wordbook-legacy-symbol-surface-v2.mjs",
  },
  {
    id: "wordbook_kws_manifest_alias_surface",
    script: "tools/rule-engine-v2/check-wordbook-kws-manifest-alias-surface-v2.mjs",
  },
  {
    id: "wordbook_direct_module_import_surface",
    script: "tools/rule-engine-v2/check-wordbook-direct-module-import-surface-v2.mjs",
  },
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
    id: "orchestrator_v2_compiler",
    script: "tools/rule-engine-v2/check-orchestrator-v2-compiler-contract-v2.mjs",
  },
  {
    id: "orchestrator_v2_builder_validation_contract",
    script: "tools/rule-engine-v2/check-orchestrator-v2-builder-validation-contract-v2.mjs",
  },
  {
    id: "orchestrator_v2_builder_error_format_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-builder-error-format-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_trigger_boolean_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-trigger-boolean-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_trigger_shorthand_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-trigger-shorthand-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_trigger_shorthand_entry_type_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-trigger-shorthand-entry-type-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_trigger_shorthand_whitespace_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-trigger-shorthand-whitespace-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_trigger_shorthand_string_whitespace_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-trigger-shorthand-string-whitespace-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_trigger_shorthand_duplicate_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-trigger-shorthand-duplicate-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_trigger_event_key_whitespace_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-trigger-event-key-whitespace-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_trigger_duplicate_normalized_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-trigger-duplicate-normalized-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_trigger_object_enabled_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-trigger-object-enabled-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_trigger_enabled_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-trigger-enabled-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_trigger_shape_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-trigger-shape-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_trigger_defaults_merge_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-trigger-defaults-merge-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_defaults_trigger_enabled_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-defaults-trigger-enabled-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_defaults_section_shape_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-defaults-section-shape-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_defaults_trigger_object_shape_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-defaults-trigger-object-shape-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_defaults_trigger_unknown_event_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-defaults-trigger-unknown-event-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_defaults_numeric_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-defaults-numeric-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_defaults_unsupported_keys_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-defaults-unsupported-keys-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_defaults_rule_numeric_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-defaults-rule-numeric-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_parser_parity_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-parser-parity-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_validator_parser_parity_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-validator-parser-parity-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_empty_token_filter_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-empty-token-filter-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_window_refs_compiler_parser_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-window-refs-compiler-parser-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_rule_timing_defaults_compiler_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-rule-timing-defaults-compiler-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_top_level_enabled_compiler_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-top-level-enabled-compiler-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_base_merge_precedence_compiler_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-base-merge-precedence-compiler-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_top_level_enabled_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-top-level-enabled-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_top_level_version_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-top-level-version-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_top_level_rules_array_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-top-level-rules-array-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_top_level_unsupported_keys_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-top-level-unsupported-keys-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_top_level_optional_object_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-top-level-optional-object-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_rule_unsupported_keys_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-rule-unsupported-keys-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_rule_entry_shape_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-rule-entry-shape-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_rule_section_shape_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-rule-section-shape-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v1_validator",
    script: "tools/rule-engine-v2/check-orchestrator-v1-validator-contract-v2.mjs",
  },
  {
    id: "orchestrator_v2_validator",
    script: "tools/rule-engine-v2/check-orchestrator-v2-validator-contract-v2.mjs",
  },
  {
    id: "orchestrator_v2_open_words_precedence_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-open-words-precedence-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_open_words_shape_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-open-words-shape-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_open_group_ref_whitespace_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-open-group-ref-whitespace-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_open_group_ref_shape_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-open-group-ref-shape-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_open_group_ref_empty_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-open-group-ref-empty-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_open_entry_type_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-open-entry-type-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_open_spells_alias_warning_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-open-spells-alias-warning-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_open_spells_alias_entry_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-open-spells-alias-entry-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_open_spells_alias_whitespace_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-open-spells-alias-whitespace-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_open_selector_whitespace_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-open-selector-whitespace-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_open_spells_fallback_compiler_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-open-spells-fallback-compiler-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_on_spell_alias_compiler_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-on-spell-alias-compiler-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_on_spell_alias_warning_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-on-spell-alias-warning-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_on_spell_alias_entry_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-on-spell-alias-entry-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_on_spell_alias_whitespace_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-on-spell-alias-whitespace-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_on_selector_whitespace_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-on-selector-whitespace-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_on_shape_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-on-shape-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_on_entry_type_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-on-entry-type-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_on_duplicate_normalized_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-on-duplicate-normalized-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_id_shape_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-id-shape-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_id_type_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-id-type-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_id_whitespace_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-id-whitespace-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_word_id_normalizer_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-word-id-normalizer-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_word_id_shape_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-word-id-shape-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_groups_normalization_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-groups-normalization-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_groups_shape_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-groups-shape-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_groups_key_shape_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-groups-key-shape-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_groups_unknown_word_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-groups-unknown-word-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_groups_entry_type_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-groups-entry-type-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_groups_word_whitespace_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-groups-word-whitespace-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_groups_normalization_compiler_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-groups-normalization-compiler-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_groups_duplicate_normalized_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-groups-duplicate-normalized-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_open_duplicate_normalized_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-open-duplicate-normalized-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_open_tokenization_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-open-tokenization-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_window_refs_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-window-refs-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_window_refs_shape_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-window-refs-shape-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_window_refs_entry_type_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-window-refs-entry-type-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_window_refs_whitespace_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-window-refs-whitespace-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_window_refs_string_whitespace_validator_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-window-refs-string-whitespace-validator-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v2_window_refs_duplicate_source_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-window-refs-duplicate-source-surface-v2.mjs",
  },
  {
    id: "orchestrator_v1_parity",
    script: "tools/rule-engine-v2/check-orchestrator-v1-projection-parity-v2.mjs",
  },
  {
    id: "interactions_wake_words_alias_contract",
    script: "tools/rule-engine-v2/check-interactions-wake-words-alias-contract-v2.mjs",
  },
  {
    id: "interactions_word_condition_alias_contract",
    script: "tools/rule-engine-v2/check-interactions-word-condition-alias-contract-v2.mjs",
  },
  {
    id: "interactions_authoring_word_condition_surface",
    script: "tools/rule-engine-v2/check-interactions-authoring-word-condition-surface-v2.mjs",
  },
  {
    id: "interactions_authoring_wake_words_surface",
    script: "tools/rule-engine-v2/check-interactions-authoring-wake-words-surface-v2.mjs",
  },
  {
    id: "interactions_immediate_spell_collector_alias_surface",
    script: "tools/rule-engine-v2/check-interactions-immediate-spell-collector-alias-surface-v2.mjs",
  },
  {
    id: "spell_runtime_routing_wake_words_alias_contract",
    script: "tools/rule-engine-v2/check-spell-runtime-routing-wake-words-alias-contract-v2.mjs",
  },
  {
    id: "spell_runtime_routing_wake_words_precedence_contract",
    script: "tools/rule-engine-v2/check-spell-runtime-routing-wake-words-precedence-contract-v2.mjs",
  },
  {
    id: "spell_runtime_routing_wake_bare_id_contract",
    script: "tools/rule-engine-v2/check-spell-runtime-routing-wake-bare-id-contract-v2.mjs",
  },
  {
    id: "spell_runtime_routing_wake_unknown_word_contract",
    script: "tools/rule-engine-v2/check-spell-runtime-routing-wake-unknown-word-contract-v2.mjs",
  },
  {
    id: "spell_schema_integrity_wake_words_alias_contract",
    script: "tools/rule-engine-v2/check-spell-schema-integrity-wake-words-alias-contract-v2.mjs",
  },
  {
    id: "spell_schema_integrity_wake_words_precedence_contract",
    script: "tools/rule-engine-v2/check-spell-schema-integrity-wake-words-precedence-contract-v2.mjs",
  },
  {
    id: "spell_schema_integrity_wake_bare_id_contract",
    script: "tools/rule-engine-v2/check-spell-schema-integrity-wake-bare-id-contract-v2.mjs",
  },
  {
    id: "spell_wake_spells_legacy_alias_contract",
    script: "tools/rule-engine-v2/check-spell-wake-spells-legacy-alias-contract-v2.mjs",
  },
  {
    id: "spell_validator_wake_alias_source_surface",
    script: "tools/rule-engine-v2/check-spell-validator-wake-alias-source-surface-v2.mjs",
  },
  {
    id: "preview_runtime_wake_words_source_surface",
    script: "tools/rule-engine-v2/check-preview-runtime-wake-words-source-surface-v2.mjs",
  },
  {
    id: "preview_runtime_wake_words_alias_contract",
    script: "tools/rule-engine-v2/check-preview-runtime-wake-words-alias-contract-v2.mjs",
  },
  {
    id: "preview_runtime_word_condition_alias_contract",
    script: "tools/rule-engine-v2/check-preview-runtime-word-condition-alias-contract-v2.mjs",
  },
  {
    id: "rule_engine_preview_system_wake_words_alias_contract",
    script: "tools/rule-engine-v2/check-rule-engine-preview-system-wake-words-alias-contract-v2.mjs",
  },
  {
    id: "rule_engine_preview_system_word_condition_alias_contract",
    script: "tools/rule-engine-v2/check-rule-engine-preview-system-word-condition-alias-contract-v2.mjs",
  },
  {
    id: "validate_spell_rules_wake_words_contract",
    script: "tools/rule-engine-v2/check-validate-spell-rules-wake-words-contract-v2.mjs",
  },
  {
    id: "validate_spell_rules_wake_words_precedence_contract",
    script: "tools/rule-engine-v2/check-validate-spell-rules-wake-words-precedence-contract-v2.mjs",
  },
  {
    id: "validate_spell_rules_wake_bare_id_contract",
    script: "tools/rule-engine-v2/check-validate-spell-rules-wake-bare-id-contract-v2.mjs",
  },
  {
    id: "validate_spell_rules_wake_source_surface",
    script: "tools/rule-engine-v2/check-validate-spell-rules-wake-source-surface-v2.mjs",
  },
  {
    id: "validate_rule_engine_config_wake_words_contract",
    script: "tools/rule-engine-v2/check-validate-rule-engine-config-wake-words-contract-v2.mjs",
  },
  {
    id: "validate_rule_engine_config_wake_words_precedence_contract",
    script: "tools/rule-engine-v2/check-validate-rule-engine-config-wake-words-precedence-contract-v2.mjs",
  },
  {
    id: "validate_rule_engine_config_wake_bare_id_contract",
    script: "tools/rule-engine-v2/check-validate-rule-engine-config-wake-bare-id-contract-v2.mjs",
  },
  {
    id: "validate_rule_engine_config_wake_source_surface",
    script: "tools/rule-engine-v2/check-validate-rule-engine-config-wake-source-surface-v2.mjs",
  },
  {
    id: "pre_smoke_rule_validator_surface",
    script: "tools/rule-engine-v2/check-pre-smoke-rule-validator-surface-v2.mjs",
  },
  {
    id: "pre_smoke_spell_validator_surface",
    script: "tools/rule-engine-v2/check-pre-smoke-spell-validator-surface-v2.mjs",
  },
  {
    id: "orchestrator_v1_projection_validity",
    script: "tools/rule-engine-v2/check-orchestrator-v1-projection-validity-contract-v2.mjs",
  },
  {
    id: "orchestrator_v1_doc_open_words_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v1-doc-open-words-surface-v2.mjs",
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
    id: "orchestrator_v2_bootstrap_precedence",
    script: "tools/rule-engine-v2/check-orchestrator-v2-bootstrap-precedence-contract-v2.mjs",
  },
  {
    id: "orchestrator_v2_window_semantics",
    script: "tools/rule-engine-v2/check-orchestrator-v2-window-semantics-v2.mjs",
  },
  {
    id: "orchestrator_v2_window_semantics_event_surface",
    script: "tools/rule-engine-v2/check-orchestrator-v2-window-semantics-event-surface-v2.mjs",
  },
  {
    id: "word_detected_bridge",
    script: "tools/rule-engine-v2/check-word-detected-bridge-v2.mjs",
  },
  {
    id: "word_detected_legacy_event_surface",
    script: "tools/rule-engine-v2/check-word-detected-legacy-event-surface-v2.mjs",
  },
  {
    id: "detected_word_utils_surface",
    script: "tools/rule-engine-v2/check-detected-word-utils-surface-v2.mjs",
  },
  {
    id: "signal_definitions_word_event_surface",
    script: "tools/rule-engine-v2/check-signal-definitions-word-event-surface-v2.mjs",
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
    id: "master_control_wordbook_schema_surface",
    script: "tools/rule-engine-v2/check-master-control-wordbook-schema-surface-v2.mjs",
  },
  {
    id: "master_control_word_event_surface",
    script: "tools/rule-engine-v2/check-master-control-word-event-surface-v2.mjs",
  },
  {
    id: "master_control_schema_wake_words_surface",
    script: "tools/rule-engine-v2/check-master-control-schema-wake-words-surface-v2.mjs",
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
    id: "docs_index_core_links",
    script: "tools/rule-engine-v2/check-docs-index-core-links-v2.mjs",
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
    id: "docs_wordbook_canonical_ssot",
    script: "tools/rule-engine-v2/check-docs-wordbook-canonical-ssot-v2.mjs",
  },
  {
    id: "interactions_schema_wordbook_surface",
    script: "tools/rule-engine-v2/check-interactions-schema-wordbook-surface-v2.mjs",
  },
  {
    id: "core_doc_registry",
    script: "tools/rule-engine-v2/check-core-doc-registry-v2.mjs",
  },
  {
    id: "generated_artifact_registry",
    script: "tools/rule-engine-v2/check-generated-artifact-registry-v2.mjs",
  },
  {
    id: "doc_key_registry_integrity",
    script: "tools/rule-engine-v2/check-doc-key-registry-integrity-v2.mjs",
  },
  {
    id: "compatibility_doc_source_ids",
    script: "tools/rule-engine-v2/check-compatibility-doc-source-ids-v2.mjs",
  },
  {
    id: "policy_targets_registry",
    script: "tools/rule-engine-v2/check-policy-targets-registry-v2.mjs",
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
    id: "health_wordbook_alias_surface",
    script: "tools/rule-engine-v2/check-health-wordbook-alias-surface-v2.mjs",
  },
  {
    id: "cross_manifest_integrity",
    script: "tools/rule-engine-v2/check-cross-manifest-integrity-v2.mjs",
  },
  {
    id: "regression_tags_coverage",
    script: "tools/rule-engine-v2/check-regression-tags-coverage-v2.mjs",
  },
  {
    id: "regression_tag_source_surface",
    script: "tools/rule-engine-v2/check-regression-tag-source-surface-v2.mjs",
  },
  {
    id: "script_registry",
    script: "tools/rule-engine-v2/check-script-registry-v2.mjs",
  },
]);
