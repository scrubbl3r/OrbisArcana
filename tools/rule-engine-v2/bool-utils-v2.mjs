// Explicit strict-boolean predicate used by contract checks.
// Keeps boolean checks intentionally strict to avoid truthy drift.
// Intentional: only literal `true` passes (not truthy values).
export function isTrue(v) {
  return v === true;
}
