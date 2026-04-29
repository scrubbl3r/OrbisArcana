import { ORB_NOD_3D_PRESET_DEFAULT } from "../../vfx/presets/orb-nod3d-default.js";

function clampNumber(value, min, max, fallback = 0) {
  const n = Number(value);
  const resolved = Number.isFinite(n) ? n : fallback;
  return Math.max(min, Math.min(max, resolved));
}

export function normalizeOrbNod3dConfig(raw = {}) {
  const source = raw && typeof raw === "object" ? raw : Object.create(null);
  return Object.freeze({
    shrinkPct: clampNumber(source.orbNod3dShrinkPct, 0, 40, ORB_NOD_3D_PRESET_DEFAULT.orbNod3dShrinkPct) / 100,
    durationMs: Math.round(clampNumber(source.orbNod3dDurationMs, 80, 3000, ORB_NOD_3D_PRESET_DEFAULT.orbNod3dDurationMs)),
    fillAlpha: clampNumber(source.orbNod3dFillAlpha, 0, 1, ORB_NOD_3D_PRESET_DEFAULT.orbNod3dFillAlpha),
    waveCount: Math.round(clampNumber(source.orbNod3dWaveCount, 1, 32, ORB_NOD_3D_PRESET_DEFAULT.orbNod3dWaveCount)),
    latitudinalBands: Math.round(clampNumber(source.orbNod3dLatitudinalBands, 1, 32, ORB_NOD_3D_PRESET_DEFAULT.orbNod3dLatitudinalBands)),
    waveDepthBO: clampNumber(source.orbNod3dWaveDepthBO, 0, 0.2, ORB_NOD_3D_PRESET_DEFAULT.orbNod3dWaveDepthBO),
    oscillationSpeedHz: clampNumber(source.orbNod3dOscillationSpeedHz, 0.1, 40, ORB_NOD_3D_PRESET_DEFAULT.orbNod3dOscillationSpeedHz),
    oscillationCount: Math.round(clampNumber(source.orbNod3dOscillationCount, 0, 12, ORB_NOD_3D_PRESET_DEFAULT.orbNod3dOscillationCount)),
    equatorFalloff: clampNumber(source.orbNod3dEquatorFalloff, 0, 8, ORB_NOD_3D_PRESET_DEFAULT.orbNod3dEquatorFalloff),
    rippleSoftness: clampNumber(source.orbNod3dRippleSoftness, 0, 1, ORB_NOD_3D_PRESET_DEFAULT.orbNod3dRippleSoftness),
  });
}

export function createOrbNod3dSurfaceDisplacementConfig(raw = {}, { enabled = true } = {}) {
  const cfg = normalizeOrbNod3dConfig(raw);
  return Object.freeze({
    enabled: !!enabled,
    waveCount: cfg.waveCount,
    waveDepthBO: cfg.waveDepthBO,
    oscillationSpeedHz: cfg.oscillationSpeedHz,
    equatorFalloff: cfg.equatorFalloff,
    equatorAmplitude: 1,
    poleAmplitude: 1,
    rippleSoftness: cfg.rippleSoftness,
    latitudinalMix: 1,
    latitudinalBands: cfg.latitudinalBands,
    cellMix: 0,
    axisMix: 0,
    phaseOffset: 0,
    shrinkPct: cfg.shrinkPct,
  });
}

function setUniform(uniforms = {}, key, value) {
  if (!uniforms || !uniforms[key]) return;
  uniforms[key].value = value;
}

function applyIdleUniforms(material = null) {
  const uniforms = material && material.uniforms ? material.uniforms : null;
  if (!uniforms) return false;
  setUniform(uniforms, "uDisplacementEnabled", 0);
  setUniform(uniforms, "uDisplacementDepth", 0);
  setUniform(uniforms, "uDisplacementShrink", 0);
  return true;
}

function applyStaticUniforms(material = null, cfg) {
  const uniforms = material && material.uniforms ? material.uniforms : null;
  if (!uniforms) return false;
  setUniform(uniforms, "uDisplacementWaveCount", cfg.waveCount);
  setUniform(uniforms, "uDisplacementOscillationHz", cfg.oscillationSpeedHz);
  setUniform(uniforms, "uDisplacementEquatorFalloff", cfg.equatorFalloff);
  setUniform(uniforms, "uDisplacementEquatorAmplitude", 1);
  setUniform(uniforms, "uDisplacementPoleAmplitude", 1);
  setUniform(uniforms, "uDisplacementRippleSoftness", cfg.rippleSoftness);
  setUniform(uniforms, "uDisplacementLatitudinalMix", 1);
  setUniform(uniforms, "uDisplacementLatitudinalBands", cfg.latitudinalBands);
  setUniform(uniforms, "uDisplacementCellMix", 0);
  setUniform(uniforms, "uDisplacementAxisMix", 0);
  setUniform(uniforms, "uDisplacementPhaseOffset", 0);
  return true;
}

export function createOrbNod3dRuntime({
  material = null,
  getMaterial = () => material,
  getBo = () => 72,
  getConfig = () => ORB_NOD_3D_PRESET_DEFAULT,
  now = () => performance.now(),
} = {}) {
  let active = null;
  let disposed = false;
  applyIdleUniforms(getMaterial());

  function reset() {
    active = null;
    applyIdleUniforms(getMaterial());
  }

  function update(timeSec = 0) {
    if (disposed) return false;
    const target = getMaterial();
    if (!target || !target.uniforms) return false;
    if (!active) {
      applyIdleUniforms(target);
      return false;
    }

    const elapsedMs = Math.max(0, (Number(timeSec) * 1000) - active.startMs);
    const progress = Math.max(0, Math.min(1, elapsedMs / Math.max(1, active.cfg.durationMs)));
    const envelope = Math.sin(progress * Math.PI);
    const oscillationLimit = active.cfg.oscillationSpeedHz > 0
      ? active.cfg.oscillationCount / active.cfg.oscillationSpeedHz
      : active.cfg.durationMs / 1000;
    const shaderTime = Math.min(elapsedMs / 1000, oscillationLimit);
    const bo = Math.max(1, Number(getBo()) || 72);

    setUniform(target.uniforms, "uTime", shaderTime);
    applyStaticUniforms(target, active.cfg);
    setUniform(target.uniforms, "uDisplacementEnabled", envelope > 0.0001 ? 1 : 0);
    setUniform(target.uniforms, "uDisplacementDepth", bo * active.cfg.waveDepthBO * envelope);
    setUniform(target.uniforms, "uDisplacementShrink", active.cfg.shrinkPct * envelope);

    if (progress >= 1) {
      reset();
      return false;
    }
    return true;
  }

  return Object.freeze({
    play(payload = {}) {
      if (disposed) return { handled: false, skipped: "disposed" };
      const target = getMaterial();
      if (!target || !target.uniforms || !target.uniforms.uDisplacementEnabled) {
        return { handled: false, skipped: "material_missing_displacement_uniforms" };
      }
      const payloadConfig = payload && typeof payload.config === "object" ? payload.config : null;
      const cfg = normalizeOrbNod3dConfig(payloadConfig || getConfig());
      active = {
        cfg,
        startMs: Math.max(0, Number(now()) || 0),
      };
      applyStaticUniforms(target, cfg);
      return { handled: true };
    },
    update,
    isActive() {
      return !!active && !disposed;
    },
    reset,
    dispose() {
      disposed = true;
      reset();
    },
  });
}
