export function spellIdText(v) {
  return String(v && v.spellId || "");
}

export function hasSpellId(values, spellId) {
  const target = String(spellId || "");
  return (Array.isArray(values) ? values : []).some((v) => spellIdText(v) === target);
}
