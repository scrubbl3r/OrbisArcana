const BG0 = { r: 0, g: 0, b: 0 };
const BG1 = { r: 255, g: 42, b: 0 };

export const TRANSMITTER_VERSION_TEXT = "vtag:shield-debug";

export function createTransmitterUiBoot({
  rootDocument = document,
  versionTag = true,
  versionText = TRANSMITTER_VERSION_TEXT,
} = {}) {
  async function applyTheme() {
    try {
      const [
        { GAME_THEME_DEFAULT },
        { applyGameThemeCssVars },
      ] = await Promise.all([
        import("../../content/theme/game-theme-default.js"),
        import("../../ui/theme/apply-game-theme-css-vars.js"),
      ]);
      if (typeof applyGameThemeCssVars === "function") {
        applyGameThemeCssVars(GAME_THEME_DEFAULT, { root: rootDocument.documentElement });
      }
    } catch (err) {
      console.warn("Mobile theme bootstrap failed:", err);
    }
  }

  function setBgFromEnergy(e01) {
    const t = Math.max(0, Math.min(1, Number(e01) || 0));
    const r = Math.round(BG0.r + (BG1.r - BG0.r) * t);
    const g = Math.round(BG0.g + (BG1.g - BG0.g) * t);
    const b = Math.round(BG0.b + (BG1.b - BG0.b) * t);
    rootDocument.body.style.backgroundColor = `rgb(${r},${g},${b})`;
  }

  function attachVersionTag() {
    if (!versionTag) return;
    const tag = rootDocument.createElement("div");
    tag.textContent = versionText;
    tag.style.position = "fixed";
    tag.style.left = "50%";
    tag.style.bottom = "8px";
    tag.style.transform = "translateX(-50%)";
    tag.style.fontSize = "11px";
    tag.style.opacity = "0.65";
    tag.style.letterSpacing = "0.04em";
    tag.style.pointerEvents = "none";
    tag.style.color = "rgba(var(--accent-rgb), 0.9)";
    rootDocument.body.appendChild(tag);
  }

  return {
    versionText,
    applyTheme,
    attachVersionTag,
    setBgFromEnergy,
  };
}
