import { SPELLBOOK_V2 } from "./spellbook-v2.js";
import { asObj, asText } from "./orchestrator-v1-normalizers.js";

function isFiniteNonNegative(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0;
}

function isFiniteZeroToOne(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 1;
}

function isEntityIdLike(v) {
  return typeof v === "string" && /^[a-z0-9_]+$/.test(v);
}

function isPhraseLike(v) {
  return typeof v === "string" && /^[a-z0-9_ ]+$/.test(v);
}

function pushRequiredFieldError(errors, fieldValue, message) {
  if (!fieldValue) errors.push(message);
}

function pushCanonicalLowercaseError(errors, rawValue, canonicalValue, message) {
  if (rawValue && rawValue !== canonicalValue) errors.push(message);
}

function pushShapeValidationError(errors, value, isValidFn, message) {
  if (value && !isValidFn(value)) errors.push(message);
}

function pushDuplicateError(errors, seen, value, message) {
  if (!value) return;
  if (seen.has(value)) errors.push(message);
  seen.add(value);
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
    const rawId = asText(spell.id);
    const rawPhrase = asText(spell.phrase);
    const rawOnnx = asText(spell.onnx);
    const id = rawId.toLowerCase();
    const phrase = rawPhrase.toLowerCase();
    const onnx = rawOnnx.toLowerCase();

    pushRequiredFieldError(errors, id, "SPELLBOOK_V2 spell entry is missing id");
    pushRequiredFieldError(errors, phrase, `SPELLBOOK_V2 spell ${id || "(missing-id)"} is missing phrase`);
    pushRequiredFieldError(errors, onnx, `SPELLBOOK_V2 spell ${id || "(missing-id)"} is missing onnx`);

    pushCanonicalLowercaseError(errors, rawId, id, `SPELLBOOK_V2 spell ${rawId} id must be lowercase/canonical`);
    pushCanonicalLowercaseError(errors, rawPhrase, phrase, `SPELLBOOK_V2 spell ${id || "(missing-id)"} phrase must be lowercase/canonical`);
    pushCanonicalLowercaseError(errors, rawOnnx, onnx, `SPELLBOOK_V2 spell ${id || "(missing-id)"} onnx must be lowercase/canonical`);

    pushShapeValidationError(errors, id, isEntityIdLike, `SPELLBOOK_V2 spell id has invalid shape (letters/numbers/_ only): ${id}`);
    pushShapeValidationError(errors, phrase, isPhraseLike, `SPELLBOOK_V2 spell ${id || "(missing-id)"} phrase has invalid shape (letters/numbers/_/space only): ${phrase}`);
    pushShapeValidationError(errors, onnx, isEntityIdLike, `SPELLBOOK_V2 spell ${id || "(missing-id)"} onnx has invalid shape (letters/numbers/_ only): ${onnx}`);

    pushDuplicateError(errors, seenIds, id, `SPELLBOOK_V2 contains duplicate id: ${id}`);
    pushDuplicateError(errors, seenPhrases, phrase, `SPELLBOOK_V2 contains duplicate phrase: ${phrase}`);

    if (Object.hasOwn(spell, "active") && typeof spell.active !== "boolean") {
      errors.push(`SPELLBOOK_V2 spell ${id || "(missing-id)"} active must be boolean`);
    }
    if (!isFiniteZeroToOne(spell.confidence)) {
      errors.push(`SPELLBOOK_V2 spell ${id || "(missing-id)"} confidence must be a finite number in [0,1]`);
    }
    if (!isFiniteNonNegative(spell.cooldownMs)) {
      errors.push(`SPELLBOOK_V2 spell ${id || "(missing-id)"} cooldownMs must be a finite number >= 0`);
    }
  }

  const activeCount = cfg.spells.reduce((acc, spell) => acc + ((spell?.active !== false) ? 1 : 0), 0);
  if (activeCount < 1) {
    errors.push("SPELLBOOK_V2 must keep at least one active spell");
  }

  return errors;
}
