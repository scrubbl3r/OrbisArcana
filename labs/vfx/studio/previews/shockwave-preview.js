import { resolveShockwaveGeometry } from "../../../../src/game-runtime/orb/orb-spell-geometry.js";

export function createShockwavePreview({ els, clamp, setVar, shockwavePresetDefault }) {
  const SHOCK = {
    endRadiusPx: Number(shockwavePresetDefault.endR) || 169,
    spawnRateMs: Number(shockwavePresetDefault.spawnMs) || 105,
    decayMs: Number(shockwavePresetDefault.decayMs) || 150,
  };

  let shockRAF = 0;
  let shockSvg = null;
  let spawnAcc = 0;
  const activeRings = [];

  function evenStroke(n, min = 2, max = 20) {
    n = Math.round(Number(n) || min);
    n = Math.max(min, Math.min(max, n));
    if (n % 2 === 1) n += 1;
    return n;
  }

  function getOrbDiameterPx() {
    const root = els && els.previewRoot;
    const cssDiameter = root
      ? Number(getComputedStyle(root).getPropertyValue("--orb-d").replace("px", ""))
      : 0;
    return Math.max(2, cssDiameter || 100);
  }

  function apply() {
    const authoredStartR = clamp(els.startR.value, 1, 1000);
    const authoredEndR = clamp(els.endR.value, 1, 1000);
    const rings = Math.round(clamp(els.rings.value, 1, 6));
    const spawnMs = Math.round(clamp(els.spawn.value, 1, 700));
    const decayMs = Math.round(clamp(els.decay.value, 40, 2000));
    const authoredStroke = evenStroke(els.stroke.value, 2, 20);
    const resolved = resolveShockwaveGeometry({
      startR: authoredStartR,
      endR: authoredEndR,
      stroke: authoredStroke,
    }, {
      orbDiameterPx: getOrbDiameterPx(),
      normalizeStroke: (value) => evenStroke(value, 2, 20),
    });

    els.stroke.value = authoredStroke;

    els.vStartR.textContent = String(Math.round(authoredStartR));
    els.vEndR.textContent = String(Math.round(authoredEndR));
    els.vRings.textContent = String(rings);
    els.vSpawn.textContent = String(spawnMs);
    els.vDecay.textContent = String(decayMs);
    els.vStroke.textContent = String(authoredStroke);

    SHOCK.endRadiusPx = resolved.endR;
    SHOCK.spawnRateMs = spawnMs;
    SHOCK.decayMs = decayMs;

    setVar("--shock-stroke", `${Number(resolved.stroke).toFixed(2)}px`);
    return {
      startR: resolved.startR,
      endR: resolved.endR,
      rings,
      spawnMs,
      decayMs,
      stroke: resolved.stroke,
    };
  }

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
    const cfg = apply();
    clear();

    shockSvg = buildShockSVG();
    els.shockLayer.appendChild(shockSvg);

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

      for (let i = activeRings.length - 1; i >= 0; i -= 1) {
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

      const allSpawned = spawned >= cfg.rings;
      const noneAlive = activeRings.length === 0;

      if (allSpawned && noneAlive) {
        clear();
        return;
      }

      shockRAF = requestAnimationFrame(tick);
    }

    shockRAF = requestAnimationFrame(tick);
  }

  function wire() {
    els.playShock.addEventListener("click", play);
    els.startR.addEventListener("input", apply);
    els.endR.addEventListener("input", apply);
    els.rings.addEventListener("input", apply);
    els.spawn.addEventListener("input", apply);
    els.stroke.addEventListener("input", apply);
    els.decay.addEventListener("input", apply);
    apply();
  }

  return {
    apply,
    clear,
    play,
    wire,
  };
}
