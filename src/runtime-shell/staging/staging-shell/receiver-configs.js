import { INPUT_GESTURE_CONFIG_DEFAULT } from "../../../content/input/gesture-config-default.js?v=20260517u";
import { INPUT_DYNAMICS_CONFIG_DEFAULT } from "../../../content/input/dynamics-config-default.js?v=20260511a";

function cloneJsonLike(value) {
  if (value == null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(cloneJsonLike);
  const out = {};
  for (const [key, next] of Object.entries(value)) out[key] = cloneJsonLike(next);
  return out;
}

export function createShellReceiverConfigs() {
  return {
    IMPACT_TH: 750,
    INPUT_GESTURE_CFG: cloneJsonLike(INPUT_GESTURE_CONFIG_DEFAULT),
    INPUT_DYNAMICS_CFG: cloneJsonLike(INPUT_DYNAMICS_CONFIG_DEFAULT),
  };
}
