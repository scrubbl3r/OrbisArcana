/**
 * @typedef {Object} ShockwaveRuntimeConfig
 * @property {number} startR
 * @property {number} endR
 * @property {number} rings
 * @property {number} spawnMs
 * @property {number} decayMs
 * @property {number} stroke
 */

/**
 * @typedef {Object} CreateShockwaveRuntimeOptions
 * @property {HTMLElement} layerEl DOM layer where the shockwave SVG is mounted.
 * @property {() => ShockwaveRuntimeConfig} getConfig Returns runtime config (already sourced from SSOT/defaults).
 * @property {(strokePx:number) => void} [setShockStrokeCssVar] Hook to update receiver CSS var for stroke width.
 * @property {(n:number, min:number, max:number) => number} [clamp]
 * @property {(n:number, min?:number, max?:number) => number} [normalizeStroke]
 */

/**
 * Shockwave VFX runtime (receiver/lab-agnostic implementation with injected DOM/config hooks).
 *
 * @param {CreateShockwaveRuntimeOptions} options
 */
export function createShockwaveRuntime({
  layerEl,
  getConfig,
  setShockStrokeCssVar,
  clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0)),
  normalizeStroke = (n, min = 2, max = 20) => {
    let x = Math.round(Number(n) || 0);
    x = Math.max(min, Math.min(max, x));
    if (x % 2 === 1) x += 1;
    return x;
  },
} = {}) {
  let shockRAF = 0;
  let shockSvg = null;
  let spawnAcc = 0;
  const activeRings = [];

  function buildShockSVG() {
    const maxR = 1000;
    const size = (maxR * 2) + 40;
    const cx = size * 0.5;
    const cy = size * 0.5;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "shockSvg");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    svg.setAttribute("shape-rendering", "geometricPrecision");
    svg.__cx = cx;
    svg.__cy = cy;
    return svg;
  }

  function makeRingCircle(svg) {
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", svg.__cx);
    c.setAttribute("cy", svg.__cy);
    c.setAttribute("r", "1");
    c.setAttribute("fill", "none");
    c.setAttribute("stroke", "var(--shock-color)");
    c.setAttribute("stroke-width", "var(--shock-stroke)");
    c.setAttribute("stroke-linecap", "round");
    c.setAttribute("opacity", "0");
    return c;
  }

  function clear() {
    if (shockRAF) cancelAnimationFrame(shockRAF);
    shockRAF = 0;
    spawnAcc = 0;
    activeRings.length = 0;

    if (shockSvg && shockSvg.parentNode) shockSvg.parentNode.removeChild(shockSvg);
    shockSvg = null;
  }

  function play() {
    if (!layerEl || typeof getConfig !== "function") return;

    const raw = getConfig() || {};
    const stroke = normalizeStroke(raw.stroke, 2, 20);
    if (typeof setShockStrokeCssVar === "function") setShockStrokeCssVar(stroke);

    const cfg = {
      startR: clamp(raw.startR, 1, 1000),
      endR: clamp(raw.endR, 1, 1000),
      rings: Math.round(clamp(raw.rings, 1, 6)),
      spawnMs: Math.round(clamp(raw.spawnMs, 1, 700)),
      decayMs: Math.round(clamp(raw.decayMs, 40, 2000)),
    };

    clear();
    shockSvg = buildShockSVG();
    layerEl.appendChild(shockSvg);

    let last = performance.now();
    let spawned = 0;

    function tick(now) {
      const dt = Math.max(0, now - last);
      last = now;

      spawnAcc += dt;
      while (spawned < cfg.rings && spawnAcc >= cfg.spawnMs) {
        spawnAcc -= cfg.spawnMs;
        const circle = makeRingCircle(shockSvg);
        shockSvg.appendChild(circle);
        activeRings.push({ born: now, circle });
        spawned += 1;
      }

      for (let i = activeRings.length - 1; i >= 0; i--) {
        const r0 = activeRings[i];
        const age = now - r0.born;
        const t01 = Math.max(0, Math.min(1, age / cfg.decayMs));
        const r = cfg.startR + (cfg.endR - cfg.startR) * t01;
        r0.circle.setAttribute("r", r.toFixed(2));
        const alpha = (t01 <= 0) ? 0 : (1 - t01);
        r0.circle.setAttribute("opacity", alpha.toFixed(3));
        if (t01 >= 1) {
          if (r0.circle.parentNode) r0.circle.parentNode.removeChild(r0.circle);
          activeRings.splice(i, 1);
        }
      }

      const allSpawned = (spawned >= cfg.rings);
      const noneAlive = (activeRings.length === 0);
      if (allSpawned && noneAlive) {
        clear();
        return;
      }

      shockRAF = requestAnimationFrame(tick);
    }

    shockRAF = requestAnimationFrame(tick);
  }

  function trigger() {
    play();
  }

  return {
    play,
    clear,
    trigger,
    destroy: clear,
  };
}

