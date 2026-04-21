export function closeDevStagingTopmostPanel(refs) {
  if (!refs) return false;
  if (refs.devPanelManager && typeof refs.devPanelManager.closeTopmostPanel === "function") {
    if (refs.devPanelManager.closeTopmostPanel()) return true;
  }
  return false;
}

export function createDevStagingPanelElementsFromView(view = null) {
  if (view && view.refs) return view.refs;
  return (view && typeof view === "object") ? view : {};
}
