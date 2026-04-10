export function createFlameAoePreview({
  els,
  clamp,
  evenPx,
  setVar,
  flamePresetDefault,
}) {
  let flameRAF = 0;
  let flameSvg = null;
  let flameCore = null;
  const flameTendrils = [];
  const FLAME_SHOW_CORE = false;
  const FLAME_ANIMATE = true;

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
    for (let i = 1; i < points.length - 1; i += 1) {
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
    group.setAttribute("stroke", "var(--flame-stroke)");
    group.setAttribute("stroke-width", "2");
    group.setAttribute("stroke-linecap", "round");
    group.setAttribute("stroke-linejoin", "round");

    const core = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    core.setAttribute("cx", String(cx));
    core.setAttribute("cy", String(cy));
    core.setAttribute("r", String(radius.toFixed(2)));
    core.setAttribute("fill", "var(--flame-fill)");
    core.setAttribute("stroke", "var(--flame-stroke)");
    core.setAttribute("stroke-width", "6");
    core.setAttribute("opacity", "1");

    const tendrilCount = 28;
    for (let i = 0; i < tendrilCount; i += 1) {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const step = (Math.PI * 2) / tendrilCount;
      const ang = step * i;
      const baseLen = radius * 0.20;
      const lenJitter = radius * 0.05;
      const baseAmp = radius * 0.11;
      const ampJitter = radius * 0.03;
      const baseWidth = radius * 0.23;
      const widthJitter = radius * 0.03;
      const lenScale = (i % 2 === 0) ? 2.25 : 1.0;
      const lateralFlip = (i % 2 === 0) ? 1 : -1;
      const phase = 0;
      const phase2 = Math.PI * 0.5;
      const phase3 = Math.PI;
      const freq1 = 0.012;
      const freq2 = 0.024;
      const freq3 = 0.036;
      const sway = 0.18;
      const jag = 0.30;

      p.setAttribute("opacity", "0.95");
      group.appendChild(p);
      flameTendrils.push({
        path: p,
        ang,
        baseLen,
        lenJitter,
        baseAmp,
        ampJitter,
        baseWidth,
        widthJitter,
        lenScale,
        lateralFlip,
        phase,
        phase2,
        phase3,
        freq1,
        freq2,
        freq3,
        sway,
        jag,
      });
    }

    if (FLAME_SHOW_CORE) svg.appendChild(core);
    svg.appendChild(group);

    flameSvg = svg;
    flameCore = core;
  }

  function apply() {
    const d = evenPx(clamp(els.flameD.value, 120, 900), 2, 2000);
    const ms = Math.round(clamp(els.flameMs && els.flameMs.value, 200, 60000));
    els.flameD.value = String(d);
    if (els.flameMs) els.flameMs.value = String(ms);
    els.vFlameD.textContent = String(d);
    setVar("--flame-d", `${d}px`);
    return { diameter: d, durationMs: ms };
  }

  function play() {
    if (!els.flameLayer) return;
    clear();
    const flameCtl = apply();

    const cfg = {
      diameter: evenPx(clamp(els.flameD.value, 120, 900), 2, 2000),
      durationMs: Math.max(
        200,
        Number(flameCtl && flameCtl.durationMs) || Number(flamePresetDefault.durationMs) || 10000,
      ),
    };
    setVar("--flame-d", `${cfg.diameter}px`);
    setVar("--flame-duration", `${cfg.durationMs}ms`);
    build(cfg);
    els.flameLayer.appendChild(flameSvg);

    const start = performance.now();
    const cx = flameSvg.__cx;
    const cy = flameSvg.__cy;
    const radius = flameSvg.__r;

    function renderFrame(elapsed) {
      const t01 = Math.max(0, Math.min(1, elapsed / cfg.durationMs));
      const life = 1 - t01;
      const innerR = radius + 2;

      if (FLAME_SHOW_CORE && flameCore) {
        const coreScale = 1 + (Math.sin(elapsed * 0.0032) * 0.008);
        flameCore.setAttribute("r", (radius * coreScale).toFixed(2));
        flameCore.setAttribute("opacity", (0.92 + (Math.sin(elapsed * 0.0045) * 0.08) * life).toFixed(3));
      }

      for (let i = 0; i < flameTendrils.length; i += 1) {
        const t = flameTendrils[i];
        const motionTime = elapsed * 6;
        const dirBase = t.ang;
        const len = Math.max(16, t.baseLen * t.lenScale);
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

        for (let s = 0; s < samples; s += 1) {
          const u = s / (samples - 1);
          const along = len * u;
          const envelope = Math.sin(Math.PI * u);
          const lateral = Math.sin((u * Math.PI * 2) + wigglePhase) * amp * envelope * t.lateralFlip;
          const taper = Math.pow(1 - u, 1.85);
          const bloat = Math.sin(Math.PI * u) * (1 - (u * 0.35));
          const width = tipWidth + ((widthBase - tipWidth) * taper) + (widthBase * 0.12 * bloat);
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

    if (FLAME_ANIMATE) {
      flameRAF = requestAnimationFrame(tick);
    } else {
      renderFrame(0);
    }
  }

  function wire() {
    els.playFlame.addEventListener("click", play);
    els.flameD.addEventListener("input", apply);
    if (els.flameMs) els.flameMs.addEventListener("input", apply);
    apply();
  }

  return {
    apply,
    clear,
    play,
    wire,
  };
}
