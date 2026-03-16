import {
  docRelPathsForKeysV2,
  RULE_ENGINE_V2_CORE_MARKDOWN_DOC_KEYS,
} from "./docs-paths-v2.mjs";
import { RULE_ENGINE_V2_LEGACY_HANDLE_TOKENS } from "./handle-naming-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { requireTextExcludesTokensV2 } from "./check-token-assertions-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";

const CHECK_TAG = "docs-legacy-handle-drift:v2";

const docFiles = Object.freeze(docRelPathsForKeysV2(RULE_ENGINE_V2_CORE_MARKDOWN_DOC_KEYS));

for (const rel of docFiles) {
  const text = readRelativeText(rel);
  requireTextExcludesTokensV2({
    tag: CHECK_TAG,
    text,
    tokens: RULE_ENGINE_V2_LEGACY_HANDLE_TOKENS,
    forbiddenMessage: (token) => `${rel} contains legacy token: ${token}`,
  });
}

reportCheckPass(CHECK_TAG, "rule-engine docs are free of legacy handle names");
