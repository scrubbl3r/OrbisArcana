import { WORDBOOK_V2 } from "./wordbook-v2.js?v=20260520salubrumww";
import { asObj, asText } from "./interactions-v2-normalizers.js";

const MISSING_ID_LABEL = "(missing-id)";
const ROOT_CONTEXT = "WORDBOOK_V2";
const WORDBOOK_VERSION = "2";
const FIELD_VERSION = "version";
const FIELD_WORDS = "words";
const FIELD_SPELLS = "spells";
const FIELD_ID = "id";
const FIELD_PHRASE = "phrase";
const FIELD_LABEL = "label";
const FIELD_ONNX = "onnx";
const FIELD_ACTIVE = "active";
const FIELD_CONFIDENCE = "confidence";
const FIELD_COOLDOWN_MS = "cooldownMs";
const FIELD_RAW_ID = "rawId";
const FIELD_RAW_PHRASE = "rawPhrase";
const FIELD_RAW_ONNX = "rawOnnx";
const ENTITY_ID_PATTERN = /^[a-z0-9_]+$/;
const PHRASE_PATTERN = /^[a-z0-9_ ]+$/;
const MIN_ACTIVE_WORDS = 1;
const ACTIVE_WORDS_REQUIRED_ERROR = `${ROOT_CONTEXT} must keep at least one active word`;
const ERROR_MISSING_WORD_ID = `${ROOT_CONTEXT} word entry is missing id`;
const ERROR_SHAPE_ID_SUFFIX = "has invalid shape (letters/numbers/_ only)";
const ERROR_SHAPE_PHRASE_SUFFIX = "phrase has invalid shape (letters/numbers/_/space only)";
const CANONICAL_WORD_FIELD_KEYS = Object.freeze([FIELD_ID, FIELD_PHRASE, FIELD_ONNX]);
const RAW_WORD_FIELD_BY_KEY = Object.freeze({
  [FIELD_ID]: FIELD_RAW_ID,
  [FIELD_PHRASE]: FIELD_RAW_PHRASE,
  [FIELD_ONNX]: FIELD_RAW_ONNX,
});

function wordContextMessage(id, message) {
  return `${ROOT_CONTEXT} word ${id || MISSING_ID_LABEL} ${message}`;
}

export function validateWordbookV2(input = WORDBOOK_V2) {
  const errors = [];
  const cfg = asObj(input);

  if (asText(cfg[FIELD_VERSION]) !== WORDBOOK_VERSION) {
    errors.push(`${ROOT_CONTEXT}.version must be "${WORDBOOK_VERSION}"`);
  }
  const words = Array.isArray(cfg[FIELD_WORDS])
    ? cfg[FIELD_WORDS]
    : (Array.isArray(cfg[FIELD_SPELLS]) ? cfg[FIELD_SPELLS] : null);
  if (!Array.isArray(words)) {
    errors.push(`${ROOT_CONTEXT}.words must be an array`);
    return errors;
  }
  const seenIds = new Set();
  const seenPhrases = new Set();
  for (const wordRaw of words) {
    const word = asObj(wordRaw);
    const rawId = asText(word[FIELD_ID]);
    const rawPhrase = asText(word[FIELD_PHRASE]);
    const rawOnnx = asText(word[FIELD_ONNX]);
    const canonicalFields = {
      [FIELD_RAW_ID]: rawId,
      [FIELD_RAW_PHRASE]: rawPhrase,
      [FIELD_RAW_ONNX]: rawOnnx,
      [FIELD_ID]: rawId.toLowerCase(),
      [FIELD_PHRASE]: rawPhrase.toLowerCase(),
      [FIELD_ONNX]: rawOnnx.toLowerCase(),
    };
    const { id, phrase, onnx } = canonicalFields;

    if (!id) errors.push(ERROR_MISSING_WORD_ID);
    if (!phrase) errors.push(wordContextMessage(id, "is missing phrase"));
    if (!onnx) errors.push(wordContextMessage(id, "is missing onnx"));
    for (const key of CANONICAL_WORD_FIELD_KEYS) {
      const rawValue = canonicalFields[RAW_WORD_FIELD_BY_KEY[key]];
      const canonicalValue = canonicalFields[key];
      const label = key === FIELD_ID ? rawValue : id || MISSING_ID_LABEL;
      if (rawValue && rawValue !== canonicalValue) {
        errors.push(`${ROOT_CONTEXT} word ${label} ${key} must be lowercase/canonical`);
      }
    }
    if (id && !ENTITY_ID_PATTERN.test(id)) {
      errors.push(`${ROOT_CONTEXT} word id ${ERROR_SHAPE_ID_SUFFIX}: ${id}`);
    }
    if (phrase && !PHRASE_PATTERN.test(phrase)) {
      errors.push(wordContextMessage(id, `${ERROR_SHAPE_PHRASE_SUFFIX}: ${phrase}`));
    }
    if (onnx && !ENTITY_ID_PATTERN.test(onnx)) {
      errors.push(wordContextMessage(id, `${FIELD_ONNX} ${ERROR_SHAPE_ID_SUFFIX}: ${onnx}`));
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
    if (Object.hasOwn(word, FIELD_ACTIVE) && typeof word[FIELD_ACTIVE] !== "boolean") {
      errors.push(wordContextMessage(id, "active must be boolean"));
    }
    if (Object.hasOwn(word, FIELD_LABEL)) {
      const label = String(word[FIELD_LABEL] ?? "").trim();
      if (!label) {
        errors.push(wordContextMessage(id, "label must be a non-empty string when present"));
      }
    }
    {
      const confidence = Number(word[FIELD_CONFIDENCE]);
      if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
        errors.push(wordContextMessage(id, "confidence must be a finite number in [0,1]"));
      }
    }
    {
      const cooldownMs = Number(word[FIELD_COOLDOWN_MS]);
      if (!Number.isFinite(cooldownMs) || cooldownMs < 0) {
        errors.push(wordContextMessage(id, "cooldownMs must be a finite number >= 0"));
      }
    }
  }
  const activeCount = words.reduce(
    (acc, word) => acc + (word?.[FIELD_ACTIVE] !== false ? 1 : 0),
    0
  );
  if (activeCount < MIN_ACTIVE_WORDS) {
    errors.push(ACTIVE_WORDS_REQUIRED_ERROR);
  }

  return errors;
}
