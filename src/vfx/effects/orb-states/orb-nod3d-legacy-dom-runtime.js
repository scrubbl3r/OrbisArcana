import { createOrbNodRuntime } from "./orb-nod-runtime.js";

function mapNod3dConfigToLegacyNodConfig(raw = {}, { getOrbDiameterPx = () => 72 } = {}) {
  const orbDiameterPx = Math.max(1, Number(getOrbDiameterPx()) || 72);
  return {
    orbTemplateShrinkPct: Number(raw.orbNod3dShrinkPct) || 2,
    orbTemplateDurationMs: Number(raw.orbNod3dDurationMs) || 520,
    orbTemplateFillAlpha: Number(raw.orbNod3dFillAlpha) || 0.07,
    orbTemplateWaveCount: Number(raw.orbNod3dWaveCount) || 4,
    orbTemplateWaveDepthPx: orbDiameterPx * (Number(raw.orbNod3dWaveDepthBO) || 0.024),
    orbTemplateOscillationSpeedHz: Number(raw.orbNod3dOscillationSpeedHz) || 4.8,
    orbTemplateOscillationCount: Number(raw.orbNod3dOscillationCount) || 2,
  };
}

export function createOrbNod3dLegacyDomRuntime({
  getConfig = () => ({}),
  getOrbDiameterPx = () => 72,
  ...runtimeOptions
} = {}) {
  return createOrbNodRuntime({
    ...runtimeOptions,
    getOrbDiameterPx,
    getConfig: () => mapNod3dConfigToLegacyNodConfig(
      typeof getConfig === "function" ? (getConfig() || {}) : {},
      { getOrbDiameterPx }
    ),
  });
}
