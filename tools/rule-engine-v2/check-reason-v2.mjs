export const CHECK_REASONS_V2 = Object.freeze({
  ruleEngineOwnedImmediateSpell: "rule_engine_owned_immediate_spell",
  noAxisSelected: "no_axis_selected",
});

export function reasonText(v) {
  return String(v && v.reason || "");
}

export function reasonList(values) {
  return (Array.isArray(values) ? values : []).map((v) => reasonText(v));
}

export function hasReason(values, expectedReason) {
  return reasonList(values).includes(String(expectedReason || ""));
}
