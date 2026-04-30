import { normalizeDepthRenderFrame } from "../../../game-runtime/level/depth-stage-frame.js?v=20260430a";

export function createLevelStageDepth3dRenderLoop({
  isDisposed = () => false,
  hasActiveAnimation = () => false,
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
      renderNow(lastFrame, performance.now());
      return;
    }
    pendingRenderFrame = requestAnimationFrame((nowMs) => {
      pendingRenderFrame = 0;
      if (isDisposed()) return;
      renderNow(lastFrame || {}, nowMs);
    });
  }

  function scheduleAnimation() {
    if (isDisposed() || animationFrame || typeof requestAnimationFrame !== "function") return;
    const tick = (nowMs) => {
      animationFrame = 0;
      if (isDisposed() || !hasActiveAnimation()) return;
      if (pendingRenderFrame && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(pendingRenderFrame);
        pendingRenderFrame = 0;
      }
      renderNow(lastFrame || {}, nowMs);
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
