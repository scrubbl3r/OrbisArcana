import { resolveElectricAoeGeometry } from "../../../../src/game-runtime/orb/orb-spell-geometry.js";

export function createElectricAoePreview({
  els,
  clamp,
  evenPx,
  setVar,
  electricPresetDefault,
}) {
  let electricRAF = 0;
  let electricCanvas = null;
  let electricCtx = null;
  let electricParticles = [];
  let electricNodes = [];
  let electricConfig = null;
  let electricLastNow = 0;
  let electricEndAt = 0;
  const ELECTRIC_START_JITTER_RATIO = Number(electricPresetDefault.startJitterRatio) || 0.30;

  function rand(min, max) {
    return min + (Math.random() * (max - min));
  }

  function electricDistSq(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return (dx * dx) + (dy * dy);
  }

  function getOrbDiameterPx() {
    const root = els && els.previewRoot;
    const cssDiameter = root
      ? Number(getComputedStyle(root).getPropertyValue("--orb-d").replace("px", ""))
      : 0;
    return Math.max(2, cssDiameter || 100);
  }

  function apply() {
    const durationMs = Math.round(clamp(els.electricMs && els.electricMs.value, 200, 60000));
    let authoredStartR = Math.round(clamp(els.electricStartR.value, 2, 500));
    let authoredEndR = Math.round(clamp(els.electricEndR.value, 8, 1000));
    if (authoredEndR <= authoredStartR + 4) authoredEndR = authoredStartR + 4;
    const resolved = resolveElectricAoeGeometry({
      startR: authoredStartR,
      endR: authoredEndR,
    }, {
      orbDiameterPx: getOrbDiameterPx(),
    });

    if (els.electricMs) els.electricMs.value = String(durationMs);
    els.electricStartR.value = String(authoredStartR);
    els.electricEndR.value = String(authoredEndR);
    els.vElectricStartR.textContent = String(authoredStartR);
    els.vElectricEndR.textContent = String(authoredEndR);

    setVar("--electric-d", `${(Number(resolved.endR) * 2).toFixed(2)}px`);
    return {
      startR: resolved.startR,
      endR: resolved.endR,
      durationMs,
    };
  }

  function clear() {
    if (electricRAF) cancelAnimationFrame(electricRAF);
    electricRAF = 0;
    electricParticles = [];
    electricNodes = [];
    electricConfig = null;
    electricLastNow = 0;
    electricEndAt = 0;
    electricCtx = null;

    if (electricCanvas && electricCanvas.parentNode) {
      electricCanvas.parentNode.removeChild(electricCanvas);
    }
    electricCanvas = null;
  }

  function buildCanvas(cfg) {
    const size = evenPx((cfg.endR * 2) + 24, 2, 4096);
    const canvas = document.createElement("canvas");
    canvas.className = "electricCanvas";
    canvas.width = size;
    canvas.height = size;
    canvas.style.position = "absolute";
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.transform = "translate(-50%,-50%)";
    canvas.style.pointerEvents = "none";

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    electricCanvas = canvas;
    electricCtx = ctx;
    electricConfig = {
      size,
      cx: size * 0.5,
      cy: size * 0.5,
      startR: cfg.startR,
      endR: cfg.endR,
      durationMs: Math.max(200, Number(cfg.durationMs) || Number(electricPresetDefault.durationMs) || 10000),
      maxBoltJumpSq: Math.max(
        100,
        Number(resolveElectricAoeGeometry({
          maxBoltJumpSq: electricPresetDefault.maxBoltJumpSq,
        }, {
          orbDiameterPx: getOrbDiameterPx(),
        }).maxBoltJumpSq) || 1200
      ),
      particleCount: Math.max(50, Math.round(Number(electricPresetDefault.particleCount) || 340)),
      nodeCount: Math.max(1, Math.round(Number(electricPresetDefault.nodeCount) || 13)),
      particleSpeed: Math.max(0.05, Number(electricPresetDefault.particleSpeed) || 0.62),
    };
  }

  function initParticles() {
    const cfg = electricConfig;
    electricParticles = [];

    for (let i = 0; i < cfg.particleCount; i += 1) {
      const a = rand(0, Math.PI * 2);
      const u = Math.random();
      const r = Math.sqrt((u * ((cfg.endR * cfg.endR) - (cfg.startR * cfg.startR))) + (cfg.startR * cfg.startR));
      const x = cfg.cx + (Math.cos(a) * r);
      const y = cfg.cy + (Math.sin(a) * r);
      const vA = rand(0, Math.PI * 2);

      electricParticles.push({
        x,
        y,
        vx: Math.cos(vA) * cfg.particleSpeed,
        vy: Math.sin(vA) * cfg.particleSpeed,
      });
    }
  }

  function initNodes() {
    const cfg = electricConfig;
    electricNodes = [];
    for (let i = 0; i < cfg.nodeCount; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const startJitterPx = rand(
        -(cfg.startR * ELECTRIC_START_JITTER_RATIO),
        cfg.startR * ELECTRIC_START_JITTER_RATIO,
      );
      const emitR = clamp(cfg.startR + startJitterPx, 2, cfg.endR - 2);
      electricNodes.push({
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
    const cfg = electricConfig;
    for (let i = 0; i < electricNodes.length; i += 1) {
      const n = electricNodes[i];
      n.emitR = clamp(cfg.startR + n.startJitterPx, 2, cfg.endR - 2);
      n.x = cfg.cx + (Math.cos(n.angle) * n.emitR);
      n.y = cfg.cy + (Math.sin(n.angle) * n.emitR);
      n.angle += n.spin;
      n.spin += rand(-0.004, 0.004);
      n.spin = clamp(n.spin, -0.1, 0.1);
    }
  }

  function updateParticles() {
    const cfg = electricConfig;
    for (let i = 0; i < electricParticles.length; i += 1) {
      const p = electricParticles[i];
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
    const cfg = electricConfig;
    const ctx = electricCtx;

    let px = node.x;
    let py = node.y;
    let oldPx = px;
    let oldPy = py;
    let lastEdgeDist = node.emitR;

    for (let hops = 0; hops < 18; hops += 1) {
      let found = false;
      let lowestDistSq = Number.POSITIVE_INFINITY;
      let next = null;
      let nextEdgeDist = 0;

      for (let i = 0; i < electricParticles.length; i += 1) {
        const p = electricParticles[i];
        const distSq = electricDistSq(px, py, p.x, p.y);
        if (distSq >= lowestDistSq) continue;
        if (distSq > cfg.maxBoltJumpSq || distSq < 20) continue;

        const cdx = p.x - cfg.cx;
        const cdy = p.y - cfg.cy;
        const edgeDist = Math.sqrt((cdx * cdx) + (cdy * cdy));
        if (edgeDist <= lastEdgeDist) continue;
        if (edgeDist > cfg.endR) continue;

        lowestDistSq = distSq;
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
      ctx.quadraticCurveTo(oldPx, oldPy, xc, yc);

      oldPx = px;
      oldPy = py;
    }
  }

  function drawFrame() {
    const cfg = electricConfig;
    const ctx = electricCtx;
    ctx.clearRect(0, 0, cfg.size, cfg.size);

    const ring = ctx.createRadialGradient(cfg.cx, cfg.cy, cfg.startR, cfg.cx, cfg.cy, cfg.endR);
    ring.addColorStop(0, "rgba(255, 250, 180, 0.82)");
    ring.addColorStop(0.6, "rgba(255, 235, 95, 0.55)");
    ring.addColorStop(1, "rgba(255, 220, 64, 0.12)");
    ctx.strokeStyle = ring;
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(255, 225, 90, 1)";
    ctx.shadowBlur = 30;

    ctx.beginPath();
    for (let i = 0; i < electricNodes.length; i += 1) {
      const n = electricNodes[i];
      ctx.moveTo(n.x, n.y);
      drawBolt(n);
    }
    ctx.stroke();
    ctx.closePath();

    ctx.shadowBlur = 0;
  }

  function tick(now) {
    if (!electricLastNow) electricLastNow = now;
    electricLastNow = now;

    updateNodes();
    updateParticles();
    drawFrame();

    if (now >= electricEndAt) {
      clear();
      return;
    }
    electricRAF = requestAnimationFrame(tick);
  }

  function play() {
    clear();
    if (!els.electricLayer) return;

    const cfg = apply();
    buildCanvas(cfg);
    initParticles();
    initNodes();

    els.electricLayer.appendChild(electricCanvas);
    electricEndAt = performance.now() + electricConfig.durationMs;
    electricLastNow = 0;
    electricRAF = requestAnimationFrame(tick);
  }

  function wire() {
    els.playElectric.addEventListener("click", play);
    if (els.electricMs) els.electricMs.addEventListener("input", apply);
    els.electricStartR.addEventListener("input", apply);
    els.electricEndR.addEventListener("input", apply);
    apply();
  }

  return {
    apply,
    clear,
    play,
    wire,
  };
}
