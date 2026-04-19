const PANE_DEFINITIONS = Object.freeze({
  vfx: Object.freeze({
    id: "vfx",
    label: "VFX",
    order: 10,
  }),
  behavior: Object.freeze({
    id: "behavior",
    label: "Behavior",
    order: 20,
  }),
  sfx: Object.freeze({
    id: "sfx",
    label: "SFX",
    order: 30,
  }),
});

export const LAB_STUDIO_PANES = PANE_DEFINITIONS;

export const LAB_STUDIO_PANE_ORDER = Object.freeze(
  Object.values(PANE_DEFINITIONS)
    .slice()
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .map((entry) => entry.id)
);

export function getLabStudioPaneDefinition(paneId) {
  const key = String(paneId || "").trim().toLowerCase();
  return PANE_DEFINITIONS[key] || null;
}

export function getLabStudioPaneLabel(paneId) {
  return (getLabStudioPaneDefinition(paneId) || {}).label || String(paneId || "");
}

export function listLabStudioSurfacePanes(surface) {
  const paneIds = Array.isArray(surface && surface.panes) ? surface.panes : ["vfx"];
  const ordered = paneIds
    .map((paneId) => String(paneId || "").trim().toLowerCase())
    .filter(Boolean)
    .filter((paneId, index, list) => list.indexOf(paneId) === index)
    .sort((a, b) => LAB_STUDIO_PANE_ORDER.indexOf(a) - LAB_STUDIO_PANE_ORDER.indexOf(b));
  return ordered.length ? ordered : ["vfx"];
}

export function surfaceSupportsLabStudioPane(surface, paneId) {
  const key = String(paneId || "").trim().toLowerCase();
  return listLabStudioSurfacePanes(surface).includes(key);
}
