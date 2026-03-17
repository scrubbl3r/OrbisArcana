function asObject(v) {
  return (!!v && typeof v === "object" && !Array.isArray(v)) ? v : null;
}

export function isInteractionsEnabled(interactionsV2) {
  const root = asObject(interactionsV2);
  return root?.enabled !== false;
}

export function getInteractionsDefaults(interactionsV2) {
  const root = asObject(interactionsV2);
  const defaults = root ? asObject(root.defaults) : null;
  return defaults ?? {};
}

export function getInteractionsRules(interactionsV2) {
  const root = asObject(interactionsV2);
  return Array.isArray(root?.rules) ? root.rules : [];
}
