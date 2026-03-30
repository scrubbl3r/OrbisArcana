function defaultClamp01(v) {
  const n = Number(v);
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
}

function defaultClamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, Number(v) || 0));
}

function toChannel01(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n > 1 ? n / 255 : n;
}

export function createOrbColorRuntime({
  root = globalThis.document && globalThis.document.documentElement,
  getBaseVisualState,
  clamp01 = defaultClamp01,
  clamp = defaultClamp,
} = {}) {
  const state = {
    current: { r: 1, g: 1, b: 1 },
    target: { r: 1, g: 1, b: 1 },
    currentAlpha: 0.20,
    targetAlpha: 0.20,
    initialized: false,
  };

  function resolveBaseState() {
    const next = (typeof getBaseVisualState === "function" ? getBaseVisualState() : null) || {};
    const strokeDefault01 = next.strokeDefault01 || { r: 1, g: 1, b: 1 };
    const fillAlpha = clamp01(next.fillAlpha);
    return {
      strokeDefault01: {
        r: clamp01(strokeDefault01.r),
        g: clamp01(strokeDefault01.g),
        b: clamp01(strokeDefault01.b),
      },
      fillAlpha,
    };
  }

  function applyToCss(color, alpha) {
    if (!root) return;
    const r = Math.round(clamp01(color.r) * 255);
    const g = Math.round(clamp01(color.g) * 255);
    const b = Math.round(clamp01(color.b) * 255);
    root.style.setProperty("--orb-stroke-color", `rgb(${r},${g},${b})`);
    root.style.setProperty("--orb-fill", `rgba(${r},${g},${b},${clamp01(alpha).toFixed(2)})`);
  }

  function syncToBase({ immediate = false } = {}) {
    const base = resolveBaseState();
    state.target = { ...base.strokeDefault01 };
    state.targetAlpha = base.fillAlpha;
    if (immediate || !state.initialized) {
      state.current = { ...base.strokeDefault01 };
      state.currentAlpha = base.fillAlpha;
      state.initialized = true;
      applyToCss(state.current, state.currentAlpha);
    }
  }

  function setTarget(color, alpha) {
    state.target = {
      r: clamp01(color.r),
      g: clamp01(color.g),
      b: clamp01(color.b),
    };
    state.targetAlpha = clamp01(alpha);
    if (!state.initialized) {
      state.current = { ...state.target };
      state.currentAlpha = state.targetAlpha;
      state.initialized = true;
      applyToCss(state.current, state.currentAlpha);
    }
  }

  function applyColorize(payload = {}) {
    const r = toChannel01(payload.r, state.target.r);
    const g = toChannel01(payload.g, state.target.g);
    const b = toChannel01(payload.b, state.target.b);
    const alpha = toChannel01(payload.alpha, state.targetAlpha);
    setTarget({ r, g, b }, alpha);
  }

  function clearColorize() {
    syncToBase({ immediate: false });
  }

  function reset(immediate = false) {
    syncToBase({ immediate: !!immediate });
  }

  function update(dt) {
    const a = 1 - Math.exp(-7 * clamp(dt, 0, 0.05));
    state.current.r += (state.target.r - state.current.r) * a;
    state.current.g += (state.target.g - state.current.g) * a;
    state.current.b += (state.target.b - state.current.b) * a;
    state.currentAlpha += (state.targetAlpha - state.currentAlpha) * a;
    applyToCss(state.current, state.currentAlpha);
  }

  function getCurrentState() {
    return {
      current: { ...state.current },
      target: { ...state.target },
      currentAlpha: state.currentAlpha,
      targetAlpha: state.targetAlpha,
      initialized: state.initialized,
    };
  }

  return {
    applyColorize,
    clearColorize,
    reset,
    update,
    getCurrentState,
  };
}
