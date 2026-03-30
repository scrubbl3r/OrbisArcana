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

  if (theme.orb) {
    if (Number.isFinite(Number(theme.orb.diameterPx))) setVar(root, "--orb-d", `${Math.round(Number(theme.orb.diameterPx))}px`);
    if (Number.isFinite(Number(theme.orb.strokeWidthPx))) setVar(root, "--orb-stroke", `${Math.round(Number(theme.orb.strokeWidthPx))}px`);
    if (theme.orb.strokeDefaultRgb) setVar(root, "--orb-stroke-color", rgbText(theme.orb.strokeDefaultRgb));
    if (theme.orb.strokeDefaultRgb) {
      const s = theme.orb.strokeDefaultRgb;
      const a = clamp01(theme.orb.fillAlpha);
      setVar(root, "--orb-fill", `rgba(${clampByte(s.r)},${clampByte(s.g)},${clampByte(s.b)},${a.toFixed(2)})`);
    }
  }

  if (theme.shield) {
    const c = theme.shield.colorRgb || { r: 120, g: 210, b: 255 };
    setVar(root, "--shield-r", clampByte(c.r));
    setVar(root, "--shield-g", clampByte(c.g));
    setVar(root, "--shield-b", clampByte(c.b));
    if (Number.isFinite(Number(theme.shield.alpha))) setVar(root, "--shield-alpha", clamp01(theme.shield.alpha).toFixed(2));
    if (Number.isFinite(Number(theme.shield.diameterPx))) setVar(root, "--shield-d", `${Math.round(Number(theme.shield.diameterPx))}px`);
    if (Number.isFinite(Number(theme.shield.strokeWidthPx))) setVar(root, "--shield-stroke", `${Math.round(Number(theme.shield.strokeWidthPx))}px`);
    if (Number.isFinite(Number(theme.shield.pulseMs))) setVar(root, "--shield-pulse-ms", `${Math.round(Number(theme.shield.pulseMs))}ms`);
    if (Number.isFinite(Number(theme.shield.pulseMin))) setVar(root, "--shield-pulse-min", clamp01(theme.shield.pulseMin).toFixed(2));
    if (Number.isFinite(Number(theme.shield.pulseMax))) setVar(root, "--shield-pulse-max", clamp01(theme.shield.pulseMax).toFixed(2));
  }

  if (theme.shockwave) {
    if (theme.shockwave.color) setVar(root, "--shock-color", rgbaText(theme.shockwave.color));
    if (Number.isFinite(Number(theme.shockwave.strokeWidthPx))) setVar(root, "--shock-stroke", `${Math.round(Number(theme.shockwave.strokeWidthPx))}px`);
  }

}
