import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { readJsonOrFail } from "./check-json-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "master-control-wordbook-schema-surface:v2";
const WORDS_PATH = "wordbook.words";
const SPELLS_PATH = "spellbook.spells";
const AUTHORING_WORDS_PATH = "words[]";
const AUTHORING_SPELLS_PATH = "spells[]";
const WORDBOOK_HEADING = "## Wordbook (SSOT)";
const LEGACY_SPELLBOOK_HEADING = "## Spellbook (SSOT)";
const PASS_MESSAGE = "master-control artifacts use canonical wordbook/words terminology with explicit compatibility aliases";

function isRecord(v) {
  return (!!v && typeof v === "object" && !Array.isArray(v)) ? v : null;
}

function stable(value) {
  return JSON.stringify(value);
}

const masterJson = readJsonOrFail(CHECK_TAG, RULE_ENGINE_V2_DOC_PATHS.masterControlJson);
const masterRoot = isRecord(masterJson);
if (!masterRoot) failCheck(CHECK_TAG, "master-control json root must be an object");

const wordbook = isRecord(masterRoot.wordbook);
if (!wordbook) failCheck(CHECK_TAG, "master-control json must include canonical wordbook section");
if (!Array.isArray(wordbook.words)) {
  failCheck(CHECK_TAG, `master-control json ${WORDS_PATH} must be an array`);
}

const spellbook = isRecord(masterRoot.spellbook);
if (!spellbook) failCheck(CHECK_TAG, "master-control json must include compatibility spellbook section");
if (!Array.isArray(spellbook.spells)) {
  failCheck(CHECK_TAG, `master-control json ${SPELLS_PATH} must be an array`);
}
if (stable(wordbook.words) !== stable(spellbook.spells)) {
  failCheck(CHECK_TAG, `master-control json ${WORDS_PATH} must match compatibility ${SPELLS_PATH}`);
}

const authoringJson = readJsonOrFail(CHECK_TAG, RULE_ENGINE_V2_DOC_PATHS.masterControlAuthoringJson);
const authoringRoot = isRecord(authoringJson);
if (!authoringRoot) failCheck(CHECK_TAG, "master-control authoring json root must be an object");
if (!Array.isArray(authoringRoot.words)) {
  failCheck(CHECK_TAG, `master-control authoring json must include canonical ${AUTHORING_WORDS_PATH}`);
}
if (Object.hasOwn(authoringRoot, "spells")) {
  if (!Array.isArray(authoringRoot.spells)) {
    failCheck(CHECK_TAG, `master-control authoring compatibility ${AUTHORING_SPELLS_PATH} must be an array`);
  }
  if (stable(authoringRoot.words) !== stable(authoringRoot.spells)) {
    failCheck(CHECK_TAG, `master-control authoring ${AUTHORING_WORDS_PATH} must match compatibility ${AUTHORING_SPELLS_PATH}`);
  }
}

const markdown = readRelativeText(RULE_ENGINE_V2_DOC_PATHS.masterControlMarkdown);
if (!markdown.includes(WORDBOOK_HEADING)) {
  failCheck(CHECK_TAG, "master-control markdown must include canonical Wordbook section");
}
if (markdown.includes(LEGACY_SPELLBOOK_HEADING)) {
  failCheck(CHECK_TAG, "master-control markdown must not use legacy Spellbook section heading");
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
