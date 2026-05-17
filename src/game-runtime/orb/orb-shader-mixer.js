import {
  buildOrbShaderBaseState,
  coerceOrbShaderLayerValues,
} from "./orb-shader-state.js";

export function createOrbShaderMixer({
  baseConfig = null,
  applyShaderState = () => {},
  onApplied = null,
  onNeedsFrame = () => {},
} = {}) {
  const layers = new Map();
  let baseState = buildOrbShaderBaseState(baseConfig);
  let lastResolvedState = baseState;

  function resolve() {
    const next = { ...baseState };
    layers.forEach((layer) => {
      if (!layer || !layer.values) return;
      Object.assign(next, coerceOrbShaderLayerValues(layer.values, next));
    });
    lastResolvedState = Object.freeze(next);
    return lastResolvedState;
  }

  function apply(source = "mixer") {
    const resolved = resolve();
    if (typeof applyShaderState === "function") applyShaderState(resolved);
    if (typeof onApplied === "function") onApplied(resolved, source);
    if (typeof onNeedsFrame === "function") onNeedsFrame();
    return resolved;
  }

  function setBaseConfig(config = null, { applyNow = true, source = "base" } = {}) {
    baseState = buildOrbShaderBaseState(config);
    return applyNow ? apply(source) : resolve();
  }

  function setLayer(id, layer = {}, { applyNow = true, source = id } = {}) {
    const key = String(id || "");
    if (!key) return lastResolvedState;
    const values = coerceOrbShaderLayerValues(layer && layer.values ? layer.values : layer, lastResolvedState || baseState);
    layers.set(key, Object.freeze({
      id: key,
      values,
      source: String(source || key),
    }));
    return applyNow ? apply(source || key) : resolve();
  }

  function clearLayer(id, { applyNow = true, source = id } = {}) {
    const key = String(id || "");
    if (!key || !layers.has(key)) return lastResolvedState;
    layers.delete(key);
    return applyNow ? apply(source || key) : resolve();
  }

  function reset({ applyNow = true, source = "reset" } = {}) {
    layers.clear();
    return applyNow ? apply(source) : resolve();
  }

  function getTrace() {
    return Object.freeze({
      baseState: { ...baseState },
      resolvedState: { ...lastResolvedState },
      layers: Array.from(layers.entries()).map(([id, layer]) => Object.freeze({
        id,
        source: layer.source,
        values: { ...layer.values },
      })),
    });
  }

  resolve();

  return Object.freeze({
    setBaseConfig,
    setLayer,
    clearLayer,
    reset,
    resolve,
    apply,
    getTrace,
  });
}

