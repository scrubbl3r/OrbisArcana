export function normalizeOrbSurfaceDisplacementConfig(config = {}) {
  const waveCount = Math.max(2, Math.round(Number(config.waveCount) || 10));
  const waveDepthBO = Math.max(0, Number(config.waveDepthBO) || 0);
  return Object.freeze({
    enabled: config.enabled !== false && waveDepthBO > 0,
    waveCount,
    waveDepthBO,
    oscillationSpeedHz: Math.max(0, Number(config.oscillationSpeedHz) || 0),
    latitudinalMix: Math.max(0, Math.min(1, Number(config.latitudinalMix) || 0)),
    latitudinalBands: Math.max(1, Math.round(Number(config.latitudinalBands) || 1)),
    phaseOffset: Number(config.phaseOffset) || 0,
    shrinkPct: Math.max(0, Math.min(0.4, Number(config.shrinkPct) || 0)),
  });
}

export function createOrbSurfaceDisplacementUniforms(config = {}, { bo = 72 } = {}) {
  const normalized = normalizeOrbSurfaceDisplacementConfig(config);
  const baseOrb = Number(bo) || 72;
  return Object.freeze({
    uDisplacementEnabled: { value: normalized.enabled ? 1 : 0 },
    uDisplacementDepth: { value: baseOrb * normalized.waveDepthBO },
    uDisplacementWaveCount: { value: normalized.waveCount },
    uDisplacementOscillationHz: { value: normalized.oscillationSpeedHz },
    uDisplacementLatitudinalMix: { value: normalized.latitudinalMix },
    uDisplacementLatitudinalBands: { value: normalized.latitudinalBands },
    uDisplacementPhaseOffset: { value: normalized.phaseOffset },
    uDisplacementShrink: { value: normalized.shrinkPct },
  });
}

export function createOrbSurfaceDisplacementVertexShaderChunk() {
  return `
    uniform float uDisplacementEnabled;
    uniform float uDisplacementDepth;
    uniform float uDisplacementWaveCount;
    uniform float uDisplacementOscillationHz;
    uniform float uDisplacementLatitudinalMix;
    uniform float uDisplacementLatitudinalBands;
    uniform float uDisplacementPhaseOffset;
    uniform float uDisplacementShrink;

    vec3 displaceOrbSurface(vec3 sourcePosition, vec3 sourceNormal, float timeSeconds) {
      vec3 n = normalize(sourceNormal);
      float longitude = atan(n.z, n.x);
      float latitude = asin(clamp(n.y, -1.0, 1.0));
      float oscillation = sin((timeSeconds * 6.28318530718 * uDisplacementOscillationHz) + uDisplacementPhaseOffset);
      float radialWave = sin(longitude * uDisplacementWaveCount);
      float latitudinalWave = cos(latitude * uDisplacementLatitudinalBands);
      float standingWave = mix(radialWave, radialWave * latitudinalWave, uDisplacementLatitudinalMix);
      float displacement = standingWave * uDisplacementDepth * oscillation * uDisplacementEnabled;
      float shrink = 1.0 - (uDisplacementShrink * abs(oscillation) * uDisplacementEnabled);
      return (sourcePosition * shrink) + (n * displacement);
    }
  `;
}
