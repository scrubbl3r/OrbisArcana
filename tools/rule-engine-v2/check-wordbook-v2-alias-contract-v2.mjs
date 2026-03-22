import {
  SPELLBOOK_V2,
  SPELLBOOK_V2_SPELLS,
  SPELLBOOK_V2_SPELLS_BY_ID,
  SPELLBOOK_V2_ACTIVE_SPELLS,
  SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID,
  WORDBOOK_V2,
  WORDBOOK_V2_WORDS,
  WORDBOOK_V2_WORDS_BY_ID,
  WORDBOOK_V2_ACTIVE_WORDS,
  WORDBOOK_V2_ACTIVE_WORDS_BY_ID,
  validateSpellbookV2,
  validateWordbookV2,
} from "../../src/content/interactions-v2/index.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

// Confirms wordbook-v2 aliases and validator outputs match legacy spellbook-v2 surface.
const CHECK_TAG = "wordbook-v2-alias:v2";
const PASS_MESSAGE = "wordbook aliases match spellbook exports and validator behavior";

if (WORDBOOK_V2 !== SPELLBOOK_V2) {
  failCheck(CHECK_TAG, "WORDBOOK_V2 must alias SPELLBOOK_V2");
}
if (WORDBOOK_V2_WORDS !== SPELLBOOK_V2_SPELLS) {
  failCheck(CHECK_TAG, "WORDBOOK_V2_WORDS must alias SPELLBOOK_V2_SPELLS");
}
if (WORDBOOK_V2_WORDS_BY_ID !== SPELLBOOK_V2_SPELLS_BY_ID) {
  failCheck(CHECK_TAG, "WORDBOOK_V2_WORDS_BY_ID must alias SPELLBOOK_V2_SPELLS_BY_ID");
}
if (WORDBOOK_V2_ACTIVE_WORDS !== SPELLBOOK_V2_ACTIVE_SPELLS) {
  failCheck(CHECK_TAG, "WORDBOOK_V2_ACTIVE_WORDS must alias SPELLBOOK_V2_ACTIVE_SPELLS");
}
if (WORDBOOK_V2_ACTIVE_WORDS_BY_ID !== SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID) {
  failCheck(CHECK_TAG, "WORDBOOK_V2_ACTIVE_WORDS_BY_ID must alias SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID");
}

const spellbookErrors = validateSpellbookV2();
const wordbookErrors = validateWordbookV2();
if (JSON.stringify(wordbookErrors) !== JSON.stringify(spellbookErrors)) {
  failCheck(CHECK_TAG, "validateWordbookV2 output must match validateSpellbookV2");
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
