import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";

// Ensures each regression script sources CHECK_TAG from CHECK_TAGS_V2 using canonical key mapping.
const CHECK_TAG = "regression-tag-source-surface:v2";
const CHECK_TAG_IMPORT_TOKEN = 'import { CHECK_TAGS_V2 } from "./check-tags-v2.mjs";';
const CHECK_TAG_ASSIGN_PREFIX = "const CHECK_TAG = CHECK_TAGS_V2.";
const CHECK_TAG_ASSIGN_SUFFIX = ";";
const MISSING_LABEL = "missing";
const PASS_MESSAGE = "all regression checks source CHECK_TAG from CHECK_TAGS_V2 using canonical id->key mapping";

function toCamelFromSnake(value) {
  const text = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!text) return "";
  return text.replace(/_([a-z0-9])/g, (_, ch) => ch.toUpperCase());
}

for (const entry of (Array.isArray(REGRESSION_CHECKS_V2) ? REGRESSION_CHECKS_V2 : [])) {
  const id = typeof entry?.id === "string" ? entry.id.trim() : "";
  const script = typeof entry?.script === "string" ? entry.script.trim() : "";
  if (!id || !script) continue;
  const text = readRelativeText(script);
  const expectedKey = toCamelFromSnake(id);
  if (!text.includes(CHECK_TAG_IMPORT_TOKEN)) {
    failCheck(CHECK_TAG, `${script} must import CHECK_TAGS_V2`);
  }
  const expectedAssign = `${CHECK_TAG_ASSIGN_PREFIX}${expectedKey}${CHECK_TAG_ASSIGN_SUFFIX}`;
  if (!text.includes(expectedAssign)) {
    failCheck(
      CHECK_TAG,
      `${script} must set CHECK_TAG from CHECK_TAGS_V2.${expectedKey} (${MISSING_LABEL} '${expectedAssign}')`
    );
  }
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
