// Canonical PASS-line logger for rule-engine-v2 checks.
// Keeps check pass output formatting stable for harness/manifest consumers.
// Guard clauses intentionally reject empty tag/message to avoid ambiguous logs.
export function reportCheckPass(tag, message) {
  const safeTag = typeof tag === "string" ? tag.trim() : "";
  const safeMessage = typeof message === "string" ? message.trim() : "";
  if (!safeTag) {
    throw new Error("reportCheckPass requires a non-empty string tag");
  }
  if (!safeMessage) {
    throw new Error("reportCheckPass requires a non-empty string message");
  }
  console.log(`[${safeTag}] PASS: ${safeMessage}`);
}
