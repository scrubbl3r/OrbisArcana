import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "master-control-schema-wake-words-surface:v2";
const REL = RULE_ENGINE_V2_DOC_PATHS.masterControlSchemaDoc;
const text = readRelativeText(REL);

requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "wake_win.words[]",
    "wake_win.spells[]",
    "compatibility alias",
  ],
  missingMessage: (token) => `${REL} missing wake_win canonical token: ${token}`,
});

if (text.includes('{ type: "wake_win", spells: [')) {
  failCheck(
    CHECK_TAG,
    `${REL} must use canonical wake_win.words in inline examples (spells-only example detected)`
  );
}

reportCheckPass(
  CHECK_TAG,
  "master-control schema documents canonical wake_win.words with explicit wake_win.spells compatibility alias"
);
