import { formatCheckStatusList } from "./status-format-v2.mjs";

function buildCheckResultsByKey(entries, runCheck, keyField = "id") {
  const items = Array.isArray(entries) ? entries : [];
  const keyName = String(keyField || "").trim() || "id";
  const byKey = Object.freeze(Object.fromEntries(
    items.map((entry) => [entry?.[keyName], runCheck(entry?.script)])
  ));
  const ok = items.every((entry) => byKey[entry?.[keyName]] === true);
  return Object.freeze({ byKey, ok });
}

function buildCheckResultsWithStatusList(entries, runCheck, yesNo) {
  const { byKey, ok } = buildCheckResultsByKey(entries, runCheck, "id");
  const results = Object.freeze({ byId: byKey, ok });
  const statusList = formatCheckStatusList(entries, results.byId, yesNo);
  return Object.freeze({ results, statusList });
}

function buildStatusSectionV2(entries, runCheck, yesNo) {
  const check = buildCheckResultsWithStatusList(entries, runCheck, yesNo);
  const booleans = buildCheckBooleanMap(entries, check.results.byId);
  return Object.freeze({
    results: check.results,
    statusList: check.statusList,
    booleans,
  });
}

export function buildStatusSectionsV2(defs, runCheck, yesNo) {
  const list = Array.isArray(defs) ? defs : [];
  return Object.freeze(
    Object.fromEntries(
      list.map((def) => {
        const key = String(def?.key || "").trim();
        return [key, buildStatusSectionV2(def?.entries || [], runCheck, yesNo)];
      })
    )
  );
}

export function buildNamedManifestArtifactsV2(entries, runCheck, yesNo) {
  const items = Array.isArray(entries) ? entries : [];
  const byName = buildCheckResultsByKey(items, runCheck, "name").byKey;
  const names = items.map((entry) => entry?.name);
  return buildOrderedBooleanArtifacts(names, byName, yesNo);
}

function buildCheckBooleanMap(entries, checksById) {
  const items = Array.isArray(entries) ? entries : [];
  return Object.fromEntries(
    items.map((entry) => [entry.id, checksById[entry.id] === true])
  );
}

function buildOrderedBooleanArtifacts(order, valuesByName, yesNo) {
  const names = Array.isArray(order) ? order : [];
  const booleans = Object.fromEntries(
    names.map((name) => [name, valuesByName[name] === true])
  );
  const summary = names.map((name) => yesNo(valuesByName[name] === true)).join("/");
  return Object.freeze({ booleans, summary });
}
