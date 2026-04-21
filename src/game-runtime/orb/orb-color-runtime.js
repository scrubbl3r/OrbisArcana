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
    currentStroke: { r: 1, g: 1, b: 1 },
    targetStroke: { r: 1, g: 1, b: 1 },
    currentFill: { r: 1, g: 1, b: 1 },
    targetFill: { r: 1, g: 1, b: 1 },
    currentAlpha: 0.20,
    targetAlpha: 0.20,
    explicitActive: false,
    explicitStroke: null,
    explicitFill: null,
    explicitAlpha: 0.20,
    spinActive: false,
    spinStroke: null,
    spinFill: null,
    spinAlpha: 0.20,
    initialized: false,
    lastStrokeCss: "",
    lastFillCss: "",
  };

  function resolveBaseState() {
    const next = (typeof getBaseVisualState === "function" ? getBaseVisualState() : null) || {};
    const strokeDefault01 = next.strokeDefault01 || { r: 1, g: 1, b: 1 };
    const fillDefaultRgb = next.fillDefaultRgb || { r: 255, g: 255, b: 255 };
    const fillAlpha = clamp01(next.fillAlpha);
    return {
      strokeDefault01: {
        r: clamp01(strokeDefault01.r),
        g: clamp01(strokeDefault01.g),
        b: clamp01(strokeDefault01.b),
      },
      fillDefault01: {
        r: clamp01((Number(fillDefaultRgb.r) || 0) / 255),
        g: clamp01((Number(fillDefaultRgb.g) || 0) / 255),
        b: clamp01((Number(fillDefaultRgb.b) || 0) / 255),
      },
      fillAlpha,
    };
  }

  function applyToCss(strokeColor, fillColor, alpha) {
    if (!root) return;
    const strokeR = Math.round(clamp01(strokeColor.r) * 255);
    const strokeG = Math.round(clamp01(strokeColor.g) * 255);
    const strokeB = Math.round(clamp01(strokeColor.b) * 255);
    const fillR = Math.round(clamp01(fillColor.r) * 255);
    const fillG = Math.round(clamp01(fillColor.g) * 255);
    const fillB = Math.round(clamp01(fillColor.b) * 255);
    const nextStrokeCss = `rgb(${strokeR},${strokeG},${strokeB})`;
    const nextFillCss = `rgba(${fillR},${fillG},${fillB},${clamp01(alpha).toFixed(2)})`;
    if (nextStrokeCss !== state.lastStrokeCss) {
      state.lastStrokeCss = nextStrokeCss;
      root.style.setProperty("--orb-stroke-color", nextStrokeCss);
    }
    if (nextFillCss !== state.lastFillCss) {
      state.lastFillCss = nextFillCss;
      root.style.setProperty("--orb-fill", nextFillCss);
    }
  }

  function syncToBase({ immediate = false } = {}) {
    const base = resolveBaseState();
    state.targetStroke = { ...base.strokeDefault01 };
    state.targetFill = { ...base.fillDefault01 };
    state.targetAlpha = base.fillAlpha;
    if (immediate || !state.initialized) {
      state.currentStroke = { ...base.strokeDefault01 };
      state.currentFill = { ...base.fillDefault01 };
      state.currentAlpha = base.fillAlpha;
      state.initialized = true;
      applyToCss(state.currentStroke, state.currentFill, state.currentAlpha);
    }
  }

  function applyResolvedTarget(strokeColor, fillColor, alpha) {
    state.targetStroke = {
      r: clamp01(strokeColor.r),
      g: clamp01(strokeColor.g),
      b: clamp01(strokeColor.b),
    };
    state.targetFill = {
      r: clamp01(fillColor.r),
      g: clamp01(fillColor.g),
      b: clamp01(fillColor.b),
    };
    state.targetAlpha = clamp01(alpha);
    if (!state.initialized) {
      state.currentStroke = { ...state.targetStroke };
      state.currentFill = { ...state.targetFill };
      state.currentAlpha = state.targetAlpha;
      state.initialized = true;
      applyToCss(state.currentStroke, state.currentFill, state.currentAlpha);
    }
  }

  function resolveLayerTarget() {
    if (state.explicitActive && state.explicitStroke && state.explicitFill) {
      return {
        stroke: state.explicitStroke,
        fill: state.explicitFill,
        alpha: state.explicitAlpha,
      };
    }
    if (state.spinActive && state.spinStroke && state.spinFill) {
      return {
        stroke: state.spinStroke,
        fill: state.spinFill,
        alpha: state.spinAlpha,
      };
    }
    const base = resolveBaseState();
    return {
      stroke: base.strokeDefault01,
      fill: base.fillDefault01,
      alpha: base.fillAlpha,
    };
  }

  function syncTargetToActiveLayer() {
    const target = resolveLayerTarget();
    applyResolvedTarget(target.stroke, target.fill, target.alpha);
  }

  function setExplicitTarget(color, alpha) {
    const nextColor = {
      r: clamp01(color.r),
      g: clamp01(color.g),
      b: clamp01(color.b),
    };
    state.explicitActive = true;
    state.explicitStroke = { ...nextColor };
    state.explicitFill = { ...nextColor };
    state.explicitAlpha = clamp01(alpha);
    syncTargetToActiveLayer();
  }

  function applyColorize(payload = {}) {
    const r = toChannel01(payload.r, state.targetStroke.r);
    const g = toChannel01(payload.g, state.targetStroke.g);
    const b = toChannel01(payload.b, state.targetStroke.b);
    const alpha = toChannel01(payload.alpha, state.targetAlpha);
    setExplicitTarget({ r, g, b }, alpha);
  }

  function clearColorize() {
    state.explicitActive = false;
    state.explicitStroke = null;
    state.explicitFill = null;
    syncTargetToActiveLayer();
  }

  function applySpinColor(payload = {}) {
    const r = toChannel01(payload.r, state.targetStroke.r);
    const g = toChannel01(payload.g, state.targetStroke.g);
    const b = toChannel01(payload.b, state.targetStroke.b);
    const base = resolveBaseState();
    const alpha = payload.alpha != null
      ? toChannel01(payload.alpha, base.fillAlpha)
      : base.fillAlpha;
    state.spinActive = true;
    state.spinStroke = { r, g, b };
    state.spinFill = { r, g, b };
    state.spinAlpha = alpha;
    syncTargetToActiveLayer();
  }

  function clearSpinColor() {
    state.spinActive = false;
    state.spinStroke = null;
    state.spinFill = null;
    syncTargetToActiveLayer();
  }

  function reset(immediate = false) {
    state.explicitActive = false;
    state.explicitStroke = null;
    state.explicitFill = null;
    state.spinActive = false;
    state.spinStroke = null;
    state.spinFill = null;
    syncToBase({ immediate: !!immediate });
  }

  function update(dt) {
    const a = 1 - Math.exp(-7 * clamp(dt, 0, 0.05));
    state.currentStroke.r += (state.targetStroke.r - state.currentStroke.r) * a;
    state.currentStroke.g += (state.targetStroke.g - state.currentStroke.g) * a;
    state.currentStroke.b += (state.targetStroke.b - state.currentStroke.b) * a;
    state.currentFill.r += (state.targetFill.r - state.currentFill.r) * a;
    state.currentFill.g += (state.targetFill.g - state.currentFill.g) * a;
    state.currentFill.b += (state.targetFill.b - state.currentFill.b) * a;
    state.currentAlpha += (state.targetAlpha - state.currentAlpha) * a;
    applyToCss(state.currentStroke, state.currentFill, state.currentAlpha);
  }

  function getCurrentState() {
    return {
      currentStroke: { ...state.currentStroke },
      targetStroke: { ...state.targetStroke },
      currentFill: { ...state.currentFill },
      targetFill: { ...state.targetFill },
      currentAlpha: state.currentAlpha,
      targetAlpha: state.targetAlpha,
      initialized: state.initialized,
    };
  }

  return {
    applyColorize,
    clearColorize,
    applySpinColor,
    clearSpinColor,
    reset,
    update,
    getCurrentState,
  };
}
