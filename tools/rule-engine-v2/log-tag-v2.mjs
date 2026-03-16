export function createTaggedLogger(tag) {
  const safeTag = typeof tag === "string" ? tag.trim() : "";
  if (!safeTag) {
    throw new Error("createTaggedLogger requires a non-empty string tag");
  }
  const prefix = `[${safeTag}]`;
  return function logTagged(text) {
    const safeText = typeof text === "string" ? text : String(text ?? "");
    console.log(`${prefix} ${safeText}`);
  };
}
