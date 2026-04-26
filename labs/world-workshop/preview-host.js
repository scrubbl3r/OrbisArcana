const PREVIEW_CLEANUP_KEY = Symbol.for("orbis.worldWorkshop.previewCleanup");

export function cleanupPreviewHost(root) {
  if (!root) return;
  const cleanup = root[PREVIEW_CLEANUP_KEY];
  if (typeof cleanup === "function") cleanup();
  root[PREVIEW_CLEANUP_KEY] = null;
}

export function clearPreviewHost(root) {
  if (!root) return;
  cleanupPreviewHost(root);
  root.innerHTML = "";
}

export function setPreviewHostCleanup(root, cleanup) {
  if (!root) return;
  root[PREVIEW_CLEANUP_KEY] = typeof cleanup === "function" ? cleanup : null;
}

