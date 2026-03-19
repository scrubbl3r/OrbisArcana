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
const ERROR_MISSING_SPELL_ID = `${ROOT_CONTEXT} spell entry is missing id`;
const ERROR_SHAPE_ID_SUFFIX = "has invalid shape (letters/numbers/_ only)";
const ERROR_SHAPE_PHRASE_SUFFIX = "phrase has invalid shape (letters/numbers/_/space only)";
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

function spellContextLabel(id) {
  return `${ROOT_CONTEXT} spell ${spellLabel(id)}`;
}

function spellContextMessage(id, message) {
  return `${spellContextLabel(id)} ${message}`;
}

function pushFiniteRangeErrorWhenInvalid(errors, message, value, min, max = Number.POSITIVE_INFINITY) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) errors.push(message);
}

function pushDuplicateWhenSeen(errors, seenSet, value, message) {
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
  if (!id) errors.push(ERROR_MISSING_SPELL_ID);
  if (!phrase) errors.push(spellContextMessage(id, "is missing phrase"));
  if (!onnx) errors.push(spellContextMessage(id, "is missing onnx"));
}

function pushSpellShapeErrors(errors, id, phrase, onnx) {
  if (id && !isEntityIdLike(id)) {
    errors.push(`${ROOT_CONTEXT} spell id ${ERROR_SHAPE_ID_SUFFIX}: ${id}`);
  }
  if (phrase && !PHRASE_PATTERN.test(phrase)) {
    errors.push(spellContextMessage(id, `${ERROR_SHAPE_PHRASE_SUFFIX}: ${phrase}`));
  }
  if (onnx && !isEntityIdLike(onnx)) {
    errors.push(spellContextMessage(id, `onnx ${ERROR_SHAPE_ID_SUFFIX}: ${onnx}`));
  }
}

function pushSpellDuplicateErrors(errors, seenIds, seenPhrases, id, phrase) {
  if (id) {
    pushDuplicateWhenSeen(errors, seenIds, id, `${ROOT_CONTEXT} contains duplicate id: ${id}`);
  }
  if (phrase) {
    pushDuplicateWhenSeen(
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

function getSpellFieldText(spell, key) {
  return asText(spell[key]);
}

function buildCanonicalSpellFields(spell) {
  const rawId = getSpellFieldText(spell, FIELD_ID);
  const rawPhrase = getSpellFieldText(spell, FIELD_PHRASE);
  const rawOnnx = getSpellFieldText(spell, FIELD_ONNX);
  return {
    [FIELD_RAW_ID]: rawId,
    [FIELD_RAW_PHRASE]: rawPhrase,
    [FIELD_RAW_ONNX]: rawOnnx,
    [FIELD_ID]: rawId.toLowerCase(),
    [FIELD_PHRASE]: rawPhrase.toLowerCase(),
    [FIELD_ONNX]: rawOnnx.toLowerCase(),
  };
}

function validateSpellEntry(errors, seenIds, seenPhrases, spellRaw) {
  const spell = asObj(spellRaw);
  const canonicalFields = buildCanonicalSpellFields(spell);
  const { id, phrase, onnx } = canonicalFields;

  pushMissingSpellFieldErrors(errors, id, phrase, onnx);
  pushCanonicalSpellFieldErrors(errors, canonicalFields, spellLabel(id));
  pushSpellShapeErrors(errors, id, phrase, onnx);
  pushSpellDuplicateErrors(errors, seenIds, seenPhrases, id, phrase);
  validateSpellScalarFields(errors, spell, id);
}

function validateSpellScalarFields(errors, spell, id) {
  if (Object.hasOwn(spell, FIELD_ACTIVE) && typeof spell[FIELD_ACTIVE] !== "boolean") {
    errors.push(spellContextMessage(id, "active must be boolean"));
  }
  pushFiniteRangeErrorWhenInvalid(
    errors,
    spellContextMessage(id, "confidence must be a finite number in [0,1]"),
    spell[FIELD_CONFIDENCE],
    0,
    1
  );
  pushFiniteRangeErrorWhenInvalid(
    errors,
    spellContextMessage(id, "cooldownMs must be a finite number >= 0"),
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

function createSeenSpellTrackers() {
  return {
    seenIds: new Set(),
    seenPhrases: new Set(),
  };
}

function validateSpellEntries(errors, spells) {
  const { seenIds, seenPhrases } = createSeenSpellTrackers();
  for (const spell of spells) {
    validateSpellEntry(errors, seenIds, seenPhrases, spell);
  }
}

export function validateSpellbookV2(input = SPELLBOOK_V2) {
  const errors = [];
  const cfg = asObj(input);

  if (!validateSpellbookRoot(errors, cfg)) {
    return errors;
  }
  const spells = cfg[FIELD_SPELLS];
  validateSpellEntries(errors, spells);
  validateMinimumActiveSpells(errors, spells);

  return errors;
}
