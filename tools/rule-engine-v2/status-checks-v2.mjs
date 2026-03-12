export function buildCheckResults(entries, runCheck) {
  const items = Array.isArray(entries) ? entries : [];
  const byId = Object.freeze(Object.fromEntries(
    items.map((entry) => [entry.id, runCheck(entry.script)])
  ));
  const ok = items.every((entry) => byId[entry.id] === true);
  return Object.freeze({ byId, ok });
}

export function buildCheckBooleanMap(entries, checksById) {
  const items = Array.isArray(entries) ? entries : [];
  return Object.fromEntries(
    items.map((entry) => [entry.id, checksById[entry.id] === true])
  );
}

export function buildOrderedBooleanArtifacts(order, valuesByName, yesNo) {
  const names = Array.isArray(order) ? order : [];
  const booleans = Object.fromEntries(
    names.map((name) => [name, valuesByName[name] === true])
  );
  const summary = names.map((name) => yesNo(valuesByName[name] === true)).join("/");
  return Object.freeze({ booleans, summary });
}
