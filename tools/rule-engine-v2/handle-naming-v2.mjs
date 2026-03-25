// Canonical/legacy handle-naming examples used by docs and drift checks.
// Example tokens intentionally mirror documentation phrasing used by validators.
export const RULE_ENGINE_V2_LEGACY_HANDLE_TOKENS = Object.freeze([
  "Y_SPIN",
  "FSPIN_X",
  "FSPIN_Y",
  "FSPIN_Z",
  "FB_SHAKE",
  "LR_SHAKE",
  "UD_SHAKE",
  "DOMUS_TELEPORT",
  "FLAME_AOE",
  "FROST_AOE",
  "ELECTRIC_AOE",
]);

export const RULE_ENGINE_V2_LEGACY_SIGNAL_EXAMPLES = Object.freeze([
  "`spin.y`",
]);

export const RULE_ENGINE_V2_CANONICAL_SIGNAL_EXAMPLES = Object.freeze([
  "`spin.y`",
  "`shake.fb`",
]);

export const RULE_ENGINE_V2_CANONICAL_HANDLE_EXAMPLES = Object.freeze([
  "`SPIN_X`, `SPIN_Y`, `SPIN_Z`",
  "`SHAKE_FB`, `SHAKE_LR`, `SHAKE_UD`",
  "`WAKE_WIN`",
]);
