import { createOrbShatterRuntime } from "../../../../src/vfx/effects/orb-states/orb-shatter-runtime.js";

function buildShardPoints(innerR, outerR, startA, endA) {
  return [
    { x: Math.cos(startA) * innerR, y: Math.sin(startA) * innerR },
    { x: Math.cos((startA + endA) * 0.5) * outerR, y: Math.sin((startA + endA) * 0.5) * outerR },
    { x: Math.cos(endA) * innerR, y: Math.sin(endA) * innerR },
  ];
}

export function createOrbShatterPreview({ els } = {}) {
  const runtime = createOrbShatterRuntime({
    layerEl: els && els.orbShatterLayer,
  });

  const palette = Object.freeze({
    strokeRgb: "rgb(255,255,255)",
    fillRgb: "rgb(255,255,255)",
    fillAlpha: 0.20,
  });

  function clear() {
    runtime.clear();
  }

  function play() {
    runtime.clear();
    const pieceCount = 12;
    const ttlMs = 760;
    const innerR = 22;
    const outerR = 52;
    for (let i = 0; i < pieceCount; i += 1) {
      const startA = (Math.PI * 2 * i) / pieceCount;
      const endA = (Math.PI * 2 * (i + 1)) / pieceCount;
      const centerA = (startA + endA) * 0.5;
      runtime.spawnPiece({
        pieceId: `orb-shatter-${i}`,
        points: buildShardPoints(innerR, outerR, startA, endA),
        center: {
          x: Math.cos(centerA) * ((innerR + outerR) * 0.5),
          y: Math.sin(centerA) * ((innerR + outerR) * 0.5),
        },
        vx: Math.cos(centerA) * 170,
        vy: Math.sin(centerA) * 170 - 28,
        angVel: (i % 2 === 0 ? 1 : -1) * (1.2 + (i * 0.08)),
        ttlMs,
      }, palette);
    }
  }

  function wire() {
    if (els && els.playOrbShatter) {
      els.playOrbShatter.addEventListener("click", play);
    }
  }

  return {
    apply() {},
    clear,
    play,
    wire,
  };
}
