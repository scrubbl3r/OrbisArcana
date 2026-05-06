import { disposeThreeObject } from "../game-runtime/rendering/three/three-object-utils.js";
import {
  createBubbleShield3dSimplexShell,
  normalizeBubbleShield3dSimplexConfig,
} from "./bubble-shield-3d-simplex-shell.js?v=20260506b";
import { BUBBLE_SHIELD_3D_PRESET_DEFAULT } from "../vfx/presets/bubble-shield-3d-default.js?v=20260506b";

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : fallback;
  return Math.max(min, Math.min(max, safe));
}

export function normalizeBubbleShield3dRuntimeConfig(raw = {}) {
  const source = raw && typeof raw === "object" ? raw : {};
  const fallback = BUBBLE_SHIELD_3D_PRESET_DEFAULT;
  const fallbackStart = fallback.startDiameterRatio ?? fallback.diameterRatio;
  const startDiameterRatio = clampNumber(
    source.startDiameterRatio ?? source.diameterRatio ?? source.shieldDiameterRatio,
    0.1,
    8,
    fallbackStart,
  );
  return Object.freeze({
    durationMs: Math.round(clampNumber(source.durationMs ?? source.shieldMs, 80, 120000, fallback.durationMs)),
    diameterRatio: startDiameterRatio,
    startDiameterRatio,
    endDiameterRatio: clampNumber(source.endDiameterRatio, 0.1, 8, fallback.endDiameterRatio ?? startDiameterRatio),
    transitionMs: Math.round(clampNumber(source.transitionMs, 0, 3000, fallback.transitionMs ?? 420)),
    overshoot: clampNumber(source.overshoot ?? source.bounceAmount, 0, 1.5, fallback.overshoot ?? fallback.bounceAmount ?? 0.12),
    jiggleFrequency: clampNumber(source.jiggleFrequency, 0, 48, fallback.jiggleFrequency ?? 18),
    jiggleDecay: clampNumber(source.jiggleDecay, 0, 24, fallback.jiggleDecay ?? 7),
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
  traceMark = null,
} = {}) {
  let raf = 0;
  let timer = 0;
  let shield = null;
  let activeConfig = normalizeBubbleShield3dRuntimeConfig();
  let startedAtMs = 0;

  function requestFrame() {
    if (typeof onNeedsFrame === "function") onNeedsFrame();
  }

  function markTrace(name, value = {}) {
    if (typeof traceMark === "function") traceMark(name, value && typeof value === "object" ? value : {});
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

  function jelloEase(progress, overshoot, frequency, decay) {
    const t = clampNumber(progress, 0, 1, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    const settle = t <= 0 ? 0 : Math.sin(t * Math.max(0, frequency)) * Math.exp(-t * Math.max(0, decay));
    return eased + (settle * clampNumber(overshoot, 0, 1.5, 0.12));
  }

  function setShieldDiameter(elapsedMs) {
    if (!shield) return;
    const start = Math.max(0.1, activeConfig.startDiameterRatio);
    const end = Math.max(0.1, activeConfig.endDiameterRatio);
    const duration = Math.max(0, activeConfig.transitionMs);
    const progress = duration <= 0 ? 1 : elapsedMs / duration;
    const eased = jelloEase(progress, activeConfig.overshoot, activeConfig.jiggleFrequency, activeConfig.jiggleDecay);
    const current = start + ((end - start) * eased);
    shield.scale.setScalar(current / end);
  }

  function clear() {
    if (shield || raf || timer) {
      markTrace("bubbleShield3d.clear", {
        hadShield: !!shield,
        hadRaf: !!raf,
        hadTimer: !!timer,
      });
    }
    if (raf) cancelAnimationFrame(raf);
    if (timer) clearTimeout(timer);
    raf = 0;
    timer = 0;
    removeShield();
    requestFrame();
  }

  function tick(nowMs = now()) {
    if (!shield) {
      markTrace("bubbleShield3d.tick.missing_shield");
      raf = 0;
      return;
    }
    const elapsed = Math.max(0, Number(nowMs) - startedAtMs);
    const pulsePhase = ((elapsed % Math.max(1, activeConfig.pulseMs)) / Math.max(1, activeConfig.pulseMs)) * Math.PI * 2;
    const pulse01 = 0.5 - (Math.cos(pulsePhase) * 0.5);
    const pulseAlpha = activeConfig.pulseMin + ((Math.min(activeConfig.pulseMax, activeConfig.alpha) - activeConfig.pulseMin) * pulse01);
    setShieldTime(elapsed / 1000);
    setShieldDiameter(elapsed);
    setShieldAlpha(pulseAlpha);
    requestFrame();
    raf = requestAnimationFrame(tick);
  }

  function activate(payload = {}) {
    clear();
    markTrace("bubbleShield3d.activate.start", {
      durationMs: Number(payload && payload.durationMs) || 0,
      startDiameterRatio: Number(payload && payload.startDiameterRatio) || Number(payload && payload.diameterRatio) || 0,
      endDiameterRatio: Number(payload && payload.endDiameterRatio) || 0,
    });
    const baseConfig = typeof getConfig === "function" ? (getConfig() || {}) : {};
    activeConfig = normalizeBubbleShield3dRuntimeConfig({
      ...baseConfig,
      ...(payload && typeof payload === "object" ? payload : {}),
    });
    const orbModel = typeof getOrbModel === "function" ? getOrbModel() : null;
    if (!orbModel) {
      markTrace("bubbleShield3d.activate.skipped", { reason: "orb_model_missing" });
      return { handled: false, skipped: "orb_model_missing" };
    }
    const bo = Math.max(1, Number(typeof getBo === "function" ? getBo() : getBo) || 72);
    startedAtMs = Number(now()) || performance.now();
    markTrace("bubbleShield3d.activate.config", {
      bo,
      durationMs: activeConfig.durationMs,
      startDiameterRatio: activeConfig.startDiameterRatio,
      endDiameterRatio: activeConfig.endDiameterRatio,
      alpha: activeConfig.alpha,
      pulseMs: activeConfig.pulseMs,
      simplexScale: activeConfig.simplexScale,
      simplexDensityTop: activeConfig.simplexDensityTop,
    });
    shield = createBubbleShield3dSimplexShell({
      bo,
      config: {
        ...activeConfig,
        diameterRatio: activeConfig.endDiameterRatio,
      },
    });
    orbModel.add(shield);
    setShieldDiameter(0);
    setShieldAlpha(activeConfig.alpha);
    timer = setTimeout(clear, activeConfig.durationMs);
    raf = requestAnimationFrame(tick);
    requestFrame();
    markTrace("bubbleShield3d.activate.attached", {
      shieldName: String(shield && shield.name || ""),
      parentName: String(shield && shield.parent && shield.parent.name || ""),
      childCount: Number(orbModel && orbModel.children && orbModel.children.length) || 0,
      visible: !!(shield && shield.visible),
      renderOrder: Number(shield && shield.renderOrder) || 0,
    });
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
