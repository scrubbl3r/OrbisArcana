import { createStageRuntimeAdapterCore } from "../stage-runtime-adapter-core.js";

export function createOrbStageRuntimeAdapter({ refs = {}, level = null } = {}) {
  let lastGroundTop = "";
  const stageRefs = Object.freeze({
    root: refs.root || null,
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
  });

  const core = createStageRuntimeAdapterCore({
    refs: stageRefs,
    level,
    getOrbWrapPosition: ({ top = 0, left = "50%" } = {}) => ({
      left: (typeof left === "number")
        ? `${Number(left || 0).toFixed(2)}px`
        : String(left || "50%"),
      transform: `translate(-50%, ${Number(top || 0).toFixed(2)}px)`,
    }),
  });

  return Object.freeze({
    ...core,
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
      lineArtShapes = [],
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
      const nextLineArtShapes = Array.isArray(lineArtShapes) ? lineArtShapes.slice() : [];
      const nextLineArtKey = nextLineArtShapes.map((shape = {}) => String(shape.id || "")).join("|");

      if (stageBackdrop.lineArtKey !== nextLineArtKey) {
        stageBackdrop.lineArtShapes = nextLineArtShapes;
        stageBackdrop.lineArtKey = nextLineArtKey;
        stageBackdrop.lastGroundY = NaN;
      }

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

      const starTileCanvas = rootDocument.createElement("canvas");
      starTileCanvas.width = Math.floor(width * dpr);
      starTileCanvas.height = Math.floor(height * dpr);
      const starTileCtx = starTileCanvas.getContext("2d", { alpha: false });
      if (starTileCtx) {
        starTileCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        starTileCtx.fillStyle = "#000";
        starTileCtx.fillRect(0, 0, width, height);
        for (const layer of stageBackdrop.layers || []) {
          for (const star of layer.stars || []) {
            const tileY = ((Number(star.yW) || 0) % height + height) % height;
            starTileCtx.fillStyle = `rgba(${star.rgb[0]},${star.rgb[1]},${star.rgb[2]},${star.a})`;
            starTileCtx.beginPath();
            starTileCtx.arc(star.x, tileY, star.r, 0, Math.PI * 2);
            starTileCtx.fill();
          }
        }
      }
      stageBackdrop.starTileCanvas = starTileCanvas;

      const vignetteCanvas = rootDocument.createElement("canvas");
      vignetteCanvas.width = Math.floor(width * dpr);
      vignetteCanvas.height = Math.floor(height * dpr);
      const vignetteCtx = vignetteCanvas.getContext("2d", { alpha: true });
      if (vignetteCtx) {
        vignetteCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const vignette = vignetteCtx.createRadialGradient(
          width * 0.5,
          height * 0.42,
          Math.min(width, height) * 0.10,
          width * 0.5,
          height * 0.42,
          Math.max(width, height) * 0.75
        );
        vignette.addColorStop(0, "rgba(0,0,0,0)");
        vignette.addColorStop(1, "rgba(0,0,0,0.55)");
        vignetteCtx.fillStyle = vignette;
        vignetteCtx.fillRect(0, 0, width, height);
      }
      stageBackdrop.vignetteCanvas = vignetteCanvas;
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
      if (typeof Path2D === "function" && stageBackdrop.mountainPoints.length >= 2) {
        const fillPath = new Path2D();
        const strokePath = new Path2D();
        const pts = stageBackdrop.mountainPoints;
        fillPath.moveTo(pts[0].x, -pts[0].yOff);
        strokePath.moveTo(pts[0].x, -pts[0].yOff);
        for (const p of pts) {
          fillPath.lineTo(p.x, -p.yOff);
          strokePath.lineTo(p.x, -p.yOff);
        }
        fillPath.lineTo(pts[pts.length - 1].x, 0);
        fillPath.lineTo(pts[0].x, 0);
        fillPath.closePath();
        stageBackdrop.mountainFillPath = fillPath;
        stageBackdrop.mountainStrokePath = strokePath;
      } else {
        stageBackdrop.mountainFillPath = null;
        stageBackdrop.mountainStrokePath = null;
      }
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
      const offsetY = ((-nextCamTop % h) + h) % h;
      if (stageBackdrop.starTileCanvas) {
        ctx.drawImage(stageBackdrop.starTileCanvas, 0, offsetY - h, w, h);
        ctx.drawImage(stageBackdrop.starTileCanvas, 0, offsetY, w, h);
      } else {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, h);
      }
      if (stageBackdrop.vignetteCanvas) {
        ctx.drawImage(stageBackdrop.vignetteCanvas, 0, 0, w, h);
      }
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
      const lineArtShapes = Array.isArray(stageBackdrop.lineArtShapes) ? stageBackdrop.lineArtShapes : [];
      if (lineArtShapes.length) {
        const frame = runtime && runtime.frameMetrics ? runtime.frameMetrics : null;
        const camLeft = Number(frame && frame.camLeft) || 0;
        const camTop = Number(frame && frame.camTop) || 0;
        const zoom = Number(frame && frame.zoom) || 1;
        for (const shape of lineArtShapes) {
          const worldPoints = Array.isArray(shape && shape.worldPoints) ? shape.worldPoints : [];
          if (worldPoints.length < 2) continue;
          ctx.beginPath();
          for (let i = 0; i < worldPoints.length; i += 1) {
            const point = worldPoints[i] || {};
            const x = (Number(point.xW) - camLeft) * zoom;
            const y = (Number(point.yW) - camTop) * zoom;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          const fill = String(shape && shape.fill || "none").trim().toLowerCase();
          const fillOpacity = Number(shape && shape.fillOpacity);
          if (fill && fill !== "none" && fillOpacity > 0) {
            ctx.globalAlpha = Math.max(0, Math.min(1, fillOpacity));
            ctx.fillStyle = String(shape.fill);
            ctx.fill();
          }
          const stroke = String(shape && shape.stroke || "none").trim().toLowerCase();
          const strokeOpacity = Number(shape && shape.strokeOpacity);
          if (stroke && stroke !== "none" && strokeOpacity > 0) {
            ctx.globalAlpha = Math.max(0, Math.min(1, strokeOpacity));
            ctx.strokeStyle = String(shape.stroke);
            ctx.lineWidth = Math.max(1, (Number(shape && shape.worldStrokeWidth) || 1) * zoom);
            ctx.lineJoin = "miter";
            ctx.lineCap = "round";
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
        return;
      }
      if (pts.length < 2) return;

      ctx.save();
      ctx.translate(0, nextGroundY);
      ctx.strokeStyle = "rgba(132, 232, 164, 0.92)";
      ctx.lineWidth = 2;
      ctx.lineJoin = "miter";
      ctx.lineCap = "round";
      if (stageBackdrop.mountainFillPath && stageBackdrop.mountainStrokePath) {
        ctx.fillStyle = "rgba(0,0,0,1)";
        ctx.fill(stageBackdrop.mountainFillPath);
        ctx.stroke(stageBackdrop.mountainStrokePath);
      } else {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, -pts[0].yOff);
        for (const p of pts) ctx.lineTo(p.x, -p.yOff);
        ctx.lineTo(pts[pts.length - 1].x, 0);
        ctx.lineTo(pts[0].x, 0);
        ctx.closePath();
        ctx.fillStyle = "rgba(0,0,0,1)";
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(pts[0].x, -pts[0].yOff);
        for (const p of pts) ctx.lineTo(p.x, -p.yOff);
        ctx.stroke();
      }
      ctx.restore();
    },
    applyGroundLine({
      top = 0,
    } = {}) {
      if (!stageRefs.groundLine) return;
      const nextTop = `${Number(top || 0).toFixed(2)}px`;
      if (nextTop === lastGroundTop) return;
      lastGroundTop = nextTop;
      stageRefs.groundLine.style.top = nextTop;
    },
  });
}
