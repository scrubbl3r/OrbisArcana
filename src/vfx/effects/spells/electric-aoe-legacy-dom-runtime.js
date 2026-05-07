/**
 * @typedef {Object} ElectricAoeRuntimeConfig
 * @property {number} startR
 * @property {number} endR
 * @property {number} durationMs
 * @property {number} nodeCount
 * @property {number} particleCount
 * @property {number} particleSpeed
 * @property {number} maxBoltJumpSq
 * @property {number} startJitterRatio
 */

/**
 * @typedef {Object} CreateLegacyDomElectricAoeRuntimeOptions
 * @property {HTMLElement} layerEl
 * @property {() => ElectricAoeRuntimeConfig} getConfig
 * @property {(n:number, min:number, max:number) => number} [clamp]
 * @property {(n:number, min?:number, max?:number) => number} [evenPx]
 * @property {(min:number, max:number) => number} [rand]
 */

/**
 * Legacy DOM electric AOE canvas runtime (ported from lab logic, receiver-independent via injected config/layer).
 *
 * @param {CreateLegacyDomElectricAoeRuntimeOptions} options
 */
export function createLegacyDomElectricAoeRuntime({
  layerEl,
  getConfig,
  clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0)),
  evenPx = (n, min = 2, max = 4096) => {
    let x = Math.round(Number(n) || 0);
    x = Math.max(min, Math.min(max, x));
    if (x % 2 === 1) x += 1;
    return x;
  },
  rand = (min, max) => min + (Math.random() * (max - min)),
} = {}) {
  let raf = 0;
  let canvas = null;
  let ctx = null;
  let particles = [];
  let nodes = [];
  let cfgState = null;
  let endAt = 0;

  function distSq(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return (dx * dx) + (dy * dy);
  }

  function clear() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    particles = [];
    nodes = [];
    cfgState = null;
    endAt = 0;
    ctx = null;
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    canvas = null;
  }

  function buildCanvas(cfg) {
    const size = evenPx((cfg.endR * 2) + 24, 2, 4096);
    const el = document.createElement("canvas");
    el.className = "electricCanvas";
    el.width = size;
    el.height = size;
    const c = el.getContext("2d");
    c.lineCap = "round";
    c.lineJoin = "round";

    canvas = el;
    ctx = c;
    cfgState = {
      size,
      cx: size * 0.5,
      cy: size * 0.5,
      startR: cfg.startR,
      endR: cfg.endR,
      durationMs: cfg.durationMs,
      maxBoltJumpSq: cfg.maxBoltJumpSq,
      particleCount: cfg.particleCount,
      nodeCount: cfg.nodeCount,
      particleSpeed: cfg.particleSpeed,
      startJitterRatio: cfg.startJitterRatio,
    };
  }

  function initParticles() {
    const cfg = cfgState;
    particles = [];
    for (let i = 0; i < cfg.particleCount; i++) {
      const a = rand(0, Math.PI * 2);
      const u = Math.random();
      const r = Math.sqrt((u * ((cfg.endR * cfg.endR) - (cfg.startR * cfg.startR))) + (cfg.startR * cfg.startR));
      const x = cfg.cx + (Math.cos(a) * r);
      const y = cfg.cy + (Math.sin(a) * r);
      const vA = rand(0, Math.PI * 2);
      particles.push({
        x, y,
        vx: Math.cos(vA) * cfg.particleSpeed,
        vy: Math.sin(vA) * cfg.particleSpeed,
      });
    }
  }

  function initNodes() {
    const cfg = cfgState;
    nodes = [];
    for (let i = 0; i < cfg.nodeCount; i++) {
      const angle = rand(0, Math.PI * 2);
      const startJitterPx = rand(-(cfg.startR * cfg.startJitterRatio), (cfg.startR * cfg.startJitterRatio));
      const emitR = clamp(cfg.startR + startJitterPx, 2, cfg.endR - 2);
      nodes.push({
        angle,
        spin: rand(-0.06, 0.06),
        startJitterPx,
        emitR,
        x: cfg.cx + (Math.cos(angle) * emitR),
        y: cfg.cy + (Math.sin(angle) * emitR),
      });
    }
  }

  function updateNodes() {
    const cfg = cfgState;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.emitR = clamp(cfg.startR + n.startJitterPx, 2, cfg.endR - 2);
      n.x = cfg.cx + (Math.cos(n.angle) * n.emitR);
      n.y = cfg.cy + (Math.sin(n.angle) * n.emitR);
      n.angle += n.spin;
      n.spin += rand(-0.004, 0.004);
      n.spin = clamp(n.spin, -0.1, 0.1);
    }
  }

  function updateParticles() {
    const cfg = cfgState;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      const dx = p.x - cfg.cx;
      const dy = p.y - cfg.cy;
      const d = Math.sqrt((dx * dx) + (dy * dy)) || 1;
      if (d > cfg.endR || d < cfg.startR) {
        p.vx *= -1;
        p.vy *= -1;
        const clampedR = clamp(d, cfg.startR + 0.5, cfg.endR - 0.5);
        p.x = cfg.cx + ((dx / d) * clampedR);
        p.y = cfg.cy + ((dy / d) * clampedR);
      }
    }
  }

  function drawBolt(node) {
    const cfg = cfgState;
    const c = ctx;
    let px = node.x;
    let py = node.y;
    let oldPx = px;
    let oldPy = py;
    let lastEdgeDist = node.emitR;

    for (let hops = 0; hops < 18; hops++) {
      let found = false;
      let lowestDistSq = Number.POSITIVE_INFINITY;
      let next = null;
      let nextEdgeDist = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const d2 = distSq(px, py, p.x, p.y);
        if (d2 >= lowestDistSq) continue;
        if (d2 > cfg.maxBoltJumpSq || d2 < 20) continue;

        const cdx = p.x - cfg.cx;
        const cdy = p.y - cfg.cy;
        const edgeDist = Math.sqrt((cdx * cdx) + (cdy * cdy));
        if (edgeDist <= lastEdgeDist) continue;
        if (edgeDist > cfg.endR) continue;

        lowestDistSq = d2;
        next = p;
        nextEdgeDist = edgeDist;
        found = true;
      }

      if (!found || !next) break;
      px = next.x;
      py = next.y;
      lastEdgeDist = nextEdgeDist;

      const xc = (oldPx + px) * 0.5;
      const yc = (oldPy + py) * 0.5;
      c.quadraticCurveTo(oldPx, oldPy, xc, yc);
      oldPx = px;
      oldPy = py;
    }
  }

  function drawFrame() {
    const cfg = cfgState;
    const c = ctx;
    c.clearRect(0, 0, cfg.size, cfg.size);

    const ring = c.createRadialGradient(cfg.cx, cfg.cy, cfg.startR, cfg.cx, cfg.cy, cfg.endR);
    ring.addColorStop(0, "rgba(255, 250, 180, 0.82)");
    ring.addColorStop(0.6, "rgba(255, 235, 95, 0.55)");
    ring.addColorStop(1, "rgba(255, 220, 64, 0.12)");
    c.strokeStyle = ring;
    c.lineWidth = 2;
    c.shadowColor = "rgba(255, 225, 90, 1)";
    c.shadowBlur = 30;

    c.beginPath();
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      c.moveTo(n.x, n.y);
      drawBolt(n);
    }
    c.stroke();
    c.closePath();
    c.shadowBlur = 0;
  }

  function tick(now) {
    updateNodes();
    updateParticles();
    drawFrame();
    if (now >= endAt) {
      clear();
      return;
    }
    raf = requestAnimationFrame(tick);
  }

  function play() {
    if (!layerEl || typeof getConfig !== "function") return;
    clear();

    const raw = getConfig() || {};
    const cfg = {
      startR: Math.round(clamp(raw.startR, 2, 500)),
      endR: Math.round(clamp(raw.endR, 8, 1000)),
      durationMs: Math.max(200, Number(raw.durationMs) || 10000),
      nodeCount: Math.max(1, Math.round(Number(raw.nodeCount) || 13)),
      particleCount: Math.max(50, Math.round(Number(raw.particleCount) || 340)),
      particleSpeed: Math.max(0.05, Number(raw.particleSpeed) || 0.62),
      maxBoltJumpSq: Math.max(100, Number(raw.maxBoltJumpSq) || 1200),
      startJitterRatio: clamp(Number(raw.startJitterRatio) || 0.30, 0, 1),
    };
    if (cfg.endR <= cfg.startR + 4) cfg.endR = cfg.startR + 4;

    buildCanvas(cfg);
    initParticles();
    initNodes();
    layerEl.appendChild(canvas);
    endAt = performance.now() + cfgState.durationMs;
    raf = requestAnimationFrame(tick);
  }

  return {
    play,
    clear,
    destroy: clear,
  };
}
