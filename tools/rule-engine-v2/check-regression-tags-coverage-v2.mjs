import { CHECK_TAGS_V2 } from "./check-tags-v2.mjs";
import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

// Confirms CHECK_TAGS_V2 has canonical id-derived tags for every regression check.
const CHECK_TAG = "regression-tags-coverage:v2";
const TAG_SUFFIX = ":v2";
const MISSING_KEY_LABEL = "CHECK_TAGS_V2 missing key for regression id";
const MISMATCH_LABEL = "mismatch for";
const EXPECTED_LABEL = "expected";
const GOT_LABEL = "got";
const PASS_MESSAGE = "CHECK_TAGS_V2 covers all regression ids with canonical tag values";

function toCamelFromSnake(value) {
  const text = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!text) return "";
  return text.replace(/_([a-z0-9])/g, (_, ch) => ch.toUpperCase());
}

for (const entry of (Array.isArray(REGRESSION_CHECKS_V2) ? REGRESSION_CHECKS_V2 : [])) {
  const id = typeof entry?.id === "string" ? entry.id.trim() : "";
  if (!id) continue;
  const key = toCamelFromSnake(id);
  const expectedTag = `${id.replace(/_/g, "-")}${TAG_SUFFIX}`;
  const actualTag = typeof CHECK_TAGS_V2?.[key] === "string" ? CHECK_TAGS_V2[key].trim() : "";
  if (!actualTag) {
    failCheck(CHECK_TAG, `${MISSING_KEY_LABEL} '${id}' (${EXPECTED_LABEL} key '${key}')`);
  }
  if (actualTag !== expectedTag) {
    failCheck(
      CHECK_TAG,
      `CHECK_TAGS_V2.${key} ${MISMATCH_LABEL} '${id}' (${EXPECTED_LABEL} '${expectedTag}', ${GOT_LABEL} '${actualTag}')`
    );
  }
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
