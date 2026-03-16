import {
  RULE_ENGINE_V2_CANONICAL_HANDLE_EXAMPLES,
  RULE_ENGINE_V2_CANONICAL_SIGNAL_EXAMPLES,
  RULE_ENGINE_V2_LEGACY_SIGNAL_EXAMPLES,
} from "./handle-naming-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readDocsIndexV2 } from "./read-docs-index-v2.mjs";

const CHECK_TAG = "docs-index-canonical-signals:v2";
const { rel: docsIndexRel, text } = readDocsIndexV2();

for (const token of RULE_ENGINE_V2_CANONICAL_SIGNAL_EXAMPLES) {
  if (!text.includes(token)) {
    failCheck(CHECK_TAG, `${docsIndexRel} missing canonical signal example ${token}`);
  }
}
for (const token of RULE_ENGINE_V2_CANONICAL_HANDLE_EXAMPLES) {
  if (!text.includes(token)) {
    failCheck(CHECK_TAG, `${docsIndexRel} missing canonical handle example ${token}`);
  }
}
for (const legacySignalExample of RULE_ENGINE_V2_LEGACY_SIGNAL_EXAMPLES) {
  if (text.includes(legacySignalExample)) {
    failCheck(CHECK_TAG, `${docsIndexRel} contains legacy signal example ${legacySignalExample}`);
  }
}

reportCheckPass(CHECK_TAG, "docs index signal and handle examples use canonical naming");
