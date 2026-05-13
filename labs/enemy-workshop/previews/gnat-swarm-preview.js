function createSeededRandom(seed = 1) {
  let state = Math.max(1, Math.floor(Number(seed) || 1)) % 2147483647;
  return function seededRandom() {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function createGnatMarkup(index, random) {
  const angle = random() * Math.PI * 2;
  const radius = 18 + random() * 34;
  const x = 50 + Math.cos(angle) * radius;
  const y = 50 + Math.sin(angle) * radius * 0.64;
  const scale = 0.72 + random() * 0.56;
  const duration = 2.7 + random() * 2.4;
  const delay = -random() * duration;
  const driftX = -18 + random() * 36;
  const driftY = -14 + random() * 28;
  const opacity = 0.48 + random() * 0.42;
  return `<span class="gnatPreviewDot" style="--x:${x.toFixed(2)}%;--y:${y.toFixed(2)}%;--s:${scale.toFixed(3)};--d:${duration.toFixed(3)}s;--delay:${delay.toFixed(3)}s;--dx:${driftX.toFixed(2)}px;--dy:${driftY.toFixed(2)}px;--o:${opacity.toFixed(3)}" aria-hidden="true"></span>`;
}

export function renderGnatSwarmPreview({ root, surface = null } = {}) {
  if (!root) return null;
  const defaults = surface && surface.defaults ? surface.defaults : {};
  const count = Math.max(1, Math.min(80, Math.round(Number(defaults.count) || 24)));
  const random = createSeededRandom(1309);
  root.innerHTML = `
    <div class="gnatPreviewScene">
      <div class="gnatPreviewAura" aria-hidden="true"></div>
      <div class="gnatPreviewTarget" aria-hidden="true"></div>
      ${Array.from({ length: count }, (_, index) => createGnatMarkup(index, random)).join("")}
    </div>
  `;
  return Object.freeze({
    count,
    personalitySeeds: count,
    swarmRadiusBo: Number(defaults.spawnRadiusBo) || 0,
    personalRadiusBo: Number(defaults.personalRadiusBo) || 0,
  });
}
