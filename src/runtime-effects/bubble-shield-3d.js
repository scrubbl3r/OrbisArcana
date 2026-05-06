import { disposeThreeObject } from "../game-runtime/rendering/three/three-object-utils.js";
import {
  createBubbleShield3dSimplexShell,
  normalizeBubbleShield3dSimplexConfig,
} from "./bubble-shield-3d-simplex-shell.js";
import { BUBBLE_SHIELD_3D_PRESET_DEFAULT } from "../vfx/presets/bubble-shield-3d-default.js";

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : fallback;
  return Math.max(min, Math.min(max, safe));
}

export function normalizeBubbleShield3dRuntimeConfig(raw = {}) {
  const source = raw && typeof raw === "object" ? raw : {};
  const fallback = BUBBLE_SHIELD_3D_PRESET_DEFAULT;
  return Object.freeze({
    durationMs: Math.round(clampNumber(source.durationMs ?? source.shieldMs, 80, 120000, fallback.durationMs)),
    diameterRatio: clampNumber(source.diameterRatio ?? source.shieldDiameterRatio, 0.1, 8, fallback.diameterRatio),
    alpha: clampNumber(source.alpha ?? source.shieldAlpha, 0, 1, fallback.alpha),
    pulseMs: Math.round(clampNumber(source.pulseMs, 20, 700, fallback.pulseMs)),
    pulseMin: clampNumber(source.pulseMin, 0, 1, fallback.pulseMin),
    pulseMax: clampNumber(source.pulseMax, 0, 1, fallback.pulseMax),
    ...normalizeBubbleShield3dSimplexConfig(source, fallback),
    maxHits: 3,
  });
}

export function createBubbleShield3dRuntime({
  getOrbModel = () => null,
  getBo = () => 72,
  getConfig = () => BUBBLE_SHIELD_3D_PRESET_DEFAULT,
  now = () => performance.now(),
  onNeedsFrame = () => {},
} = {}) {
  let raf = 0;
  let timer = 0;
  let shield = null;
  let activeConfig = normalizeBubbleShield3dRuntimeConfig();
  let startedAtMs = 0;

  function requestFrame() {
    if (typeof onNeedsFrame === "function") onNeedsFrame();
  }

  function removeShield() {
    if (shield && shield.parent) shield.parent.remove(shield);
    if (shield) disposeThreeObject(shield);
    shield = null;
  }

  function setShieldAlpha(alpha) {
    if (!shield) return;
    const value = clampNumber(alpha, 0, 1, 1);
    shield.visible = value > 0.001;
    const uniforms = shield.material && shield.material.uniforms;
    if (uniforms && uniforms.uAlpha) uniforms.uAlpha.value = value;
  }

  function setShieldTime(timeSec) {
    if (!shield) return;
    const uniforms = shield.material && shield.material.uniforms;
    if (uniforms && uniforms.uTime) uniforms.uTime.value = timeSec;
  }

  function clear() {
    if (raf) cancelAnimationFrame(raf);
    if (timer) clearTimeout(timer);
    raf = 0;
    timer = 0;
    removeShield();
    requestFrame();
  }

  function tick(nowMs = now()) {
    if (!shield) {
      raf = 0;
      return;
    }
    const elapsed = Math.max(0, Number(nowMs) - startedAtMs);
    const pulsePhase = ((elapsed % Math.max(1, activeConfig.pulseMs)) / Math.max(1, activeConfig.pulseMs)) * Math.PI * 2;
    const pulse01 = 0.5 - (Math.cos(pulsePhase) * 0.5);
    const pulseAlpha = activeConfig.pulseMin + ((Math.min(activeConfig.pulseMax, activeConfig.alpha) - activeConfig.pulseMin) * pulse01);
    setShieldTime(elapsed / 1000);
    setShieldAlpha(pulseAlpha);
    requestFrame();
    raf = requestAnimationFrame(tick);
  }

  function activate(payload = {}) {
    clear();
    const baseConfig = typeof getConfig === "function" ? (getConfig() || {}) : {};
    activeConfig = normalizeBubbleShield3dRuntimeConfig({
      ...baseConfig,
      ...(payload && typeof payload === "object" ? payload : {}),
    });
    const orbModel = typeof getOrbModel === "function" ? getOrbModel() : null;
    if (!orbModel) return { handled: false, skipped: "orb_model_missing" };
    const bo = Math.max(1, Number(typeof getBo === "function" ? getBo() : getBo) || 72);
    startedAtMs = Number(now()) || performance.now();
    shield = createBubbleShield3dSimplexShell({ bo, config: activeConfig });
    orbModel.add(shield);
    setShieldAlpha(activeConfig.alpha);
    timer = setTimeout(clear, activeConfig.durationMs);
    raf = requestAnimationFrame(tick);
    requestFrame();
    return { handled: true };
  }

  return Object.freeze({
    activate,
    clear,
    off: clear,
    destroy: clear,
    isActive() {
      return !!shield || !!raf || !!timer;
    },
  });
}
