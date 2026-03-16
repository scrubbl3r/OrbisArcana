import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";

const CHECK_TAG = "docs-index-canonical-signals:v2";
const docsIndexRel = RULE_ENGINE_V2_DOC_PATHS.docsIndex;
const text = readRelativeText(docsIndexRel);

if (!text.includes("`gesture.spin_y`")) {
  failCheck(CHECK_TAG, `${docsIndexRel} must include canonical signal example \`gesture.spin_y\``);
}
if (text.includes("`gesture.Y_SPIN`")) {
  failCheck(CHECK_TAG, `${docsIndexRel} contains legacy signal example \`gesture.Y_SPIN\``);
}

reportCheckPass(CHECK_TAG, "docs index signal examples use canonical gesture ids");
