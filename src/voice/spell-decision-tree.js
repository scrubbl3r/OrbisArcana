// Canonical spell decision tree for hybrid voice + gesture spell selection.
//
// Design intent:
// - `orbis` is a voice wake branch (voice-only open window)
// - elemental schools (`tempus`, `fridgis`, `electrum`) are selected inside a
//   flat-spin axis gesture window
// - class tokens are shared across schools (`sanctum`, `rota`, `vectus`)

export const SPELL_WINDOW_OPENERS = Object.freeze({
  VOICE_WAKE: "voice_wake",
  FLAT_SPIN_AXIS: "flat_spin_axis",
});

export const SPELL_TREE_CLASS_RUNTIME_KEY_BY_TOKEN = Object.freeze({
  sanctum: "sanctum",
  rota: "rota",
  vectus: "vectus",
});

export const SPELL_DECISION_TREE = Object.freeze({
  root: Object.freeze({
    id: "root",
    kind: "root",
    opener: null,
    children: Object.freeze(["orbis", "tempus", "fridgis", "electrum"]),
  }),
  orbis: Object.freeze({
    id: "orbis",
    kind: "wake_branch",
    opener: SPELL_WINDOW_OPENERS.VOICE_WAKE,
    children: Object.freeze(["domus"]),
  }),
  tempus: Object.freeze({
    id: "tempus",
    kind: "school",
    opener: SPELL_WINDOW_OPENERS.FLAT_SPIN_AXIS,
    children: Object.freeze(["rota", "sanctum", "vectus"]),
  }),
  fridgis: Object.freeze({
    id: "fridgis",
    kind: "school",
    opener: SPELL_WINDOW_OPENERS.FLAT_SPIN_AXIS,
    children: Object.freeze(["rota", "sanctum", "vectus"]),
  }),
  electrum: Object.freeze({
    id: "electrum",
    kind: "school",
    opener: SPELL_WINDOW_OPENERS.FLAT_SPIN_AXIS,
    children: Object.freeze(["rota", "sanctum", "vectus"]),
  }),
  domus: Object.freeze({
    id: "domus",
    kind: "spell",
    opener: null,
    children: Object.freeze([]),
  }),
  sanctum: Object.freeze({
    id: "sanctum",
    kind: "class",
    opener: null,
    runtimeClassKey: "sanctum",
    children: Object.freeze([]),
  }),
  rota: Object.freeze({
    id: "rota",
    kind: "class",
    opener: null,
    runtimeClassKey: "rota",
    children: Object.freeze([]),
  }),
  vectus: Object.freeze({
    id: "vectus",
    kind: "class",
    opener: null,
    runtimeClassKey: "vectus",
    children: Object.freeze([]),
  }),
});

function normToken(token) {
  return String(token || "").trim().toLowerCase();
}

export function getSpellTreeNode(nodeId) {
  const k = normToken(nodeId);
  return k ? (SPELL_DECISION_TREE[k] || null) : null;
}

export function getSpellTreeChildren(nodeId) {
  const node = getSpellTreeNode(nodeId);
  return node && Array.isArray(node.children) ? node.children.slice() : [];
}

export function isVoiceWakeOnlyBranch(nodeId) {
  const node = getSpellTreeNode(nodeId);
  return !!(node && node.opener === SPELL_WINDOW_OPENERS.VOICE_WAKE);
}

export function isFlatSpinSchoolBranch(nodeId) {
  const node = getSpellTreeNode(nodeId);
  return !!(node && node.kind === "school" && node.opener === SPELL_WINDOW_OPENERS.FLAT_SPIN_AXIS);
}

export function normalizeSpellClassTokenForRuntime(classToken) {
  const token = normToken(classToken);
  return token ? (SPELL_TREE_CLASS_RUNTIME_KEY_BY_TOKEN[token] || token) : "";
}

export function getSchoolBranchClassTokens(schoolToken) {
  const node = getSpellTreeNode(schoolToken);
  if (!node || node.kind !== "school") return [];
  return node.children.filter((child) => {
    const childNode = getSpellTreeNode(child);
    return !!childNode && childNode.kind === "class";
  });
}
