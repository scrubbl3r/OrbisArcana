import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextExcludesTokensV2, requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

// Verifies schema docs present wake_win words[] as canonical with spells[] alias notes.
const CHECK_TAG = "master-control-schema-wake-words-surface:v2";
const ACTION_WAKE_WIN = "wake_win";
const WAKE_WORDS_TOKEN = `${ACTION_WAKE_WIN}.words[]`;
const WAKE_SPELLS_TOKEN = `${ACTION_WAKE_WIN}.spells[]`;
const COMPAT_ALIAS_TOKEN = "compatibility alias";
const FORBIDDEN_SPELLS_ONLY_EXAMPLE_TOKEN = `{ type: "${ACTION_WAKE_WIN}", spells: [`;
const PASS_MESSAGE =
  `master-control schema documents canonical ${WAKE_WORDS_TOKEN} with explicit ${WAKE_SPELLS_TOKEN} compatibility alias`;
const REL = RULE_ENGINE_V2_DOC_PATHS.masterControlSchemaDoc;
const text = readRelativeText(REL);

requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [WAKE_WORDS_TOKEN, WAKE_SPELLS_TOKEN, COMPAT_ALIAS_TOKEN],
  missingMessage: (token) => `${REL} missing ${ACTION_WAKE_WIN} canonical token: ${token}`,
});

requireTextExcludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [FORBIDDEN_SPELLS_ONLY_EXAMPLE_TOKEN],
  forbiddenMessage: () =>
    `${REL} must use canonical ${ACTION_WAKE_WIN}.words in inline examples (spells-only example detected)`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
