import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { readJsonOrFail } from "./check-json-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

// Confirms health/status artifacts expose canonical wordbook health fields only.
const CHECK_TAG = "health-wordbook-surface:v2";
const FIELD_WORDBOOK_OK = "wordbookOk";
const FIELD_SPELLBOOK_OK = "spellbookOk";
const FIELD_HEALTH = "health";
const LABEL_HEALTH_ARTIFACT = "health artifact";
const LABEL_STATUS_HEALTH_ARTIFACT = "status.health artifact";
const PASS_MESSAGE = "health/status artifacts expose canonical wordbookOk without spellbookOk compatibility alias";

function assertWordbookHealthSurface(doc, label) {
  const hasWordbookOk = Object.hasOwn(doc, FIELD_WORDBOOK_OK);
  const hasSpellbookOk = Object.hasOwn(doc, FIELD_SPELLBOOK_OK);
  if (!hasWordbookOk) {
    failCheck(CHECK_TAG, `${label} must include ${FIELD_WORDBOOK_OK}`);
  }
  if (doc[FIELD_WORDBOOK_OK] !== true) {
    failCheck(CHECK_TAG, `${label} wordbook health must be true`);
  }
  if (hasSpellbookOk) {
    failCheck(CHECK_TAG, `${label} must not include deprecated ${FIELD_SPELLBOOK_OK} alias`);
  }
}

const health = readJsonOrFail(CHECK_TAG, RULE_ENGINE_V2_DOC_PATHS.health);
assertWordbookHealthSurface(health, LABEL_HEALTH_ARTIFACT);

const status = readJsonOrFail(CHECK_TAG, RULE_ENGINE_V2_DOC_PATHS.status);
if (!status || typeof status !== "object") {
  failCheck(CHECK_TAG, "status artifact root must be an object");
}
if (!status[FIELD_HEALTH] || typeof status[FIELD_HEALTH] !== "object") {
  failCheck(CHECK_TAG, "status artifact must include health object");
}
assertWordbookHealthSurface(status[FIELD_HEALTH], LABEL_STATUS_HEALTH_ARTIFACT);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
