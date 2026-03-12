export function reportCheckPass(tag, message) {
  const safeTag = String(tag || "");
  const safeMessage = String(message || "");
  console.log(`[${safeTag}] PASS: ${safeMessage}`);
}
