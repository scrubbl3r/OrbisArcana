import { ELECTRIC_AOE_3D_PRESET_DEFAULT } from "../vfx/presets/electric-aoe-3d-default.js?v=20260521a";
import {
  createFlameAoe3dRuntime,
  normalizeFlameAoe3dRuntimeConfig,
} from "./flame-aoe-3d.js?v=20260520235547";

export function normalizeElectricAoe3dRuntimeConfig(raw = {}) {
  return normalizeFlameAoe3dRuntimeConfig({
    ...ELECTRIC_AOE_3D_PRESET_DEFAULT,
    ...(raw && typeof raw === "object" ? raw : {}),
  });
}

export function createElectricAoe3dRuntime(options = {}) {
  return createFlameAoe3dRuntime({
    ...options,
    getConfig: typeof options.getConfig === "function"
      ? () => normalizeElectricAoe3dRuntimeConfig(options.getConfig())
      : () => normalizeElectricAoe3dRuntimeConfig(ELECTRIC_AOE_3D_PRESET_DEFAULT),
  });
}
