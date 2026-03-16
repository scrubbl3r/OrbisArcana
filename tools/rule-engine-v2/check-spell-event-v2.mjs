export function spellIdText(v) {
  return typeof v?.spellId === "string" ? v.spellId : "";
}

export function hasSpellId(values, spellId) {
  const target = typeof spellId === "string" ? spellId : "";
  return (Array.isArray(values) ? values : []).some((v) => spellIdText(v) === target);
}
