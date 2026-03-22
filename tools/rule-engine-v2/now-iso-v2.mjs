// Returns current UTC time as an ISO-8601 timestamp.
// Centralized to keep generated artifact timestamps formatted consistently.
// Keep implementation minimal so call sites are easy to trust in checks.
export function nowIso() {
  return new Date().toISOString();
}
