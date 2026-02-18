export function createFxSystem({ eventBus }) {
  if (!eventBus || typeof eventBus.on !== 'function' || typeof eventBus.emit !== 'function') {
    throw new Error('createFxSystem requires eventBus.on and eventBus.emit');
  }

  const unsub = [];
  const pieceTimers = new Set();
  const state = {
    visualState: 'pristine',
    crack: null,
    shatterActive: false,
    shards: [],
  };

  function rand(rng, a, b) {
    return a + (b - a) * rng();
  }

  // Mulberry32 for deterministic generation.
  function createRng(seed) {
    let t = (seed >>> 0) || 1;
    return function next() {
      t += 0x6D2B79F5;
      let x = t;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeCrackPattern(level, seed) {
    const rng = createRng(seed);
    const segCount = (level === 1) ? 3 : 5;
    const main = [];

    let r = 1.0;
    let theta = rand(rng, -Math.PI, Math.PI);
    for (let i = 0; i < segCount; i++) {
      const inward = rand(rng, level === 1 ? 0.16 : 0.12, level === 1 ? 0.24 : 0.22);
      r = Math.max(level === 1 ? 0.32 : 0.20, r - inward);
      theta += rand(rng, -Math.PI / 3.6, Math.PI / 3.6); // slightly more jagged than before
      main.push({ r, theta });
    }

    const branch = [];
    if (level >= 2) {
      const anchor = main[Math.max(1, Math.floor(main.length * 0.45))];
      let br = anchor.r;
      let bt = anchor.theta + rand(rng, -Math.PI / 6, Math.PI / 6);
      const bSeg = 3;
      for (let i = 0; i < bSeg; i++) {
        br = Math.max(0.18, br - rand(rng, 0.08, 0.16));
        bt += rand(rng, -Math.PI / 3.6, Math.PI / 3.6);
        branch.push({ r: br, theta: bt });
      }
    }

    return { seed, level, main, branch };
  }

  function clearPieceTimers() {
    for (const t of pieceTimers) clearTimeout(t);
    pieceTimers.clear();
  }

  function circlePoly(radius = 50, steps = 24) {
    const pts = [];
    for (let i = 0; i < steps; i++) {
      const t = (Math.PI * 2 * i) / steps;
      pts.push({ x: radius * Math.cos(t), y: radius * Math.sin(t) });
    }
    return pts;
  }

  function clipPolyHalfPlane(poly, a, b, c) {
    // keep points where a*x + b*y + c <= 0
    if (!poly.length) return [];
    const out = [];
    const eps = 1e-6;

    function inside(p) {
      return (a * p.x + b * p.y + c) <= eps;
    }

    function intersect(p1, p2) {
      const v1 = a * p1.x + b * p1.y + c;
      const v2 = a * p2.x + b * p2.y + c;
      const den = (v1 - v2);
      if (Math.abs(den) < 1e-9) return { x: p2.x, y: p2.y };
      const t = v1 / den;
      return {
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t,
      };
    }

    let prev = poly[poly.length - 1];
    let prevIn = inside(prev);

    for (const curr of poly) {
      const currIn = inside(curr);
      if (currIn) {
        if (!prevIn) out.push(intersect(prev, curr));
        out.push(curr);
      } else if (prevIn) {
        out.push(intersect(prev, curr));
      }
      prev = curr;
      prevIn = currIn;
    }

    return out;
  }

  function centroid(poly) {
    if (!poly.length) return { x: 0, y: 0 };
    let area2 = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      const cross = p.x * q.y - q.x * p.y;
      area2 += cross;
      cx += (p.x + q.x) * cross;
      cy += (p.y + q.y) * cross;
    }
    if (Math.abs(area2) < 1e-6) return poly[0];
    return { x: cx / (3 * area2), y: cy / (3 * area2) };
  }

  function polyArea(poly) {
    let s = 0;
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      s += (p.x * q.y - q.x * p.y);
    }
    return Math.abs(s) * 0.5;
  }

  function makeVoronoiFragments(pieceCount, seed) {
    const rng = createRng(seed);
    const bound = circlePoly(50, 28);

    const seeds = [];
    for (let i = 0; i < pieceCount; i++) {
      const r = Math.sqrt(rand(rng, 0.02, 0.95)) * 44;
      const t = rand(rng, -Math.PI, Math.PI);
      seeds.push({ x: r * Math.cos(t), y: r * Math.sin(t) });
    }

    const cells = [];
    for (let i = 0; i < seeds.length; i++) {
      const si = seeds[i];
      let poly = bound.slice();

      for (let j = 0; j < seeds.length; j++) {
        if (i === j || poly.length === 0) continue;
        const sj = seeds[j];

        // Half-plane closer to si than sj:
        // (x - si)^2 <= (x - sj)^2  -> 2*(sj-si).x * x + 2*(sj-si).y * y + (|si|^2 - |sj|^2) <= 0
        const a = 2 * (sj.x - si.x);
        const b = 2 * (sj.y - si.y);
        const c = (si.x * si.x + si.y * si.y) - (sj.x * sj.x + sj.y * sj.y);
        poly = clipPolyHalfPlane(poly, a, b, c);
      }

      if (poly.length >= 3 && polyArea(poly) > 6) {
        const center = centroid(poly);
        cells.push({ id: i, poly, center });
      }
    }

    return cells;
  }

  function startShatter(payload = {}) {
    clearPieceTimers();
    state.shatterActive = true;
    state.shards = [];

    const atMs = Number(payload.atMs) || Date.now();
    const pieceCount = Math.max(8, Math.floor(Number(payload.pieceCount) || 14));
    const seed = Number.isFinite(payload.seed) ? Number(payload.seed) : ((Math.random() * 1e9) | 0);

    const cells = makeVoronoiFragments(pieceCount, seed);
    const rng = createRng(seed ^ 0x9e3779b9);

    for (const cell of cells) {
      const dirLen = Math.hypot(cell.center.x, cell.center.y) || 1;
      const nx = cell.center.x / dirLen;
      const ny = cell.center.y / dirLen;

      const shard = {
        id: cell.id,
        points: cell.poly,
        center: cell.center,
        vx: nx * rand(rng, 120, 280) + rand(rng, -35, 35),
        vy: ny * rand(rng, 120, 260) + rand(rng, -220, -70),
        angVel: rand(rng, -9, 9),
        ttlMs: Math.floor(rand(rng, 250, 750)),
      };

      state.shards.push(shard);
      eventBus.emit('orb.shatter_piece_spawned', {
        pieceId: shard.id,
        points: shard.points,
        center: shard.center,
        vx: shard.vx,
        vy: shard.vy,
        angVel: shard.angVel,
        ttlMs: shard.ttlMs,
      });

      const to = setTimeout(() => {
        state.shards = state.shards.filter((s) => s.id !== shard.id);
        pieceTimers.delete(to);
        if (state.shards.length === 0 && state.shatterActive) {
          state.shatterActive = false;
          eventBus.emit('orb.shatter_complete', { atMs: Date.now() });
        }
      }, shard.ttlMs);
      pieceTimers.add(to);
    }
  }

  function start() {
    unsub.push(eventBus.on('orb.visual_state_changed', (payload = {}) => {
      const to = String(payload.to || 'pristine');
      state.visualState = to;
      if (to === 'crack_1') {
        state.crack = makeCrackPattern(1, Date.now() ^ 0xA11CE);
      } else if (to === 'crack_2') {
        state.crack = makeCrackPattern(2, Date.now() ^ 0xC0FFEE);
      } else {
        state.crack = null;
      }
    }));

    unsub.push(eventBus.on('orb.shatter_started', (payload = {}) => {
      state.visualState = 'shattered';
      state.crack = null;
      startShatter(payload);
    }));
  }

  function stop() {
    clearPieceTimers();
    state.shatterActive = false;
    state.shards = [];
    while (unsub.length) {
      const fn = unsub.pop();
      try { fn(); } catch (_) {}
    }
  }

  function getState() {
    return {
      visualState: state.visualState,
      crack: state.crack ? {
        seed: state.crack.seed,
        level: state.crack.level,
        main: state.crack.main.slice(),
        branch: state.crack.branch.slice(),
      } : null,
      shatterActive: state.shatterActive,
      shards: state.shards.slice(),
    };
  }

  return { start, stop, getState };
}
