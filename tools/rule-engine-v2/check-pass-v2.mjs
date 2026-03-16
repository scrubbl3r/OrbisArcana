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
