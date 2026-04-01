import { applyGameThemeCssVars } from "../theme/apply-game-theme-css-vars.js";

export function applyDevConsoleThemeCssVars(theme, { root = document.documentElement } = {}) {
  applyGameThemeCssVars(theme, { root });
}
