import { createOrbShatterRuntimeController } from "../../../game-runtime/orb/orb-shatter-runtime.js";

export function createOrbStageRuntimeAdapter({ refs = {}, level = null } = {}) {
  let primaryGlobeEl = refs.testGlobe || null;
  let lastGroundTop = "";
  let lastOrbLeft = "";
  let lastOrbTransform = "";
  let lastOrbShattered = null;
  let lastOrbOpacity = null;
  let lastCrackRenderKey = "";
  let lastCrackMarkup = "";
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
    getStageRect() {
      if (!stageRefs.physStage || typeof stageRefs.physStage.getBoundingClientRect !== "function") {
        return { width: 0, height: 0 };
      }
      return stageRefs.physStage.getBoundingClientRect();
    },
    getWorldItemSpawns() {
      if (Array.isArray(level && level.elements && level.elements.worldItemSpawns)) {
        return level.elements.worldItemSpawns;
      }
      return Array.isArray(level && level.worldItemSpawns) ? level.worldItemSpawns : [];
    },
    normalizeWorldItemSpawn(
      item,
      {
        groundCenterWorld = () => 0,
        clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0)),
      } = {}
    ) {
      const kind = String(item && item.kind || "");
      if (!item || (kind !== "energy_globe" && kind !== "energy_globe_emitter")) return null;
      if (Number.isFinite(Number(item.xNorm)) && Number.isFinite(Number(item.yW))) {
        return {
          id: String(item.id || ""),
          kind,
          xNorm: clamp(Number(item.xNorm), 0, 1),
          yW: Number(item.yW) || 0,
          r: Math.max(1, Number(item.r) || 25),
          capacity: Math.max(1, Math.floor(Number(item.capacity) || 1)),
          regenTrigger: String(item.regenTrigger || (kind === "energy_globe_emitter" ? "globe_spent" : "manual")),
        };
      }
      const s = item.spawn || {};
      const xNorm = clamp(Number(s.xNorm), 0, 1);
      const r = Math.max(1, Number(s.r) || 25);
      const yMode = String(s.yMode || "absolute");
      const yValue = Number(s.yValue) || 0;
      const yW = (yMode === "ground_center_offset")
        ? (groundCenterWorld() + yValue)
        : yValue;
      return {
        id: String(item.id || ""),
        kind,
        xNorm: Number.isFinite(xNorm) ? xNorm : 0.5,
        yW,
        r,
        capacity: Math.max(1, Math.floor(Number(item.capacity) || 1)),
        regenTrigger: String(item.regenTrigger || (kind === "energy_globe_emitter" ? "globe_spent" : "manual")),
      };
    },
    pickupScreenY(
      yW,
      {
        camTop = 0,
      } = {}
    ) {
      return Number(yW || 0) - Number(camTop || 0);
    },
    getPrimaryGlobeEl() {
      return primaryGlobeEl;
    },
    setPrimaryGlobeEl(el) {
      primaryGlobeEl = el || null;
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
    applyOrbTransform({
      top = 0,
      left = "50%",
    } = {}) {
      if (!stageRefs.orbWrap) return;
      const nextLeft = (typeof left === "number")
        ? `${Number(left || 0).toFixed(2)}px`
        : String(left || "50%");
      const nextTransform = `translate(-50%, ${Number(top || 0).toFixed(2)}px)`;
      if (nextLeft !== lastOrbLeft) {
        lastOrbLeft = nextLeft;
        stageRefs.orbWrap.style.left = nextLeft;
      }
      if (nextTransform !== lastOrbTransform) {
        lastOrbTransform = nextTransform;
        stageRefs.orbWrap.style.transform = nextTransform;
      }
    },
    renderOrbDamageVisuals({
      fx = null,
    } = {}) {
      if (!stageRefs.orb || !stageRefs.orbCracks) return;
      const shattered = !!(fx && fx.visualState === "shattered");
      if (shattered !== lastOrbShattered) {
        lastOrbShattered = shattered;
        stageRefs.orb.classList.toggle("shattered", shattered);
      }
      const nextOrbOpacity = shattered ? "0" : "";
      if (nextOrbOpacity !== lastOrbOpacity) {
        lastOrbOpacity = nextOrbOpacity;
        stageRefs.orb.style.opacity = nextOrbOpacity;
      }
      const shardStyle = fx && fx.shardStyle && typeof fx.shardStyle === "object" ? fx.shardStyle : null;
      const shardRgb = shardStyle && shardStyle.strokeRgb ? shardStyle.strokeRgb : null;
      const shardStroke = shardRgb
        ? `rgb(${Math.round(Number(shardRgb.r) || 0)},${Math.round(Number(shardRgb.g) || 0)},${Math.round(Number(shardRgb.b) || 0)})`
        : "";
      const shardAlpha = shardStyle && Number.isFinite(Number(shardStyle.strokeAlpha))
        ? Math.max(0, Math.min(1, Number(shardStyle.strokeAlpha)))
        : null;
      const shardStrokeWidth = shardStyle && Number.isFinite(Number(shardStyle.strokeWidthPx))
        ? Math.max(0.25, Number(shardStyle.strokeWidthPx))
        : null;
      const crackSegments = (!shattered && Array.isArray(fx && fx.crackSegments))
        ? fx.crackSegments
        : [];
      const crackRenderKey = [
        shattered ? "1" : "0",
        String(fx && fx.visualState || ""),
        String(fx && fx.layoutSeed || ""),
        String(fx && fx.lifeId || ""),
        String(fx && fx.hitsTaken || ""),
        String(crackSegments.length || 0),
        shardStroke,
        shardAlpha != null ? shardAlpha.toFixed(3) : "",
        shardStrokeWidth != null ? shardStrokeWidth.toFixed(2) : "",
      ].join("|");
      if (crackRenderKey === lastCrackRenderKey) return;
      lastCrackRenderKey = crackRenderKey;

      const paths = [];
      if (crackSegments.length) {
        for (const seg of crackSegments) {
          const d = lineToPath(seg);
          if (d) {
            const style = [
              shardStroke ? `stroke:${shardStroke}` : "",
              shardAlpha != null ? `stroke-opacity:${shardAlpha.toFixed(3)}` : "",
              shardStrokeWidth != null ? `stroke-width:${shardStrokeWidth.toFixed(2)}px` : "",
            ].filter(Boolean).join(";");
            const attrs = [`d="${d}"`, style ? `style="${style}"` : ""].filter(Boolean).join(" ");
            paths.push(`<path ${attrs} />`);
          }
        }
      }
      const nextMarkup = paths.join("");
      if (nextMarkup !== lastCrackMarkup) {
        lastCrackMarkup = nextMarkup;
        stageRefs.orbCracks.innerHTML = nextMarkup;
      }
    },
    openDeathOverlay() {
      if (!stageRefs.deathPanel) return;
      stageRefs.deathPanel.classList.remove("off");
      stageRefs.deathPanel.setAttribute("aria-hidden", "false");
    },
    closeDeathOverlay() {
      if (!stageRefs.deathPanel) return;
      stageRefs.deathPanel.classList.add("off");
      stageRefs.deathPanel.setAttribute("aria-hidden", "true");
    },
    createOrbShatterController({
      root = stageRefs.root,
      getOrbShatterRuntime = () => null,
      getOrbColorState = () => null,
      getBaseFillAlpha = () => 0.20,
      clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0)),
      clamp01 = (n) => Math.max(0, Math.min(1, Number(n) || 0)),
    } = {}) {
      if (!stageRefs.orb || typeof createOrbShatterRuntimeController !== "function") return null;
      return createOrbShatterRuntimeController({
        root,
        getOrbEl: () => stageRefs.orb,
        getOrbShatterRuntime,
        getOrbColorState,
        getBaseFillAlpha,
        clamp,
        clamp01,
      });
    },
  });
}
