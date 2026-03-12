export function createTaggedLogger(tag) {
  const prefix = `[${String(tag || "")}]`;
  return function logTagged(text) {
    console.log(`${prefix} ${String(text || "")}`);
  };
}
