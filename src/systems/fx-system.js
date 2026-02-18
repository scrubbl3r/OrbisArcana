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

  // Mulberry32 for deterministic shard/crack generation.
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
    const segCount = (level === 1) ? 2 : 3;
    const main = [];
    let r = 1.0;
    let theta = rand(rng, -Math.PI, Math.PI);
    for (let i = 0; i < segCount; i++) {
      const inward = rand(rng, 0.12, level === 1 ? 0.20 : 0.28);
      r = Math.max(0.10, r - inward);
      theta += rand(rng, -Math.PI / 4, Math.PI / 4); // <= 45deg deviation
      main.push({ r, theta });
    }

    const branch = [];
    if (level >= 2) {
      const anchor = main[Math.max(0, Math.min(main.length - 1, 1))];
      let br = anchor.r;
      let bt = anchor.theta + rand(rng, -Math.PI / 6, Math.PI / 6);
      const bSeg = 2;
      for (let i = 0; i < bSeg; i++) {
        br = Math.max(0.12, br - rand(rng, 0.06, 0.12));
        bt += rand(rng, -Math.PI / 4, Math.PI / 4);
        branch.push({ r: br, theta: bt });
      }
    }

    return { seed, level, main, branch };
  }

  function clearPieceTimers() {
    for (const t of pieceTimers) clearTimeout(t);
    pieceTimers.clear();
  }

  function startShatter(payload = {}) {
    clearPieceTimers();
    state.shatterActive = true;
    state.shards = [];
    const atMs = Number(payload.atMs) || Date.now();
    const pieceCount = Math.max(1, Math.floor(Number(payload.pieceCount) || 12));
    const seed = Number.isFinite(payload.seed) ? Number(payload.seed) : ((Math.random() * 1e9) | 0);
    const rng = createRng(seed);

    for (let i = 0; i < pieceCount; i++) {
      const shard = {
        id: i,
        vx: rand(rng, -220, 220),
        vy: rand(rng, -360, -120),
        angVel: rand(rng, -8, 8),
        ttlMs: Math.floor(rand(rng, 250, 750)),
      };
      state.shards.push(shard);
      eventBus.emit('orb.shatter_piece_spawned', {
        pieceId: shard.id,
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
      } else if (to === 'pristine') {
        state.crack = null;
      } else if (to === 'shattered') {
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
