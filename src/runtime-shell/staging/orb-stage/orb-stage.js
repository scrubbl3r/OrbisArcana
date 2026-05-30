import { getLevelById } from "../../../content/levels/registry.js";
import { renderAuthoredThreeStageSurface } from "../authored-three-stage-surface.js?v=20260530112909s";
import { createOrbStageRuntimeAdapter } from "./orb-stage-runtime-adapter.js?v=20260522-active-aoe-c";

const DEFAULT_LEVEL = getLevelById("orb-hangar");

export function renderOrbStage(root, {
  level = DEFAULT_LEVEL,
  externalCameraAuthority = false,
  perfTrace = null,
} = {}) {
  return renderAuthoredThreeStageSurface(root, {
    level,
    fallbackLevel: DEFAULT_LEVEL,
    externalCameraAuthority,
    perfTrace,
    surface: {
      kind: "orb-stage",
      title: "Orb Stage",
      overlayId: "orbStageWorldOverlay",
      stageStateDatasetKey: "orbStageState",
      previewZoomFallback: 0.25,
      panelHeightCssVar: "--orb-stage-panel-height",
    },
    createAdapter: createOrbStageRuntimeAdapter,
  });
}

if (globalThis.document) {
  const root = document.getElementById("orbStageRoot");
  if (root) renderOrbStage(root, { level: DEFAULT_LEVEL });
}
