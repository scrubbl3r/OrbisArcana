// Canonical schema-ID constants for generated rule-engine-v2 artifacts.
// Shared by artifact writers and contract checks for schema pinning.
// IDs are versioned strings; bump only during intentional schema changes.
export const RULE_ENGINE_V2_SCHEMA_IDS = Object.freeze({
  effectiveSnapshot: "orbis.interactions_v2.effective_snapshot",
  health: "orbis.rule_engine_v2.health",
  status: "orbis.rule_engine_v2.status",
  milestone: "orbis.rule_engine_v2.milestone",
  milestoneTrend: "orbis.rule_engine_v2.milestone_trend",
  masterControl: "orbis.master_control_v2",
  masterControlAuthoring: "orbis.master_control_v2.authoring",
});
