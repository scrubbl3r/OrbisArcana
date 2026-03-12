import { formatCheckStatusList } from "./status-format-v2.mjs";

export function buildCheckResultsByKey(entries, runCheck, keyField = "id") {
  const items = Array.isArray(entries) ? entries : [];
  const keyName = String(keyField || "").trim() || "id";
  const byKey = Object.freeze(Object.fromEntries(
    items.map((entry) => [entry?.[keyName], runCheck(entry?.script)])
  ));
  const ok = items.every((entry) => byKey[entry?.[keyName]] === true);
  return Object.freeze({ byKey, ok });
}

export function buildCheckResults(entries, runCheck) {
  const { byKey, ok } = buildCheckResultsByKey(entries, runCheck, "id");
  const byId = byKey;
  return Object.freeze({ byId, ok });
}

export function buildCheckResultsWithStatusList(entries, runCheck, yesNo) {
  const results = buildCheckResults(entries, runCheck);
  const statusList = formatCheckStatusList(entries, results.byId, yesNo);
  return Object.freeze({ results, statusList });
}

export function buildStatusSectionV2(entries, runCheck, yesNo) {
  const check = buildCheckResultsWithStatusList(entries, runCheck, yesNo);
  const booleans = buildCheckBooleanMap(entries, check.results.byId);
  return Object.freeze({
    results: check.results,
    statusList: check.statusList,
    booleans,
  });
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
