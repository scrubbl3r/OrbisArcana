export function buildCheckResults(entries, runCheck) {
  const items = Array.isArray(entries) ? entries : [];
  const byId = Object.freeze(Object.fromEntries(
    items.map((entry) => [entry.id, runCheck(entry.script)])
  ));
  const ok = items.every((entry) => byId[entry.id] === true);
  return Object.freeze({ byId, ok });
}
