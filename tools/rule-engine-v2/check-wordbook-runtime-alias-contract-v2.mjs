import {
  WORDS,
  WORDS_BY_ID,
  ACTIVE_WORDS,
  ACTIVE_WORDS_BY_ID,
  SPELLS,
  SPELLS_BY_ID,
  ACTIVE_SPELLS,
  ACTIVE_SPELLS_BY_ID,
} from "../../src/voice/wordbook.js";
import {
  SPELLS as LEGACY_SPELLS,
  SPELLS_BY_ID as LEGACY_SPELLS_BY_ID,
  ACTIVE_SPELLS as LEGACY_ACTIVE_SPELLS,
  ACTIVE_SPELLS_BY_ID as LEGACY_ACTIVE_SPELLS_BY_ID,
} from "../../src/voice/spellbook.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

// Verifies runtime wordbook exports and legacy spellbook aliases remain reference-identical.
const CHECK_TAG = "wordbook-runtime-alias:v2";
const PASS_MESSAGE = "runtime wordbook and legacy spellbook exports are alias-compatible";

if (SPELLS !== WORDS) failCheck(CHECK_TAG, "wordbook SPELLS alias must match WORDS");
if (SPELLS_BY_ID !== WORDS_BY_ID) failCheck(CHECK_TAG, "wordbook SPELLS_BY_ID alias must match WORDS_BY_ID");
if (ACTIVE_SPELLS !== ACTIVE_WORDS) failCheck(CHECK_TAG, "wordbook ACTIVE_SPELLS alias must match ACTIVE_WORDS");
if (ACTIVE_SPELLS_BY_ID !== ACTIVE_WORDS_BY_ID) {
  failCheck(CHECK_TAG, "wordbook ACTIVE_SPELLS_BY_ID alias must match ACTIVE_WORDS_BY_ID");
}

if (LEGACY_SPELLS !== SPELLS) failCheck(CHECK_TAG, "legacy spellbook SPELLS must re-export runtime wordbook");
if (LEGACY_SPELLS_BY_ID !== SPELLS_BY_ID) {
  failCheck(CHECK_TAG, "legacy spellbook SPELLS_BY_ID must re-export runtime wordbook");
}
if (LEGACY_ACTIVE_SPELLS !== ACTIVE_SPELLS) {
  failCheck(CHECK_TAG, "legacy spellbook ACTIVE_SPELLS must re-export runtime wordbook");
}
if (LEGACY_ACTIVE_SPELLS_BY_ID !== ACTIVE_SPELLS_BY_ID) {
  failCheck(CHECK_TAG, "legacy spellbook ACTIVE_SPELLS_BY_ID must re-export runtime wordbook");
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
