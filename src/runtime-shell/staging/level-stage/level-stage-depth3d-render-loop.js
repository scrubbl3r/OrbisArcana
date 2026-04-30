import { normalizeDepthRenderFrame } from "../../../game-runtime/level/depth-stage-frame.js?v=20260430a";

export function createLevelStageDepth3dRenderLoop({
  isDisposed = () => false,
  hasActiveAnimation = () => false,
  tickAnimation = () => {},
  renderNow = () => {},
} = {}) {
  let lastFrame = null;
  let pendingRenderFrame = 0;
  let animationFrame = 0;

  function renderFrame(frame = {}) {
    if (isDisposed()) return;
    lastFrame = normalizeDepthRenderFrame(frame);
    if (pendingRenderFrame) return;
    if (typeof requestAnimationFrame !== "function") {
      renderNow(lastFrame);
      return;
    }
    pendingRenderFrame = requestAnimationFrame(() => {
      pendingRenderFrame = 0;
      if (isDisposed()) return;
      renderNow(lastFrame || {});
    });
  }

  function scheduleAnimation() {
    if (isDisposed() || animationFrame || typeof requestAnimationFrame !== "function") return;
    const tick = (nowMs) => {
      animationFrame = 0;
      if (isDisposed() || !hasActiveAnimation()) return;
      tickAnimation(nowMs);
      renderFrame(lastFrame || {});
      animationFrame = requestAnimationFrame(tick);
    };
    animationFrame = requestAnimationFrame(tick);
  }

  function dispose() {
    if (animationFrame && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(animationFrame);
    }
    if (pendingRenderFrame && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(pendingRenderFrame);
    }
    animationFrame = 0;
    pendingRenderFrame = 0;
  }

  return Object.freeze({
    renderFrame,
    scheduleAnimation,
    getLastFrame: () => lastFrame,
    dispose,
  });
}
