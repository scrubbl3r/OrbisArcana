export const AUTHORED_RENDER_ORDER_BASE = 100;
export const AUTHORED_RENDER_ORDER_LAYER_STEP = 10;
export const AUTHORED_RENDER_ORDER_ELEMENT_STEP = 0.1;

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function resolveAuthoredRenderOrder(source = {}, {
  fallback = 0,
  offset = 0,
} = {}) {
  const stackIndex = Number(source && source.sourceStackIndex);
  if (!Number.isFinite(stackIndex)) return clampNumber(fallback, 0) + clampNumber(offset, 0);
  const elementIndex = Math.max(0, Math.round(clampNumber(source && source.sourceElementIndex, 0)));
  return (
    AUTHORED_RENDER_ORDER_BASE
    + (stackIndex * AUTHORED_RENDER_ORDER_LAYER_STEP)
    + (elementIndex * AUTHORED_RENDER_ORDER_ELEMENT_STEP)
    + clampNumber(offset, 0)
  );
}

export function applyAuthoredRenderOrder(object = null, source = {}, options = {}) {
  if (!object || typeof object.traverse !== "function") return 0;
  const renderOrder = resolveAuthoredRenderOrder(source, options);
  object.renderOrder = renderOrder;
  object.traverse((node) => {
    if (node && node.isObject3D) node.renderOrder = renderOrder;
  });
  return renderOrder;
}
