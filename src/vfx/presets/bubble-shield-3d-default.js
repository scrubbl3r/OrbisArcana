import { BUBBLE_SHIELD_PRESET_DEFAULT } from "./bubble-shield-default.js";
import { ORB_LIFECYCLE_3D_DEFAULTS } from "../../game-runtime/orb/orb-lifecycle-3d-default.js";

export const BUBBLE_SHIELD_3D_PRESET_DEFAULT = Object.freeze({
  ...BUBBLE_SHIELD_PRESET_DEFAULT,
  maxCracks: ORB_LIFECYCLE_3D_DEFAULTS.maxCracks,
  crackColor: ORB_LIFECYCLE_3D_DEFAULTS.crackColor,
  crackAlpha: ORB_LIFECYCLE_3D_DEFAULTS.crackAlpha,
  crackWidthPx: ORB_LIFECYCLE_3D_DEFAULTS.crackWidthPx,
  crackLiftBO: ORB_LIFECYCLE_3D_DEFAULTS.crackLiftBO,
  criticalGlow: ORB_LIFECYCLE_3D_DEFAULTS.criticalGlow,
  energyColor: ORB_LIFECYCLE_3D_DEFAULTS.energyColor,
  mutationSpeed: ORB_LIFECYCLE_3D_DEFAULTS.mutationSpeed,
  mutationAmount: ORB_LIFECYCLE_3D_DEFAULTS.mutationAmount,
  diffuseWash: ORB_LIFECYCLE_3D_DEFAULTS.diffuseWash,
  edgeBrightness: ORB_LIFECYCLE_3D_DEFAULTS.edgeBrightness,
  cellDarkness: ORB_LIFECYCLE_3D_DEFAULTS.cellDarkness,
  cellSharpness: ORB_LIFECYCLE_3D_DEFAULTS.cellSharpness,
  detailEmergence: ORB_LIFECYCLE_3D_DEFAULTS.detailEmergence,
});
