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

function isFiniteZeroToOne(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 1;
}

function isEntityIdLike(v) {
  return /^[a-z0-9_]+$/.test(String(v || ""));
}

function isPhraseLike(v) {
  return /^[a-z0-9_ ]+$/.test(String(v || ""));
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
    const rawId = asText(spell.id);
    const rawPhrase = asText(spell.phrase);
    const rawOnnx = asText(spell.onnx);

    if (!id) errors.push("SPELLBOOK_V2 spell entry is missing id");
    if (!phrase) errors.push(`SPELLBOOK_V2 spell ${id || "(missing-id)"} is missing phrase`);
    if (!onnx) errors.push(`SPELLBOOK_V2 spell ${id || "(missing-id)"} is missing onnx`);
    if (rawId && rawId !== id) {
      errors.push(`SPELLBOOK_V2 spell ${rawId} id must be lowercase/canonical`);
    }
    if (rawPhrase && rawPhrase !== phrase) {
      errors.push(`SPELLBOOK_V2 spell ${id || "(missing-id)"} phrase must be lowercase/canonical`);
    }
    if (rawOnnx && rawOnnx !== onnx) {
      errors.push(`SPELLBOOK_V2 spell ${id || "(missing-id)"} onnx must be lowercase/canonical`);
    }
    if (id && !isEntityIdLike(id)) {
      errors.push(`SPELLBOOK_V2 spell id has invalid shape (letters/numbers/_ only): ${id}`);
    }
    if (phrase && !isPhraseLike(phrase)) {
      errors.push(`SPELLBOOK_V2 spell ${id || "(missing-id)"} phrase has invalid shape (letters/numbers/_/space only): ${phrase}`);
    }
    if (onnx && !isEntityIdLike(onnx)) {
      errors.push(`SPELLBOOK_V2 spell ${id || "(missing-id)"} onnx has invalid shape (letters/numbers/_ only): ${onnx}`);
    }
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
    if (!isFiniteZeroToOne(spell.confidence)) {
      errors.push(`SPELLBOOK_V2 spell ${id || "(missing-id)"} confidence must be a finite number in [0,1]`);
    }
    if (!isFiniteNonNegative(spell.cooldownMs)) {
      errors.push(`SPELLBOOK_V2 spell ${id || "(missing-id)"} cooldownMs must be a finite number >= 0`);
    }
  }

  const activeCount = cfg.spells.reduce((acc, spell) => acc + ((asObj(spell).active !== false) ? 1 : 0), 0);
  if (activeCount < 1) {
    errors.push("SPELLBOOK_V2 must keep at least one active spell");
  }

  return errors;
}
