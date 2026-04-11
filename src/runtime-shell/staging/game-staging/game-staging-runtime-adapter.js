export function createGameStagingRuntimeAdapter({ refs = {}, level = null } = {}) {
  const stageRefs = Object.freeze({
    physStage: refs.physStage || null,
    stars: refs.stars || null,
    terrain: refs.terrain || null,
    groundLine: refs.groundLine || null,
    orbWrap: refs.orbWrap || null,
    orb: refs.orb || null,
    orbInterior: refs.orbInterior || null,
    orbCracks: refs.orbCracks || null,
    orbShards: refs.orbShards || null,
    testGlobe: refs.testGlobe || null,
    shield: refs.shield || null,
    shockLayer: refs.shockLayer || null,
    flameLayer: refs.flameLayer || null,
    electricLayer: refs.electricLayer || null,
    deathPanel: refs.deathPanel || null,
    tryAgainBtn: refs.tryAgainBtn || null,
    gSlider: refs.gSlider || null,
    gVal: refs.gVal || null,
    dSlider: refs.dSlider || null,
    dVal: refs.dVal || null,
  });

  function lineToPath(seg) {
    if (!seg || !seg.a || !seg.b) return "";
    return `M ${Number(seg.a.x).toFixed(2)} ${Number(seg.a.y).toFixed(2)} L ${Number(seg.b.x).toFixed(2)} ${Number(seg.b.y).toFixed(2)}`;
  }

  return Object.freeze({
    level,
    refs: stageRefs,
    getStageElements() {
      return stageRefs;
    },
    getBackdropRefs() {
      return Object.freeze({
        physStage: stageRefs.physStage,
        stars: stageRefs.stars,
        terrain: stageRefs.terrain,
        groundLine: stageRefs.groundLine,
      });
    },
    getOrbVisualRefs() {
      return Object.freeze({
        orbWrap: stageRefs.orbWrap,
        orb: stageRefs.orb,
        orbInterior: stageRefs.orbInterior,
        orbCracks: stageRefs.orbCracks,
        orbShards: stageRefs.orbShards,
        shield: stageRefs.shield,
        shockLayer: stageRefs.shockLayer,
        flameLayer: stageRefs.flameLayer,
        electricLayer: stageRefs.electricLayer,
        deathPanel: stageRefs.deathPanel,
      });
    },
    ensureBackdrop({
      runtime = null,
      rootDocument = null,
      rect = null,
      worldHeight = 5000,
      terrainProfile = [],
      clamp01 = (n) => Math.max(0, Math.min(1, Number(n) || 0)),
    } = {}) {
      const backdropRefs = {
        physStage: stageRefs.physStage,
        stars: stageRefs.stars,
        terrain: stageRefs.terrain,
      };
      if (!runtime || !backdropRefs.physStage || !backdropRefs.stars || !backdropRefs.terrain || !rootDocument || !rect) return;

      const width = Math.max(1, Math.floor(Number(rect.width) || 0));
      const height = Math.max(1, Math.floor(Number(rect.height) || 0));
      const dpr = Math.max(1, Math.min(2.5, (rootDocument.defaultView && rootDocument.defaultView.devicePixelRatio) || 1));
      const stageBackdrop = runtime.stageBackdrop || (runtime.stageBackdrop = Object.create(null));

      if (stageBackdrop.width === width && stageBackdrop.height === height && stageBackdrop.starCtx && stageBackdrop.terrainCtx) {
        return;
      }

      stageBackdrop.width = width;
      stageBackdrop.height = height;
      backdropRefs.stars.width = Math.floor(width * dpr);
      backdropRefs.stars.height = Math.floor(height * dpr);
      backdropRefs.stars.style.width = `${width}px`;
      backdropRefs.stars.style.height = `${height}px`;
      backdropRefs.terrain.width = Math.floor(width * dpr);
      backdropRefs.terrain.height = Math.floor(height * dpr);
      backdropRefs.terrain.style.width = `${width}px`;
      backdropRefs.terrain.style.height = `${height}px`;

      stageBackdrop.starCtx = backdropRefs.stars.getContext("2d", { alpha: false });
      stageBackdrop.terrainCtx = backdropRefs.terrain.getContext("2d", { alpha: true });
      if (stageBackdrop.starCtx) stageBackdrop.starCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (stageBackdrop.terrainCtx) stageBackdrop.terrainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const colorSets = [
        [255, 255, 255],
        [192, 208, 255],
        [255, 224, 164],
      ];
      stageBackdrop.layers = [
        { count: 56, rMin: 0.7, rMax: 1.3, aMin: 0.16, aMax: 0.46 },
        { count: 42, rMin: 0.8, rMax: 1.6, aMin: 0.22, aMax: 0.60 },
        { count: 24, rMin: 1.0, rMax: 2.0, aMin: 0.35, aMax: 0.82 },
      ].map((cfg, layerIndex) => ({
        cfg,
        stars: Array.from({ length: cfg.count }, (_, i) => {
          const seed = (i + 1) * (layerIndex + 3) * 97;
          return {
            x: (seed * 37) % width,
            yW: (seed * 91) % Math.max(1, Number(worldHeight) || 5000),
            r: cfg.rMin + (((seed * 17) % 100) / 100) * (cfg.rMax - cfg.rMin),
            a: cfg.aMin + (((seed * 29) % 100) / 100) * (cfg.aMax - cfg.aMin),
            rgb: colorSets[layerIndex] || colorSets[0],
          };
        }),
      }));

      stageBackdrop.mountainPoints = Array.isArray(terrainProfile) && terrainProfile.length
        ? terrainProfile.map((point = {}) => ({
            x: Math.round(clamp01(point.xNorm) * width),
            yOff: Number.isFinite(Number(point.yOff)) ? Number(point.yOff) : 60,
          }))
        : Array.from({ length: 10 }, (_, i) => {
            const t = i / 9;
            return {
              x: Math.round(t * width),
              yOff: [58, 74, 52, 96, 66, 84, 61, 98, 76, 88][i] || 60,
            };
          });
    },
    drawStars({
      runtime = null,
      camTop = 0,
    } = {}) {
      const stageBackdrop = runtime && runtime.stageBackdrop;
      if (!stageBackdrop || !stageBackdrop.starCtx) return;
      const ctx = stageBackdrop.starCtx;
      const w = stageBackdrop.width || 0;
      const h = stageBackdrop.height || 0;
      const nextCamTop = Number(camTop) || 0;
      const lastCamTop = Number(stageBackdrop.lastStarCamTop);
      if (Number.isFinite(lastCamTop) && Math.abs(nextCamTop - lastCamTop) < 2) {
        return;
      }
      stageBackdrop.lastStarCamTop = nextCamTop;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      for (const layer of stageBackdrop.layers || []) {
        for (const star of layer.stars || []) {
          const y = ((star.yW - nextCamTop) % h + h) % h;
          ctx.fillStyle = `rgba(${star.rgb[0]},${star.rgb[1]},${star.rgb[2]},${star.a})`;
          ctx.beginPath();
          ctx.arc(star.x, y, star.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const vignette = ctx.createRadialGradient(w * 0.5, h * 0.42, Math.min(w, h) * 0.10, w * 0.5, h * 0.42, Math.max(w, h) * 0.75);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
    },
    drawBackdrop({
      runtime = null,
      groundY = 0,
    } = {}) {
      const stageBackdrop = runtime && runtime.stageBackdrop;
      if (!stageBackdrop || !stageBackdrop.terrainCtx) return;
      const ctx = stageBackdrop.terrainCtx;
      const w = stageBackdrop.width || 0;
      const h = stageBackdrop.height || 0;
      const nextGroundY = Number(groundY) || 0;
      const lastGroundY = Number(stageBackdrop.lastGroundY);
      if (Number.isFinite(lastGroundY) && Math.abs(nextGroundY - lastGroundY) < 1) {
        return;
      }
      stageBackdrop.lastGroundY = nextGroundY;
      const pts = stageBackdrop.mountainPoints || [];

      ctx.clearRect(0, 0, w, h);
      if (pts.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(pts[0].x, nextGroundY - pts[0].yOff);
      for (const p of pts) ctx.lineTo(p.x, nextGroundY - p.yOff);
      ctx.lineTo(pts[pts.length - 1].x, nextGroundY);
      ctx.lineTo(pts[0].x, nextGroundY);
      ctx.closePath();
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(pts[0].x, nextGroundY - pts[0].yOff);
      for (const p of pts) ctx.lineTo(p.x, nextGroundY - p.yOff);
      ctx.strokeStyle = "rgba(132, 232, 164, 0.92)";
      ctx.lineWidth = 2;
      ctx.lineJoin = "miter";
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(132, 232, 164, 0.25)";
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    },
    applyGroundLine({
      top = 0,
    } = {}) {
      if (!stageRefs.groundLine) return;
      stageRefs.groundLine.style.top = `${Number(top || 0).toFixed(2)}px`;
    },
    applyOrbTransform({
      top = 0,
    } = {}) {
      if (!stageRefs.orbWrap) return;
      stageRefs.orbWrap.style.transform = `translate(-50%, ${Number(top || 0).toFixed(2)}px)`;
    },
    renderOrbDamageVisuals({
      fx = null,
    } = {}) {
      if (!stageRefs.orb || !stageRefs.orbCracks) return;
      const shattered = !!(fx && fx.visualState === "shattered");
      stageRefs.orb.classList.toggle("shattered", shattered);
      stageRefs.orb.style.opacity = shattered ? "0" : "";

      const paths = [];
      if (!shattered && Array.isArray(fx && fx.crackSegments)) {
        for (const seg of fx.crackSegments) {
          const d = lineToPath(seg);
          if (d) paths.push(`<path d="${d}" />`);
        }
      }
      stageRefs.orbCracks.innerHTML = paths.join("");
    },
  });
}
