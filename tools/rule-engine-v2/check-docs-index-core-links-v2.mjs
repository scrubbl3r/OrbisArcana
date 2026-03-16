import {
  RULE_ENGINE_V2_CORE_MARKDOWN_DOC_KEYS,
  RULE_ENGINE_V2_DOC_PATHS,
} from "./docs-paths-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { docsIndexLinkTokenForRelPathV2 } from "./docs-index-tokens-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readDocsIndexV2 } from "./read-docs-index-v2.mjs";

const CHECK_TAG = "docs-index-core-links:v2";
const { rel: docsIndexRel, text } = readDocsIndexV2();

for (const key of RULE_ENGINE_V2_CORE_MARKDOWN_DOC_KEYS) {
  if (key === "docsIndex") continue;
  const rel = RULE_ENGINE_V2_DOC_PATHS[key];
  const token = docsIndexLinkTokenForRelPathV2(rel);
  if (!text.includes(token)) {
    failCheck(CHECK_TAG, `${docsIndexRel} missing core doc link: ${rel}`);
  }
}

reportCheckPass(CHECK_TAG, "docs index links all core markdown docs");
