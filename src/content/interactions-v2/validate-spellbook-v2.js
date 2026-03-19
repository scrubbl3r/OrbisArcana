import { SPELLBOOK_V2 } from "./spellbook-v2.js";
import { asObj, asText } from "./orchestrator-v1-normalizers.js";

const MISSING_ID_LABEL = "(missing-id)";
const ROOT_CONTEXT = "SPELLBOOK_V2";
const SPELLBOOK_VERSION = "2";
const FIELD_VERSION = "version";
const FIELD_SPELLS = "spells";
const FIELD_ID = "id";
const FIELD_PHRASE = "phrase";
const FIELD_ONNX = "onnx";
const FIELD_ACTIVE = "active";
const FIELD_CONFIDENCE = "confidence";
const FIELD_COOLDOWN_MS = "cooldownMs";
const FIELD_RAW_ID = "rawId";
const FIELD_RAW_PHRASE = "rawPhrase";
const FIELD_RAW_ONNX = "rawOnnx";
const ENTITY_ID_PATTERN = /^[a-z0-9_]+$/;
const PHRASE_PATTERN = /^[a-z0-9_ ]+$/;
const MIN_ACTIVE_SPELLS = 1;
const ACTIVE_SPELLS_REQUIRED_ERROR = `${ROOT_CONTEXT} must keep at least one active spell`;
const CANONICAL_SPELL_FIELD_KEYS = Object.freeze([FIELD_ID, FIELD_PHRASE, FIELD_ONNX]);
const RAW_SPELL_FIELD_BY_KEY = Object.freeze({
  [FIELD_ID]: FIELD_RAW_ID,
  [FIELD_PHRASE]: FIELD_RAW_PHRASE,
  [FIELD_ONNX]: FIELD_RAW_ONNX,
});

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
    const rawValue = fieldsByKey[RAW_SPELL_FIELD_BY_KEY[key]];
    const canonicalValue = fieldsByKey[key];
    const label = key === FIELD_ID ? rawValue : idLabel;
    pushCanonicalLowercaseErrorWhenPresent(
      errors,
      rawValue,
      canonicalValue,
      `${ROOT_CONTEXT} spell ${label} ${key} must be lowercase/canonical`
    );
  }
}

function pushMissingSpellFieldErrors(errors, id, phrase, onnx) {
  if (!id) errors.push(`${ROOT_CONTEXT} spell entry is missing id`);
  if (!phrase) errors.push(`${ROOT_CONTEXT} spell ${spellLabel(id)} is missing phrase`);
  if (!onnx) errors.push(`${ROOT_CONTEXT} spell ${spellLabel(id)} is missing onnx`);
}

function pushSpellShapeErrors(errors, id, phrase, onnx) {
  if (id && !isEntityIdLike(id)) {
    errors.push(`${ROOT_CONTEXT} spell id has invalid shape (letters/numbers/_ only): ${id}`);
  }
  if (phrase && !PHRASE_PATTERN.test(phrase)) {
    errors.push(
      `${ROOT_CONTEXT} spell ${spellLabel(id)} phrase has invalid shape (letters/numbers/_/space only): ${phrase}`
    );
  }
  if (onnx && !isEntityIdLike(onnx)) {
    errors.push(`${ROOT_CONTEXT} spell ${spellLabel(id)} onnx has invalid shape (letters/numbers/_ only): ${onnx}`);
  }
}

function pushSpellDuplicateErrors(errors, seenIds, seenPhrases, id, phrase) {
  if (id) {
    pushDuplicateErrorWhenSeen(errors, seenIds, id, `${ROOT_CONTEXT} contains duplicate id: ${id}`);
  }
  if (phrase) {
    pushDuplicateErrorWhenSeen(
      errors,
      seenPhrases,
      phrase,
      `${ROOT_CONTEXT} contains duplicate phrase: ${phrase}`
    );
  }
}

function countActiveSpells(spells) {
  return spells.reduce((acc, spell) => acc + ((spell?.[FIELD_ACTIVE] !== false) ? 1 : 0), 0);
}

function validateSpellbookRoot(errors, cfg) {
  if (asText(cfg[FIELD_VERSION]) !== SPELLBOOK_VERSION) {
    errors.push(`${ROOT_CONTEXT}.version must be "${SPELLBOOK_VERSION}"`);
  }
  if (!Array.isArray(cfg[FIELD_SPELLS])) {
    errors.push(`${ROOT_CONTEXT}.spells must be an array`);
    return false;
  }
  return true;
}

function validateSpellEntry(errors, seenIds, seenPhrases, spellRaw) {
  const spell = asObj(spellRaw);
  const rawId = asText(spell[FIELD_ID]);
  const rawPhrase = asText(spell[FIELD_PHRASE]);
  const rawOnnx = asText(spell[FIELD_ONNX]);
  const canonicalFields = {
    [FIELD_RAW_ID]: rawId,
    [FIELD_RAW_PHRASE]: rawPhrase,
    [FIELD_RAW_ONNX]: rawOnnx,
    [FIELD_ID]: rawId.toLowerCase(),
    [FIELD_PHRASE]: rawPhrase.toLowerCase(),
    [FIELD_ONNX]: rawOnnx.toLowerCase(),
  };
  const { id, phrase, onnx } = canonicalFields;

  pushMissingSpellFieldErrors(errors, id, phrase, onnx);
  pushCanonicalSpellFieldErrors(errors, canonicalFields, spellLabel(id));
  pushSpellShapeErrors(errors, id, phrase, onnx);
  pushSpellDuplicateErrors(errors, seenIds, seenPhrases, id, phrase);
  validateSpellScalarFields(errors, spell, id);
}

function validateSpellScalarFields(errors, spell, id) {
  if (Object.hasOwn(spell, FIELD_ACTIVE) && typeof spell[FIELD_ACTIVE] !== "boolean") {
    errors.push(`${ROOT_CONTEXT} spell ${spellLabel(id)} active must be boolean`);
  }
  pushFiniteRangeErrorWhenInvalid(
    errors,
    `${ROOT_CONTEXT} spell ${spellLabel(id)} confidence must be a finite number in [0,1]`,
    spell[FIELD_CONFIDENCE],
    0,
    1
  );
  pushFiniteRangeErrorWhenInvalid(
    errors,
    `${ROOT_CONTEXT} spell ${spellLabel(id)} cooldownMs must be a finite number >= 0`,
    spell[FIELD_COOLDOWN_MS],
    0
  );
}

function validateMinimumActiveSpells(errors, spells) {
  const activeCount = countActiveSpells(spells);
  if (activeCount < MIN_ACTIVE_SPELLS) {
    errors.push(ACTIVE_SPELLS_REQUIRED_ERROR);
  }
}

export function validateSpellbookV2(input = SPELLBOOK_V2) {
  const errors = [];
  const cfg = asObj(input);

  if (!validateSpellbookRoot(errors, cfg)) {
    return errors;
  }
  const seenIds = new Set();
  const seenPhrases = new Set();
  for (const spell of cfg[FIELD_SPELLS]) {
    validateSpellEntry(errors, seenIds, seenPhrases, spell);
  }
  validateMinimumActiveSpells(errors, cfg[FIELD_SPELLS]);

  return errors;
}
