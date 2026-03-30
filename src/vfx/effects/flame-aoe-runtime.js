/**
 * @typedef {Object} FlameAoeRuntimeConfig
 * @property {number} diameter
 * @property {number} durationMs
 * @property {{r:number,g:number,b:number,a:number}} [stroke]
 * @property {{r:number,g:number,b:number,a:number}} [fill]
 */

/**
 * @typedef {Object} CreateFlameAoeRuntimeOptions
 * @property {HTMLElement} layerEl
 * @property {() => FlameAoeRuntimeConfig} getConfig
 * @property {(n:number, min:number, max:number) => number} [clamp]
 * @property {(n:number, min?:number, max?:number) => number} [evenPx]
 * @property {boolean} [showCore]
 */

/**
 * Flame AOE SVG runtime.
 *
 * @param {CreateFlameAoeRuntimeOptions} options
 */
export function createFlameAoeRuntime({
  layerEl,
  getConfig,
  clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0)),
  evenPx = (n, min = 2, max = 4096) => {
    let x = Math.round(Number(n) || 0);
    x = Math.max(min, Math.min(max, x));
    if (x % 2 === 1) x += 1;
    return x;
  },
  showCore = false,
} = {}) {
  let flameRAF = 0;
  let flameSvg = null;
  let flameCore = null;
  const flameTendrils = [];

  function clampByte(v) {
    const n = Math.round(Number(v) || 0);
    return Math.max(0, Math.min(255, n));
  }

  function clamp01(v) {
    const n = Number(v);
    return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
  }

  function rgbaText(c, fallback = { r: 255, g: 96, b: 24, a: 1 }) {
    const src = c && typeof c === "object" ? c : fallback;
    return `rgba(${clampByte(src.r)}, ${clampByte(src.g)}, ${clampByte(src.b)}, ${clamp01(src.a)})`;
  }

  function polarPoint(cx, cy, angle, r) {
    return { x: cx + (Math.cos(angle) * r), y: cy + (Math.sin(angle) * r) };
  }

  function toWorld(base, fwd, nrm, along, lateral) {
    return {
      x: base.x + (fwd.x * along) + (nrm.x * lateral),
      y: base.y + (fwd.y * along) + (nrm.y * lateral),
    };
  }

  function smoothQuadPath(points) {
    if (!points || points.length < 2) return "";
    let d = `M ${points[0].x.toFixed(4)} ${points[0].y.toFixed(4)}`;
    for (let i = 1; i < points.length - 1; i++) {
      const p = points[i];
      const n = points[i + 1];
      const mx = (p.x + n.x) * 0.5;
      const my = (p.y + n.y) * 0.5;
      d += ` Q ${p.x.toFixed(4)} ${p.y.toFixed(4)} ${mx.toFixed(4)} ${my.toFixed(4)}`;
    }
    const last = points[points.length - 1];
    d += ` T ${last.x.toFixed(4)} ${last.y.toFixed(4)}`;
    return d;
  }

  function clear() {
    if (flameRAF) cancelAnimationFrame(flameRAF);
    flameRAF = 0;
    flameTendrils.length = 0;
    flameCore = null;
    if (flameSvg && flameSvg.parentNode) flameSvg.parentNode.removeChild(flameSvg);
    flameSvg = null;
  }

  function build(cfg) {
    const pad = 180;
    const size = evenPx(cfg.diameter + pad, 2, 4096);
    const cx = size * 0.5;
    const cy = size * 0.5;
    const radius = cfg.diameter * 0.5;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "flameSvg");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    svg.setAttribute("shape-rendering", "geometricPrecision");
    svg.__cx = cx;
    svg.__cy = cy;
    svg.__r = radius;

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("fill", "rgba(255, 96, 24, 0.30)");
    group.setAttribute("stroke", rgbaText(cfg.stroke));
    group.setAttribute("stroke-width", "2");
    group.setAttribute("stroke-linecap", "round");
    group.setAttribute("stroke-linejoin", "round");

    const core = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    core.setAttribute("cx", String(cx));
    core.setAttribute("cy", String(cy));
    core.setAttribute("r", String(radius.toFixed(2)));
    core.setAttribute("fill", rgbaText(cfg.fill, { r: 255, g: 96, b: 24, a: 0.20 }));
    core.setAttribute("stroke", rgbaText(cfg.stroke));
    core.setAttribute("stroke-width", "6");
    core.setAttribute("opacity", "1");

    const tendrilCount = 28;
    for (let i = 0; i < tendrilCount; i++) {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const step = (Math.PI * 2) / tendrilCount;
      const ang = step * i;
      const baseLen = radius * 0.20;
      const baseAmp = radius * 0.11;
      const baseWidth = radius * 0.23;
      const lenScale = (i % 2 === 0) ? 2.25 : 1.0;
      const lateralFlip = (i % 2 === 0) ? 1 : -1;
      p.setAttribute("opacity", "0.95");
      group.appendChild(p);
      flameTendrils.push({
        path: p,
        ang,
        baseLen,
        baseAmp,
        baseWidth,
        lenScale,
        lateralFlip,
      });
    }

    if (showCore) svg.appendChild(core);
    svg.appendChild(group);
    flameSvg = svg;
    flameCore = core;
  }

  function play() {
    if (!layerEl || typeof getConfig !== "function") return;
    clear();

    const raw = getConfig() || {};
    const cfg = {
      diameter: evenPx(clamp(raw.diameter, 120, 900), 2, 2000),
      durationMs: Math.max(200, Number(raw.durationMs) || 10000),
      stroke: raw.stroke,
      fill: raw.fill,
    };

    build(cfg);
    layerEl.appendChild(flameSvg);

    const start = performance.now();
    const cx = flameSvg.__cx;
    const cy = flameSvg.__cy;
    const radius = flameSvg.__r;

    function renderFrame(elapsed) {
      const t01 = Math.max(0, Math.min(1, elapsed / cfg.durationMs));
      const life = 1 - t01;
      const innerR = radius + 2;

      if (showCore && flameCore) {
        const coreScale = 1 + (Math.sin(elapsed * 0.0032) * 0.008);
        flameCore.setAttribute("r", (radius * coreScale).toFixed(2));
        flameCore.setAttribute("opacity", (0.92 + (Math.sin(elapsed * 0.0045) * 0.08) * life).toFixed(3));
      }

      for (let i = 0; i < flameTendrils.length; i++) {
        const t = flameTendrils[i];
        const motionTime = elapsed * 6;
        const dirBase = t.ang;
        const len = Math.max(16, (t.baseLen * t.lenScale));
        const amp = Math.max(4, t.baseAmp);
        const widthBase = Math.max(10, t.baseWidth);
        const tipWidth = Math.max(0.8, widthBase * 0.05);
        const wigglePhase = motionTime * 0.0086;

        const baseCenter = polarPoint(cx, cy, dirBase, innerR);
        const fwd = { x: Math.cos(dirBase), y: Math.sin(dirBase) };
        const nrm = { x: -Math.sin(dirBase), y: Math.cos(dirBase) };

        const samples = 9;
        const left = [];
        const right = [];

        for (let s = 0; s < samples; s++) {
          const u = s / (samples - 1);
          const along = len * u;
          const envelope = Math.sin(Math.PI * u);
          const lateral = Math.sin((u * Math.PI * 2) + wigglePhase) * amp * envelope * t.lateralFlip;
          const taper = Math.pow(1 - u, 1.85);
          const bloat = Math.sin(Math.PI * u) * (1 - (u * 0.35));
          const width = tipWidth
            + ((widthBase - tipWidth) * taper)
            + (widthBase * 0.12 * bloat);
          const c = toWorld(baseCenter, fwd, nrm, along, lateral);
          left.push(toWorld(c, fwd, nrm, 0, width * 0.5));
          right.push(toWorld(c, fwd, nrm, 0, -width * 0.5));
        }

        const baseHalf = widthBase * 0.5;
        const aEdge = Math.min(0.55, Math.asin(Math.min(0.999, baseHalf / Math.max(1, innerR))));
        const leftBase = polarPoint(cx, cy, dirBase + aEdge, innerR);
        const rightBase = polarPoint(cx, cy, dirBase - aEdge, innerR);
        left[0] = leftBase;
        right[0] = rightBase;

        const leftD = smoothQuadPath(left);
        const rightBack = right.slice().reverse();
        const rightD = smoothQuadPath(rightBack).replace(/^M [^QTLCAZ]+/, "");
        const d = [
          leftD,
          rightD,
          `A ${innerR.toFixed(4)} ${innerR.toFixed(4)} 0 0 1 ${leftBase.x.toFixed(4)} ${leftBase.y.toFixed(4)}`,
          "Z",
        ].join(" ");

        t.path.setAttribute("d", d);
        t.path.setAttribute("opacity", (0.70 + (0.30 * life)).toFixed(3));
      }
    }

    function tick(now) {
      const elapsed = now - start;
      renderFrame(elapsed);
      if (elapsed >= cfg.durationMs) {
        clear();
        return;
      }
      flameRAF = requestAnimationFrame(tick);
    }

    flameRAF = requestAnimationFrame(tick);
  }

  return {
    play,
    clear,
    destroy: clear,
  };
}
