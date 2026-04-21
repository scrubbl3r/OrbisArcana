export function renderLevelOverlayPlaceholder(root, { level = null } = {}) {
  if (!root) return null;
  const label = String(level && level.label || "Level Stage");
  root.innerHTML = `
    <section class="levelOverlayStage" aria-label="Level overlay placeholder stage">
      <div class="levelOverlayStageViewport">
        <div class="levelOverlayStageLabel">Level Stage</div>
        <div class="levelOverlayStageCenter">
          <div class="levelOverlayStageTitle">${label}</div>
          <div class="levelOverlayStageMeta">Placeholder surface for shell mode validation</div>
          <div class="levelOverlayStageHint">Cmd+Shift+D toggles Dev Stage</div>
        </div>
      </div>
    </section>
  `;
  return {
    root,
  };
}
