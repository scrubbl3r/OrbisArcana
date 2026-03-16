import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { RULE_ENGINE_V2_LEGACY_SIGNAL_EXAMPLES } from "./handle-naming-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";

const CHECK_TAG = "docs-index-canonical-signals:v2";
const docsIndexRel = RULE_ENGINE_V2_DOC_PATHS.docsIndex;
const text = readRelativeText(docsIndexRel);

if (!text.includes("`gesture.spin_y`")) {
  failCheck(CHECK_TAG, `${docsIndexRel} must include canonical signal example \`gesture.spin_y\``);
}
const requiredHandleExamples = Object.freeze([
  "`SPIN_X`, `SPIN_Y`, `SPIN_Z`",
  "`SHAKE_FB`, `SHAKE_LR`, `SHAKE_UD`",
  "`WAKE_WIN`",
]);
for (const token of requiredHandleExamples) {
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
