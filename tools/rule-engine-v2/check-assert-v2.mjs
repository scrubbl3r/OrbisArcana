// Tiny assertion helper for check scripts that throws on assertion failure.
// Keeps minimal throw-based semantics for fixture-level assertions.
// Message passthrough is intentional so caller context remains intact.
export function assertCheck(condition, message) {
  if (!condition) throw new Error(message);
}
