// Canonical event-id helpers: prefer wordId, fallback to legacy spellId.
export function wordIdText(v) {
  if (typeof v?.wordId === "string") return v.wordId;
  if (typeof v?.spellId === "string") return v.spellId;
  return "";
}

export function hasWordId(values, wordId) {
  const target = typeof wordId === "string" ? wordId : "";
  return (Array.isArray(values) ? values : []).some((v) => wordIdText(v) === target);
}

// Back-compat aliases for existing check names.
export const spellIdText = wordIdText;
export const hasSpellId = hasWordId;
