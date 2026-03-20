import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { readJsonOrFail } from "./check-json-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "health-wordbook-alias-surface:v2";

function assertWordbookHealthSurface(doc, label) {
  const hasWordbookOk = Object.hasOwn(doc, "wordbookOk");
  const hasSpellbookOk = Object.hasOwn(doc, "spellbookOk");
  if (!hasWordbookOk && !hasSpellbookOk) {
    failCheck(CHECK_TAG, `${label} must include wordbookOk (or compatibility spellbookOk)`);
  }
  const wordbookOk = doc.wordbookOk === true || doc.spellbookOk === true;
  if (!wordbookOk) {
    failCheck(CHECK_TAG, `${label} wordbook health must be true`);
  }
  if (hasWordbookOk && doc.wordbookOk !== true) {
    failCheck(CHECK_TAG, `${label} wordbookOk must be true when present`);
  }
  if (hasSpellbookOk && doc.spellbookOk !== true) {
    failCheck(CHECK_TAG, `${label} spellbookOk compatibility alias must be true when present`);
  }
  if (hasWordbookOk && hasSpellbookOk && doc.wordbookOk !== doc.spellbookOk) {
    failCheck(CHECK_TAG, `${label} wordbookOk and spellbookOk compatibility alias must match`);
  }
}

const health = readJsonOrFail(CHECK_TAG, RULE_ENGINE_V2_DOC_PATHS.health);
assertWordbookHealthSurface(health, "health artifact");

const status = readJsonOrFail(CHECK_TAG, RULE_ENGINE_V2_DOC_PATHS.status);
if (!status || typeof status !== "object") {
  failCheck(CHECK_TAG, "status artifact root must be an object");
}
if (!status.health || typeof status.health !== "object") {
  failCheck(CHECK_TAG, "status artifact must include health object");
}
assertWordbookHealthSurface(status.health, "status.health artifact");

reportCheckPass(
  CHECK_TAG,
  "health/status artifacts expose canonical wordbookOk with compatible spellbookOk alias"
);
