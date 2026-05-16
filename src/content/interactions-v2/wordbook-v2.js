// Canonical V2 word inventory SSOT.
const WORDBOOK_V2_VERSION = "2";
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
const DEFAULT_CONFIDENCE = 0.6;
const DEFAULT_COOLDOWN_MS = 0;

function makeWord({
  id,
  phrase = id,
  label = null,
  active = true,
  onnx = id,
  confidence = DEFAULT_CONFIDENCE,
  cooldownMs = DEFAULT_COOLDOWN_MS,
}) {
  const normalizedLabel = String(label ?? "").trim();
  return Object.freeze({
    [FIELD_ID]: id,
    [FIELD_PHRASE]: phrase,
    ...(normalizedLabel ? { [FIELD_LABEL]: normalizedLabel } : {}),
    [FIELD_ACTIVE]: active,
    [FIELD_ONNX]: onnx,
    [FIELD_CONFIDENCE]: confidence,
    [FIELD_COOLDOWN_MS]: cooldownMs,
  });
}

const WORDBOOK_V2_WORD_ROWS = Object.freeze([
  makeWord({ id: "orbis" }),
  makeWord({ id: "arcana" }),
  makeWord({ id: "are_kay_nah", phrase: "are kay nah", label: "Arcana" }),
  makeWord({ id: "azerith" }),
  makeWord({ id: "echovar" }),
  makeWord({ id: "domus" }),
  makeWord({ id: "pyro" }),
  makeWord({ id: "vivora", label: "Vivora" }),
  makeWord({ id: "electrum" }),
  makeWord({ id: "sanctum" }),
  makeWord({ id: "rota" }),
]);

export const WORDBOOK_V2 = Object.freeze({
  [FIELD_VERSION]: WORDBOOK_V2_VERSION,
  [FIELD_WORDS]: WORDBOOK_V2_WORD_ROWS,
  // compatibility alias:
  [FIELD_SPELLS]: WORDBOOK_V2_WORD_ROWS,
});

function getWordList(wordbook) {
  return Array.isArray(wordbook?.[FIELD_WORDS]) ? wordbook[FIELD_WORDS].slice() : [];
}

function getWordFieldValue(word, key) {
  return word?.[key];
}

function isWordActive(word) {
  return getWordFieldValue(word, FIELD_ACTIVE) !== false;
}

export const WORDBOOK_V2_WORDS = Object.freeze(
  getWordList(WORDBOOK_V2)
);

function asWordId(word) {
  return typeof word?.[FIELD_ID] === "string" ? word[FIELD_ID].trim().toLowerCase() : "";
}

function buildWordsById(words) {
  return Object.freeze(
    words.reduce((acc, word) => {
      const id = asWordId(word);
      if (!id) return acc;
      acc[id] = word;
      return acc;
    }, {})
  );
}

function buildFrozenWordList(words, predicate = () => true) {
  return Object.freeze(words.filter(predicate));
}

function buildWordCollections(words) {
  const all = buildFrozenWordList(words);
  const active = buildFrozenWordList(words, isWordActive);
  return Object.freeze({
    all,
    allById: buildWordsById(all),
    active,
    activeById: buildWordsById(active),
  });
}

const WORD_COLLECTIONS = buildWordCollections(WORDBOOK_V2_WORDS);

export const WORDBOOK_V2_WORDS_BY_ID = Object.freeze(
  WORD_COLLECTIONS.allById
);

export const WORDBOOK_V2_ACTIVE_WORDS = Object.freeze(
  WORD_COLLECTIONS.active
);

export const WORDBOOK_V2_ACTIVE_WORDS_BY_ID = Object.freeze(
  WORD_COLLECTIONS.activeById
);
