import { disposeThreeObject } from "../game-runtime/rendering/three/three-object-utils.js";
import {
  createOrbLifecycle3dCracks,
  updateOrbLifecycle3dCracks,
} from "../game-runtime/orb/orb-lifecycle-3d-vfx-runtime.js";
import { BUBBLE_SHIELD_3D_PRESET_DEFAULT } from "../vfx/presets/bubble-shield-3d-default.js";

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : fallback;
  return Math.max(min, Math.min(max, safe));
}

function clampInt(value, min, max, fallback) {
  return Math.round(clampNumber(value, min, max, fallback));
}

function rgbToHex(color = {}, fallback = 0x78d2ff) {
  const fallbackColor = Number.isFinite(Number(fallback)) ? Number(fallback) >>> 0 : 0x78d2ff;
  const r = clampInt(color.r, 0, 255, (fallbackColor >> 16) & 255);
  const g = clampInt(color.g, 0, 255, (fallbackColor >> 8) & 255);
  const b = clampInt(color.b, 0, 255, fallbackColor & 255);
  return (r << 16) + (g << 8) + b;
}

function hexColor(value, fallback) {
  const n = Number(value);
  if (Number.isFinite(n)) return Math.max(0, Math.min(0xffffff, Math.round(n))) >>> 0;
  return Number(fallback) >>> 0;
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
    maxHits: 3,
    maxCracks: clampInt(source.maxCracks, 3, 96, fallback.maxCracks),
    crackColor: source.crackColor != null
      ? hexColor(source.crackColor, fallback.crackColor)
      : rgbToHex(source.colorRgb, fallback.crackColor),
    crackAlpha: clampNumber(source.crackAlpha, 0, 1, fallback.crackAlpha),
    crackWidthPx: clampNumber(source.crackWidthPx, 0.25, 12, fallback.crackWidthPx),
    crackLiftBO: clampNumber(source.crackLiftBO, 0, 0.2, fallback.crackLiftBO),
    criticalGlow: clampNumber(source.criticalGlow, 0, 4, fallback.criticalGlow),
    energyColor: hexColor(source.energyColor, fallback.energyColor),
    mutationSpeed: clampNumber(source.mutationSpeed, 0, 2, fallback.mutationSpeed),
    mutationAmount: clampNumber(source.mutationAmount, 0, 1.5, fallback.mutationAmount),
    diffuseWash: clampNumber(source.diffuseWash, 0, 2, fallback.diffuseWash),
    edgeBrightness: clampNumber(source.edgeBrightness, 0, 3, fallback.edgeBrightness),
    cellDarkness: clampNumber(source.cellDarkness, 0, 2, fallback.cellDarkness),
    cellSharpness: clampNumber(source.cellSharpness, 0, 3, fallback.cellSharpness),
    detailEmergence: clampNumber(source.detailEmergence, 0, 1, fallback.detailEmergence),
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
    shield.traverse((child) => {
      const uniforms = child && child.material && child.material.uniforms;
      if (uniforms && uniforms.uAlpha) {
        uniforms.uAlpha.value = activeConfig.crackAlpha * value;
      }
    });
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
    setShieldAlpha(pulseAlpha);
    updateOrbLifecycle3dCracks(shield, nowMs);
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
    shield = createOrbLifecycle3dCracks({
      bo: bo * activeConfig.diameterRatio,
      hitsTaken: activeConfig.maxHits,
      maxHits: activeConfig.maxHits,
      seed: Math.round(startedAtMs),
      config: activeConfig,
    });
    shield.name = "bubble_shield3d:voronoi_shell";
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
      return !!shield || !!raf;
    },
  });
}
