import { renderAuthoredThreeStageSurface } from "../authored-three-stage-surface.js?v=20260521204501s";
import { createGameStageRuntimeAdapter } from "./game-stage-runtime-adapter.js?v=20260517a";

export function renderGameStage(root, {
  level = null,
  externalCameraAuthority = false,
  perfTrace = null,
} = {}) {
  return renderAuthoredThreeStageSurface(root, {
    level,
    externalCameraAuthority,
    perfTrace,
    surface: {
      kind: "game-stage",
      title: "Game Stage",
      overlayId: "gameStageWorldOverlay",
      stageStateDatasetKey: "gameStageState",
      previewZoomFallback: 0.25,
    },
    createAdapter: createGameStageRuntimeAdapter,
  });
}
