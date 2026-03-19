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

function spellContextMessage(id, message) {
  return `${ROOT_CONTEXT} spell ${id || MISSING_ID_LABEL} ${message}`;
}

export function validateSpellbookV2(input = SPELLBOOK_V2) {
  const errors = [];
  const cfg = asObj(input);

  if (asText(cfg[FIELD_VERSION]) !== SPELLBOOK_VERSION) {
    errors.push(`${ROOT_CONTEXT}.version must be "${SPELLBOOK_VERSION}"`);
  }
  if (!Array.isArray(cfg[FIELD_SPELLS])) {
    errors.push(`${ROOT_CONTEXT}.spells must be an array`);
    return errors;
  }
  const spells = cfg[FIELD_SPELLS];
  const seenIds = new Set();
  const seenPhrases = new Set();
  for (const spellRaw of spells) {
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

    if (!id) errors.push(ERROR_MISSING_SPELL_ID);
    if (!phrase) errors.push(spellContextMessage(id, "is missing phrase"));
    if (!onnx) errors.push(spellContextMessage(id, "is missing onnx"));
    for (const key of CANONICAL_SPELL_FIELD_KEYS) {
      const rawValue = canonicalFields[RAW_SPELL_FIELD_BY_KEY[key]];
      const canonicalValue = canonicalFields[key];
      const label = key === FIELD_ID ? rawValue : id || MISSING_ID_LABEL;
      if (rawValue && rawValue !== canonicalValue) {
        errors.push(`${ROOT_CONTEXT} spell ${label} ${key} must be lowercase/canonical`);
      }
    }
    if (id && !ENTITY_ID_PATTERN.test(id)) {
      errors.push(`${ROOT_CONTEXT} spell id ${ERROR_SHAPE_ID_SUFFIX}: ${id}`);
    }
    if (phrase && !PHRASE_PATTERN.test(phrase)) {
      errors.push(spellContextMessage(id, `${ERROR_SHAPE_PHRASE_SUFFIX}: ${phrase}`));
    }
    if (onnx && !ENTITY_ID_PATTERN.test(onnx)) {
      errors.push(spellContextMessage(id, `${FIELD_ONNX} ${ERROR_SHAPE_ID_SUFFIX}: ${onnx}`));
    }
    if (id) {
      if (seenIds.has(id)) {
        errors.push(`${ROOT_CONTEXT} contains duplicate id: ${id}`);
      }
      seenIds.add(id);
    }
    if (phrase) {
      if (seenPhrases.has(phrase)) {
        errors.push(`${ROOT_CONTEXT} contains duplicate phrase: ${phrase}`);
      }
      seenPhrases.add(phrase);
    }
    if (Object.hasOwn(spell, FIELD_ACTIVE) && typeof spell[FIELD_ACTIVE] !== "boolean") {
      errors.push(spellContextMessage(id, "active must be boolean"));
    }
    {
      const confidence = Number(spell[FIELD_CONFIDENCE]);
      if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
        errors.push(spellContextMessage(id, "confidence must be a finite number in [0,1]"));
      }
    }
    {
      const cooldownMs = Number(spell[FIELD_COOLDOWN_MS]);
      if (!Number.isFinite(cooldownMs) || cooldownMs < 0) {
        errors.push(spellContextMessage(id, "cooldownMs must be a finite number >= 0"));
      }
    }
  }
  const activeCount = spells.reduce(
    (acc, spell) => acc + (spell?.[FIELD_ACTIVE] !== false ? 1 : 0),
    0
  );
  if (activeCount < MIN_ACTIVE_SPELLS) {
    errors.push(ACTIVE_SPELLS_REQUIRED_ERROR);
  }

  return errors;
}
