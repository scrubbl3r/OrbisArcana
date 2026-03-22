// Canonical FAIL reporter and exit helpers for rule-engine-v2 checks.
// All helpers normalize tag/message so failure output format stays stable.
// Default tag/message values preserve predictable output under bad caller input.
function normalizeFailureArgs(tag, msg) {
  const safeTag = typeof tag === "string" ? tag.trim() : "";
  const safeMessage = typeof msg === "string" ? msg.trim() : "";
  return Object.freeze({
    tag: safeTag || "rule-engine-v2",
    msg: safeMessage || "check failed",
  });
}

export function failCheck(tag, msg) {
  const safe = normalizeFailureArgs(tag, msg);
  console.error(`[${safe.tag}] FAIL: ${safe.msg}`);
  process.exit(1);
}

export function failCheckStatus(tag, msg, status = 1) {
  const safe = normalizeFailureArgs(tag, msg);
  console.error(`[${safe.tag}] FAIL: ${safe.msg}`);
  process.exit(Number.isInteger(status) ? status : 1);
}

export function failCheckWithDetails(tag, msg, details = []) {
  const safe = normalizeFailureArgs(tag, msg);
  console.error(`[${safe.tag}] FAIL: ${safe.msg}`);
  for (const line of Array.isArray(details) ? details : []) {
    const safeLine = typeof line === "string" ? line : "";
    if (!safeLine) continue;
    console.error(`  - ${safeLine}`);
  }
  process.exit(1);
}
