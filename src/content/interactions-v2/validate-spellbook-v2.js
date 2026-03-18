import { SPELLBOOK_V2 } from "./spellbook-v2.js";
import { asObj, asText } from "./orchestrator-v1-normalizers.js";

const MISSING_ID_LABEL = "(missing-id)";
const ENTITY_ID_PATTERN = /^[a-z0-9_]+$/;
const PHRASE_PATTERN = /^[a-z0-9_ ]+$/;
const MIN_ACTIVE_SPELLS = 1;
const ACTIVE_SPELLS_REQUIRED_ERROR = "SPELLBOOK_V2 must keep at least one active spell";
const CANONICAL_SPELL_FIELD_KEYS = Object.freeze(["id", "phrase", "onnx"]);

function isEntityIdLike(v) {
  return typeof v === "string" && ENTITY_ID_PATTERN.test(v);
}

function spellLabel(id) {
  return id || MISSING_ID_LABEL;
}

function pushFiniteRangeErrorWhenInvalid(errors, message, value, min, max = Number.POSITIVE_INFINITY) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) errors.push(message);
}

function pushDuplicateErrorWhenSeen(errors, seenSet, value, message) {
  if (seenSet.has(value)) errors.push(message);
  seenSet.add(value);
}

function pushCanonicalLowercaseErrorWhenPresent(errors, rawValue, canonicalValue, message) {
  if (rawValue && rawValue !== canonicalValue) errors.push(message);
}

function pushCanonicalSpellFieldErrors(errors, fieldsByKey, idLabel) {
  for (const key of CANONICAL_SPELL_FIELD_KEYS) {
    const rawValue = fieldsByKey[`raw${key.charAt(0).toUpperCase()}${key.slice(1)}`];
    const canonicalValue = fieldsByKey[key];
    const label = key === "id" ? rawValue : idLabel;
    pushCanonicalLowercaseErrorWhenPresent(
      errors,
      rawValue,
      canonicalValue,
      `SPELLBOOK_V2 spell ${label} ${key} must be lowercase/canonical`
    );
  }
}

function pushMissingSpellFieldErrors(errors, id, phrase, onnx) {
  if (!id) errors.push("SPELLBOOK_V2 spell entry is missing id");
  if (!phrase) errors.push(`SPELLBOOK_V2 spell ${spellLabel(id)} is missing phrase`);
  if (!onnx) errors.push(`SPELLBOOK_V2 spell ${spellLabel(id)} is missing onnx`);
}

function pushSpellShapeErrors(errors, id, phrase, onnx) {
  if (id && !isEntityIdLike(id)) {
    errors.push(`SPELLBOOK_V2 spell id has invalid shape (letters/numbers/_ only): ${id}`);
  }
  if (phrase && !PHRASE_PATTERN.test(phrase)) {
    errors.push(
      `SPELLBOOK_V2 spell ${spellLabel(id)} phrase has invalid shape (letters/numbers/_/space only): ${phrase}`
    );
  }
  if (onnx && !isEntityIdLike(onnx)) {
    errors.push(`SPELLBOOK_V2 spell ${spellLabel(id)} onnx has invalid shape (letters/numbers/_ only): ${onnx}`);
  }
}

function pushSpellDuplicateErrors(errors, seenIds, seenPhrases, id, phrase) {
  if (id) {
    pushDuplicateErrorWhenSeen(errors, seenIds, id, `SPELLBOOK_V2 contains duplicate id: ${id}`);
  }
  if (phrase) {
    pushDuplicateErrorWhenSeen(
      errors,
      seenPhrases,
      phrase,
      `SPELLBOOK_V2 contains duplicate phrase: ${phrase}`
    );
  }
}

function countActiveSpells(spells) {
  return spells.reduce((acc, spell) => acc + ((spell?.active !== false) ? 1 : 0), 0);
}

function validateSpellbookRoot(errors, cfg) {
  if (asText(cfg.version) !== "2") {
    errors.push("SPELLBOOK_V2.version must be \"2\"");
  }
  if (!Array.isArray(cfg.spells)) {
    errors.push("SPELLBOOK_V2.spells must be an array");
    return false;
  }
  return true;
}

function validateSpellbookRules(errors, spells) {
  const seenIds = new Set();
  const seenPhrases = new Set();
  for (const s of spells) {
    const spell = asObj(s);
    const rawId = asText(spell.id);
    const rawPhrase = asText(spell.phrase);
    const rawOnnx = asText(spell.onnx);
    const id = rawId.toLowerCase();
    const phrase = rawPhrase.toLowerCase();
    const onnx = rawOnnx.toLowerCase();
    const canonicalFields = { rawId, rawPhrase, rawOnnx, id, phrase, onnx };

    pushMissingSpellFieldErrors(errors, id, phrase, onnx);
    pushCanonicalSpellFieldErrors(errors, canonicalFields, spellLabel(id));

    pushSpellShapeErrors(errors, id, phrase, onnx);
    pushSpellDuplicateErrors(errors, seenIds, seenPhrases, id, phrase);

    if (Object.hasOwn(spell, "active") && typeof spell.active !== "boolean") {
      errors.push(`SPELLBOOK_V2 spell ${spellLabel(id)} active must be boolean`);
    }
    pushFiniteRangeErrorWhenInvalid(
      errors,
      `SPELLBOOK_V2 spell ${spellLabel(id)} confidence must be a finite number in [0,1]`,
      spell.confidence,
      0,
      1
    );
    pushFiniteRangeErrorWhenInvalid(
      errors,
      `SPELLBOOK_V2 spell ${spellLabel(id)} cooldownMs must be a finite number >= 0`,
      spell.cooldownMs,
      0
    );
  }
}

export function validateSpellbookV2(input = SPELLBOOK_V2) {
  const errors = [];
  const cfg = asObj(input);

  if (!validateSpellbookRoot(errors, cfg)) {
    return errors;
  }
  validateSpellbookRules(errors, cfg.spells);

  const activeCount = countActiveSpells(cfg.spells);
  if (activeCount < MIN_ACTIVE_SPELLS) {
    errors.push(ACTIVE_SPELLS_REQUIRED_ERROR);
  }

  return errors;
}
