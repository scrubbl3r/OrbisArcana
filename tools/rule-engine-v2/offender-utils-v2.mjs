// Shared helpers for rg-driven offender discovery/check surface assertions.
import { failCheck } from "./check-fail-v2.mjs";
// Centralizes offender discovery and consistent failure formatting across checks.
// Assertions are intentionally strict to keep failure causes unambiguous.
function assertNonEmptyString(value, tag, message) {
  if (typeof value !== "string" || !value.trim()) {
    failCheck(tag, message);
  }
}

function assertArray(value, tag, message) {
  if (!Array.isArray(value)) {
    failCheck(tag, message);
  }
}

function assertFunction(value, tag, message) {
  if (typeof value !== "function") {
    failCheck(tag, message);
  }
}

function assertSet(value, tag, message) {
  if (!(value instanceof Set)) {
    failCheck(tag, message);
  }
}

export function extractMatchedFiles(lines) {
  assertArray(lines, "offender-utils:v2", "extractMatchedFiles lines must be an array");
  return lines
    .map((line) => line.split(":")[0])
    .filter(Boolean);
}

export function findMatchedFilesFromRg(runRgLines, rgCommand) {
  assertFunction(runRgLines, "offender-utils:v2", "findMatchedFilesFromRg runRgLines must be a function");
  assertNonEmptyString(rgCommand, "offender-utils:v2", "findMatchedFilesFromRg rgCommand must be non-empty string");
  return extractMatchedFiles(runRgLines(rgCommand));
}

export function extractUnexpectedFiles(lines, allowSet) {
  assertSet(allowSet, "offender-utils:v2", "extractUnexpectedFiles allowSet must be a Set");
  return extractMatchedFiles(lines)
    .filter((file) => !allowSet.has(file));
}

export function findUnexpectedFilesFromRg(runRgLines, rgCommand, allowSet) {
  assertFunction(runRgLines, "offender-utils:v2", "findUnexpectedFilesFromRg runRgLines must be a function");
  assertNonEmptyString(
    rgCommand,
    "offender-utils:v2",
    "findUnexpectedFilesFromRg rgCommand must be non-empty string"
  );
  return extractUnexpectedFiles(runRgLines(rgCommand), allowSet);
}

function formatUniqueFiles(files) {
  return [...new Set(files)].join(", ");
}

export function failIfOffenders(checkTag, offenders, failureMessagePrefix) {
  assertNonEmptyString(checkTag, "offender-utils:v2", "failIfOffenders checkTag must be non-empty string");
  assertArray(offenders, checkTag, "failIfOffenders offenders must be an array");
  assertNonEmptyString(
    failureMessagePrefix,
    checkTag,
    "failIfOffenders failureMessagePrefix must be non-empty string"
  );
  if (!offenders.length) return;
  failCheck(checkTag, `${failureMessagePrefix}: ${formatUniqueFiles(offenders)}`);
}

export function findUnexpectedTokenFiles(files, readTextFn, token, allowSet) {
  assertArray(files, "offender-utils:v2", "findUnexpectedTokenFiles files must be an array");
  assertFunction(readTextFn, "offender-utils:v2", "findUnexpectedTokenFiles readTextFn must be a function");
  assertNonEmptyString(token, "offender-utils:v2", "findUnexpectedTokenFiles token must be non-empty string");
  assertSet(allowSet, "offender-utils:v2", "findUnexpectedTokenFiles allowSet must be a Set");
  const offenders = [];
  for (const rel of files) {
    const text = readTextFn(rel);
    if (!text.includes(token)) continue;
    if (!allowSet.has(rel)) offenders.push(rel);
  }
  return offenders;
}
