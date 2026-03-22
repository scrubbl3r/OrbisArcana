// Canonical JSON-clone helper for rule-engine-v2 checks.
// Used to isolate fixture mutations from source authoring objects during checks.
// Scope is intentionally JSON-serializable values only.
export function cloneJsonV2(value) {
  return JSON.parse(JSON.stringify(value));
}

// Compatibility alias retained as a shim for legacy call sites.
export function jsonClone(value) {
  return cloneJsonV2(value);
}
