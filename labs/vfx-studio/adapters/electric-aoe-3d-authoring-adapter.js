import { createFlameAoe3dAuthoringAdapter } from "./flame-aoe-3d-authoring-adapter.js?v=20260520aeo-diameter-a";
import { ELECTRIC_AOE_3D_PRESET_DEFAULT } from "../../../src/vfx/presets/electric-aoe-3d-default.js?v=20260521a";
import { ELECTRIC_AOE_BEHAVIOR_DEFAULT } from "../../../src/game-runtime/behaviors/electric-aoe-behavior-default.js?v=20260521a";

export function createElectricAoe3dAuthoringAdapter({
  electricAoe3dPresetDefault = ELECTRIC_AOE_3D_PRESET_DEFAULT,
  electricAoe3dBehaviorDefault = ELECTRIC_AOE_BEHAVIOR_DEFAULT,
} = {}) {
  const base = createFlameAoe3dAuthoringAdapter({
    flameAoe3dBehaviorDefault: electricAoe3dBehaviorDefault,
  });
  return Object.freeze({
    ...base,
    defaultSettings: () => ({
      ...electricAoe3dPresetDefault,
      ...electricAoe3dBehaviorDefault,
    }),
  });
}
