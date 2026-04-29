import { ORB_GLOBE_VISUAL_DEFAULTS } from "./orb-globe-base-state.js?v=20260425d";
import { WORLD_GLOBE_3D_VISUAL_DEFAULTS } from "../world/world-globe-3d-default.js?v=20260429a";

export const ORB_GLOBE_3D_VISUAL_DEFAULTS = Object.freeze({
  orbitDistanceRatio: ORB_GLOBE_VISUAL_DEFAULTS.orbitDistanceRatio,
  orbitDistanceMinPx: ORB_GLOBE_VISUAL_DEFAULTS.orbitDistanceMinPx,
  orbitSpeedMin: ORB_GLOBE_VISUAL_DEFAULTS.orbitSpeedMin,
  orbitSpeedMax: ORB_GLOBE_VISUAL_DEFAULTS.orbitSpeedMax,
  orbitDriftMin: ORB_GLOBE_VISUAL_DEFAULTS.orbitDriftMin,
  orbitDriftMax: ORB_GLOBE_VISUAL_DEFAULTS.orbitDriftMax,
  innerSpeedMinPxPerSec: ORB_GLOBE_VISUAL_DEFAULTS.innerSpeedMinPxPerSec,
  innerSpeedMaxPxPerSec: ORB_GLOBE_VISUAL_DEFAULTS.innerSpeedMaxPxPerSec,
  innerDriftMin: ORB_GLOBE_VISUAL_DEFAULTS.innerDriftMin,
  innerDriftMax: ORB_GLOBE_VISUAL_DEFAULTS.innerDriftMax,
  innerPaddingRatio: ORB_GLOBE_VISUAL_DEFAULTS.innerPaddingRatio,
  loadedDiameterRatio: WORLD_GLOBE_3D_VISUAL_DEFAULTS.collected.diameterRatio,
  consumedDiameterRatio: WORLD_GLOBE_3D_VISUAL_DEFAULTS.consumed.diameterRatio,
  material: WORLD_GLOBE_3D_VISUAL_DEFAULTS.material,
});
