import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";
import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";

const CHECK_TAG = "interactions-schema-wordbook-surface:v2";
const REL = RULE_ENGINE_V2_DOC_PATHS.interactionsSchemaDoc;
const text = readRelativeText(REL);

requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "File 1: Word Inventory",
    "`wordbook`",
    "compatibility alias",
    "`spellbook`",
    "words:",
    "type: \"word\"",
    "compatibility alias: \"spell\"",
    "word.rota",
    "wake_win.words[]",
    "wake_win.spells[]",
  ],
  missingMessage: (token) => `${REL} missing required canonical token: ${token}`,
});

if (text.includes("### Spellbook Responsibilities")) {
  failCheck(CHECK_TAG, `${REL} must use canonical Wordbook Responsibilities heading`);
}

reportCheckPass(
  CHECK_TAG,
  "interactions schema uses canonical wordbook terminology with explicit spellbook compatibility alias"
);
