// Shared reason constants/utilities for reject/cast reason assertions in checks.
// Reason helpers normalize non-object/non-string inputs to empty text safely.
export const CHECK_REASONS_V2 = Object.freeze({
  ruleEngineOwnedImmediateSpell: "rule_engine_owned_immediate_spell",
  spellWindowRequired: "spell_window_required",
  noAxisSelected: "no_axis_selected",
});

export function reasonText(v) {
  return typeof v?.reason === "string" ? v.reason : "";
}

export function reasonList(values) {
  return (Array.isArray(values) ? values : []).map((v) => reasonText(v));
}

export function hasReason(values, expectedReason) {
  const reason = typeof expectedReason === "string" ? expectedReason : "";
  return reasonList(values).includes(reason);
}
