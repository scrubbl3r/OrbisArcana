// Creates a simple `[tag]`-prefixed logger used by artifact-writer helpers.
// Keeps log prefixing behavior unified across generated-doc utilities.
// Input normalization is intentionally conservative for deterministic logs.
export function createTaggedLogger(tag) {
  const safeTag = typeof tag === "string" ? tag.trim() : "";
  if (!safeTag) {
    throw new Error("createTaggedLogger requires a non-empty string tag");
  }
  const prefix = `[${safeTag}]`;
  return function logTagged(text) {
    const safeText = typeof text === "string"
      ? text
      : (typeof text === "number" || typeof text === "boolean" || typeof text === "bigint"
          ? `${text}`
          : "");
    console.log(`${prefix} ${safeText}`);
  };
}
