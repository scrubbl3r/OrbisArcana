export function normalizeOrbSurfaceDisplacementConfig(config = {}) {
  const waveCount = Math.max(2, Math.round(Number(config.waveCount) || 10));
  const waveDepthBO = Math.max(0, Number(config.waveDepthBO) || 0);
  const equatorFalloff = Number(config.equatorFalloff);
  const equatorAmplitude = Number(config.equatorAmplitude);
  const poleAmplitude = Number(config.poleAmplitude);
  return Object.freeze({
    enabled: config.enabled !== false && waveDepthBO > 0,
    waveCount,
    waveDepthBO,
    oscillationSpeedHz: Math.max(0, Number(config.oscillationSpeedHz) || 0),
    equatorFalloff: Math.max(0, Number.isFinite(equatorFalloff) ? equatorFalloff : 1.6),
    equatorAmplitude: Math.max(0, Number.isFinite(equatorAmplitude) ? equatorAmplitude : 1),
    poleAmplitude: Math.max(0, Number.isFinite(poleAmplitude) ? poleAmplitude : 1),
    rippleSoftness: Math.max(0, Math.min(1, Number(config.rippleSoftness) || 0)),
    latitudinalMix: Math.max(0, Math.min(1, Number(config.latitudinalMix) || 0)),
    latitudinalBands: Math.max(1, Math.round(Number(config.latitudinalBands) || 1)),
    cellMix: Math.max(0, Math.min(1, Number(config.cellMix) || 0)),
    axisMix: Math.max(0, Math.min(1, Number(config.axisMix) || 0)),
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
    uDisplacementEquatorFalloff: { value: normalized.equatorFalloff },
    uDisplacementEquatorAmplitude: { value: normalized.equatorAmplitude },
    uDisplacementPoleAmplitude: { value: normalized.poleAmplitude },
    uDisplacementRippleSoftness: { value: normalized.rippleSoftness },
    uDisplacementLatitudinalMix: { value: normalized.latitudinalMix },
    uDisplacementLatitudinalBands: { value: normalized.latitudinalBands },
    uDisplacementCellMix: { value: normalized.cellMix },
    uDisplacementAxisMix: { value: normalized.axisMix },
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
    uniform float uDisplacementEquatorFalloff;
    uniform float uDisplacementEquatorAmplitude;
    uniform float uDisplacementPoleAmplitude;
    uniform float uDisplacementRippleSoftness;
    uniform float uDisplacementLatitudinalMix;
    uniform float uDisplacementLatitudinalBands;
    uniform float uDisplacementCellMix;
    uniform float uDisplacementAxisMix;
    uniform float uDisplacementPhaseOffset;
    uniform float uDisplacementShrink;

    vec3 displaceOrbSurface(vec3 sourcePosition, vec3 sourceNormal, float timeSeconds) {
      vec3 n = normalize(sourceNormal);
      float travelClock = (timeSeconds * uDisplacementOscillationHz) + (uDisplacementPhaseOffset * 0.15915494309);
      float polarAngle = acos(clamp(n.y, -1.0, 1.0));
      float latitudeTravel = abs(polarAngle - 1.57079632679) / 1.57079632679;
      float equatorMask = pow(max(0.0, 1.0 - latitudeTravel), uDisplacementEquatorFalloff);
      float latitudeAmplitude = mix(uDisplacementEquatorAmplitude, uDisplacementPoleAmplitude, latitudeTravel);
      float ripple = sin(((latitudeTravel * uDisplacementWaveCount) - travelClock) * 6.28318530718);
      float softenedRipple = mix(ripple, sin(ripple * 1.57079632679), uDisplacementRippleSoftness);
      float travelingWave = softenedRipple * equatorMask * latitudeAmplitude;
      float displacement = travelingWave * uDisplacementDepth * uDisplacementEnabled;
      float shrink = 1.0 - (uDisplacementShrink * abs(sin(travelClock * 6.28318530718)) * uDisplacementEnabled);
      return (sourcePosition * shrink) + (n * displacement);
    }
  `;
}
