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

function rgbTuple(rgb) {
  return `${clampByte(rgb.r)}, ${clampByte(rgb.g)}, ${clampByte(rgb.b)}`;
}

function setVar(root, name, value) {
  if (!root) return;
  root.style.setProperty(name, String(value));
}

function resolveUiTheme(theme) {
  const ui = (theme && theme.ui && typeof theme.ui === "object") ? theme.ui : {};
  const styleProfile = (ui.styleProfile && typeof ui.styleProfile === "object") ? ui.styleProfile : {};
  const accentRgb = (ui.accentRgb && typeof ui.accentRgb === "object")
    ? ui.accentRgb
    : { r: 230, g: 230, b: 230 };
  const backgroundRgb = (ui.backgroundRgb && typeof ui.backgroundRgb === "object")
    ? ui.backgroundRgb
    : { r: 5, g: 5, b: 6 };
  const panelRgb = (ui.panelRgb && typeof ui.panelRgb === "object")
    ? ui.panelRgb
    : backgroundRgb;
  const panelBorderAlpha = clamp01(
    Number.isFinite(Number(ui.panelBorderAlpha))
      ? Number(ui.panelBorderAlpha)
      : 0.18
  );

  return {
    accentRgb,
    backgroundRgb,
    panelRgb,
    panelBorderAlpha,
    textRgb: (styleProfile.textRgb && typeof styleProfile.textRgb === "object")
      ? styleProfile.textRgb
      : { r: 183, g: 183, b: 188 },
    textStrongRgb: (styleProfile.textStrongRgb && typeof styleProfile.textStrongRgb === "object")
      ? styleProfile.textStrongRgb
      : { r: 238, g: 238, b: 242 },
    textMutedRgb: (styleProfile.textMutedRgb && typeof styleProfile.textMutedRgb === "object")
      ? styleProfile.textMutedRgb
      : { r: 122, g: 122, b: 128 },
    frameRgb: (styleProfile.frameRgb && typeof styleProfile.frameRgb === "object")
      ? styleProfile.frameRgb
      : { r: 82, g: 82, b: 88 },
    frameStrongRgb: (styleProfile.frameStrongRgb && typeof styleProfile.frameStrongRgb === "object")
      ? styleProfile.frameStrongRgb
      : { r: 118, g: 118, b: 126 },
    surfaceRgb: (styleProfile.surfaceRgb && typeof styleProfile.surfaceRgb === "object")
      ? styleProfile.surfaceRgb
      : panelRgb,
    surfaceRaisedRgb: (styleProfile.surfaceRaisedRgb && typeof styleProfile.surfaceRaisedRgb === "object")
      ? styleProfile.surfaceRaisedRgb
      : panelRgb,
    emphasisRgb: (styleProfile.emphasisRgb && typeof styleProfile.emphasisRgb === "object")
      ? styleProfile.emphasisRgb
      : accentRgb,
  };
}

export function applyGameThemeCssVars(theme, { root = document.documentElement } = {}) {
  if (!root) return;

  const ui = resolveUiTheme(theme);

  setVar(root, "--accent-rgb", rgbTuple(ui.accentRgb));
  setVar(root, "--text-rgb", rgbTuple(ui.textRgb));
  setVar(root, "--text-strong-rgb", rgbTuple(ui.textStrongRgb));
  setVar(root, "--text-muted-rgb", rgbTuple(ui.textMutedRgb));
  setVar(root, "--frame-rgb", rgbTuple(ui.frameRgb));
  setVar(root, "--frame-strong-rgb", rgbTuple(ui.frameStrongRgb));
  setVar(root, "--surface-rgb", rgbTuple(ui.surfaceRgb));
  setVar(root, "--surface-raised-rgb", rgbTuple(ui.surfaceRaisedRgb));
  setVar(root, "--emphasis-rgb", rgbTuple(ui.emphasisRgb));
  setVar(root, "--g", rgbText(ui.textRgb));
  setVar(root, "--green", rgbText(ui.textRgb));
  setVar(root, "--g2", `rgba(${rgbTuple(ui.textStrongRgb)}, 0.60)`);
  setVar(root, "--g3", `rgba(${rgbTuple(ui.frameRgb)}, 0.20)`);
  setVar(root, "--border", `rgba(${rgbTuple(ui.frameRgb)}, ${ui.panelBorderAlpha})`);
  setVar(root, "--text", rgbText(ui.textRgb));
  setVar(root, "--text-strong", rgbText(ui.textStrongRgb));
  setVar(root, "--text-muted", rgbText(ui.textMutedRgb));
  setVar(root, "--frame", rgbText(ui.frameRgb));
  setVar(root, "--frame-strong", rgbText(ui.frameStrongRgb));
  setVar(root, "--surface", rgbText(ui.surfaceRgb));
  setVar(root, "--surface-raised", rgbText(ui.surfaceRaisedRgb));
  setVar(root, "--emphasis", rgbText(ui.emphasisRgb));
  setVar(root, "--bg", rgbText(ui.backgroundRgb));
  setVar(root, "--bg-rgb", rgbTuple(ui.backgroundRgb));
  setVar(root, "--panel", rgbText(ui.panelRgb));
  setVar(root, "--panel-rgb", rgbTuple(ui.panelRgb));
}
