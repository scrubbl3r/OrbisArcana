function clampByte(v) {
  const n = Math.round(Number(v) || 0);
  return Math.max(0, Math.min(255, n));
}

function clamp01(v) {
  const n = Number(v);
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
}

function rgbText(rgb) {
  return `rgb(${clampByte(rgb.r)},${clampByte(rgb.g)},${clampByte(rgb.b)})`;
}

function rgbaText(c) {
  return `rgba(${clampByte(c.r)}, ${clampByte(c.g)}, ${clampByte(c.b)}, ${clamp01(c.a)})`;
}

function setVar(root, name, value) {
  if (!root) return;
  root.style.setProperty(name, String(value));
}

export function applyThemeCssVars(theme, { root = document.documentElement } = {}) {
  if (!theme || !root) return;

  if (theme.ui && theme.ui.accentRgb) {
    const a = theme.ui.accentRgb;
    setVar(root, "--g", rgbText(a));
    setVar(root, "--g2", `rgba(${clampByte(a.r)},${clampByte(a.g)},${clampByte(a.b)},.60)`);
    setVar(root, "--g3", `rgba(${clampByte(a.r)},${clampByte(a.g)},${clampByte(a.b)},.20)`);
  }
  if (theme.ui && Number.isFinite(Number(theme.ui.panelBorderAlpha))) {
    const a = clamp01(theme.ui.panelBorderAlpha);
    const c = theme.ui.accentRgb || { r: 50, g: 255, b: 117 };
    setVar(root, "--border", `rgba(${clampByte(c.r)},${clampByte(c.g)},${clampByte(c.b)},${a})`);
  }
  if (theme.ui && theme.ui.backgroundRgb) {
    setVar(root, "--bg", rgbText(theme.ui.backgroundRgb));
  }

  if (theme.shockwave) {
    if (theme.shockwave.color) setVar(root, "--shock-color", rgbaText(theme.shockwave.color));
    if (Number.isFinite(Number(theme.shockwave.strokeWidthPx))) setVar(root, "--shock-stroke", `${Math.round(Number(theme.shockwave.strokeWidthPx))}px`);
  }

}
