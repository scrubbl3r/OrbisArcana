import { CHECK_TAGS_V2 } from "./check-tags-v2.mjs";
import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "regression-tags-coverage:v2";

function toCamelFromSnake(value) {
  const text = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!text) return "";
  return text.replace(/_([a-z0-9])/g, (_, ch) => ch.toUpperCase());
}

for (const entry of (Array.isArray(REGRESSION_CHECKS_V2) ? REGRESSION_CHECKS_V2 : [])) {
  const id = typeof entry?.id === "string" ? entry.id.trim() : "";
  if (!id) continue;
  const key = toCamelFromSnake(id);
  const expectedTag = `${id.replace(/_/g, "-")}:v2`;
  const actualTag = typeof CHECK_TAGS_V2?.[key] === "string" ? CHECK_TAGS_V2[key].trim() : "";
  if (!actualTag) {
    failCheck(CHECK_TAG, `CHECK_TAGS_V2 missing key for regression id '${id}' (expected key '${key}')`);
  }
  if (actualTag !== expectedTag) {
    failCheck(
      CHECK_TAG,
      `CHECK_TAGS_V2.${key} mismatch for '${id}' (expected '${expectedTag}', got '${actualTag}')`
    );
  }
}

reportCheckPass(CHECK_TAG, "CHECK_TAGS_V2 covers all regression ids with canonical tag values");
