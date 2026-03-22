// Shared helper for "must-not-match" rg contract assertions.
import { failCheck } from "./check-fail-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";
// Encapsulates rg no-match validation and normalized failure formatting.
// Entry-point guards intentionally fail fast for malformed check definitions.
function assertCheckTag(checkTag, message) {
  if (typeof checkTag !== "string" || !checkTag.trim()) {
    failCheck("rg-no-matches:v2", message);
  }
}

function assertNonEmptyString(checkTag, value, message) {
  if (typeof value !== "string" || !value.trim()) {
    failCheck(checkTag, message);
  }
}

function assertMatchesArray(checkTag, matches) {
  if (!Array.isArray(matches)) {
    failCheck(checkTag, "rg no-match helper expected runRgLines to return an array");
  }
}

function assertMatchEntries(checkTag, matches) {
  for (const [index, match] of matches.entries()) {
    if (typeof match !== "string") {
      failCheck(checkTag, `rg no-match helper expected matches[${index}] to be a string`);
    }
  }
}

function failIfRgMatches(checkTag, rgCommand, failureMessagePrefix) {
  assertCheckTag(checkTag, "rg no-match helper requires non-empty check tag");
  assertNonEmptyString(
    checkTag,
    rgCommand,
    "rg no-match helper requires non-empty rgCommand"
  );
  assertNonEmptyString(
    checkTag,
    failureMessagePrefix,
    "rg no-match helper requires non-empty failure message prefix"
  );
  const matches = runRgLines(rgCommand);
  assertMatchesArray(checkTag, matches);
  assertMatchEntries(checkTag, matches);
  if (matches.length) {
    failCheck(checkTag, `${failureMessagePrefix}: ${matches.join(", ")}`);
  }
}

export function failIfAnyRgMatches(checkTag, checks) {
  assertCheckTag(checkTag, "rg no-match checks require non-empty check tag");
  if (!Array.isArray(checks)) {
    failCheck(checkTag, "rg no-match checks must be an array");
  }
  if (!checks.length) {
    failCheck(checkTag, "rg no-match checks array must not be empty");
  }
  for (const check of checks) {
    if (!check || typeof check !== "object") {
      failCheck(checkTag, "rg no-match check entry must be an object");
    }
    failIfRgMatches(checkTag, check.rgCommand, check.failureMessagePrefix);
  }
}
