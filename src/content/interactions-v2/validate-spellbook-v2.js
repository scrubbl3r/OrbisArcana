import { SPELLBOOK_V2 } from "./spellbook-v2.js";

function asObj(v) {
  return (v && typeof v === "object" && !Array.isArray(v)) ? v : {};
}

function asText(v) {
  return String(v == null ? "" : v).trim();
}

function isFiniteNonNegative(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0;
}

export function validateSpellbookV2(input = SPELLBOOK_V2) {
  const errors = [];
  const cfg = asObj(input);

  if (asText(cfg.version) !== "2") {
    errors.push("SPELLBOOK_V2.version must be \"2\"");
  }
  if (!Array.isArray(cfg.spells)) {
    errors.push("SPELLBOOK_V2.spells must be an array");
    return errors;
  }

  const seenIds = new Set();
  const seenPhrases = new Set();
  for (const s of cfg.spells) {
    const spell = asObj(s);
    const id = asText(spell.id).toLowerCase();
    const phrase = asText(spell.phrase).toLowerCase();
    const onnx = asText(spell.onnx).toLowerCase();

    if (!id) errors.push("SPELLBOOK_V2 spell entry is missing id");
    if (!phrase) errors.push(`SPELLBOOK_V2 spell ${id || "(missing-id)"} is missing phrase`);
    if (!onnx) errors.push(`SPELLBOOK_V2 spell ${id || "(missing-id)"} is missing onnx`);
    if (id) {
      if (seenIds.has(id)) errors.push(`SPELLBOOK_V2 contains duplicate id: ${id}`);
      seenIds.add(id);
    }
    if (phrase) {
      if (seenPhrases.has(phrase)) errors.push(`SPELLBOOK_V2 contains duplicate phrase: ${phrase}`);
      seenPhrases.add(phrase);
    }
    if (Object.prototype.hasOwnProperty.call(spell, "active") && typeof spell.active !== "boolean") {
      errors.push(`SPELLBOOK_V2 spell ${id || "(missing-id)"} active must be boolean`);
    }
    if (!isFiniteNonNegative(spell.confidence)) {
      errors.push(`SPELLBOOK_V2 spell ${id || "(missing-id)"} confidence must be a finite number >= 0`);
    }
    if (!isFiniteNonNegative(spell.cooldownMs)) {
      errors.push(`SPELLBOOK_V2 spell ${id || "(missing-id)"} cooldownMs must be a finite number >= 0`);
    }
  }

  return errors;
}

